# PGCET Student Portal — Backend API (Phases 1, 2, 3 & 4)

Welcome to the backend service for the **PGCET Student Portal** — a full-stack platform for Post Graduate Common Entrance Test aspirants featuring exam notifications, study resources, timed MCQ mock tests, official results/rank lookup, and an administrative control panel.

### Development Phases
- **Phase 1 (Completed)**: Core infrastructure, 10 SQLAlchemy ORM models, PostgreSQL connectivity, JWT authentication with bcrypt password hashing, Role-Based Access Control (`student` vs `admin`).
- **Phase 2 (Completed)**: Core Content APIs — Notifications, Study Materials, and Downloads (public read, admin write) with file upload management (`uploads/notifications/`, `uploads/materials/`, `uploads/downloads/`).
- **Phase 3 (Completed)**: Mock Test Engine — Question Bank CRUD (admin), Mock Test creation & question attachment, secure test-taking & scoring (cheat-proof, zero answers leaked before submission), user attempt history & breakdown review, and untimed practice mode by subject/topic.
- **Phase 4 (Completed)**: Official Results & Rank Lookup — Admin single result entry, paginated result management, bulk CSV import with validation & skipped-row diagnostic summary, and identity-verified public result lookup (`reg_number` + `dob`) with anti-enumeration zero-leakage error handling and sliding-window rate limiting.

---

## Project Structure

```text
pgcet-portal/
└─ backend/
   ├─ app/
   │  ├─ auth/
   │  │  ├─ __init__.py
   │  │  ├─ dependencies.py     # get_current_user, require_role, get_admin_user, get_student_or_admin
   │  │  └─ security.py         # bcrypt hashing, JWT create & decode
   │  ├─ models/                # SQLAlchemy ORM models
   │  │  ├─ __init__.py
   │  │  ├─ user.py             # users table
   │  │  ├─ notification.py     # notifications table
   │  │  ├─ study_material.py   # study_materials table
   │  │  ├─ question.py         # questions table
   │  │  ├─ mock_test.py        # mock_tests & mock_test_questions (M2M)
   │  │  ├─ attempt.py          # attempts & attempt_answers tables
   │  │  ├─ download.py         # downloads table
   │  │  └─ result.py           # results table (with reg_number, dob, rank, marks, category)
   │  ├─ routers/
   │  │  ├─ __init__.py
   │  │  ├─ auth.py             # /auth/signup, /auth/login, /auth/token, /auth/me
   │  │  ├─ notifications.py    # /notifications (GET, POST, PUT, DELETE)
   │  │  ├─ study_materials.py  # /study-materials (GET, POST, DELETE)
   │  │  ├─ downloads.py        # /downloads (GET, POST, DELETE)
   │  │  ├─ questions.py        # /admin/questions (GET, POST, PUT, DELETE)
   │  │  ├─ mock_tests.py       # /admin/mock-tests, /mock-tests, /mock-tests/{id}/attempt
   │  │  ├─ attempts.py         # /attempts/{id}/submit, /attempts/me, /attempts/{id}
   │  │  ├─ practice.py         # /practice (GET), /practice/check (POST)
   │  │  └─ results.py          # /admin/results (POST, GET, DELETE, /import), /results/lookup (GET)
   │  ├─ schemas/               # Pydantic validation & response schemas
   │  │  ├─ __init__.py
   │  │  ├─ auth.py             # UserCreate, UserLogin, UserResponse, Token
   │  │  ├─ notification.py     # NotificationCreate, NotificationUpdate, NotificationResponse
   │  │  ├─ study_material.py   # StudyMaterialCreate, StudyMaterialResponse
   │  │  ├─ download.py         # DownloadCreate, DownloadResponse
   │  │  ├─ question.py         # QuestionCreate, QuestionUpdate, QuestionAdminResponse, QuestionStudentResponse
   │  │  ├─ mock_test.py        # MockTestCreate, MockTestResponse, MockTestDetailResponse
   │  │  ├─ attempt.py          # StartAttemptResponse, SubmitAttemptRequest, AttemptResultResponse, AttemptHistoryItem
   │  │  ├─ practice.py         # PracticeCheckRequest, PracticeCheckResponse
   │  │  └─ result.py           # ResultCreate, ResultAdminResponse, ResultPublicResponse, ImportSummaryResponse
   │  ├─ utils/
   │  │  ├─ __init__.py
   │  │  ├─ file_upload.py      # safe upload, unique naming, validation, cleanup
   │  │  ├─ date_parser.py      # flexible date parsing (ISO, DD-MM-YYYY, etc.)
   │  │  └─ rate_limiter.py     # sliding-window memory rate limiter (brute-force defense)
   │  ├─ config.py              # Pydantic BaseSettings & .env management
   │  ├─ database.py            # SQLAlchemy engine, session maker, get_db
   │  └─ main.py                # FastAPI app, CORS, static mounts, router registration
   ├─ tests/
   │  ├─ conftest.py            # Isolated in-memory SQLite fixtures & cleanup
   │  ├─ test_auth.py           # Auth & RBAC test suite (12 test cases)
   │  ├─ test_content.py        # Notifications, Study Materials, Downloads tests (24 test cases)
   │  ├─ test_mock_tests.py     # Question bank, mock tests, attempts, scoring, practice tests (8 test cases)
   │  └─ test_results.py        # Single create, bulk CSV import, lookup, anti-leakage, rate limiting (13 test cases)
   ├─ uploads/                  # Organized local file storage
   │  ├─ notifications/         # Uploaded notification PDFs
   │  ├─ materials/             # Uploaded study material docs & PDFs
   │  └─ downloads/             # Uploaded brochures & previous year papers
   ├─ .env                      # Local environment configuration
   ├─ .env.example              # Template for environment configuration
   ├─ .gitignore
   ├─ pytest.ini
   ├─ README.md
   └─ requirements.txt
```

