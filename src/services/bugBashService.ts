import axios, { AxiosError, AxiosResponse } from 'axios';
import { authService } from './authService';
import { backend_url } from '@/config';
import type { BugBash } from '@/types/bug-bash';

const API_BASE_URL = backend_url;

// Log API base URL for debugging
console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Skip adding auth token for public routes
    const isPublicRoute = config.url?.includes('/bug-bash/');
    
    if (!isPublicRoute) {
      const token = authService.getToken();
      if (token) {
        const authToken = token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;
        config.headers.Authorization = `Bearer ${authToken}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and parse response data
api.interceptors.response.use(
  (response) => {
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      console.error('Received HTML response instead of JSON:', response.data);
      throw new Error('Received HTML response from server. Check API endpoint and proxy configuration.');
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // If error is 401 and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const newToken = await authService.refreshToken();
        
        if (newToken) {
          // Update the Authorization header with the new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Retry the original request with the new token
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        // If refresh fails, clear the token but don't force redirect
        authService.clearToken();
        // Let the app handle authentication state changes gracefully
        // Don't use window.location.href as it causes abrupt site closures
        console.log('Token refresh failed - authentication required');
      }
    }
    
    // Log the error for debugging
    if (error.response) {
      console.error('Response error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

interface ApiResponse<T = any> {
  message: string;
  details: T;
  code: string;
  errors?: Record<string, string | string[]>;
  [key: string]: any; // Allow for additional properties
}

// Helper function to handle successful responses
const handleSuccess = <T>(response: AxiosResponse<ApiResponse<T> | T>): T => {
  const responseData = response.data;
  
  // Handle the case where the response is wrapped in a standard API response object
  if (responseData && typeof responseData === 'object' && 'details' in responseData) {
    return (responseData as ApiResponse<T>).details;
  }
  
  return responseData as T;
};

// Helper function to handle errors
const handleError = (error: unknown, operation: string): never => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.message;
    throw new Error(`Failed to ${operation}: ${message}`);
  }
  throw new Error(`An unexpected error occurred while ${operation}`);
};

// Simple cache to reduce API calls
let bugBashesCache: { data: BugBash[]; timestamp: number } | null = null;
let bugBashCache: Map<string, { data: BugBash; timestamp: number }> = new Map();
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Fetch all bug bash sessions
 */
export const fetchBugBashes = async (forceRefresh = false): Promise<BugBash[]> => {
  // Return cached data if available and not expired
  if (!forceRefresh && bugBashesCache && Date.now() - bugBashesCache.timestamp < CACHE_DURATION) {
    console.log('Returning cached bug bashes');
    return bugBashesCache.data;
  }

  try {
    const endpoint = '/bugbashes';
    console.log('Fetching bug bashes from:', `${API_BASE_URL}${endpoint}`);
    
    // Add request logging
    console.log('Sending GET request to', endpoint);
    const response = await api.get<ApiResponse<BugBash[]>>(endpoint);
    console.log('Response status:', response.status, response.statusText);
    
    // Log response headers and data
    console.log('Response headers:', response.headers);
    console.log('Response data:', response.data);
    
    const data = handleSuccess<BugBash[]>(response);
    
    // Ensure we always return an array
    if (!Array.isArray(data)) {
      console.warn('Expected array but got:', data);
      return [];
    }
    
    // Map the data WITHOUT fetching functional items to avoid rate limiting
    // Functional items will be fetched individually when viewing a specific bug bash
    const mappedData = data.map((item: any) => {
      const bugBashId = item.id || item._id;
      
      return {
        ...item,
        id: bugBashId || `temp-${Math.random().toString(36).substr(2, 9)}`,
        title: item.title || item.name || 'Untitled Bug Bash',
        startDate: item.startDate || item.startTime || new Date().toISOString(),
        endDate: item.endDate || item.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: item.status || 'planned',
        description: item.description || '',
        participants: Array.isArray(item.participants) ? item.participants : [],
        createdBy: item.createdBy || 'unknown',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        // Use existing functional items from response, or empty array
        functional: Array.isArray(item.functional) ? item.functional : [],
        performance: Array.isArray(item.performance) ? item.performance : [],
        security: Array.isArray(item.security) ? item.security : []
      };
    });
    
    console.log('Mapped bug bash data with functional items:', mappedData);
    
    // Update cache
    bugBashesCache = {
      data: mappedData,
      timestamp: Date.now()
    };
    
    return mappedData;
  } catch (error) {
    console.error('Error in fetchBugBashes:', error);
    if (axios.isAxiosError(error)) {
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      });
    }
    throw error; // Re-throw to allow error handling in components
  }
};

/**
 * Fetch a single bug bash by ID
 */
export const fetchBugBashById = async (id: string, forceRefresh = false): Promise<BugBash> => {
  // Return cached data if available and not expired
  const cached = bugBashCache.get(id);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[DEBUG] Returning cached bug bash ${id}`);
    return cached.data;
  }

  try {
    console.log(`[DEBUG] Fetching bug bash with ID: ${id}`);
    
    // Log the full request URL
    const requestUrl = `${API_BASE_URL}/bugbashes/${id}`;
    console.log(`[DEBUG] Request URL: ${requestUrl}`);
    
    // Log auth token for debugging
    const token = authService.getToken();
    console.log(`[DEBUG] Auth token exists: ${!!token}`);
    
    const response = await api.get<ApiResponse<BugBash>>(`/bugbashes/${id}`, {
      // Add timestamp to prevent caching
      params: { _t: Date.now() },
      // Log request details
      transformRequest: [(data, headers) => {
        console.log('[DEBUG] Request headers:', headers);
        return data;
      }],
    });
    
    console.log('[DEBUG] Bug bash response status:', response.status, response.statusText);
    console.log('[DEBUG] Response headers:', JSON.stringify(response.headers, null, 2));
    console.log('[DEBUG] Raw response data:', JSON.stringify(response.data, null, 2));
    
    if (!response.data) {
      console.error('[ERROR] Empty response data received');
      throw new Error('Empty response data received from server');
    }
    
    const data = handleSuccess<BugBash>(response);
    
    // Fetch functional bugs/features from the separate endpoint
    let functionalItems: any[] = [];
    try {
      console.log(`[DEBUG] Fetching functional items for bug bash ${id}`);
      const functionalResponse = await api.get(`/bugbash/functional/${id}`, {
        params: { _t: Date.now() }
      });
      
      console.log('[DEBUG] Functional items response:', functionalResponse.data);
      
      // Extract functional items from response
      const functionalData = handleSuccess<any>(functionalResponse);
      if (Array.isArray(functionalData)) {
        functionalItems = functionalData;
      } else if (functionalData && typeof functionalData === 'object') {
        functionalItems = functionalData.functional || functionalData.bugs || functionalData.data || [];
      }
      
      console.log(`[DEBUG] Found ${functionalItems.length} functional items`);
    } catch (functionalError) {
      console.warn('[WARN] Failed to fetch functional items:', functionalError);
      // Continue without functional items if the endpoint fails
    }
    
    // Map the data to ensure field names match
    const mappedData: BugBash = {
      ...data,
      id: data.id || id,
      title: data.title || (data as any).name || 'Untitled Bug Bash',
      description: data.description || '',
      startDate: data.startDate || (data as any).startTime || new Date().toISOString(),
      endDate: data.endDate || (data as any).endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: data.status || 'planned',
      participants: Array.isArray(data.participants) ? data.participants : [],
      createdBy: data.createdBy || 'unknown',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      functional: functionalItems.length > 0 ? functionalItems : (Array.isArray(data.functional) ? data.functional : []),
      performance: Array.isArray(data.performance) ? data.performance : [],
      security: Array.isArray(data.security) ? data.security : []
    };
    
    console.log('[DEBUG] Mapped bug bash detail:', JSON.stringify(mappedData, null, 2));
    console.log(`[DEBUG] Total functional items: ${mappedData.functional.length}`);
    
    // Update cache
    bugBashCache.set(id, {
      data: mappedData,
      timestamp: Date.now()
    });
    
    return mappedData;
  } catch (error) {
    console.error(`[ERROR] Error fetching bug bash ${id}:`, error);
    
    if (axios.isAxiosError(error)) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        request: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
          data: error.config?.data
        }
      };
      
      console.error('[ERROR] Axios error details:', JSON.stringify(errorDetails, null, 2));
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('[ERROR] Server responded with error status:', error.response.status);
        console.error('[ERROR] Error response data:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('[ERROR] No response received from server. Request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('[ERROR] Request setup error:', error.message);
      }
    } else if (error instanceof Error) {
      console.error('[ERROR] Non-Axios error:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Create a more user-friendly error message
    const friendlyError = new Error(`Failed to fetch bug bash: ${error instanceof Error ? error.message : 'Unknown error'}`);
    (friendlyError as any).originalError = error;
    throw friendlyError;
  }
};

