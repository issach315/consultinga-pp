from sqlalchemy import select

from app.modules.requirements.models import Client


def _login(client, email: str, password: str, subdomain: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
        headers={"X-Tenant-Subdomain": subdomain},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def _payload(company_name: str = "ABC Technologies Pvt Ltd") -> dict:
    return {
        "company_name": company_name,
        "company_type": "PRIVATE_LIMITED",
        "industry": "Information Technology",
        "contact_person_name": "Rahul Sharma",
        "contact_person_email": "rahul@abctech.com",
        "contact_person_phone": "+91 98765 43210",
        "designation": "HR Manager",
        "website": "https://www.abctech.com",
        "address": "Hitech City",
        "city": "Hyderabad",
        "state": "Telangana",
        "country": "India",
        "postal_code": "500081",
        "status": "ACTIVE",
        "notes": "Looking for Java and DevOps resources",
    }


def test_tenant_admin_can_onboard_and_list_client(client, make_tenant) -> None:
    tenant, admin = make_tenant(enabled_modules=["requirements"])
    token = _login(client, admin.email, "SuperSecret123!", tenant.subdomain)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post("/api/v1/clients", json=_payload(), headers=headers)

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["tenant_id"] == tenant.id
    assert body["client_code"].startswith("CLI-")
    assert body["client_code"].endswith("-001")
    assert body["company_name"] == "ABC Technologies Pvt Ltd"
    assert body["created_by"] == admin.id
    assert body["onboarded_by"]["name"] == "Tenant Admin"
    assert body["deleted_at"] is None
    assert body["created_at"]

    listed = client.get("/api/v1/clients", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["meta"]["total_items"] == 1
    assert listed.json()["items"][0]["id"] == body["id"]


def test_client_endpoints_require_enabled_requirements_module(client, make_tenant) -> None:
    tenant, admin = make_tenant(enabled_modules=[])
    token = _login(client, admin.email, "SuperSecret123!", tenant.subdomain)

    response = client.post(
        "/api/v1/clients",
        json=_payload(),
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "MODULE_DISABLED"


def test_delete_client_is_soft_delete(client, make_tenant, db_session) -> None:
    tenant, admin = make_tenant(enabled_modules=["requirements"])
    token = _login(client, admin.email, "SuperSecret123!", tenant.subdomain)
    headers = {"Authorization": f"Bearer {token}"}
    created = client.post("/api/v1/clients", json=_payload(), headers=headers).json()

    response = client.delete(f"/api/v1/clients/{created['id']}", headers=headers)

    assert response.status_code == 204
    assert client.get("/api/v1/clients", headers=headers).json()["meta"]["total_items"] == 0
    deleted = db_session.execute(select(Client).where(Client.id == created["id"])).scalar_one()
    assert deleted.deleted_at is not None
    assert deleted.deleted_by == admin.id
