import axios, { AxiosError } from 'axios';
import { backend_url } from '@/config';
import type { ServiceTestSuite } from '@/types/test-suite';

const API_BASE_URL = backend_url;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      const authToken = token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed');
    }
    return Promise.reject(error);
  }
);

export const fetchTestSuites = async (projectId?: string): Promise<ServiceTestSuite[]> => {
  try {
    const response = await api.get('/testsuites', {
      params: projectId ? { project_id: projectId } : undefined
    });
    let data = response.data;

    if (data && typeof data === 'object' && 'details' in data && Array.isArray(data.details)) {
      data = data.details;
    }

    if (!Array.isArray(data)) return [];

    return data.map((suite: any) => ({
      id: String(suite.id ?? suite._id ?? ''),
      _id: String(suite.id ?? suite._id ?? ''),
      name: suite.testSuiteName || suite.name || 'Unnamed Test Suite',
      testSuiteName: suite.testSuiteName || suite.name || 'Unnamed Test Suite',
      description: suite.description || '',
      startDate: suite.startDate,
      endDate: suite.endDate,
      executedBy: suite.executedBy,
      executedDate: suite.executedDate,
      projectId: suite.projectId,
      testCases: Array.isArray(suite.testCases) ? suite.testCases : [],
      createdAt: suite.created_at || suite.createdAt || new Date().toISOString(),
      updatedAt: suite.updated_at || suite.updatedAt || new Date().toISOString(),
    })) as ServiceTestSuite[];
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response) {
      throw new Error(`API Error (${axiosError.response.status}): ${axiosError.response.data?.message || 'Unknown error'}`);
    }
    throw new Error('Failed to fetch test suites. Please check your connection.');
  }
};