/**
 * Create a new bug bash session
 */
export const createBugBash = async (bugBash: Omit<BugBash, 'id' | 'createdAt' | 'updatedAt'>): Promise<BugBash> => {
  try {
    console.log('Creating new bug bash (original data):', JSON.stringify(bugBash, null, 2));
    
    // Transform to API format - only send what API expects
    // Note: scope field causes validation errors, so we're omitting it for now
    const apiPayload = {
      name: bugBash.title || bugBash.name || 'Untitled Bug Bash',
      requirements: bugBash.description || 'General testing'
    };
    
    console.log('Transformed API payload:', JSON.stringify(apiPayload, null, 2));
    
    // Log the full URL being called
    const fullUrl = `${API_BASE_URL}/bugbashes`;
    console.log('Making POST request to:', fullUrl);
    
    const response = await api.post<ApiResponse<BugBash>>('/bugbashes', apiPayload);
    
    console.log('Create bug bash response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });
    
    console.log('Raw response data structure:', JSON.stringify(response.data, null, 2));
    
    // Check if the response indicates an error (code 300 is validation error)
    const responseCode = typeof response.data.code === 'number' ? response.data.code : null;
    if (responseCode === 300 || (responseCode !== null && responseCode >= 400)) {
      console.error('API validation error:', response.data);
      const errorMessage = response.data.message;
      
      // Format validation errors for display
      if (typeof errorMessage === 'object') {
        const errors = Object.entries(errorMessage)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        throw new Error(`Validation failed: ${errors}`);
      }
      
      throw new Error(errorMessage || 'Failed to create bug bash');
    }
    
    // The API returns the created bug bash in response.data.message or response.data.details
    const createdBugBash: any = response.data?.details || response.data?.message || response.data;
    
    console.log('Extracted bug bash data:', createdBugBash);
    
    // Map the response to our BugBash type
    const mappedBugBash: BugBash = {
      id: createdBugBash.id || createdBugBash._id || `temp-${Date.now()}`,
      name: createdBugBash.name || apiPayload.name,
      title: createdBugBash.title || createdBugBash.name || apiPayload.name,
      description: createdBugBash.description || createdBugBash.requirements || apiPayload.requirements || '',
      scope: createdBugBash.scope || 'functional',
      startDate: createdBugBash.startDate || createdBugBash.startTime || new Date().toISOString(),
      endDate: createdBugBash.endDate || createdBugBash.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: createdBugBash.status || 'planned',
      participants: Array.isArray(createdBugBash.participants) ? createdBugBash.participants : [],
      createdBy: createdBugBash.createdBy || 'system',
      createdAt: createdBugBash.createdAt || new Date().toISOString(),
      updatedAt: createdBugBash.updatedAt || new Date().toISOString(),
      functional: Array.isArray(createdBugBash.functional) ? createdBugBash.functional : [],
      performance: Array.isArray(createdBugBash.performance) ? createdBugBash.performance : [],
      security: Array.isArray(createdBugBash.security) ? createdBugBash.security : []
    };
    
    console.log('Mapped created bug bash:', mappedBugBash);
    
    return mappedBugBash;
  } catch (error) {
    console.error('Error creating bug bash:', error);
    if (axios.isAxiosError(error)) {
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      });
    }
    throw error;
  }
};

