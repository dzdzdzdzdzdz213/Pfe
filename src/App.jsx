import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ScrollToTop } from './components/common/ScrollToTop';
import { AuthLayout } from './components/layouts/AuthLayout';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { PublicLayout } from './components/layouts/PublicLayout';
import { Landing } from './pages/public/Landing';
import { Booking } from './pages/public/Booking';
import { Login } from './pages/auth/Login';
import { LanguageProvider } from './contexts/LanguageContext';

// Admin
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminUsers } from './pages/admin/Users';
import { AdminAuditLogs } from './pages/admin/AuditLogs';
import { AdminSettings } from './pages/admin/Settings';

// Assistant
import { AssistantDashboard } from './pages/assistant/Dashboard';
import { AssistantCalendar } from './pages/assistant/Calendar';
import { AssistantPatients } from './pages/assistant/Patients';

// Radiologue
import { RadiologueDashboard } from './pages/radiologue/Dashboard';
import { RadiologueExams } from './pages/radiologue/Exams';
import { ReportEditor } from './pages/radiologue/ReportEditor';
import { PatientHistory } from './pages/radiologue/PatientHistory';
import { RadiologuePatientSearch } from './pages/radiologue/PatientSearch';

// Patient
import { PatientDashboard } from './pages/patient/Dashboard';
import { PatientAppointments } from './pages/patient/Appointments';
import { PatientRecords } from './pages/patient/Records';
import { PatientProfile } from './pages/patient/Profile';

// Shared
import { ProfileSettings } from './pages/shared/ProfileSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const Unauthorized = () => (
  <div className="h-screen flex items-center justify-center bg-slate-50 p-4">
    <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-sm">
      <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Accès Non Autorisé</h1>
      <p className="text-slate-500 mt-2 font-medium">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
      <button onClick={() => window.history.back()} className="mt-6 w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
        Retourner
      </button>
    </div>
  </div>
);

const AppRoutes = () => {
  const location = useLocation();

  return (
      <Routes location={location}>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/book" element={<Booking />} />
        </Route>

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="administrateur"><DashboardLayout /></ProtectedRoute>
        }>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="profile" element={<ProfileSettings />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Assistant Routes */}
        <Route path="/assistant" element={
          <ProtectedRoute requiredRole="receptionniste"><DashboardLayout /></ProtectedRoute>
        }>
          <Route path="dashboard" element={<AssistantDashboard />} />
          <Route path="calendar" element={<AssistantCalendar />} />
          <Route path="patients" element={<AssistantPatients />} />
          <Route path="profile" element={<ProfileSettings />} />
          <Route path="settings" element={<ProfileSettings />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Radiologue Routes */}
        <Route path="/radiologue" element={
          <ProtectedRoute requiredRole="radiologue"><DashboardLayout /></ProtectedRoute>
        }>
          <Route path="dashboard" element={<RadiologueDashboard />} />
          <Route path="examens" element={<RadiologueExams />} />
          <Route path="report/:id" element={<ReportEditor />} />
          <Route path="history" element={<PatientHistory />} />
          <Route path="patients" element={<RadiologuePatientSearch />} />
          <Route path="profile" element={<ProfileSettings />} />
          <Route path="settings" element={<ProfileSettings />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Patient Routes */}
        <Route path="/patient" element={
          <ProtectedRoute requiredRole="patient"><DashboardLayout /></ProtectedRoute>
        }>
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="records" element={<PatientRecords />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="settings" element={<ProfileSettings />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Redirects */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={
          <div className="h-screen flex items-center justify-center font-bold text-2xl text-slate-400 uppercase tracking-widest bg-slate-50">
            404 | Page Introuvable
          </div>
        } />
      </Routes>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AuthProvider>
              <AppRoutes />
              <Toaster position="top-center" expand={true} richColors closeButton />
            </AuthProvider>
          </BrowserRouter>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
