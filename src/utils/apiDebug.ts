// Comprehensive API debugging utility
export const debugApiCall = async (url: string, headers: Record<string, string>) => {
  console.log('=== API CALL DEBUG ===');
  console.log('URL:', url);
  console.log('Headers:', headers);
  
  // Test the token format
  const token = localStorage.getItem('token');
  console.log('Raw token:', token);
  
  if (token) {
    console.log('Token length:', token.length);
    console.log('Starts with Bearer:', token.startsWith('Bearer '));
    console.log('Token preview:', token.substring(0, 50) + '...');
    
    // Test different header formats
    console.log('Testing different auth header formats:');
    console.log('1. Direct token:', token);
    console.log('2. Bearer + token:', `Bearer ${token}`);
    console.log('3. Token without Bearer:', token.replace('Bearer ', ''));
  }
  
  console.log('=====================');
};