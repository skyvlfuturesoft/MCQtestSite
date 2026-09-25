import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { ProtectedRoute } from './context/AuthContext';

// Pages (Lazy Loaded)
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const ExamPage = lazy(() => import('./pages/student/ExamPage'));
const ResultPage = lazy(() => import('./pages/student/ResultPage'));
const TestHistory = lazy(() => import('./pages/student/TestHistory'));
const ExamTerminated = lazy(() => import('./pages/student/ExamTerminated'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const CreateExam = lazy(() => import('./pages/admin/CreateExam'));
const LiveMonitor = lazy(() => import('./pages/admin/LiveMonitor'));
const ViewResults = lazy(() => import('./pages/admin/ViewResults'));
const KickLog = lazy(() => import('./pages/admin/KickLog'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));

// Components (Lazy Loaded)
const Navbar = lazy(() => import('./components/Navbar'));
const Hero = lazy(() => import('./components/Hero'));
const Features = lazy(() => import('./components/Features'));
const Workflow = lazy(() => import('./components/Workflow'));
const CtaBanner = lazy(() => import('./components/CtaBanner'));
const Footer = lazy(() => import('./components/Footer'));

const PageLoader = () => (
  <div className="page-loader">
    <div className="loader-spinner" />
  </div>
);

// Landing Page Component matching reference mockup
function LandingPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Navbar />
      <main className="landing-page-main" style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        <Hero />
        <Features />
        <Workflow />
        <CtaBanner />
      </main>
      <Footer />
      <ScrollToTop />
    </Suspense>
  );
}

export default function App() {
  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Landing Portal */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Student Portal (Protected) */}
          <Route path="/student" element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/exam/:attemptId" element={
            <ProtectedRoute role="student">
              <ExamPage />
            </ProtectedRoute>
          } />
          <Route path="/student/result/:attemptId" element={
            <ProtectedRoute role="student">
              <ResultPage />
            </ProtectedRoute>
          } />
          <Route path="/student/history" element={
            <ProtectedRoute role="student">
              <TestHistory />
            </ProtectedRoute>
          } />
          <Route path="/student/exam-terminated" element={<ExamTerminated />} />
          
          {/* Admin Portal (Protected) */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/create-exam" element={
            <ProtectedRoute role="admin">
              <CreateExam />
            </ProtectedRoute>
          } />
          <Route path="/admin/edit-exam/:examId" element={
            <ProtectedRoute role="admin">
              <CreateExam />
            </ProtectedRoute>
          } />
          <Route path="/admin/monitor" element={
            <ProtectedRoute role="admin">
              <LiveMonitor />
            </ProtectedRoute>
          } />
          <Route path="/admin/results" element={
            <ProtectedRoute role="admin">
              <ViewResults />
            </ProtectedRoute>
          } />
          <Route path="/admin/kick-log" element={
            <ProtectedRoute role="admin">
              <KickLog />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute role="admin">
              <Analytics />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </>
  );
}
