// Simple test utility to debug delete functionality
export const testDeleteAPI = async (testSuiteId: string) => {
  const token = localStorage.getItem('token');
  const baseURL = import.meta.env.PROD 
    ? "https://kiwamitestcloud.com/dashboardapis/api"
    : "/api";
  
  console.log('=== DELETE API TEST ===');
  console.log('Test Suite ID:', testSuiteId);
  console.log('Base URL:', baseURL);
  console.log('Full URL:', `${baseURL}/testsuites/${testSuiteId}`);
  console.log('Token exists:', !!token);
  
  try {
    const response = await fetch(`${baseURL}/testsuites/${testSuiteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token?.replace('Bearer ', '')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body (raw):', responseText);
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log('Response body (JSON):', responseJson);
    } catch {
      console.log('Response is not JSON');
    }
    
    if (response.ok) {
      console.log('✅ DELETE request successful');
      return { success: true, status: response.status, data: responseText };
    } else {
      console.log('❌ DELETE request failed');
      return { success: false, status: response.status, error: responseText };
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
    return { success: false, error: error };
  }
};