import React, { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
  FileSpreadsheet,
  Download,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List
} from "lucide-react";
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { useTestCaseStore, TestCase, TestStatus } from "@/store/testcase-store";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { TestCaseImportModal } from "@/components/test-case/TestCaseImportModal";
import { RTMLinkageView } from "@/components/test-case/RTMLinkageView";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const TestCases = () => {
  const {
    testCases,
    isLoading,
    loadTestCases,
    addTestCase,
    updateTestCase,
    removeTestCase,
    error,
  } = useTestCaseStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | Lowercase<TestStatus>
  >("all");
  const [viewMode, setViewMode] = useState<"detailed" | "compact">("detailed");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewCase, setViewCase] = useState<TestCase | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Load test cases on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadTestCases();
        toast({ title: "Success", description: "Test cases loaded successfully" });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load test cases";
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    };
    loadData();
  }, [loadTestCases]);

  // Filter test cases
  const filtered = useMemo(() => {
    if (!Array.isArray(testCases)) return [];
    const term = search.toLowerCase().trim();
    return testCases.filter((tc) => {
      const matchesSearch =
        !term ||
        (tc.title?.toLowerCase().includes(term)) ||
        (tc.preconditions?.toLowerCase().includes(term)) ||
        tc.id?.toString().includes(term);
      const matchesStatus =
        statusFilter === "all" || tc.status?.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [testCases, search, statusFilter]);

  // Form type
  type TestCaseForm = Omit<
    TestCase,
    "id" | "created_at" | "updated_at"
  > & { id?: string };

  const [form, setForm] = useState<TestCaseForm>({
    title: "",
    description: "",
    preconditions: "",
    testSteps: "",
    testData: "",
    expectedResults: "",
    actualResults: "",
    status: "Not Run",
    executedBy: "",
    executionDate: "",
    remarks: "",
    testedBy: "",
    featureId: "",
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      preconditions: "",
      testSteps: "",
      testData: "",
      expectedResults: "",
      actualResults: "",
      status: "Not Run",
      executedBy: "",
      executionDate: "",
      remarks: "",
      testedBy: "",
      featureId: "",
    });
    setFormError(null);
    setEditingId(null);
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetForm();
  };

  const saveForm = async () => {
    if (!form.title.trim()) {
      setFormError("Title is required");
      toast({ title: "Validation Error", description: "Title is required", variant: "destructive" });
      return;
    }
    if (!form.testSteps.trim()) {
      setFormError("Test steps are required");
      toast({ title: "Validation Error", description: "Test steps are required", variant: "destructive" });
      return;
    }
    if (!form.featureId.trim()) {
      setFormError("Feature Id is required");
      toast({ title: "Validation Error", description: "Feature Id is required", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload = {
        ...form,
        executionDate:
          form.executionDate && typeof form.executionDate !== "string"
            ? format(form.executionDate as Date, "yyyy-MM-dd")
            : form.executionDate,
      };

      if (editingId) {
        await updateTestCase(editingId, payload);
        toast({ title: "Success", description: "Test case updated" });
      } else {
        await addTestCase(payload);
        toast({ title: "Success", description: "Test case created" });
      }

      setOpen(false);
      resetForm();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save test case";
      setFormError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (tc: TestCase) => {
    // Defensive: ensure minimal fields exist
    const safeTc = {
      ...tc,
      title: tc.title ?? "",
      preconditions: tc.preconditions ?? "",
      testSteps: tc.testSteps ?? "",
      status: (tc.status as TestStatus) ?? "Not Run",
      featureId: tc.featureId ?? "",
    } as TestCase;

    setForm({
      id: safeTc.id,
      title: safeTc.title,
      description: safeTc.description ?? "",
      preconditions: safeTc.preconditions ?? "",
      testSteps: safeTc.testSteps ?? "",
      testData: safeTc.testData ?? "",
      expectedResults: safeTc.expectedResults ?? "",
      actualResults: safeTc.actualResults ?? "",
      status: safeTc.status,
      executedBy: safeTc.executedBy ?? "",
      executionDate: safeTc.executionDate ?? "",
      remarks: safeTc.remarks ?? "",
      testedBy: safeTc.testedBy ?? "",
      featureId: safeTc.featureId,
    });
    setEditingId(String(safeTc.id));
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this test case?")) return;
    try {
      await removeTestCase(id);
      toast({ title: "Success", description: "Test case deleted" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const openView = (tc: TestCase) => {
    setViewCase(tc);
    setViewOpen(true);
  };

  const handleExport = async () => {
    try {
      // Dynamically import XLSX only when needed
      const XLSX = await import('xlsx');
      
      // Prepare data for export
      const exportData = testCases.map(tc => ({
        'Title': tc.title || '',
        'Description': tc.description || '',
        'Preconditions': tc.preconditions || '',
        'Test Steps': tc.testSteps || '',
        'Test Data': tc.testData || '',
        'Expected Results': tc.expectedResults || '',
        'Actual Results': tc.actualResults || '',
        'Status': tc.status || '',
        'Executed By': tc.executedBy || '',
        'Execution Date': tc.executionDate || '',
        'Remarks': tc.remarks || '',
        'Tested By': tc.testedBy || '',
        'Feature ID': tc.featureId || '',
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = [
        { wch: 30 }, // Title
        { wch: 40 }, // Description
        { wch: 30 }, // Preconditions
        { wch: 40 }, // Test Steps
        { wch: 20 }, // Test Data
        { wch: 30 }, // Expected Results
        { wch: 30 }, // Actual Results
        { wch: 15 }, // Status
        { wch: 20 }, // Executed By
        { wch: 15 }, // Execution Date
        { wch: 30 }, // Remarks
        { wch: 20 }, // Tested By
        { wch: 15 }, // Feature ID
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Test Cases');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `test-cases-${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      toast({
        title: 'Success',
        description: `Exported ${testCases.length} test cases to ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export test cases',
        variant: 'destructive',
      });
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "Passed": return "default";
      case "Failed": return "destructive";
      case "Blocked": return "secondary";
      case "Skipped": return "outline";
      default: return "outline";
    }
  };

  const statusBadge = (status: TestStatus) => (
    <Badge variant={getBadgeVariant(status)}>{status}</Badge>
  );

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Test Cases</h1>
            <p className="text-muted-foreground">
              {isLoading
                ? "Loading test cases..."
                : `Showing ${filtered.length} test case${filtered.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleExport}
              disabled={testCases.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>

            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setIsImportModalOpen(true)}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
            
            <Dialog open={open} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Test Case
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Test Case" : "Create New Test Case"}</DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? "Update the test case details below."
                      : "Fill in the details below to create a new test case."}
                  </DialogDescription>
                </DialogHeader>

                {formError && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                    {formError}
                  </div>
                )}

                <div className="grid gap-4 py-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter test case title"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Test Steps */}
                  <div className="space-y-2">
                    <Label htmlFor="testSteps">Test Steps *</Label>
                    <Textarea
                      id="testSteps"
                      placeholder="Enter test steps"
                      className="min-h-[100px]"
                      value={form.testSteps}
                      onChange={(e) => setForm({ ...form, testSteps: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Status + Execution Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(v) => setForm({ ...form, status: v as TestStatus })}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Run">Not Run</SelectItem>
                          <SelectItem value="Passed">Passed</SelectItem>
                          <SelectItem value="Failed">Failed</SelectItem>
                          <SelectItem value="Blocked">Blocked</SelectItem>
                          <SelectItem value="Skipped">Skipped</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Execution Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            disabled={isSubmitting}
                          >
                            {form.executionDate
                              ? format(new Date(form.executionDate), "PPP")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={form.executionDate ? new Date(form.executionDate) : undefined}
                            onSelect={(d) =>
                              setForm({ ...form, executionDate: d ? format(d, "yyyy-MM-dd") : "" })
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Preconditions */}
                  <div className="space-y-2">
                    <Label htmlFor="preconditions">Preconditions</Label>
                    <Textarea
                      id="preconditions"
                      placeholder="Enter any preconditions"
                      value={form.preconditions}
                      onChange={(e) => setForm({ ...form, preconditions: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Expected Results */}
                  <div className="space-y-2">
                    <Label htmlFor="expectedResults">Expected Results</Label>
                    <Textarea
                      id="expectedResults"
                      placeholder="Enter expected results"
                      value={form.expectedResults}
                      onChange={(e) => setForm({ ...form, expectedResults: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Feature Id */}
                  <div className="space-y-2">
                    <Label htmlFor="featureId">Feature Id *</Label>
                    <Input
                      id="featureId"
                      placeholder="Enter feature id"
                      value={form.featureId}
                      onChange={(e) => setForm({ ...form, featureId: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveForm}
                    disabled={
                      isSubmitting ||
                      !form.title.trim() ||
                      !form.testSteps.trim() ||
                      !form.featureId.trim()
                    }
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? "Update" : "Create"} Test Case
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Global error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <Button
                variant="link"
                className="h-auto p-0 ml-2"
                onClick={() => useTestCaseStore.getState().clearError()}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading / Table */}
        {isLoading && !testCases.length ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading test cases...</span>
          </div>
        ) : (
          <div className="rounded-md border">
            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 p-4 border-b">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search test cases..."
                    className="pl-8 w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as any)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="not run">Not Run</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 border rounded-lg p-1 bg-muted/20">
                <Button
                  variant={viewMode === "detailed" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setViewMode("detailed")}
                  disabled={isLoading}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Detailed
                </Button>
                <Button
                  variant={viewMode === "compact" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setViewMode("compact")}
                  disabled={isLoading}
                >
                  <List className="h-4 w-4 mr-2" />
                  Compact
                </Button>
              </div>
            </div>

            {/* Empty state or list rendering */}
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {search || statusFilter !== "all"
                  ? "No test cases match your search criteria."
                  : "No test cases found. Create your first test case to get started."}
              </div>
            ) : viewMode === "detailed" ? (
              <div className="grid grid-cols-1 gap-6 p-6 bg-muted/10">
                {filtered.map((tc) => (
                  <div key={tc.id} className="relative bg-card text-card-foreground rounded-xl border shadow-sm transition-all hover:shadow-md hover:border-muted-foreground/30 flex flex-col overflow-hidden">
                    {/* Top Accent Line based on Status */}
                    <div className={`h-1.5 w-full ${
                      tc.status === 'Passed' ? 'bg-emerald-500' :
                      tc.status === 'Failed' ? 'bg-rose-500' :
                      tc.status === 'Blocked' ? 'bg-amber-500' :
                      tc.status === 'Skipped' ? 'bg-sky-500' : 'bg-slate-400'
                    }`} />
                    
                    {/* Header bar of the Card */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b bg-muted/5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border">#{tc.id}</span>
                          {statusBadge(tc.status)}
                        </div>
                        <h3 className="text-lg font-semibold tracking-tight mt-1">{tc.title}</h3>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => openView(tc)}
                            >
                              <Eye className="h-4 w-4 mr-1.5" />
                              View Modal
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Open modal view</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-primary hover:text-primary-foreground hover:bg-primary"
                              onClick={() => startEdit(tc)}
                            >
                              <Edit className="h-4 w-4 mr-1.5" />
                              Edit
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit testcase</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleDelete(tc.id)}
                              disabled={isSubmitting}
                            >
                              <Trash2 className="h-4 w-4 mr-1.5" />
                              Delete
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete testcase</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Card Content Grid */}
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                      {/* Left Column - Description & Preconditions */}
                      <div className="space-y-4">
                        {tc.description && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Description</span>
                            <div className="p-3 rounded-lg bg-muted/30 border border-muted/50 whitespace-pre-wrap leading-relaxed text-foreground/90">
                              {tc.description}
                            </div>
                          </div>
                        )}
                        {tc.preconditions && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Preconditions</span>
                            <div className="p-3 rounded-lg bg-muted/30 border border-muted/50 whitespace-pre-wrap leading-relaxed text-foreground/90">
                              {tc.preconditions}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Middle Column - Steps & Expected Results */}
                      <div className="space-y-4">
                        {tc.testSteps && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Test Steps</span>
                            <div className="p-3 rounded-lg bg-muted/30 border border-muted/50 whitespace-pre-wrap leading-relaxed text-foreground/90 font-mono text-[13px]">
                              {tc.testSteps}
                            </div>
                          </div>
                        )}
                        {tc.expectedResults && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Expected Results</span>
                            <div className="p-3 rounded-lg bg-muted/30 border border-muted/50 whitespace-pre-wrap leading-relaxed text-foreground/90">
                              {tc.expectedResults}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column - Results, Metadata, execution */}
                      <div className="space-y-4">
                        {tc.actualResults && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Actual Results</span>
                            <div className="p-3 rounded-lg bg-muted/30 border border-muted/50 whitespace-pre-wrap leading-relaxed text-foreground/90">
                              {tc.actualResults}
                            </div>
                          </div>
                        )}
                        {tc.testData && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Test Data</span>
                            <div className="p-3 rounded-lg bg-muted/30 border border-muted/50 whitespace-pre-wrap leading-relaxed text-foreground/90">
                              {tc.testData}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Feature ID</span>
                            <span className="font-mono text-xs font-bold block mt-1">{tc.featureId || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Last Updated</span>
                            <span className="text-xs block mt-1 text-muted-foreground">
                              {tc.updated_at ? format(new Date(tc.updated_at), "MMM d, yyyy") : "N/A"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Execution Info</span>
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between"><span className="text-muted-foreground">Executed By:</span> <span className="font-medium">{tc.testedBy || tc.executedBy || 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Date:</span> <span className="font-medium">{tc.executionDate || 'N/A'}</span></div>
                          </div>
                        </div>

                        {tc.remarks && (
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Remarks</span>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{tc.remarks}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RTM Linkage View inside the card */}
                    <div className="px-5 py-4 border-t bg-muted/10">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">RTM Linkage</span>
                      <RTMLinkageView testCaseId={tc.id} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tc) => (
                    <React.Fragment key={tc.id}>
                      <TableRow 
                        className="hover:bg-muted/50 cursor-pointer" 
                        onClick={() => toggleRow(tc.id)}
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(tc.id);
                            }}
                          >
                            {expandedRows[tc.id] ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium" onClick={(e) => e.stopPropagation()}>
                          <span className="text-muted-foreground">#{tc.id}</span>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="font-medium">{tc.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {tc.preconditions}
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>{statusBadge(tc.status)}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {tc.updated_at
                            ? format(new Date(tc.updated_at), "MMM d, yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openView(tc)}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => startEdit(tc)}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(tc.id)}
                                  disabled={isSubmitting}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRows[tc.id] && (
                        <TableRow className="bg-muted/10 hover:bg-muted/10">
                          <TableCell colSpan={6} className="p-4 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                              {tc.description && (
                                <div className="space-y-1">
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Description</span>
                                  <p className="text-foreground whitespace-pre-wrap">{tc.description}</p>
                                </div>
                              )}
                              {tc.preconditions && (
                                <div className="space-y-1">
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Preconditions</span>
                                  <p className="text-foreground whitespace-pre-wrap">{tc.preconditions}</p>
                                </div>
                              )}
                              {tc.testSteps && (
                                <div className="space-y-1">
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Test Steps</span>
                                  <p className="text-foreground whitespace-pre-wrap">{tc.testSteps}</p>
                                </div>
                              )}
                              {tc.expectedResults && (
                                <div className="space-y-1">
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Expected Results</span>
                                  <p className="text-foreground whitespace-pre-wrap">{tc.expectedResults}</p>
                                </div>
                              )}
                              {tc.actualResults && (
                                <div className="space-y-1">
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Actual Results</span>
                                  <p className="text-foreground whitespace-pre-wrap">{tc.actualResults}</p>
                                </div>
                              )}
                              {tc.testData && (
                                <div className="space-y-1">
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Test Data</span>
                                  <p className="text-foreground whitespace-pre-wrap">{tc.testData}</p>
                                </div>
                              )}
                              <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Feature ID</span>
                                <p className="text-foreground font-mono">{tc.featureId || 'N/A'}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Execution Information</span>
                                <div className="text-foreground space-y-0.5">
                                  <div><span className="text-muted-foreground">Tested By:</span> {tc.testedBy || tc.executedBy || 'N/A'}</div>
                                  <div><span className="text-muted-foreground">Execution Date:</span> {tc.executionDate || 'N/A'}</div>
                                </div>
                              </div>
                              {tc.remarks && (
                                <div className="space-y-1">
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Remarks</span>
                                  <p className="text-foreground whitespace-pre-wrap">{tc.remarks}</p>
                                </div>
                              )}
                            </div>
                            <div className="mt-4 pt-4 border-t">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2 font-mono">RTM Linkage</span>
                              <RTMLinkageView testCaseId={tc.id} />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Test Case Details</DialogTitle>
            <DialogDescription>Read-only view of the selected test case.</DialogDescription>
          </DialogHeader>
          {viewCase && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">ID</Label>
                <div className="font-medium">{viewCase.id}</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Title</Label>
                <div className="font-medium">{viewCase.title}</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <div>{statusBadge(viewCase.status)}</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Preconditions</Label>
                <div className="whitespace-pre-wrap text-sm">{viewCase.preconditions || '-'}</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Test Steps</Label>
                <div className="whitespace-pre-wrap text-sm">{viewCase.testSteps || '-'}</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Expected Results</Label>
                <div className="whitespace-pre-wrap text-sm">{viewCase.expectedResults || '-'}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Feature ID</Label>
                  <div className="text-sm">{viewCase.featureId || '-'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Last Updated</Label>
                  <div className="text-sm">{viewCase.updated_at ? format(new Date(viewCase.updated_at), 'PPP') : 'N/A'}</div>
                </div>
              </div>
              
              {/* RTM Linkage */}
              <RTMLinkageView testCaseId={viewCase.id} />
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setViewOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Modal */}
      <TestCaseImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={async () => {
          await loadTestCases();
          toast({ 
            title: "Success", 
            description: "Test cases imported and refreshed" 
          });
        }}
      />
    </div>
  );
};