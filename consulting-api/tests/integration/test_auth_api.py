def test_login_returns_token_pair_and_user_with_roles(client, make_user) -> None:
    make_user(
        email="admin@consulting.com",
        password="SuperSecret123!",
        role_codes=["SUPER_ADMIN", "TENANT_ADMIN"],
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@consulting.com", "password": "SuperSecret123!"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == 900
    assert body["refresh_expires_in"] == 604800
    role_codes = {role["code"] for role in body["user"]["roles"]}
    assert role_codes == {"SUPER_ADMIN", "TENANT_ADMIN"}


def test_login_with_wrong_password_returns_401_with_generic_error(client, make_user) -> None:
    make_user(email="admin@consulting.com", password="SuperSecret123!")

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@consulting.com", "password": "wrong-password"},
    )

    assert response.status_code == 401
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "INVALID_CREDENTIALS"


def test_login_with_unknown_email_returns_same_generic_error(client, seed_roles) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@consulting.com", "password": "whatever"},
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_me_requires_authorization_header(client) -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user_for_valid_access_token(client, make_user) -> None:
    make_user(email="admin@consulting.com", password="SuperSecret123!")
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@consulting.com", "password": "SuperSecret123!"},
    ).json()

    response = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {login['access_token']}"}
    )

    assert response.status_code == 200
    assert response.json()["email"] == "admin@consulting.com"


def test_refresh_rotates_tokens(client, make_user) -> None:
    make_user(email="admin@consulting.com", password="SuperSecret123!")
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@consulting.com", "password": "SuperSecret123!"},
    ).json()

    response = client.post("/api/v1/auth/refresh", json={"refresh_token": login["refresh_token"]})

    assert response.status_code == 200
    body = response.json()
    assert body["refresh_token"] != login["refresh_token"]
    assert body["access_token"] != login["access_token"]


def test_refresh_rejects_already_used_token(client, make_user) -> None:
    make_user(email="admin@consulting.com", password="SuperSecret123!")
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@consulting.com", "password": "SuperSecret123!"},
    ).json()

    client.post("/api/v1/auth/refresh", json={"refresh_token": login["refresh_token"]})
    replay = client.post("/api/v1/auth/refresh", json={"refresh_token": login["refresh_token"]})

    assert replay.status_code == 401
    assert replay.json()["error"]["code"] == "INVALID_REFRESH_TOKEN"


def test_refresh_rejects_access_token_used_as_refresh_token(client, make_user) -> None:
    make_user(email="admin@consulting.com", password="SuperSecret123!")
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@consulting.com", "password": "SuperSecret123!"},
    ).json()

    response = client.post("/api/v1/auth/refresh", json={"refresh_token": login["access_token"]})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_REFRESH_TOKEN"


def test_logout_revokes_refresh_token(client, make_user) -> None:
    make_user(email="admin@consulting.com", password="SuperSecret123!")
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@consulting.com", "password": "SuperSecret123!"},
    ).json()

    logout = client.post("/api/v1/auth/logout", json={"refresh_token": login["refresh_token"]})
    assert logout.status_code == 200
    assert logout.json()["message"] == "Successfully logged out"

    replay = client.post("/api/v1/auth/refresh", json={"refresh_token": login["refresh_token"]})
    assert replay.status_code == 401


def test_health_check_is_ok(client) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
