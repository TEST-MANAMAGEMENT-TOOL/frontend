import { create } from "zustand";
import { persist } from "zustand/middleware";
import { QaReport } from "@/types/qa-report";

interface QaReportState {
  qaReports: QaReport[];
  addQaReport: (report: QaReport) => void;
  updateQaReport: (id: string, report: Partial<QaReport>) => void;
  deleteQaReport: (id: string) => void;
  getQaReport: (id: string) => QaReport | undefined;
}

const seed: QaReport[] = [
  {
    id: "QA-001",
    reportTitle: "Group 4 QA Report",
    group: "Group 4",
    ragStatus: "Amber",
    projectSection: "Group 4 - ATTACHMENT",
    cohort: "JEWA-PROPERTY INFINITY",
    projectName: "JEWA-PROPERTY INFINITY",
    startDate: "15/07/2025",
    endDate: "Ongoing",
    defectsDistribution: {
      critical: 0,
      major: 12,
      medium: 13,
      low: 0,
      total: 25
    },
    testDistribution: {
      automated: 0,
      manual: 59,
      nonFunctional: 0
    },
    testCaseExecution: {
      totalTestCases: 62,
      testCasesExecuted: 59,
      blockedTestCases: 0,
      passedTestCases: 35,
      failedTestCases: 24,
      skippedTestCases: 3,
      executionRate: 95.16,
      passRate: 59.32,
      failRate: 40.68
    },
    defectStatus: {
      openCritical: 0,
      openMajor: 1,
      openMedium: 5,
      openLow: 2,
      verifiedCritical: 0,
      verifiedMajor: 4,
      verifiedMedium: 0,
      verifiedLow: 0,
      assignedCritical: 0,
      assignedMajor: 6,
      assignedMedium: 0,
      assignedLow: 2,
      rejectedCritical: 0,
      rejectedMajor: 0,
      rejectedMedium: 0,
      rejectedLow: 1,
      totalDefects: 25
    },
    bugDetails: [
      {
        bugId: "BUG-001",
        title: "Data validation during user registration",
        stepsToProduce: "1. Navigate to the login page\n2. Click the Create link button above the Login as a Tenant\n3. Enter the required credentials\n4. Agree to the Terms and Conditions\n5. Click the Sign Up button\n6. Log in using the newly created account",
        severity: "High",
        priority: "High",
        actualResult: "Account created",
        status: "Open"
      },
      {
        bugId: "BUG-002",
        title: "Display information during sign up",
        stepsToProduce: "1. Navigate to the login page\n2. Click the Create link button above the Login as a Tenant\n3. Read the placeholder data",
        severity: "High",
        priority: "Medium",
        actualResult: "Requests username but validates for user email",
        status: "Open"
      },
      {
        bugId: "BUG-003",
        title: "Forgot password button",
        stepsToProduce: "Navigate to login page",
        severity: "Medium",
        priority: "Medium",
        actualResult: "The feature is missing",
        status: "Open"
      }
    ],
    createdAt: "2025-01-20",
    updatedAt: "2025-01-20"
  }
];

export const useQaReportStore = create<QaReportState>()(
  persist(
    (set, get) => ({
      qaReports: seed,
      
      addQaReport: (report) => 
        set((state) => ({ 
          qaReports: [...state.qaReports, report] 
        })),
      
      updateQaReport: (id, report) =>
        set((state) => ({
          qaReports: state.qaReports.map((r) =>
            r.id === id ? { ...r, ...report, updatedAt: new Date().toISOString().split('T')[0] } : r
          )
        })),
      
      deleteQaReport: (id) =>
        set((state) => ({
          qaReports: state.qaReports.filter((r) => r.id !== id)
        })),
      
      getQaReport: (id) =>
        get().qaReports.find((r) => r.id === id)
    }),
    { 
      name: "qa-report-store",
      version: 1
    }
  )
);
