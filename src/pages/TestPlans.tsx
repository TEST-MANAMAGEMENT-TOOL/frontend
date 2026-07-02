import React, { useState, useEffect, useMemo } from "react";
import { Plus, Download, Upload, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useTestPlanStore } from "@/store/test-plan-store";
import TestPlanForm from "@/components/test-plan/TestPlanForm";
import { ImportTestPlanModal } from "@/components/test-plan/ImportTestPlanModal";
import { TestPlanViewModal } from "@/components/test-plan/TestPlanViewModal";
import { testPlanExportService } from "@/services/testPlanExportService";

// Define the ImportedTestPlan interface (kept for potential future use)
interface ImportedTestPlan {
  name: string;
  description?: string;
  status?: string;
  version?: string;
  preparedBy?: string;
  reviewedBy?: string;
  approvalDate?: string;
  introduction?: string;
  objectives?: string;
  inScope?: string;
  outOfScope?: string;
  testItems?: string;
  testStrategy?: string;
  testEnvironment?: string;
  entryCriteria?: string;
  exitCriteria?: string;
  testDeliverables?: string;
  roles?: Array<{ name: string; role: string; responsibilities: string }>;
  schedule?: Array<{ task: string; startDate: string; endDate: string; owner: string }>;
  risks?: Array<{ risk: string; impact: string; mitigation: string }>;
  members?: string[];
}

export interface TestPlan {
  id: string;
  name?: string;
  projectName: string;
  version: string;
  preparedBy: string;
  dateCreated: string;
  reviewedBy: string;
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
  status: string;
  createdAt: string;
  updatedAt: string;
  // Allow additional properties
  [key: string]: any;
}

