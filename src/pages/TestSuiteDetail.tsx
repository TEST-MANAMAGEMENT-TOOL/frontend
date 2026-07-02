import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTestSuiteStore } from "@/store/test-suite-store";
import type { TestCase } from "@/types/test-suite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Bug,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  ShieldAlert
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { BugReportForm } from "@/components/bug-report/BugReportForm";
import { toast } from "@/hooks/use-toast";
import { 
  executeTestCaseInSuite, 
  fetchDefectsInSuite 
} from "@/services/testSuiteService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const TestSuiteDetail = () => {
  const [searchParams] = useSearchParams();
  const suiteId = searchParams.get("suiteId");
  const navigate = useNavigate();
  
  const { 
    testSuites, 
    fetchTestSuites, 
    isLoading, 
    error
  } = useTestSuiteStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isBugFormOpen, setIsBugFormOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<string | null>(null);

  // Execution dialog state
  const [isExecuteOpen, setIsExecuteOpen] = useState(false);
  const [executingTestCase, setExecutingTestCase] = useState<string | null>(null);
  const [execStatus, setExecStatus] = useState<'passed' | 'failed' | 'blocked' | 'skipped' | 'not run'>('passed');
  const [execRemarks, setExecRemarks] = useState('');
  const [isExecSubmitting, setIsExecSubmitting] = useState(false);

  // Defects state
  const [defects, setDefects] = useState<any[]>([]);
  const [isLoadingDefects, setIsLoadingDefects] = useState(false);
  
  // Fetch test suites on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchTestSuites();
      } catch (error) {
        console.error('Failed to load test suites:', error);
      }
    };
    loadData();
  }, [fetchTestSuites]);

  // Fetch defects inside the suite
  const loadDefects = async () => {
    if (!suiteId) return;
    setIsLoadingDefects(true);
    try {
      const data = await fetchDefectsInSuite(suiteId);
      setDefects(data);
    } catch (err) {
      console.error('Failed to load defects:', err);
    } finally {
      setIsLoadingDefects(false);
    }
  };

  useEffect(() => {
    loadDefects();
  }, [suiteId]);

  // Find the current test suite
  const currentSuite = useMemo(() => {
    return testSuites.find((suite) => suite.id === suiteId);
  }, [testSuites, suiteId]);

  // Filter test cases
  const filteredTestCases = useMemo(() => {
    if (!currentSuite?.testCases) return [];
    
    const term = searchTerm.toLowerCase().trim();
    if (!term) return currentSuite.testCases;
    
    return currentSuite.testCases.filter((tc: TestCase) => 
      tc.title?.toLowerCase().includes(term) ||
      tc.preconditions?.toLowerCase().includes(term) ||
      tc.testSteps?.toLowerCase().includes(term)
    );
  }, [currentSuite, searchTerm]);

  const handleReportBug = (testCaseId: string) => {
    setSelectedTestCase(testCaseId);
    setIsBugFormOpen(true);
  };

  const handleBugReportSuccess = async () => {
    setIsBugFormOpen(false);
    setSelectedTestCase(null);
    toast({
      title: "Success",
      description: "Bug report created successfully",
    });
    // Refresh defects list
    await loadDefects();
  };

  const handleOpenExecute = (testCaseId: string, currentStatus?: string) => {
    setExecutingTestCase(testCaseId);
    const cleaned = String(currentStatus || '').toLowerCase();
    if (cleaned === 'passed' || cleaned === 'failed' || cleaned === 'blocked' || cleaned === 'skipped' || cleaned === 'not run') {
      setExecStatus(cleaned as any);
    } else if (cleaned === 'notstarted' || cleaned === 'not started') {
      setExecStatus('not run');
    } else {
      setExecStatus('passed');
    }
    setExecRemarks('');
    setIsExecuteOpen(true);
  };

  const handleExecuteSubmit = async () => {
    if (!suiteId || !executingTestCase) return;
    setIsExecSubmitting(true);
    try {
      await executeTestCaseInSuite(suiteId, executingTestCase, execStatus, execRemarks);
      toast({
        title: "Success",
        description: "Test case executed successfully",
      });
      setIsExecuteOpen(false);
      // Reload suite data to update UI status
      await fetchTestSuites();
    } catch (err) {
      console.error('Failed to execute test case:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to execute test case",
        variant: "destructive",
      });
    } finally {
      setIsExecSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const cleaned = String(status || '').toLowerCase();
    if (cleaned === 'passed' || cleaned === 'completed') {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 w-fit">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Passed
        </Badge>
      );
    }
    if (cleaned === 'failed') {
      return (
        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1 w-fit">
          <AlertCircle className="w-3.5 h-3.5" />
          Failed
        </Badge>
      );
    }
    if (cleaned === 'blocked') {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 w-fit">
          <AlertTriangle className="w-3.5 h-3.5" />
          Blocked
        </Badge>
      );
    }
    if (cleaned === 'skipped') {
      return (
        <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 flex items-center gap-1 w-fit">
          <Ban className="w-3.5 h-3.5" />
          Skipped
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 flex items-center gap-1 w-fit">
        <Clock className="w-3.5 h-3.5" />
        Not Run
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const cleaned = String(severity || '').toLowerCase();
    if (cleaned.includes('critical')) {
      return <Badge className="bg-rose-600 text-white font-semibold">Critical</Badge>;
    }
    if (cleaned.includes('high') || cleaned.includes('major')) {
      return <Badge className="bg-orange-500 text-white font-semibold">High</Badge>;
    }
    if (cleaned.includes('low') || cleaned.includes('minor')) {
      return <Badge className="bg-slate-200 text-slate-800 font-semibold" variant="secondary">Low</Badge>;
    }
    return <Badge className="bg-yellow-500 text-white font-semibold">Medium</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const cleaned = String(priority || '').toLowerCase();
    if (cleaned === 'high') {
      return <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">High</Badge>;
    }
    if (cleaned === 'low') {
      return <Badge variant="outline" className="border-slate-300 text-slate-600">Low</Badge>;
    }
    return <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">Medium</Badge>;
  };

  // Redirect if no suite ID
  if (!suiteId) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No test suite ID provided.
            <Button 
              variant="link" 
              onClick={() => navigate('/test-suites')}
              className="ml-2"
            >
              Go back to Test Suites
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading state
  if (isLoading && testSuites.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error if suite not found
  if (!currentSuite && !isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Test suite not found.
            <Button 
              variant="link" 
              onClick={() => navigate('/test-suites')}
              className="ml-2"
            >
              Go back to Test Suites
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show error message if any
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/test-suites')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{currentSuite?.name}</h1>
            <p className="text-sm text-muted-foreground">
              {currentSuite?.description || "No description provided."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredTestCases.length} Test Case{filteredTestCases.length !== 1 ? 's' : ''}
          </Badge>
          {currentSuite?.status && getStatusBadge(currentSuite.status)}
        </div>
      </div>

      {/* Test Cases Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test Cases</CardTitle>
              <CardDescription>Select and run execution logs for test suites.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search test cases..."
                className="pl-8"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTestCases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm 
                ? `No test cases found matching "${searchTerm}"`
                : "No test cases in this test suite."
              }
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Preconditions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Executed By</TableHead>
                  <TableHead>Execution Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTestCases.map((testCase: TestCase) => (
                  <TableRow key={testCase.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{testCase.title}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {testCase.preconditions || '—'}
                    </TableCell>
                    <TableCell>{getStatusBadge(testCase.status)}</TableCell>
                    <TableCell>{testCase.executedBy || '—'}</TableCell>
                    <TableCell>{testCase.executionDate || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenExecute(testCase.id, testCase.status)}
                          className="h-8"
                        >
                          <Play className="w-3.5 h-3.5 mr-1 text-emerald-500 fill-emerald-500/20" />
                          Execute
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReportBug(testCase.id)}
                          className="h-8"
                        >
                          <Bug className="w-4 h-4 mr-1 text-destructive" />
                          Report Bug
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Linked Defects Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <div>
              <CardTitle>Bugs & Defects Linked to Suite</CardTitle>
              <CardDescription>All bug reports recorded under this test suite on the backend.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingDefects ? (
            <div className="text-center py-6 text-muted-foreground flex justify-center items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading defects...
            </div>
          ) : defects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No defects registered for this test suite.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Defect ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defects.map((defect: any) => (
                  <TableRow key={defect.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">#{defect.id}</TableCell>
                    <TableCell className="font-medium">{defect.title}</TableCell>
                    <TableCell>{getSeverityBadge(defect.severity)}</TableCell>
                    <TableCell>{getPriorityBadge(defect.priority)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {defect.status || 'Open'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {defect.created_at || defect.createdAt || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* General Bug Report Button Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-destructive" />
            Need to Log a General Defect?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Found an issue while testing? Log a defect to sync it with this test suite instantly.
          </p>
          <Button onClick={() => setIsBugFormOpen(true)}>
            <Bug className="w-4 h-4 mr-2" />
            Log Defect for Suite
          </Button>
        </CardContent>
      </Card>

      {/* Execute Test Case Modal */}
      <Dialog open={isExecuteOpen} onOpenChange={setIsExecuteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Execute Test Case</DialogTitle>
            <DialogDescription>
              Submit test suite execution status and remarks.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="status">Execution Status *</Label>
              <Select
                value={execStatus}
                onValueChange={(val) => setExecStatus(val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select execution status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                  <SelectItem value="not run">Not Run</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks / Logs</Label>
              <Textarea
                id="remarks"
                value={execRemarks}
                onChange={(e) => setExecRemarks(e.target.value)}
                placeholder="Enter test execution results or details..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsExecuteOpen(false)}
              disabled={isExecSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecuteSubmit}
              disabled={isExecSubmitting}
            >
              {isExecSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Save Execution Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bug Report Form Dialog */}
      <BugReportForm
        open={isBugFormOpen}
        onOpenChange={setIsBugFormOpen}
        onSuccess={handleBugReportSuccess}
        testCaseId={selectedTestCase}
        testSuiteId={suiteId}
      />
    </div>
  );
};

export default TestSuiteDetail;
