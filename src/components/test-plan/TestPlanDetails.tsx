import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TestPlan } from "@/pages/TestPlans";
import { Calendar, User, FileText, Target, CheckCircle, AlertTriangle, Users, Clock } from "lucide-react";

interface TestPlanDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testPlan: TestPlan | null;
}

export const TestPlanDetails: React.FC<TestPlanDetailsProps> = ({ open, onOpenChange, testPlan }) => {
  if (!testPlan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Test Plan Details: {testPlan.projectName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Project Name:</span>
                  <span>{testPlan.projectName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Version:</span>
                  <Badge variant="outline">{testPlan.version}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">Prepared By:</span>
                  <span>{testPlan.preparedBy}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Date Created:</span>
                  <span>{testPlan.dateCreated}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Reviewed By:</span>
                  <span>{testPlan.reviewedBy || 'Not reviewed'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Approval Date:</span>
                  <span>{testPlan.approvalDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Introduction and Objectives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Introduction & Objectives
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {testPlan.introduction && (
                <div>
                  <h4 className="font-medium mb-2">Introduction</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{testPlan.introduction}</p>
                </div>
              )}
              {testPlan.objectives && (
                <div>
                  <h4 className="font-medium mb-2">Objectives</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{testPlan.objectives}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scope */}
          <Card>
            <CardHeader>
              <CardTitle>Scope</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testPlan.inScope && (
                <div>
                  <h4 className="font-medium mb-2 text-green-600">In Scope</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{testPlan.inScope}</p>
                </div>
              )}
              {testPlan.outOfScope && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Out of Scope</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{testPlan.outOfScope}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Items and Strategy */}
          <Card>
            <CardHeader>
              <CardTitle>Test Strategy & Environment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {testPlan.testItems && (
                <div>
                  <h4 className="font-medium mb-2">Test Items / Features</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{testPlan.testItems}</p>
                </div>
              )}
              {testPlan.testStrategy && (
                <div>
                  <h4 className="font-medium mb-2">Test Strategy</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{testPlan.testStrategy}</p>
                </div>
              )}
              {testPlan.testEnvironment && (
                <div>
                  <h4 className="font-medium mb-2">Test Environment</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{testPlan.testEnvironment}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Entry & Exit Criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testPlan.entryCriteria && (
                <div>
                  <h4 className="font-medium mb-2 text-blue-600">Entry Criteria</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{testPlan.entryCriteria}</p>
                </div>
              )}
              {testPlan.exitCriteria && (
                <div>
                  <h4 className="font-medium mb-2 text-orange-600">Exit Criteria</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{testPlan.exitCriteria}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deliverables */}
          {testPlan.testDeliverables && (
            <Card>
              <CardHeader>
                <CardTitle>Test Deliverables</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{testPlan.testDeliverables}</p>
              </CardContent>
            </Card>
          )}

          {/* Roles and Responsibilities */}
          {testPlan.roles && testPlan.roles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Roles and Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testPlan.roles.map((role, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-muted-foreground">
                        <strong>Role:</strong> {role.role}
                      </div>
                      {role.responsibilities && (
                        <div className="text-sm text-muted-foreground mt-1">
                          <strong>Responsibilities:</strong> {role.responsibilities}
                        </div>
                      )}
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
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Schedule & Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testPlan.schedule.map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{item.task}</div>
                      <div className="text-sm text-muted-foreground">
                        <strong>Duration:</strong> {item.startDate} - {item.endDate}
                      </div>
                      {item.owner && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Owner:</strong> {item.owner}
                        </div>
                      )}
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
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Risks and Mitigation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testPlan.risks.map((risk, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{risk.risk}</div>
                      <div className="text-sm text-muted-foreground">
                        <strong>Impact:</strong> {risk.impact}
                      </div>
                      {risk.mitigation && (
                        <div className="text-sm text-muted-foreground mt-1">
                          <strong>Mitigation:</strong> {risk.mitigation}
                        </div>
                      )}
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
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {testPlan.members.map((member, index) => (
                    <Badge key={index} variant="secondary">
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
