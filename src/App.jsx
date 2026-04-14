import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ScrollToTop } from './components/common/ScrollToTop';
import { AuthLayout } from './components/layouts/AuthLayout';
import { PublicLayout } from './components/layouts/PublicLayout';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { useAuth } from './hooks/useAuth';

const DashboardLayout = React.lazy(() =>
  import('./components/layouts/DashboardLayout').then(m => ({ default: m.DashboardLayout }))
);

const withErrorBoundary = (Component) => (props) => (
  <ErrorBoundary>
    <Component {...props} />
  </ErrorBoundary>
);

// Public Pages
const LandingSafe = withErrorBoundary(React.lazy(() => import('./pages/public/Landing').then(m => ({ default: m.Landing }))));
const BookingSafe = withErrorBoundary(React.lazy(() => import('./pages/public/Booking').then(m => ({ default: m.Booking }))));
const LoginSafe = withErrorBoundary(React.lazy(() => import('./pages/auth/Login').then(m => ({ default: m.Login }))));

// Admin Pages
const AdminDashboardSafe = withErrorBoundary(React.lazy(() => import('./pages/admin/Dashboard').then(m => ({ default: m.AdminDashboard }))));
const AdminUsersSafe = withErrorBoundary(React.lazy(() => import('./pages/admin/Users').then(m => ({ default: m.AdminUsers }))));
const AdminStatsSafe = withErrorBoundary(React.lazy(() => import('./pages/admin/Stats').then(m => ({ default: m.AdminStats }))));
const AdminAuditLogsSafe = withErrorBoundary(React.lazy(() => import('./pages/admin/AuditLogs').then(m => ({ default: m.AdminAuditLogs }))));
const AdminSettingsSafe = withErrorBoundary(React.lazy(() => import('./pages/admin/Settings').then(m => ({ default: m.AdminSettings || (() => <div>Settings coming soon</div>) }))));

// Assistant Pages
const AssistantDashboardSafe = withErrorBoundary(React.lazy(() => import('./pages/assistant/Dashboard').then(m => ({ default: m.AssistantDashboard }))));
const AssistantCalendarSafe = withErrorBoundary(React.lazy(() => import('./pages/assistant/Calendar').then(m => ({ default: m.AssistantCalendar }))));
const AssistantPatientsSafe = withErrorBoundary(React.lazy(() => import('./pages/assistant/Patients').then(m => ({ default: m.AssistantPatients }))));

// Radiologue Pages
const RadiologueDashboardSafe = withErrorBoundary(React.lazy(() => import('./pages/radiologue/Dashboard').then(m => ({ default: m.RadiologueDashboard }))));
const RadiologueExamsSafe = withErrorBoundary(React.lazy(() => import('./pages/radiologue/Exams').then(m => ({ default: m.RadiologueExams }))));
const ReportEditorSafe = withErrorBoundary(React.lazy(() => import('./pages/radiologue/ReportEditor').then(m => ({ default: m.ReportEditor }))));
const PatientHistorySafe = withErrorBoundary(React.lazy(() => import('./pages/radiologue/PatientHistory').then(m => ({ default: m.PatientHistory }))));
const RadiologuePatientSearchSafe = withErrorBoundary(React.lazy(() => import('./pages/radiologue/PatientSearch').then(m => ({ default: m.PatientSearch }))));

// Patient Pages
const PatientDashboardSafe = withErrorBoundary(React.lazy(() => import('./pages/patient/Dashboard').then(m => ({ default: m.PatientDashboard }))));
const PatientAppointmentsSafe = withErrorBoundary(React.lazy(() => import('./pages/patient/Appointments').then(m => ({ default: m.PatientAppointments }))));
const PatientRecordsSafe = withErrorBoundary(React.lazy(() => import('./pages/patient/Records').then(m => ({ default: m.PatientRecords }))));
const PatientProfileSafe = withErrorBoundary(React.lazy(() => import('./pages/patient/Profile').then(m => ({ default: m.PatientProfile }))));

