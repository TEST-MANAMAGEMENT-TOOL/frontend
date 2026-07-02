// Debug utility to check authentication status
export const debugAuthStatus = () => {
  const token = localStorage.getItem('token');
  console.log('=== AUTH DEBUG ===');
  console.log('Token exists:', !!token);
  console.log('Token value:', token);
  console.log('Token length:', token?.length || 0);
  
  if (token) {
    console.log('Token starts with Bearer:', token.startsWith('Bearer '));
    console.log('Token preview:', token.substring(0, 20) + '...');
  }
  
  console.log('==================');
  return token;
};