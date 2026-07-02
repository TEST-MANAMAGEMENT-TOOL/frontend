// Test utility to debug projects and testcases authentication issues
import axios from 'axios';
import { authService } from '@/services/authService';

// Fix malformed tokens in localStorage
export const fixTokenFormat = () => {
  console.log('=== FIXING TOKEN FORMAT ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No token found to fix');
    return;
  }
  
  console.log('Original token:', token);
  console.log('Has Bearer prefix:', token.startsWith('Bearer '));
  
  if (!token.startsWith('Bearer ')) {
    console.log('Token missing Bearer prefix - fixing...');
    const fixedToken = `Bearer ${token}`;
    localStorage.setItem('token', fixedToken);
    console.log('✅ Token fixed:', fixedToken);
    
    // Also update axios defaults
    axios.defaults.headers.common['Authorization'] = fixedToken;
    console.log('✅ Axios defaults updated');
    
    return fixedToken;
  } else {
    console.log('✅ Token format is correct');
    return token;
  }
};

export const testProjectsAuth = async () => {
  console.log('=== TESTING PROJECTS & TESTCASES AUTHENTICATION ===');
  
  const token = localStorage.getItem('token');
  console.log('Current token:', token);
  console.log('Token exists:', !!token);
  
  if (!token) {
    console.error('❌ No token found in localStorage');
    return { success: false, error: 'No token found' };
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': token
  };
  
  console.log('Request headers:', headers);
  
  // Test Projects endpoint
  console.log('\n--- Testing Projects Endpoint ---');
  try {
    const projectsResponse = await axios.get('https://kiwamitestcloud.com/dashboardapis/api/projects', {
      headers,
      timeout: 15000
    });
    
    console.log('✅ Projects API Success:', {
      status: projectsResponse.status,
      statusText: projectsResponse.statusText,
      dataType: typeof projectsResponse.data,
      hasDetails: !!projectsResponse.data?.details,
      detailsLength: Array.isArray(projectsResponse.data?.details) ? projectsResponse.data.details.length : 'N/A'
    });
    
  } catch (error: any) {
    console.error('❌ Projects API Failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }
  
  // Test TestCases endpoint
  console.log('\n--- Testing TestCases Endpoint ---');
  try {
    const testcasesResponse = await axios.get('https://kiwamitestcloud.com/dashboardapis/api/testcases', {
      headers,
      timeout: 15000
    });
    
    console.log('✅ TestCases API Success:', {
      status: testcasesResponse.status,
      statusText: testcasesResponse.statusText,
      dataType: typeof testcasesResponse.data,
      hasDetails: !!testcasesResponse.data?.details,
      detailsLength: Array.isArray(testcasesResponse.data?.details) ? testcasesResponse.data.details.length : 'N/A'
    });
    
  } catch (error: any) {
    console.error('❌ TestCases API Failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }
  
  // Test token validation with user details endpoint
  console.log('\n--- Testing Token Validation ---');
  try {
    const userResponse = await axios.post('https://kiwamitestcloud.com/dashboardapis/api/getuserdetails', {}, {
      headers,
      timeout: 15000
    });
    
    console.log('✅ User Details API Success:', {
      status: userResponse.status,
      statusText: userResponse.statusText,
      hasData: !!userResponse.data?.data,
      userEmail: userResponse.data?.data?.email
    });
    
  } catch (error: any) {
    console.error('❌ User Details API Failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      console.log('🔑 Token appears to be invalid or expired');
      console.log('💡 Try logging out and logging back in');
    }
  }
  
  console.log('\n=== TEST COMPLETE ===');
  return { success: true };
};

// Test with different token formats
export const testTokenFormats = async () => {
  console.log('=== TESTING TOKEN FORMATS ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token to test');
    return;
  }
  
  console.log('Original token:', token);
  console.log('Token starts with Bearer:', token.startsWith('Bearer '));
  
  // Test different formats
  const formats = [
    { name: 'Original', value: token },
    { name: 'Without Bearer', value: token.replace(/^Bearer\s*/i, '') },
    { name: 'With Bearer (forced)', value: `Bearer ${token.replace(/^Bearer\s*/i, '')}` }
  ];
  
  for (const format of formats) {
    console.log(`\n--- Testing ${format.name} Format ---`);
    console.log('Token:', format.value);
    
    try {
      const response = await axios.post('https://kiwamitestcloud.com/dashboardapis/api/getuserdetails', {}, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': format.value
        },
        timeout: 10000
      });
      
      console.log(`✅ ${format.name} format works:`, response.status);
      
    } catch (error: any) {
      console.log(`❌ ${format.name} format failed:`, error.response?.status, error.response?.statusText);
    }
  }
};

// Make functions available globally for testing (commented out for production)
/*
if (typeof window !== 'undefined') {
  (window as any).testProjectsAuth = testProjectsAuth;
  (window as any).testTokenFormats = testTokenFormats;
  (window as any).fixTokenFormat = fixTokenFormat;
  
  console.log('🔧 Projects auth test functions available:');
  console.log('- testProjectsAuth() - Test projects and testcases endpoints');
  console.log('- testTokenFormats() - Test different token formats');
  console.log('- fixTokenFormat() - Fix malformed tokens in localStorage');
}
*/