/**
 * Update an existing bug bash session
 */
export const updateBugBash = async (id: string, updates: Partial<BugBash>): Promise<BugBash> => {
  // Create a clean request payload with only the fields we want to update
  const { 
    // Remove fields that shouldn't be sent to the server
    id: _id, 
    createdAt, 
    updatedAt: _updatedAt, 
    // Extract the fields we want to update
    ...validUpdates 
  } = updates;

  // Create the final request data with proper formatting
  const requestData = {
    ...validUpdates,
    updatedAt: new Date().toISOString()
  };

  // Remove any undefined or null values
  Object.keys(requestData).forEach(key => {
    if (requestData[key] === undefined || requestData[key] === null) {
      delete requestData[key];
    }
  });

  try {
    console.log(`[${new Date().toISOString()}] Updating bug bash ${id} with:`, JSON.stringify(requestData, null, 2));
    
    // Ensure the URL is constructed correctly without double slashes
    const endpoint = `/bugbashes/${id}`.replace(/\/+/g, '/');
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log('Full request URL:', fullUrl);
    
    // Log the token status (but not the actual token for security)
    const token = authService.getToken();
    console.log('Auth token present:', !!token);
    
    // Make the request with proper error handling and timeout
    const response = await api.put<ApiResponse<BugBash>>(endpoint, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token.replace('Bearer ', '')}` : ''
      },
      validateStatus: (status) => status < 500 // Don't throw for 4xx errors
    });
    
    console.log('Update bug bash response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });
    
    // Handle non-2xx responses
    if (response.status >= 400) {
      console.error('Error response details:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
      
      let errorMessage = response.data?.message || `Request failed with status ${response.status}`;
      
      // Add validation errors to the message if available
      if (response.status === 422 && response.data?.errors) {
        const validationErrors = Object.entries(response.data.errors)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('; ');
        errorMessage = `Validation failed: ${validationErrors}`;
      }
      
      const error = new Error(errorMessage) as any;
      error.response = response;
      throw error;
    }
    
    return handleSuccess<BugBash>(response);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error updating bug bash ${id}:`, error);
    
    if (axios.isAxiosError(error)) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        request: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
          data: error.config?.data ? (typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data) : null
        },
        stack: error.stack
      };
      
      console.error('Detailed error information:', JSON.stringify(errorDetails, null, 2));
      
      // If we have validation errors, log them in a more readable format
      if (error.response?.status === 422 && error.response?.data) {
        const validationErrors = error.response.data;
        console.error('Validation errors:', validationErrors);
        
        // Create a more user-friendly error message
        const errorMessage = 'Validation failed: ' + 
          (validationErrors.errors ? 
            Object.entries(validationErrors.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('; ')
            : 'Invalid data provided');
            
        const validationError = new Error(errorMessage);
        (validationError as any).isValidationError = true;
        (validationError as any).validationErrors = validationErrors;
        throw validationError;
      }
    }
    
    // Re-throw the original error if we can't handle it specially
    throw error;
  }
};

/**
 * Delete a bug bash session
 */
export const deleteBugBash = async (id: string): Promise<void> => {
  try {
    console.log(`Deleting bug bash with ID: ${id}`);
    const response = await api.delete(`/bugbashes/${id}`);
    console.log('Delete bug bash response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
  } catch (error) {
    console.error(`Error deleting bug bash ${id}:`, error);
    if (axios.isAxiosError(error)) {
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
    }
    throw error;
  }
};
