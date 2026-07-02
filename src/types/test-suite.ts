export interface TestCase {
  id: string;
  title: string;
  preconditions: string;
  testSteps: string;
  testData: string;
  expectedResults: string;
  actualResults: string;
  status: string;
  executedBy: string;
  executionDate: string;
  remarks: string;
  testedBy: string;
}

// Base interface that matches the API response
export interface ServiceTestSuite {
  id?: string;
  _id?: string; // Support for MongoDB-style _id
  name?: string;
  title?: string;
  testSuiteName?: string;
  description?: string;
  testCases?: Array<string | { id: string; title?: string; featureId?: string }>;
  status?: 'Draft' | 'Active' | 'Inactive';
  startDate?: string;
  endDate?: string;
  executedBy?: string;
  executedDate?: string;
  createdBy?: string;
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
  // API also returns these snake_case versions
  created_at?: string;
  updated_at?: string;
}

// Extended interface for the frontend store
export interface TestSuite extends ServiceTestSuite {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
  status: 'Draft' | 'Active' | 'Inactive';
  createdBy?: string; // Make this optional since it might not always be available
  projectId: string;
  createdAt: string;
  updatedAt: string;
  testCaseDetails?: TestCase[];
  featureIds?: string[]; // Array of requirement/feature IDs
  owner?: string; // Owner of the test suite
}