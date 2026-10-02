from app.core.security import hash_password
from app.modules.auth.models import User, UserRole
from app.modules.employees.models import Employee
from app.modules.requirements.job_models import RequirementMember


def _login(client, email: str, subdomain: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "SuperSecret123!"},
        headers={"X-Tenant-Subdomain": subdomain},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def _make_employee(db_session, seed_roles, tenant, email: str, role: str, code: str):
    user = User(
        email=email,
        password_hash=hash_password("SuperSecret123!"),
        first_name=role.title(),
        last_name=code,
        is_active=True,
        tenant_id=tenant.id,
    )
    db_session.add(user)
    db_session.flush()
    db_session.add(UserRole(user_id=user.id, role_id=seed_roles["EMPLOYEE"].id))
    employee = Employee(
        tenant_id=tenant.id,
        user_id=user.id,
        employee_code=code,
        role=role,
        status="ACTIVE",
        permissions=[
            {
                "module": "requirements",
                "sub_module": "requirements",
                "actions": ["CREATE", "READ", "UPDATE"],
            },
            {
                "module": "requirements",
                "sub_module": "submissions",
                "actions": ["CREATE", "READ", "UPDATE"],
            },
        ],
    )
    db_session.add(employee)
    db_session.commit()
    return user


def _client_payload() -> dict:
    return {
        "company_name": "ABC Technologies",
        "company_type": "PRIVATE_LIMITED",
        "contact_person_name": "Rahul Sharma",
        "contact_person_email": "rahul@abc.com",
        "status": "ACTIVE",
    }


def _job_payload(client_id: str, recruiter_id: str, team_lead_id: str) -> dict:
    return {
        "client_id": client_id,
        "job_title": "Java Full Stack Developer",
        "job_type": "Permanent",
        "employment_type": "FULL_TIME",
        "experience_min": 2,
        "experience_max": 5,
        "skills": ["Java", "Spring Boot", "React", "MySQL"],
        "positions": 3,
        "location": "Hyderabad",
        "work_mode": "HYBRID",
        "salary_range": "6-10 LPA",
        "priority": "HIGH",
        "assigned_recruiters": [recruiter_id],
        "assigned_team_leads": [team_lead_id],
        "description": "Build and maintain client applications.",
    }


