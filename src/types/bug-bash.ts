export interface BugBashUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface BugBashComment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user: BugBashUser;
}

export interface BugBashFunctionalItem {
  id: string;
  type: 'bug' | 'feature' | 'improvement';
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'wont-fix';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reporterId: string;
  assigneeId?: string;
  module: string;
  environment: string;
  stepsToReproduce?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  attachments?: string[];
  comments: BugBashComment[];
  createdAt: string;
  updatedAt: string;
}

export interface BugBashPerformanceItem {
  id: string;
  testName: string;
  testDate: string;
  tps: number;
  errorRate: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  successRate: number;
  testDuration: number;
  jmeterLogsUrl?: string;
  notes?: string;
  testerId: string;
  environment: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  reporterId?: string;
  comments?: BugBashComment[];
  attachments?: string[];
  updatedAt?: string;
  createdAt: string;
}

export interface BugBashSecurityItem {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'fixing' | 'fixed' | 'wont-fix';
  reporterId: string;
  assigneeId?: string;
  endpoint: string;
  requestDetails?: string;
  impact?: string;
  stepsToReproduce?: string[];
  recommendations?: string[];
  cvssScore?: number;
  owaspCategory?: string;
  attachments?: string[];
  comments: BugBashComment[];
  createdAt: string;
  updatedAt: string;
}

export interface BugBash {
  id: string;
  title: string;
  name: string;  // Required field for the bug bash name
  scope: string; // Required field for the bug bash scope
  description?: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  participants: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  functional: BugBashFunctionalItem[];
  performance: BugBashPerformanceItem[];
  security: BugBashSecurityItem[];
  tags?: string[];
  targetEnvironment?: string;
  notes?: string;
  participantsData?: BugBashUser[];
  createdByUser?: BugBashUser;
  
  // Legacy properties for backward compatibility
  startTime?: string;
  endTime?: string;
  bugsReported?: string[];
  results?: string;
  remarks?: string;
  typeId?: string;
}

// BugBashBug type for API interactions
export interface BugBashBug {
  id: string | number;
  bug_bash_id: string | number;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'wont-fix';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'bug';
  module: string;
  environment: string;
  reporter_id: string | number;
  assignee_id?: string | number;
  steps_to_reproduce: string[];
  expected_behavior: string;
  actual_behavior: string;
  attachments?: string[];
  comments: BugBashComment[];
  created_at?: string;
  updated_at?: string;
  createdBy?: string;
  updatedBy?: string;
}

// Legacy type aliases for backward compatibility
export type FunctionalIssue = BugBashFunctionalItem;
export type PerformanceResult = BugBashPerformanceItem;
export type SecurityVulnerability = BugBashSecurityItem;

// Type for the form data when creating/updating a bug bash
export interface BugBashFormData {
  title: string;
  name: string;  // Required field for the bug bash name
  scope: string; // Required field for the bug bash scope
  description?: string;
  startDate: string;
  endDate: string;
  participants: string[];
  targetEnvironment?: string;
  tags?: string[];
}