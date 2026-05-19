import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, role, profileComplete, loading, roleLoading, authInitialized } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  // Wait for auth check, OR for role to be resolved when a user is present but
  // the role hasn't loaded yet (race condition during refetch).
  // Once authInitialized is true and role is still null, treat it as a load failure
  // and fall through to the unauthorized handler (rather than spinning forever).
  if (loading || roleLoading || (user && !role && !authInitialized)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary mx-auto" />
          <p className="text-gray-500 font-medium tracking-tight">{t('checking_access')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if unauthenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Email verification gate — block ALL protected pages until the user has
  // confirmed their email. They can still reach /verify-email itself.
  if (user && !user.email_confirmed_at) {
    if (location.pathname !== '/verify-email') {
      return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email || '')}`} replace />;
    }
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
