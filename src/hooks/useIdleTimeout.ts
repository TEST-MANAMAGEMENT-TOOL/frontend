import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useUserStore } from '@/store/user-store';
import { toast } from '@/components/ui/use-toast';

interface UseIdleTimeoutOptions {
  timeout?: number; // timeout in milliseconds
  warningTime?: number; // warning time before timeout in milliseconds
  onIdle?: () => void;
  onWarning?: () => void;
  enabled?: boolean;
}

export const useIdleTimeout = ({
  timeout = 30 * 60 * 1000, // 30 minutes default (increased from 5 minutes)
  warningTime = 60 * 1000, // 60 seconds warning default (increased from 30 seconds)
  onIdle,
  onWarning,
  enabled = true
}: UseIdleTimeoutOptions = {}) => {
  const navigate = useNavigate();
  const { logout } = useUserStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const [showWarning, setShowWarning] = useState(false);

  const handleLogout = useCallback(() => {
    console.log('🚨 IDLE TIMEOUT: Logging out user due to inactivity');
    
    // Clear the token and user data
    authService.clearToken();
    logout();
    
    // Show notification
    toast({
      title: 'Session Expired',
      description: 'You have been logged out due to inactivity.',
      variant: 'destructive',
    });
    
    // Redirect to login
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const handleWarning = useCallback(() => {
    setShowWarning(true);
    if (onWarning) {
      onWarning();
    }
  }, [onWarning]);

  const handleIdle = useCallback(() => {
    setShowWarning(false);
    if (onIdle) {
      onIdle();
    } else {
      handleLogout();
    }
  }, [onIdle, handleLogout]);

  const resetTimeout = useCallback(() => {
    if (!enabled) return;

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Hide warning if showing
    setShowWarning(false);

    // Update last activity time
    lastActivityRef.current = Date.now();

    console.log('⏰ Idle timeout reset - user activity detected');

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      console.log('⚠️ Showing idle warning - user will be logged out soon');
      handleWarning();
    }, timeout - warningTime);

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      console.log('🚨 Idle timeout reached - logging out user');
      handleIdle();
    }, timeout);
  }, [enabled, timeout, warningTime, handleWarning, handleIdle]);

  const extendSession = useCallback(() => {
    setShowWarning(false);
    resetTimeout();
  }, [resetTimeout]);

  const handleActivity = useCallback((event: Event) => {
    // Only reset timeout if user is authenticated
    const token = authService.getToken();
    if (!token) return;

    // Throttle activity detection to avoid excessive timeout resets
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Only reset if it's been more than 10 seconds since last activity (increased from 5 seconds)
    // This prevents navigation and API calls from constantly resetting the timer
    if (timeSinceLastActivity > 10000) {
      resetTimeout();
    }
  }, [resetTimeout]);

  useEffect(() => {
    if (!enabled) {
      // Clear timeouts if disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      setShowWarning(false);
      return;
    }

    // Only start timeout if user is authenticated
    const token = authService.getToken();
    if (!token) return;

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the initial timeout
    resetTimeout();

    // Cleanup function
    return () => {
      // Remove event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      // Clear timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [enabled, handleActivity, resetTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, []);

  // Return utility functions
  return {
    showWarning,
    resetTimeout,
    extendSession,
    handleLogout,
    getRemainingTime: () => {
      if (!timeoutRef.current) return 0;
      const elapsed = Date.now() - lastActivityRef.current;
      return Math.max(0, timeout - elapsed);
    },
    isActive: () => !!timeoutRef.current
  };
};