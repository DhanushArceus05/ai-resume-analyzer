import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Route-level code splitting: each page (and everything it exclusively
// imports — e.g. UploadPage's resume services, DashboardPage's jsPDF
// report generation) ships in its own chunk, loaded only when the user
// actually navigates there, instead of all being bundled into the one
// chunk every visitor downloads on first paint.
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const UploadPage = lazy(() => import("@/pages/UploadPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-paper">
    <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">Loading…</span>
  </div>
);

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