// Common Profile/Settings
const ProfileSettingsSafe = withErrorBoundary(React.lazy(() => import('./pages/patient/Profile').then(m => ({ default: m.PatientProfile }))));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const RouteSkeletonLoader = () => (
  <div className="w-full h-full flex flex-col gap-8 animate-pulse">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-slate-100/80 rounded-[2rem] h-32 border border-slate-200 shadow-sm" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
      <div className="lg:col-span-2 bg-slate-100/80 rounded-[2rem] h-96 border border-slate-200 shadow-sm" />
      <div className="bg-slate-100/80 rounded-[2rem] h-96 border border-slate-200 shadow-sm" />
    </div>
  </div>
);

const Unauthorized = () => {
  const { t } = useLanguage();
  const { role, user } = useAuth();
  return (
    <div className="h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-sm">
        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t('error_unauthorized')}</h1>
        <p className="text-slate-500 mt-2 font-medium">{t('error_unauthorized_msg')}</p>
        <div className="mt-4 p-4 bg-slate-100 rounded-xl text-left border border-slate-200">
          <p className="text-xs font-mono text-slate-600 mb-1 flex justify-between"><span>User ID:</span><span className="font-bold">{user?.id || 'null'}</span></p>
          <p className="text-xs font-mono text-slate-600 flex justify-between"><span>Detected Role:</span><strong className="text-red-500 font-bold bg-red-100 px-1 rounded">{String(role)}</strong></p>
          <p className="text-[10px] text-slate-400 mt-2 leading-tight">If "Detected Role" is wrong, the database is sending the wrong string to your account.</p>
        </div>
        <button onClick={() => window.history.back()} className="mt-6 w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
          {t('error_go_back')}
        </button>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <Suspense fallback={<RouteSkeletonLoader />}>
      <Routes location={location}>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingSafe />} />
          <Route path="/book" element={<BookingSafe />} />
        </Route>

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginSafe />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin"><DashboardLayout /></ProtectedRoute>
        }>
          <Route path="dashboard" element={<AdminDashboardSafe />} />
          <Route path="users" element={<AdminUsersSafe />} />
          <Route path="audit-logs" element={<AdminAuditLogsSafe />} />
          <Route path="stats" element={<AdminStatsSafe />} />
          <Route path="settings" element={<AdminSettingsSafe />} />
          <Route path="profile" element={<ProfileSettingsSafe />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Assistant Routes */}
        <Route path="/assistant" element={
          <ProtectedRoute requiredRole="assistant"><DashboardLayout /></ProtectedRoute>
        }>
          <Route path="dashboard" element={<AssistantDashboardSafe />} />
          <Route path="calendar" element={<AssistantCalendarSafe />} />
          <Route path="patients" element={<AssistantPatientsSafe />} />
          <Route path="profile" element={<ProfileSettingsSafe />} />
          <Route path="settings" element={<ProfileSettingsSafe />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Radiologue Routes */}
        <Route path="/radiologue" element={
          <ProtectedRoute requiredRole="radiologue"><DashboardLayout /></ProtectedRoute>
        }>
          <Route path="dashboard" element={<RadiologueDashboardSafe />} />
          <Route path="examens" element={<RadiologueExamsSafe />} />
          <Route path="report/:id" element={<ReportEditorSafe />} />
          <Route path="history" element={<PatientHistorySafe />} />
          <Route path="patients" element={<RadiologuePatientSearchSafe />} />
          <Route path="profile" element={<ProfileSettingsSafe />} />
          <Route path="settings" element={<ProfileSettingsSafe />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Patient Routes */}
        <Route path="/patient" element={
          <ProtectedRoute requiredRole="patient"><DashboardLayout /></ProtectedRoute>
        }>
          <Route path="dashboard" element={<PatientDashboardSafe />} />
          <Route path="appointments" element={<PatientAppointmentsSafe />} />
          <Route path="records" element={<PatientRecordsSafe />} />
          <Route path="profile" element={<PatientProfileSafe />} />
          <Route path="settings" element={<ProfileSettingsSafe />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>


        {/* Redirects */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={
          <div className="h-screen flex items-center justify-center font-bold text-2xl text-slate-400 uppercase tracking-widest bg-slate-50">
            404 | {t('no_results')}
          </div>
        } />
      </Routes>
    </Suspense>
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
