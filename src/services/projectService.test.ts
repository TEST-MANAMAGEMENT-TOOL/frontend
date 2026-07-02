import axios from 'axios';
import { debugApiCall } from '@/utils/apiDebug';

// Test different authentication approaches
export const testProjectsAPI = async () => {
  const token = localStorage.getItem('token');
  const baseUrl = 'https://kiwamitestcloud.com/dashboardapis/api/projects';
  
  if (!token) {
    console.error('No token found - user needs to login');
    return;
  }
  
  console.log('=== TESTING PROJECTS API ===');
  
  // Test 1: Direct token (current approach)
  try {
    console.log('Test 1: Using token directly');
    const headers1 = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token
    };
    
    await debugApiCall(baseUrl, headers1);
    const response1 = await axios.get(baseUrl, { headers: headers1 });
    console.log('✅ Test 1 SUCCESS:', response1.status);
    return response1.data;
  } catch (error: any) {
    console.log('❌ Test 1 FAILED:', error.response?.status, error.response?.data);
  }
  
  // Test 2: Token without Bearer prefix
  try {
    console.log('Test 2: Using token without Bearer prefix');
    const cleanToken = token.replace('Bearer ', '');
    const headers2 = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${cleanToken}`
    };
    
    await debugApiCall(baseUrl, headers2);
    const response2 = await axios.get(baseUrl, { headers: headers2 });
    console.log('✅ Test 2 SUCCESS:', response2.status);
    return response2.data;
  } catch (error: any) {
    console.log('❌ Test 2 FAILED:', error.response?.status, error.response?.data);
  }
  
  // Test 3: Just the token part without Bearer
  try {
    console.log('Test 3: Using clean token only');
    const cleanToken = token.replace('Bearer ', '');
    const headers3 = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': cleanToken
    };
    
    await debugApiCall(baseUrl, headers3);
    const response3 = await axios.get(baseUrl, { headers: headers3 });
    console.log('✅ Test 3 SUCCESS:', response3.status);
    return response3.data;
  } catch (error: any) {
    console.log('❌ Test 3 FAILED:', error.response?.status, error.response?.data);
  }
  
  // Test 4: Using the original API client
  try {
    console.log('Test 4: Using original API client');
    const { api } = await import('../lib/api');
    const response4 = await api.get('/projects');
    console.log('✅ Test 4 SUCCESS (original API):', response4.status);
    return response4.data;
  } catch (error: any) {
    console.log('❌ Test 4 FAILED (original API):', error.response?.status, error.response?.data);
  }
  
  console.log('All tests failed - authentication issue');
  return null;
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testProjectsAPI = testProjectsAPI;
}