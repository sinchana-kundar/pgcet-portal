import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Notifications from './pages/Notifications';
import NotificationDetail from './pages/NotificationDetail';
import StudyMaterials from './pages/StudyMaterials';
import Downloads from './pages/Downloads';
import ResultsLookup from './pages/ResultsLookup';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';

// Phase 6: Student Test, Practice & Dashboard Pages (Protected)
import Dashboard from './pages/Dashboard';
import MockTests from './pages/MockTests';
import TestInstructions from './pages/TestInstructions';
import TestTaking from './pages/TestTaking';
import AttemptResult from './pages/AttemptResult';
import Practice from './pages/Practice';

import ErrorBoundary from './components/ErrorBoundary';

// Phase 7: Admin Panel (Protected: Admin Only)
import {
  AdminLayout,
  AdminDashboard,
  NotificationsManager,
  StudyMaterialsManager,
  DownloadsManager,
  QuestionsManager,
  MockTestBuilder,
  ResultsManager,
} from './admin';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/notifications/:id" element={<NotificationDetail />} />
          <Route path="/study-materials" element={<StudyMaterials />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/results" element={<ResultsLookup />} />

          {/* Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Student Portal Flow */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock-tests"
            element={
              <ProtectedRoute>
                <MockTests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock-tests/:id/instructions"
            element={
              <ProtectedRoute>
                <TestInstructions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock-tests/:id/take"
            element={
              <ProtectedRoute>
                <TestTaking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attempts/:attemptId"
            element={
              <ProtectedRoute>
                <AttemptResult />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice"
            element={
              <ProtectedRoute>
                <Practice />
              </ProtectedRoute>
            }
          />

          {/* Phase 7: Admin Panel (Admin Role Only, Students redirected away) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="notifications" element={<NotificationsManager />} />
            <Route path="study-materials" element={<StudyMaterialsManager />} />
            <Route path="downloads" element={<DownloadsManager />} />
            <Route path="questions" element={<QuestionsManager />} />
            <Route path="mock-tests" element={<MockTestBuilder />} />
            <Route path="results" element={<ResultsManager />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

