import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, role, profileComplete, loading, roleLoading } = useAuth();
  const location = useLocation();

  console.log("ROLE:", role, "roleLoading:", roleLoading);

  if (loading || roleLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary mx-auto" />
          <p className="text-gray-500 font-medium tracking-tight">Vérification de l'accès...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if unauthenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force onboarding if profile is not complete
  if (user && !loading && !roleLoading && role && profileComplete === false) {
    // Allow access to /onboarding to prevent infinite loop if wrapped
    if (location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
  }

  const isAuthorized = () => {
    if (!requiredRole) return true;
    if (role === requiredRole) return true;
    
    // Schema-compliant fallbacks
    const legacyMap = {
      'admin': ['administrateur'],
      'receptionniste': ['assistant', 'receptionist']
    };
    
    if (legacyMap[requiredRole] && legacyMap[requiredRole].includes(role)) {
      return true;
    }
    
    return false;
  };

  if (!isAuthorized()) {
    // Redirect to unauthorized if authenticated but unauthorized role
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
