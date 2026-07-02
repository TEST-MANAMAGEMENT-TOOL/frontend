import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useToast } from '@/components/ui/use-toast';
import { useUserStore } from '@/store/user-store';
import { hasRouteAccess } from '@/utils/rolePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { toast } = useToast();
  const currentUser = useUserStore((state) => state.currentUser);
  
  if (!authService.isAuthenticated()) {
    // Store the attempted URL for redirecting after login
    sessionStorage.setItem('redirectUrl', location.pathname);
    
    // Show a toast notification
    toast({
      title: 'Authentication Required',
      description: 'Please log in to access this page.',
      variant: 'destructive',
    });
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if current user is a demo account
  if (currentUser?.email?.toLowerCase().includes('demo@') || currentUser?.role?.toLowerCase() === 'demo') {
    toast({
      title: 'Access Denied',
      description: 'Demo accounts do not have permission to access this page.',
      variant: 'destructive',
    });
    return <Navigate to="/" replace />;
  }

  // Check role-based access
  const hasPermission = hasRouteAccess(currentUser?.email, currentUser?.role, location.pathname);
  if (!hasPermission) {
    toast({
      title: 'Access Denied',
      description: 'You do not have permission to access this section.',
      variant: 'destructive',
    });
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
