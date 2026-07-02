import React, { useEffect, useState } from "react";
import { useTestSuiteStore } from "@/store/test-suite-store";
import { fetchProjects } from "@/services/projectService";
import { fetchRTMEntries, RTMEntry, getLinkedTestCases } from "@/services/rtmService";
import { fetchTestCasesByIds } from "@/services/testCaseService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

interface TestSuiteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suiteId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

interface FormTestCase {
  id: string;
  title: string;
  preconditions?: string;
  testSteps: string;
  testData?: string;
  expectedResults: string;
  actualResults?: string;
  status: string;
  executedBy?: string;
  executionDate?: string;
  remarks?: string;
  testedBy?: string;
  featureId: string; // still retained for UI; will set to selected feature name
}

const TestSuiteForm: React.FC<TestSuiteFormProps> = ({
  open,
  onOpenChange,
  suiteId,
  onSuccess,
  onCancel,
}) => {
  const { testSuites, addTestSuite, updateTestSuite, currentProjectId } = useTestSuiteStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState<string>("Draft");
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requirementOpen, setRequirementOpen] = useState(false);

  // Data from API
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [testCases, setTestCases] = useState<FormTestCase[]>([]);
  const [rtmEntries, setRtmEntries] = useState<RTMEntry[]>([]);
  const [isLoading, setIsLoading] = useState({
    projects: false,
    requirements: false,
    testCases: false,
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      loadProjects();
      if (suiteId) {
        const suite = testSuites.find((s) => s.id === suiteId);
        if (suite) {
          setName(suite.name);
          setDescription(suite.description || "");
          setProjectId(suite.projectId);
          setStatus(suite.status || "Draft");
          setSelectedRequirements([...(suite.featureIds || [])]);
          setSelectedTestCases(suite.testCases?.map((tc) => tc.id) || []);
          loadRequirementsFromRTM(suite.projectId);
        }
      } else {
        // Reset form for new suite
        setName("");
        setDescription("");
        setStatus("Draft");
        // Use current project from store for new suites
        setProjectId(currentProjectId || "");
        setSelectedRequirements([]);
        setSelectedTestCases([]);
        setTestCases([]);
        
        // Load requirements for current project if available
        if (currentProjectId) {
          loadRequirementsFromRTM(currentProjectId);
        }
      }
    }
  }, [open, suiteId, testSuites, currentProjectId]);

  const loadProjects = async () => {
    setIsLoading((prev) => ({ ...prev, projects: true }));
    try {
      const data = await fetchProjects();
      setProjects(data.map((project) => ({
        id: project.id?.toString() || '',
        name: project.projectName
      })));
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setIsLoading((prev) => ({ ...prev, projects: false }));
    }
  };

  const loadRequirementsFromRTM = async (projectId: string) => {
    if (!projectId) return;
    setIsLoading((prev) => ({ ...prev, requirements: true }));
    try {
      const entries = await fetchRTMEntries();
      setRtmEntries(entries);
    } catch (error) {
      console.error("Failed to load RTM entries:", error);
      setRtmEntries([]);
    } finally {
      setIsLoading((prev) => ({ ...prev, requirements: false }));
    }
  };

  const loadTestCases = async () => {
    if (selectedRequirements.length === 0) {
      setTestCases([]);
      return;
    }

    setIsLoading((prev) => ({ ...prev, testCases: true }));
    try {
      const allTestCaseIds = new Set<string>();
      
      // Get test cases from selected requirements
      for (const reqId of selectedRequirements) {
        const linkedTestCases = await getLinkedTestCases(reqId);
        linkedTestCases.forEach(id => allTestCaseIds.add(id));
      }

      const ids = Array.from(allTestCaseIds).filter(id => id && String(id).length > 0);
      
      let allTestCases = [] as any[];
      if (ids.length > 0) {
        allTestCases = await fetchTestCasesByIds(ids);
      }

      const transformedTestCases = allTestCases.map(tc => ({
        id: tc.id.toString(),
        title: (tc.title || tc.name || tc.testTitle || tc.test_name || tc.test_case_title || `TC-${tc.id}`).toString(),
        preconditions: tc.preconditions || '',
        testSteps: tc.testSteps || '',
        testData: tc.testData || '',
        expectedResults: tc.expectedResults || '',
        actualResults: tc.actualResults || '',
        status: tc.status || 'Not Run',
        executedBy: tc.executedBy || '',
        executionDate: tc.executionDate || '',
        remarks: tc.remarks || '',
        testedBy: tc.testedBy || '',
        featureId: ''
      }));

      setTestCases(transformedTestCases);
      
      // Auto-select all test cases from requirements
      const newTestCaseIds = transformedTestCases.map(tc => tc.id);
      setSelectedTestCases(prev => {
        const combined = new Set([...prev, ...newTestCaseIds]);
        return Array.from(combined);
      });
    } catch (error) {
      console.error("Failed to load test cases:", error);
    } finally {
      setIsLoading((prev) => ({ ...prev, testCases: false }));
    }
  };

  useEffect(() => {
    if (projectId) {
      loadRequirementsFromRTM(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    loadTestCases();
  }, [selectedRequirements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !projectId) return;

    setIsSubmitting(true);
    try {
      // Prepare the test case objects for the store
      const testCaseObjects = testCases
        .filter(tc => selectedTestCases.includes(tc.id))
        .map(tc => ({
          id: tc.id,
          title: tc.title,
          preconditions: tc.preconditions || '',
          testSteps: tc.testSteps || '',
          testData: tc.testData || '',
          expectedResults: tc.expectedResults || '',
          actualResults: tc.actualResults || '',
          status: tc.status || 'Not Run',
          executedBy: tc.executedBy || '',
          executionDate: tc.executionDate || '',
          remarks: tc.remarks || '',
          testedBy: tc.testedBy || ''
        }));

      const suiteData = {
        name: name.trim(),
        testSuiteName: name.trim(), // API expects this field
        description: description || '',
        projectId: projectId.trim(),
        testCases: testCaseObjects,
        featureIds: selectedRequirements, // Store selected requirement IDs
        status: status as any,
        owner: 'current-user',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        executedBy: '',
        executedDate: ''
      };

      if (suiteId) {
        await updateTestSuite(suiteId, suiteData);
      } else {
        const createdSuite = await addTestSuite(suiteData);
        
        // Verify the suite was created with a valid ID
        if (!createdSuite.id || createdSuite.id.startsWith('temp-')) {
          throw new Error('Test suite was not properly saved. Please try again.');
        }
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Provide user-friendly error messages
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      alert(`Failed to save test suite: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{suiteId ? 'Edit' : 'Create New'} Test Suite</DialogTitle>
          <DialogDescription>
            {suiteId ? 'Update the test suite details below.' : 'Fill in the details to create a new test suite.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter test suite name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Project *</Label>
            <Select
              value={projectId}
              onValueChange={setProjectId}
              disabled={isLoading.projects || isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {isLoading.projects ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status *</Label>
            <Select
              value={status}
              onValueChange={setStatus}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Requirements</Label>
            <Popover open={requirementOpen} onOpenChange={setRequirementOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                  disabled={!projectId || isLoading.requirements || isSubmitting}
                >
                  {selectedRequirements.length > 0
                    ? `${selectedRequirements.length} requirement(s) selected`
                    : "Select requirements..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search requirements..." />
                  <CommandEmpty>No requirements found.</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-y-auto">
                    {rtmEntries.map((entry) => (
                      <CommandItem
                        key={entry.id}
                        value={entry.id}
                        onSelect={() => {
                          setSelectedRequirements((current) =>
                            current.includes(entry.id!)
                              ? current.filter((id) => id !== entry.id)
                              : [...current, entry.id!]
                          );
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <Check
                            className={`h-4 w-4 ${
                              selectedRequirements.includes(entry.id!) ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <span className="text-sm">
                            {entry.mainFeature} - {entry.description}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Selecting requirements will automatically include their linked test cases
            </p>
          </div>

          <div className="space-y-2">
            <Label>Test Cases</Label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
              {isLoading.testCases ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : testCases.length > 0 ? (
                testCases.map((testCase) => (
                  <div key={testCase.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`testcase-${testCase.id}`}
                      checked={selectedTestCases.includes(testCase.id)}
                      onCheckedChange={(checked) => {
                        setSelectedTestCases((current) =>
                          checked
                            ? [...current, testCase.id]
                            : current.filter((id) => id !== testCase.id)
                        );
                      }}
                      disabled={isSubmitting}
                    />
                    <Label
                      htmlFor={`testcase-${testCase.id}`}
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {testCase.title}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {selectedRequirements.length === 0
                    ? "Select requirements to see test cases"
                    : "No test cases found for selected requirements"}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name || !projectId}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {suiteId ? 'Updating...' : 'Creating...'}
                </>
              ) : suiteId ? (
                'Update Test Suite'
              ) : (
                'Create Test Suite'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TestSuiteForm;