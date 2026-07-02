import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';
import { authService } from './authService';
import { backend_url } from '@/config';
import type { BugBashFunctionalItem } from '@/types/bug-bash';

const API_BASE_URL = backend_url;

export interface BugBashBug extends Omit<BugBashFunctionalItem, 'id' | 'createdAt' | 'updatedAt'> {
  bug_bash_id: string | number;
  module: string;
  environment: string;
  steps_to_reproduce: string[];
  expected_behavior: string;
  actual_behavior: string;
  reporter_id: string | number;
  status: 'open' | 'in-progress' | 'resolved' | 'wont-fix';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'bug';
}

export interface BugBashFeature extends Omit<BugBashBug, 'expected_behavior' | 'actual_behavior' | 'type'> {
  type: 'feature';
  business_value: string;
  observed_or_missing: 'observed' | 'missing';
  impact: 'low' | 'medium' | 'high';
}

export interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  failedCount: number;
  errors?: Array<{
    row: number;
    error: string;
  }>;
}

// Updated interfaces based on your API response
interface ApiSuccessResponse<T = any> {
  message: string;
  details?: {
    message: string;
    code: number;
  };
  code: string;
  data?: T;
  success?: boolean;
}

interface ApiErrorResponse {
  message: string;
  details?: {
    message: string;
    code: number;
  };
  code: string;
  success?: boolean;
}

