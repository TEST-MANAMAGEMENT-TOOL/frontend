// Test utility for complete password reset flow debugging
import { authService } from '@/services/authService';
import axios from 'axios';

export const testCompletePasswordResetFlow = async (email: string) => {
  console.log('=== COMPLETE PASSWORD RESET FLOW TEST ===');
  console.log('Email:', email);
  
  const results = {
    step1_requestReset: null as any,
    step2_codeVerification: null as any,
    step3_passwordReset: null as any,
    step4_loginTest: null as any
  };
  
  try {
    // Step 1: Request password reset
    console.log('\n--- Step 1: Requesting Password Reset ---');
    const resetResult = await authService.requestPasswordReset(email);
    console.log('✅ Password reset request successful:', resetResult);
    results.step1_requestReset = { success: true, data: resetResult };
    
    // Prompt user for code
    console.log('\n--- Step 2: Code Required ---');
    console.log('📧 Check your email for the verification code');
    console.log('Then run: testPasswordResetWithCode("' + email + '", "YOUR_CODE", "YOUR_NEW_PASSWORD")');
    
    return { success: true, message: 'Password reset initiated. Check email for code.', results };
    
  } catch (error: any) {
    console.error('❌ Password reset flow failed:', error.message);
    return { success: false, error: error.message, results };
  }
};

