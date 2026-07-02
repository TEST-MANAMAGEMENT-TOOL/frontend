// Quick test for password reset functionality - COMMENTED OUT FOR PRODUCTION
/*
import { authService } from '@/services/authService';

export const quickPasswordResetTest = async (email: string) => {
  console.log('=== QUICK PASSWORD RESET TEST ===');
  console.log('Email:', email);
  
  try {
    // Step 1: Request password reset
    console.log('\n--- Step 1: Requesting password reset code ---');
    const resetResult = await authService.requestPasswordReset(email);
    console.log('✅ Password reset request successful:', resetResult);
    
    // Step 2: Prompt for code
    console.log('\n--- Step 2: Code verification ---');
    console.log('Check your email for the verification code, then run:');
    console.log(`testPasswordResetCode("${email}", "YOUR_CODE_HERE")`);
    
    return { success: true, message: 'Password reset code sent. Check your email.' };
    
  } catch (error: any) {
    console.error('❌ Password reset request failed:', error.message);
    return { success: false, error: error.message };
  }
};

export const testPasswordResetCode = async (email: string, code: string) => {
  console.log('=== TESTING PASSWORD RESET CODE ===');
  console.log('Email:', email);
  console.log('Code:', code);
  
  try {
    // Test code verification
    console.log('\n--- Testing code verification ---');
    const verifyResult = await authService.verifyPasswordResetCode(email, code);
    console.log('✅ Code verification result:', verifyResult);
    
    if (verifyResult?.skipVerification) {
      console.log('⚠️ Code verification was skipped - will validate during password reset');
      console.log('This is expected if the API requires password field for verification');
    }
    
    // Test actual password reset
    console.log('\n--- Testing password reset ---');
    const testPassword = 'TestPassword123!';
    console.log('Using test password:', testPassword);
    
    const resetResult = await authService.resetPassword(email, code, testPassword);
    console.log('✅ Password reset successful:', resetResult);
    
    return { success: true, message: 'Password reset completed successfully!' };
    
  } catch (error: any) {
    console.error('❌ Password reset failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Make functions available globally - COMMENTED OUT FOR PRODUCTION
if (typeof window !== 'undefined') {
  (window as any).quickPasswordResetTest = quickPasswordResetTest;
  (window as any).testPasswordResetCode = testPasswordResetCode;
  
  console.log('Quick password reset test functions available:');
  console.log('- quickPasswordResetTest(email) - Request reset code');
  console.log('- testPasswordResetCode(email, code) - Test code and reset password');
}
*/