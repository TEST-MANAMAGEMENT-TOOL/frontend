// Test utility to debug import test plan API issues
import axios from 'axios';
import { authService } from '@/services/authService';

export const testImportEndpoints = async () => {
  console.log('=== TESTING IMPORT ENDPOINTS ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ No token found');
    return { success: false, error: 'No token' };
  }
  
  const cleanToken = token.replace(/^Bearer\s*/i, '');
  const formattedToken = `Bearer ${cleanToken}`;
  
  const headers = {
    'Authorization': formattedToken,
    'Accept': 'application/json'
  };
  
  // Test different possible endpoints
  const endpoints = [
    'https://kiwamitestcloud.com/dashboardapis/api/importtestplan',
    'https://kiwamitestcloud.com/dashboardapis/api/import-testplan',
    'https://kiwamitestcloud.com/dashboardapis/api/testplans/import',
    'https://kiwamitestcloud.com/dashboardapis/api/testplan/import',
    '/api/importtestplan',
    '/api/testplans/import'
  ];
  
  const results: Array<{
    endpoint: string;
    optionsStatus?: number;
    getStatus?: number;
    error?: string;
    available: boolean;
  }> = [];
  
  for (const endpoint of endpoints) {
    console.log(`\n--- Testing: ${endpoint} ---`);
    
    try {
      // Test with OPTIONS request first to see if endpoint exists
      const optionsResponse = await axios.options(endpoint, { 
        headers,
        timeout: 5000,
        validateStatus: () => true // Accept all status codes
      });
      
      console.log(`OPTIONS ${endpoint}:`, {
        status: optionsResponse.status,
        statusText: optionsResponse.statusText,
        headers: optionsResponse.headers
      });
      
      // Test with GET request to see what happens
      const getResponse = await axios.get(endpoint, { 
        headers,
        timeout: 5000,
        validateStatus: () => true // Accept all status codes
      });
      
      console.log(`GET ${endpoint}:`, {
        status: getResponse.status,
        statusText: getResponse.statusText,
        data: getResponse.data
      });
      
      results.push({
        endpoint,
        optionsStatus: optionsResponse.status,
        getStatus: getResponse.status,
        available: getResponse.status !== 404 && getResponse.status !== 501
      });
      
    } catch (error: any) {
      console.log(`❌ Error testing ${endpoint}:`, error.message);
      results.push({
        endpoint,
        error: error.message,
        available: false
      });
    }
  }
  
  console.log('\n=== ENDPOINT TEST RESULTS ===');
  results.forEach(result => {
    console.log(`${result.available ? '✅' : '❌'} ${result.endpoint}`, result);
  });
  
  return results;
};

export const testImportWithMockFile = async () => {
  console.log('=== TESTING IMPORT WITH MOCK FILE ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ No token found');
    return { success: false, error: 'No token' };
  }
  
  // Create a mock PDF file
  const mockFileContent = 'Mock PDF content for testing';
  const mockFile = new File([mockFileContent], 'test-plan.pdf', { type: 'application/pdf' });
  
  const formData = new FormData();
  formData.append('name', 'Test Import Plan');
  formData.append('description', 'Testing import functionality');
  formData.append('projectId', '1');
  formData.append('plan', mockFile);
  formData.append('startDate', '12-02-2025');
  formData.append('endDate', '15-02-2025');
  formData.append('status', 'Draft');
  
  const cleanToken = token.replace(/^Bearer\s*/i, '');
  const formattedToken = `Bearer ${cleanToken}`;
  
  const endpoints = [
    'https://kiwamitestcloud.com/dashboardapis/api/importtestplan',
    '/api/importtestplan'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n--- Testing POST to: ${endpoint} ---`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': formattedToken
          // Don't set Content-Type - let browser handle it for FormData
        },
        body: formData
      });
      
      console.log(`Response status: ${response.status} ${response.statusText}`);
      console.log(`Response URL: ${response.url}`);
      
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      if (responseText) {
        try {
          const responseData = JSON.parse(responseText);
          console.log('Response data:', responseData);
        } catch (parseError) {
          console.log('Could not parse as JSON');
        }
      }
      
      if (response.status === 501) {
        console.log('❌ 501 Not Implemented - endpoint does not exist');
      } else if (response.status === 404) {
        console.log('❌ 404 Not Found - endpoint not found');
      } else if (response.status === 405) {
        console.log('⚠️ 405 Method Not Allowed - endpoint exists but POST not allowed');
      } else if (response.status >= 200 && response.status < 300) {
        console.log('✅ Success response');
      } else {
        console.log(`⚠️ Other status: ${response.status}`);
      }
      
    } catch (error: any) {
      console.log(`❌ Error testing ${endpoint}:`, error.message);
    }
  }
};

export const listAvailableEndpoints = async () => {
  console.log('=== LISTING AVAILABLE ENDPOINTS ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ No token found');
    return;
  }
  
  const cleanToken = token.replace(/^Bearer\s*/i, '');
  const formattedToken = `Bearer ${cleanToken}`;
  
  // Try to get a list of available endpoints
  const baseUrls = [
    'https://kiwamitestcloud.com/dashboardapis/api',
    '/api'
  ];
  
  for (const baseUrl of baseUrls) {
    console.log(`\n--- Testing base URL: ${baseUrl} ---`);
    
    try {
      const response = await axios.get(baseUrl, {
        headers: {
          'Authorization': formattedToken,
          'Accept': 'application/json'
        },
        timeout: 5000,
        validateStatus: () => true
      });
      
      console.log(`Status: ${response.status}`);
      console.log('Response:', response.data);
      
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }
};

// Make functions available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testImportEndpoints = testImportEndpoints;
  (window as any).testImportWithMockFile = testImportWithMockFile;
  (window as any).listAvailableEndpoints = listAvailableEndpoints;
  
  console.log('🔧 Import Test Functions Available:');
  console.log('- testImportEndpoints() - Test different endpoint variations');
  console.log('- testImportWithMockFile() - Test import with mock file');
  console.log('- listAvailableEndpoints() - List available API endpoints');
}