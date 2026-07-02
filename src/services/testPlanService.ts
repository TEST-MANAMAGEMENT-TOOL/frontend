import { TestPlan } from "@/pages/TestPlans";
import { authService } from './authService';
import { backend_url } from '@/config';

// Use the full URL directly (no proxy needed)
const API_BASE_URL = backend_url.endsWith('/') ? backend_url.slice(0, -1) : backend_url;

interface LogRequestParams {
  timestamp: string;
  data?: unknown;
}

const logRequest = (method: string, url: string, data?: unknown): void => {
  const logData: LogRequestParams = { timestamp: new Date().toISOString() };
  
  if (data !== undefined) {
    logData.data = data;
  }
  
  console.log(`[API] ${method} ${url}`, logData);
};

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  details?: T[];
}

const handleResponse = async <T>(response: Response, operation: string): Promise<T> => {
  const responseText = await response.text();
  let responseData: any;

  try {
    responseData = responseText ? JSON.parse(responseText) : {};
  } catch (e) {
    throw new Error(`Failed to parse JSON response: ${responseText}`);
  }

  if (!response.ok) {
    console.error(`Error ${operation}:`, {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      response: responseData || responseText
    });

    const errorMessage = responseData.message || 
                        responseData.error || 
                        `Failed to ${operation}: ${response.status} ${response.statusText}`;
    
    throw new Error(errorMessage);
  }

  return responseData as T;
};

const getAuthHeaders = (): Record<string, string> => {
  const token = authService.getToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json'
  };

  if (token) {
    const cleanToken = token.replace(/^Bearer\s*/i, '');
    headers['Authorization'] = `Bearer ${cleanToken}`;
  }

  return headers;
};

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };

  if (options.body instanceof FormData) {
    // Let the browser set the multipart Content-Type boundary automatically.
    delete headers['Content-Type'];
    delete headers['content-type'];
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  return response;
};

export const fetchTestPlans = async (): Promise<TestPlan[]> => {
  try {
    const url = `${API_BASE_URL}/testplans`;
    logRequest('GET', url);

    const response = await fetchWithAuth(url, {
      method: 'GET'
    });

    const responseData = await handleResponse<ApiResponse<TestPlan>>(response, 'fetch test plans');
    console.log('Test plans API Response:', responseData);

    // Handle different response formats
    if (responseData.details && Array.isArray(responseData.details)) {
      return responseData.details;
    }
    
    if (responseData.data && Array.isArray(responseData.data)) {
      return responseData.data;
    }

    if (Array.isArray(responseData)) {
      return responseData;
    }

    console.warn('Unexpected API response format, returning empty array');
    return [];
  } catch (error) {
    console.error('Error in fetchTestPlans:', error);
    // Return empty array instead of throwing to prevent page crashes
    return [];
  }
};

