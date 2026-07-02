import { api } from '@/lib/api';

// Helper type for API responses
export interface TestCase {
  id: string;
  title: string;
  description?: string;
  preconditions?: string;
  testSteps: string;
  testData?: string;
  expectedResults: string;
  actualResults?: string;
  status: 'Not Run' | 'Passed' | 'Failed' | 'Blocked' | 'Skipped';
  executedBy?: string;
  executionDate?: string;
  remarks?: string;
  testedBy?: string;
  featureId: string;
  testPlanId?: string;
  requirementId?: string;
  created_at?: string;
  updated_at?: string;
}

// Map UI status ('Not Run' | 'Passed' | 'Failed' | 'Blocked' | 'Skipped') to DB string
const mapTestCaseStatusToDb = (status: string | undefined): string => {
  if (!status) return 'Not Run';
  return status.trim();
};

// Map DB enum/string back to UI status
const normalizeTestCaseStatus = (status: any): 'Not Run' | 'Passed' | 'Failed' | 'Blocked' | 'Skipped' => {
  if (!status) return 'Not Run';
  const s = String(status).trim();
  const lower = s.toLowerCase();
  
  if (s === 'Not Run' || s === 'Passed' || s === 'Failed' || s === 'Blocked' || s === 'Skipped') {
    return s as any;
  }
  
  if (lower === 'completed' || lower === 'passed') return 'Passed';
  if (lower === 'failed') return 'Failed';
  if (lower === 'blocked') return 'Blocked';
  if (lower === 'skipped') return 'Skipped';
  if (lower === 'notstarted' || lower === 'not started' || lower === 'notrun' || lower === 'not run') return 'Not Run';
  if (lower === 'inprogress' || lower === 'in progress') return 'Not Run';
  
  return 'Not Run';
};

const normalizeTestCase = (tc: any): TestCase => {
  if (!tc) return tc;
  const reqId = tc.requirementId ?? tc.requirement_id ?? tc.featureId ?? '';
  return {
    ...tc,
    id: String(tc.id ?? tc._id ?? ''),
    status: normalizeTestCaseStatus(tc.status),
    featureId: String(reqId),
    requirementId: String(reqId),
    testPlanId: String(tc.testPlanId ?? tc.test_plan_id ?? '1'),
  };
};

const toTestCasePayload = (testCase: any) => {
  const payload = {
    ...testCase,
  };
  
  if (testCase.status) {
    payload.status = mapTestCaseStatusToDb(testCase.status);
  }
  
  // Ensure testPlanId and requirementId are mapped for the DB schema
  const rawFeatureId = testCase.featureId ?? testCase.requirementId ?? testCase.requirement_id;
  payload.testPlanId = String(testCase.testPlanId || '1');
  payload.requirementId = String(testCase.requirementId || rawFeatureId || '1');

  // Clean featureId
  if (payload.featureId !== undefined && payload.featureId !== null) {
    const cleanFeatId = String(payload.featureId).trim();
    payload.featureId = (cleanFeatId === '' || cleanFeatId === 'undefined' || cleanFeatId === 'null') ? undefined : cleanFeatId;
  }
  
  // Always delete featureId from payload sent to backend to prevent 500 DB errors
  delete payload.featureId;
  
  return payload;
};

export const fetchTestCases = async (): Promise<TestCase[]> => {
  try {
    console.log('[TestCaseService] Fetching all test cases');
    const response = await api.get<{
      message: string;
      details: any[];
      code: number;
    }>('/testcases');
    
    // Support both wrapper objects and direct array structures
    let details: any[] = [];
    if (response.data && Array.isArray(response.data.details)) {
      details = response.data.details;
    } else if (Array.isArray(response.data)) {
      details = response.data;
    } else if (response.data && typeof response.data === 'object') {
      const dataObj = response.data as any;
      if (Array.isArray(dataObj.data)) {
        details = dataObj.data;
      }
    }
    
    return details.map(normalizeTestCase);
  } catch (error) {
    console.error('[TestCaseService] Error fetching test cases:', error);
    throw error;
  }
};

export const fetchTestCasesByFeature = async (featureId: string): Promise<TestCase[]> => {
  try {
    console.log(`[TestCaseService] Fetching test cases for feature ${featureId}`);
    const response = await api.get<{
      message: string;
      details: any[];
      code: number;
    }>(`/testcases?featureId=${featureId}`);
    
    let details: any[] = [];
    if (response.data && Array.isArray(response.data.details)) {
      details = response.data.details;
    } else if (Array.isArray(response.data)) {
      details = response.data;
    } else if (response.data && typeof response.data === 'object') {
      const dataObj = response.data as any;
      if (Array.isArray(dataObj.data)) {
        details = dataObj.data;
      }
    }
    
    return details.map(normalizeTestCase);
  } catch (error) {
    console.error(`[TestCaseService] Error fetching test cases for feature ${featureId}:`, error);
    throw error;
  }
};

