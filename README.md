# Karnataka PGCET Student Portal (`pgcet-portal`)

A modern, production-ready, full-stack web application designed for Karnataka Post Graduate Common Entrance Test (PGCET) aspirants (MBA, MCA, and M.Tech). The portal provides authentic notifications, categorized study materials, previous question papers, a full-featured Computer-Based Test (CBT) mock exam platform, practice mode, personal analytics dashboards, a public candidate result & rank lookup engine, and an administrative management panel.

---

## 🌟 Key Features

### 1. Public Information & Resources
- **Official Notifications & Circulars**: Live updates, downloadable official KEA PDF circulars, and detailed view pages.
- **Subject Notes & Reference Material**: Subject/topic categorized study materials with direct view and download links.
- **Official Downloads Repository**: Previous years' question papers, syllabus PDFs, brochures, and answer keys.
- **Candidate Result & Rank Lookup**: Secure verification engine requiring both Registration Number and Date of Birth (DOB) with brute-force protection.

### 2. Student CBT Exam & Practice Platform
- **Timed CBT Mock Tests**: Simulates the authentic exam environment with countdown timer, question palette (Answered, Unanswered, Marked for Review), and instant auto-submit when time expires.
- **Practice Mode**: Flexible, untimed practice sessions filtered by subject, topic, and difficulty with immediate explanation reveals.
- **Attempt Review & Solutions**: Comprehensive post-exam breakdown with score cards, topic-wise accuracy metrics, and detailed question-by-question explanations.
- **Student Dashboard**: Tracks overall mock test history, recent attempts, strong and weak areas, and score progression.