export const createTestPlan = async (testPlan: Omit<TestPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestPlan> => {
  const url = `${API_BASE_URL}/testplans`;
  logRequest('POST', url, testPlan);
  
  try {
    console.log('Sending create test plan request to:', url);
    console.log('Request payload:', JSON.stringify(testPlan, null, 2));
    
    // Create FormData for the request (API expects form data, not JSON)
    const formData = new FormData();
    const appendField = (key: string, value: any) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    };

    appendField('title', testPlan.projectName || (testPlan.name as string) || testPlan.title || 'Untitled Test Plan');
    appendField('description', testPlan.introduction || testPlan.objectives || (testPlan as any).description || '');
    appendField('projectId', String((testPlan as any).projectId ?? (testPlan.projectId ?? 1)));
    appendField('status', testPlan.status || 'Draft');
    appendField('startDate', testPlan.dateCreated || new Date().toISOString().split('T')[0]);
    appendField('endDate', testPlan.approvalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    appendField('preparedBy', testPlan.preparedBy || (testPlan as any).createdBy || '');
    appendField('reviewedBy', testPlan.reviewedBy || (testPlan as any).approvedBy || (testPlan as any).reviewDate || '');
    appendField('version', testPlan.version || '1.0');
    appendField('objectives', testPlan.objectives || '');
    appendField('inScope', testPlan.inScope || '');
    appendField('outOfScope', testPlan.outOfScope || '');
    appendField('testStrategy', testPlan.testStrategy || '');
    appendField('testEnvironment', testPlan.testEnvironment || testPlan.environmentalNeeds || '');
    appendField('entryCriteria', testPlan.entryCriteria || '');
    appendField('exitCriteria', testPlan.exitCriteria || '');
    appendField('testDeliverables', testPlan.testDeliverables || '');
    appendField('testApproach', (testPlan as any).testApproach || '');
    appendField('environmentalNeeds', (testPlan as any).environmentalNeeds || '');
    appendField('responsibilities', (testPlan as any).responsibilities || '');
    appendField('trainingNeeds', (testPlan as any).trainingNeeds || '');
    appendField('assumptions', (testPlan as any).assumptions || '');
    appendField('approvals', (testPlan as any).approvals || '');
    appendField('createdBy', (testPlan as any).createdBy || '');
    appendField('approvedBy', (testPlan as any).approvedBy || '');
    appendField('reviewDate', (testPlan as any).reviewDate || '');
    appendField('effectiveDate', (testPlan as any).effectiveDate || '');

    if (testPlan.roles) {
      formData.append('roles', JSON.stringify(testPlan.roles));
    }
    if (testPlan.schedule) {
      formData.append('schedule', JSON.stringify(testPlan.schedule));
    }
    if (testPlan.risks) {
      formData.append('risks', JSON.stringify(testPlan.risks));
    }
    if (testPlan.members) {
      formData.append('members', JSON.stringify(testPlan.members));
    }

    const response = await fetchWithAuth(url, {
      method: 'POST',
      body: formData
    });

    console.log('Received response status:', response.status);
    
    // First, get the raw response text to handle different formats
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
      console.log('Parsed response data:', responseData);
      
      // Handle the specific format we're seeing: {message: {…}, code: 300}
      if (responseData.code === 300 && responseData.message) {
        // If the message contains the test plan data
        if (typeof responseData.message === 'object' && responseData.message.id) {
          // Ensure all required fields are present
          const msg = responseData.message;
          return {
            id: String(msg.id),
            name: msg.name || msg.title || testPlan.projectName || '',
            projectName: msg.projectName || testPlan.projectName || '',
            version: msg.version || testPlan.version || '1.0',
            preparedBy: msg.preparedBy || testPlan.preparedBy || '',
            dateCreated: msg.dateCreated || testPlan.dateCreated || new Date().toISOString(),
            reviewedBy: msg.reviewedBy || testPlan.reviewedBy || '',
            approvalDate: msg.approvalDate || testPlan.approvalDate || '',
            introduction: msg.introduction || testPlan.introduction || '',
            objectives: msg.objectives || testPlan.objectives || '',
            inScope: msg.inScope || testPlan.inScope || '',
            outOfScope: msg.outOfScope || testPlan.outOfScope || '',
            testItems: msg.testItems || testPlan.testItems || '',
            testStrategy: msg.testStrategy || testPlan.testStrategy || '',
            testEnvironment: msg.testEnvironment || testPlan.testEnvironment || '',
            entryCriteria: msg.entryCriteria || testPlan.entryCriteria || '',
            exitCriteria: msg.exitCriteria || testPlan.exitCriteria || '',
            testDeliverables: msg.testDeliverables || testPlan.testDeliverables || '',
            roles: msg.roles || testPlan.roles || [],
            schedule: msg.schedule || testPlan.schedule || [],
            risks: msg.risks || testPlan.risks || [],
            members: msg.members || testPlan.members || [],
            status: msg.status || testPlan.status || 'Draft',
            createdAt: msg.createdAt || new Date().toISOString(),
            updatedAt: msg.updatedAt || new Date().toISOString()
          };
        }
      }
      
      // Handle standard API response format
      if (responseData.data) {
        const d = responseData.data as any;
        return {
          id: String(d.id || d._id || Date.now()),
          name: d.name || d.title || testPlan.projectName || '',
          projectName: d.projectName || testPlan.projectName || '',
          version: d.version || testPlan.version || '1.0',
          preparedBy: d.preparedBy || testPlan.preparedBy || '',
          dateCreated: d.dateCreated || testPlan.dateCreated || new Date().toISOString(),
          reviewedBy: d.reviewedBy || testPlan.reviewedBy || '',
          approvalDate: d.approvalDate || testPlan.approvalDate || '',
          introduction: d.introduction || testPlan.introduction || '',
          objectives: d.objectives || testPlan.objectives || '',
          inScope: d.inScope || testPlan.inScope || '',
          outOfScope: d.outOfScope || testPlan.outOfScope || '',
          testItems: d.testItems || testPlan.testItems || '',
          testStrategy: d.testStrategy || testPlan.testStrategy || '',
          testEnvironment: d.testEnvironment || testPlan.testEnvironment || '',
          entryCriteria: d.entryCriteria || testPlan.entryCriteria || '',
          exitCriteria: d.exitCriteria || testPlan.exitCriteria || '',
          testDeliverables: d.testDeliverables || testPlan.testDeliverables || '',
          roles: d.roles || testPlan.roles || [],
          schedule: d.schedule || testPlan.schedule || [],
          risks: d.risks || testPlan.risks || [],
          members: d.members || testPlan.members || [],
          status: d.status || testPlan.status || 'Draft',
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString()
        };
      }
      
      // If the response is the test plan itself
      if (responseData.id) {
        const r = responseData as any;
        return {
          id: String(r.id),
          name: r.name || r.title || testPlan.projectName || '',
          projectName: r.projectName || testPlan.projectName || '',
          version: r.version || testPlan.version || '1.0',
          preparedBy: r.preparedBy || testPlan.preparedBy || '',
          dateCreated: r.dateCreated || testPlan.dateCreated || new Date().toISOString(),
          reviewedBy: r.reviewedBy || testPlan.reviewedBy || '',
          approvalDate: r.approvalDate || testPlan.approvalDate || '',
          introduction: r.introduction || testPlan.introduction || '',
          objectives: r.objectives || testPlan.objectives || '',
          inScope: r.inScope || testPlan.inScope || '',
          outOfScope: r.outOfScope || testPlan.outOfScope || '',
          testItems: r.testItems || testPlan.testItems || '',
          testStrategy: r.testStrategy || testPlan.testStrategy || '',
          testEnvironment: r.testEnvironment || testPlan.testEnvironment || '',
          entryCriteria: r.entryCriteria || testPlan.entryCriteria || '',
          exitCriteria: r.exitCriteria || testPlan.exitCriteria || '',
          testDeliverables: r.testDeliverables || testPlan.testDeliverables || '',
          roles: r.roles || testPlan.roles || [],
          schedule: r.schedule || testPlan.schedule || [],
          risks: r.risks || testPlan.risks || [],
          members: r.members || testPlan.members || [],
          status: r.status || testPlan.status || 'Draft',
          createdAt: r.createdAt || new Date().toISOString(),
          updatedAt: r.updatedAt || new Date().toISOString()
        };
      }
      
      // If we got here, log the response for debugging
      console.warn('Unexpected API response format:', responseData);
      
      // As a last resort, create a test plan with the data we have
      const now = new Date().toISOString();
      return {
        // Include all required fields from the input testPlan
        ...testPlan,
        // Ensure we have required fields with defaults if not provided
        id: `temp-${Date.now()}`,
        status: testPlan.status || 'Draft',
        projectName: testPlan.projectName || 'Unknown Project',
        version: testPlan.version || '1.0',
        preparedBy: testPlan.preparedBy || 'Unknown',
        dateCreated: testPlan.dateCreated || now,
        reviewedBy: testPlan.reviewedBy || '',
        approvalDate: testPlan.approvalDate || '',
        introduction: testPlan.introduction || '',
        objectives: testPlan.objectives || '',
        inScope: testPlan.inScope || '',
        outOfScope: testPlan.outOfScope || '',
        testItems: testPlan.testItems || '',
        testStrategy: testPlan.testStrategy || '',
        testEnvironment: testPlan.testEnvironment || '',
        entryCriteria: testPlan.entryCriteria || '',
        exitCriteria: testPlan.exitCriteria || '',
        testDeliverables: testPlan.testDeliverables || '',
        roles: testPlan.roles || [],
        schedule: testPlan.schedule || [],
        risks: testPlan.risks || [],
        members: testPlan.members || [],
        // Add timestamps
        createdAt: now,
        updatedAt: now,
        // Add any additional fields from the response
        message: 'Created with unexpected response format',
        rawResponse: responseData
      };
      
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      console.error('Response text:', responseText);
      
      // If we can't parse the response, create a basic test plan with the raw text
      const now = new Date().toISOString();
      return {
        // Include all required fields from the input testPlan
        ...testPlan,
        // Ensure we have required fields with defaults if not provided
        id: `temp-${Date.now()}`,
        status: testPlan.status || 'Draft',
        projectName: testPlan.projectName || 'Unknown Project',
        version: testPlan.version || '1.0',
        preparedBy: testPlan.preparedBy || 'Unknown',
        dateCreated: testPlan.dateCreated || now,
        reviewedBy: testPlan.reviewedBy || '',
        approvalDate: testPlan.approvalDate || '',
        introduction: testPlan.introduction || '',
        objectives: testPlan.objectives || '',
        inScope: testPlan.inScope || '',
        outOfScope: testPlan.outOfScope || '',
        testItems: testPlan.testItems || '',
        testStrategy: testPlan.testStrategy || '',
        testEnvironment: testPlan.testEnvironment || '',
        entryCriteria: testPlan.entryCriteria || '',
        exitCriteria: testPlan.exitCriteria || '',
        testDeliverables: testPlan.testDeliverables || '',
        roles: testPlan.roles || [],
        schedule: testPlan.schedule || [],
        risks: testPlan.risks || [],
        members: testPlan.members || [],
        // Add timestamps
        createdAt: now,
        updatedAt: now,
        // Add error information
        message: 'Failed to parse server response',
        rawResponse: responseText
      };
    }
  } catch (error) {
    console.error('Error in createTestPlan:', error);
    throw error;
  }
};

