import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { Suspense, lazy } from "react";
import React from "react";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useUserStore } from '@/store/user-store';
import { useSettingsStore } from '@/store/settings-store';
import { isDemoUser } from './utils/auth-utils';
import { hasRouteAccess } from './utils/rolePermissions';
import { ThemeProvider } from "@/components/theme-provider";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { IdleTimeoutWarning } from "@/components/IdleTimeoutWarning";



// Lazy load components for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard").then(module => ({ default: module.Dashboard })));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const TestCases = lazy(() => import("./pages/TestCases").then(module => ({ default: module.TestCases })));
const BugReports = lazy(() => import("./pages/BugReports").then(module => ({ default: module.BugReports })));
const BugBash = lazy(() => import("./pages/BugBash").then(module => ({ default: module.default })));
const BugBashList = lazy(() => import("./pages/BugBash").then(module => ({ default: module.BugBashList })));
const CreateBugBash = lazy(() => import("./pages/BugBash").then(module => ({ default: module.CreateBugBash })));
const EditBugBash = lazy(() => import("./pages/BugBash").then(module => ({ default: module.EditBugBash })));
const BugBashDetail = lazy(() => import("./pages/BugBash").then(module => ({ default: module.BugBashDetail })));
const Login = lazy(() => import("./pages/auth/Login").then(module => ({ default: module.Login })));
const Projects = lazy(() => import("./pages/Projects"));
const QaReport = lazy(() => import("./pages/QaReport"));
const TestPlans = lazy(() => import("./pages/TestPlans"));
const TestSuites = lazy(() => import("./pages/TestSuites").then(module => ({ default: module.TestSuites })));
const TestSuiteDetail = lazy(() => import("./pages/TestSuiteDetail").then(module => ({ default: module.TestSuiteDetail })));
const Signup = lazy(() => import("./pages/auth/Signup").then(module => ({ default: module.Signup })));
const Profile = lazy(() => import("./pages/Profile"));
// const NotFound = lazy(() => import("./pages/NotFound"));
const RtmPage = lazy(() => import("./pages/RtmPage"));
const Reports = lazy(() => import("./pages/Reports"));
// const Notifications = lazy(() => import("./pages/Notifications").then(module => ({ default: module.Notifications })));
// const Settings = lazy(() => import("./pages/Settings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword").then(module => ({ default: module.ForgotPassword })));
const EmailVerification = lazy(() => import("./pages/auth/EmailVerification").then(module => ({ default: module.EmailVerification })));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword").then(module => ({ default: module.ResetPassword })));

const queryClient = new QueryClient();

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Component to protect routes from demo users
const DemoRestrictedRoute = ({ children }: { children: JSX.Element }) => {
  const location = useLocation();
  const { toast } = useToast();
  const currentUser = useUserStore((state) => state.currentUser);
  
  // Check if user is a demo user
  if (isDemoUser(currentUser?.email)) {
    toast({
      title: 'Access Restricted',
      description: 'This feature is not available for demo accounts.',
      variant: 'destructive',
    });
    return <Navigate to="/bug-bash/list" replace state={{ from: location }} />;
  }
  
  return children;
};

// Component to protect routes based on user role
const RoleBasedRoute = ({ children }: { children: JSX.Element }) => {
  const location = useLocation();
  const { toast } = useToast();
  const currentUser = useUserStore((state) => state.currentUser);
  
  // Check if user has access to this route
  if (currentUser && !hasRouteAccess(currentUser.email, currentUser.role, location.pathname)) {
    toast({
      title: 'Access Denied',
      description: 'You do not have permission to access this page.',
      variant: 'destructive',
    });
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }
  
  return children;
};

// Component to protect all routes
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();
  
  // Redirect to login if not authenticated
  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppWithRouter />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Component that uses router hooks - must be inside BrowserRouter