---

## API Endpoints Summary

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register new `student` or `admin` account |
| `POST` | `/api/auth/login` | Public | Login via JSON payload (`email`, `password`) |
| `POST` | `/api/auth/token` | Public | OAuth2 password flow for Swagger UI Authorize button |
| `GET` | `/api/auth/me` | Authenticated | Retrieve profile of the logged-in user |
| `GET` | `/api/auth/admin-check`| Admin only | RBAC verification check |

### Content Management
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Public | List notifications, newest first |
| `GET` | `/api/notifications/{id}` | Public | Single notification detail |
| `POST` | `/api/notifications` | Admin only | Create notification (supports PDF upload) |
| `PUT` | `/api/notifications/{id}` | Admin only | Edit notification |
| `DELETE` | `/api/notifications/{id}` | Admin only | Delete notification & clean up upload |
| `GET` | `/api/study-materials` | Public | List materials (`?subject=`, `?topic=`) |
| `POST` | `/api/study-materials` | Admin only | Upload and register document (PDF/DOC) |
| `DELETE` | `/api/study-materials/{id}`| Admin only | Delete study material & clean up file |
| `GET` | `/api/downloads` | Public | List downloads (`?category=`) |
| `POST` | `/api/downloads` | Admin only | Upload download resource |
| `DELETE` | `/api/downloads/{id}` | Admin only | Delete download resource & clean up file |

