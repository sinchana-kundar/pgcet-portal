import io
import pytest
from fastapi import status

from app.auth.security import create_access_token
from app.models.user import User
from app.utils.rate_limiter import lookup_rate_limiter


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Ensure rate limiter memory is clean before each test."""
    lookup_rate_limiter.reset()
    yield
    lookup_rate_limiter.reset()


@pytest.fixture
def admin_headers(db_session):
    """Create an admin user and return bearer token authorization headers."""
    admin = User(
        name="Admin Results Officer",
        email="results_admin@pgcet.gov.in",
        password_hash="fakehash",
        role="admin",
    )
    db_session.add(admin)
    db_session.commit()
    token = create_access_token({"sub": admin.email, "user_id": admin.id, "role": admin.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def student_headers(db_session):
    """Create a student user and return bearer token authorization headers."""
    student = User(
        name="Student Candidate",
        email="candidate@student.pgcet.in",
        password_hash="fakehash",
        role="student",
    )
    db_session.add(student)
    db_session.commit()
    token = create_access_token({"sub": student.email, "user_id": student.id, "role": student.role})
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# 1. ADMIN RESULT CREATION & CRUD TESTS
# ==============================================================================

def test_admin_create_single_result(client, admin_headers):
    """Admin can successfully create a single candidate result record."""
    payload = {
        "reg_number": "PGCET2026101",
        "dob": "2001-05-15",
        "rank": 42,
        "marks": 88.5,
        "category": "GM",
    }
    res = client.post("/api/admin/results", json=payload, headers=admin_headers)
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert data["id"] is not None
    assert data["reg_number"] == "PGCET2026101"
    assert data["dob"] == "2001-05-15"
    assert data["rank"] == 42
    assert data["marks"] == 88.5
    assert data["category"] == "GM"


def test_admin_create_result_duplicate_error(client, admin_headers):
    """Creating a result with an existing registration number returns 400 Bad Request."""
    payload = {
        "reg_number": "PGCET2026102",
        "dob": "2000-11-20",
        "rank": 105,
        "marks": 76.0,
        "category": "2A",
    }
    res1 = client.post("/api/admin/results", json=payload, headers=admin_headers)
    assert res1.status_code == status.HTTP_201_CREATED

    # Attempt second insertion with same registration number
    res2 = client.post("/api/admin/results", json=payload, headers=admin_headers)
    assert res2.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in res2.json()["detail"]


def test_student_cannot_access_admin_results(client, student_headers):
    """Students are forbidden (HTTP 403) from accessing admin result routes."""
    res_post = client.post(
        "/api/admin/results",
        json={"reg_number": "P1", "dob": "2000-01-01", "rank": 1, "marks": 90, "category": "GM"},
        headers=student_headers,
    )
    assert res_post.status_code == status.HTTP_403_FORBIDDEN

    res_get = client.get("/api/admin/results", headers=student_headers)
    assert res_get.status_code == status.HTTP_403_FORBIDDEN

    res_del = client.delete("/api/admin/results/1", headers=student_headers)
    assert res_del.status_code == status.HTTP_403_FORBIDDEN


def test_admin_paginated_results_and_search(client, admin_headers):
    """Admin can view paginated results and search by registration number or category."""
    for i in range(1, 6):
        client.post(
            "/api/admin/results",
            json={
                "reg_number": f"PGCET202620{i}",
                "dob": f"2001-01-0{i}",
                "rank": i * 10,
                "marks": 100 - i * 5,
                "category": "SC" if i % 2 == 0 else "GM",
            },
            headers=admin_headers,
        )

    # Paginated view
    res = client.get("/api/admin/results?page=1&limit=3", headers=admin_headers)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["total"] == 5
    assert len(data["items"]) == 3
    assert data["total_pages"] == 2

    # Category filter
    res_cat = client.get("/api/admin/results?category=SC", headers=admin_headers)
    assert res_cat.status_code == status.HTTP_200_OK
    assert res_cat.json()["total"] == 2

    # Search filter
    res_search = client.get("/api/admin/results?search=2026203", headers=admin_headers)
    assert res_search.status_code == status.HTTP_200_OK
    assert res_search.json()["total"] == 1
    assert res_search.json()["items"][0]["reg_number"] == "PGCET2026203"


def test_admin_delete_result(client, admin_headers):
    """Admin can delete a result record."""
    create_res = client.post(
        "/api/admin/results",
        json={
            "reg_number": "PGCET_DELETE_ME",
            "dob": "1999-12-31",
            "rank": 999,
            "marks": 45.0,
            "category": "3B",
        },
        headers=admin_headers,
    )
    result_id = create_res.json()["id"]

    del_res = client.delete(f"/api/admin/results/{result_id}", headers=admin_headers)
    assert del_res.status_code == status.HTTP_200_OK

    # Verify 404 after deletion
    del_again = client.delete(f"/api/admin/results/{result_id}", headers=admin_headers)
    assert del_again.status_code == status.HTTP_404_NOT_FOUND


# ==============================================================================
# 2. BULK CSV IMPORT TESTS
# ==============================================================================

def test_admin_bulk_import_csv_success(client, admin_headers):
    """Admin can bulk import results from a valid CSV file."""
    csv_content = """reg_number,rank,marks,category,dob
