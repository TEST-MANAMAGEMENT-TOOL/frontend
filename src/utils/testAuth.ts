// Test authentication utility
export const testAuthToken = () => {
  console.log('=== TESTING AUTH TOKEN ===');
  
  // Check localStorage directly
  const token = localStorage.getItem('token');
  console.log('Raw token from localStorage:', token);
  
  // Check if user is logged in
  const isLoggedIn = !!token;
  console.log('Is logged in:', isLoggedIn);
  
  if (token) {
    // Check token format
    const hasBearer = token.startsWith('Bearer ');
    console.log('Token has Bearer prefix:', hasBearer);
    
    // Show token structure
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 30) + '...');
    
    // Test header format
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token
    };
    console.log('Headers that would be sent:', headers);
  } else {
    console.log('No token found - user needs to login');
  }
  
  console.log('========================');
  return { token, isLoggedIn };
};

// Call this function to test
if (typeof window !== 'undefined') {
  (window as any).testAuth = testAuthToken;
}