// Quick login test utility
import { backend_url } from '@/config';

export const quickLoginTest = async (email: string, password: string) => {
  console.log('🔧 Quick Login Test');
  console.log('🔧 Testing endpoint:', `${backend_url}/login`);
  console.log('🔧 Email:', email);
  
  try {
    const response = await fetch(`${backend_url}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response OK:', response.ok);

    const responseText = await response.text();
    console.log('📊 Response Text:', responseText);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('📊 Parsed Data:', data);
        
        const token = data.token || data.access_token;
        if (token) {
          console.log('✅ Login successful! Token found:', token.substring(0, 20) + '...');
          
          // Test storing the token
          localStorage.setItem('token', `Bearer ${token}`);
          console.log('✅ Token stored in localStorage');
          
          return { success: true, token, data };
        } else {
          console.log('❌ Login response OK but no token found');
          return { success: false, error: 'No token in response', data };
        }
      } catch (parseError) {
        console.log('❌ Could not parse response as JSON');
        return { success: false, error: 'Invalid JSON response', responseText };
      }
    } else {
      console.log('❌ Login failed with status:', response.status);
      try {
        const errorData = JSON.parse(responseText);
        console.log('❌ Error data:', errorData);
        return { success: false, error: errorData.message || 'Login failed', status: response.status };
      } catch {
        return { success: false, error: responseText || 'Login failed', status: response.status };
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).quickLoginTest = quickLoginTest;
  console.log('🔧 Quick Login Test Available: quickLoginTest(email, password)');
}