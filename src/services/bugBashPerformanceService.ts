import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { authService } from './authService';
import { backend_url } from '@/config';

const API_BASE_URL = backend_url;

export interface PerformanceResult {
  id?: string | number;
  bug_bash_id: string | number;
  tps: string | number;
  response_time: string | number;
  pass_rate: string | number;
  error_rate: string | number;
  jtl_file: string;
  created_at?: string;
  updated_at?: string;
}

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

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = authService.getToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  const cleanToken = token.replace(/^Bearer\s*/i, '');
  
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${cleanToken}`,
  };
};

// Response handler
const handleResponse = <T>(response: AxiosResponse<ApiSuccessResponse<T>>): { data: T; message: string } => {
  console.log('📦 Processing response:', response.data);

  const responseData = response.data;

  const getMessage = (msg: any): string => {
    if (!msg) return 'Operation completed successfully';
    if (typeof msg === 'string') return msg;
    if (typeof msg === 'object') {
      return msg.message || msg.error || msg.details || JSON.stringify(msg);
    }
    return String(msg);
  };

  const successMessage = getMessage(responseData.message || responseData.details?.message);

  let resultData: T;
  
  if (responseData.data !== undefined && responseData.data !== null) {
    resultData = responseData.data;
  } else {
    resultData = responseData as T;
  }

  return {
    data: resultData,
    message: successMessage
  };
};

// Error handler
const handleError = (error: unknown, defaultMessage: string): never => {
  console.error('💥 API Error:', error);

  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;
    
    let errorMessage = defaultMessage;
    
    if (responseData?.details?.message) {
      errorMessage = responseData.details.message;
    } else if (responseData?.message) {
      errorMessage = responseData.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
  
  throw error instanceof Error ? error : new Error(defaultMessage);
};

export const bugBashPerformanceService = {
  /**
   * Get all performance results for a bug bash
   */
  async getPerformanceByBugBashId(bugBashId: string | number): Promise<{ results: PerformanceResult[]; message: string }> {
    try {
      console.log('🔍 Fetching performance results for bug bash:', bugBashId);
      
      const endpoint = `/bugbash/performance/${bugBashId}`;
      const url = `${API_BASE_URL}${endpoint}`;
      
      console.log('🌐 Making request to:', url);
      
      const response = await axios.get<ApiSuccessResponse<any>>(url, { 
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      
      console.log('📦 Raw response:', JSON.stringify(response.data, null, 2));
      console.log('📦 Response type:', typeof response.data);
      console.log('📦 Response keys:', response.data ? Object.keys(response.data) : 'null');
      
      // Try to extract results directly from response first
      let results: PerformanceResult[] = [];
      
      // Check if response.data is directly an array
      if (Array.isArray(response.data)) {
        console.log('✅ response.data is array');
        results = response.data;
      }
      // Check if response.data has a data property that's an array
      else if (response.data?.data && Array.isArray(response.data.data)) {
        console.log('✅ response.data.data is array');
        results = response.data.data;
      }
      // Check if response.data has a details property that's an array
      else if (response.data?.details && Array.isArray(response.data.details)) {
        console.log('✅ response.data.details is array');
        results = response.data.details;
      }
      // Check if response.data has a message property that's an array
      else if (response.data?.message && Array.isArray(response.data.message)) {
        console.log('✅ response.data.message is array');
        results = response.data.message;
      }
      // Try handleResponse as fallback
      else {
        console.log('📋 Using handleResponse...');
        const { data: result, message: successMessage } = handleResponse<any>(response);
        console.log('📦 Parsed result:', result);
        
        if (Array.isArray(result)) {
          results = result;
        } else if (result && typeof result === 'object') {
          results = result.results || result.performance || result.data || result.details || result.message || [];
        }
      }
      
      results = Array.isArray(results) ? results : [];
      
      console.log(`📋 Final: Retrieved ${results.length} performance results`);
      console.log('📋 Results:', JSON.stringify(results, null, 2));
      
      const successMessage = response.data?.message || 'Performance results fetched successfully';
      
      return {
        results,
        message: successMessage
      };
    } catch (error) {
      console.error('💥 Failed to fetch performance results:', error);
      
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {
          results: [],
          message: 'No performance results found'
        };
      }
      
      throw handleError(error, 'Failed to fetch performance results');
    }
  },

  /**
   * Add a performance result
   */
  async addPerformanceResult(data: Omit<PerformanceResult, 'id' | 'created_at' | 'updated_at'>): Promise<{ result: PerformanceResult; message: string }> {
    try {
      console.log('📤 Adding performance result:', data);
      
      const url = `${API_BASE_URL}/bugbash/performance`;
      
      const response = await axios.post<ApiSuccessResponse<{ result: PerformanceResult }>>(
        url,
        data,
        { 
          headers: getAuthHeaders(),
          timeout: 30000,
        }
      );
      
      const { data: result, message: successMessage } = handleResponse<{ result: PerformanceResult }>(response);
      
      return {
        result: result.result,
        message: successMessage
      };
    } catch (error) {
      console.error('💥 Failed to add performance result:', error);
      throw handleError(error, 'Failed to add performance result');
    }
  },

  /**
   * Update a performance result
   */
  async updatePerformanceResult(
    id: string | number,
    data: Partial<PerformanceResult>
  ): Promise<{ result: PerformanceResult; message: string }> {
    try {
      console.log('✏️ Updating performance result:', { id, data });
      
      const url = `${API_BASE_URL}/bugbash/performance/${id}`;
      
      const response = await axios.put<ApiSuccessResponse<PerformanceResult>>(
        url,
        data,
        { 
          headers: getAuthHeaders(),
          timeout: 15000,
        }
      );
      
      const { data: result, message: successMessage } = handleResponse<PerformanceResult>(response);
      
      return {
        result,
        message: successMessage
      };
    } catch (error) {
      console.error('💥 Failed to update performance result:', error);
      throw handleError(error, 'Failed to update performance result');
    }
  },

  /**
   * Delete a performance result
   */
  async deletePerformanceResult(id: string | number): Promise<{ message: string }> {
    try {
      console.log('🗑️ Deleting performance result:', id);
      
      const url = `${API_BASE_URL}/bugbash/performance/${id}`;
      
      const response = await axios.delete<ApiSuccessResponse<void>>(url, { 
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      
      const { message: successMessage } = handleResponse<void>(response);
      
      return { message: successMessage };
    } catch (error) {
      console.error('💥 Failed to delete performance result:', error);
      throw handleError(error, 'Failed to delete performance result');
    }
  },
};
