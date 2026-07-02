// Login debugging utility
import { backend_url } from '@/config';

export const debugLoginFlow = async (email: string, password: string) => {
  console.log('🔧 Login Debug Flow Started');
  console.log('🔧 Backend URL:', backend_url);
  console.log('🔧 Email:', email);
  console.log('🔧 Password length:', password.length);

  // Test all possible login endpoints
  const endpoints = [
    { name: 'Direct Login', url: `${backend_url}/login` },
    { name: 'User Login', url: `${backend_url}/user/login` },
    { name: 'API Login', url: `${backend_url}/api/login` }
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
      console.log(`📊 ${endpoint.name} - Status: ${response.status}`);
      console.log(`📊 ${endpoint.name} - Status Text: ${response.statusText}`);
      console.log(`📊 ${endpoint.name} - Headers:`, Object.fromEntries(response.headers.entries()));
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log(`📊 ${endpoint.name} - Response Data:`, responseData);
      } catch {
        responseData = responseText;
        console.log(`📊 ${endpoint.name} - Response Text:`, responseText.substring(0, 500));
      }

      const hasToken = !!(responseData?.token || responseData?.access_token || responseData?.data?.token);
      const hasUser = !!(responseData?.user || responseData?.data?.user || responseData?.details);

      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        hasToken: hasToken,
        hasUser: hasUser,
        contentType: response.headers.get('content-type'),
        response: responseData
      });

      if (response.ok && hasToken) {
        console.log(`✅ ${endpoint.name} - SUCCESS! Token found`);
      } else if (response.ok) {
        console.log(`⚠️ ${endpoint.name} - Response OK but no token`);
      } else {
        console.log(`❌ ${endpoint.name} - Failed with status ${response.status}`);
      }

    } catch (error) {
      console.error(`❌ ${endpoint.name} - Network error:`, error);
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: 'network_error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  console.log('\n📋 Login Endpoints Summary:');
  console.table(results.map(r => ({
    Endpoint: r.name,
    Status: r.status,
    Success: r.success,
    'Has Token': r.hasToken,
    'Has User': r.hasUser,
    'Content Type': r.contentType
  })));
  
  return results;
};

export const testSpecificCredentials = async (email: string, password: string, endpoint?: string) => {
  const testEndpoint = endpoint || `${backend_url}/login`;
  
  console.log('🔧 Testing specific credentials...');
  console.log('🔧 Endpoint:', testEndpoint);
  console.log('🔧 Email:', email);
  console.log('🔧 Password (first 3 chars):', password.substring(0, 3) + '***');

  try {
    const response = await fetch(testEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const responseText = await response.text();
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('📊 Response Text:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('📊 Parsed Response:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.log('📊 Could not parse as JSON:', parseError);
      responseData = responseText;
    }

    if (response.ok) {
      console.log('✅ Request successful');
      
      const token = responseData?.token || responseData?.access_token || responseData?.data?.token;
      if (token) {
        console.log('✅ Token found:', token.substring(0, 20) + '...');
        return { success: true, token, data: responseData };
      } else {
        console.log('⚠️ No token in successful response');
        return { success: false, error: 'No token in response', data: responseData };
      }
    } else {
      console.log('❌ Request failed');
      const errorMessage = responseData?.message || responseData?.error || `HTTP ${response.status}`;
      return { success: false, error: errorMessage, status: response.status, data: responseData };
    }

  } catch (error) {
    console.error('❌ Network error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
};

export const checkUserExists = async (email: string) => {
  console.log('🔧 Checking if user exists...');
  
  const endpoints = [
    `${backend_url}/getuserdetails`,
    `${backend_url}/user/details`,
    `${backend_url}/users/find`
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Trying ${endpoint}`);
    
    try {
      // Try with email in body
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const responseText = await response.text();
      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log('✅ User found:', data);
          return { success: true, user: data, endpoint };
        } catch {
          console.log('✅ Response OK but not JSON:', responseText.substring(0, 200));
        }
      } else {
        console.log(`❌ Failed: ${response.status} - ${responseText.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`❌ Network error:`, error);
    }
  }

  return { success: false, error: 'User not found in any endpoint' };
};

export const testPasswordResetAndLogin = async (email: string, oldPassword: string, newPassword: string) => {
  console.log('🔧 Testing password reset and login flow...');
  
  // Step 1: Test login with old password
  console.log('\n1️⃣ Testing login with old password...');
  const oldLoginResult = await testSpecificCredentials(email, oldPassword);
  
  if (oldLoginResult.success) {
    console.log('✅ Old password still works - password may not have been changed');
  } else {
    console.log('❌ Old password failed - this is expected after reset');
  }

  // Step 2: Test login with new password
  console.log('\n2️⃣ Testing login with new password...');
  const newLoginResult = await testSpecificCredentials(email, newPassword);
  
  if (newLoginResult.success) {
    console.log('✅ New password works - password reset was successful');
  } else {
    console.log('❌ New password failed - password reset may not have worked');
  }

  // Step 3: Check user exists
  console.log('\n3️⃣ Checking if user account exists...');
  const userExistsResult = await checkUserExists(email);
  
  return {
    oldPasswordWorks: oldLoginResult.success,
    newPasswordWorks: newLoginResult.success,
    userExists: userExistsResult.success,
    oldLoginResult,
    newLoginResult,
    userExistsResult
  };
};

// Make functions available globally
if (typeof window !== 'undefined') {
  (window as any).debugLoginFlow = debugLoginFlow;
  (window as any).testSpecificCredentials = testSpecificCredentials;
  (window as any).checkUserExists = checkUserExists;
  (window as any).testPasswordResetAndLogin = testPasswordResetAndLogin;
  
  console.log('🔧 Login Debug Tools Available:');
  console.log('- debugLoginFlow(email, password) - Test all login endpoints');
  console.log('- testSpecificCredentials(email, password, endpoint?) - Test specific endpoint');
  console.log('- checkUserExists(email) - Check if user account exists');
  console.log('- testPasswordResetAndLogin(email, oldPass, newPass) - Test complete flow');
}