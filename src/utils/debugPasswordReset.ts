// Debug utility for password reset API testing - COMMENTED OUT FOR PRODUCTION
/*
import axios from 'axios';

export const debugPasswordResetFlow = async (email: string, testCode: string = '123456') => {
  console.log('=== PASSWORD RESET FLOW DEBUG ===');
  console.log('Email:', email);
  console.log('Test Code:', testCode);
  
  const baseUrl = 'https://kiwamitestcloud.com/dashboardapis/api';
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (token) {
    headers.Authorization = token;
  }
  
  console.log('Headers:', headers);
  
  // Step 1: Request password reset code
  console.log('\n--- Step 1: Request Password Reset Code ---');
  try {
    const resetResponse = await axios.post(`${baseUrl}/resetpassword`, { email }, {
      headers,
      timeout: 15000,
      validateStatus: () => true
    });
    
    console.log('Reset Request Response:', {
      status: resetResponse.status,
      statusText: resetResponse.statusText,
      data: resetResponse.data
    });
    
    if (resetResponse.status >= 400) {
      console.log('❌ Reset request failed');
      return { step1: false };
    }
    
    console.log('✅ Reset request successful');
    
  } catch (error: any) {
    console.log('❌ Reset request error:', error.message);
    return { step1: false, error: error.message };
  }
  
  // Step 2: Test code verification (without password)
  console.log('\n--- Step 2: Test Code Verification (No Password) ---');
  try {
    const verifyResponse = await axios.post(`${baseUrl}/resetpwdcodeconfirmation`, {
      email: email.trim().toLowerCase(),
      code: testCode.trim()
    }, {
      headers,
      timeout: 15000,
      validateStatus: () => true
    });
    
    console.log('Code Verification Response (No Password):', {
      status: verifyResponse.status,
      statusText: verifyResponse.statusText,
      data: verifyResponse.data
    });
    
    if (verifyResponse.status >= 400) {
      console.log('❌ Code verification (no password) failed');
    } else {
      console.log('✅ Code verification (no password) successful');
    }
    
  } catch (error: any) {
    console.log('❌ Code verification (no password) error:', error.message);
  }
  
  // Step 3: Test code verification with dummy password
  console.log('\n--- Step 3: Test Code Verification (With Dummy Password) ---');
  try {
    const verifyWithPasswordResponse = await axios.post(`${baseUrl}/resetpwdcodeconfirmation`, {
      email: email.trim().toLowerCase(),
      code: testCode.trim(),
      password: 'TempPassword123!'
    }, {
      headers,
      timeout: 15000,
      validateStatus: () => true
    });
    
    console.log('Code Verification Response (With Password):', {
      status: verifyWithPasswordResponse.status,
      statusText: verifyWithPasswordResponse.statusText,
      data: verifyWithPasswordResponse.data
    });
    
    if (verifyWithPasswordResponse.status >= 400) {
      console.log('❌ Code verification (with password) failed');
    } else {
      console.log('✅ Code verification (with password) successful');
    }
    
  } catch (error: any) {
    console.log('❌ Code verification (with password) error:', error.message);
  }
  
  // Step 4: Test with different codes to see validation behavior
  console.log('\n--- Step 4: Test Invalid Codes ---');
  const invalidCodes = ['000000', '999999', 'ABCDEF', '12345', '1234567'];
  
  for (const invalidCode of invalidCodes) {
    console.log(`\nTesting invalid code: ${invalidCode}`);
    try {
      const invalidResponse = await axios.post(`${baseUrl}/resetpwdcodeconfirmation`, {
        email: email.trim().toLowerCase(),
        code: invalidCode
      }, {
        headers,
        timeout: 15000,
        validateStatus: () => true
      });
      
      console.log(`Invalid code ${invalidCode} response:`, {
        status: invalidResponse.status,
        data: invalidResponse.data
      });
      
      if (invalidResponse.status < 400) {
        console.log(`⚠️ WARNING: Invalid code ${invalidCode} was accepted!`);
      } else {
        console.log(`✅ Invalid code ${invalidCode} was correctly rejected`);
      }
      
    } catch (error: any) {
      console.log(`✅ Invalid code ${invalidCode} was correctly rejected:`, error.message);
    }
  }
  
  console.log('\n=== DEBUG COMPLETE ===');
  console.log('Check the responses above to understand the API behavior');
  
  return { completed: true };
};

// Test with a real code from email
export const testRealCode = async (email: string, realCode: string) => {
  console.log('=== TESTING REAL CODE ===');
  console.log('Email:', email);
  console.log('Real Code:', realCode);
  
  const endpoint = 'https://kiwamitestcloud.com/dashboardapis/api/resetpwdcodeconfirmation';
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (token) {
    headers.Authorization = token;
  }
  
  // Test 1: Code only
  console.log('\n--- Test 1: Code Only ---');
  try {
    const response1 = await axios.post(endpoint, {
      email: email.trim().toLowerCase(),
      code: realCode.trim()
    }, {
      headers,
      timeout: 15000,
      validateStatus: () => true
    });
    
    console.log('Code Only Response:', {
      status: response1.status,
      statusText: response1.statusText,
      data: response1.data
    });
    
  } catch (error: any) {
    console.log('Code Only Error:', error.message);
  }
  
  // Test 2: Code with password
  console.log('\n--- Test 2: Code With Password ---');
  try {
    const response2 = await axios.post(endpoint, {
      email: email.trim().toLowerCase(),
      code: realCode.trim(),
      password: 'NewPassword123!'
    }, {
      headers,
      timeout: 15000,
      validateStatus: () => true
    });
    
    console.log('Code With Password Response:', {
      status: response2.status,
      statusText: response2.statusText,
      data: response2.data
    });
    
  } catch (error: any) {
    console.log('Code With Password Error:', error.message);
  }
  
  return { completed: true };
};

// Make functions available globally for browser console testing - COMMENTED OUT FOR PRODUCTION
if (typeof window !== 'undefined') {
  (window as any).debugPasswordResetFlow = debugPasswordResetFlow;
  (window as any).testRealCode = testRealCode;
  
  console.log('Password reset debug functions available:');
  console.log('- debugPasswordResetFlow(email, testCode)');
  console.log('- testRealCode(email, realCode)');
}
*/