### 3. Comprehensive Admin Control Panel
- **Role-Based Access Control**: Strict `admin` role authorization on both backend endpoints and React routing.
- **Notifications Manager**: Create, update, upload notification circular PDFs, and delete notices.
- **Study Materials & Downloads Manager**: Upload notes and syllabus documents directly to persistent storage (Cloudinary or local storage in development).
- **Question Bank Manager**: Search, filter, add, edit, and delete multiple-choice questions with 4 options and detailed explanations.
- **Mock Test Builder**: Create full-length exam configurations with duration, total marks, and questions.
- **Results & Rank Management**: Manual entry and high-performance bulk CSV import with validation reporting and deletion safeguards.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.11+ / 3.13, [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy 2.0](https://www.sqlalchemy.org/), [Pydantic v2](https://docs.pydantic.dev/), PostgreSQL (with SQLite support for local unit tests).
- **Authentication & Security**: JWT (HS256) bearer authentication, `bcrypt` password hashing, role-based dependencies, and [SlowAPI](https://slowapi.readthedocs.io/) rate limiting.
- **Database Migrations**: [Alembic](https://alembic.sqlalchemy.org/) for version-controlled, production-grade schema migrations.
- **File Storage**: Unified storage abstraction supporting **Cloudinary** (production) and **Local Filesystem** (development).
- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), Axios.

---

## 📁 Repository Structure

```
pgcet-portal/
├── backend/
│   ├── alembic/              # Alembic migration environment and versions
│   │   ├── versions/         # Schema migration revisions
│   │   └── env.py
│   ├── app/
│   │   ├── auth/             # JWT auth, passwords, dependencies
│   │   ├── models/           # SQLAlchemy ORM models (10 tables)
│   │   ├── routers/          # API route definitions
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── utils/            # Storage abstraction, rate limiter, date parser
│   │   ├── config.py         # App configuration & settings
│   │   ├── database.py       # Engine and sessionmaker
│   │   └── main.py           # FastAPI application entrypoint
│   ├── tests/                # 60 automated unit and integration tests
│   ├── create_admin.py       # CLI admin user seeding utility
│   ├── Procfile              # Web service definition for Render / Railway
│   ├── render.yaml           # Infrastructure-as-code blueprint for Render
│   ├── requirements.txt      # Pinned Python production dependencies
│   └── .env.example          # Template for backend environment variables
├── frontend/
│   ├── src/
│   │   ├── admin/            # Admin panel views, tables, and dialogs
│   │   ├── api/              # API clients and endpoints
│   │   ├── components/       # Reusable UI components & ErrorBoundary
│   │   ├── context/          # Authentication context
│   │   ├── hooks/            # usePageMeta SEO hook
│   │   └── pages/            # Public, Student, and Auth views
│   ├── vercel.json           # Vercel deployment rewrite rules for SPA
│   ├── vite.config.js        # Vite configuration
│   └── .env.example          # Template for frontend environment variables
├── .gitignore                # Root gitignore protecting secrets
└── README.md                 # Project documentation
```

---

## ⚙️ Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL (or use default local SQLite fallback for testing)

### 1. Backend Setup
1. Open a terminal in `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv .venv
   .venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` as required (see [Environment Variables](#environment-variables)).
5. Run database migrations:
   ```bash
   alembic upgrade head
   ```
6. Seed an administrative account:
   ```bash
   python create_admin.py --name "System Administrator" --email "admin@pgcet.in" --password "Admin@12345"
   ```
7. Start the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Interactive Swagger documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Frontend Setup
1. Open a terminal in `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create environment configuration:
   ```bash
   cp .env.example .env
   ```
   Set `VITE_API_BASE_URL=http://localhost:8000`.
4. Start the development server:
   ```bash
   npm run dev
   ```
   Access the frontend at [http://localhost:5173](http://localhost:5173).

---

## 🔒 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Deployment environment (`development` or `production`) | `development` |
| `DATABASE_URL` | PostgreSQL or SQLite connection string | `postgresql://user:pass@localhost:5432/pgcet_db` |
| `JWT_SECRET_KEY` | Secret key used for signing HS256 JWT tokens | Generate via `openssl rand -hex 32` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token validity lifetime in minutes | `1440` (24 hours) |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins | `http://localhost:5173,https://pgcet-portal.vercel.app` |
| `STORAGE_TYPE` | Storage backend (`local` for dev, `cloudinary` for prod) | `local` |
| `CLOUDINARY_URL` | Cloudinary API connection string | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |
| `MAX_UPLOAD_SIZE_MB` | Maximum file upload size limit in MB | `25` |
| `ADMIN_SIGNUP_SECRET` | Secret token required to register an admin via public API | Set to a random secret |
| `RATE_LIMIT_LOGIN` | SlowAPI rate limit for login attempts | `5/minute` |
| `RATE_LIMIT_SIGNUP` | SlowAPI rate limit for signup attempts | `5/minute` |
| `RATE_LIMIT_LOOKUP` | SlowAPI rate limit for public results lookup | `20/minute` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of the deployed backend FastAPI API | `https://pgcet-backend.onrender.com` |

---

## ☁️ Production Deployment Guide

Follow these sequential steps to deploy the application into production:

### Step 1: Provision Managed PostgreSQL Database
1. Create a free PostgreSQL instance on [Render](https://render.com), [Supabase](https://supabase.com), [Neon](https://neon.tech), or [Railway](https://railway.app).
2. Copy the external **Connection String / Database URL** (e.g. `postgresql://pgcet_user:password@host/pgcet_db`).

### Step 2: Deploy Backend to Render (or Railway)
1. In Render, select **New Web Service** and connect your GitHub repository.
2. Root Directory: `backend`.
3. Runtime: `Python 3`.
4. Build Command:
   ```bash
   pip install -r requirements.txt && alembic upgrade head
   ```
5. Start Command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
6. Add the required Environment Variables in the Render dashboard:
   - `ENVIRONMENT=production`
   - `DATABASE_URL=<your-postgresql-url>`
   - `JWT_SECRET_KEY=<strong-random-hex-string>`
   - `JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440`
   - `STORAGE_TYPE=cloudinary`
   - `CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>`
   - `CORS_ORIGINS=https://<your-frontend-domain>.vercel.app`
7. Click **Deploy Web Service** and note your backend URL (e.g., `https://pgcet-backend.onrender.com`).

### Step 3: Run Migrations & Seed Admin User
- Schema migrations run automatically during the build step (`alembic upgrade head`).
- To seed the production administrator account, open the **Render Shell** (or run locally pointed to the remote `DATABASE_URL`):
  ```bash
  python create_admin.py --name "System Administrator" --email "admin@pgcet.in" --password "YourStrongPassword123"
  ```

### Step 4: Deploy Frontend to Vercel
1. In [Vercel](https://vercel.com), select **Add New Project** and select your repository.
2. Root Directory: `frontend`.
3. Framework Preset: `Vite`.
4. Build Settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Environment Variables:
   - `VITE_API_BASE_URL`: `https://pgcet-backend.onrender.com` (your deployed backend URL from Step 2).
6. Click **Deploy**. The included `vercel.json` ensures that all React Router URL paths route correctly on browser refreshes.

### Step 5: Finalize CORS Configuration
Once your Vercel deployment URL is generated (e.g., `https://pgcet-portal.vercel.app`):
1. Go back to your backend service on Render.
2. Update the `CORS_ORIGINS` environment variable to include the exact Vercel URL:
   ```text
   CORS_ORIGINS=https://pgcet-portal.vercel.app
   ```
3. Trigger a fast redeploy on Render.

---

## 🛡️ Security Hardening & Review

1. **Role-Based Access Control (RBAC)**:
   - All administrative routes (`/admin/*`, `/notifications` write, `/study-materials` write, `/downloads` write) are guarded with the `get_admin_user` dependency verifying `role == "admin"`.
   - Public account signup (`POST /api/auth/signup`) restricts self-assignment to the `"admin"` role in production unless `ADMIN_SIGNUP_SECRET` is matched.
   - Student attempt records are strictly isolated (`get_attempt` verifies `attempt.user_id == current_user.id`).
2. **Rate Limiting**:
   - `POST /api/auth/login` (5/min), `POST /api/auth/signup` (5/min), and `GET /results/lookup` (20/min) are protected against credential stuffing and brute-force attacks via SlowAPI.
3. **File Upload Security**:
   - File uploads are validated on the server for allowed MIME types and extensions (`.pdf`, `.doc`, `.docx`, `.zip`, `.rar`, `.xls`, `.xlsx`, `.ppt`, `.pptx`, `.txt`).
   - File sizes are strictly capped (`MAX_UPLOAD_SIZE_MB`, default 25MB).
   - Filenames are cryptographically randomized using UUID4 to prevent path traversal attacks.
4. **Secrets & CORS**:
   - Database credentials, Cloudinary tokens, and JWT signing keys are completely decoupled into environment variables.
   - CORS is restricted to production domains via the `CORS_ORIGINS` configuration.
5. **Credential Protection**:
   - Passwords are encrypted using salted `bcrypt` hashes. Passwords and hashes are excluded from all API response schemas.

---

## 📋 Production Verification Checklist

Run through these validation checks once your live site is deployed:

- [ ] **Sign up & Login**: Register a new student account at `/signup`, verify redirect to `/login`, and authenticate into `/dashboard`.
- [ ] **Attempt Isolation**: As Student A, take a mock test at `/mock-tests`. Copy the result URL `/attempts/<id>` and open it logged in as Student B. Confirm Student B receives a `403 Forbidden` response.
- [ ] **Admin Route Guarding**: As a student, navigate directly to `/admin`. Confirm immediate redirection away with an access-denied message.
- [ ] **Admin Authentication**: Log in using the seeded admin credentials. Confirm the Admin dropdown appears and opens the `/admin` portal.
- [ ] **Cloudinary Persistent Upload**: In `/admin/study-materials`, upload a study note PDF. Verify the generated URL points to Cloudinary (`https://res.cloudinary.com/...`). Redeploy the backend and verify the file is still downloadable.
- [ ] **Candidate Result Lookup**: Navigate to `/results`, enter a candidate's registration number and date of birth, and confirm the rank score card renders correctly.
- [ ] **Rate Limiting**: Submit more than 5 rapid invalid login attempts and confirm an HTTP `429 Too Many Requests` status is returned.
- [ ] **SPA Route Refresh**: Refresh the browser while on `/mock-tests` or `/admin/questions` and confirm the page reloads cleanly without 404 errors.
