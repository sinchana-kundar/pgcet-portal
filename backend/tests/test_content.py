import io
import os
import pytest
from fastapi import status

from app.auth.security import create_access_token
from app.config import get_settings
from app.models.user import User
from app.models.notification import Notification
from app.models.study_material import StudyMaterial
from app.models.download import Download


@pytest.fixture
def student_auth_headers(db_session):
    """Create a student user and return bearer token authorization headers."""
    student = User(
        name="Student User",
        email="student_test@example.com",
        password_hash="fakehash",
        role="student",
    )
    db_session.add(student)
    db_session.commit()
    token = create_access_token({"sub": student.email, "user_id": student.id, "role": student.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers(db_session):
    """Create an admin user and return bearer token authorization headers."""
    admin = User(
        name="Admin Authority",
        email="admin_test@pgcet.gov.in",
        password_hash="fakehash",
        role="admin",
    )
    db_session.add(admin)
    db_session.commit()
    token = create_access_token({"sub": admin.email, "user_id": admin.id, "role": admin.role})
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# 1. NOTIFICATIONS TESTS
# ==============================================================================

def test_get_notifications_empty(client):
    """GET /api/notifications should return an empty list when no notifications exist."""
    res = client.get("/api/notifications")
    assert res.status_code == status.HTTP_200_OK
    assert res.json() == []


def test_create_notification_admin_json(client, admin_auth_headers):
    """Admin can create a notification using JSON payload without a file."""
    payload = {
        "title": "PGCET 2026 Application Dates Released",
        "description": "Online registration commences from next Monday. Ensure all certificates are valid.",
        "pdf_url": "https://kea.kar.nic.in/pgcet2026/notice.pdf",
    }
    res = client.post("/api/notifications", json=payload, headers=admin_auth_headers)
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert data["id"] is not None
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["pdf_url"] == payload["pdf_url"]
    assert "published_at" in data


def test_create_notification_admin_file_upload(client, admin_auth_headers):
    """Admin can create a notification with an optional PDF file upload."""
    pdf_content = b"%PDF-1.4 official notification document"
    fake_file = io.BytesIO(pdf_content)

    form_data = {
        "title": "PGCET 2026 Revised Schedule",
        "description": "Check the attached official PDF notice for exam timetable updates.",
    }
    files = {
        "file": ("schedule_notice.pdf", fake_file, "application/pdf")
    }

    res = client.post("/api/notifications", data=form_data, files=files, headers=admin_auth_headers)
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert data["title"] == form_data["title"]
    assert data["pdf_url"].startswith("/uploads/notifications/")
    assert data["pdf_url"].endswith(".pdf")

    # Verify that the file was actually saved to disk and is accessible via static files
    file_res = client.get(data["pdf_url"])
    assert file_res.status_code == status.HTTP_200_OK
    assert file_res.content == pdf_content


def test_create_notification_student_forbidden(client, student_auth_headers):
    """Students cannot create notifications (HTTP 403 Forbidden)."""
    payload = {
        "title": "Unauthorized Notice",
        "description": "Trying to bypass RBAC",
    }
    res = client.post("/api/notifications", json=payload, headers=student_auth_headers)
    assert res.status_code == status.HTTP_403_FORBIDDEN


def test_create_notification_unauthenticated(client):
    """Unauthenticated users cannot create notifications (HTTP 401 Unauthorized)."""
    payload = {
        "title": "Anonymous Notice",
        "description": "No auth header provided",
    }
    res = client.post("/api/notifications", json=payload)
    assert res.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_notifications_ordered_newest_first(client, admin_auth_headers):
    """GET /api/notifications returns list ordered newest first."""
    client.post(
        "/api/notifications",
        json={"title": "First Notice", "description": "Description 1"},
        headers=admin_auth_headers,
    )
    client.post(
        "/api/notifications",
        json={"title": "Second Notice", "description": "Description 2"},
        headers=admin_auth_headers,
    )

    res = client.get("/api/notifications")
    assert res.status_code == status.HTTP_200_OK
    items = res.json()
    assert len(items) == 2
    # Second created should be first in list
    assert items[0]["title"] == "Second Notice"
    assert items[1]["title"] == "First Notice"


def test_get_single_notification_detail(client, admin_auth_headers):
    """GET /api/notifications/{id} returns single notification or 404."""
    create_res = client.post(
        "/api/notifications",
        json={"title": "Single Notice", "description": "Detailed text"},
        headers=admin_auth_headers,
    )
    notif_id = create_res.json()["id"]

    res = client.get(f"/api/notifications/{notif_id}")
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["title"] == "Single Notice"

    # Non-existent ID returns 404
    res_404 = client.get("/api/notifications/999999")
    assert res_404.status_code == status.HTTP_404_NOT_FOUND


def test_update_notification_admin(client, admin_auth_headers):
    """Admin can edit an existing notification."""
    create_res = client.post(
        "/api/notifications",
        json={"title": "Original Title", "description": "Original Description"},
        headers=admin_auth_headers,
    )
    notif_id = create_res.json()["id"]

    # Update via JSON
    update_payload = {
        "title": "Updated Title",
        "description": "Updated Description Content",
    }
    res = client.put(f"/api/notifications/{notif_id}", json=update_payload, headers=admin_auth_headers)
    assert res.status_code == status.HTTP_200_OK
    updated = res.json()
    assert updated["title"] == "Updated Title"
    assert updated["description"] == "Updated Description Content"


def test_delete_notification_admin(client, admin_auth_headers):
    """Admin can delete a notification and its associated file."""
    # Create notification with file
    pdf_content = b"%PDF-1.4 file to delete"
    files = {"file": ("delete_me.pdf", io.BytesIO(pdf_content), "application/pdf")}
    create_res = client.post(
        "/api/notifications",
        data={"title": "Notice To Delete", "description": "Will be deleted"},
        files=files,
        headers=admin_auth_headers,
    )
    notif_id = create_res.json()["id"]
    file_url = create_res.json()["pdf_url"]

    # Verify file is there initially
    assert client.get(file_url).status_code == status.HTTP_200_OK

    # Delete
    del_res = client.delete(f"/api/notifications/{notif_id}", headers=admin_auth_headers)
    assert del_res.status_code == status.HTTP_200_OK
    assert del_res.json()["id"] == notif_id

    # Verify notification no longer found
    assert client.get(f"/api/notifications/{notif_id}").status_code == status.HTTP_404_NOT_FOUND

    # Verify file is cleaned up
    assert client.get(file_url).status_code == status.HTTP_404_NOT_FOUND


# ==============================================================================
# 2. STUDY MATERIALS TESTS
# ==============================================================================

def test_create_study_material_file_upload(client, admin_auth_headers):
    """Admin can upload a study material document."""
    doc_content = b"Binary Search Tree notes and algorithmic complexity."
    fake_file = io.BytesIO(doc_content)

    form_data = {
        "subject": "MCA",
        "topic": "Data Structures",
        "title": "Binary Search Trees Full Guide",
    }
    files = {
        "file": ("bst_guide.pdf", fake_file, "application/pdf")
    }

    res = client.post("/api/study-materials", data=form_data, files=files, headers=admin_auth_headers)
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert data["subject"] == "MCA"
    assert data["topic"] == "Data Structures"
    assert data["title"] == "Binary Search Trees Full Guide"
    assert data["file_url"].startswith("/uploads/materials/")

    # Check file download
    file_res = client.get(data["file_url"])
    assert file_res.status_code == status.HTTP_200_OK
    assert file_res.content == doc_content


def test_create_study_material_json(client, admin_auth_headers):
    """Admin can create a study material with external/direct file_url."""
    payload = {
        "subject": "MBA",
        "topic": "Quantitative Aptitude",
        "title": "Time and Work Formulas",
        "file_url": "https://example.com/materials/time_work.pdf",
    }
    res = client.post("/api/study-materials", json=payload, headers=admin_auth_headers)
    assert res.status_code == status.HTTP_201_CREATED
    assert res.json()["file_url"] == payload["file_url"]


def test_study_materials_filtering(client, admin_auth_headers):
    """GET /api/study-materials supports ?subject= and ?topic= query parameters."""
    client.post(
        "/api/study-materials",
        json={"subject": "MCA", "topic": "Operating Systems", "title": "Process Scheduling", "file_url": "/fake1.pdf"},
        headers=admin_auth_headers,
    )
    client.post(
        "/api/study-materials",
        json={"subject": "MCA", "topic": "Databases", "title": "SQL Normalization", "file_url": "/fake2.pdf"},
        headers=admin_auth_headers,
    )
    client.post(
        "/api/study-materials",
        json={"subject": "MBA", "topic": "Economics", "title": "Microeconomics 101", "file_url": "/fake3.pdf"},
        headers=admin_auth_headers,
    )

    # Filter by subject
    res_mca = client.get("/api/study-materials?subject=MCA")
    assert res_mca.status_code == status.HTTP_200_OK
    assert len(res_mca.json()) == 2

    # Filter by topic
    res_topic = client.get("/api/study-materials?topic=Databases")
    assert res_topic.status_code == status.HTTP_200_OK
    assert len(res_topic.json()) == 1
    assert res_topic.json()[0]["title"] == "SQL Normalization"

    # Filter by both subject and topic
    res_both = client.get("/api/study-materials?subject=MBA&topic=Economics")
    assert res_both.status_code == status.HTTP_200_OK
    assert len(res_both.json()) == 1
    assert res_both.json()[0]["subject"] == "MBA"


def test_delete_study_material(client, admin_auth_headers):
    """Admin can delete a study material entry."""
    create_res = client.post(
        "/api/study-materials",
        json={"subject": "MCA", "topic": "Networking", "title": "TCP/IP Protocol", "file_url": "https://example.com/net.pdf"},
        headers=admin_auth_headers,
    )
    mat_id = create_res.json()["id"]

    del_res = client.delete(f"/api/study-materials/{mat_id}", headers=admin_auth_headers)
    assert del_res.status_code == status.HTTP_200_OK

    # Verify gone
    all_res = client.get("/api/study-materials?subject=MCA&topic=Networking")
    assert len(all_res.json()) == 0


# ==============================================================================
# 3. DOWNLOADS TESTS
# ==============================================================================

def test_create_download_file_upload(client, admin_auth_headers):
    """Admin can upload a downloadable item (brochure, paper, etc.)."""
    paper_content = b"%PDF-1.4 PGCET 2024 Solved Question Paper"
    fake_file = io.BytesIO(paper_content)

    form_data = {
        "title": "PGCET 2024 Solved Question Paper",
        "category": "previous_year_paper",
    }
    files = {
        "file": ("pgcet_2024_paper.pdf", fake_file, "application/pdf")
    }

    res = client.post("/api/downloads", data=form_data, files=files, headers=admin_auth_headers)
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert data["title"] == form_data["title"]
    assert data["category"] == "previous_year_paper"
    assert data["file_url"].startswith("/uploads/downloads/")

    # Check file download
    file_res = client.get(data["file_url"])
    assert file_res.status_code == status.HTTP_200_OK
    assert file_res.content == paper_content


def test_downloads_category_filtering(client, admin_auth_headers):
    """GET /api/downloads supports ?category= query parameter."""
    client.post(
        "/api/downloads",
        json={"title": "Official 2026 Information Brochure", "category": "brochure", "file_url": "/uploads/brochure.pdf"},
        headers=admin_auth_headers,
    )
    client.post(
        "/api/downloads",
        json={"title": "2023 Mathematics Paper", "category": "previous_year_paper", "file_url": "/uploads/2023.pdf"},
        headers=admin_auth_headers,
    )

    res_brochure = client.get("/api/downloads?category=brochure")
    assert res_brochure.status_code == status.HTTP_200_OK
    items = res_brochure.json()
    assert len(items) == 1
    assert items[0]["category"] == "brochure"


def test_delete_download(client, admin_auth_headers):
    """Admin can delete a download item."""
    create_res = client.post(
        "/api/downloads",
        json={"title": "Syllabus Copy", "category": "syllabus", "file_url": "/syllabus.pdf"},
        headers=admin_auth_headers,
    )
    dl_id = create_res.json()["id"]

    del_res = client.delete(f"/api/downloads/{dl_id}", headers=admin_auth_headers)
    assert del_res.status_code == status.HTTP_200_OK

    res_404 = client.delete(f"/api/downloads/{dl_id}", headers=admin_auth_headers)
    assert res_404.status_code == status.HTTP_404_NOT_FOUND


# ==============================================================================
# 4. VALIDATION & ERROR HANDLING TESTS
# ==============================================================================

def test_notification_invalid_file_extension(client, admin_auth_headers):
    """Uploading a non-PDF file to /notifications should return 400 Bad Request."""
    invalid_file = io.BytesIO(b"malicious script")
    files = {"file": ("script.exe", invalid_file, "application/octet-stream")}
    form_data = {"title": "Invalid File Test", "description": "Should fail"}
    res = client.post("/api/notifications", data=form_data, files=files, headers=admin_auth_headers)
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "Invalid file extension" in res.json()["detail"]


def test_study_material_missing_file_and_url(client, admin_auth_headers):
    """Attempting to create study material without file or file_url returns 400."""
    form_data = {"subject": "MCA", "topic": "Algorithms", "title": "Missing File"}
    res = client.post("/api/study-materials", data=form_data, headers=admin_auth_headers)
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "File upload or 'file_url' is required" in res.json()["detail"]


def test_study_material_invalid_extension(client, admin_auth_headers):
    """Uploading an unsupported extension for study materials returns 400."""
    invalid_file = io.BytesIO(b"binary data")
    files = {"file": ("archive.bin", invalid_file, "application/octet-stream")}
    form_data = {"subject": "MCA", "topic": "Algorithms", "title": "Unsupported File"}
    res = client.post("/api/study-materials", data=form_data, files=files, headers=admin_auth_headers)
    assert res.status_code == status.HTTP_400_BAD_REQUEST


def test_download_missing_file_and_url(client, admin_auth_headers):
    """Attempting to create download without file or file_url returns 400."""
    form_data = {"title": "Brochure Without File", "category": "brochure"}
    res = client.post("/api/downloads", data=form_data, headers=admin_auth_headers)
    assert res.status_code == status.HTTP_400_BAD_REQUEST


def test_update_notification_with_file_upload(client, admin_auth_headers):
    """Admin can update an existing notification with a replacement PDF file."""
    create_res = client.post(
        "/api/notifications",
        json={"title": "Notice Before Upload", "description": "Description", "pdf_url": "/initial.pdf"},
        headers=admin_auth_headers,
    )
    notif_id = create_res.json()["id"]

    new_pdf = io.BytesIO(b"%PDF-1.4 updated version")
    files = {"file": ("new_version.pdf", new_pdf, "application/pdf")}
    data = {"title": "Notice With New Upload"}
    res = client.put(f"/api/notifications/{notif_id}", data=data, files=files, headers=admin_auth_headers)
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["title"] == "Notice With New Upload"
    assert res.json()["pdf_url"].startswith("/uploads/notifications/")


def test_update_notification_404(client, admin_auth_headers):
    """Updating a non-existent notification returns 404."""
    res = client.put("/api/notifications/999999", json={"title": "Ghost"}, headers=admin_auth_headers)
    assert res.status_code == status.HTTP_404_NOT_FOUND


def test_delete_study_material_404(client, admin_auth_headers):
    """Deleting a non-existent study material returns 404."""
    res = client.delete("/api/study-materials/999999", headers=admin_auth_headers)
    assert res.status_code == status.HTTP_404_NOT_FOUND


# ==============================================================================
# 5. TOP-LEVEL ALIASES AND SECURITY TESTS
# ==============================================================================

def test_top_level_route_aliases(client):
    """Verify that /notifications, /study-materials, and /downloads work identically without /api prefix."""
    res1 = client.get("/notifications")
    assert res1.status_code == status.HTTP_200_OK

    res2 = client.get("/study-materials")
    assert res2.status_code == status.HTTP_200_OK

    res3 = client.get("/downloads")
    assert res3.status_code == status.HTTP_200_OK


def test_upload_invalid_file_extension_rejected(client, admin_auth_headers):
    """Attempting to upload an executable or unauthorized file extension returns 400."""
    fake_exe = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00")
    files = {"file": ("malicious_payload.exe", fake_exe, "application/octet-stream")}
    data = {"title": "Malicious Download", "category": "syllabus"}
    res = client.post("/api/downloads", data=data, files=files, headers=admin_auth_headers)
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "Invalid file extension" in res.json()["detail"]


def test_upload_oversized_file_rejected(client, admin_auth_headers, monkeypatch):
    """Attempting to upload a file exceeding max size returns 400."""
    from app.config import get_settings
    settings = get_settings()
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE_MB", 0.0001)

    big_content = io.BytesIO(b"A" * 1000)
    files = {"file": ("oversized.pdf", big_content, "application/pdf")}
    data = {"title": "Large Document", "category": "brochure"}
    res = client.post("/api/downloads", data=data, files=files, headers=admin_auth_headers)
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "exceeds the maximum allowed limit" in res.json()["detail"]