PGCET2026301,1,98.5,GM,2001-02-14
PGCET2026302,2,97.0,2A,2000-09-25
PGCET2026303,3,96.5,SC,1999-11-05
"""
    fake_file = io.BytesIO(csv_content.encode("utf-8"))
    files = {"file": ("results.csv", fake_file, "text/csv")}

    res = client.post("/api/admin/results/import", files=files, headers=admin_headers)
    assert res.status_code == status.HTTP_200_OK
    summary = res.json()
    assert summary["total_rows"] == 3
    assert summary["imported"] == 3
    assert summary["skipped"] == 0
    assert len(summary["errors"]) == 0

    # Verify records were inserted
    check_res = client.get("/api/admin/results?search=PGCET2026301", headers=admin_headers)
    assert check_res.json()["total"] == 1
    assert check_res.json()["items"][0]["rank"] == 1


def test_admin_bulk_import_csv_with_malformed_and_duplicate_rows(client, admin_headers):
    """Bulk import properly skips invalid rows, duplicate entries, and reports reasons."""
    # Pre-seed one record
    client.post(
        "/api/admin/results",
        json={"reg_number": "PGCET_EXISTING", "dob": "2000-01-01", "rank": 10, "marks": 85, "category": "GM"},
        headers=admin_headers,
    )

    csv_content = """reg_number,rank,marks,category,dob
