import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, File } from 'lucide-react';
import { TestPlan } from '@/pages/TestPlans';

interface TestPlanViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testPlan: TestPlan | null;
  onDownload: (format: 'pdf' | 'docx') => void;
}

export const TestPlanViewModal: React.FC<TestPlanViewModalProps> = ({
  open,
  onOpenChange,
  testPlan,
  onDownload,
}) => {
  if (!testPlan) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-success/15 text-success border border-success/20 hover:bg-success/25';
      case 'draft':
        return 'bg-warning/15 text-warning border border-warning/20 hover:bg-warning/25';
      case 'archived':
        return 'bg-muted text-muted-foreground border border-border hover:bg-muted/80';
      default:
        return 'bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {testPlan.name || testPlan.projectName}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(testPlan.status)}>
                {testPlan.status || 'Draft'}
              </Badge>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload('pdf')}
                  className="flex items-center space-x-1"
                >
                  <FileText className="h-4 w-4" />
                  <span>PDF</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload('docx')}
                  className="flex items-center space-x-1"
                >
                  <File className="h-4 w-4" />
                  <span>Word</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Version</label>
                  <p className="text-sm">{testPlan.version || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Prepared By</label>
                  <p className="text-sm">{testPlan.preparedBy || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date Created</label>
                  <p className="text-sm">
                    {testPlan.dateCreated 
                      ? new Date(testPlan.dateCreated).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Reviewed By</label>
                  <p className="text-sm">{testPlan.reviewedBy || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Approval Date</label>
                  <p className="text-sm">
                    {testPlan.approvalDate && testPlan.approvalDate !== '[Pending Approval]'
                      ? new Date(testPlan.approvalDate).toLocaleDateString()
                      : 'Pending Approval'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm">
                    {testPlan.updatedAt 
                      ? new Date(testPlan.updatedAt).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Introduction */}
          {testPlan.introduction && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Introduction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{testPlan.introduction}</p>
              </CardContent>
            </Card>
          )}

          {/* Objectives */}
          {testPlan.objectives && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Objectives</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{testPlan.objectives}</p>
              </CardContent>
            </Card>
          )}

          {/* Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testPlan.inScope && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">In Scope</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{testPlan.inScope}</p>
                </CardContent>
              </Card>
            )}

            {testPlan.outOfScope && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Out of Scope</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{testPlan.outOfScope}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Test Strategy */}
          {testPlan.testStrategy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{testPlan.testStrategy}</p>
              </CardContent>
            </Card>
          )}

          {/* Test Environment */}
          {testPlan.testEnvironment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Environment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{testPlan.testEnvironment}</p>
              </CardContent>
            </Card>
          )}

          {/* Entry & Exit Criteria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testPlan.entryCriteria && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Entry Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{testPlan.entryCriteria}</p>
                </CardContent>
              </Card>
            )}

            {testPlan.exitCriteria && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Exit Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{testPlan.exitCriteria}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Test Deliverables */}
          {testPlan.testDeliverables && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Deliverables</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{testPlan.testDeliverables}</p>
              </CardContent>
            </Card>
          )}

          {/* Roles and Responsibilities */}
          {testPlan.roles && testPlan.roles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Roles and Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testPlan.roles.map((role, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{role.name}</span>
                        <Badge variant="secondary">{role.role}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{role.responsibilities}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule */}
          {testPlan.schedule && testPlan.schedule.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testPlan.schedule.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="font-medium">{item.task}</p>
                        <p className="text-sm text-gray-600">Owner: {item.owner}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risks */}
          {testPlan.risks && testPlan.risks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risks and Mitigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testPlan.risks.map((risk, index) => (
                    <div key={index} className="border border-red-200 rounded-md p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-red-800">Risk:</span>
                        <span>{risk.risk}</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-orange-800">Impact:</span>
                        <span>{risk.impact}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-green-800">Mitigation:</span>
                        <span>{risk.mitigation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Members */}
          {testPlan.members && testPlan.members.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {testPlan.members.map((member, index) => (
                    <Badge key={index} variant="outline">
                      {member}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};