### Question Bank (`/api/admin/questions`) — Admin Only
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/admin/questions` | Admin only | Add question (`question_text`, options A-D, `correct_option`, `explanation`, `difficulty`) |
| `GET` | `/api/admin/questions` | Admin only | Browse questions with optional `?subject=` and `?topic=` filters |
| `PUT` | `/api/admin/questions/{id}`| Admin only | Edit question text, options, or explanation |
| `DELETE`| `/api/admin/questions/{id}`| Admin only | Delete question from question bank |

### Mock Tests & Test Taking
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/admin/mock-tests` | Admin only | Create mock test from question bank IDs |
| `GET` | `/api/mock-tests` | Public/Student | Browse available mock tests (title, subject, duration, count) |
| `GET` | `/api/mock-tests/{id}` | Student | Fetch test questions (**NO answers or explanations exposed**) |
| `POST` | `/api/mock-tests/{id}/attempt` | Student | Start a test attempt; returns `attempt_id` |
| `POST` | `/api/attempts/{id}/submit` | Student (Owner) | Submit answers, calculate score, return full breakdown review |
| `GET` | `/api/attempts/me` | Student | Student's own attempt history (isolated per user) |
| `GET` | `/api/attempts/{id}` | Student (Owner) | Review a past attempt with answers & explanations |

### Results & Rank Lookup (`/api/admin/results` & `/api/results`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/admin/results` | Admin only | Add single official exam result record (`reg_number`, `dob`, `rank`, `marks`, `category`) |
| `POST` | `/api/admin/results/import` | Admin only | Bulk import results via CSV file; skips invalid rows, returns detailed diagnostic summary |
| `GET` | `/api/admin/results` | Admin only | Paginated list of results (`?page=`, `?limit=`, `?category=`, `?search=`) |
| `DELETE` | `/api/admin/results/{id}` | Admin only | Delete an official result record |
| `GET` | `/api/results/lookup` | Public | Candidate rank lookup (`?reg_number=&dob=`); rate-limited, zero information leakage |

*(Note: Direct top-level aliases without `/api` such as `GET /results/lookup` and `POST /admin/results` are also supported for frontend convenience).*

---

## Security & Anti-Cheating Features
1. **Zero Answer Leakage**: Endpoints `GET /mock-tests/{id}` and `GET /practice` use `QuestionStudentResponse`, guaranteeing `correct_option` and `explanation` are NEVER sent to the client before test submission.
2. **Attempt Ownership Isolation**: A student can only submit to or view attempts created by their own user account. Unauthorized submissions or cross-student access attempts are rejected with `HTTP 403 Forbidden`.
3. **Resubmission Prevention**: Once an attempt is submitted, subsequent submission attempts are rejected with `HTTP 400 Bad Request`.
4. **Role Gating**: Admin routes strictly require `role == 'admin'`, returning `HTTP 403 Forbidden` for students.
5. **Zero Information Leakage on Result Lookup**: `GET /results/lookup?reg_number=&dob=` returns the exact same 404 response (`{"detail": "No result found for the provided registration number and date of birth."}`) whether the registration number does not exist or the DOB was incorrect. This completely prevents enumeration attacks or guessing valid candidate registration numbers.
6. **Lookup Rate Limiting & Brute-Force Defense**: An in-memory sliding-window rate limiter throttles excessive lookup attempts per client IP (20 requests/minute). Exceeding this threshold returns `HTTP 429 Too Many Requests`.
7. **Database Migration Note**: The `results` table has an added column `dob DATE NOT NULL`. For existing local PostgreSQL databases from Phase 1, run:
   ```sql
   ALTER TABLE results ADD COLUMN IF NOT EXISTS dob DATE;
   ```
   *(Or drop and recreate tables if dev data is ephemeral).*

---

## Local Setup & Quick Start

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **PostgreSQL 14+**

### 2. Activate Virtual Environment
```powershell
cd pgcet-portal/backend
.\.venv\Scripts\Activate.ps1
```

### 3. Run Automated Tests
Execute the isolated test suite (uses fast in-memory SQLite):
```bash
pytest -v
```
Output:
```text
======================= 57 passed, 2 warnings in 4.59s =======================
```

### 4. Run the Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```
- Interactive OpenAPI Docs (Swagger UI): `http://127.0.0.1:8000/docs`
- Alternative API Docs (ReDoc): `http://127.0.0.1:8000/redoc`

---

## Step-by-Step Guide: End-to-End Testing via FastAPI `/docs`

Open **`http://127.0.0.1:8000/docs`** in your browser.

