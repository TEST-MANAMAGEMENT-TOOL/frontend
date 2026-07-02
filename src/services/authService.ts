import axios from 'axios';
import { backend_url } from '@/config';

const API_BASE_URL = backend_url;
const TOKEN_KEY = 'token';

export const authService = {
  // Google OAuth login
  async googleLogin(credential: string, clientId?: string) {
    try {
      console.log('Google OAuth: Attempting login with credential');
      const response = await axios.post(`${API_BASE_URL}/google`, {
        credential,
        clientId
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: (status) => {
          return (status >= 200 && status < 300) || (status >= 400 && status < 500);
        },
      });
      
      console.log('Google OAuth response status:', response.status);
      console.log('Google OAuth response data:', JSON.stringify(response.data, null, 2));
      
      if (response.status >= 400) {
        const errorMessage = response.data?.message || 'Google authentication failed';
        console.error('Google OAuth failed:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Extract token from response
      const token = response.data?.token || 
                   response.data?.access_token || 
                   response.data?.data?.token ||
                   response.data?.details?.token;
      
      if (!token) {
        console.error('No token found in Google OAuth response');
        throw new Error('No authentication token received');
      }
      
      // Set token and fetch user details
      this.setToken(token);
      
      try {
        const userDetails = await this.fetchUserDetailsAfterLogin();
        localStorage.setItem('user', JSON.stringify(userDetails));
        return { success: true, user: userDetails };
      } catch (userError: any) {
        console.warn('Failed to fetch user details after Google login:', userError.message);
        return { success: true, user: null };
      }
      
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      this.clearToken();
      throw error;
    }
  },
  async login(credentials: { email: string; password: string }) {
    try {
      console.log('🔧 AuthService Login Debug:');
      console.log('- Endpoint:', `${API_BASE_URL}/login`);
      console.log('- Email:', credentials.email);
      console.log('- Password length:', credentials.password.length);
      
      const response = await axios.post(`${API_BASE_URL}/login`, credentials, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: (status) => {
          // Consider 2xx and 4xx as valid responses to handle them properly
          return (status >= 200 && status < 300) || (status >= 400 && status < 500);
        },
      });
      
      console.log('🔧 Login Response Debug:');
      console.log('- Status:', response.status);
      console.log('- Status Text:', response.statusText);
      console.log('- Headers:', response.headers);
      console.log('- Data:', JSON.stringify(response.data, null, 2));
      
      // Handle error responses
      if (response.status >= 400) {
        const errorMessage = response.data?.message || response.data?.error || 'Incorrect/Invalid credentials';
        console.error('🔧 Login failed with error:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          fullResponse: response.data
        });
        throw new Error(errorMessage);
      }
      
      // Check for token in response - try different possible locations
      const token = response.data?.token || 
                   response.data?.access_token || 
                   response.data?.data?.token ||
                   response.data?.details?.token;
      
      if (!token) {
        console.error('🔧 No token found in successful response:');
        console.error('- Response keys:', Object.keys(response.data || {}));
        console.error('- Full response:', response.data);
        throw new Error('No authentication token received');
      }
      
      // Set token first
      console.log('🔧 Token found, setting token:', token.substring(0, 20) + '...');
      this.setToken(token);
      
      // Now fetch user details with the token
      console.log('🔧 Fetching user details after login...');
      try {
        const userDetails = await this.fetchUserDetailsAfterLogin();
        console.log('✅ User details fetched successfully after login:', userDetails);
        
        // Store user details in localStorage for the app to use
        localStorage.setItem('user', JSON.stringify(userDetails));
        
        return { success: true, user: userDetails };
      } catch (userError: any) {
        console.error('⚠️ Failed to fetch user details after login:', userError.message);
        // Don't fail the login if user details fetch fails
        // The token is already set, so user can still access the app
        console.log('Login successful but user details fetch failed - user can still access app');
        return { success: true, user: null };
      }
      
    } catch (error: any) {
      console.error('🔧 Login error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data ? JSON.parse(error.config.data) : null
        }
      });
      
      // Clear any partial auth state on error
      this.clearToken();
      throw error;
    }
  },

  // Fetch user details after login (internal method)
  async fetchUserDetailsAfterLogin() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No token available for user details fetch');
      }

      // Use direct API endpoint
      const response = await axios.post(
        'https://kiwamitestcloud.com/dashboardapis/api/getuserdetails',
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          timeout: 10000,
          validateStatus: (status) => status < 500
        }
      );

      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: Failed to fetch user details`);
      }

      const user = response.data?.data || response.data;
      
      // Parse fullname into firstName and lastName
      const fullname = user.fullname || '';
      const nameParts = fullname.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Handle role mapping
      let userRole = user.rolename || user.role || 'Developer';
      if (user.email === 'nyamaibigjoash@gmail.com') {
        userRole = 'Super Admin';
      } else if (userRole === 'Superadmin') {
        userRole = 'Super Admin';
      }

      return {
        id: user.id?.toString() || user._id || user.userid || '',
        firstName: firstName,
        lastName: lastName,
        username: user.username || user.email?.split('@')[0] || '',
        email: user.email || '',
        role: userRole,
        phone: user.phone || '',
        isEmailVerified: user.status === 'Active' || user.isEmailVerified || false,
        createdAt: user.created_at || user.createdAt,
        updatedAt: user.updated_at || user.updatedAt
      };
    } catch (error: any) {
      console.error('Error fetching user details after login:', error);
      throw error;
    }
  },

  // Register a new user
  async register(userData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
  }) {
    try {
      console.log('Attempting registration for:', userData.email);
      
      // Map role text to role ID expected by backend (as string)
      const roleMap: Record<string, string> = {
        'Tester': '2',
        'Developer': '3',
        'Superadmin': '5'
      };
      
      const payload = {
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        username: userData.username.trim(),
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        phone: userData.phone || '',
        role: roleMap[userData.role || 'Developer'] || '3'
      };
      
      console.log('Registration payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(
        `${API_BASE_URL}/register`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: (status) => status < 500
        }
      );

      console.log('Registration response status:', response.status);
      console.log('Registration response data:', JSON.stringify(response.data, null, 2));

      const data = response.data;

      // Check for error codes in response body (backend may return 200 with error)
      if (data?.code && data?.code !== '200' && data?.code !== '201') {
        // Handle nested message object (e.g., { message: { email: "..." } })
        let errorMessage = 'Registration failed';
        if (data?.message) {
          if (typeof data.message === 'string') {
            errorMessage = data.message;
          } else if (typeof data.message === 'object') {
            // Extract first error message from validation errors
            const firstKey = Object.keys(data.message)[0];
            errorMessage = data.message[firstKey] || 'Registration failed';
          }
        }
        console.error('Registration failed (error code in response):', data);
        return { success: false, message: errorMessage };
      }

      // Check for explicit error indicators
      if (data?.status === 'error' || data?.success === false) {
        const errorMessage = data?.message || 'Registration failed';
        return { success: false, message: errorMessage };
      }

      // Handle successful registration (200 or 300 with no error indicators)
      if (response.status === 200 || response.status === 300 || response.status === 201) {
        // Double-check the message doesn't indicate an error
        const msg = (data?.message || '').toLowerCase();
        if (msg.includes('error') || msg.includes('failed') || msg.includes('invalid')) {
          return { success: false, message: data?.message || 'Registration failed' };
        }
        
        return { 
          success: true, 
          message: data?.message?.message || data?.message || 'Registration successful! Please check your email to verify your account.',
          data: data,
          requiresVerification: true
        };
      }

      // Handle specific error cases
      let errorMessage = 'Registration failed';
      if (data?.message) {
        errorMessage = typeof data.message === 'string' 
          ? data.message 
          : data.message.message || errorMessage;
      } else if (response.status === 400) {
        errorMessage = 'Invalid registration data. Please check your information.';
      } else if (response.status === 409) {
        errorMessage = 'An account with this email or username already exists.';
      }

      return { success: false, message: errorMessage };

    } catch (error: any) {
      console.error('Registration error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      let errorMessage = 'Registration failed. Please try again.';
      if (error.message === 'Network Error') {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      return { success: false, message: errorMessage };
    }
  },

  // Send verification email
  async sendVerificationEmail(email: string) {
    if (!email) {
      console.error('No email provided for verification');
      throw new Error('Email is required');
    }

    console.log('Sending verification email to:', email);
    
    // Try direct API call first
    try {
      return await this.sendVerificationEmailDirect(email);
    } catch (directError) {
      console.log('Direct API call failed, trying fallback with original API client...');
      
      // Fallback to original API client
      try {
        return await this.sendVerificationEmailFallback(email);
      } catch (fallbackError) {
        console.error('Both direct and fallback API calls failed');
        console.error('Direct error:', directError);
        console.error('Fallback error:', fallbackError);
        throw directError; // Throw the original error
      }
    }
  },

  // Direct API call method using the correct sendemail endpoint
  async sendVerificationEmailDirect(email: string) {
    const endpoint = 'https://kiwamitestcloud.com/dashboardapis/api/sendemail';
    
    // Get token for authorization if available
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (token) {
      headers.Authorization = token;
    }
    
    // Use the correct payload format for sendemail endpoint
    const payload = {
      email: email,
      content: "Please verify your email address by clicking the link below.",
      link: `${window.location.origin}/verify-email`
    };

    console.log('Attempting direct API call with payload:', JSON.stringify(payload, null, 2));
    
    try {
      const response = await axios.post(endpoint, payload, {
        headers,
        validateStatus: (status) => status < 500, // Don't throw for 4xx errors
        timeout: 15000 // 15 second timeout
      });

      console.log('Direct API response:', {
        status: response.status,
        data: response.data
      });

      // Handle success cases
      if (response.status === 200 || response.status === 201) {
        console.log('Verification email sent successfully with direct API');
        return response.data;
      }

      // Handle error responses
      const errorMessage = response.data?.message || 
                          `Failed to send verification email (Status: ${response.status})`;
      throw new Error(errorMessage);
      
    } catch (error: any) {
      console.error('Direct API call error:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Fallback method using original API client
  async sendVerificationEmailFallback(email: string) {
    console.log('Using fallback API client for email verification');
    
    // Import the original API client
    const { api } = await import('../lib/api');
    
    const payload = {
      email: email,
      content: "Please verify your email address by clicking the link below.",
      link: `${window.location.origin}/verify-email`
    };

    console.log('Attempting fallback API call with payload:', JSON.stringify(payload, null, 2));
    
    try {
      const response = await api.post('/sendemail', payload);
      
      console.log('Fallback API response:', response);

      // Handle success cases
      if (response.status === 200 || response.status === 201) {
        console.log('Verification email sent successfully with fallback API');
        return response.data;
      }

      const errorMessage = response.data?.message || 
                          `Unexpected status code: ${response.status}`;
      throw new Error(errorMessage);
      
    } catch (error: any) {
      console.error('Fallback API call error:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Verify email with code
  async verifyEmailCode(email: string, code: string) {
    try {
      const formattedEmail = email.trim().toLowerCase();
      const formattedCode = code.trim();
      
      if (!formattedEmail || !formattedCode) {
        throw new Error('Email and verification code are required');
      }

      console.log('Verifying email code for:', formattedEmail);
      
      const endpoint = 'https://kiwamitestcloud.com/dashboardapis/api/emailcodeconfirmation';
      
      // Get token for authorization if available
      const token = this.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers.Authorization = token;
      }
      
      // Match the exact format expected by the backend
      const payload = {
        email: formattedEmail,
        code: formattedCode
      };
      
      console.log('Sending verification request with payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(endpoint, payload, {
        headers,
        validateStatus: (status) => {
          return status < 500; // Reject only if status code is 500 or higher
        },
      });

      console.log('Email verification response status:', response.status);
      console.log('Email verification response data:', response.data);

      // Check for HTTP error status
      if (response.status >= 400) {
        const errorMessage = response.data?.message || 
                          response.data?.error || 
                          `Failed to verify email (Status: ${response.status})`;
        console.error('Email verification failed:', errorMessage);
        throw new Error(errorMessage);
      }

      // Also check for error indicators in the response body (backend may return 200 with error in body)
      const data = response.data;
      
      // Check for error codes from backend (e.g., code: '205' means user not found)
      if (data?.code && data?.code !== '200' && data?.code !== '201') {
        const errorMessage = data?.message || 'Verification failed';
        console.error('Email verification failed (error code in response):', data);
        throw new Error(errorMessage);
      }
      
      if (data?.status === 'error' || data?.success === false || data?.status >= 400) {
        const errorMessage = data?.message || data?.error || 'Invalid verification code';
        console.error('Email verification failed (from response body):', errorMessage);
        throw new Error(errorMessage);
      }

      // If response has a message but no clear success indicator, check if it's an error message
      if (data?.message && !data?.success && !data?.verified) {
        const msg = data.message.toLowerCase();
        if (msg.includes('not found') || msg.includes('invalid') || msg.includes('expired') || msg.includes('error')) {
          throw new Error(data.message);
        }
      }

      return response.data;
    } catch (error: any) {
      console.error('Error in verifyEmailCode:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Provide more specific error messages based on the status code
      if (error.response?.status === 410) {
        throw new Error('The verification code has expired. Please request a new one.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid verification code. Please check and try again.');
      }
      
      throw error;
    }
  },

  // Forgot password function - using the correct resetpassword endpoint
  async forgotPassword(email: string) {
    try {
      console.log('Requesting password reset for:', email);
      
      const endpoint = 'https://kiwamitestcloud.com/dashboardapis/api/resetpassword';
      
      // Get token for authorization if available
      const token = this.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers.Authorization = token;
      }
      
      const response = await axios.post(endpoint, { email }, {
        headers,
        validateStatus: (status) => status < 500, // Don't throw for 4xx errors
      });
      
      console.log('Reset password response:', {
        status: response.status,
        data: response.data
      });
      
      if (response.status === 200 || response.status === 201) {
        return response.data;
      }
      
      // Handle specific error cases
      if (response.status === 404) {
        throw new Error('Password reset service is currently unavailable. Please contact support.');
      }
      
      // Handle other error responses
      const errorMessage = response.data?.message || 'Failed to process password reset request';
      throw new Error(errorMessage);
      
    } catch (error: any) {
      console.error('Reset password error:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      
      // Handle network errors
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      }
      
      // Re-throw the error if it's already an Error object with a message
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('An unexpected error occurred. Please try again later.');
    }
  },

  // Request password reset code - using the correct resetpassword endpoint
  async requestPasswordReset(email: string) {
    try {
      console.log('Requesting password reset code for:', email);
      
      const endpoint = 'https://kiwamitestcloud.com/dashboardapis/api/resetpassword';
      
      // Get token for authorization if available
      const token = this.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers.Authorization = token;
      }
      
      const response = await axios.post(endpoint, { email }, {
        headers,
        validateStatus: (status) => status < 500, // Don't throw for 4xx errors
      });
      
      console.log('Reset password code response:', {
        status: response.status,
        data: response.data
      });
      
      if (response.status === 200 || response.status === 201) {
        return response.data;
      }
      
      const errorMessage = response.data?.message || 'Failed to send reset code';
      throw new Error(errorMessage);
      
    } catch (error: any) {
      console.error('Request reset code error:', error);
      throw error instanceof Error ? error : new Error('Failed to request password reset');
    }
  },

  // Verify password reset code - separate verification without password
  async verifyPasswordResetCodeOnly(email: string, code: string) {
    try {
      // console.log('Verifying password reset code (verification only) for:', email, 'with code:', code);
      
      const endpoint = 'https://kiwamitestcloud.com/dashboardapis/api/resetpwdcodeconfirmation';
      
      // Get token for authorization if available
      const token = this.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers.Authorization = token;
      }
      
      // Try verification without password field first
      const payload = {
        email: email.trim().toLowerCase(),
        code: code.trim()
      };
      
      // console.log('Verifying code (no password) with payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(endpoint, payload, {
        headers,
        validateStatus: (status) => status < 500,
        timeout: 15000
      });
      
      // console.log('Code verification (no password) response:', {
      //   status: response.status,
      //   statusText: response.statusText,
      //   data: response.data
      // });
      
      // Check HTTP status first
      if (response.status >= 400) {
        const errorMessage = response.data?.message || `HTTP ${response.status}: Invalid verification code`;
        console.error('HTTP error during code verification (no password):', errorMessage);
        throw new Error(errorMessage);
      }

      // Check for error indicators in response body
      const data = response.data;
      
      // Check for explicit error status
      if (data?.status === 'error' || data?.success === false) {
        const errorMessage = data?.message || data?.error || 'Invalid verification code';
        console.error('API returned error status (no password):', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Check for numeric status codes in response body
      if (data?.status && typeof data.status === 'number' && data.status >= 400) {
        const errorMessage = data?.message || `Status ${data.status}: Invalid verification code`;
        console.error('API returned error status code (no password):', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Check for string status codes that indicate errors
      if (data?.code && data.code !== '200' && data.code !== '201' && data.code !== 'success') {
        const errorMessage = data?.message || `Code ${data.code}: Invalid verification code`;
        console.error('API returned error code (no password):', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Check for specific error messages in the response
      if (data?.message) {
        const msg = data.message.toLowerCase();
        if (msg.includes('invalid') || msg.includes('expired') || msg.includes('not found') || msg.includes('error') || msg.includes('wrong')) {
          console.error('API returned error message (no password):', data.message);
          throw new Error(data.message);
        }
      }

      // If we get here, assume the code is valid
      // console.log('✅ Password reset code verified successfully (no password)');
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Code verification error (no password):', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // If this approach fails, it might be because the endpoint requires a password
      // In that case, we'll skip separate verification and validate during password reset
      throw error;
    }
  },
  // Verify password reset code
  async verifyPasswordResetCode(email: string, code: string) {
    try {
      // First try verification without password
      return await this.verifyPasswordResetCodeOnly(email, code);
    } catch (error: any) {
      // console.log('Code verification without password failed, this might be expected if the endpoint requires password field');
      // console.log('Error:', error.message);
      
      // If the endpoint requires a password field for verification, we'll need to skip separate verification
      // and just validate the code during the actual password reset process
      
      // For now, let's check if the error suggests the endpoint needs a password
      const errorMsg = error.message?.toLowerCase() || '';
      if (errorMsg.includes('password') || errorMsg.includes('required') || errorMsg.includes('missing')) {
        // console.log('⚠️ Endpoint appears to require password field. Skipping separate verification.');
        // console.log('Code will be validated during password reset instead.');
        
        // Return a success response to allow proceeding to password reset
        // The actual validation will happen when the user submits the new password
        return { 
          message: 'Code format validated. Will verify with backend during password reset.',
          skipVerification: true 
        };
      }
      
      // For other errors, re-throw them
      throw error;
    }
  },
  async resetPassword(email: string, code: string, newPassword: string) {
    try {
      console.log('Resetting password for:', email, 'with code:', code);
      
      // First verify the code, then update password using the correct updatepassword endpoint
      // Step 1: Verify the code using resetpwdcodeconfirmation
      const verifyEndpoint = 'https://kiwamitestcloud.com/dashboardapis/api/resetpwdcodeconfirmation';
      
      const verifyHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      const verifyPayload = {
        email: email.trim().toLowerCase(),
        code: code.trim()
      };
      
      console.log('Step 1: Verifying code with payload:', JSON.stringify(verifyPayload, null, 2));
      
      const verifyResponse = await axios.post(verifyEndpoint, verifyPayload, {
        headers: verifyHeaders,
        validateStatus: (status) => status < 500,
        timeout: 15000
      });
      
      console.log('Code verification response:', {
        status: verifyResponse.status,
        data: verifyResponse.data
      });
      
      // Check if code verification failed
      if (verifyResponse.status >= 400) {
        const errorMessage = verifyResponse.data?.message || 'Invalid verification code';
        console.error('Code verification failed:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Check for error indicators in verification response
      const verifyData = verifyResponse.data;
      if (verifyData?.status === 'error' || verifyData?.success === false) {
        const errorMessage = verifyData?.message || 'Invalid verification code';
        console.error('Code verification returned error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Step 2: Try to get userid from verification response or use email-based approach
      console.log('Step 2: Getting userid for password update...');
      
      let userid: number | null = null;
      
      // First try to extract userid from verification response
      if (verifyData?.userid || verifyData?.user_id || verifyData?.id) {
        userid = parseInt(verifyData.userid || verifyData.user_id || verifyData.id);
        console.log('✅ Got userid from verification response:', userid);
      } else {
        console.log('⚠️ No userid in verification response, will try email-based password reset');
        
        // Try the resetpwdcodeconfirmation endpoint with password fields
        // This might work without needing a separate userid
        console.log('Step 2b: Trying resetpwdcodeconfirmation with password fields...');
        
        const resetWithPasswordPayload = {
          email: email.trim().toLowerCase(),
          code: code.trim(),
          password: newPassword,
          password_confirmation: newPassword
        };
        
        try {
          const resetWithPasswordResponse = await axios.post(verifyEndpoint, resetWithPasswordPayload, {
            headers: verifyHeaders,
            validateStatus: (status) => status < 500,
            timeout: 15000
          });
          
          console.log('Reset with password response:', {
            status: resetWithPasswordResponse.status,
            data: resetWithPasswordResponse.data
          });
          
          if (resetWithPasswordResponse.status === 200 || resetWithPasswordResponse.status === 201) {
            const resetData = resetWithPasswordResponse.data;
            
            // Check for success indicators
            if (resetData?.message) {
              const msg = resetData.message.toLowerCase();
              if (msg.includes('success') || msg.includes('updated') || msg.includes('reset') || msg.includes('changed')) {
                console.log('✅ Password reset successful using resetpwdcodeconfirmation with password');
                return resetWithPasswordResponse.data;
              }
            }
            
            // If no clear success message, continue to updatepassword approach
            console.log('⚠️ Ambiguous response from resetpwdcodeconfirmation, continuing to updatepassword approach');
          }
        } catch (resetError) {
          console.log('⚠️ resetpwdcodeconfirmation with password failed, continuing to updatepassword approach');
        }
        
        // If we still don't have userid, we can't use the updatepassword endpoint
        console.log('❌ Could not determine userid and resetpwdcodeconfirmation approach failed');
        throw new Error('Unable to reset password. Please try requesting a new verification code.');
      }
      
      // Step 3: Update password using the updatepassword endpoint (only if we have userid)
      if (userid) {
        console.log('Step 3: Updating password using updatepassword endpoint...');
        
        const updateEndpoint = 'https://kiwamitestcloud.com/dashboardapis/api/updatepassword';
        
        // For updatepassword, we might need a valid token, but during password reset users don't have one
        // Try without token first, then with token if available
        const token = this.getToken();
        const updateHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        
        // Only add token if we have one (user might be logged in and changing password)
        if (token) {
          updateHeaders.Authorization = token;
          console.log('Using existing token for updatepassword request');
        } else {
          console.log('No token available - attempting updatepassword without authentication');
        }
        
        const updatePayload = {
          userid: userid,
          password: newPassword,
          password_confirmation: newPassword
        };
        
        console.log('Password update payload:', JSON.stringify({
          ...updatePayload,
          password: '[REDACTED]',
          password_confirmation: '[REDACTED]'
        }, null, 2));
        
        const updateResponse = await axios.post(updateEndpoint, updatePayload, {
          headers: updateHeaders,
          validateStatus: (status) => status < 500,
          timeout: 15000
        });
        
        console.log('Password update response:', {
          status: updateResponse.status,
          statusText: updateResponse.statusText,
          data: updateResponse.data
        });
        
        // Check HTTP status
        if (updateResponse.status >= 400) {
          const errorMessage = updateResponse.data?.message || 'Failed to update password';
          console.error('HTTP error during password update:', errorMessage);
          throw new Error(errorMessage);
        }

        // Check for error indicators in response body
        const updateData = updateResponse.data;
        
        // Check for explicit error status
        if (updateData?.status === 'error' || updateData?.success === false) {
          const errorMessage = updateData?.message || updateData?.error || 'Password update failed';
          console.error('API returned error status:', errorMessage);
          throw new Error(errorMessage);
        }
        
        // Check for numeric status codes in response body
        if (updateData?.status && typeof updateData.status === 'number' && updateData.status >= 400) {
          const errorMessage = updateData?.message || `Status ${updateData.status}: Password update failed`;
          console.error('API returned error status code:', errorMessage);
          throw new Error(errorMessage);
        }

        console.log('✅ Password updated successfully using updatepassword endpoint');
        return updateResponse.data;
      } else {
        console.log('⚠️ No userid available, password reset may have been handled by resetpwdcodeconfirmation');
        return verifyResponse.data;
      }
      
    } catch (error: any) {
      console.error('❌ Password reset error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Provide more specific error messages based on status code
      if (error.response?.status === 400) {
        throw new Error('Invalid request. Please check your information and try again.');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized. Please try requesting a new code.');
      } else if (error.response?.status === 404) {
        throw new Error('Password update service not found. Please contact support.');
      } else if (error.response?.status === 422) {
        throw new Error('Password validation failed. Please check password requirements.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      // If it's already an Error object, re-throw it
      if (error instanceof Error) {
        throw error;
      }
      
      // Fallback error
      throw new Error('Failed to reset password. Please try again.');
    }
  },

  // Add getUserDetails method for password reset
  async getUserDetails() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post('https://kiwamitestcloud.com/dashboardapis/api/getuserdetails', {}, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        timeout: 10000
      });

      console.log('getUserDetails response:', response.data);
      
      if (response.status >= 400) {
        throw new Error('Failed to get user details');
      }

      const userData = response.data?.data || response.data;
      return {
        id: userData.id || userData.userid || userData._id,
        email: userData.email,
        fullname: userData.fullname
      };
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      throw new Error('Failed to fetch user details');
    }
  },

  // Set token with validation
  setToken(token: string) {
    if (!token) {
      console.error('Attempted to set empty token');
      return;
    }
    
    // Remove any existing Bearer prefix and add it back to ensure consistency
    const cleanToken = token.replace(/^Bearer\s*/i, '');
    const formattedToken = `Bearer ${cleanToken}`;
    
    localStorage.setItem(TOKEN_KEY, formattedToken);
    // Update axios default headers
    axios.defaults.headers.common['Authorization'] = formattedToken;
  },

  // Get token
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Clear token
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    delete axios.defaults.headers.common['Authorization'];
  },

  // Logout function
  logout() {
    this.clearToken();
    // Clear any other user-related data
    localStorage.removeItem('user');
  },

  // Check authentication status
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token; // Returns true if token exists
  },

  // Add a method to validate the current token
  validateToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return Promise.resolve(false);

    return axios.get(`${API_BASE_URL}/me`, {
      headers: {
        'Authorization': token // Token already includes "Bearer " prefix
      }
    })
    .then(() => true)
    .catch(() => {
      this.clearToken();
      return false;
    });
  },

  // Add method to refresh token
  async refreshToken(): Promise<string | null> {
    try {
      // Get current token to send in the refresh request
      const currentToken = this.getToken();
      if (!currentToken) {
        throw new Error('No token available for refresh');
      }

      const response = await axios.post(`${API_BASE_URL}/refresh`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': currentToken // Token already includes "Bearer " prefix
        }
      });

      if (response.data && response.data.token) {
        this.setToken(response.data.token);
        return response.data.token;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearToken();
      // Don't automatically redirect - let the app handle this
      console.log('Token refresh failed - user may need to login again');
      return null;
    }
  }
};

// Initialize axios defaults with token if available
const token = authService.getToken();
if (token) {
  axios.defaults.headers.common['Authorization'] = token;
}