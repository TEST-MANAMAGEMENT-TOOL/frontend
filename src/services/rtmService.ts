import axios, { AxiosError, AxiosResponse } from 'axios';
import { authService } from './authService';
import { backend_url } from '@/config';

// Use direct URL since we're having proxy issues
const API_BASE_URL = backend_url;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // Disable credentials for now to avoid CORS preflight
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      const authToken = token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;
      config.headers.Authorization = `Bearer ${authToken}`;
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
    // Check if the response is HTML
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      console.error('Received HTML response instead of JSON:', response.data);
      throw new Error('Received HTML response from server. Check API endpoint and proxy configuration.');
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      console.error('Response error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        data: error.response.data,
      });
    }
    return Promise.reject(error);
  }
);

export interface RTMEntry {
  id?: string;
  reqId?: string;
  mainFeature: string;
  subFeature: string;
  description: string;
  remarks: string;
  testPlanId?: string; // Test plan ID required by backend
  status?: string;
  testStatus?: string;
  actions?: string;
  testCaseIds?: string[]; // Array of linked test case IDs
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  message: string;
  details: T;
  code: string;
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

// Cache promise for fetching RTM entries to prevent concurrent duplicates (N+1 query problem)
let rtmEntriesPromise: Promise<RTMEntry[]> | null = null;
let cacheTimestamp = 0;
const RTM_CACHE_DURATION = 10 * 1000; // 10 seconds cache duration

export const fetchRTMEntries = async (bypassCache = false): Promise<RTMEntry[]> => {
  if (!bypassCache && rtmEntriesPromise && (Date.now() - cacheTimestamp) < RTM_CACHE_DURATION) {
    console.log('[RTMService] Returning cached RTM entries promise');
    return rtmEntriesPromise;
  }

  if (bypassCache || (Date.now() - cacheTimestamp) >= RTM_CACHE_DURATION) {
    rtmEntriesPromise = null;
  }

  if (!rtmEntriesPromise) {
    cacheTimestamp = Date.now();
    rtmEntriesPromise = (async () => {
      try {
        const endpoint = `${API_BASE_URL}/requirements`;
        console.log('=== FETCHING RTM ENTRIES ===');
        console.log('Fetching RTM entries from:', endpoint);
        console.log('Request headers:', api.defaults.headers);
        
        const response = await api.get<ApiResponse<RTMEntry[]>>('/requirements');
        console.log('Raw API response:', response);
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const data = handleSuccess<RTMEntry[]>(response);
        
        // Ensure we always return an array
        if (!Array.isArray(data)) {
          console.warn('Expected array but got:', data);
          return [];
        }
        
        // Log the raw data to see the structure
        console.log('Raw RTM data from API:', data);
        console.log('Number of entries fetched:', data.length);
        console.log('Sample entry structure:', data[0]);
        console.log('All entry IDs:', data.map((item: any) => item.id || item._id));
        console.log('All reqIds:', data.map((item: any) => item.reqId || item.requirementId));
        
        // Map the data to ensure field names match our RTMEntry type
        const mappedData = data.map((item: any) => {
          const mapped = {
            ...item,
            // Map potential field name variations
            id: item.id?.toString() || item._id?.toString() || '',
            reqId: item.reqId || item.req_id || item.requirementId || item.requirement_id || '',
            mainFeature: item.mainFeature || item.main_feature || item.feature || '',
            subFeature: item.subFeature || item.sub_feature || item.featureSubsection || item.feature_subsection || item.subfeature || '',
            description: item.description || item.desc || '',
            remarks: item.remarks || item.notes || item.comment || '',
            status: item.status || item.statusType || '',
            testStatus: item.testStatus || item.test_status || '',
            actions: item.actions || item.action || '',
            testCaseIds: Array.isArray(item.testcase_ids)
              ? item.testcase_ids.map(String)
              : Array.isArray(item.testCaseIds)
                ? item.testCaseIds.map(String)
                : typeof item.testCaseIds === 'string'
                  ? item.testCaseIds.split(',').map((id: string) => id.trim()).filter(Boolean)
                  : typeof item.testcaseIds === 'string'
                    ? item.testcaseIds.split(',').map((id: string) => id.trim()).filter(Boolean)
                    : typeof item.testCaseId === 'string'
                      ? item.testCaseId.split(',').map((id: string) => id.trim()).filter(Boolean)
                      : typeof item.testcaseId === 'string'
                        ? item.testcaseId.split(',').map((id: string) => id.trim()).filter(Boolean)
                        : typeof item.testcase_id === 'string'
                          ? item.testcase_id.split(',').map((id: string) => id.trim()).filter(Boolean)
                          : (item.testCaseId || item.testcaseId || item.testcase_id)
                            ? [String(item.testCaseId || item.testcaseId || item.testcase_id)]
                            : [],
            testPlanId: item.testPlanId?.toString() || item.test_plan_id?.toString() || '',
            createdAt: item.createdAt || item.created_at || new Date().toISOString(),
            updatedAt: item.updatedAt || item.updated_at || new Date().toISOString()
          };
          return mapped;
        });
        
        console.log('Mapped RTM data:', mappedData);
        console.log('Number of mapped entries:', mappedData.length);
        console.log('=== END FETCHING RTM ENTRIES ===');
        
        return mappedData;
      } catch (error) {
        console.error('Error in fetchRTMEntries:', error);
        rtmEntriesPromise = null; // Clear cache on error
        return []; // Return empty array instead of throwing to prevent UI crash
      }
    })();
  }

  return rtmEntriesPromise;
};

export const createRTMEntry = async (entry: Omit<RTMEntry, 'id'>): Promise<RTMEntry> => {
  try {
    console.log('=== CREATE RTM ENTRY ===');
    console.log('Creating RTM entry with data:', entry);
    
    // Transform field names to match backend API expectations
    const backendPayload = {
      reqId: entry.reqId || undefined,
      description: entry.description,
      testPlanId: parseInt(entry.testPlanId || '0'), // Convert to integer
      mainFeature: entry.mainFeature,
      featureSubsection: entry.subFeature || '',
      remarks: entry.remarks || '',
      status: entry.status || 'Active',
      testStatus: entry.testStatus || 'Pass',
      testcaseIds: entry.testCaseIds ? entry.testCaseIds.join(', ') : undefined,
      actions: entry.actions || 'Ready for testing'
    };
    
    console.log('Transformed payload for backend:', backendPayload);
    console.log('testPlanId type:', typeof backendPayload.testPlanId);
    
    // Validate testPlanId
    if (!backendPayload.testPlanId || backendPayload.testPlanId === 0) {
      console.error('Invalid testPlanId:', entry.testPlanId);
      throw new Error('Test Plan ID is required and must be valid');
    }
    
    // Use POST for creation (PUT returns 405)
    const response = await api.post<ApiResponse<any>>('/requirements', backendPayload);
    console.log('Create RTM response (POST):', response);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    // Handle nested response structure
    const responseData = response.data as any;
    console.log('Response code:', responseData.code);
    console.log('Response message:', responseData.message);
    
    // Check for success (code 200 or nested details)
    if (responseData.code === '200' || responseData.code === 200 || responseData.code === 300 || responseData.code === '300') {
      console.log('Entry created successfully!');
      
      // Extract the created entry from nested details
      // Handle both code 200 (details.details) and code 300 (message.details) structures
      const createdEntry = responseData.details?.details || responseData.details || responseData.message?.details || responseData.message || responseData;
      console.log('Created entry from backend:', createdEntry);
      
      // For code 300, backend may not return the created entry, so we return a placeholder
      if ((responseData.code === 300 || responseData.code === '300') && (!createdEntry || !createdEntry.id)) {
        console.log('Code 300: Backend saved entry but did not return it. Will fetch from database.');
        rtmEntriesPromise = null; // Invalidate cache
        return {
          ...entry,
          id: `temp-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as RTMEntry;
      }
      
      if (!createdEntry || !createdEntry.id) {
        console.error('Backend returned success but no entry with ID!');
        console.error('Full response:', responseData);
        console.error('Checking message object:', responseData.message);
        throw new Error('Backend did not return created entry with ID');
      }
      
      // Transform backend response back to frontend format
      const transformedEntry: RTMEntry = {
        id: createdEntry.id?.toString(),
        reqId: createdEntry.reqId || createdEntry.req_id || createdEntry.requirementId || createdEntry.requirement_id || entry.reqId,
        mainFeature: createdEntry.mainFeature || entry.mainFeature,
        subFeature: createdEntry.featureSubsection || createdEntry.subFeature || entry.subFeature,
        description: createdEntry.description || entry.description,
        remarks: createdEntry.remarks || entry.remarks,
        status: createdEntry.status || entry.status,
        testStatus: createdEntry.testStatus || createdEntry.test_status || entry.testStatus,
        actions: createdEntry.actions || entry.actions,
        testCaseIds: Array.isArray(createdEntry.testCaseIds)
          ? createdEntry.testCaseIds
          : typeof createdEntry.testCaseIds === 'string'
            ? createdEntry.testCaseIds.split(',').map((id: string) => id.trim()).filter(Boolean)
            : typeof createdEntry.testcaseIds === 'string'
              ? createdEntry.testcaseIds.split(',').map((id: string) => id.trim()).filter(Boolean)
              : entry.testCaseIds || [],
        testPlanId: createdEntry.testPlanId?.toString() || entry.testPlanId,
        createdAt: createdEntry.created_at || entry.createdAt,
        updatedAt: createdEntry.updated_at || entry.updatedAt
      };
      
      console.log('Transformed entry for frontend:', transformedEntry);
      console.log('=== END CREATE RTM ENTRY ===');
      rtmEntriesPromise = null; // Invalidate cache
      return transformedEntry;
    }
    
    // If we get here, something went wrong
    console.error('Unexpected response code:', responseData.code);
    console.error('Full response:', responseData);
    throw new Error(`Unexpected response code: ${responseData.code}`);
  } catch (error) {
    console.error('Error creating RTM entry:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('Response error details:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers
      });
    }
    return handleError(error, 'create RTM entry');
  }
};

export const updateRTMEntry = async (id: string, entry: Partial<RTMEntry>): Promise<RTMEntry> => {
  try {
    console.log(`Updating RTM entry ${id} with data:`, entry);

    const backendPayload: any = {
      reqId: entry.reqId,
      description: entry.description,
      testPlanId: entry.testPlanId ? parseInt(entry.testPlanId) : undefined,
      mainFeature: entry.mainFeature,
      featureSubsection: entry.subFeature,
      remarks: entry.remarks,
      status: entry.status,
      testStatus: entry.testStatus,
      testcaseIds: entry.testCaseIds ? entry.testCaseIds.join(', ') : undefined,
      actions: entry.actions,
    };

    // Remove undefined fields so the API only receives provided values
    Object.keys(backendPayload).forEach((key) => {
      if (backendPayload[key] === undefined) {
        delete backendPayload[key];
      }
    });

    const response = await api.post<ApiResponse<any>>(`/requirements/${id}`, backendPayload);
    console.log('Update RTM response:', response);
    const result = handleSuccess<any>(response);
    console.log('Updated RTM entry result:', result);

    const updatedEntry: RTMEntry = {
      id: result.id?.toString() || id,
      reqId: result.reqId || result.req_id || entry.reqId,
      mainFeature: result.mainFeature || entry.mainFeature || '',
      subFeature: result.featureSubsection || result.subFeature || entry.subFeature || '',
      description: result.description || entry.description || '',
      remarks: result.remarks || entry.remarks || '',
      status: result.status || entry.status,
      testStatus: result.testStatus || result.test_status || entry.testStatus,
      actions: result.actions || entry.actions,
      testCaseIds: Array.isArray(result.testcase_ids)
        ? result.testcase_ids.map(String)
        : Array.isArray(result.testCaseIds)
          ? result.testCaseIds.map(String)
          : typeof result.testCaseIds === 'string'
            ? result.testCaseIds.split(',').map((id: string) => id.trim()).filter(Boolean)
            : typeof result.testcaseIds === 'string'
              ? result.testcaseIds.split(',').map((id: string) => id.trim()).filter(Boolean)
              : entry.testCaseIds || [],
      testPlanId: result.testPlanId?.toString() || entry.testPlanId,
      createdAt: result.createdAt || result.created_at,
      updatedAt: result.updatedAt || result.updated_at || new Date().toISOString()
    };

    rtmEntriesPromise = null; // Invalidate cache
    return updatedEntry;
  } catch (error) {
    console.error(`Error updating RTM entry ${id}:`, error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('Response error details:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers
      });
    }
    return handleError(error, `update RTM entry ${id}`);
  }
};

export const deleteRTMEntry = async (id: string): Promise<void> => {
  try {
    await api.delete(`/requirements/${id}`);
    rtmEntriesPromise = null; // Invalidate cache
  } catch (error) {
    handleError(error, 'delete RTM entry');
  }
};

// Link test cases to RTM entry
export const linkTestCasesToRTM = async (rtmEntryId: string, testCaseIds: string[]): Promise<void> => {
  try {
    console.log(`Linking test cases to RTM entry ${rtmEntryId}:`, testCaseIds);
    
    const backendPayload = {
      testcaseIds: testCaseIds.join(', ')
    };

    await api.post(`/requirements/${rtmEntryId}`, backendPayload);
    
    // Clear cache for this RTM entry to force refresh
    linkedTestCasesCache.delete(rtmEntryId);
    rtmEntriesPromise = null; // Invalidate cache
    
    console.log('Test cases linked successfully');
  } catch (error) {
    console.error('Error linking test cases to RTM:', error);
    handleError(error, 'link test cases to RTM entry');
  }
};

// Cache for linked test cases to reduce API calls
const linkedTestCasesCache = new Map<string, { data: string[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Clear cache for specific RTM entry or all entries
export const clearLinkedTestCasesCache = (rtmEntryId?: string) => {
  if (rtmEntryId) {
    linkedTestCasesCache.delete(rtmEntryId);
    console.log(`Cleared cache for RTM entry ${rtmEntryId}`);
  } else {
    linkedTestCasesCache.clear();
    console.log('Cleared all linked test cases cache');
  }
  rtmEntriesPromise = null; // Invalidate cache
};

// Get linked test cases for an RTM entry using backend API
export const getLinkedTestCases = async (rtmEntryId: string): Promise<string[]> => {
  try {
    console.log(`Getting linked test cases for RTM entry ${rtmEntryId}`);
    
    // Check cache first
    const cached = linkedTestCasesCache.get(rtmEntryId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('Using cached linked test cases:', cached.data);
      return cached.data;
    }
    
    // Use the backend API to get test cases by requirement_id
    const endpoint = `/testcases?requirement_id=${rtmEntryId}`;
    console.log('Calling backend endpoint:', endpoint);
    
    const response = await api.get(endpoint);
    console.log('Backend response for linked test cases:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    const data = handleSuccess<any[]>(response);
    console.log('Processed test cases data:', data);
    
    // Extract test case IDs from the response
    const testCaseIds = Array.isArray(data) ? data.map(tc => {
      const id = tc.id?.toString() || tc._id?.toString() || '';
      console.log('Extracting ID from test case:', { tc, extractedId: id });
      return id;
    }).filter(Boolean) : [];
    
    console.log('Extracted test case IDs:', testCaseIds);
    
    // Also check localStorage as fallback for any client-side links
    const storageKey = 'rtm_testcase_links';
    const existingLinks = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const localLinks = existingLinks[rtmEntryId] || [];
    
    // Combine backend and local links (remove duplicates)
    const allLinks = [...new Set([...testCaseIds, ...localLinks])];
    console.log('Combined linked test cases (backend + local):', allLinks);
    
    // Cache the result
    linkedTestCasesCache.set(rtmEntryId, { data: allLinks, timestamp: Date.now() });
    
    return allLinks;
  } catch (error) {
    console.error('Error getting linked test cases from backend:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('Backend error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        url: axiosError.config?.url
      });
      
      // Handle rate limiting specifically
      if (axiosError.response?.status === 429) {
        console.warn('Rate limit hit for RTM entry', rtmEntryId, '- using localStorage fallback');
        // Don't throw error for rate limiting, just use fallback
      }
    }
    
    // Fallback to localStorage if backend fails (including rate limiting)
    console.log('Using localStorage fallback for linked test cases');
    const storageKey = 'rtm_testcase_links';
    const existingLinks = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const linkedTestCases = existingLinks[rtmEntryId] || [];
    console.log('Found linked test cases (localStorage fallback):', linkedTestCases);
    
    // Cache the fallback result too
    linkedTestCasesCache.set(rtmEntryId, { data: linkedTestCases, timestamp: Date.now() });
    
    return linkedTestCases;
  }
};

// Get RTM entries linked to a specific test case using backend API
export const getRTMEntriesForTestCase = async (testCaseId: string): Promise<RTMEntry[]> => {
  try {
    console.log(`Getting RTM entries for test case ${testCaseId}`);
    
    // Fetch all RTM entries (will hit the promise cache for concurrent components!)
    const allRTMEntries = await fetchRTMEntries();
    console.log('All RTM entries fetched:', allRTMEntries.length);
    
    // Get local storage links as fallback/merge
    const storageKey = 'rtm_testcase_links';
    let localLinks: Record<string, string[]> = {};
    try {
      localLinks = JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch (e) {
      console.error('Failed to parse rtm_testcase_links from localStorage:', e);
    }
    
    const linkedEntries: RTMEntry[] = [];
    
    // Perform filtering completely locally without N+1 requests
    for (const rtmEntry of allRTMEntries) {
      if (rtmEntry.id) {
        const localTestCaseIds = localLinks[rtmEntry.id] || [];
        const combinedTestCaseIds = [
          ...new Set([
            ...(rtmEntry.testCaseIds || []),
            ...localTestCaseIds.map(String)
          ])
        ];
        
        if (combinedTestCaseIds.includes(String(testCaseId))) {
          linkedEntries.push({
            ...rtmEntry,
            testCaseIds: combinedTestCaseIds
          });
        }
      }
    }
    
    console.log(`Found ${linkedEntries.length} linked RTM entries for test case ${testCaseId} (optimized locally)`);
    return linkedEntries;
  } catch (error) {
    console.error('Error getting RTM entries for test case:', error);
    
    // Fallback to localStorage approach if something goes wrong
    console.log('Falling back to localStorage for RTM entries');
    const storageKey = 'rtm_testcase_links';
    const existingLinks = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    const linkedRTMIds: string[] = [];
    Object.entries(existingLinks).forEach(([rtmId, testCaseIds]) => {
      if (Array.isArray(testCaseIds) && testCaseIds.map(String).includes(String(testCaseId))) {
        linkedRTMIds.push(rtmId);
      }
    });
    
    const allRTMEntries = await fetchRTMEntries();
    const linkedEntries = allRTMEntries.filter(entry => 
      entry.id && linkedRTMIds.includes(entry.id)
    );
    
    return linkedEntries;
  }
};