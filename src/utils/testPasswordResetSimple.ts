// Simple password reset test that doesn't require authentication
import axios from 'axios';

export const testSimplePasswordReset = async (email: string, code: string, newPassword: string) => {
  console.log('=== SIMPLE PASSWORD RESET TEST (NO AUTH REQUIRED) ===');
  console.log('Email:', email);
  console.log('Code:', code);
  console.log('Password length:', newPassword.length);
  
  // Try the resetpwdcodeconfirmation endpoint with password fields
  // This should work without requiring authentication
  const endpoint = 'https://kiwamitestcloud.com/dashboardapis/api/resetpwdcodeconfirmation';
  
  const payload = {
    email: email.trim().toLowerCase(),
    code: code.trim(),
    password: newPassword,
    password_confirmation: newPassword
  };
  
  console.log('Request payload:', JSON.stringify({
    ...payload,
    password: '[REDACTED]',
    password_confirmation: '[REDACTED]'
  }, null, 2));
  
  try {
    const response = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000,
      validateStatus: () => true // Accept all status codes
    });
    
    console.log('Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    // Analyze the response
    if (response.status === 200 || response.status === 201) {
      console.log('✅ HTTP status indicates success');
      
      const data = response.data;
      if (data?.message) {
        console.log('📝 Server message:', data.message);
        
        const msg = data.message.toLowerCase();
        if (msg.includes('success') || msg.includes('updated') || msg.includes('reset') || msg.includes('changed')) {
          console.log('✅ Message indicates password was updated successfully!');
          
          // Test login immediately
          console.log('\n--- Testing Login with New Password ---');
          return await testLoginWithNewPassword(email, newPassword);
          
        } else if (msg.includes('error') || msg.includes('failed') || msg.includes('invalid') || msg.includes('wrong')) {
          console.log('❌ Message indicates failure:', data.message);
          return { success: false, error: data.message, response: data };
        } else {
          console.log('⚠️ Ambiguous message - trying login test anyway');
          return await testLoginWithNewPassword(email, newPassword);
        }
      } else {
        console.log('⚠️ No message in response - trying login test');
        return await testLoginWithNewPassword(email, newPassword);
      }
    } else {
      console.log('❌ HTTP status indicates failure:', response.status);
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.data?.message || 'Password reset failed'}`,
        response: response.data
      };
    }
    
  } catch (error: any) {
    console.error('❌ Request failed:', error.message);
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      response: error.response?.data
    };
  }
};

const testLoginWithNewPassword = async (email: string, newPassword: string) => {
  console.log('Testing login with new password...');
  
  // Wait a moment for password to propagate
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Import authService dynamically to avoid circular dependencies
    const { authService } = await import('@/services/authService');
    
    // Clear any existing token
    authService.clearToken();
    
    // Try to login
    const loginResult = await authService.login({ email, password: newPassword });
    
    console.log('✅ Login successful with new password!');
    return {
      success: true,
      message: 'Password reset and login both successful!',
      loginResult
    };
    
  } catch (loginError: any) {
    console.error('❌ Login failed with new password:', loginError.message);
    
    console.log('\n💡 Troubleshooting suggestions:');
    console.log('1. Wait 2-5 minutes for password update to propagate');
    console.log('2. Check if the verification code was correct');
    console.log('3. Ensure password meets all requirements');
    console.log('4. Try requesting a new password reset');
    
    return {
      success: false,
      passwordResetSuccess: true, // API call succeeded
      loginFailed: true,
      error: loginError.message,
      suggestion: 'Password reset API succeeded but login failed. Wait a few minutes and try logging in manually.'
    };
  }
};

export const quickPasswordResetTest = async (email: string) => {
  console.log('=== QUICK PASSWORD RESET TEST ===');
  console.log('Email:', email);
  
  // Step 1: Request password reset code
  console.log('\n--- Step 1: Requesting Password Reset Code ---');
  
  try {
    const { authService } = await import('@/services/authService');
    
    const resetResult = await authService.requestPasswordReset(email);
    console.log('✅ Password reset code requested successfully:', resetResult);
    
    console.log('\n📧 Check your email for the verification code');
    console.log('Then run: testSimplePasswordReset("' + email + '", "YOUR_CODE", "YOUR_NEW_PASSWORD")');
    
    return {
      success: true,
      message: 'Password reset initiated. Check email for code.',
      nextStep: `testSimplePasswordReset("${email}", "YOUR_CODE", "YOUR_NEW_PASSWORD")`
    };
    
  } catch (error: any) {
    console.error('❌ Failed to request password reset:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Make functions available globally (commented out for production)
/*
if (typeof window !== 'undefined') {
  (window as any).testSimplePasswordReset = testSimplePasswordReset;
  (window as any).quickPasswordResetTest = quickPasswordResetTest;
  
  console.log('🔧 Simple Password Reset Test Functions Available:');
  console.log('- quickPasswordResetTest(email) - Request reset code');
  console.log('- testSimplePasswordReset(email, code, newPassword) - Complete reset and test login');
  console.log('Example: quickPasswordResetTest("your@email.com")');
}
*/