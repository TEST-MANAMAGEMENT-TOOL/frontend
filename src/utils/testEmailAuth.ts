// Test utility for email and password reset functionality - COMMENTED OUT FOR PRODUCTION
/*
import { authService } from '@/services/authService';

export const testEmailFunctions = {
  // Test sending verification email
  async testSendVerificationEmail(email: string) {
    console.log('=== TESTING SEND VERIFICATION EMAIL ===');
    console.log('Email:', email);
    
    try {
      const result = await authService.sendVerificationEmail(email);
      console.log('✅ Send verification email SUCCESS:', result);
      return { success: true, data: result };
    } catch (error: any) {
      console.log('❌ Send verification email FAILED:', error.message);
      console.log('Error details:', error);
      return { success: false, error: error.message };
    }
  },

  // Test email verification
  async testVerifyEmail(email: string, code: string) {
    console.log('=== TESTING EMAIL VERIFICATION ===');
    console.log('Email:', email);
    console.log('Code:', code);
    
    try {
      const result = await authService.verifyEmailCode(email, code);
      console.log('✅ Email verification SUCCESS:', result);
      return { success: true, data: result };
    } catch (error: any) {
      console.log('❌ Email verification FAILED:', error.message);
      console.log('Error details:', error);
      return { success: false, error: error.message };
    }
  },

  // Test password reset request
  async testPasswordResetRequest(email: string) {
    console.log('=== TESTING PASSWORD RESET REQUEST ===');
    console.log('Email:', email);
    
    try {
      const result = await authService.forgotPassword(email);
      console.log('✅ Password reset request SUCCESS:', result);
      return { success: true, data: result };
    } catch (error: any) {
      console.log('❌ Password reset request FAILED:', error.message);
      console.log('Error details:', error);
      return { success: false, error: error.message };
    }
  },

  // Test password reset code verification
  async testVerifyPasswordResetCode(email: string, code: string) {
    console.log('=== TESTING PASSWORD RESET CODE VERIFICATION ===');
    console.log('Email:', email);
    console.log('Code:', code);
    
    try {
      const result = await authService.verifyPasswordResetCode(email, code);
      console.log('✅ Password reset code verification SUCCESS:', result);
      return { success: true, data: result };
    } catch (error: any) {
      console.log('❌ Password reset code verification FAILED:', error.message);
      console.log('Error details:', error);
      return { success: false, error: error.message };
    }
  },

  // Test password reset with code
  async testPasswordReset(email: string, code: string, newPassword: string) {
    console.log('=== TESTING PASSWORD RESET ===');
    console.log('Email:', email);
    console.log('Code:', code);
    console.log('New password length:', newPassword.length);
    
    try {
      const result = await authService.resetPassword(email, code, newPassword);
      console.log('✅ Password reset SUCCESS:', result);
      return { success: true, data: result };
    } catch (error: any) {
      console.log('❌ Password reset FAILED:', error.message);
      console.log('Error details:', error);
      return { success: false, error: error.message };
    }
  }
};

// Make it available globally for testing - COMMENTED OUT FOR PRODUCTION
if (typeof window !== 'undefined') {
  (window as any).testEmailFunctions = testEmailFunctions;
}
*/