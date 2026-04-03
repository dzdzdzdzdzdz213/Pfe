import React, { Suspense } from 'react';
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
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = React.lazy(() => import('./pages/admin/Users').then(m => ({ default: m.AdminUsers })));
const AdminAuditLogs = React.lazy(() => import('./pages/admin/AuditLogs').then(m => ({ default: m.AdminAuditLogs })));
const AdminSettings = React.lazy(() => import('./pages/admin/Settings').then(m => ({ default: m.AdminSettings })));

// Assistant
const AssistantDashboard = React.lazy(() => import('./pages/assistant/Dashboard').then(m => ({ default: m.AssistantDashboard })));
const AssistantCalendar = React.lazy(() => import('./pages/assistant/Calendar').then(m => ({ default: m.AssistantCalendar })));
const AssistantPatients = React.lazy(() => import('./pages/assistant/Patients').then(m => ({ default: m.AssistantPatients })));

// Radiologue
const RadiologueDashboard = React.lazy(() => import('./pages/radiologue/Dashboard').then(m => ({ default: m.RadiologueDashboard })));
const RadiologueExams = React.lazy(() => import('./pages/radiologue/Exams').then(m => ({ default: m.RadiologueExams })));
const ReportEditor = React.lazy(() => import('./pages/radiologue/ReportEditor').then(m => ({ default: m.ReportEditor })));
const PatientHistory = React.lazy(() => import('./pages/radiologue/PatientHistory').then(m => ({ default: m.PatientHistory })));
const RadiologuePatientSearch = React.lazy(() => import('./pages/radiologue/PatientSearch').then(m => ({ default: m.RadiologuePatientSearch })));

// Patient
const PatientDashboard = React.lazy(() => import('./pages/patient/Dashboard').then(m => ({ default: m.PatientDashboard })));
const PatientAppointments = React.lazy(() => import('./pages/patient/Appointments').then(m => ({ default: m.PatientAppointments })));
const PatientRecords = React.lazy(() => import('./pages/patient/Records').then(m => ({ default: m.PatientRecords })));
const PatientProfile = React.lazy(() => import('./pages/patient/Profile').then(m => ({ default: m.PatientProfile })));

// Shared
const ProfileSettings = React.lazy(() => import('./pages/shared/ProfileSettings').then(m => ({ default: m.ProfileSettings })));

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
    <Suspense fallback={<RouteSkeletonLoader />}>
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
