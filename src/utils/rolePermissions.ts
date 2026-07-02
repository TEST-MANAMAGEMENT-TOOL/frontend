export type UserRole = 'Superadmin' | 'Tester' | 'Developer';

export interface RoutePermission {
  path: string;
  allowedRoles: UserRole[];
}

// Define which roles can access which routes
// Tester: all sections except bug-bash and user management
// Superadmin: all sections
// Developer: bug-reports, test-cases, dashboard, profile, settings
export const routePermissions: RoutePermission[] = [
  { path: '/', allowedRoles: ['Superadmin', 'Tester', 'Developer'] },
  { path: '/dashboard', allowedRoles: ['Superadmin', 'Tester', 'Developer'] },
  { path: '/test-plans', allowedRoles: ['Superadmin', 'Tester'] },
  { path: '/test-suites', allowedRoles: ['Superadmin', 'Tester'] },
  { path: '/test-cases', allowedRoles: ['Superadmin', 'Tester', 'Developer'] },
  { path: '/bug-reports', allowedRoles: ['Superadmin', 'Tester', 'Developer'] },
  { path: '/rtm', allowedRoles: ['Superadmin', 'Tester'] },
  { path: '/qa-report', allowedRoles: ['Superadmin', 'Tester'] },
  { path: '/bug-bash', allowedRoles: ['Superadmin'] }, // Only Superadmin
  { path: '/users', allowedRoles: ['Superadmin'] }, // Only Superadmin - User Management
  { path: '/profile', allowedRoles: ['Superadmin', 'Tester', 'Developer'] },
  { path: '/settings', allowedRoles: ['Superadmin', 'Tester', 'Developer'] },
  { path: '/notifications', allowedRoles: ['Superadmin', 'Tester', 'Developer'] },
  { path: '/reports', allowedRoles: ['Superadmin', 'Tester'] },
  { path: '/projects', allowedRoles: ['Superadmin', 'Tester'] },
];

// Superadmin email
export const SUPERADMIN_EMAIL = 'nyamaibigjoash@gmail.com';

// Check if user is superadmin
export const isSuperadmin = (email: string | undefined): boolean => {
  if (!email) return false;
  return email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
};

// Get user role based on email and role from backend
export const getUserRole = (email: string | undefined, backendRole: string | undefined): UserRole => {
  // Check if superadmin by email
  if (email && isSuperadmin(email)) {
    return 'Superadmin';
  }
  
  if (!backendRole) {
    return 'Developer'; // Default
  }
  
  // Map backend role to our role types
  const roleLower = backendRole.toLowerCase();
  if (roleLower.includes('super') || roleLower.includes('admin') || backendRole === '5') {
    return 'Superadmin';
  }
  if (roleLower.includes('tester') || roleLower.includes('qa') || backendRole === '2') {
    return 'Tester';
  }
  if (roleLower.includes('developer') || roleLower.includes('dev') || backendRole === '3') {
    return 'Developer';
  }
  
  // Default to Developer if role is unclear
  return 'Developer';
};

// Check if user has access to a route
export const hasRouteAccess = (userEmail: string | undefined, userRole: string | undefined, routePath: string): boolean => {
  // Get the actual role
  const role = getUserRole(userEmail, userRole);
  
  // Find the route permission (check for exact match first, then prefix match)
  let permission = routePermissions.find(p => p.path === routePath);
  if (!permission) {
    permission = routePermissions.find(p => routePath.startsWith(p.path) && p.path !== '/');
  }
  
  // If no permission defined, allow access (for new routes)
  if (!permission) {
    return true;
  }
  
  // Check if user's role is in allowed roles
  return permission.allowedRoles.includes(role);
};

// Get accessible routes for a user
export const getAccessibleRoutes = (userEmail: string | undefined, userRole: string | undefined): string[] => {
  const role = getUserRole(userEmail, userRole);
  
  return routePermissions
    .filter(p => p.allowedRoles.includes(role))
    .map(p => p.path);
};
