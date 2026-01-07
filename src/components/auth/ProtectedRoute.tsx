import { Navigate } from 'react-router-dom';
import { useAuth, canAccess } from '@/contexts/AuthContext';
import { User } from '@/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: string;
  allowedRoles?: User['role'][];
}

export function ProtectedRoute({ children, requiredModule, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check module-based access
  if (user && requiredModule && !canAccess(user.role, requiredModule)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
