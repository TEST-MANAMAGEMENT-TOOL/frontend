// Password reset debugging utility
import { authService } from '@/services/authService';
import { backend_url } from '@/config';

export const debugPasswordResetFlow = async (email: string, code?: string, newPassword?: string) => {
  console.log('🔧 Password Reset Debug Flow Started');
  console.log('🔧 Backend URL:', backend_url);
  console.log('🔧 Email:', email);
  
  const token = authService.getToken();
  console.log('🔧 Current token exists:', !!token);

  // Step 1: Test password reset request
  if (!code) {
    console.log('\n📧 Step 1: Testing password reset request...');
    try {
      const resetResult = await authService.requestPasswordReset(email);
      console.log('✅ Password reset request successful:', resetResult);
      console.log('💡 Check your email for the verification code, then run:');
      console.log(`debugPasswordResetFlow("${email}", "YOUR_CODE", "newPassword123!")`);
      return { step: 1, success: true, result: resetResult };
    } catch (error) {
      console.error('❌ Password reset request failed:', error);
      return { step: 1, success: false, error: error };
    }
  }

  // Step 2: Test code verification (if code provided but no password)
  if (code && !newPassword) {
    console.log('\n🔍 Step 2: Testing code verification...');
    try {
      const verifyResult = await authService.verifyPasswordResetCode(email, code);
      console.log('✅ Code verification successful:', verifyResult);
      console.log('💡 Now run with a new password:');
      console.log(`debugPasswordResetFlow("${email}", "${code}", "newPassword123!")`);
      return { step: 2, success: true, result: verifyResult };
    } catch (error) {
      console.error('❌ Code verification failed:', error);
      return { step: 2, success: false, error: error };
    }
  }

  // Step 3: Test complete password reset
  if (code && newPassword) {
    console.log('\n🔐 Step 3: Testing complete password reset...');
    try {
      const resetResult = await authService.resetPassword(email, code, newPassword);
      console.log('✅ Password reset successful:', resetResult);
      
      // Wait a moment then test login
      console.log('\n⏳ Waiting 3 seconds before testing login...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('\n🔑 Step 4: Testing login with new password...');
      try {
        const loginResult = await authService.login({ email, password: newPassword });
        console.log('✅ Login with new password successful:', loginResult);
        return { 
          step: 4, 
          success: true, 
          resetResult, 
          loginResult,
          message: 'Password reset and login both successful!' 
        };
      } catch (loginError) {
        console.error('❌ Login with new password failed:', loginError);
        console.log('💡 This suggests the password may not have been updated in the database');
        console.log('💡 Try waiting longer (1-2 minutes) and then attempt login manually');
        return { 
          step: 4, 
          success: false, 
          resetResult, 
          loginError,
          message: 'Password reset succeeded but login failed - database may need time to update' 
        };
      }
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      return { step: 3, success: false, error: error };
    }
  }

  console.log('💡 Usage:');
  console.log('1. debugPasswordResetFlow("email@example.com") - Request reset code');
  console.log('2. debugPasswordResetFlow("email@example.com", "CODE") - Verify code');
  console.log('3. debugPasswordResetFlow("email@example.com", "CODE", "newPassword") - Complete reset');
};

export const testLoginEndpoints = async (email: string, password: string) => {
  console.log('🔧 Testing different login endpoints...');
  
  const endpoints = [
    { name: 'User Store (/login)', url: `${backend_url}/login` }
  ];

  const results: any[] = [];

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing ${endpoint.name}: ${endpoint.url}`);
    
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      console.log(`📊 ${endpoint.name} - Status: ${response.status}`);
      console.log(`📊 ${endpoint.name} - Response:`, responseData);

      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        success: response.ok,
        hasToken: !!(responseData?.token || responseData?.access_token),
        response: responseData
      });

    } catch (error) {
      console.error(`❌ ${endpoint.name} failed:`, error);
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: 'error',
        success: false,
        error: error
      });
    }
  }

  console.log('\n📋 Login Endpoints Summary:');
  console.table(results);
  
  return results;
};

export const checkPasswordUpdateStatus = async (email: string) => {
  console.log('🔧 Checking password update status...');
  
  // Try to get user details to see if account exists and is active
  try {
    const response = await fetch(`${backend_url}/getuserdetails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log('📊 User details response:', responseData);
    
    if (response.ok && responseData?.data) {
      const user = responseData.data;
      console.log('✅ User found:', {
        id: user.id || user.userid,
        email: user.email,
        status: user.status,
        updated_at: user.updated_at,
        created_at: user.created_at
      });
      
      return { success: true, user: user };
    } else {
      console.log('❌ User not found or error:', responseData);
      return { success: false, error: responseData };
    }
    
  } catch (error) {
    console.error('❌ Error checking user details:', error);
    return { success: false, error: error };
  }
};

// Make functions available globally
if (typeof window !== 'undefined') {
  (window as any).debugPasswordResetFlow = debugPasswordResetFlow;
  (window as any).testLoginEndpoints = testLoginEndpoints;
  (window as any).checkPasswordUpdateStatus = checkPasswordUpdateStatus;
  
  console.log('🔧 Password Reset Debug Tools Available:');
  console.log('- debugPasswordResetFlow(email, code?, newPassword?) - Test complete flow');
  console.log('- testLoginEndpoints(email, password) - Test different login endpoints');
  console.log('- checkPasswordUpdateStatus(email) - Check if user account exists');
}