PGCET_VALID_1,15,80.0,GM,2001-06-10
PGCET_EXISTING,20,78.0,2A,2000-01-01
PGCET_BAD_RANK,-5,75.0,SC,2001-07-15
PGCET_BAD_MARKS,25,-10.0,GM,2001-08-20
PGCET_BAD_DOB,30,70.0,3B,not-a-real-date
PGCET_DUP_CSV,35,65.0,GM,2001-09-01
PGCET_DUP_CSV,36,64.0,GM,2001-09-01
PGCET_VALID_2,40,60.0,ST,1999-04-12
"""
    fake_file = io.BytesIO(csv_content.encode("utf-8"))
    files = {"file": ("results_mixed.csv", fake_file, "text/csv")}

    res = client.post("/api/admin/results/import", files=files, headers=admin_headers)
    assert res.status_code == status.HTTP_200_OK
    summary = res.json()
    assert summary["total_rows"] == 8
    assert summary["imported"] == 3  # PGCET_VALID_1, first PGCET_DUP_CSV, PGCET_VALID_2
    assert summary["skipped"] == 5

    # Check that error details identify rows and reasons
    reasons = [e["reason"] for e in summary["errors"]]
    assert any("already exists in database" in r for r in reasons)
    assert any("Rank must be a positive integer" in r for r in reasons)
    assert any("Marks must be a non-negative number" in r for r in reasons)
    assert any("Invalid date of birth" in r for r in reasons)
    assert any("encountered multiple times in CSV" in r for r in reasons)


def test_import_invalid_file_extension(client, admin_headers):
    """Uploading a non-CSV file returns 400 Bad Request."""
    fake_file = io.BytesIO(b"fake data")
    files = {"file": ("results.xlsx", fake_file, "application/octet-stream")}
    res = client.post("/api/admin/results/import", files=files, headers=admin_headers)
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "upload a valid .csv file" in res.json()["detail"]


# ==============================================================================
# 3. PUBLIC LOOKUP & ANTI-LEAKAGE / IDENTITY VERIFICATION TESTS
# ==============================================================================

def test_public_lookup_success(client, admin_headers):
    """Public lookup returns rank, marks, category, and dob when both reg_number and dob match."""
    client.post(
        "/api/admin/results",
        json={
            "reg_number": "PGCET2026500",
            "dob": "2001-03-25",
            "rank": 7,
            "marks": 94.5,
            "category": "2A",
        },
        headers=admin_headers,
    )

    res = client.get("/api/results/lookup?reg_number=PGCET2026500&dob=2001-03-25")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["reg_number"] == "PGCET2026500"
    assert data["rank"] == 7
    assert data["marks"] == 94.5
    assert data["category"] == "2A"
    assert data["dob"] == "2001-03-25"
    assert "id" not in data, "Internal database primary key must not be leaked to the public."


def test_public_lookup_zero_information_leakage(client, admin_headers):
    """Verify that both an existing registration number with incorrect DOB,
    and a completely non-existent registration number, return the EXACT same 404 response.
    """
    client.post(
        "/api/admin/results",
        json={
            "reg_number": "PGCET_REAL_STUDENT",
            "dob": "2001-10-10",
            "rank": 150,
            "marks": 72.0,
            "category": "GM",
        },
        headers=admin_headers,
    )

    # 1. Real reg_number, WRONG dob
    res_wrong_dob = client.get("/api/results/lookup?reg_number=PGCET_REAL_STUDENT&dob=2001-10-11")
    assert res_wrong_dob.status_code == status.HTTP_404_NOT_FOUND
    msg_wrong_dob = res_wrong_dob.json()["detail"]

    # 2. Fake reg_number that does not exist in DB
    res_fake_reg = client.get("/api/results/lookup?reg_number=PGCET_DOES_NOT_EXIST&dob=2001-10-10")
    assert res_fake_reg.status_code == status.HTTP_404_NOT_FOUND
    msg_fake_reg = res_fake_reg.json()["detail"]

    # CRITICAL SECURITY CHECK: Messages must be identical so attackers cannot enumerate valid reg_numbers
    assert msg_wrong_dob == msg_fake_reg
    assert msg_wrong_dob == "No result found for the provided registration number and date of birth."


def test_public_lookup_malformed_dob(client):
    """Malformed date of birth string returns 400 Bad Request."""
    res = client.get("/api/results/lookup?reg_number=PGCET123&dob=invalid-date")
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "Invalid date of birth format" in res.json()["detail"]


def test_public_lookup_rate_limiting(client):
    """Rate limiter protects public lookup endpoint from brute-force attempts."""
    # Rate limit is 20 requests per minute
    for _ in range(20):
        res = client.get("/api/results/lookup?reg_number=PGCET_TEST&dob=2000-01-01")
        assert res.status_code in (status.HTTP_404_NOT_FOUND, status.HTTP_200_OK)

    # 21st request should be throttled
    throttled_res = client.get("/api/results/lookup?reg_number=PGCET_TEST&dob=2000-01-01")
    assert throttled_res.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert "Too many result lookup attempts" in throttled_res.json()["detail"]


# ==============================================================================
# 4. TOP-LEVEL ROUTE ALIASES
# ==============================================================================

def test_results_top_level_route_alias(client, admin_headers):
    """Verify results lookup and admin routes work without /api prefix."""
    lookup_rate_limiter.reset()

    # Create via /admin/results without /api
    create_res = client.post(
        "/admin/results",
        json={"reg_number": "ALIAS_TEST", "dob": "2000-05-05", "rank": 5, "marks": 95, "category": "GM"},
        headers=admin_headers,
    )
    assert create_res.status_code == status.HTTP_201_CREATED

    # Lookup via /results/lookup without /api
    lookup_res = client.get("/results/lookup?reg_number=ALIAS_TEST&dob=2000-05-05")
    assert lookup_res.status_code == status.HTTP_200_OK
    assert lookup_res.json()["rank"] == 5
