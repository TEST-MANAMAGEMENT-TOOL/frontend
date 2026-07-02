export interface Attachment {
  url: string;
  name?: string;
}

export interface BugReport {
  id: string;
  title: string;
  module: string;
  shortDescription: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Reopened';
  type: 'Functional' | 'UI' | 'Performance' | 'Security' | 'Other';
  reportedBy: string;
  dateReported: string;
  stepsToReproduce: string;
  expectedResults: string;
  actualResults: string;
  assignedTo: string;
  environment: string;
  browser: string;
  os: string;
  buildVersion: string;
  attachments: (string | Attachment)[];
  comments: string;
  remarks: string;
  dateResolved?: string;
  resolution: 'Fixed' | 'Duplicate' | 'Won\'t Fix' | 'Cannot Reproduce' | 'Not a Bug' | 'Other';
  relatedIssues: string[];
  timeSpent: string;
}
