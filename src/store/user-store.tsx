import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from "@/services/authService";
import { User, TempUserData, roleMap, roleIdToName } from '@/types/user';

// Define API base URL
const API_BASE_URL = 'https://kiwamitestcloud.com/dashboardapis/api';

interface UserStore {
  users: User[];
  currentUser: User | null;
  tempUserData: TempUserData | null; // Store temp signup data
  
  // Basic CRUD Operations
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUserById: (id: string) => User | undefined;
  getUserByEmail: (email: string) => User | undefined;
  getAllUsers: () => User[];
  
  // Authentication Operations
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }) => Promise<{ success: boolean; message?: string; verificationCode?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  syncUserFromLocalStorage: () => void;
  
  // Signup Flow Operations
  setTempUserData: (userData: TempUserData) => void;
  getTempUserData: () => TempUserData | null;
  clearTempUserData: () => void;
  getTempUserEmail: () => string | null;
  
  // User Management
  verifyUserEmail: (email: string) => void;
  verifyUserPhone: (email: string) => void;
  updateUserLastActive: (email: string) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
      tempUserData: null,
      
      // ========== CRUD Operations ==========
      
      // CREATE - Add a new user
      addUser: (userData) => {
        const newUser: User = {
          ...userData,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date(),
          isEmailVerified: false,
          isPhoneVerified: false,
          lastActive: new Date(),
          phoneVerifiedDate: new Date(),
          emailVerifiedDate: new Date(),
        };
        
        set((state) => ({
          users: [...state.users, newUser],
        }));
        
        return newUser;
      },
      
      // READ - Get user by ID
      getUserById: (id: string) => {
        return get().users.find(user => user.id === id || user._id === id);
      },
      
      // READ - Get user by email
      getUserByEmail: (email: string) => {
        return get().users.find(user => user.email === email);
      },
      
      // READ - Get all users
      getAllUsers: () => {
        return get().users;
      },
      
      // UPDATE - Update user by ID
      updateUser: (id: string, updates: Partial<User>) => {
        set((state) => ({
          users: state.users.map(user => 
            (user.id === id || user._id === id) 
              ? { ...user, ...updates, lastActive: new Date() }
              : user
          )
        }));
        
        // If updating current user, update currentUser as well
        const currentUser = get().currentUser;
        if (currentUser && (currentUser.id === id || currentUser._id === id)) {
          set((state) => ({
            currentUser: { ...state.currentUser!, ...updates, lastActive: new Date() }
          }));
        }
      },
      
      // DELETE - Remove user by ID
      deleteUser: (id: string) => {
        set((state) => ({
          users: state.users.filter(user => user.id !== id && user._id !== id)
        }));
        
        // If deleting current user, logout
        const currentUser = get().currentUser;
        if (currentUser && (currentUser.id === id || currentUser._id === id)) {
          get().logout();
        }
      },
      
      // ========== Signup Flow Operations ==========
      
      // Store temporary signup data
      setTempUserData: (userData: TempUserData) => {
        set({ tempUserData: userData });
      },
      
      // Get temporary signup data
      getTempUserData: () => {
        return get().tempUserData;
      },
      
      // Get email from temp data (for email verification)
      getTempUserEmail: () => {
        const tempData = get().tempUserData;
        return tempData ? tempData.email : null;
      },
      
      // Clear temporary data after successful verification
      clearTempUserData: () => {
        set({ tempUserData: null });
      },
      
      // ========== User Management Operations ==========
      
      // Mark user's email as verified
      verifyUserEmail: (email: string) => {
        set((state) => ({
          users: state.users.map(user => 
            user.email === email 
              ? { ...user, isEmailVerified: true, emailVerifiedDate: new Date() }
              : user
          )
        }));
        
        // Update current user if it's the same email
        if (get().currentUser?.email === email) {
          set((state) => ({
            currentUser: { 
              ...state.currentUser!, 
              isEmailVerified: true, 
              emailVerifiedDate: new Date() 
            }
          }));
        }
      },
      
      // Mark user's phone as verified
      verifyUserPhone: (email: string) => {
        set((state) => ({
          users: state.users.map(user => 
            user.email === email 
              ? { ...user, isPhoneVerified: true, phoneVerifiedDate: new Date() }
              : user
          )
        }));
      },
      
      // Update user's last active time
      updateUserLastActive: (email: string) => {
        set((state) => ({
          users: state.users.map(user => 
            user.email === email 
              ? { ...user, lastActive: new Date() }
              : user
          )
        }));
      },
      
      // ========== Authentication Operations ==========
      
      login: async (email, password) => {
        try {
          console.log("Sending login request to:", `${API_BASE_URL}/login`);
          console.log("Login data:", { email }); // Don't log password

          const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const responseText = await response.text();
          console.log("Login response status:", response.status);
          
          // First check if the response is not OK
          if (!response.ok) {
            let errorMessage = "Login failed";
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
              errorMessage = response.status === 401 || response.status === 400
                ? "Incorrect/Invalid credentials" 
                : `Server error: ${response.status}. Please try again later.`;
            }
            console.error('Login failed:', errorMessage);
            throw new Error(errorMessage);
          }

          // Parse successful response
          let data;
          try {
            data = JSON.parse(responseText);
            console.log("Parsed login data:", data);
          } catch (parseError) {
            console.error("JSON parse error:", parseError);
            throw new Error("Server returned invalid response format");
          }
          
          // Check for successful login response
          if (!data.token && !data.access_token) {
            console.error('No token in response. Response data:', data);
            throw new Error("Incorrect/Invalid credentials");
          }
          
          // Handle different possible response structures
          const token = data.token || data.access_token;
          const userData = data.user || data.data?.user || data.details?.[0] || data;
          
          if (!userData) {
            throw new Error("Authentication failed: No user data received");
          }
          
          console.log("User data from response:", userData);
          
          // Store token
          localStorage.setItem('token', token);
          
          // Normalize user data - handle role from details array
          let userRole = userData.rolename || userData.role_name || userData.role || 'user';
          console.log("User role from response:", userRole);
          
          // Apply role mapping and special handling for specific email
          if (userData.email === 'nyamaibigjoash@gmail.com') {
            userRole = 'Super Admin';
          } else if (userRole === 'Superadmin') {
            userRole = 'Super Admin';
          } else if (roleIdToName[userRole]) {
            userRole = roleIdToName[userRole];
          }
          
          console.log("Mapped user role:", userRole);
          
          const normalizedUser = {
            id: userData.userid || userData.user_id || userData._id || userData.id || '',
            firstName: userData.firstName || userData.first_name || userData.fullname?.split(' ')[0] || '',
            lastName: userData.lastName || userData.last_name || userData.fullname?.split(' ').slice(1).join(' ') || '',
            username: userData.username || userData.email?.split('@')[0] || '',
            email: userData.email || email,
            password: '',
            role: userRole,
            createdAt: userData.created_at ? new Date(userData.created_at) : new Date(),
            phone: userData.phone || '',
            isEmailVerified: userData.status === 'Active' || userData.isEmailVerified || false,
            isPhoneVerified: userData.isPhoneVerified || false,
            lastActive: new Date(),
            phoneVerifiedDate: userData.phoneVerifiedDate ? new Date(userData.phoneVerifiedDate) : null,
            emailVerifiedDate: userData.updated_at ? new Date(userData.updated_at) : null,
          };

          console.log("Normalized user data:", normalizedUser);

          // Update store and localStorage
          localStorage.setItem('user', JSON.stringify(normalizedUser));
          set({ currentUser: normalizedUser });
          
          return true;
        } catch (error) {
          console.error('Login error:', error);
          // Clear any partial auth data on error
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          set({ currentUser: null });
          throw error;
        }
      },
      
      // Register a new user
      register: async (userData) => {
        try {
          console.log("Starting registration for:", userData.email);
          
          // Generate a simple verification code (6 digits)
          const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
          
          const registerData = {
            name: `${userData.firstName} ${userData.lastName}`.trim(),
            username: userData.username.trim(),
            email: userData.email.trim().toLowerCase(),
            password: userData.password,
            role: userData.role || 'Developer',
            verification_code: verificationCode,
            email_verified: false
          };
          
          console.log("Sending registration data:", JSON.stringify(registerData, null, 2));

          const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData)
          });

          // Get response as text first
          const responseText = await response.text();
          console.log("Registration response status:", response.status);
          console.log("Registration response text:", responseText);

          if (!response.ok) {
            let errorMessage = "Registration failed";
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorData.error || errorMessage;
              console.error("Registration error details:", errorData);
            } catch (e) {
              console.error("Failed to parse error response:", e);
            }
            throw new Error(errorMessage);
          }

          // Parse successful response
          let data;
          try {
            data = JSON.parse(responseText);
            console.log("Registration successful, user data:", data);
          } catch (parseError) {
            console.error("JSON parse error in registration response:", parseError);
            throw new Error("Server returned invalid response format");
          }

          // Store temp user data for email verification
          const tempData = {
            fullName: registerData.name,
            username: registerData.username,
            email: registerData.email,
            verificationCode: verificationCode,
            role: registerData.role,
            signupTimestamp: new Date(),
          };
          
          get().setTempUserData(tempData);
          console.log("Temporary user data stored:", tempData);
          
          // Send verification email after successful registration
          try {
            console.log('Sending verification email after registration...');
            await authService.sendVerificationEmail(registerData.email);
            console.log('Verification email sent successfully');
          } catch (emailError) {
            console.error('Error sending verification email:', emailError);
            // Don't fail the registration if email sending fails
            // The user can request a new verification email later
            throw new Error('Registration successful, but failed to send verification email. Please use the resend button.');
          }
          
          return { 
            success: true, 
            message: 'Registration successful! Please check your email to verify your account.',
            verificationCode: verificationCode
          };
        } catch (error) {
          console.error('Registration error:', error);
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'An unexpected error occurred' 
          };
        }
      },
      
      // Verify user's email with token
      verifyEmail: async (token) => {
        try {
          // Get the current user's email from temp data
          const tempData = get().tempUserData;
          if (!tempData) {
            throw new Error('Session expired. Please log in again and request a new verification code.');
          }
          
          const payload = {
            email: tempData.email,
            code: token
          };
          
          console.log('Sending verification request with payload:', payload);
          
          const response = await fetch(`${API_BASE_URL}/emailcodeconfirmation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const responseText = await response.text();
          console.log("Verify email response status:", response.status);
          console.log("Verify email response text:", responseText);

          if (!response.ok) {
            let errorMessage = "Email verification failed";
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorData.error || errorMessage;
              
              // Handle specific error cases
              if (response.status === 410) {
                errorMessage = 'The verification code has expired. Please request a new one.';
              } else if (response.status === 400) {
                errorMessage = 'Invalid verification code. Please check and try again.';
              }
              
            } catch {
              if (response.status === 404) {
                errorMessage = "Email verification endpoint not found. Please contact support.";
              } else {
                errorMessage = `Server error: ${response.status}. Please try again later.`;
              }
            }
            return { 
              success: false, 
              message: errorMessage 
            };
          }

          // Parse successful response
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return { 
              success: false, 
              message: "Server returned invalid response format" 
            };
          }
          
          // Clear temp data after successful verification
          get().clearTempUserData();
          
          return { 
            success: true, 
            message: 'Email verified successfully! You can now log in.' 
          };
        } catch (error) {
          console.error('Email verification error:', error);
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'An error occurred during email verification' 
          };
        }
      },
      
      // Request password reset
      requestPasswordReset: async (email) => {
        try {
          const response = await fetch(`${API_BASE_URL}/forgot-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });

          const responseText = await response.text();
          console.log("Forgot password response status:", response.status);
          console.log("Forgot password response text:", responseText);

          if (!response.ok) {
            let errorMessage = "Password reset request failed";
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
              if (response.status === 404) {
                errorMessage = "Forgot password endpoint not found. Please contact support.";
              } else {
                errorMessage = `Server error: ${response.status}. Please try again later.`;
              }
            }
            return { 
              success: false, 
              message: errorMessage 
            };
          }

          // Parse successful response
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return { 
              success: false, 
              message: "Server returned invalid response format" 
            };
          }
          
          return { 
            success: true, 
            message: 'Password reset instructions have been sent to your email.' 
          };
        } catch (error) {
          console.error('Password reset request error:', error);
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'An error occurred while processing your request' 
          };
        }
      },
      
      // Reset password with token
      resetPassword: async (token, newPassword) => {
        try {
          const response = await fetch(`${API_BASE_URL}/reset-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, password: newPassword }),
          });

          const responseText = await response.text();
          console.log("Reset password response status:", response.status);
          console.log("Reset password response text:", responseText);

          if (!response.ok) {
            let errorMessage = "Password reset failed";
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
              if (response.status === 404) {
                errorMessage = "Reset password endpoint not found. Please contact support.";
              } else {
                errorMessage = `Server error: ${response.status}. Please try again later.`;
              }
            }
            return { 
              success: false, 
              message: errorMessage 
            };
          }

          // Parse successful response
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return { 
              success: false, 
              message: "Server returned invalid response format" 
            };
          }
          
          return { 
            success: true, 
            message: 'Password has been reset successfully. You can now log in with your new password.' 
          };
        } catch (error) {
          console.error('Password reset error:', error);
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'An error occurred while resetting your password' 
          };
        }
      },
      
      logout: () => {
        set({ currentUser: null });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },
      
      updateCurrentUser: (updates: Partial<User>) => {
        console.log('updateCurrentUser called with:', updates);
        set((state) => {
          if (!state.currentUser) {
            console.log('No current user to update');
            return state;
          }
          
          console.log('Current user before update:', state.currentUser);
          
          const updatedUser = {
            ...state.currentUser,
            ...updates,
            lastActive: new Date(),
          };
          
          console.log('Updated user after merge:', updatedUser);
          
          // Update localStorage to keep it in sync
          localStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('Updated localStorage with user:', updatedUser);
          
          // Update in users array as well
          const userId = state.currentUser.id || state.currentUser._id;
          if (userId) {
            get().updateUser(userId, updates);
          }
          
          return { currentUser: updatedUser };
        });
      },
      
      syncUserFromLocalStorage: () => {
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            set({ currentUser: userData });
          }
        } catch (error) {
          console.error("Error syncing user from localStorage:", error);
        }
      },
      
    }),
    {
      name: 'user-storage',
      // Only persist users and currentUser, not tempUserData
      partialize: (state) => ({ 
        users: state.users, 
        currentUser: state.currentUser 
      }),
    }
  )
);