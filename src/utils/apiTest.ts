// API connectivity test utility
import { authService } from '@/services/authService';
import { backend_url } from '@/config';

export const testApiConnectivity = async () => {
  console.log('🔧 Testing API connectivity...');
  console.log('🔧 Backend URL:', backend_url);
  
  const token = authService.getToken();
  console.log('🔧 Auth token exists:', !!token);
  
  if (!token) {
    console.log('❌ No authentication token found. Please login first.');
    return { success: false, message: 'No authentication token' };
  }

  const endpoints = [
    { name: 'Test Plans', url: `${backend_url}/testplans` },
    { name: 'RTM (Requirements)', url: `${backend_url}/requirements` },
    { name: 'Bug Bashes', url: `${backend_url}/bugbashes` },
    { name: 'Test Suites', url: `${backend_url}/testsuites` }
  ];

  const results: any[] = [];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔧 Testing ${endpoint.name}: ${endpoint.url}`);
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log(`📊 ${endpoint.name} - Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        const count = Array.isArray(data) ? data.length : 
                     Array.isArray(data?.details) ? data.details.length :
                     Array.isArray(data?.data) ? data.data.length : 0;
        
        results.push({
          name: endpoint.name,
          status: 'success',
          statusCode: response.status,
          count: count,
          message: `✅ ${endpoint.name}: ${count} items found`
        });
        
        console.log(`✅ ${endpoint.name}: ${count} items found`);
      } else {
        results.push({
          name: endpoint.name,
          status: 'error',
          statusCode: response.status,
          message: `❌ ${endpoint.name}: HTTP ${response.status}`
        });
        
        console.log(`❌ ${endpoint.name}: HTTP ${response.status}`);
      }
    } catch (error) {
      results.push({
        name: endpoint.name,
        status: 'error',
        message: `❌ ${endpoint.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      console.error(`❌ ${endpoint.name}:`, error);
    }
  }

  console.log('🔧 API connectivity test completed');
  console.table(results);
  
  return {
    success: results.every(r => r.status === 'success'),
    results: results
  };
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testApiConnectivity = testApiConnectivity;
  console.log('🔧 API Test Available: testApiConnectivity()');
}