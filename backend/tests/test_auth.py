import pytest
from fastapi import status


def test_root_and_health_endpoints(client):
    """Test public health check and API entry point."""
    res_root = client.get("/")
    assert res_root.status_code == status.HTTP_200_OK
    assert "Welcome" in res_root.json()["message"]

    res_health = client.get("/health")
    assert res_health.status_code == status.HTTP_200_OK
    assert res_health.json()["status"] == "healthy"


def test_student_signup_success(client):
    """Test successful student account registration."""
    payload = {
        "name": "Sinchana Gowda",
        "email": "sinchana@student.pgcet.in",
        "password": "SecurePassword123!",
        "role": "student"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["email"] == payload["email"]
    assert data["role"] == "student"
    assert "id" in data
    assert "password_hash" not in data  # Sensitive data never returned


def test_admin_signup_success(client):
    """Test successful administrator account registration."""
    payload = {
        "name": "Admin Officer",
        "email": "admin@pgcet.karnataka.gov.in",
        "password": "AdminMasterPass2026!",
        "role": "admin"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["role"] == "admin"


def test_signup_duplicate_email_error(client):
    """Test that registering an existing email returns 400 Bad Request."""
    payload = {
        "name": "Original User",
        "email": "duplicate@test.com",
        "password": "Password123!",
        "role": "student"
    }
    # First registration
    client.post("/api/auth/signup", json=payload)

    # Second registration with the same email
    dup_res = client.post("/api/auth/signup", json=payload)
    assert dup_res.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in dup_res.json()["detail"].lower()


def test_login_success(client):
    """Test logging in returns a valid JWT Bearer token and user details."""
    signup_payload = {
        "name": "Login Tester",
        "email": "logintester@example.com",
        "password": "SecretPassword789!",
        "role": "student"
    }
    client.post("/api/auth/signup", json=signup_payload)

    login_payload = {
        "email": "logintester@example.com",
        "password": "SecretPassword789!"
    }
    res = client.post("/api/auth/login", json=login_payload)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "logintester@example.com"


def test_login_invalid_password(client):
    """Test login with wrong password returns 401 Unauthorized."""
    signup_payload = {
        "name": "Wrong Password Tester",
        "email": "wrongpw@example.com",
        "password": "CorrectPassword123!",
        "role": "student"
    }
    client.post("/api/auth/signup", json=signup_payload)

    login_payload = {
        "email": "wrongpw@example.com",
        "password": "TotallyWrongPassword!"
    }
    res = client.post("/api/auth/login", json=login_payload)
    assert res.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Invalid email or password" in res.json()["detail"]


def test_login_nonexistent_email(client):
    """Test login with an unregistered email returns 401 Unauthorized."""
    login_payload = {
        "email": "notregistered@example.com",
        "password": "SomePassword123!"
    }
    res = client.post("/api/auth/login", json=login_payload)
    assert res.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_current_user_profile(client):
    """Test retrieving authenticated user profile using Bearer token."""
    # Signup and login
    signup_payload = {
        "name": "Profile Aspirant",
        "email": "aspirant@domain.com",
        "password": "Password123!",
        "role": "student"
    }
    client.post("/api/auth/signup", json=signup_payload)

    login_res = client.post("/api/auth/login", json={
        "email": "aspirant@domain.com",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]

    # Call /api/auth/me with Bearer token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == status.HTTP_200_OK
    user_info = me_res.json()
    assert user_info["email"] == "aspirant@domain.com"
    assert user_info["name"] == "Profile Aspirant"
    assert user_info["role"] == "student"


def test_rbac_admin_route_forbidden_for_student(client):
    """Verify that a student is rejected (403 Forbidden) from admin-only routes."""
    # Register student
    client.post("/api/auth/signup", json={
        "name": "Student A",
        "email": "student_a@test.com",
        "password": "Password123!",
        "role": "student"
    })
    token = client.post("/api/auth/login", json={
        "email": "student_a@test.com",
        "password": "Password123!"
    }).json()["access_token"]

    # Student attempts to access admin endpoint
    res = client.get("/api/auth/admin-check", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == status.HTTP_403_FORBIDDEN
    assert "Access denied" in res.json()["detail"]


def test_rbac_admin_route_allowed_for_admin(client):
    """Verify that an administrator can access admin-only routes."""
    # Register admin
    client.post("/api/auth/signup", json={
        "name": "Admin B",
        "email": "admin_b@pgcet.gov",
        "password": "AdminPassword123!",
        "role": "admin"
    })
    token = client.post("/api/auth/login", json={
        "email": "admin_b@pgcet.gov",
        "password": "AdminPassword123!"
    }).json()["access_token"]

    # Admin accesses admin endpoint
    res = client.get("/api/auth/admin-check", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == status.HTTP_200_OK
    assert "Welcome Admin" in res.json()["message"]


def test_unauthenticated_request_rejected(client):
    """Verify that protected routes reject requests without a Bearer token."""
    res = client.get("/api/auth/me")
    assert res.status_code == status.HTTP_401_UNAUTHORIZED


def test_invalid_token_rejected(client):
    """Verify that protected routes reject bogus/tampered tokens."""
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer fake.tampered.token"})
    assert res.status_code == status.HTTP_401_UNAUTHORIZED
