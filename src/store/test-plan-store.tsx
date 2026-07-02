import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TestPlan } from "@/pages/TestPlans";
import { fetchTestPlans, createTestPlan, updateTestPlan as updateTestPlanApi, deleteTestPlan as deleteTestPlanApi } from "@/services/testPlanService";

interface TestPlanState {
  testPlans: TestPlan[];
  isLoading: boolean;
  error: string | null;
  loadTestPlans: () => Promise<void>;
  addTestPlan: (plan: Omit<TestPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TestPlan>;
  updateTestPlan: (id: string, plan: Partial<TestPlan>) => Promise<TestPlan>;
  deleteTestPlan: (id: string) => Promise<void>;
  getTestPlan: (id: string) => TestPlan | undefined;
}

export const useTestPlanStore = create<TestPlanState>()(
  persist(
    (set, get) => ({
      testPlans: [],
      isLoading: false,
      error: null,
      
      loadTestPlans: async () => {
        set({ isLoading: true, error: null });
        try {
          const plans = await fetchTestPlans();
          set({ testPlans: plans, isLoading: false });
        } catch (error) {
          console.error('Failed to load test plans:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load test plans',
            isLoading: false 
          });
        }
      },
      
      addTestPlan: async (plan) => {
        try {
          console.log('Creating test plan with data:', plan);
          const newPlan = await createTestPlan(plan);
          console.log('Test plan created successfully:', newPlan);
          
          set((state) => {
            const updatedTestPlans = [...state.testPlans, newPlan];
            console.log('Updating test plans in store:', updatedTestPlans);
            return { testPlans: updatedTestPlans };
          });
          
          return newPlan;
        } catch (error) {
          console.error('Failed to add test plan:', error);
          throw error;
        }
      },
      
      updateTestPlan: async (id, updates) => {
        try {
          console.log('Updating test plan with id:', id, 'and data:', updates);
          const updatedPlan = await updateTestPlanApi(id, updates);
          console.log('Test plan updated successfully:', updatedPlan);
          
          set((state) => {
            const updatedTestPlans = state.testPlans.map((plan) =>
              plan.id === id ? { ...plan, ...updatedPlan, updatedAt: new Date().toISOString() } : plan
            );
            console.log('Updating test plans in store:', updatedTestPlans);
            return { testPlans: updatedTestPlans };
          });
          
          return updatedPlan;
        } catch (error) {
          console.error('Failed to update test plan:', error);
          throw error;
        }
      },
      
      deleteTestPlan: async (id) => {
        try {
          console.log('Deleting test plan with id:', id);
          await deleteTestPlanApi(id);
          console.log('Test plan deleted successfully');
          
          set((state) => {
            const updatedTestPlans = state.testPlans.filter((plan) => plan.id !== id);
            console.log('Updating test plans in store:', updatedTestPlans);
            return { testPlans: updatedTestPlans };
          });
        } catch (error) {
          console.error('Failed to delete test plan:', error);
          throw error;
        }
      },
      
      getTestPlan: (id) => {
        return get().testPlans.find((plan) => plan.id === id);
      }
    }),
    { 
      name: "test-plan-store",
      version: 1,
      partialize: (state) => ({
        testPlans: state.testPlans
      })
    }
  )
);
