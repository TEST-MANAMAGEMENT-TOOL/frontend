import { useCallback } from 'react';
import { useUserStore } from '@/store/user-store';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

export const useAuth = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    login: loginUser, 
    register: registerUser, 
    verifyEmail, 
    requestPasswordReset, 
    resetPassword, 
    logout: logoutUser,
    updateCurrentUser,
    syncUserFromLocalStorage
  } = useUserStore();

  const login = useCallback(async (email: string, password: string) => {
    try {
      const success = await loginUser(email, password);
      if (success) {
        toast({
          title: 'Login successful',
          description: 'Welcome back!',
        });
        navigate('/dashboard');
        return { success: true };
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An error occurred during login',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  }, [loginUser, navigate]);

  const register = useCallback(async (userData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }) => {
    try {
      const result = await registerUser(userData);
      if (result.success) {
        toast({
          title: 'Registration successful',
          description: result.message || 'Please check your email to verify your account.',
        });
        navigate('/verify-email');
        return { success: true };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An error occurred during registration',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  }, [registerUser, navigate]);

  const verifyUserEmail = useCallback(async (token: string) => {
    try {
      const result = await verifyEmail(token);
      if (result.success) {
        toast({
          title: 'Email verified',
          description: result.message || 'Your email has been verified successfully!',
        });
        navigate('/login');
        return { success: true };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      toast({
        title: 'Email verification failed',
        description: error instanceof Error ? error.message : 'An error occurred during email verification',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  }, [verifyEmail, navigate]);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      const result = await requestPasswordReset(email);
      if (result.success) {
        toast({
          title: 'Password reset email sent',
          description: result.message || 'Please check your email for password reset instructions.',
        });
        return { success: true };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      toast({
        title: 'Password reset failed',
        description: error instanceof Error ? error.message : 'An error occurred while processing your request',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  }, [requestPasswordReset]);

  const resetUserPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      const result = await resetPassword(token, newPassword);
      if (result.success) {
        toast({
          title: 'Password reset successful',
          description: result.message || 'Your password has been reset successfully!',
        });
        navigate('/login');
        return { success: true };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: 'Password reset failed',
        description: error instanceof Error ? error.message : 'An error occurred while resetting your password',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  }, [resetPassword, navigate]);

  const logout = useCallback(() => {
    logoutUser();
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
    navigate('/login');
  }, [logoutUser, navigate]);

  return {
    user: currentUser,
    login,
    register,
    verifyEmail: verifyUserEmail,
    forgotPassword,
    resetPassword: resetUserPassword,
    logout,
    updateUser: updateCurrentUser,
    syncUserFromLocalStorage
  };
};