const AppWithRouter = () => {
  const { settings } = useSettingsStore();
  
  // Debug functions commented out for production
  // React.useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     (window as any).testEmailFunctions = testEmailFunctions;
  //     (window as any).debugEmailAPI = debugEmailAPI;
  //     (window as any).debugPasswordResetAPI = debugPasswordResetAPI;
  //     (window as any).debugPasswordResetCodeVerificationAPI = debugPasswordResetCodeVerificationAPI;
  //     (window as any).debugPasswordResetConfirmAPI = debugPasswordResetConfirmAPI;
  //     (window as any).testOriginalAPIClient = testOriginalAPIClient;
  //     (window as any).testCodeVerificationFlow = testCodeVerificationFlow;
  //     (window as any).testRawCodeVerificationAPI = testRawCodeVerificationAPI;
  //     console.log('📧 Email debugging functions available:');
  //     console.log('- window.testEmailFunctions');
  //     console.log('- window.debugEmailAPI');
  //     console.log('- window.debugPasswordResetAPI');
  //     console.log('- window.debugPasswordResetCodeVerificationAPI');
  //     console.log('- window.debugPasswordResetConfirmAPI');
  //     console.log('- window.testOriginalAPIClient');
  //     console.log('🔍 Code verification testing:');
  //     console.log('- window.testCodeVerificationFlow');
  //     console.log('- window.testRawCodeVerificationAPI');
  //   }
  // }, []);
  
  // Initialize idle timeout for authenticated users - now inside Router context
  const { showWarning, extendSession, handleLogout } = useIdleTimeout({
    timeout: settings.sessionTimeout * 60 * 1000, // Convert minutes to milliseconds
    warningTime: settings.idleWarningTime * 1000, // Convert seconds to milliseconds
    enabled: true // Re-enable with better settings
  });

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-email" element={<EmailVerification />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Public Bug Bash Detail View */}
                <Route path="/bug-bash/:id" element={
                  <DashboardLayout>
                    <BugBashDetail />
                  </DashboardLayout>
                } />

                {/* Protected Bug Bash Routes - Superadmin Only */}
                <Route path="/bug-bash" element={
                  <PrivateRoute>
                    <RoleBasedRoute>
                      <DashboardLayout>
                        <BugBash />
                      </DashboardLayout>
                    </RoleBasedRoute>
                  </PrivateRoute>
                }>
                  <Route index element={<Navigate to="list" replace />} />
                  <Route path="list" element={<BugBashList />} />
                  <Route path="new" element={<CreateBugBash />} />
                  <Route path=":id/edit" element={<EditBugBash />} />
                </Route>

                {/* Protected Routes - All Roles */}
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <RoleBasedRoute>
                        <DashboardLayout>
                          <Dashboard />
                        </DashboardLayout>
                      </RoleBasedRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/qa-report"
                  element={
                    <PrivateRoute>
                      <RoleBasedRoute>
                        <DashboardLayout>
                          <QaReport />
                        </DashboardLayout>
                      </RoleBasedRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/test-plans"
                  element={
                    <PrivateRoute>
                      <RoleBasedRoute>
                        <DashboardLayout>
                          <TestPlans />
                        </DashboardLayout>
                      </RoleBasedRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/test-suites"
                  element={
                    <PrivateRoute>
                      <RoleBasedRoute>
                        <DashboardLayout>
                          <TestSuites />
                        </DashboardLayout>
                      </RoleBasedRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/test-suite-detail"
                  element={
                    <PrivateRoute>
                      <RoleBasedRoute>
                        <DashboardLayout>
                          <TestSuiteDetail />
                        </DashboardLayout>
                      </RoleBasedRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/test-cases"
                  element={
                    <PrivateRoute>
                      <RoleBasedRoute>
                        <DashboardLayout>
                          <TestCases />
                        </DashboardLayout>
                      </RoleBasedRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/bug-reports"
                  element={
                    <PrivateRoute>
                      <RoleBasedRoute>
                        <DashboardLayout>
                          <BugReports />
                        </DashboardLayout>
                      </RoleBasedRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/rtm"
                  element={
                    <PrivateRoute>
                      <RoleBasedRoute>
                        <DashboardLayout>
                          <RtmPage />
                        </DashboardLayout>
                      </RoleBasedRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <PrivateRoute>
                      <RoleBasedRoute>
                        <DashboardLayout>
                          <UserManagement />
                        </DashboardLayout>
                      </RoleBasedRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <PrivateRoute>
                      <DemoRestrictedRoute>
                        <DashboardLayout>
                          <Reports />
                        </DashboardLayout>
                      </DemoRestrictedRoute>
                    </PrivateRoute>
                  }
                />
                {/* <Route
                  path="/notifications"
                  element={
                    <PrivateRoute>
                      <DemoRestrictedRoute>
                        <DashboardLayout>
                          <Notifications />
                        </DashboardLayout>
                      </DemoRestrictedRoute>
                    </PrivateRoute>
                  }
                /> */}
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <DemoRestrictedRoute>
                        <DashboardLayout>
                          <Profile />
                        </DashboardLayout>
                      </DemoRestrictedRoute>
                    </PrivateRoute>
                  }
                />
                {/* <Route
                  path="/settings"
                  element={
                    <PrivateRoute>
                      <DemoRestrictedRoute>
                        <DashboardLayout>
                          <Settings />
                        </DashboardLayout>
                      </DemoRestrictedRoute>
                    </PrivateRoute>
                  }
                /> */}
                <Route
                  path="/projects"
                  element={
                    <PrivateRoute>
                      <DemoRestrictedRoute>
                        <DashboardLayout>
                          <Projects />
                        </DashboardLayout>
                      </DemoRestrictedRoute>
                    </PrivateRoute>
                  }
                />
                
                {/* 404 Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            
            {/* Idle Timeout Warning Dialog */}
            <IdleTimeoutWarning
              isOpen={showWarning}
              onExtendSession={extendSession}
              onLogout={handleLogout}
              warningDuration={settings.idleWarningTime}
            />
        </>
    );
};

export default App;