export const fetchTestCasesByIds = async (testCaseIds: string[]): Promise<TestCase[]> => {
  if (!testCaseIds.length) return [];
  try {
    console.log('[TestCaseService] Fetching test cases by ids:', testCaseIds);
    const response = await api.get<{
      message: string;
      details: any[];
      code: number;
    }>(`/testcases?ids=${testCaseIds.join(',')}`);
    
    let details: any[] = [];
    if (response.data && Array.isArray(response.data.details)) {
      details = response.data.details;
    } else if (Array.isArray(response.data)) {
      details = response.data;
    } else if (response.data && typeof response.data === 'object') {
      const dataObj = response.data as any;
      if (Array.isArray(dataObj.data)) {
        details = dataObj.data;
      }
    }
    
    return details.map(normalizeTestCase);
  } catch (error) {
    console.error('[TestCaseService] Error fetching test cases by ids:', error);
    throw error;
  }
};

export const fetchTestCase = async (id: string): Promise<TestCase> => {
  try {
    console.log(`[TestCaseService] Fetching test case ${id}`);
    const response = await api.get<{
      message: string;
      details: any;
      code: number;
      data?: any;
    }>(`/testcases/${id}`);
    
    const details = response.data?.details || response.data?.data || response.data;
    if (!details) {
      console.error('[TestCaseService] Unexpected response format:', response.data);
      throw new Error('Unexpected response format from server');
    }
    
    return normalizeTestCase(details);
  } catch (error) {
    console.error(`[TestCaseService] Error fetching test case ${id}:`, error);
    throw error;
  }
};

export const createTestCase = async (testCase: Omit<TestCase, 'id' | 'created_at' | 'updated_at'>): Promise<TestCase> => {
  try {
    console.log('[TestCaseService] Creating test case payload:', toTestCasePayload(testCase));
    const response = await api.post<{
      message: string;
      details: any;
      code: number;
      data?: any;
    }>('/testcases', toTestCasePayload(testCase));
    
    let details = response.data?.details || response.data?.data || response.data;
    if (!details) {
      console.error('[TestCaseService] Unexpected response format:', response.data);
      throw new Error('Unexpected response format from server');
    }
    
    if (details.original && details.original.details) {
      details = details.original.details;
    }
    
    return normalizeTestCase(details);
  } catch (error) {
    console.error('[TestCaseService] Error creating test case:', error);
    throw error;
  }
};

export const updateTestCase = async (id: string, updates: any): Promise<TestCase> => {
  try {
    const payload = toTestCasePayload(updates);
    // Explicitly delete featureId from update payload to avoid 500 database error
    delete payload.featureId;
    
    console.log(`[TestCaseService] Updating test case ${id} payload via PUT:`, payload);
    const response = await api.put<{
      message: string;
      details: any;
      code: number;
      data?: any;
    }>(`/testcases/${id}`, payload);
    
    let details = response.data?.details || response.data?.data || response.data;
    if (!details) {
      console.error('[TestCaseService] Unexpected response format:', response.data);
      throw new Error('Unexpected response format from server');
    }
    
    if (details.original && details.original.details) {
      details = details.original.details;
    }
    
    const normalized = normalizeTestCase(details);
    // Ensure the ID is preserved (the backend PUT response omits ID)
    if (!normalized.id || normalized.id === '') {
      normalized.id = String(id);
    }
    return normalized;
  } catch (error) {
    console.error(`[TestCaseService] Error updating test case ${id}:`, error);
    throw error;
  }
};

export const deleteTestCase = async (id: string): Promise<void> => {
  try {
    console.log(`[TestCaseService] Deleting test case ${id}`);
    await api.delete(`/testcases/${id}`);
  } catch (error) {
    console.error(`[TestCaseService] Error deleting test case ${id}:`, error);
    throw error;
  }
};

// Legacy functions for compatibility
export const createTestCaseLegacy = async (testCase: Omit<TestCase, 'id'>): Promise<TestCase> => {
  try {
    console.log('[TestCaseService] Creating test case (legacy):', toTestCasePayload(testCase));
    const response = await api.post<{
      message: string;
      details: any;
      code: number;
      data?: any;
    }>('/testcases', toTestCasePayload(testCase));
    
    const details = response.data?.details || response.data?.data || response.data;
    if (!details) {
      console.error('[TestCaseService] Unexpected response format:', response.data);
      throw new Error('Unexpected response format from server');
    }
    
    return normalizeTestCase(details);
  } catch (error) {
    console.error('[TestCaseService] Error creating test case (legacy):', error);
    throw error;
  }
};

export const updateTestCaseLegacy = async (id: string, testCase: Partial<TestCase>): Promise<TestCase> => {
  try {
    console.log(`[TestCaseService] Updating test case ${id} (legacy):`, toTestCasePayload(testCase));
    const response = await api.put<{
      message: string;
      details: any;
      code: number;
      data?: any;
    }>(`/testcases/${id}`, toTestCasePayload(testCase));
    
    const details = response.data?.details || response.data?.data || response.data;
    if (!details) {
      console.error('[TestCaseService] Unexpected response format:', response.data);
      throw new Error('Unexpected response format from server');
    }
    
    return normalizeTestCase(details);
  } catch (error) {
    console.error(`[TestCaseService] Error updating test case ${id} (legacy):`, error);
    throw error;
  }
};

export const deleteTestCaseLegacy = async (id: string): Promise<void> => {
  try {
    console.log(`[TestCaseService] Deleting test case ${id} (legacy)`);
    await api.delete(`/testcases/${id}`);
  } catch (error) {
    console.error(`[TestCaseService] Error deleting test case ${id} (legacy):`, error);
    throw error;
  }
};