def test_bdm_can_create_job_and_creator_is_taken_from_auth(
    client, make_tenant, db_session, seed_roles
) -> None:
    tenant, admin = make_tenant(enabled_modules=["requirements"])
    bdm = _make_employee(db_session, seed_roles, tenant, "bdm@acme.com", "BDM", "ACM-001")
    recruiter = _make_employee(
        db_session, seed_roles, tenant, "recruiter@acme.com", "RECRUITER", "ACM-002"
    )
    team_lead = _make_employee(
        db_session, seed_roles, tenant, "lead@acme.com", "TEAMLEAD", "ACM-003"
    )
    admin_token = _login(client, admin.email, tenant.subdomain)
    client_record = client.post(
        "/api/v1/clients",
        json=_client_payload(),
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()
    bdm_token = _login(client, bdm.email, tenant.subdomain)

    response = client.post(
        "/api/v1/requirements",
        json={
            **_job_payload(client_record["id"], recruiter.id, team_lead.id),
            "assigned_team_leads": [],
        },
        headers={"Authorization": f"Bearer {bdm_token}"},
    )

    assert response.status_code == 201, response.text
    body = response.json()
    assert len(body["id"]) == 26
    assert body["job_code"].startswith("JOB-")
    assert body["job_code"].endswith("-001")
    assert body["created_by"] == bdm.id
    assert body["assigned_recruiters"][0]["id"] == recruiter.id
    assert body["assigned_team_leads"] == []


def test_recruiter_only_lists_assigned_jobs(client, make_tenant, db_session, seed_roles) -> None:
    tenant, admin = make_tenant(enabled_modules=["requirements"])
    recruiter = _make_employee(
        db_session, seed_roles, tenant, "recruiter@acme.com", "RECRUITER", "ACM-001"
    )
    other_recruiter = _make_employee(
        db_session, seed_roles, tenant, "other@acme.com", "RECRUITER", "ACM-002"
    )
    team_lead = _make_employee(
        db_session, seed_roles, tenant, "lead@acme.com", "TEAMLEAD", "ACM-003"
    )
    admin_token = _login(client, admin.email, tenant.subdomain)
    headers = {"Authorization": f"Bearer {admin_token}"}
    client_record = client.post("/api/v1/clients", json=_client_payload(), headers=headers).json()
    first = client.post(
        "/api/v1/requirements",
        json=_job_payload(client_record["id"], recruiter.id, team_lead.id),
        headers=headers,
    )
    assert first.status_code == 201, first.text
    second_payload = _job_payload(client_record["id"], other_recruiter.id, team_lead.id)
    second_payload["job_title"] = "DevOps Engineer"
    second = client.post("/api/v1/requirements", json=second_payload, headers=headers)
    assert second.status_code == 201, second.text

    recruiter_token = _login(client, recruiter.email, tenant.subdomain)
    listed = client.get(
        "/api/v1/requirements",
        headers={"Authorization": f"Bearer {recruiter_token}"},
    )

    assert listed.status_code == 200, listed.text
    assert listed.json()["meta"]["total_items"] == 1
    assert listed.json()["items"][0]["job_title"] == "Java Full Stack Developer"


def test_assigned_user_can_submit_candidate_with_authenticated_audit(
    client, make_tenant, db_session, seed_roles
) -> None:
    tenant, admin = make_tenant(enabled_modules=["requirements"])
    recruiter = _make_employee(
        db_session, seed_roles, tenant, "recruiter@acme.com", "RECRUITER", "ACM-001"
    )
    unrelated = _make_employee(
        db_session, seed_roles, tenant, "other@acme.com", "RECRUITER", "ACM-002"
    )
    team_lead = _make_employee(
        db_session, seed_roles, tenant, "lead@acme.com", "TEAMLEAD", "ACM-003"
    )
    admin_token = _login(client, admin.email, tenant.subdomain)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    client_record = client.post(
        "/api/v1/clients", json=_client_payload(), headers=admin_headers
    ).json()
    job = client.post(
        "/api/v1/requirements",
        json=_job_payload(client_record["id"], recruiter.id, team_lead.id),
        headers=admin_headers,
    ).json()

    recruiter_token = _login(client, recruiter.email, tenant.subdomain)
    recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}
    candidate_response = client.post(
        "/api/v1/candidates",
        json={
            "first_name": "Rahul",
            "last_name": "Kumar",
            "email": "rahul@example.com",
            "phone": "+919876543210",
            "current_location": "Hyderabad",
            "total_experience": 4.5,
            "employment_history": [],
        },
        headers=recruiter_headers,
    )
    assert candidate_response.status_code == 201, candidate_response.text
    candidate = candidate_response.json()

    response = client.post(
        f"/api/v1/requirements/{job['id']}/submissions",
        json={
            "candidate_id": candidate["id"],
            "relevant_experience": 3.5,
            "current_ctc": 8.5,
            "expected_ctc": 11,
            "ctc_currency": "INR",
            "ctc_period": "ANNUAL",
            "notice_period_days": 30,
            "notes": "Strong Java profile",
            "submitted_by": unrelated.id,
        },
        headers=recruiter_headers,
    )

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["submission_code"].startswith("SUB-")
    assert body["submitted_by"] == recruiter.id
    assert body["submitter_role_snapshot"] == "RECRUITER"
    assert body["candidate"]["name"] == "Rahul Kumar"
    assert body["status"] == "SUBMITTED"
    assert body["status_history"][0]["to_status"] == "SUBMITTED"

    duplicate = client.post(
        f"/api/v1/requirements/{job['id']}/submissions",
        json={
            "candidate_id": candidate["id"],
            "relevant_experience": 3.5,
            "notice_period_days": 30,
        },
        headers=recruiter_headers,
    )
    assert duplicate.status_code == 409

    unrelated_token = _login(client, unrelated.email, tenant.subdomain)
    inaccessible = client.post(
        f"/api/v1/requirements/{job['id']}/submissions",
        json={
            "candidate_id": candidate["id"],
            "relevant_experience": 3.5,
            "notice_period_days": 30,
        },
        headers={"Authorization": f"Bearer {unrelated_token}"},
    )
    assert inaccessible.status_code == 404


def test_future_role_can_submit_when_added_as_job_member(
    client, make_tenant, db_session, seed_roles
) -> None:
    tenant, admin = make_tenant(enabled_modules=["requirements"])
    recruiter = _make_employee(
        db_session, seed_roles, tenant, "recruiter@acme.com", "RECRUITER", "ACM-001"
    )
    team_lead = _make_employee(
        db_session, seed_roles, tenant, "lead@acme.com", "TEAMLEAD", "ACM-002"
    )
    sourcer = _make_employee(
        db_session, seed_roles, tenant, "sourcer@acme.com", "SOURCER", "ACM-003"
    )
    admin_token = _login(client, admin.email, tenant.subdomain)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    client_record = client.post(
        "/api/v1/clients", json=_client_payload(), headers=admin_headers
    ).json()
    job = client.post(
        "/api/v1/requirements",
        json=_job_payload(client_record["id"], recruiter.id, team_lead.id),
        headers=admin_headers,
    ).json()
    db_session.add(
        RequirementMember(
            requirement_id=job["id"],
            user_id=sourcer.id,
            assignment_type="SOURCER",
            assigned_by=admin.id,
        )
    )
    db_session.commit()

    token = _login(client, sourcer.email, tenant.subdomain)
    headers = {"Authorization": f"Bearer {token}"}
    candidate = client.post(
        "/api/v1/candidates",
        json={
            "first_name": "Future",
            "last_name": "Role",
            "email": "future.role@example.com",
            "phone": "+919999999999",
            "total_experience": 2,
        },
        headers=headers,
    ).json()
    response = client.post(
        f"/api/v1/requirements/{job['id']}/submissions",
        json={
            "candidate_id": candidate["id"],
            "relevant_experience": 2,
            "notice_period_days": 15,
        },
        headers=headers,
    )

    assert response.status_code == 201, response.text
    assert response.json()["submitted_by"] == sourcer.id
    assert response.json()["submitter_role_snapshot"] == "SOURCER"