export const updateTestPlan = async (id: string, testPlan: Partial<TestPlan>): Promise<TestPlan> => {
  // If this is a temporary ID, handle it as a new test plan
  if (id.startsWith('temp-')) {
    console.log('Temporary ID detected, creating new test plan instead of updating');
    // Remove the ID to create a new test plan
    const { id: _, ...newTestPlan } = testPlan;
    return createTestPlan(newTestPlan as Omit<TestPlan, 'id' | 'createdAt' | 'updatedAt'>);
  }

  const url = `${API_BASE_URL}/testplans/${id}`;
  logRequest('PUT', url, testPlan);
  
  try {
    console.log('Sending update test plan request to:', url);
    console.log('Request payload:', JSON.stringify(testPlan, null, 2));
    
    // Create FormData for the request (API expects form data, not JSON)
    const formData = new FormData();
    const appendField = (key: string, value: any) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    };

    appendField('title', testPlan.projectName || testPlan.name || (testPlan as any).title);
    appendField('description', testPlan.introduction || testPlan.objectives || (testPlan as any).description);
    appendField('projectId', (testPlan as any).projectId ? String((testPlan as any).projectId) : undefined);
    appendField('status', testPlan.status);
    appendField('startDate', testPlan.dateCreated);
    appendField('endDate', testPlan.approvalDate);
    appendField('preparedBy', testPlan.preparedBy || (testPlan as any).createdBy);
    appendField('reviewedBy', testPlan.reviewedBy || (testPlan as any).approvedBy || (testPlan as any).reviewDate);
    appendField('version', testPlan.version);
    appendField('objectives', testPlan.objectives);
    appendField('inScope', testPlan.inScope);
    appendField('outOfScope', testPlan.outOfScope);
    appendField('testStrategy', testPlan.testStrategy);
    appendField('testEnvironment', testPlan.testEnvironment || (testPlan as any).environmentalNeeds);
    appendField('entryCriteria', testPlan.entryCriteria);
    appendField('exitCriteria', testPlan.exitCriteria);
    appendField('testDeliverables', testPlan.testDeliverables);
    appendField('testApproach', (testPlan as any).testApproach);
    appendField('environmentalNeeds', (testPlan as any).environmentalNeeds);
    appendField('responsibilities', (testPlan as any).responsibilities);
    appendField('trainingNeeds', (testPlan as any).trainingNeeds);
    appendField('assumptions', (testPlan as any).assumptions);
    appendField('approvals', (testPlan as any).approvals);
    appendField('createdBy', (testPlan as any).createdBy);
    appendField('approvedBy', (testPlan as any).approvedBy);
    appendField('reviewDate', (testPlan as any).reviewDate);
    appendField('effectiveDate', (testPlan as any).effectiveDate);

    if (testPlan.roles) {
      formData.append('roles', JSON.stringify(testPlan.roles));
    }
    if (testPlan.schedule) {
      formData.append('schedule', JSON.stringify(testPlan.schedule));
    }
    if (testPlan.risks) {
      formData.append('risks', JSON.stringify(testPlan.risks));
    }
    if (testPlan.members) {
      formData.append('members', JSON.stringify(testPlan.members));
    }

    const response = await fetchWithAuth(url, {
      method: 'PUT',
      body: formData
    });

    console.log('Received response status:', response.status);
    
    // Handle the response
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
      console.log('Parsed response data:', responseData);
      
      // Handle different response formats
      if (responseData.code === '205') {
        if (responseData.message === 'Test plan not found') {
          // If the test plan doesn't exist, try creating it as a new one
          console.log('Test plan not found, creating new one');
          const { id: _, ...newTestPlan } = testPlan;
          return createTestPlan(newTestPlan as Omit<TestPlan, 'id' | 'createdAt' | 'updatedAt'>);
        }
        throw new Error(responseData.message || 'Failed to update test plan');
      }
      
      if (responseData.data) {
        return responseData.data;
      } else if (responseData.details) {
        return responseData.details as unknown as TestPlan;
      }
      
      // If the response is the test plan itself
      if (responseData.id) {
        return responseData as TestPlan;
      }
      
      // If we got here, return the response as-is if it looks like a test plan
      if (typeof responseData === 'object') {
        return responseData as TestPlan;
      }
      
      throw new Error('Invalid response format from server');
      
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      console.error('Response text:', responseText);
      throw new Error('Failed to parse server response');
    }
  } catch (error) {
    console.error('Error in updateTestPlan:', error);
    throw error;
  }
};