const TestPlans = () => {
  const { testPlans: storeTestPlans, isLoading: isLoadingStore, error: errorStore, loadTestPlans, addTestPlan, updateTestPlan, deleteTestPlan } = useTestPlanStore();
  
  // Local state for UI
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPlan, setViewingPlan] = useState<TestPlan | null>(null);
  const { toast } = useToast();

  // Filter test plans based on search term
  const filteredPlans = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return storeTestPlans;

    return storeTestPlans.filter(plan => {
      const valuesToSearch = [
        plan.name,
        plan.projectName,
        plan.version,
        plan.status,
        plan.preparedBy,
        plan.reviewedBy,
        plan.introduction,
        plan.objectives,
        plan.inScope,
        plan.outOfScope,
        plan.testItems,
        plan.testStrategy,
        plan.testEnvironment,
        plan.entryCriteria,
        plan.exitCriteria,
        plan.testDeliverables,
        plan.dateCreated,
        plan.approvalDate,
        plan.createdAt,
        plan.updatedAt,
        (plan as any).testApproach,
        (plan as any).environmentalNeeds,
        (plan as any).responsibilities,
        (plan as any).trainingNeeds,
        (plan as any).assumptions,
        (plan as any).approvals,
      ];

      const metadataValues = [
        ...(plan.members || []),
        ...(plan.roles?.map(role => `${role.name} ${role.role} ${role.responsibilities}`) || []),
        ...(plan.schedule?.map(item => `${item.task} ${item.owner} ${item.startDate} ${item.endDate}`) || []),
        ...(plan.risks?.map(risk => `${risk.risk} ${risk.impact} ${risk.mitigation}`) || [])
      ];

      return [...valuesToSearch, ...metadataValues].some(value =>
        typeof value === 'string' && value.toLowerCase().includes(term)
      );
    });
  }, [storeTestPlans, searchTerm]);

  // Load test plans on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadTestPlans();
      } catch (error) {
        console.error('Failed to load test plans:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : 'Failed to load test plans',
          variant: "destructive"
        });
      }
    };

    loadData();
  }, [loadTestPlans, toast]);

  // Handle saving a test plan
  const handleSave = async (planData: Omit<TestPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingPlanId) {
        await updateTestPlan(editingPlanId, { 
          ...planData,
          updatedAt: new Date().toISOString() 
        });
        toast({
          title: "Success",
          description: "Test plan updated successfully",
        });
      } else {
        // Create a new plan without including createdAt/updatedAt in the initial object
        await addTestPlan({
          ...planData,
          status: "Draft"
        });
        
        toast({
          title: "Success",
          description: "Test plan created successfully",
        });
      }
      
      // Close the form and reset editing state
      setIsFormOpen(false);
      setEditingPlanId(null);
      
      // Refresh the test plans to ensure we have the latest data
      await loadTestPlans();
    } catch (error) {
      console.error('Error saving test plan:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save test plan',
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this test plan?")) {
      try {
        await deleteTestPlan(id);
        toast({
          title: "Success",
          description: "Test plan deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete test plan",
          variant: "destructive",
        });
      }
    }
  };

  const handleImportClick = () => {
    setIsImportModalOpen(true);
  };

  const handleImportTestPlan = async (planData: Omit<TestPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // If the import returned a fully formed TestPlan (with id), just reload from server
      const maybePlan: any = planData;
      if (maybePlan && maybePlan.id) {
        toast({
          title: "Success",
          description: "Test plan imported successfully",
        });
        await loadTestPlans();
        return;
      }

      await addTestPlan(planData as any);
      toast({
        title: "Success",
        description: "Test plan imported successfully",
      });
      await loadTestPlans();
    } catch (error) {
      console.error('Error importing test plan:', error);
      throw error; // Re-throw to let the modal handle the error display
    }
  };

  const handleViewPlan = (plan: TestPlan) => {
    setViewingPlan(plan);
    setIsViewModalOpen(true);
  };

  const handleDownloadPlan = async (format: 'pdf' | 'docx') => {
    if (!viewingPlan) return;

    try {
      if (format === 'pdf') {
        await testPlanExportService.exportToPDF(viewingPlan);
      } else {
        await testPlanExportService.exportToWord(viewingPlan);
      }
      
      toast({
        title: "Success",
        description: `Test plan exported as ${format.toUpperCase()} successfully`,
      });
    } catch (error) {
      console.error('Error exporting test plan:', error);
      toast({
        title: "Error",
        description: `Failed to export test plan as ${format.toUpperCase()}`,
        variant: "destructive",
      });
    }
  };

  if (isLoadingStore) {
    return <div className="flex justify-center items-center h-64">Loading test plans...</div>;
  }

  if (errorStore) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{errorStore}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Test Plans</h1>
        <Button onClick={() => {
          setEditingPlanId(null);
          setIsFormOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> New Test Plan
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="w-full max-w-md">
          <Input
            placeholder="Search test plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prepared By</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans
                .filter(plan => plan && typeof plan === 'object' && (plan.id || plan.name || plan.projectName))
                .map((plan, index) => {
                  // Use plan.id if available, otherwise create a unique key
                  const rowKey = plan.id || `row-${index}-${plan.name || plan.projectName || 'plan'}`;
                  
                  return (
                    <TableRow key={rowKey}>
                      <TableCell className="font-medium">
                        {plan.name || plan.projectName || 'Unnamed Plan'}
                      </TableCell>
                      <TableCell>{plan.version || '1.0'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${
                          plan.status === 'Active' 
                            ? 'bg-success/15 text-success border-success/20' 
                            : plan.status === 'Draft' 
                              ? 'bg-warning/15 text-warning border-warning/20' 
                              : 'bg-muted text-muted-foreground border-border'
                        }`}>
                          {plan.status || 'Draft'}
                        </span>
                      </TableCell>
                      <TableCell>{plan.preparedBy || 'N/A'}</TableCell>
                      <TableCell>{
                        plan.updatedAt 
                          ? new Date(plan.updatedAt).toLocaleDateString() 
                          : plan.dateCreated 
                            ? new Date(plan.dateCreated).toLocaleDateString()
                            : 'N/A'
                      }</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleViewPlan(plan)}
                            title="View test plan"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={async () => {
                              try {
                                await testPlanExportService.exportToPDF(plan);
                                toast({
                                  title: "Success",
                                  description: "Test plan exported as PDF successfully",
                                });
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to export test plan",
                                  variant: "destructive",
                                });
                              }
                            }}
                            title="Download as PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              if (plan.id) {
                                setEditingPlanId(plan.id);
                                setIsFormOpen(true);
                              }
                            }}
                            title="Edit test plan"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              if (plan.id && window.confirm('Are you sure you want to delete this test plan?')) {
                                handleDelete(plan.id);
                              }
                            }}
                            title="Delete test plan"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {filteredPlans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No test plans found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ImportTestPlanModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImport={handleImportTestPlan}
      />

      <TestPlanViewModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        testPlan={viewingPlan}
        onDownload={handleDownloadPlan}
      />

      <TestPlanForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingPlanId(null);
        }}
        planId={editingPlanId || undefined}
        onSuccess={(plan) => {
          // The form handles the actual saving, we just need to close it and reload the list
          setIsFormOpen(false);
          setEditingPlanId(null);
          loadTestPlans();
          
          // Show success toast
          toast({
            title: "Success",
            description: editingPlanId 
              ? "Test plan updated successfully" 
              : "Test plan created successfully"
          });
        }}
      />
    </div>
  );
};

export default TestPlans;