export const fetchTestCasesInSuite = async (testSuiteId: string): Promise<any[]> => {
  try {
    const response = await api.get(`/testcasesinsuites/${testSuiteId}`);
    let data = response.data;

    if (data && typeof data === 'object' && 'details' in data) {
      data = data.details;
      if (data && typeof data === 'object' && 'testCases' in data) {
        data = data.testCases;
      }
    }

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const fetchTestSuiteById = async (id: string): Promise<ServiceTestSuite> => {
  const response = await api.get<ServiceTestSuite>(`/testsuites/${id}`);
  return response.data;
};

export const createTestSuite = async (
  testSuite: Omit<ServiceTestSuite, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ServiceTestSuite> => {
  try {
    // Step 1: Create the test suite (without test cases)
    const apiPayload = {
      testSuiteName: testSuite.name || testSuite.testSuiteName,
      projectId: String(testSuite.projectId),
      description: testSuite.description,
      startDate: testSuite.startDate,
      endDate: testSuite.endDate || '',
      executedBy: testSuite.executedBy || '',
      executedDate: testSuite.executedDate || '',
      status: testSuite.status,
    };

    const response = await api.post('/testsuites', apiPayload);
    const responseData = response.data;

    // Handle nested response: { details: { details: { suite: {...} } } }
    let finalSuite: any = responseData;
    if (finalSuite?.details?.details?.suite) {
      finalSuite = finalSuite.details.details.suite;
    } else if (finalSuite?.details?.suite) {
      finalSuite = finalSuite.details.suite;
    } else if (finalSuite?.details) {
      finalSuite = finalSuite.details;
    }

    const returnedId = finalSuite?.id ?? finalSuite?._id;
    if (!returnedId) {
      throw new Error('Server did not return a valid ID for the created test suite.');
    }

    // Step 2: Add test cases if any were provided
    const testCases = testSuite.testCases || [];
    if (Array.isArray(testCases) && testCases.length > 0) {
      try {
        const testCaseIds = testCases.map((tc: any) => {
          const idStr = typeof tc === 'string' ? tc : String(tc.id ?? tc._id ?? '');
          return /^\d+$/.test(idStr) ? parseInt(idStr, 10) : idStr;
        }).filter(Boolean);
        
        if (testCaseIds.length > 0) {
          await api.post(`/addtestcasestotestsuites/${returnedId}`, {
            projectId: String(testSuite.projectId),
            testCaseIds: testCaseIds,
            assignedToUserId: "1" // Default user ID
          });
        }
      } catch (testCaseError) {
        console.warn('Failed to add test cases to suite:', testCaseError);
        // Don't fail the entire creation if test case addition fails
      }
    }

    return {
      ...testSuite,
      id: String(returnedId),
      name: finalSuite.testSuiteName || finalSuite.name || testSuite.name || testSuite.testSuiteName,
      testSuiteName: finalSuite.testSuiteName || finalSuite.name || testSuite.name || testSuite.testSuiteName,
      description: finalSuite.description || testSuite.description || '',
      projectId: String(finalSuite.projectId || testSuite.projectId),
      createdAt: finalSuite.created_at || finalSuite.createdAt || new Date().toISOString(),
      updatedAt: finalSuite.updated_at || finalSuite.updatedAt || new Date().toISOString(),
      testCases: testCases, // Include the test cases in the returned object
    };
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.status === 400) throw new Error('Invalid test suite data. Please check all required fields.');
    if (axiosError.response?.status === 401) throw new Error('Authentication failed. Please log in again.');
    if (axiosError.response?.status === 403) throw new Error('You do not have permission to create test suites.');
    if (axiosError.response?.status && axiosError.response.status >= 500) throw new Error('Server error. Please try again later.');
    throw error;
  }
};

export const updateTestSuite = async (
  id: string,
  updates: Partial<ServiceTestSuite>
): Promise<ServiceTestSuite> => {
  // Extract and format testCaseIds
  const testCaseIds = updates.testCases
    ? updates.testCases.map((tc: any) => {
        const idStr = typeof tc === 'object' ? String(tc.id ?? tc._id ?? '') : String(tc);
        return /^\d+$/.test(idStr) ? parseInt(idStr, 10) : idStr;
      }).filter(Boolean)
    : undefined;

  const apiPayload: any = {
    testSuiteName: updates.name || updates.testSuiteName,
    projectId: updates.projectId ? String(updates.projectId) : undefined,
    startDate: updates.startDate,
    endDate: updates.endDate,
    executedBy: updates.executedBy,
    executedDate: updates.executedDate,
    status: updates.status,
    description: updates.description,
  };

  if (testCaseIds !== undefined) {
    apiPayload.testCaseIds = testCaseIds;
  }

  // Remove undefined fields
  Object.keys(apiPayload).forEach(key => {
    if (apiPayload[key] === undefined) {
      delete apiPayload[key];
    }
  });

  const response = await api.put<any>(`/testsuites/${id}`, apiPayload);

  // Handle nested response: { details: { details: { suite: {...} } } }
  let finalSuite: any = response.data;
  if (finalSuite?.details?.details?.suite) {
    finalSuite = finalSuite.details.details.suite;
  } else if (finalSuite?.details?.suite) {
    finalSuite = finalSuite.details.suite;
  } else if (finalSuite?.details) {
    finalSuite = finalSuite.details;
  }

  return {
    ...updates as ServiceTestSuite,
    ...finalSuite,
    id,
    updatedAt: finalSuite?.updated_at || finalSuite?.updatedAt || new Date().toISOString(),
  };
};

export const deleteTestSuite = async (id: string): Promise<void> => {
  if (!id || id.trim() === '') throw new Error('Invalid test suite ID');

  try {
    const response = await api.delete(`/testsuites/${id}`);
    if (![200, 202, 204].includes(response.status)) {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.status === 404) throw new Error(`Test suite with ID ${id} not found`);
    if (axiosError.response?.status === 403) throw new Error('You do not have permission to delete this test suite');
    if (axiosError.response?.status === 401) throw new Error('Authentication required. Please log in again.');
    if (axiosError.response?.data?.message) throw new Error(axiosError.response.data.message);
    throw error;
  }
};

export const addTestCaseToSuite = async (testSuiteId: string, testCaseId: string, projectId: string = "1"): Promise<void> => {
  await api.post(`/addtestcasestotestsuites/${testSuiteId}`, {
    projectId: String(projectId),
    testCaseIds: [parseInt(testCaseId)],
    assignedToUserId: "1"
  });
};

export const removeTestCaseFromSuite = async (testSuiteId: string, testCaseId: string): Promise<void> => {
  await api.post(`/removetestcasesfromtestsuites/${testSuiteId}`, {
    testCaseIds: [parseInt(testCaseId)]
  });
};

export const executeTestCaseInSuite = async (
  suiteId: string,
  testCaseId: string,
  status: 'passed' | 'failed' | 'blocked' | 'skipped' | 'not run',
  remarks: string = ""
): Promise<any> => {
  const response = await api.post(`/executetestcases/${suiteId}/execute`, {
    testCaseId: parseInt(testCaseId),
    status: status.toLowerCase(),
    remarks
  });
  return response.data;
};

export const fetchDefectsInSuite = async (testSuiteId: string): Promise<any[]> => {
  try {
    const response = await api.get(`/defectsintestsuite/${testSuiteId}`);
    let data = response.data;
    if (data && typeof data === 'object' && 'details' in data) {
      data = data.details;
    }
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

