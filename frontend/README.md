# PGCET Student Portal — Frontend (Phases 5 & 6)

Modern, mobile-responsive React web application for Karnataka Post Graduate Common Entrance Test (PGCET) aspirants. Built with Vite, Tailwind CSS, Axios, and React Router.

## Project Structure

```
frontend/
├── public/                 # Static assets (favicons, svgs)
├── src/
│   ├── admin/             # Reserved for Phase 7 Admin Panel components
│   ├── api/               # API layer (Axios client, interceptors & resource functions)
│   │   ├── client.js      # Central Axios client with JWT & 401 handling
│   │   ├── auth.js        # Authentication endpoints (login, signup, getMe)
│   │   ├── notifications.js # Notifications endpoints
│   │   ├── studyMaterials.js # Study materials endpoints with query filters
│   │   ├── downloads.js   # Downloads endpoints with category filters
│   │   ├── results.js     # Public candidate rank and score lookup
│   │   ├── mockTests.js   # Mock tests & attempt initialization endpoints
│   │   ├── attempts.js    # Attempt submission, history, and detailed scored review
│   │   ├── practice.js    # Untimed topic question retrieval & instant verification
│   │   └── index.js       # Barrel export
│   ├── components/        # Reusable UI components
│   │   ├── Navbar.jsx     # Navigation bar with responsive mobile menu & live auth state
│   │   ├── Footer.jsx     # Informational footer with syllabus & disclaimer links
│   │   ├── Card.jsx       # Reusable card layout component
│   │   ├── Loader.jsx     # Animated loading spinner with message
│   │   ├── ErrorMessage.jsx # Error state component with retry action
│   │   └── ProtectedRoute.jsx # Role-aware route guard
│   ├── context/           # React Context state management
│   │   ├── AuthContext.jsx # AuthProvider maintaining user session & localStorage sync
│   │   ├── useAuth.js     # useAuth custom hook
│   │   └── index.js       # Barrel export
│   ├── pages/             # Route pages
│   │   ├── Home.jsx       # Landing page, latest 3 circulars & quick actions
│   │   ├── Notifications.jsx # Full circulars list with keyword search & PDF links
│   │   ├── NotificationDetail.jsx # Notification detail view with share link
│   │   ├── StudyMaterials.jsx # Subject & topic filtered study materials
│   │   ├── Downloads.jsx  # Categorized official brochures & question papers
│   │   ├── ResultsLookup.jsx # Candidate rank & score lookup with printable scorecard
│   │   ├── MockTests.jsx  # Available full-length timed mock exams list
│   │   ├── TestInstructions.jsx # Pre-test guidelines, rules, and attempt start
│   │   ├── TestTaking.jsx # Core test simulator with timer, palette, and backup
│   │   ├── AttemptResult.jsx # Test scorecard, analytics, and full solutions breakdown
│   │   ├── Practice.jsx   # Untimed topic-wise practice mode with instant checks
│   │   ├── Dashboard.jsx  # Student dashboard with metrics and past attempt history
│   │   ├── Login.jsx      # Student / Admin sign in
│   │   ├── Signup.jsx     # Account registration
│   │   └── NotFound.jsx   # 404 fallback page
│   ├── App.jsx            # Main route definition with ProtectedRoute guards
│   ├── index.css          # Tailwind CSS configuration & base styling
│   └── main.jsx           # Application entrypoint
├── .env                   # Environment configuration (VITE_API_BASE_URL)
├── package.json           # Dependencies and scripts
└── vite.config.js         # Vite configuration with Tailwind CSS plugin
```

## Running the Application

### 1. Prerequisites
- Node.js 18+ (tested with Node 20+)
- Python 3.10+ (for FastAPI backend)
- PostgreSQL database

### 2. Configure Environment
Ensure `frontend/.env` has:
```bash
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```
The application will be accessible at: `http://localhost:5173`

### 5. Build for Production
```bash
npm run build
```
Verify the build with:
```bash
npm run preview
```
