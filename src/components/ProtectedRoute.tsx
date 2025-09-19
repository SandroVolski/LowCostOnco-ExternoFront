
import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, initializing } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initializing) return;
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [isAuthenticated, navigate, allowedRoles, user]);

  if (initializing) {
    return null;
  }
  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
