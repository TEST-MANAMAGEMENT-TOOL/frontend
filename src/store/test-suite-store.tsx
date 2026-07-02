import { create } from "zustand";
import {
  fetchTestSuites as fetchTestSuitesApi,
  fetchTestSuiteById as fetchTestSuiteByIdApi,
  fetchTestCasesInSuite as fetchTestCasesInSuiteApi,
  createTestSuite as createTestSuiteApi,
  updateTestSuite as updateTestSuiteApi,
  deleteTestSuite as deleteTestSuiteApi,
} from "../services/testSuiteService";
import type { TestSuite, ServiceTestSuite, TestCase } from '../types/test-suite';

export type { TestSuite, ServiceTestSuite, TestCase };

const toStoreTestSuite = (suite: ServiceTestSuite): TestSuite => {
  let testCases: TestCase[] = [];

  if (Array.isArray(suite.testCases)) {
    testCases = suite.testCases.map((tc: any) => {
      if (tc && typeof tc === 'object') {
        return {
          id: String(tc.id || ''),
          title: tc.title || `Test Case ${tc.id}`,
          preconditions: tc.preconditions || '',
          testSteps: tc.testSteps || '',
          testData: tc.testData || '',
          expectedResults: tc.expectedResults || '',
          actualResults: tc.actualResults || '',
          status: tc.status || 'Not Run',
          executedBy: tc.executedBy || '',
          executionDate: tc.executionDate || '',
          remarks: tc.remarks || '',
          testedBy: tc.testedBy || '',
        };
      }
      return {
        id: String(tc),
        title: `Test Case ${tc}`,
        preconditions: '', testSteps: '', testData: '',
        expectedResults: '', actualResults: '',
        status: 'Not Run', executedBy: '', executionDate: '',
        remarks: '', testedBy: '',
      };
    });
  }

  return {
    ...suite,
    id: String(suite.id || suite._id || ''),
    name: suite.testSuiteName || suite.name || 'Unnamed Test Suite',
    description: suite.description || '',
    testCases,
    status: suite.status || 'Draft',
    createdBy: suite.createdBy || 'Unknown',
    projectId: String(suite.projectId || ''),
    createdAt: suite.createdAt || (suite as any).created_at || new Date().toISOString(),
    updatedAt: suite.updatedAt || (suite as any).updated_at || new Date().toISOString(),
    testCaseDetails: testCases,
    featureIds: (suite as any).featureIds || [],
    owner: (suite as any).owner || (suite as any).createdBy || 'Unknown',
  };
};

interface TestSuiteState {
  testSuites: TestSuite[];
  currentProjectId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchTestSuites: (projectId?: string) => Promise<void>;
  setCurrentProject: (projectId: string | null) => void;
  getTestSuite: (id: string) => Promise<TestSuite>;
  addTestSuite: (suite: Omit<TestSuite, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TestSuite>;
  updateTestSuite: (id: string, updates: Partial<TestSuite>) => Promise<TestSuite>;
  deleteTestSuite: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTestSuiteStore = create<TestSuiteState>()((set, get) => ({
  testSuites: [],
  currentProjectId: null,
  isLoading: false,
  error: null,

  setCurrentProject: (projectId) => set({ currentProjectId: projectId }),

  fetchTestSuites: async (projectId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const allSuites = await fetchTestSuitesApi();

      // Client-side filtering since API filtering is not supported
      const filteredSuites = projectId
        ? allSuites.filter(s => String(s.projectId) === String(projectId))
        : allSuites;

      // Fetch test cases for each suite
      const suitesWithTestCases = await Promise.all(
        filteredSuites.map(async (suite) => {
          try {
            const testCases = await fetchTestCasesInSuiteApi(String(suite.id));
            const mappedTestCases = testCases.map((tc: any) => ({
              id: String(tc.id || tc._id || ''),
              title: tc.title || tc.name || `Test Case ${tc.id}`,
              preconditions: tc.preconditions || '',
              testSteps: tc.testSteps || '',
              testData: tc.testData || '',
              expectedResults: tc.expectedResults || '',
              actualResults: tc.actualResults || '',
              status: tc.status || 'Not Run',
              executedBy: tc.executedBy || '',
              executionDate: tc.executionDate || '',
              remarks: tc.remarks || '',
              testedBy: tc.testedBy || '',
            }));
            return { ...suite, testCases: mappedTestCases };
          } catch {
            return { ...suite, testCases: [] };
          }
        })
      );

      set({
        testSuites: suitesWithTestCases.map(toStoreTestSuite),
        currentProjectId: projectId ?? get().currentProjectId,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch test suites';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getTestSuite: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const suite = await fetchTestSuiteByIdApi(id);
      set({ isLoading: false });
      return toStoreTestSuite(suite);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch test suite';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  addTestSuite: async (suite) => {
    set({ isLoading: true, error: null });
    try {
      const { testCaseDetails, ...apiSuite } = suite as any;
      const newSuite = await createTestSuiteApi(apiSuite);

      const returnedId = newSuite.id || newSuite._id;
      if (!returnedId || String(returnedId).startsWith('temp-')) {
        throw new Error('Test suite was not properly saved. Please try again.');
      }

      const storeSuite = toStoreTestSuite(newSuite);

      // Update current project to match the created suite's project
      const createdProjectId = String(newSuite.projectId || suite.projectId);
      set({ currentProjectId: createdProjectId });

      // Refresh from server using the created suite's project ID
      await get().fetchTestSuites(createdProjectId);

      return storeSuite;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create test suite';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateTestSuite: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { testCaseDetails, ...apiUpdates } = updates as any;
      const updatedSuite = await updateTestSuiteApi(id, apiUpdates);
      const storeSuite = toStoreTestSuite(updatedSuite);
      set(state => ({
        testSuites: state.testSuites.map(s =>
          s.id === id ? { ...storeSuite, testCaseDetails: s.testCaseDetails } : s
        ),
        isLoading: false,
      }));
      return storeSuite;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update test suite';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteTestSuite: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteTestSuiteApi(id);
      set(state => ({
        testSuites: state.testSuites.filter(s => s.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete test suite';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
