import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Base interface for API responses
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
  statusText: string;
  headers?: any;
  config?: any;
}

// Base URL for the API - Vite proxies /api in development, but in production we communicate directly with the absolute API endpoint
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://kiwamitestcloud.com/dashboardapis/api' 
  : '/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: !import.meta.env.PROD,
      timeout: 30000
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for adding auth token and handling CORS
    this.client.interceptors.request.use(
      (config) => {
        // Ensure headers object exists
        config.headers = config.headers || {};
        
        // Safely get token from localStorage
        let token: string | null = null;
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            token = localStorage.getItem('token');
          } catch (e) {
            console.warn('Failed to access localStorage:', e);
          }
        }
        
        if (token) {
          // Ensure headers.common exists before modifying it
          config.headers.common = config.headers.common || {};
          // Ensure token has proper Bearer prefix regardless of how it was stored
          const cleanToken = token.replace(/^Bearer\s*/i, '');
          const formattedToken = `Bearer ${cleanToken}`;
          config.headers.Authorization = formattedToken;
          config.withCredentials = !import.meta.env.PROD;
          
          // Debug token formatting
          // console.log('[API] Token formatting:', {
          //   original: token ? `${token.substring(0, 20)}...` : 'null',
          //   hasBearer: token.startsWith('Bearer '),
          //   formatted: `${formattedToken.substring(0, 20)}...`,
          //   isValid: !!cleanToken
          // });
        } else {
          console.warn('[API] No authentication token found');
        }
        
        // Safely remove headers that might cause CORS issues
        if (config.headers.common) {
          delete config.headers.common['X-Requested-With'];
          delete config.headers.common['X-XSRF-TOKEN'];
        }
        
        // console.log(`[API] ${config.method?.toUpperCase() || 'GET'} ${config.baseURL || ''}${config.url || ''}`, {
        //   headers: config.headers || {},
        //   params: config.params || {},
        // });
        
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for handling responses and errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // console.log(`[API] Response ${response.status} ${response.statusText}`, {
        //   data: response.data,
        //   headers: response.headers,
        // });
        return response;
      },
      (error) => {
        if (error.response) {
          // Server responded with a status code outside 2xx
          console.error('[API] Response error:', {
            status: error.response.status,
            statusText: error.response.statusText,
            url: error.config?.url,
            method: error.config?.method,
          });
          
          if (error.response.status === 401) {
            console.error('[API] Unauthorized - please log in again');
            // Optionally redirect to login page or refresh token
          }
        } else if (error.request) {
          // Request was made but no response received
          console.error('[API] No response received:', error.request);
        } else {
          // Something happened in setting up the request
          console.error('[API] Request setup error:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<T>(url, config);
    return this.formatResponse<T>(response);
  }

  public async post<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<T>(url, data, config);
    return this.formatResponse<T>(response);
  }

  public async put<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put<T>(url, data, config);
    return this.formatResponse<T>(response);
  }

  public async patch<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch<T>(url, data, config);
    return this.formatResponse<T>(response);
  }

  public async delete<T = void>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<T>(url, config);
    return this.formatResponse<T>(response);
  }

  private formatResponse<T>(response: AxiosResponse<T>): ApiResponse<T> {
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config: response.config
    };
  }
}

// Create and export a singleton instance
export const api = new ApiClient();
