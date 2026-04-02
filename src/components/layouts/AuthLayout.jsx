import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const AuthLayout = () => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (user && role) {
    // If user is already logged in, redirect them to their dashboard
    const dashboardPath = role === 'administrateur' ? '/admin/dashboard' : 
                         role === 'radiologue' ? '/radiologue/dashboard' :
                         role === 'receptionniste' ? '/assistant/dashboard' :
                         '/patient/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-white to-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Chemloul Radiologie" className="h-24 w-auto object-contain mix-blend-multiply" />
        </div>
        <p className="mt-2 text-center text-sm text-gray-500 font-medium">
          Système de Gestion de Clinique de Radiologie
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-blue-100/50 sm:rounded-3xl sm:px-10 border border-slate-100 backdrop-blur-sm">
          <Outlet />
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-gray-400 font-medium">
        &copy; {new Date().getFullYear()} CHEMLOUL RADIOLOGIE. Tous droits réservés.
      </div>
    </div>
  );
};
