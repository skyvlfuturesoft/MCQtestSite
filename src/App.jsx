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

// Components (Lazy Loaded for 98%+ Performance)
const Navbar = lazy(() => import('./components/Navbar'));
const Hero = lazy(() => import('./components/Hero'));
const Features = lazy(() => import('./components/Features'));
const Architecture = lazy(() => import('./components/Architecture'));
const TechStack = lazy(() => import('./components/TechStack'));
const Modules = lazy(() => import('./components/Modules'));
const Security = lazy(() => import('./components/Security'));
const Workflow = lazy(() => import('./components/Workflow'));
const DatabaseSection = lazy(() => import('./components/Database'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Screenshots = lazy(() => import('./components/Screenshots'));
const Testing = lazy(() => import('./components/Testing'));
const FutureScope = lazy(() => import('./components/FutureScope'));
const Footer = lazy(() => import('./components/Footer'));

const PageLoader = () => (
  <div className="page-loader">
    <div className="loader-spinner" />
  </div>
);

// Documentation Home Component
function DocumentationHome() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Navbar />
      <main>
        <Hero />
        <hr className="section-divider" />
        <Features />
        <Architecture />
        <TechStack />
        <Modules />
        <DatabaseSection />
        <Security />
        <Workflow />
        <Dashboard />
        <hr className="section-divider" />
        <Screenshots />
        <Testing />
        <FutureScope />
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
          {/* Documentation Portal */}
          <Route path="/" element={<DocumentationHome />} />
          
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