export const importTestPlan = async (
  name: string,
  description: string,
  projectId: string,
  file: File,
  startDate: string,
  endDate: string,
  status: string = 'Draft'
): Promise<TestPlan> => {
  const importUrl = `${API_BASE_URL}/importtestplan`;

  // Try the dedicated import endpoint first
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description || '');
    formData.append('projectId', String(projectId));
    formData.append('plan', file);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('status', status);

    logRequest('POST', importUrl, { name, projectId, fileName: file.name });

    const response = await fetchWithAuth(importUrl, {
      method: 'POST',
      body: formData
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.warn('Import response not JSON, falling back to create flow', text);
    }

    if (response.ok) {
      // Normalize response if needed
      const payload = data.data || data.details || data.message || data || {};
      const p = Array.isArray(payload) ? payload[0] : payload;
      const now = new Date().toISOString();
      return {
        id: String(p.id || p._id || Date.now()),
        name: p.name || name,
        projectName: p.projectName || name,
        version: p.version || '1.0',
        preparedBy: p.preparedBy || 'Imported',
        dateCreated: p.dateCreated || startDate || now,
        reviewedBy: p.reviewedBy || '',
        approvalDate: p.approvalDate || endDate || now,
        introduction: p.introduction || description || '',
        objectives: p.objectives || '',
        inScope: p.inScope || '',
        outOfScope: p.outOfScope || '',
        testItems: p.testItems || '',
        testStrategy: p.testStrategy || '',
        testEnvironment: p.testEnvironment || '',
        entryCriteria: p.entryCriteria || '',
        exitCriteria: p.exitCriteria || '',
        testDeliverables: p.testDeliverables || '',
        roles: p.roles || [],
        schedule: p.schedule || [],
        risks: p.risks || [],
        members: p.members || [],
        status: p.status || status,
        createdAt: p.createdAt || now,
        updatedAt: p.updatedAt || now
      };
    }

    // If import endpoint returned an error, fall through to fallback creation
    console.warn('Import endpoint returned non-ok status, falling back to create flow', response.status, data);
  } catch (err) {
    console.warn('Import endpoint failed, falling back to create flow:', err);
  }

  // Fallback: create a regular test plan and include file info in the description
  try {
    const fileInfo = `\n\n--- Imported from file: ${file.name} (${(file.size / 1024).toFixed(2)} KB) ---`;
    const enhancedDescription = description + fileInfo;

    // Create test plan data
    const testPlanData = {
      projectName: name,
      version: '1.0',
      preparedBy: 'Imported',
      dateCreated: startDate,
      reviewedBy: '',
      approvalDate: endDate,
      introduction: enhancedDescription,
      objectives: 'Imported test plan objectives',
      inScope: 'To be defined based on imported document',
      outOfScope: 'To be defined based on imported document',
      testItems: 'To be defined based on imported document',
      testStrategy: 'To be defined based on imported document',
      testEnvironment: 'To be defined based on imported document',
      entryCriteria: 'To be defined based on imported document',
      exitCriteria: 'To be defined based on imported document',
      testDeliverables: 'To be defined based on imported document',
      roles: [],
      schedule: [],
      risks: [],
      members: [],
      status: status,
      projectId: projectId
    };

    console.log('Creating test plan with imported data (fallback):', testPlanData);

    // Use the regular createTestPlan function
    const createdPlan = await createTestPlan(testPlanData as any);

    console.log('✅ Test plan created successfully as import alternative');
    return createdPlan;
  } catch (error) {
    console.error('Error in importTestPlan fallback:', error);
    throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteTestPlan = async (id: string): Promise<void> => {
  try {
    const url = `${API_BASE_URL}/testplans/${id}`;
    logRequest('DELETE', url);

    const response = await fetchWithAuth(url, {
      method: 'DELETE'
    });

    await handleResponse<void>(response, 'delete test plan');
  } catch (error) {
    console.error('Error in deleteTestPlan:', error);
    throw error;
  }
};
