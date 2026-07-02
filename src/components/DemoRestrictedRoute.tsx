import { Navigate, useLocation } from 'react-router-dom';
import { isDemoUser, isRouteAllowedForDemo } from '@/utils/auth-utils';
import { useToast } from '@/hooks/use-toast';

interface DemoRestrictedRouteProps {
  children: React.ReactNode;
}

export function DemoRestrictedRoute({ children }: DemoRestrictedRouteProps) {
  const location = useLocation();
  const { toast } = useToast();
  
  if (isDemoUser()) {
    // Check if the current route is allowed for demo users
    if (!isRouteAllowedForDemo(location.pathname)) {
      toast({
        title: 'Access Restricted',
        description: 'Demo accounts can only access the BugBash section.',
        variant: 'destructive',
      });
      
      // Redirect to bugbash list
      return <Navigate to="/bugbash/list" replace />;
    }
  }

  return <>{children}</>;
}