---

### Step 1: Create Admin and Student Accounts
1. **Admin Account**:
   - `POST /api/auth/signup`
   - Body:
     ```json
     {
       "name": "Admin Officer",
       "email": "admin@pgcet.gov.in",
       "password": "AdminStrongPassword2026!",
       "role": "admin"
     }
     ```
2. **Student Account**:
   - `POST /api/auth/signup`
   - Body:
     ```json
     {
       "name": "Kavya Sharma",
       "email": "kavya@student.pgcet.in",
       "password": "StudentPassword2026!",
       "role": "student"
     }
     ```

---

### Step 2: Log in as Admin & Add Questions to Question Bank
1. Click the green **Authorize 🔓** button at the top-right.
   - Enter `admin@pgcet.gov.in` and `AdminStrongPassword2026!`. Click **Authorize**.
2. **Add Question 1**:
   - `POST /api/admin/questions`
   - Body:
     ```json
     {
       "subject": "MCA",
       "topic": "Data Structures",
       "question_text": "What is the worst-case time complexity of QuickSort?",
       "option_a": "O(n log n)",
       "option_b": "O(n^2)",
       "option_c": "O(n)",
       "option_d": "O(log n)",
       "correct_option": "B",
       "explanation": "QuickSort degrades to O(n^2) when the chosen pivot consistently yields maximally unbalanced partitions.",
       "difficulty": "medium"
     }
     ```
   - Note the returned `id` (e.g. `1`).
3. **Add Question 2**:
   - `POST /api/admin/questions`
   - Body:
     ```json
     {
       "subject": "MCA",
       "topic": "Data Structures",
       "question_text": "Which data structure follows the LIFO (Last In First Out) principle?",
       "option_a": "Queue",
       "option_b": "Array",
       "option_c": "Stack",
       "option_d": "Linked List",
       "correct_option": "C",
       "explanation": "A stack allows insertion and deletion from only one end (the top), adhering to LIFO order.",
       "difficulty": "easy"
     }
     ```
   - Note the returned `id` (e.g. `2`).

---

### Step 3: Admin Builds a Mock Test from Question Bank
1. **Create Mock Test**:
   - `POST /api/admin/mock-tests`
   - Body:
     ```json
     {
       "title": "MCA Data Structures Practice Test 1",
       "subject": "MCA",
       "duration_minutes": 30,
       "question_ids": [1, 2]
     }
     ```
   - Note the returned test `id` (e.g. `1`).
2. Log out of Admin by clicking **Authorize 🔓 -> Logout**.

---

### Step 4: Log in as Student & View Test (No Answers Leaked)
1. Click **Authorize 🔓** at top-right.
   - Enter `kavya@student.pgcet.in` and `StudentPassword2026!`. Click **Authorize**.
2. **Browse Mock Tests**:
   - `GET /api/mock-tests` -> Shows test title, subject, duration, and question count (2).
3. **View Test Questions**:
   - `GET /api/mock-tests/1`
   - Notice: Questions are returned with `option_a..d`, but **`correct_option` and `explanation` are completely omitted**.

---

### Step 5: Start Attempt, Submit Answers & View Scored Review
1. **Start Attempt**:
   - `POST /api/mock-tests/1/attempt`
   - Response:
     ```json
     {
       "attempt_id": 1,
       "mock_test_id": 1,
       "mock_test_title": "MCA Data Structures Practice Test 1",
       "duration_minutes": 30,
       "total_questions": 2,
       "started_at": "2026-10-02T14:00:00Z"
     }
     ```
