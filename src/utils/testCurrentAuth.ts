// Test utility to check current authentication status
import axios from 'axios';
import { authService } from '@/services/authService';

export const testCurrentAuthStatus = async () => {
  console.log('=== TESTING CURRENT AUTHENTICATION STATUS ===');
  
  // Check token in localStorage
  const token = localStorage.getItem('token');
  console.log('Token in localStorage:', token ? `${token.substring(0, 30)}...` : 'null');
  
  if (!token) {
    console.log('❌ No token found - user needs to log in');
    return { authenticated: false, reason: 'No token found' };
  }
  
  // Check token format
  const hasBearer = token.startsWith('Bearer ');
  console.log('Token has Bearer prefix:', hasBearer);
  
  // Test token with projects API
  console.log('\n--- Testing Token with Projects API ---');
  try {
    const cleanToken = token.replace(/^Bearer\s*/i, '');
    const formattedToken = `Bearer ${cleanToken}`;
    
    const response = await axios.get('https://kiwamitestcloud.com/dashboardapis/api/projects', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': formattedToken
      },
      timeout: 10000,
      validateStatus: () => true // Accept all status codes
    });
    
    console.log('Projects API test result:', {
      status: response.status,
      statusText: response.statusText,
      hasData: !!response.data,
      dataType: typeof response.data
    });
    
    if (response.status === 200) {
      console.log('✅ Token is valid - projects API accessible');
      return { authenticated: true, tokenValid: true };
    } else if (response.status === 401) {
      console.log('❌ Token is invalid or expired - 401 Unauthorized');
      return { authenticated: false, reason: 'Token invalid/expired', status: 401 };
    } else {
      console.log('⚠️ Unexpected status:', response.status);
      return { authenticated: false, reason: `Unexpected status: ${response.status}`, status: response.status };
    }
    
  } catch (error: any) {
    console.error('❌ Error testing token:', error.message);
    return { authenticated: false, reason: 'Network error', error: error.message };
  }
};

export const testUserDetailsAPI = async () => {
  console.log('\n=== TESTING USER DETAILS API ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ No token found');
    return { success: false, reason: 'No token' };
  }
  
  try {
    const cleanToken = token.replace(/^Bearer\s*/i, '');
    const formattedToken = `Bearer ${cleanToken}`;
    
    const response = await axios.post('https://kiwamitestcloud.com/dashboardapis/api/getuserdetails', {}, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': formattedToken
      },
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log('User details API result:', {
      status: response.status,
      statusText: response.statusText,
      hasData: !!response.data,
      data: response.data
    });
    
    if (response.status === 200) {
      console.log('✅ User details API accessible');
      const userData = response.data?.data || response.data;
      console.log('User info:', {
        id: userData?.id || userData?.userid,
        email: userData?.email,
        fullname: userData?.fullname,
        role: userData?.rolename || userData?.role
      });
      return { success: true, userData };
    } else {
      console.log('❌ User details API failed:', response.status);
      return { success: false, status: response.status, data: response.data };
    }
    
  } catch (error: any) {
    console.error('❌ Error testing user details API:', error.message);
    return { success: false, error: error.message };
  }
};

export const refreshAuthToken = async () => {
  console.log('\n=== ATTEMPTING TOKEN REFRESH ===');
  
  try {
    const newToken = await authService.refreshToken();
    if (newToken) {
      console.log('✅ Token refreshed successfully');
      return { success: true, token: `${newToken.substring(0, 30)}...` };
    } else {
      console.log('❌ Token refresh failed');
      return { success: false, reason: 'Refresh returned null' };
    }
  } catch (error: any) {
    console.error('❌ Token refresh error:', error.message);
    return { success: false, error: error.message };
  }
};

export const fullAuthDiagnostic = async () => {
  console.log('=== FULL AUTHENTICATION DIAGNOSTIC ===');
  
  const results = {
    authStatus: await testCurrentAuthStatus(),
    userDetails: await testUserDetailsAPI(),
    tokenRefresh: null as any
  };
  
  // If token is invalid, try refreshing
  if (!results.authStatus.authenticated) {
    console.log('\n--- Attempting Token Refresh ---');
    results.tokenRefresh = await refreshAuthToken();
    
    // If refresh succeeded, test again
    if (results.tokenRefresh.success) {
      console.log('\n--- Re-testing After Refresh ---');
      results.authStatus = await testCurrentAuthStatus();
      results.userDetails = await testUserDetailsAPI();
    }
  }
  
  console.log('\n=== DIAGNOSTIC SUMMARY ===');
  console.log('Authentication Status:', results.authStatus.authenticated ? '✅ Valid' : '❌ Invalid');
  console.log('User Details Access:', results.userDetails.success ? '✅ Working' : '❌ Failed');
  console.log('Token Refresh:', results.tokenRefresh ? (results.tokenRefresh.success ? '✅ Working' : '❌ Failed') : '⏭️ Skipped');
  
  return results;
};

// Make functions available globally (commented out for production)
/*
if (typeof window !== 'undefined') {
  (window as any).testCurrentAuthStatus = testCurrentAuthStatus;
  (window as any).testUserDetailsAPI = testUserDetailsAPI;
  (window as any).refreshAuthToken = refreshAuthToken;
  (window as any).fullAuthDiagnostic = fullAuthDiagnostic;
  
  console.log('🔧 Auth Test Functions Available:');
  console.log('- testCurrentAuthStatus() - Check if current token is valid');
  console.log('- testUserDetailsAPI() - Test user details endpoint');
  console.log('- refreshAuthToken() - Try to refresh the token');
  console.log('- fullAuthDiagnostic() - Run complete auth diagnostic');
}
*/