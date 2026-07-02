// Comprehensive email debugging utility - COMMENTED OUT FOR PRODUCTION
/*
import axios from 'axios';

export const debugEmailAPI = async (email: string) => {
  console.log('=== EMAIL API DEBUG ===');
  console.log('Testing email:', email);
  
  const baseUrl = 'https://kiwamitestcloud.com/dashboardapis/api';
  const endpoint = `${baseUrl}/sendemail`; // Using the correct sendemail endpoint
  
  // Get token
  const token = localStorage.getItem('token');
  console.log('Token available:', !!token);
  if (token) {
    console.log('Token preview:', token.substring(0, 30) + '...');
  }
  
  // Test different approaches
  const tests = [
    {
      name: 'Test 1: Correct sendemail payload with auth',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': token })
      },
      payload: { 
        email,
        content: "Please verify your email address by clicking the link below.",
        link: `${window.location.origin}/verify-email`
      }
    },
    {
      name: 'Test 2: Sendemail without auth headers',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      payload: { 
        email,
        content: "Please verify your email address by clicking the link below.",
        link: `${window.location.origin}/verify-email`
      }
    },
    {
      name: 'Test 3: Different content format',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': token })
      },
      payload: { 
        email,
        content: "Hi",
        link: "https://kiwamitestcloud.com"
      }
    }
  ];
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    console.log('Headers:', test.headers);
    console.log('Payload:', test.payload);
    console.log('URL:', endpoint);
    
    try {
      const response = await axios.post(endpoint, test.payload, {
        headers: test.headers,
        timeout: 15000,
        validateStatus: (status) => status < 500
      });
      
      console.log('✅ SUCCESS:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
      
      return { success: true, test: test.name, response: response.data };
      
    } catch (error: any) {
      console.log('❌ FAILED:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });
      
      // Check for specific error types
      if (error.code === 'ERR_NETWORK') {
        console.log('🌐 Network error - possible CORS issue');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('🔌 Connection refused - server might be down');
      } else if (error.response?.status === 401) {
        console.log('🔐 Unauthorized - token issue');
      } else if (error.response?.status === 404) {
        console.log('🔍 Not found - wrong endpoint');
      } else if (error.response?.status === 405) {
        console.log('🚫 Method not allowed - wrong HTTP method');
      }
    }
  }
  
  console.log('\n=== All tests failed ===');
  return { success: false };
};

// Test password reset API
export const debugPasswordResetAPI = async (email: string) => {
  console.log('=== PASSWORD RESET API DEBUG ===');
  console.log('Testing email:', email);
  
  const endpoint = 'https://kiwamitestcloud.com/dashboardapis/api/resetpassword';
  
  // Get token
  const token = localStorage.getItem('token');
  console.log('Token available:', !!token);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (token) {
    headers.Authorization = token;
  }
  
  const payload = { email };
  
  console.log('Headers:', headers);
  console.log('Payload:', payload);
  console.log('URL:', endpoint);
  
  try {
    const response = await axios.post(endpoint, payload, {
      headers,
      timeout: 15000,
      validateStatus: (status) => status < 500
    });
    
    console.log('✅ PASSWORD RESET SUCCESS:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    return { success: true, response: response.data };
    
  } catch (error: any) {
    console.log('❌ PASSWORD RESET FAILED:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });
    
    return { success: false, error };
  }
};

// Test password reset code verification API
export const debugPasswordResetCodeVerificationAPI = async (email: string, code: string = '123456') => {
  console.log('=== PASSWORD RESET CODE VERIFICATION API DEBUG ===');
  console.log('Testing email:', email);
  console.log('Testing code:', code);
  
  const endpoint = 'https://kiwamitestcloud.com/dashboardapis/api/resetpwdcodeconfirmation';
  
  // Get token
  const token = localStorage.getItem('token');
  console.log('Token available:', !!token);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (token) {
    headers.Authorization = token;
  }
  
  const payload = { 
    email: email.trim().toLowerCase(),
    code: code.trim()
  };
  
  console.log('Headers:', headers);
  console.log('Payload:', payload);
  console.log('URL:', endpoint);
  
  try {
    const response = await axios.post(endpoint, payload, {
      headers,
      timeout: 15000,
      validateStatus: (status) => status < 500
    });
    
    console.log('✅ PASSWORD RESET CODE VERIFICATION SUCCESS:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    return { success: true, response: response.data };
    
  } catch (error: any) {
    console.log('❌ PASSWORD RESET CODE VERIFICATION FAILED:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });
    
    return { success: false, error };
  }
};

// Test password reset code confirmation API
export const debugPasswordResetConfirmAPI = async (email: string, code: string = '123456') => {
  console.log('=== PASSWORD RESET CONFIRMATION API DEBUG ===');
  console.log('Testing email:', email);
  console.log('Testing code:', code);
  
  const endpoint = 'https://kiwamitestcloud.com/dashboardapis/api/resetpwdcodeconfirmation';
  
  // Get token
  const token = localStorage.getItem('token');
  console.log('Token available:', !!token);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (token) {
    headers.Authorization = token;
  }
  
  const payload = { email };
  
  console.log('Headers:', headers);
  console.log('Payload:', payload);
  console.log('URL:', endpoint);
  
  try {
    const response = await axios.post(endpoint, payload, {
      headers,
      timeout: 15000,
      validateStatus: (status) => status < 500
    });
    
    console.log('✅ PASSWORD RESET CONFIRMATION SUCCESS:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    return { success: true, response: response.data };
    
  } catch (error: any) {
    console.log('❌ PASSWORD RESET CONFIRMATION FAILED:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });
    
    return { success: false, error };
  }
};

// Test with the original API client as fallback
export const testOriginalAPIClient = async (email: string) => {
  console.log('\n=== TESTING ORIGINAL API CLIENT ===');
  
  try {
    const { api } = await import('../lib/api');
    
    // Test sendemail endpoint
    const payload = {
      email,
      content: "Please verify your email address by clicking the link below.",
      link: `${window.location.origin}/verify-email`
    };
    
    console.log('Testing sendemail with payload:', payload);
    
    try {
      const response = await api.post('/sendemail', payload);
      console.log('✅ Original API client SUCCESS:', response);
      return { success: true, response: response.data };
    } catch (error: any) {
      console.log('❌ Original API client failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    
  } catch (error) {
    console.log('❌ Could not load original API client:', error);
  }
  
  return { success: false };
};

// Make functions available globally - COMMENTED OUT FOR PRODUCTION
if (typeof window !== 'undefined') {
  (window as any).debugEmailAPI = debugEmailAPI;
  (window as any).debugPasswordResetAPI = debugPasswordResetAPI;
  (window as any).debugPasswordResetCodeVerificationAPI = debugPasswordResetCodeVerificationAPI;
  (window as any).debugPasswordResetConfirmAPI = debugPasswordResetConfirmAPI;
  (window as any).testOriginalAPIClient = testOriginalAPIClient;
}
*/