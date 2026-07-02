import { create } from "zustand";
import { BugReport } from "@/types/bug-report";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { bugReportService } from "@/services/bugReportService";

interface BugReportState {
  // State
  bugReports: BugReport[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchBugReports: () => Promise<void>;
  addBugReport: (report: Omit<BugReport, 'id' | 'dateReported'>, testSuiteId?: string | null) => Promise<BugReport>;
  addBugReportToStore: (report: BugReport) => void;
  updateBugReport: (id: string, report: Partial<BugReport>) => Promise<BugReport>;
  deleteBugReport: (id: string) => Promise<void>;
  getBugReport: (id: string) => Promise<BugReport | undefined>;
  importBugReports: (
    file: File,
    testPlanId: string,
    requirementId: string,
    columnMapping: Record<string, string>
  ) => Promise<void>;
  exportBugReports: (reports?: BugReport[]) => Promise<void>;
  
  // Utility
  setError: (error: string | null) => void;
}

export const useBugReportStore = create<BugReportState>((set, get) => ({
  // Initial state
  bugReports: [],
  isLoading: false,
  error: null,

  // Actions
  fetchBugReports: async () => {
    console.log('Fetching bug reports...');
    set({ isLoading: true, error: null });
    try {
      const response = await bugReportService.getBugReports();
      console.log('Received bug reports:', response);
      console.log('Bug reports count:', response?.length);
      console.log('First bug report sample:', response?.[0]);
      console.log('Last bug report sample:', response?.[response.length - 1]);
      // Ensure we always set an array, even if the response is null/undefined
      const fetchedBugReports = Array.isArray(response) ? response : [];
      const currentBugReports = get().bugReports;
      const fetchedIds = new Set(fetchedBugReports.map((report) => report.id));
      const localOnlyBugReports = currentBugReports.filter((report) => !fetchedIds.has(report.id));
      const bugReports = [...fetchedBugReports, ...localOnlyBugReports];
      set({ bugReports, isLoading: false });
      console.log('Bug reports set in store, count:', bugReports.length);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch bug reports';
      console.error('Error in fetchBugReports:', {
        error,
        message: errorMessage,
        state: get()
      });
      set({ error: errorMessage, isLoading: false, bugReports: [] });
      throw error;
    }
  },

  addBugReport: async (report, testSuiteId) => {
    set({ isLoading: true, error: null });
    try {
      const newReport = await bugReportService.createBugReport(report, testSuiteId);
      set((state) => ({
        bugReports: [...state.bugReports, newReport],
        isLoading: false,
      }));
      return newReport;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create bug report';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  addBugReportToStore: (report) => {
    console.log('Adding bug report directly to store:', report);
    console.log('Current bug reports count:', get().bugReports.length);
    set((state) => {
      const exists = state.bugReports.some((bugReport) => bugReport.id === report.id);
      const newBugReports = exists
        ? state.bugReports.map((bugReport) => bugReport.id === report.id ? report : bugReport)
        : [...state.bugReports, report];
      console.log('New bug reports count:', newBugReports.length);
      console.log('New bug reports array:', newBugReports);
      return { bugReports: newBugReports };
    });
    console.log('After set - bug reports count:', get().bugReports.length);
  },

  updateBugReport: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedReport = await bugReportService.updateBugReport(id, updates);
      set((state) => ({
        bugReports: state.bugReports.map((report) =>
          report.id === id ? { ...report, ...updatedReport } : report
        ),
        isLoading: false,
      }));
      return updatedReport;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to update bug report ${id}`;
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteBugReport: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await bugReportService.deleteBugReport(id);
      set((state) => ({
        bugReports: state.bugReports.filter((report) => report.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to delete bug report ${id}`;
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  getBugReport: async (id) => {
    // First check if we have the report in the store
    const existingReport = get().bugReports.find((r) => r.id === id);
    if (existingReport) {
      return existingReport;
    }

    // If not, fetch it from the API
    set({ isLoading: true, error: null });
    try {
      const report = await bugReportService.getBugReportById(id);
      set((state) => ({
        bugReports: state.bugReports.some((r) => r.id === id)
          ? state.bugReports.map((r) => (r.id === id ? report : r))
          : [...state.bugReports, report],
        isLoading: false,
      }));
      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch bug report ${id}`;
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  importBugReports: async (file, testPlanId, requirementId, columnMapping) => {
    set({ isLoading: true, error: null });
    try {
      await bugReportService.importBugReports(file, testPlanId, requirementId, columnMapping);
      // Refresh the bug reports after import
      await get().fetchBugReports();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import bug reports';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  exportBugReports: async (reports) => {
    set({ isLoading: true, error: null });
    try {
      const dataToExport = reports || get().bugReports;
      if (!dataToExport || dataToExport.length === 0) {
        throw new Error("No bug reports available to export");
      }

      // Prepare data for Excel
      const data = dataToExport.map((bug) => ({
        "Bug ID": bug.id,
        "Title": bug.title,
        "Module": bug.module,
        "Short Description": bug.shortDescription,
        "Severity": bug.severity,
        "Priority": bug.priority,
        "Status": bug.status,
        "Type": bug.type,
        "Reported By": bug.reportedBy,
        "Date Reported": bug.dateReported ? new Date(bug.dateReported).toLocaleDateString() : 'N/A',
        "Assigned To": bug.assignedTo || 'Unassigned',
        "Environment": bug.environment || 'N/A',
        "Browser": bug.browser || 'N/A',
        "OS": bug.os || 'N/A',
        "Build Version": bug.buildVersion || 'N/A',
        "Steps to Reproduce": bug.stepsToReproduce || '',
        "Expected Results": bug.expectedResults || '',
        "Actual Results": bug.actualResults || '',
        "Resolution": bug.resolution || 'N/A',
        "Date Resolved": bug.dateResolved ? new Date(bug.dateResolved).toLocaleDateString() : '-',
        "Time Spent": bug.timeSpent || '0h'
      }));

      // Create sheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Defects");

      // Generate buffer and save
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const fileData = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
      saveAs(fileData, `bug-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export bug reports';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Utility function to set error
  setError: (error) => set({ error }),
}));

// Initialize the store by fetching bug reports
useBugReportStore.getState().fetchBugReports().catch(console.error);
