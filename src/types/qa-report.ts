export interface DefectDistribution {
  critical: number;
  major: number;
  medium: number;
  low: number;
  total: number;
}

export interface TestDistribution {
  automated: number;
  manual: number;
  nonFunctional: number;
}

export interface TestCaseExecution {
  totalTestCases: number;
  testCasesExecuted: number;
  blockedTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  skippedTestCases: number;
  executionRate: number;
  passRate: number;
  failRate: number;
}

export interface DefectStatus {
  openCritical: number;
  openMajor: number;
  openMedium: number;
  openLow: number;
  verifiedCritical: number;
  verifiedMajor: number;
  verifiedMedium: number;
  verifiedLow: number;
  assignedCritical: number;
  assignedMajor: number;
  assignedMedium: number;
  assignedLow: number;
  rejectedCritical: number;
  rejectedMajor: number;
  rejectedMedium: number;
  rejectedLow: number;
  totalDefects: number;
}

export interface BugDetail {
  bugId: string;
  title: string;
  stepsToProduce: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  actualResult: string;
  status: 'Open' | 'Verified & Closed' | 'Assigned' | 'Rejected';
}

export interface QaReport {
  id: string;
  reportTitle: string;
  group: string;
  ragStatus: 'Red' | 'Amber' | 'Green';
  projectSection: string;
  cohort: string;
  projectName: string;
  startDate: string;
  endDate: string;
  defectsDistribution: DefectDistribution;
  testDistribution: TestDistribution;
  testCaseExecution: TestCaseExecution;
  defectStatus: DefectStatus;
  bugDetails: BugDetail[];
  createdAt: string;
  updatedAt: string;
}
