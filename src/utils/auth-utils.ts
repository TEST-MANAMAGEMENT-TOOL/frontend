// Check if the current user is a demo user (email starts with 'demo')
export const isDemoUser = (email?: string | null): boolean => {
  if (!email) {
    const user = localStorage.getItem('user');
    if (!user) return false;
    try {
      const userData = JSON.parse(user);
      return userData.email?.toLowerCase().startsWith('demo');
    } catch {
      return false;
    }
  }
  return email.toLowerCase().startsWith('demo');
};

// Check if the current route is allowed for demo users
export const isRouteAllowedForDemo = (pathname: string): boolean => {
  // Normalize the path to handle trailing slashes
  const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  
  // Only allow these exact routes for demo users
  const allowedRoutes = [
    '/bug-bash',
    '/bug-bash/new',
    '/bug-bash/list',
    '/bug-bash/detail',
    '/',  // home/landing page
  ];
  
  // Check if the normalized path exactly matches an allowed route
  // or starts with an allowed route followed by a forward slash
  return allowedRoutes.some(route => 
    normalizedPath === route || 
    normalizedPath.startsWith(`${route}/`)
  );
};