// Request interceptor for debugging
axios.interceptors.request.use(
  (request) => {
    console.log('🚀 API Request:', {
      url: request.url,
      method: request.method?.toUpperCase(),
      headers: request.headers,
      data: request.data
    });
    return request;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
axios.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('❌ Response Interceptor Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Helper function to get auth headers
const getAuthHeaders = (contentType = 'application/json'): Record<string, string> => {
  // First, check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('Authentication is only available in browser environments');
  }

  try {
    // Get the token from authService (already includes "Bearer " prefix)
    const token = authService.getToken();
    
    // Debug: Log token details (safely)
    const tokenInfo = {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenStartsWithBearer: token?.startsWith('Bearer '),
      tokenPreview: token ? `${token.substring(0, 20)}...${token.substring(token.length - 8)}` : 'No token',
      timestamp: new Date().toISOString()
    };
    
    console.log('🔑 Auth Token Info:', tokenInfo);

    // Validate token existence
    if (!token) {
      const error = new Error('No authentication token found. Please log in again.');
      console.error('❌ Authentication Error:', error.message, { tokenInfo });
      throw error;
    }

    // Extract the actual JWT token (remove Bearer prefix if present)
    // This ensures we have a clean token to work with
    const cleanToken = token.replace(/^Bearer\s*/i, '');
    
    // Basic validation - just check if token looks reasonable
    if (cleanToken.length < 20) {
      console.warn('⚠️ Token seems too short:', cleanToken.length);
    }
    
    // Optional: Check JWT format (3 parts), but don't fail if it's different
    const tokenParts = cleanToken.split('.');
    if (tokenParts.length !== 3) {
      console.warn('⚠️ Token does not have standard JWT format', { 
        parts: tokenParts.length,
        expected: 3,
        tokenPreview: cleanToken.substring(0, 20) + '...'
      });
    }

    // Prepare headers with the token
    // IMPORTANT: Always add "Bearer " prefix to the clean token
    // This ensures consistent format regardless of how token is stored
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${cleanToken}`, // Always add Bearer prefix to clean token
    };
    
    // Only set Content-Type if not FormData
    if (contentType !== 'multipart/form-data') {
      headers['Content-Type'] = contentType;
    }
    
    // Debug: Log final headers (with redacted token)
    console.log('📋 Request Headers (redacted):', {
      ...headers,
      'Authorization': `Bearer ...${cleanToken.substring(cleanToken.length - 8)}`
    });
    
    // CRITICAL DEBUG: Log the ACTUAL authorization header being sent
    console.log('🔐 FULL Authorization Header (first 50 chars):', headers['Authorization'].substring(0, 50) + '...');
    console.log('🔐 Clean token length:', cleanToken.length);
    console.log('🔐 Token from localStorage (first 50 chars):', localStorage.getItem('token')?.substring(0, 50) + '...');
    
    return headers;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
    console.error('❌ Authentication Error:', errorMessage, { 
      error,
      timestamp: new Date().toISOString(),
      path: window.location.pathname
    });
    
    // Don't automatically redirect - let the calling code handle it
    // Just throw the error so the caller can decide what to do
    throw error instanceof Error ? error : new Error('Authentication error. Please log in again.');
  }
};

// Helper to extract user ID from JWT token
const getUserIdFromToken = (token: string): string => {
  try {
    const decoded = jwtDecode<{ sub?: string }>(token);
    console.log('👤 Token decoded for user ID:', decoded);
    
    if (!decoded?.sub) {
      throw new Error('Invalid token: No user ID found');
    }
    return decoded.sub;
  } catch (error) {
    console.error('❌ Error decoding token for user ID:', error);
    throw new Error('Invalid token format');
  }
};

// Check if the response indicates a business logic error
const hasBusinessError = (responseData: ApiSuccessResponse): boolean => {
  // Helper function to safely check string for error indicators
  const hasErrorIndicators = (str: any): boolean => {
    if (typeof str !== 'string') return false;
    const lowerStr = str.toLowerCase();
    return [
      'does not exist',
      'error',
      'fail',
      'invalid',
      'not found',
      'unauthorized',
      'forbidden',
      'bad request',
      'server error'
    ].some(indicator => lowerStr.includes(indicator));
  };

  // Check if there's an error in details
  if (responseData.details?.message && hasErrorIndicators(responseData.details.message)) {
    console.log('⚠️ Business error detected in details:', responseData.details.message);
    return true;
  }
  
  // Check if the main message indicates an error
  if (responseData.message && hasErrorIndicators(responseData.message)) {
    console.log('⚠️ Business error detected in message:', responseData.message);
    return true;
  }
  
  // Check if the response indicates an error status
  if (responseData.code && typeof responseData.code === 'string' && 
      hasErrorIndicators(responseData.code)) {
    console.log('⚠️ Business error detected in status code:', responseData.code);
    return true;
  }
  
  return false;
};

// Error handler for your API structure
const handleError = (error: unknown, defaultMessage: string): never => {
  console.error('💥 API Error Details:', {
    error,
    isAxiosError: axios.isAxiosError(error),
    responseData: axios.isAxiosError(error) ? error.response?.data : 'N/A',
    status: axios.isAxiosError(error) ? error.response?.status : 'N/A',
    statusText: axios.isAxiosError(error) ? error.response?.statusText : 'N/A'
  });

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const responseData = axiosError.response?.data;
    
    // Extract error message from your API's specific structure
    let errorMessage = defaultMessage;
    
    if (responseData?.details?.message) {
      // Use the detailed error message from details
      errorMessage = responseData.details.message;
    } else if (responseData?.message) {
      // Use the main message
      errorMessage = responseData.message;
    } else if (axiosError.message) {
      errorMessage = axiosError.message;
    }
    
    console.error('🚨 Throwing error:', errorMessage);
    throw new Error(errorMessage);
  }
  
  const finalError = error instanceof Error ? error : new Error(defaultMessage);
  console.error('🚨 Throwing generic error:', finalError.message);
  throw finalError;
};

// Response handler for your API structure
const handleResponse = <T>(response: AxiosResponse<ApiSuccessResponse<T>>): { data: T; message: string } => {
  console.log('📦 Processing response structure:', response.data);

  const responseData = response.data;

  // Handle case where message is an object
  const getMessage = (msg: any): string => {
    if (!msg) return 'Operation completed successfully';
    if (typeof msg === 'string') return msg;
    if (typeof msg === 'object') {
      // Try to get a meaningful message from the object
      return msg.message || msg.error || msg.details || JSON.stringify(msg);
    }
    return String(msg);
  };

  // Check if there's a business logic error in the response
  if (hasBusinessError(responseData)) {
    const errorMessage = getMessage(responseData.details?.message || responseData.message || 'Business logic error');
    console.error('❌ Business logic error in response:', errorMessage);
    throw new Error(errorMessage);
  }

  // Extract the success message
  let successMessage = getMessage(responseData.message);
  if (responseData.details?.message && !hasBusinessError(responseData)) {
    successMessage = getMessage(responseData.details.message);
  }

  // If no meaningful message, use a default
  if (!successMessage) {
    successMessage = 'Operation completed successfully';
  }

  // Handle data extraction
  let resultData: T;
  
  if (responseData.data !== undefined && responseData.data !== null) {
    console.log('✅ Using response.data.data');
    resultData = responseData.data;
  } else {
    console.log('✅ Using entire response as data');
    resultData = responseData as T;
  }

  console.log('✅ Response processed successfully:', { 
    message: successMessage, 
    data: resultData 
  });

  return {
    data: resultData,
    message: successMessage
  };
};

// Helper function to handle form data creation
const createFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  
  console.log('📝 Creating FormData from:', data);
  
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      console.log(`⏩ Skipping ${key}: undefined or null`);
      return;
    }
    
    if (Array.isArray(value)) {
      console.log(`📋 Processing array ${key}:`, value);
      // For arrays, append each item individually
      value.forEach((item, index) => {
        if (item !== undefined && item !== null) {
          const arrayKey = `${key}[${index}]`;
          formData.append(arrayKey, String(item));
          console.log(`  ➕ Appended ${arrayKey}:`, item);
        }
      });
    } else if (typeof value === 'object' && !(value instanceof File)) {
      console.log(`📄 Processing object ${key}:`, value);
      formData.append(key, JSON.stringify(value));
    } else {
      console.log(`📄 Processing primitive ${key}:`, value);
      formData.append(key, String(value));
    }
  });
  
  // Log FormData contents for debugging
  console.log('📦 FormData entries:');
  for (const [key, value] of formData.entries()) {
    console.log(`  ${key}:`, value);
  }
  
  return formData;
};

// Helper to validate API base URL
const validateApiUrl = (endpoint: string): string => {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log('🌐 API URL Validation:', {
    baseUrl: API_BASE_URL,
    endpoint,
    fullUrl
  });
  return fullUrl;
};

export const bugBashFunctionalService = {
  //#region Bugs
  /**
   * Add a bug to a bug bash
   * @param bugBashId - ID of the bug bash
   * @param bugData - Bug data to add
   * @returns The created bug and success message
   */
  async addBugToBugBash(
    bugBashId: string | number, 
    bugData: Omit<BugBashBug, 'bug_bash_id'>
  ): Promise<{ bug: BugBashBug; message: string }> {
    try {
      console.log('🐛 Starting addBugToBugBash:', { bugBashId, bugData });
      
      // Ensure we have a valid token
      let token = authService.getToken();
      if (!token) {
        console.log('🔑 No token found, attempting to refresh...');
        token = await authService.refreshToken();
        if (!token) {
          throw new Error('Authentication required. Please log in again.');
        }
      }

      // Create FormData to match the API's expected format
      const formData = new FormData();
      
      console.log('🆔 Bug Bash ID being used:', bugBashId, 'Type:', typeof bugBashId);
      
      // Add required fields with exact names from API documentation
      formData.append('bug_bash_id', String(bugBashId));
      formData.append('type', bugData.module || 'API'); // module maps to type
      formData.append('title', bugData.title);
      formData.append('description', bugData.description || '');
      
      // Map status values (API expects "Open", "In Progress", etc.)
      const statusMap: Record<string, string> = {
        'open': 'Open',
        'in-progress': 'In Progress',
        'resolved': 'Resolved',
        'wont-fix': 'Wont Fix'
      };
      formData.append('status', statusMap[bugData.status] || 'Open');
      
      // Map priority values (API expects "Low", "Medium", "High", "Critical")
      const priorityMap: Record<string, string> = {
        'low': 'Low',
        'medium': 'Medium',
        'high': 'High',
        'critical': 'Critical'
      };
      formData.append('priority', priorityMap[bugData.priority] || 'Medium');
      
      // Add severity (default to Major if not provided)
      formData.append('severity', 'Major');
      
      // Add optional fields
      if (bugData.environment) formData.append('browser', bugData.environment);
      if (bugData.steps_to_reproduce && bugData.steps_to_reproduce.length > 0) {
        formData.append('stepsToReproduce', bugData.steps_to_reproduce.join('\n'));
      }
      if (bugData.expected_behavior) formData.append('expectedResult', bugData.expected_behavior);
      if (bugData.actual_behavior) formData.append('actualResult', bugData.actual_behavior);
      formData.append('environment', bugData.environment || 'development');
      formData.append('remarks', '');
      
      console.log('📦 FormData prepared for API');

      // Prepare the request config
      const config: AxiosRequestConfig = {
        method: 'POST',
        url: validateApiUrl(`/bugbash/functional/bugs`),
        headers: getAuthHeaders('multipart/form-data'),
        data: formData,
        timeout: 30000,
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      };

      console.log('🔄 Sending bug creation request...');
      
      try {
        const response = await axios.request<ApiSuccessResponse<{ bug: BugBashBug }>>(config);
        
        console.log('✅ Raw API response:', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data
        });
        
        console.log('📋 Full response data:', JSON.stringify(response.data, null, 2));
        
        // This will now properly handle both success and business errors
        const { data: result, message: successMessage } = handleResponse<{ bug: BugBashBug }>(response);
        
        console.log('🎉 Bug operation completed:', { 
          result, 
          message: successMessage,
          fullResponse: response.data 
        });
        
        return {
          bug: result.bug,
          message: successMessage
        };
      } catch (requestError) {
        // Handle 401 Unauthorized - token might be expired
        if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
          console.log('🔐 Token might be expired, attempting to refresh...');
          const newToken = await authService.refreshToken();
          
          if (newToken) {
            // Update the token in the config and retry (newToken already has "Bearer " prefix)
            config.headers = {
              ...config.headers,
              'Authorization': newToken
            };
            
            const retryResponse = await axios.request<ApiSuccessResponse<{ bug: BugBashBug }>>(config);
            const { data: result, message: successMessage } = handleResponse<{ bug: BugBashBug }>(retryResponse);
            
            return {
              bug: result.bug,
              message: successMessage
            };
          }
        }
        
        // Log and rethrow other errors
        if (axios.isAxiosError(requestError)) {
          console.error('🔴 Axios error details:', {
            message: requestError.message,
            code: requestError.code,
            status: requestError.response?.status,
            statusText: requestError.response?.statusText,
            responseData: requestError.response?.data,
            request: {
              method: requestError.config?.method,
              url: requestError.config?.url,
              headers: requestError.config?.headers,
              data: requestError.config?.data
            }
          });
        } else {
          console.error('🔴 Non-Axios error:', requestError);
        }
        throw requestError;
      }
    } catch (error) {
      console.error('💥 Failed to add bug to bug bash:', error);
      throw handleError(error, 'Failed to add bug to bug bash');
    }
  },
  
  /**
   * Get all bugs for a bug bash
   * @param bugBashId - ID of the bug bash
   * @returns List of bugs and success message
   */
  getBugsByBugBashId: async (bugBashId: string | number): Promise<{ bugs: BugBashBug[]; message: string }> => {
    try {
      console.log('🔍 Fetching bugs for bug bash:', bugBashId);
      
      // According to the API documentation: GET /bugbash/functional/:bugBashId
      const endpoint = `/bugbash/functional/${bugBashId}`;
      const url = validateApiUrl(endpoint);
      
      console.log('🌐 Making request to:', url);
      
      const response = await axios.get<ApiSuccessResponse<any>>(
        url,
        { 
          headers: getAuthHeaders(),
          timeout: 15000,
          params: {
            // Add any additional query parameters if needed
            _t: Date.now() // Cache buster
          }
        }
      );
      
      console.log('📦 Raw response from getBugsByBugBashId:', response.data);
      
      const { data: result, message: successMessage } = handleResponse<any>(response);
      
      // The API returns the bug bash object with bugs nested inside
      // Extract bugs from the response - they might be in different formats
      let bugs: BugBashBug[] = [];
      
      if (Array.isArray(result)) {
        // If result is directly an array of bugs
        bugs = result;
      } else if (result && typeof result === 'object') {
        // If result is an object, look for bugs in common property names
        bugs = result.bugs || result.functional || result.data || [];
      }
      
      // Ensure we always return an array
      bugs = Array.isArray(bugs) ? bugs : [];
      
      console.log(`📋 Retrieved ${bugs.length} bugs with message:`, successMessage);
      console.log('📋 Bugs data:', bugs);
      
      return {
        bugs,
        message: successMessage
      };

    } catch (error) {
      console.error('💥 Failed to fetch bugs:', {
        error,
        bugBashId,
        timestamp: new Date().toISOString()
      });
      
      // If the error is 404 or the bug bash doesn't exist, return empty array
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log('⚠️ Bug bash not found or has no bugs, returning empty array');
        return {
          bugs: [],
          message: 'No bugs found for this bug bash'
        };
      }
      
      throw handleError(error, 'Failed to fetch bugs. Please try again later.');
    }
  },
  
  /**
   * Get a bug by ID
   * @param bugId - ID of the bug
   * @returns The bug details and success message
   */
  getBugById: async (bugId: string | number): Promise<{ bug: BugBashBug; message: string }> => {
    try {
      console.log('🔍 Fetching bug by ID:', bugId);
      
      const url = validateApiUrl(`/bugbash/functional/bugs/${bugId}`);
      const response = await axios.get<ApiSuccessResponse<BugBashBug>>(
        url,
        { 
          headers: getAuthHeaders(),
          timeout: 15000 
        }
      );
      
      const { data: result, message: successMessage } = handleResponse<BugBashBug>(response);
      console.log('📋 Bug details retrieved with message:', successMessage);
      
      return {
        bug: result,
        message: successMessage
      };

    } catch (error) {
      console.error('💥 Failed to get bug by ID:', error);
      throw handleError(error, 'Failed to get bug by ID');
    }
  },
  
  /**
   * Update a bug
   * @param bugId - ID of the bug to update
   * @param updates - Fields to update
   * @returns The updated bug and success message
   */
  updateBug: async (
    bugId: string | number, 
    updates: Partial<BugBashBug>
  ): Promise<{ bug: BugBashBug; message: string }> => {
    try {
      console.log('✏️ Updating bug:', { bugId, updates });
      
      const url = validateApiUrl(`/bugbash/functional/bugs/${bugId}`);
      const response = await axios.put<ApiSuccessResponse<BugBashBug>>(
        url,
        updates,
        { 
          headers: getAuthHeaders(),
          timeout: 15000 
        }
      );
      
      const { data: result, message: successMessage } = handleResponse<BugBashBug>(response);
      
      console.log('✅ Bug update completed:', { 
        result, 
        message: successMessage 
      });
      
      return {
        bug: result,
        message: successMessage
      };

    } catch (error) {
      console.error('💥 Failed to update bug:', error);
      throw handleError(error, 'Failed to update bug');
    }
  },
  
  /**
   * Delete a bug
   * @param bugId - ID of the bug to delete
   * @returns Success message
   */
  deleteBug: async (bugId: string | number): Promise<{ message: string }> => {
    try {
      console.log('🗑️ Deleting bug:', bugId);
      
      const url = validateApiUrl(`/bugbash/functional/bugs/${bugId}`);
      const response = await axios.delete<ApiSuccessResponse<void>>(
        url,
        { 
          headers: getAuthHeaders(),
          timeout: 15000 
        }
      );
      
      const { message: successMessage } = handleResponse<void>(response);
      console.log('✅ Bug deletion completed:', successMessage);
      
      return { message: successMessage };

    } catch (error) {
      console.error('💥 Failed to delete bug:', error);
      throw handleError(error, 'Failed to delete bug');
    }
  },
  
  /**
   * Import bugs from Excel
   * @param bugBashId - ID of the bug bash
   * @param file - Excel file containing bugs
   * @param columnMapping - Mapping of Excel columns to bug fields
   * @returns Import result with success/failure details
   */
  importBugs: async (
    bugBashId: string | number, 
    file: File, 
    columnMapping: Record<string, string>
  ): Promise<ImportResult> => {
    try {
      console.log('📤 Importing bugs from Excel:', { bugBashId, fileName: file.name, columnMapping });

      const formData = new FormData();
      formData.append('bugBashId', String(bugBashId));
      formData.append('excel', file);
      formData.append('columnMapping', JSON.stringify(columnMapping));
      
      // Log FormData contents
      console.log('📦 Import FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      const url = validateApiUrl(`/bugbash/functional/import/${bugBashId}`);
      const response = await axios.post<ApiSuccessResponse<ImportResult>>(
        url,
        formData,
        { 
          headers: getAuthHeaders('multipart/form-data'),
          timeout: 60000 
        }
      );
      
      const { data: result } = handleResponse<ImportResult>(response);
      console.log('✅ Import completed:', result);
      return result;

    } catch (error) {
      console.error('💥 Failed to import bugs:', error);
      console.error('💥 Import context:', {
        bugBashId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        columnMapping,
        mappedFieldCount: Object.keys(columnMapping).length
      });
      throw handleError(error, 'Failed to import bugs. Please check that your Excel file has data and all required fields (title) are mapped.');
    }
  },
  //#endregion
  
  //#region Features

  /**
   * Add a feature to a bug bash
   * @param bugBashId - ID of the bug bash
   * @param featureData - Feature data to add
   * @returns The created feature and success message
   */
  addFeatureToBugBash: async (
    bugBashId: string | number, 
    featureData: Omit<BugBashFeature, 'bug_bash_id'> & { type?: 'feature' }
  ): Promise<{ feature: BugBashFeature; message: string }> => {
    try {
      console.log('🌟 Starting addFeatureToBugBash:', { bugBashId, featureData });

      // Ensure we have a valid token
      let token = authService.getToken();
      if (!token) {
        console.log('🔑 No token found, attempting to refresh...');
        token = await authService.refreshToken();
        if (!token) {
          throw new Error('Authentication required. Please log in again.');
        }
      }

      // Create FormData to match the API's expected format (similar to bugs)
      const formData = new FormData();
      
      console.log('🆔 Bug Bash ID being used:', bugBashId, 'Type:', typeof bugBashId);
      
      // Add required fields with exact names from API documentation
      formData.append('bug_bash_id', String(bugBashId));
      formData.append('title', featureData.title);
      formData.append('description', featureData.description || '');
      
      // Feature-specific fields
      formData.append('business_value', featureData.business_value || 'To be determined');
      formData.append('observedormissing', featureData.observed_or_missing || 'observed');
      formData.append('impact', featureData.impact || 'medium');
      
      console.log('📦 FormData prepared for feature API');

      // Prepare the request config
      const config: AxiosRequestConfig = {
        method: 'POST',
        url: validateApiUrl('/bugbash/functional/features'),
        headers: getAuthHeaders('multipart/form-data'),
        data: formData,
        timeout: 30000,
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      };

      console.log('🔄 Sending feature creation request...');
      
      try {
        const response = await axios.request<ApiSuccessResponse<{ feature: BugBashFeature }>>(config);
        
        console.log('✅ Raw API response:', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data
        });
        
        console.log('📋 Full response data:', JSON.stringify(response.data, null, 2));
        
        // This will now properly handle both success and business errors
        const { data: result, message: successMessage } = handleResponse<{ feature: BugBashFeature }>(response);
        
        console.log('🎉 Feature operation completed:', { 
          result, 
          message: successMessage,
          fullResponse: response.data 
        });
        
        return {
          feature: result.feature,
          message: successMessage
        };
      } catch (requestError) {
        // Handle 401 Unauthorized - token might be expired
        if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
          console.log('🔐 Token might be expired, attempting to refresh...');
          const newToken = await authService.refreshToken();
          
          if (newToken) {
            // Update the token in the config and retry (newToken already has "Bearer " prefix)
            config.headers = {
              ...config.headers,
              'Authorization': newToken
            };
            
            const retryResponse = await axios.request<ApiSuccessResponse<{ feature: BugBashFeature }>>(config);
            const { data: result, message: successMessage } = handleResponse<{ feature: BugBashFeature }>(retryResponse);
            
            return {
              feature: result.feature,
              message: successMessage
            };
          }
        }
        
        // Log and rethrow other errors
        if (axios.isAxiosError(requestError)) {
          console.error('🔴 Axios error details:', {
            message: requestError.message,
            code: requestError.code,
            status: requestError.response?.status,
            statusText: requestError.response?.statusText,
            responseData: requestError.response?.data,
            request: {
              method: requestError.config?.method,
              url: requestError.config?.url,
              headers: requestError.config?.headers,
              data: requestError.config?.data
            }
          });
        } else {
          console.error('🔴 Non-Axios error:', requestError);
        }
        throw requestError;
      }
    } catch (error) {
      console.error('💥 Failed to add feature to bug bash:', error);
      throw handleError(error, 'Failed to add feature to bug bash');
    }
  },
  
  /**
   * Get all features for a bug bash
   * @param bugBashId - ID of the bug bash
   * @returns List of features and success message
   */
  getFeaturesByBugBashId: async (bugBashId: string | number): Promise<{ features: BugBashFeature[]; message: string }> => {
    try {
      console.log('🔍 Fetching features for bug bash:', bugBashId);
      
      // Use the functional endpoint with bug bash ID
      const endpoint = `/bugbash/functional/${bugBashId}`;
      const url = validateApiUrl(endpoint);
      
      console.log('🌐 Making request to:', url);
      
      const response = await axios.get<ApiSuccessResponse<any>>(
        url,
        { 
          headers: getAuthHeaders(),
          timeout: 15000,
          params: {
            type: 'feature', // Filter for features
            _t: Date.now() // Cache buster
          }
        }
      );
      
      console.log('📦 Raw response from getFeaturesByBugBashId:', JSON.stringify(response.data, null, 2));
      
      const { data: result, message: successMessage } = handleResponse<any>(response);
      
      // Extract all functional items from the response
      let allItems: any[] = [];
      
      if (Array.isArray(result)) {
        // If result is directly an array
        allItems = result;
        console.log('✅ Result is array, using directly');
      } else if (result && typeof result === 'object') {
        // If result is an object, look for items in common property names
        allItems = result.features || result.functional || result.data || result.details || result.message || [];
        console.log('✅ Result is object, extracted items from:', Object.keys(result));
      }
      
      // Ensure we have an array
      allItems = Array.isArray(allItems) ? allItems : [];
      
      console.log(`📋 Total items retrieved: ${allItems.length}`);
      console.log('📋 First item:', allItems[0]);
      
      // Filter for features only
      // Features have: title, description, type (might be 'feature'), business_value, impact, observedormissing
      const features = allItems.filter((item: any) => {
        // Check if it has feature-specific fields
        const hasFeatureFields = !!(item.business_value || item.impact || item.observedormissing);
        // Or if it's explicitly marked as feature
        const isMarkedAsFeature = item.type === 'feature' || item.type === 'improvement';
        
        console.log('🔍 Checking item:', {
          id: item.id,
          title: item.title,
          type: item.type,
          hasFeatureFields,
          isMarkedAsFeature,
          willInclude: hasFeatureFields || isMarkedAsFeature
        });
        
        return hasFeatureFields || isMarkedAsFeature;
      });
      
      console.log(`📋 Retrieved ${features.length} features (from ${allItems.length} total items) with message:`, successMessage);
      console.log('📋 Features:', features);
      
      return {
        features,
        message: successMessage
      };

    } catch (error) {
      console.error('💥 Failed to fetch features:', {
        error,
        bugBashId,
        timestamp: new Date().toISOString()
      });
      
      // If the error is 404 or the bug bash doesn't exist, return empty array
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log('⚠️ Bug bash not found or has no features, returning empty array');
        return {
          features: [],
          message: 'No features found for this bug bash'
        };
      }
      
      throw handleError(error, 'Failed to fetch features. Please try again later.');
    }
  },
  
  /**
   * Get a feature by ID
   * @param featureId - ID of the feature
   * @returns The feature details and success message
   */
  getFeatureById: async (featureId: string | number): Promise<{ feature: BugBashFeature; message: string }> => {
    try {
      console.log('🔍 Fetching feature by ID:', featureId);
      
      const url = validateApiUrl(`/bugbash/functional/features/${featureId}`);
      const response = await axios.get<ApiSuccessResponse<BugBashFeature>>(
        url,
        { 
          headers: getAuthHeaders(),
          timeout: 15000 
        }
      );
      
      const { data: result, message: successMessage } = handleResponse<BugBashFeature>(response);
      console.log('📋 Feature details retrieved with message:', successMessage);
      
      return {
        feature: result,
        message: successMessage
      };

    } catch (error) {
      console.error('💥 Failed to fetch feature details:', error);
      throw handleError(error, 'Failed to fetch feature details');
    }
  },
  
  /**
   * Update a feature
   * @param featureId - ID of the feature to update
   * @param updates - Fields to update
   * @returns The updated feature and success message
   */
  updateFeature: async (
    featureId: string | number, 
    updates: Partial<BugBashFeature>
  ): Promise<{ feature: BugBashFeature; message: string }> => {
    try {
      console.log('✏️ Updating feature:', { featureId, updates });
      
      const url = validateApiUrl(`/bugbash/functional/features/${featureId}`);
      const response = await axios.put<ApiSuccessResponse<BugBashFeature>>(
        url,
        updates,
        { 
          headers: getAuthHeaders(),
          timeout: 15000 
        }
      );
      
      const { data: result, message: successMessage } = handleResponse<BugBashFeature>(response);
      
      console.log('✅ Feature updated successfully:', { result, message: successMessage });
      return {
        feature: result,
        message: successMessage
      };

    } catch (error) {
      console.error('💥 Failed to update feature:', error);
      throw handleError(error, 'Failed to update feature');
    }
  },
  
  /**
   * Delete a feature
   * @param featureId - ID of the feature to delete
   * @returns Success message
   */
  deleteFeature: async (featureId: string | number): Promise<{ message: string }> => {
    try {
      console.log('🗑️ Deleting feature:', featureId);
      
      const url = validateApiUrl(`/bugbash/functional/features/${featureId}`);
      const response = await axios.delete<ApiSuccessResponse<void>>(
        url,
        { 
          headers: getAuthHeaders(),
          timeout: 15000 
        }
      );
      
      const { message: successMessage } = handleResponse<void>(response);
      console.log('✅ Feature deleted successfully:', successMessage);
      
      return { message: successMessage };

    } catch (error) {
      console.error('💥 Failed to delete feature:', error);
      throw handleError(error, 'Failed to delete feature');
    }
  },
  
  /**
   * Import features from Excel
   * @param bugBashId - ID of the bug bash
   * @param file - Excel file containing features
   * @param columnMapping - Mapping of Excel columns to feature fields
   * @returns Import result with success/failure details
   */
  importFeatures: async (
    bugBashId: string | number, 
    file: File, 
    columnMapping: Record<string, string>
  ): Promise<ImportResult> => {
    try {
      console.log('📤 Importing features from Excel:', { bugBashId, fileName: file.name, columnMapping });

      const formData = new FormData();
      formData.append('bugBashId', String(bugBashId));
      formData.append('excel', file);
      formData.append('columnMapping', JSON.stringify(columnMapping));
      
      console.log('📦 Import FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      const url = validateApiUrl(`/bugbash/functional/importfeatures/${bugBashId}`);
      const response = await axios.post<ApiSuccessResponse<ImportResult>>(
        url,
        formData,
        { 
          headers: getAuthHeaders('multipart/form-data'),
          timeout: 60000 
        }
      );
      
      const { data: result } = handleResponse<ImportResult>(response);
      console.log('✅ Features import completed:', result);
      return result;

    } catch (error) {
      console.error('💥 Failed to import features:', error);
      console.error('💥 Import context:', {
        bugBashId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        columnMapping,
        mappedFieldCount: Object.keys(columnMapping).length
      });
      throw handleError(error, 'Failed to import features. Please check that your Excel file has data and all required fields (title) are mapped.');
    }
  },
  //#endregion
};