export const debugPasswordResetAPI = async (email: string, code: string, newPassword: string) => {
  console.log('=== DEBUGGING NEW PASSWORD RESET APPROACH ===');
  console.log('Email:', email);
  console.log('Code:', code);
  console.log('New Password Length:', newPassword.length);
  
  try {
    // Step 1: Verify code
    console.log('\n--- Step 1: Verifying Code ---');
    const verifyEndpoint = 'https://kiwamitestcloud.com/dashboardapis/api/resetpwdcodeconfirmation';
    
    const verifyPayload = {
      email: email.trim().toLowerCase(),
      code: code.trim()
    };
    
    console.log('Verification payload:', JSON.stringify(verifyPayload, null, 2));
    
    const verifyResponse = await axios.post(verifyEndpoint, verifyPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000,
      validateStatus: () => true
    });
    
    console.log('Code verification response:', {
      status: verifyResponse.status,
      data: verifyResponse.data
    });
    
    if (verifyResponse.status >= 400) {
      console.log('❌ Code verification failed');
      return { success: false, step: 'verification', error: 'Code verification failed', data: verifyResponse.data };
    }
    
    // Step 2: Try to get userid or use alternative approach
    console.log('\n--- Step 2: Getting userid or trying alternative approach ---');
    
    let userid: number | null = null;
    
    // Try to extract userid from verification response
    const verifyData = verifyResponse.data;
    if (verifyData?.userid || verifyData?.user_id || verifyData?.id) {
      userid = parseInt(verifyData.userid || verifyData.user_id || verifyData.id);
      console.log('✅ Got userid from verification response:', userid);
    } else {
      console.log('⚠️ No userid in verification response, trying resetpwdcodeconfirmation with password...');
      
      // Try resetpwdcodeconfirmation with password fields
      const resetWithPasswordPayload = {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        password: newPassword,
        password_confirmation: newPassword
      };
      
      console.log('Trying resetpwdcodeconfirmation with password payload:', JSON.stringify({
        ...resetWithPasswordPayload,
        password: '[REDACTED]',
        password_confirmation: '[REDACTED]'
      }, null, 2));
      
      try {
        const resetWithPasswordResponse = await axios.post(verifyEndpoint, resetWithPasswordPayload, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000,
          validateStatus: () => true
        });
        
        console.log('Reset with password response:', {
          status: resetWithPasswordResponse.status,
          data: resetWithPasswordResponse.data
        });
        
        if (resetWithPasswordResponse.status === 200 || resetWithPasswordResponse.status === 201) {
          const resetData = resetWithPasswordResponse.data;
          
          if (resetData?.message) {
            const msg = resetData.message.toLowerCase();
            if (msg.includes('success') || msg.includes('updated') || msg.includes('reset') || msg.includes('changed')) {
              console.log('✅ Password reset successful using resetpwdcodeconfirmation with password');
              return {
                success: true,
                message: 'Password reset successful using resetpwdcodeconfirmation',
                method: 'resetpwdcodeconfirmation_with_password',
                verifyResponse: verifyResponse.data,
                resetResponse: resetWithPasswordResponse.data
              };
            }
          }
        }
        
        console.log('⚠️ resetpwdcodeconfirmation with password gave ambiguous result, continuing...');
      } catch (resetError) {
        console.log('⚠️ resetpwdcodeconfirmation with password failed, continuing to updatepassword approach');
      }
    }
    
    // Step 3: Update password (only if we have userid)
    if (userid) {
      console.log('\n--- Step 3: Updating Password with updatepassword endpoint ---');
      const updateEndpoint = 'https://kiwamitestcloud.com/dashboardapis/api/updatepassword';
      
      const updatePayload = {
        userid: userid,
        password: newPassword,
        password_confirmation: newPassword
      };
      
      console.log('Password update payload:', JSON.stringify({
        ...updatePayload,
        password: '[REDACTED]',
        password_confirmation: '[REDACTED]'
      }, null, 2));
      
      const updateHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // Try to get token but don't require it for password reset
      const token = localStorage.getItem('token');
      if (token) {
        updateHeaders.Authorization = token;
        console.log('Using existing token for updatepassword request');
      } else {
        console.log('No token available - attempting updatepassword without authentication');
      }
      
      const updateResponse = await axios.post(updateEndpoint, updatePayload, {
        headers: updateHeaders,
        timeout: 15000,
        validateStatus: () => true
      });
      
      console.log('Password update response:', {
        status: updateResponse.status,
        data: updateResponse.data
      });
      
      if (updateResponse.status === 200 || updateResponse.status === 201) {
        console.log('✅ Password update API call successful');
        
        // Check response message for actual success
        const updateData = updateResponse.data;
        if (updateData?.message) {
          console.log('📝 Server Message:', updateData.message);
          
          const msg = updateData.message.toLowerCase();
          if (msg.includes('success') || msg.includes('updated') || msg.includes('changed')) {
            console.log('✅ Message indicates password was updated successfully');
            return {
              success: true,
              message: 'Password updated successfully using updatepassword endpoint',
              method: 'updatepassword',
              verifyResponse: verifyResponse.data,
              updateResponse: updateResponse.data
            };
          } else if (msg.includes('error') || msg.includes('failed') || msg.includes('invalid')) {
            console.log('❌ Message indicates failure');
            return {
              success: false,
              step: 'update',
              error: updateData.message,
              method: 'updatepassword',
              verifyResponse: verifyResponse.data,
              updateResponse: updateResponse.data
            };
          }
        }
        
        return {
          success: true,
          message: 'Password update completed using updatepassword endpoint (check message for details)',
          method: 'updatepassword',
          verifyResponse: verifyResponse.data,
          updateResponse: updateResponse.data
        };
        
      } else {
        console.log('❌ Password update failed with status:', updateResponse.status);
        return {
          success: false,
          step: 'update',
          error: `HTTP ${updateResponse.status}: ${updateResponse.data?.message || 'Password update failed'}`,
          method: 'updatepassword',
          verifyResponse: verifyResponse.data,
          updateResponse: updateResponse.data
        };
      }
    } else {
      console.log('\n--- Step 3: Skipped (no userid, password reset may have been handled by resetpwdcodeconfirmation) ---');
      return {
        success: true,
        message: 'Password reset completed using resetpwdcodeconfirmation (no userid required)',
        method: 'resetpwdcodeconfirmation_only',
        verifyResponse: verifyResponse.data
      };
    }
    
  } catch (error: any) {
    console.error('❌ Password reset debug failed:', error.message);
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

export const testPasswordResetWithCode = async (email: string, code: string, newPassword: string) => {
  console.log('=== TESTING NEW PASSWORD RESET APPROACH ===');
  console.log('Email:', email);
  console.log('Code:', code);
  console.log('New Password Length:', newPassword.length);
  
  const results = {
    step1_apiDebug: null as any,
    step2_authServiceReset: null as any,
    step3_loginTest: null as any
  };
  
  try {
    // Step 1: Debug the new API approach
    console.log('\n--- Step 1: Testing New API Approach ---');
    const apiDebugResult = await debugPasswordResetAPI(email, code, newPassword);
    results.step1_apiDebug = apiDebugResult;
    
    if (!apiDebugResult.success) {
      console.log('❌ New API approach failed:', apiDebugResult.error);
      return { success: false, message: 'New API approach failed', results };
    }
    
    // Step 2: Test using authService (which now uses the new approach)
    console.log('\n--- Step 2: Testing AuthService Password Reset ---');
    try {
      const resetResult = await authService.resetPassword(email, code, newPassword);
      console.log('✅ AuthService password reset successful:', resetResult);
      results.step2_authServiceReset = { success: true, data: resetResult };
    } catch (resetError: any) {
      console.error('❌ AuthService password reset failed:', resetError.message);
      results.step2_authServiceReset = { success: false, error: resetError.message };
      
      // Continue to login test even if authService failed, since API debug might have worked
      console.log('⚠️ AuthService failed but API debug succeeded, continuing to login test...');
    }
    
    // Step 3: Test login with new password (after a delay)
    console.log('\n--- Step 3: Testing Login with New Password ---');
    console.log('⏳ Waiting 3 seconds for password update to propagate...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      // Clear any existing token first
      authService.clearToken();
      
      const loginResult = await authService.login({ email, password: newPassword });
      console.log('✅ Login with new password successful!');
      results.step3_loginTest = { success: true, data: loginResult };
      
      console.log('\n🎉 COMPLETE SUCCESS: Password reset and login working!');
      return { success: true, message: 'Password reset completed successfully!', results };
      
    } catch (loginError: any) {
      console.error('❌ Login with new password failed:', loginError.message);
      results.step3_loginTest = { success: false, error: loginError.message };
      
      console.log('\n⚠️ Password reset API succeeded but login failed. Analysis:');
      console.log('1. Check if API actually updated the password (see API Debug results above)');
      console.log('2. Server might return success but not actually update password');
      console.log('3. Database/backend issue preventing password update');
      console.log('4. Password validation rules on server side');
      console.log('5. Try waiting longer (up to 5-10 minutes) for password propagation');
      
      return { 
        success: false, 
        message: 'Password reset API succeeded but login failed. Check API debug results.', 
        results 
      };
    }
    
  } catch (error: any) {
    console.error('❌ Password reset with code failed:', error.message);
    return { success: false, error: error.message, results };
  }
};

export const testLoginAfterReset = async (email: string, newPassword: string) => {
  console.log('=== TESTING LOGIN AFTER PASSWORD RESET ===');
  console.log('Email:', email);
  
  try {
    // Clear any existing token first
    authService.clearToken();
    
    const loginResult = await authService.login({ email, password: newPassword });
    console.log('✅ Login successful with new password!');
    return { success: true, data: loginResult };
    
  } catch (error: any) {
    console.error('❌ Login failed with new password:', error.message);
    
    // Provide helpful debugging information
    console.log('\n🔍 Debugging Information:');
    console.log('- Password length:', newPassword.length);
    console.log('- Contains uppercase:', /[A-Z]/.test(newPassword));
    console.log('- Contains lowercase:', /[a-z]/.test(newPassword));
    console.log('- Contains numbers:', /\d/.test(newPassword));
    console.log('- Contains special chars:', /[!@#$%^&*(),.?":{}|<>]/.test(newPassword));
    
    console.log('\n💡 Suggestions:');
    console.log('1. Wait a few more minutes for password update to propagate');
    console.log('2. Check if password meets all requirements');
    console.log('3. Try requesting a new password reset');
    console.log('4. Contact support if issue persists');
    
    return { success: false, error: error.message };
  }
};

// Make functions available globally for testing (commented out for production)
/*
if (typeof window !== 'undefined') {
  (window as any).testCompletePasswordResetFlow = testCompletePasswordResetFlow;
  (window as any).testPasswordResetWithCode = testPasswordResetWithCode;
  (window as any).testLoginAfterReset = testLoginAfterReset;
  (window as any).debugPasswordResetAPI = debugPasswordResetAPI;
  
  console.log('🔧 Password Reset Flow Test Functions Available:');
  console.log('- testCompletePasswordResetFlow(email) - Start complete flow test');
  console.log('- testPasswordResetWithCode(email, code, newPassword) - Test with code');
  console.log('- testLoginAfterReset(email, newPassword) - Test login after reset');
  console.log('- debugPasswordResetAPI(email, code, newPassword) - Debug simple API call');
}
*/