2. **Submit Answers**:
   - `POST /api/attempts/1/submit`
   - Body (Student answers Q1 with 'B' [correct] and Q2 with 'A' [wrong]):
     ```json
     {
       "answers": [
         { "question_id": 1, "selected_option": "B" },
         { "question_id": 2, "selected_option": "A" }
       ]
     }
     ```
   - Response:
     ```json
     {
       "attempt_id": 1,
       "mock_test_id": 1,
       "mock_test_title": "MCA Data Structures Practice Test 1",
       "score": 1.0,
       "total_questions": 2,
       "percentage": 50.0,
       "breakdown": [
         {
           "question_id": 1,
           "selected_option": "B",
           "correct_option": "B",
           "is_correct": true,
           "explanation": "QuickSort degrades to O(n^2)..."
         },
         {
           "question_id": 2,
           "selected_option": "A",
           "correct_option": "C",
           "is_correct": false,
           "explanation": "A stack allows insertion and deletion..."
         }
       ]
     }
     ```
3. **Check My Attempt History**:
   - `GET /api/attempts/me` -> Lists past attempts, scores, and completion timestamps.
4. **Review Past Attempt**:
   - `GET /api/attempts/1` -> Retrieves the complete question-by-question review.

---

### Step 6: Test Practice-by-Topic Mode
1. **Fetch Topic Questions**:
   - `GET /api/practice?subject=MCA&topic=Data Structures`
   - Returns practice questions without answers or explanations.
2. **Instant Check Without Creating Attempt**:
   - `POST /api/practice/check`
   - Body:
     ```json
     {
       "question_id": 1,
       "selected_option": "B"
     }
     ```
   - Response reveals `is_correct: true` and the full explanation instantly without modifying attempt history.

---

### Step 7: Official Results — Bulk CSV Import & Zero-Leakage Lookup
1. **Prepare a Sample CSV File** (`results_sample.csv`):
   ```csv
   reg_number,rank,marks,category,dob
   PGCET2026001,1,96.5,GM,2001-05-15
   PGCET2026002,2,94.0,2A,2000-11-22
   PGCET2026003,3,91.0,SC,1999-08-30
   PGCET2026004,4,-5.0,ST,2002-01-10
   ```
   *(Notice row 4 has negative marks, which will be safely skipped and reported).*

2. **Bulk Import as Admin**:
   - Re-authorize as Admin (`admin@pgcet.gov.in`).
   - Execute `POST /api/admin/results/import` uploading `results_sample.csv`.
   - Response summary:
     ```json
     {
       "message": "Results import completed: 3 imported, 1 skipped.",
       "total_rows": 4,
       "imported": 3,
       "skipped": 1,
       "errors": [
         {
           "row": 5,
           "reg_number": "PGCET2026004",
           "reason": "Marks must be a non-negative number, got: '-5.0'."
         }
       ]
     }
     ```

3. **Admin Review Results**:
   - `GET /api/admin/results?page=1&limit=10`
   - Returns paginated list with total count and full records.

4. **Public Candidate Lookup (No Login Required)**:
   - Log out of Swagger UI (**Authorize 🔓 -> Logout**).
   - **Test 4.1: Correct Registration Number and Correct DOB**:
     - `GET /api/results/lookup?reg_number=PGCET2026001&dob=2001-05-15`
     - Response (`200 OK`):
       ```json
       {
         "reg_number": "PGCET2026001",
         "dob": "2001-05-15",
         "rank": 1,
         "marks": 96.5,
         "category": "GM"
       }
       ```
       *(Note: Internal database `id` is omitted).*

   - **Test 4.2: Correct Registration Number but Incorrect DOB**:
     - `GET /api/results/lookup?reg_number=PGCET2026001&dob=1995-01-01`
     - Response (`404 Not Found`):
       ```json
       {
         "detail": "No result found for the provided registration number and date of birth."
       }
       ```

   - **Test 4.3: Non-Existent Registration Number**:
     - `GET /api/results/lookup?reg_number=PGCET9999999&dob=2001-05-15`
     - Response (`404 Not Found`):
       ```json
       {
         "detail": "No result found for the provided registration number and date of birth."
       }
       ```
     - **Verification**: Notice that Test 4.2 and Test 4.3 return the **exact same HTTP 404 status code and error message**. An unauthorized user cannot guess or enumerate valid registration numbers.


