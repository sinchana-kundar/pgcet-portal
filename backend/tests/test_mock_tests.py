import pytest
from fastapi import status

from app.auth.security import create_access_token
from app.models.user import User


@pytest.fixture
def student_one_headers(db_session):
    """Create student 1 and return authorization headers."""
    student = User(
        name="Student One",
        email="student1@test.com",
        password_hash="fakehash",
        role="student",
    )
    db_session.add(student)
    db_session.commit()
    token = create_access_token({"sub": student.email, "user_id": student.id, "role": student.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def student_two_headers(db_session):
    """Create student 2 and return authorization headers."""
    student = User(
        name="Student Two",
        email="student2@test.com",
        password_hash="fakehash",
        role="student",
    )
    db_session.add(student)
    db_session.commit()
    token = create_access_token({"sub": student.email, "user_id": student.id, "role": student.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(db_session):
    """Create an admin user and return authorization headers."""
    admin = User(
        name="Admin Test",
        email="admin_mock@pgcet.gov.in",
        password_hash="fakehash",
        role="admin",
    )
    db_session.add(admin)
    db_session.commit()
    token = create_access_token({"sub": admin.email, "user_id": admin.id, "role": admin.role})
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# 1. QUESTION BANK TESTS
# ==============================================================================

def test_admin_create_question(client, admin_headers):
    """Admin can successfully add a question to the question bank."""
    payload = {
        "subject": "MCA",
        "topic": "Data Structures",
        "question_text": "What is the worst-case time complexity of QuickSort?",
        "option_a": "O(n log n)",
        "option_b": "O(n^2)",
        "option_c": "O(n)",
        "option_d": "O(log n)",
        "correct_option": "B",
        "explanation": "QuickSort degrades to O(n^2) when the pivot choice consistently partitions unbalanced subarrays.",
        "difficulty": "medium",
    }
    res = client.post("/api/admin/questions", json=payload, headers=admin_headers)
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert data["id"] is not None
    assert data["subject"] == "MCA"
    assert data["correct_option"] == "B"
    assert "QuickSort" in data["explanation"]


def test_question_creation_invalid_option(client, admin_headers):
    """Question creation fails if correct_option is not in A, B, C, D."""
    payload = {
        "subject": "MCA",
        "topic": "Data Structures",
        "question_text": "Invalid option test",
        "option_a": "A",
        "option_b": "B",
        "option_c": "C",
        "option_d": "D",
        "correct_option": "Z",
    }
    res = client.post("/api/admin/questions", json=payload, headers=admin_headers)
    assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_student_cannot_access_question_bank_admin_routes(client, student_one_headers):
    """Students are rejected with 403 on admin question routes."""
    res_get = client.get("/api/admin/questions", headers=student_one_headers)
    assert res_get.status_code == status.HTTP_403_FORBIDDEN

    res_post = client.post(
        "/api/admin/questions",
        json={
            "subject": "MCA",
            "topic": "Math",
            "question_text": "Q",
            "option_a": "1",
            "option_b": "2",
            "option_c": "3",
            "option_d": "4",
            "correct_option": "A",
        },
        headers=student_one_headers,
    )
    assert res_post.status_code == status.HTTP_403_FORBIDDEN


def test_admin_filter_and_edit_questions(client, admin_headers):
    """Admin can filter questions by subject/topic and edit them."""
    # Create two questions
    q1_res = client.post(
        "/api/admin/questions",
        json={
            "subject": "MCA",
            "topic": "Algorithms",
            "question_text": "Q1",
            "option_a": "A1",
            "option_b": "B1",
            "option_c": "C1",
            "option_d": "D1",
            "correct_option": "A",
        },
        headers=admin_headers,
    )
    q1_id = q1_res.json()["id"]

    client.post(
        "/api/admin/questions",
        json={
            "subject": "MBA",
            "topic": "Economics",
            "question_text": "Q2",
            "option_a": "A2",
            "option_b": "B2",
            "option_c": "C2",
            "option_d": "D2",
            "correct_option": "C",
        },
        headers=admin_headers,
    )

    # Filter by subject
    res_filter = client.get("/api/admin/questions?subject=MCA", headers=admin_headers)
    assert res_filter.status_code == status.HTTP_200_OK
    assert len(res_filter.json()) == 1
    assert res_filter.json()[0]["subject"] == "MCA"

    # Edit Q1
    edit_res = client.put(
        f"/api/admin/questions/{q1_id}",
        json={"question_text": "Q1 Updated Text", "correct_option": "D"},
        headers=admin_headers,
    )
    assert edit_res.status_code == status.HTTP_200_OK
    assert edit_res.json()["question_text"] == "Q1 Updated Text"
    assert edit_res.json()["correct_option"] == "D"

    # Delete Q1
    del_res = client.delete(f"/api/admin/questions/{q1_id}", headers=admin_headers)
    assert del_res.status_code == status.HTTP_200_OK


# ==============================================================================
# 2. MOCK TEST CREATION & LEAK PREVENTION TESTS
# ==============================================================================

def test_create_mock_test_and_leak_prevention(client, admin_headers, student_one_headers):
    """Create a mock test and verify students NEVER receive correct answers or explanations."""
    # Create 2 questions
    q1 = client.post(
        "/api/admin/questions",
        json={
            "subject": "MCA",
            "topic": "OS",
            "question_text": "Which scheduler is used for long term?",
            "option_a": "Job Scheduler",
            "option_b": "CPU Scheduler",
            "option_c": "Medium term Scheduler",
            "option_d": "Dispatcher",
            "correct_option": "A",
            "explanation": "Job scheduler selects processes from pool and loads them into memory.",
        },
        headers=admin_headers,
    ).json()

    q2 = client.post(
        "/api/admin/questions",
        json={
            "subject": "MCA",
            "topic": "OS",
            "question_text": "Deadlock condition does NOT include:",
            "option_a": "Mutual Exclusion",
            "option_b": "Hold and Wait",
            "option_c": "Preemption",
            "option_d": "Circular Wait",
            "correct_option": "C",
            "explanation": "No preemption is a deadlock condition, preemption breaks deadlock.",
        },
        headers=admin_headers,
    ).json()

    # Admin creates Mock Test
    test_payload = {
        "title": "Operating Systems Mock Test 1",
        "subject": "MCA",
        "duration_minutes": 45,
        "question_ids": [q1["id"], q2["id"]],
    }
    test_res = client.post("/api/admin/mock-tests", json=test_payload, headers=admin_headers)
    assert test_res.status_code == status.HTTP_201_CREATED
    mock_test = test_res.json()
    assert mock_test["total_questions"] == 2

    # Public / Student lists tests
    list_res = client.get("/api/mock-tests")
    assert list_res.status_code == status.HTTP_200_OK
    assert len(list_res.json()) >= 1

    # Student retrieves test details with questions
    detail_res = client.get(f"/api/mock-tests/{mock_test['id']}", headers=student_one_headers)
    assert detail_res.status_code == status.HTTP_200_OK
    data = detail_res.json()
    assert len(data["questions"]) == 2

    # CRITICAL SECURITY VERIFICATION: No answers or explanations leaked before submission
    for q in data["questions"]:
        assert "correct_option" not in q, "SECURITY LEAK: correct_option was exposed to student!"
        assert "explanation" not in q, "SECURITY LEAK: explanation was exposed to student!"
        assert "option_a" in q
        assert "question_text" in q


# ==============================================================================
# 3. ATTEMPT, SUBMISSION, SCORING, AND REVIEW FLOW
# ==============================================================================

def test_full_test_attempt_scoring_and_review_flow(
    client,
    admin_headers,
    student_one_headers,
    student_two_headers,
):
    """Complete end-to-end attempt flow: start -> submit -> score -> history -> review."""
    # 1. Setup questions
    q1 = client.post(
        "/api/admin/questions",
        json={
            "subject": "MCA",
            "topic": "C++",
            "question_text": "Which feature allows runtime polymorphism?",
            "option_a": "Templates",
            "option_b": "Virtual Functions",
            "option_c": "Friend Functions",
            "option_d": "Constructors",
            "correct_option": "B",
            "explanation": "Virtual functions enable dynamic dispatch at runtime.",
        },
        headers=admin_headers,
    ).json()

    q2 = client.post(
        "/api/admin/questions",
        json={
            "subject": "MCA",
            "topic": "C++",
            "question_text": "Default access specifier in class is:",
            "option_a": "public",
            "option_b": "protected",
            "option_c": "private",
            "option_d": "package",
            "correct_option": "C",
            "explanation": "Members of a C++ class are private by default.",
        },
        headers=admin_headers,
    ).json()

    # 2. Admin creates mock test
    mt = client.post(
        "/api/admin/mock-tests",
        json={
            "title": "C++ Comprehensive Mock",
            "subject": "MCA",
            "duration_minutes": 30,
            "question_ids": [q1["id"], q2["id"]],
        },
        headers=admin_headers,
    ).json()

    # 3. Student 1 starts attempt
    start_res = client.post(f"/api/mock-tests/{mt['id']}/attempt", headers=student_one_headers)
    assert start_res.status_code == status.HTTP_201_CREATED
    attempt_id = start_res.json()["attempt_id"]
    assert attempt_id is not None
    assert start_res.json()["mock_test_id"] == mt["id"]

    # 4. Security Check: Student 2 tries to submit Student 1's attempt -> 403 Forbidden
    hack_submit = client.post(
        f"/api/attempts/{attempt_id}/submit",
        json={"answers": [{"question_id": q1["id"], "selected_option": "A"}]},
        headers=student_two_headers,
    )
    assert hack_submit.status_code == status.HTTP_403_FORBIDDEN

    # 5. Student 1 submits answers: Q1 is correct ('B'), Q2 is wrong ('A')
    submit_payload = {
        "answers": [
            {"question_id": q1["id"], "selected_option": "B"},  # Correct
            {"question_id": q2["id"], "selected_option": "A"},  # Wrong (correct is C)
        ]
    }
    submit_res = client.post(
        f"/api/attempts/{attempt_id}/submit",
        json=submit_payload,
        headers=student_one_headers,
    )
    assert submit_res.status_code == status.HTTP_200_OK
    result = submit_res.json()
    assert result["score"] == 1.0
    assert result["total_questions"] == 2
    assert result["percentage"] == 50.0

    # Verify per-question review is provided upon submission
    breakdown = result["breakdown"]
    assert len(breakdown) == 2
    b1 = next(b for b in breakdown if b["question_id"] == q1["id"])
    assert b1["selected_option"] == "B"
    assert b1["correct_option"] == "B"
    assert b1["is_correct"] is True
    assert "Virtual functions" in b1["explanation"]

    b2 = next(b for b in breakdown if b["question_id"] == q2["id"])
    assert b2["selected_option"] == "A"
    assert b2["correct_option"] == "C"
    assert b2["is_correct"] is False

    # 6. Security Check: Student 1 tries to resubmit -> 400 Bad Request
    resubmit_res = client.post(
        f"/api/attempts/{attempt_id}/submit",
        json=submit_payload,
        headers=student_one_headers,
    )
    assert resubmit_res.status_code == status.HTTP_400_BAD_REQUEST

    # 7. Student 1 checks their attempt history (/attempts/me)
    history_res = client.get("/api/attempts/me", headers=student_one_headers)
    assert history_res.status_code == status.HTTP_200_OK
    history = history_res.json()
    assert len(history) == 1
    assert history[0]["attempt_id"] == attempt_id
    assert history[0]["score"] == 1.0

    # 8. Student 2 checks their attempt history -> empty list! (no cross-student leakage)
    history_s2 = client.get("/api/attempts/me", headers=student_two_headers)
    assert history_s2.status_code == status.HTTP_200_OK
    assert len(history_s2.json()) == 0

    # 9. Student 2 tries to view Student 1's attempt review -> 403 Forbidden!
    s2_review = client.get(f"/api/attempts/{attempt_id}", headers=student_two_headers)
    assert s2_review.status_code == status.HTTP_403_FORBIDDEN

    # 10. Student 1 views their own past attempt review -> 200 OK
    s1_review = client.get(f"/api/attempts/{attempt_id}", headers=student_one_headers)
    assert s1_review.status_code == status.HTTP_200_OK
    assert s1_review.json()["score"] == 1.0


# ==============================================================================
# 4. PRACTICE MODE TESTS
# ==============================================================================

def test_practice_mode_flow(client, admin_headers, student_one_headers):
    """Test untimed topic practice without generating attempt records."""
    # Create question
    q = client.post(
        "/api/admin/questions",
        json={
            "subject": "Mathematics",
            "topic": "Matrices",
            "question_text": "The determinant of an identity matrix is:",
            "option_a": "0",
            "option_b": "1",
            "option_c": "-1",
            "option_d": "undefined",
            "correct_option": "B",
            "explanation": "Determinant of any identity matrix I_n is always 1.",
        },
        headers=admin_headers,
    ).json()

    # Student fetches practice questions for topic
    practice_res = client.get(
        "/api/practice?subject=Mathematics&topic=Matrices",
        headers=student_one_headers,
    )
    assert practice_res.status_code == status.HTTP_200_OK
    questions = practice_res.json()
    assert len(questions) >= 1
    # Check no answers leaked
    assert "correct_option" not in questions[0]
    assert "explanation" not in questions[0]

    # Student checks correct answer
    check_correct = client.post(
        "/api/practice/check",
        json={"question_id": q["id"], "selected_option": "B"},
        headers=student_one_headers,
    )
    assert check_correct.status_code == status.HTTP_200_OK
    assert check_correct.json()["is_correct"] is True
    assert "identity matrix" in check_correct.json()["explanation"]

    # Student checks incorrect answer
    check_wrong = client.post(
        "/api/practice/check",
        json={"question_id": q["id"], "selected_option": "A"},
        headers=student_one_headers,
    )
    assert check_wrong.status_code == status.HTTP_200_OK
    assert check_wrong.json()["is_correct"] is False


# ==============================================================================
# 5. TOP-LEVEL ROUTE ALIASES
# ==============================================================================

def test_phase3_top_level_route_aliases(client, student_one_headers):
    """Verify mock-tests, attempts/me, and practice routes work without /api prefix."""
    res_mt = client.get("/mock-tests")
    assert res_mt.status_code == status.HTTP_200_OK

    res_att = client.get("/attempts/me", headers=student_one_headers)
    assert res_att.status_code == status.HTTP_200_OK

    res_prac = client.get("/practice?subject=Mathematics&topic=Matrices", headers=student_one_headers)
    assert res_prac.status_code == status.HTTP_200_OK


def test_admin_attempts_count(client, admin_headers, student_one_headers):
    """Verify /api/admin/attempts/count returns total count and is admin-restricted."""
    # Student forbidden
    res_forbidden = client.get("/api/admin/attempts/count", headers=student_one_headers)
    assert res_forbidden.status_code == status.HTTP_403_FORBIDDEN

    # Admin allowed
    res_admin = client.get("/api/admin/attempts/count", headers=admin_headers)
    assert res_admin.status_code == status.HTTP_200_OK
    assert "total" in res_admin.json()
    assert isinstance(res_admin.json()["total"], int)

