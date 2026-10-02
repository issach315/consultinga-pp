from app.modules.employees.schemas import EmployeeCreateRequest, EmployeePermissionIn
from app.modules.employees.service import EmployeeService


def _login(client, email: str, password: str, subdomain: str) -> str:
    # Tenant-scoped users (tenant admins, employees) can only log in on
    # their own tenant's subdomain — see AuthService._enforce_tenant_scope.
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
        headers={"X-Tenant-Subdomain": subdomain},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def test_create_employee_returns_201_with_generated_code(client, make_tenant) -> None:
    tenant, _ = make_tenant(
        admin_email="admin@acme.com",
        employee_id_prefix="ACM",
        enabled_modules=["recruitment"],
    )
    token = _login(client, "admin@acme.com", "SuperSecret123!", tenant.subdomain)

    response = client.post(
        f"/api/v1/tenants/{tenant.id}/employees",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "work_email": "jane.doe@example.com",
            "role": "RECRUITER",
            "permissions": [{"module": "recruitment", "actions": ["CREATE", "READ"]}],
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["employee_code"] == "ACM-EMP-00001"
    assert body["status"] == "INVITED"


def test_create_employee_forbidden_for_a_different_tenant(client, make_tenant) -> None:
    _, _ = make_tenant(
        subdomain="acme",
        tenant_code="ACME001",
        admin_email="admin@acme.com",
        employee_id_prefix="ACM",
    )
    other_tenant, _ = make_tenant(
        subdomain="globex",
        tenant_code="GLOBEX001",
        admin_email="admin@globex.com",
        employee_id_prefix="GLX",
    )
    token = _login(client, "admin@acme.com", "SuperSecret123!", "acme")

    response = client.post(
        f"/api/v1/tenants/{other_tenant.id}/employees",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "work_email": "jane.doe@example.com",
            "role": "RECRUITER",
            "permissions": [],
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_list_employees_returns_created_employee(client, make_tenant, db_session) -> None:
    tenant, _ = make_tenant(
        admin_email="admin@acme.com", employee_id_prefix="ACM", enabled_modules=["recruitment"]
    )
    EmployeeService(db_session).onboard_employee(
        tenant.id,
        EmployeeCreateRequest(
            first_name="Jane",
            last_name="Doe",
            work_email="jane.doe@example.com",
            role="RECRUITER",
            permissions=[EmployeePermissionIn(module="recruitment", actions=["READ"])],
        ),
    )
    token = _login(client, "admin@acme.com", "SuperSecret123!", tenant.subdomain)

    response = client.get(
        f"/api/v1/tenants/{tenant.id}/employees", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["meta"]["total_items"] == 1
    assert body["items"][0]["email"] == "jane.doe@example.com"


def test_invite_accept_and_login_round_trip(client, make_tenant, db_session) -> None:
    tenant, _ = make_tenant(
        admin_email="admin@acme.com", employee_id_prefix="ACM", enabled_modules=["recruitment"]
    )
    employee, raw_token = EmployeeService(db_session).onboard_employee(
        tenant.id,
        EmployeeCreateRequest(
            first_name="Jane",
            last_name="Doe",
            work_email="jane.doe@example.com",
            role="RECRUITER",
            permissions=[EmployeePermissionIn(module="recruitment", actions=["READ"])],
        ),
    )

    detail = client.get(f"/api/v1/invitations/{raw_token}")
    assert detail.status_code == 200
    assert detail.json()["role_name"] == "Employee"
    assert detail.json()["first_name"] == "Jane"

    accept = client.post(
        f"/api/v1/invitations/{raw_token}/accept", json={"password": "BrandNewPass123!"}
    )
    assert accept.status_code == 200, accept.text
    login_body = accept.json()
    assert login_body["user"]["email"] == "jane.doe@example.com"
    assert {role["code"] for role in login_body["user"]["roles"]} == {"EMPLOYEE"}
    assert login_body["access_token"]

    # The set password now works for a normal login too.
    relogin = client.post(
        "/api/v1/auth/login", json={"email": "jane.doe@example.com", "password": "BrandNewPass123!"}
    )
    # Tenant-scoped users can't log in on the root domain without a subdomain
    # signal — this mirrors the tenant-admin login behavior, not a bug in
    # the employee flow itself.
    assert relogin.status_code == 401

    relogin_with_subdomain = client.post(
        "/api/v1/auth/login",
        json={"email": "jane.doe@example.com", "password": "BrandNewPass123!"},
        headers={"X-Tenant-Subdomain": tenant.subdomain},
    )
    assert relogin_with_subdomain.status_code == 200
    assert employee.employee_code == "ACM-EMP-00001"

    # Accepting the invitation flips the employee record from Invited to Active.
    admin_token = _login(client, "admin@acme.com", "SuperSecret123!", tenant.subdomain)
    detail_after_accept = client.get(
        f"/api/v1/tenants/{tenant.id}/employees/{employee.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert detail_after_accept.status_code == 200
    assert detail_after_accept.json()["status"] == "ACTIVE"


def test_resend_invitation_endpoint_issues_new_token(client, make_tenant, db_session) -> None:
    tenant, _ = make_tenant(
        admin_email="admin@acme.com", employee_id_prefix="ACM", enabled_modules=["recruitment"]
    )
    employee, old_token = EmployeeService(db_session).onboard_employee(
        tenant.id,
        EmployeeCreateRequest(
            first_name="Jane",
            last_name="Doe",
            work_email="jane.doe@example.com",
            role="RECRUITER",
            permissions=[],
        ),
    )
    admin_token = _login(client, "admin@acme.com", "SuperSecret123!", tenant.subdomain)

    old_detail_before = client.get(f"/api/v1/invitations/{old_token}")
    assert old_detail_before.status_code == 200

    resend = client.post(
        f"/api/v1/tenants/{tenant.id}/employees/{employee.id}/invitation",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resend.status_code == 200, resend.text

    old_detail_after = client.get(f"/api/v1/invitations/{old_token}")
    assert old_detail_after.status_code == 400


def test_bulk_create_employees_endpoint_partial_success(client, make_tenant) -> None:
    tenant, _ = make_tenant(
        admin_email="admin@acme.com", employee_id_prefix="ACM", enabled_modules=["recruitment"]
    )
    token = _login(client, "admin@acme.com", "SuperSecret123!", tenant.subdomain)

    response = client.post(
        f"/api/v1/tenants/{tenant.id}/employees/bulk",
        json={
            "employees": [
                {
                    "first_name": "Jane",
                    "last_name": "Doe",
                    "work_email": "jane.doe@example.com",
                    "role": "RECRUITER",
                    "permissions": [],
                },
                {
                    "first_name": "Bad",
                    "last_name": "Role",
                    "work_email": "bad.role@example.com",
                    "role": "NOT_A_REAL_ROLE",
                    "permissions": [],
                },
            ]
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["created_count"] == 1
    assert body["failed_count"] == 1
    assert body["results"][0]["status"] == "created"
    assert body["results"][1]["status"] == "failed"

    listed = client.get(
        f"/api/v1/tenants/{tenant.id}/employees", headers={"Authorization": f"Bearer {token}"}
    )
    assert listed.json()["meta"]["total_items"] == 1


def test_employee_summary_endpoint_returns_counts(client, make_tenant, db_session) -> None:
    tenant, _ = make_tenant(
        admin_email="admin@acme.com", employee_id_prefix="ACM", enabled_modules=["recruitment"]
    )
    EmployeeService(db_session).onboard_employee(
        tenant.id,
        EmployeeCreateRequest(
            first_name="Jane",
            last_name="Doe",
            work_email="jane.doe@example.com",
            role="RECRUITER",
            permissions=[EmployeePermissionIn(module="recruitment", actions=["READ"])],
        ),
    )
    token = _login(client, "admin@acme.com", "SuperSecret123!", tenant.subdomain)

    response = client.get(
        f"/api/v1/tenants/{tenant.id}/employees/summary",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["invited"] == 1
    assert body["active"] == 0
