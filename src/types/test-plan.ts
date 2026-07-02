// Base interface for test plan data
export interface BaseTestPlanData {
  id: string;
  projectName: string;
  name?: string;        // Alternative to projectName
  title?: string;       // Alternative to projectName
  version: string;
  status?: string;      // Added status field
  effectiveDate?: string; // Added effectiveDate field
  preparedBy: string;
  createdBy?: string;   // Alternative to preparedBy
  dateCreated: string;
  createdAt?: string;   // Alternative to dateCreated
  reviewedBy: string;
  reviewDate?: string;  // Added reviewDate field
  approvedBy?: string;  // Added approvedBy field
  approvalDate: string;
  introduction: string;
  objectives: string;
  inScope: string;
  outOfScope: string;
  testItems: string;
  testStrategy: string;
  testEnvironment: string;
  entryCriteria: string;
  exitCriteria: string;
  testDeliverables: string;
  roles: Array<{ name: string; role: string; responsibilities: string }>;
  schedule: Array<{ task: string; startDate: string; endDate: string; owner: string }>;
  risks: Array<{ risk: string; impact: string; mitigation: string }>;
  members: string[];
  changeHistory?: Array<{  // Added changeHistory field
    version: string;
    date: string;
    author: string;
    description: string;
    approvedBy: string;
  }>;
}

// Extended interface for PDF export specific data
export interface PdfTestPlanData extends BaseTestPlanData {
  // No additional fields needed as we've added them to BaseTestPlanData
}

// Extended interface for form data
export interface FormTestPlanData extends Omit<BaseTestPlanData, 'id' | 'risks' | 'changeHistory'> {
  id?: string;
  projectId?: number;
  // Add any additional form-specific fields here
  testApproach: string;
  environmentalNeeds: string;
  responsibilities: string;
  trainingNeeds: string;
  assumptions: string;
  approvals: string;
  // Make risks more flexible for form handling
  risks: Array<{ risk: string; impact: string; mitigation: string }>;
  [key: string]: any; // For dynamic form fields
}

// Type for creating a new test plan (without ID)
export type CreateTestPlanData = Omit<BaseTestPlanData, 'id'>;

// Type for updating a test plan (all fields optional except ID)
export type UpdateTestPlanData = Partial<Omit<BaseTestPlanData, 'id'>> & { id: string };
