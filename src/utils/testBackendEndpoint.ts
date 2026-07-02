// Test Backend Google OAuth Endpoint
import { backend_url } from '@/config';

export const testBackendGoogleEndpoint = async () => {
  console.log('🔧 Testing backend Google OAuth endpoint...');
  console.log('🔧 Backend URL:', backend_url);
  console.log('🔧 Full endpoint:', `${backend_url}/auth/google`);
  
  try {
    // Test if endpoint exists with a simple GET request first
    console.log('🔧 Step 1: Testing if endpoint exists...');
    const getResponse = await fetch(`${backend_url}/auth/google`, {
      method: 'GET',
    });
    
    console.log('🔧 GET Response Status:', getResponse.status);
    console.log('🔧 GET Response Headers:', Object.fromEntries(getResponse.headers.entries()));
    
    const getContentType = getResponse.headers.get('content-type');
    const getIsJson = getContentType && getContentType.includes('application/json');
    
    if (getIsJson) {
      const getData = await getResponse.json();
      console.log('🔧 GET Response Data:', getData);
    } else {
      const getTextData = await getResponse.text();
      console.log('🔧 GET Response Text (first 300 chars):', getTextData.substring(0, 300));
    }
    
    // Test POST request with mock data
    console.log('🔧 Step 2: Testing POST request...');
    const postResponse = await fetch(`${backend_url}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credential: 'test-credential',
        clientId: '628379713337-eba5m5h6air0bl9tce9f86ijnrel01q4.apps.googleusercontent.com',
      }),
    });
    
    console.log('🔧 POST Response Status:', postResponse.status);
    console.log('🔧 POST Response Headers:', Object.fromEntries(postResponse.headers.entries()));
    
    const postContentType = postResponse.headers.get('content-type');
    const postIsJson = postContentType && postContentType.includes('application/json');
    
    if (postIsJson) {
      const postData = await postResponse.json();
      console.log('🔧 POST Response Data:', postData);
    } else {
      const postTextData = await postResponse.text();
      console.log('🔧 POST Response Text (first 500 chars):', postTextData.substring(0, 500));
    }
    
    // Analyze results
    if (getResponse.status === 404 && postResponse.status === 404) {
      console.log('❌ Endpoint not found - /auth/google is not implemented on the backend');
    } else if (getResponse.status === 405 && postResponse.status !== 405) {
      console.log('✅ Endpoint exists and accepts POST requests');
    } else if (!postIsJson) {
      console.log('⚠️ Endpoint exists but returns HTML instead of JSON - needs backend configuration');
    } else {
      console.log('✅ Endpoint appears to be working correctly');
    }
    
  } catch (error) {
    console.error('🔧 Backend endpoint test failed:', error);
  }
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testBackendGoogleEndpoint = testBackendGoogleEndpoint;
  console.log('🔧 Backend Test Available: testBackendGoogleEndpoint()');
}