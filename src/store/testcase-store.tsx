import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchTestCases, createTestCase, updateTestCase as updateTestCaseApi, deleteTestCase as deleteTestCaseApi } from "@/services/testCaseService";

export type TestStatus = "Not Run" | "Passed" | "Failed" | "Blocked" | "Skipped";

export interface TestCase {
  id: string;
  title: string;
  description?: string;
  preconditions?: string;
  testSteps: string;
  testData?: string;
  expectedResults: string;
  actualResults?: string;
  status: TestStatus;
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

interface TestCaseState {
  testCases: TestCase[];
  isLoading: boolean;
  error: string | null;
  loadTestCases: () => Promise<TestCase[]>;
  addTestCase: (tc: Omit<TestCase, 'id' | 'created_at' | 'updated_at'>) => Promise<TestCase>;
  updateTestCase: (id: string, patch: Partial<Omit<TestCase, 'id' | 'created_at' | 'updated_at'>>) => Promise<TestCase>;
  removeTestCase: (id: string) => Promise<void>;
  setTestCases: (tcs: TestCase[]) => void;
  clearError: () => void;
}

export const useTestCaseStore = create<TestCaseState>()(
  persist(
    (set, get) => ({
      testCases: [],
      isLoading: false,
      error: null,
      
      loadTestCases: async () => {
        console.log('Starting to load test cases...');
        set({ isLoading: true, error: null });
        
        try {
          console.log('Fetching test cases from API...');
          const testCases = await fetchTestCases();
          console.log('Test cases fetched successfully:', testCases);
          
          // Ensure we have a valid array before setting state
          if (!Array.isArray(testCases)) {
            throw new Error('Invalid response format: expected an array of test cases');
          }
          
          set({ 
            testCases, 
            isLoading: false,
            error: null
          });
          
          return testCases;
        } catch (error) {
          console.error('Failed to load test cases:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to load test cases';
          
          set({ 
            testCases: [],
            isLoading: false, 
            error: errorMessage
          });
          
          throw error;
        }
      },
      
      addTestCase: async (testCase) => {
        try {
          const newTestCase = await createTestCase(testCase);
          set((state) => ({
            testCases: [...state.testCases, newTestCase],
            error: null
          }));
          return newTestCase;
        } catch (error) {
          console.error('Failed to add test case:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to add test case';
          set({ error: errorMessage });
          throw error;
        }
      },
      
      updateTestCase: async (id, updates) => {
        try {
          const existing = get().testCases.find((t) => t.id === id);
          if (!existing) throw new Error("Test case not found in store");
          
          // Generate a complete payload representation for PUT request
          const fullPayload = {
            title: updates.title !== undefined ? updates.title : existing.title,
            description: updates.description !== undefined ? updates.description : existing.description,
            preconditions: updates.preconditions !== undefined ? updates.preconditions : existing.preconditions,
            testSteps: updates.testSteps !== undefined ? updates.testSteps : existing.testSteps,
            testData: updates.testData !== undefined ? updates.testData : existing.testData,
            expectedResults: updates.expectedResults !== undefined ? updates.expectedResults : existing.expectedResults,
            actualResults: updates.actualResults !== undefined ? updates.actualResults : existing.actualResults,
            status: updates.status !== undefined ? updates.status : existing.status,
            executedBy: updates.executedBy !== undefined ? updates.executedBy : existing.executedBy,
            executionDate: updates.executionDate !== undefined ? updates.executionDate : existing.executionDate,
            remarks: updates.remarks !== undefined ? updates.remarks : existing.remarks,
            testedBy: updates.testedBy !== undefined ? updates.testedBy : existing.testedBy,
            testPlanId: String((existing as any).testPlanId || "1"),
            requirementId: String((existing as any).requirementId || "1"),
          };

          const updatedTestCase = await updateTestCaseApi(id, fullPayload);
          set((state) => ({
            testCases: state.testCases.map((t) =>
              t.id === id ? { ...t, ...updatedTestCase } : t
            ),
            error: null
          }));
          return updatedTestCase;
        } catch (error) {
          console.error('Failed to update test case:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to update test case';
          set({ error: errorMessage });
          throw error;
        }
      },
      
      removeTestCase: async (id) => {
        try {
          await deleteTestCaseApi(id);
          set((state) => ({
            testCases: state.testCases.filter((t) => t.id !== id),
            error: null
          }));
        } catch (error) {
          console.error('Failed to delete test case:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete test case';
          set({ error: errorMessage });
          throw error;
        }
      },
      
      setTestCases: (testCases: TestCase[]) => {
        set({ testCases, error: null });
      },
      
      clearError: () => {
        set({ error: null });
      }
    }),
    { 
      name: "testcase-store",
      partialize: (state) => ({ testCases: state.testCases })
    }
  )
);
