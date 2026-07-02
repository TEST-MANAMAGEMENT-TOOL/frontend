// Test utility to verify user details API is working
import { userService } from '@/services/userService';
import axios from 'axios';

export const testUserDetailsAPI = async () => {
  console.log('=== TESTING USER DETAILS API ===');
  
  // Check token
  const token = localStorage.getItem('token');
  console.log('Token exists:', !!token);
  console.log('Token preview:', token ? `${token.substring(0, 30)}...` : 'null');
  
  if (!token) {
    console.log('❌ No token found - user needs to log in');
    return { success: false, error: 'No token found' };
  }
  
  try {
    // Test 1: Direct API call (like Postman)
    console.log('\n--- Test 1: Direct API Call ---');
    
    const cleanToken = token.replace(/^Bearer\s*/i, '');
    const formattedToken = `Bearer ${cleanToken}`;
    
    const directResponse = await axios.post('https://kiwamitestcloud.com/dashboardapis/api/getuserdetails', {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': formattedToken
      },
      timeout: 10000,
      validateStatus: () => true // Accept all status codes
    });
    
    console.log('Direct API Response:', {
      status: directResponse.status,
      statusText: directResponse.statusText,
      data: directResponse.data
    });
    
    if (directResponse.status === 200) {
      console.log('✅ Direct API call successful');
      const userData = directResponse.data?.data || directResponse.data;
      console.log('User data from direct API:', {
        id: userData?.id || userData?.userid,
        email: userData?.email,
        fullname: userData?.fullname,
        role: userData?.rolename || userData?.role,
        status: userData?.status
      });
    } else {
      console.log('❌ Direct API call failed with status:', directResponse.status);
    }
    
    // Test 2: UserService call
    console.log('\n--- Test 2: UserService Call ---');
    
    const userDetails = await userService.getUserDetails();
    console.log('✅ UserService call successful');
    console.log('Mapped user details:', {
      id: userDetails.id,
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      email: userDetails.email,
      role: userDetails.role,
      isEmailVerified: userDetails.isEmailVerified,
      createdAt: userDetails.createdAt
    });
    
    return {
      success: true,
      directAPI: {
        status: directResponse.status,
        data: directResponse.data
      },
      userService: userDetails
    };
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.log('Error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

export const testTokenFormat = () => {
  console.log('=== TESTING TOKEN FORMAT ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ No token found');
    return { valid: false, reason: 'No token' };
  }
  
  console.log('Token analysis:');
  console.log('- Length:', token.length);
  console.log('- Has Bearer prefix:', token.startsWith('Bearer '));
  console.log('- Preview:', `${token.substring(0, 30)}...`);
  
  // Check if token looks valid
  const cleanToken = token.replace(/^Bearer\s*/i, '');
  const isValidLength = cleanToken.length > 20; // Reasonable token length
  const hasValidChars = /^[A-Za-z0-9_-]+$/.test(cleanToken);
  
  console.log('- Clean token length:', cleanToken.length);
  console.log('- Has valid characters:', hasValidChars);
  console.log('- Appears valid:', isValidLength && hasValidChars);
  
  return {
    valid: isValidLength && hasValidChars,
    hasBearer: token.startsWith('Bearer '),
    length: cleanToken.length,
    preview: `${token.substring(0, 30)}...`
  };
};

// Make functions available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testUserDetailsAPI = testUserDetailsAPI;
  (window as any).testTokenFormat = testTokenFormat;
  
  console.log('🔧 User Details Test Functions Available:');
  console.log('- testUserDetailsAPI() - Test user details API call');
  console.log('- testTokenFormat() - Check token format');
}