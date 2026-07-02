import React, { useState, useMemo, useRef } from "react";
import { useTestPlanStore } from "@/store/test-plan-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  FileText, 
  Calendar, 
  User,
  ChevronUp,
  ChevronDown,
  Filter,
  Upload,
  Eye // New: Preview icon
} from "lucide-react";
import { generateTestPlanPDF, previewTestPlanPDF } from "@/utils/pdf-export"; // Import both
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { PdfTestPlanData, CreateTestPlanData } from "@/types/test-plan";

interface TestPlanListProps {
  testPlans: PdfTestPlanData[];
  onEdit: (planId: string) => void;
  onCreate: () => Promise<void>;
  onDelete: (planId: string) => Promise<void>;
}

export function TestPlanList({ testPlans, onEdit, onCreate, onDelete }: TestPlanListProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof PdfTestPlanData>("projectName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAndSortedPlans = useMemo(() => {
    const plans = Array.isArray(testPlans) ? testPlans : [];
    
    const filtered = plans.filter(plan => {
      const search = searchTerm.toLowerCase();
      return (
        (plan.projectName?.toLowerCase() || '').includes(search) ||
        (plan.preparedBy?.toLowerCase() || '').includes(search) ||
        (plan.version?.toLowerCase() || '').includes(search)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });

    return sorted;
  }, [testPlans, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof PdfTestPlanData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectPlan = (planId: string) => {
    const newSelected = new Set(selectedPlans);
    if (newSelected.has(planId)) {
      newSelected.delete(planId);
    } else {
      newSelected.add(planId);
    }
    setSelectedPlans(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPlans.size === filteredAndSortedPlans.length) {
      setSelectedPlans(new Set());
    } else {
      setSelectedPlans(new Set(filteredAndSortedPlans.map(p => p.id || p.projectName)));
    }
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedPlans.size} test plan(s)?`)) {
      selectedPlans.forEach(id => {
        onDelete(id);
      });
      setSelectedPlans(new Set());
    }
  };

  // === EXPORT (DOWNLOAD) SELECTED PLANS ===
  const handleExportSelected = async () => {
    if (selectedPlans.size === 0) {
      toast({
        title: "No plans selected",
        description: "Please select at least one test plan to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);
      const plansToExport = testPlans.filter(plan => selectedPlans.has(plan.id || plan.projectName));
      
      for (const plan of plansToExport) {
        await generateTestPlanPDF(plan);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "Success",
        description: `Exported ${plansToExport.length} test plan(s) successfully!`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error exporting test plans:", error);
      toast({
        title: "Error",
        description: "Failed to export one or more test plans.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // === PREVIEW SINGLE PLAN ===
  const handlePreviewPlan = async (plan: PdfTestPlanData) => {
    try {
      setIsPreviewing(true);
      await previewTestPlanPDF(plan);
      toast({
        title: "Preview opened",
        description: `Test plan "${plan.projectName || 'Untitled'}" opened in a new tab.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error previewing test plan:", error);
      toast({
        title: "Error",
        description: "Failed to preview test plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  // === EXPORT (DOWNLOAD) SINGLE PLAN ===
  const handleExportPlan = async (plan: PdfTestPlanData) => {
    try {
      setIsExporting(true);
      await generateTestPlanPDF(plan);
      toast({
        title: "Success",
        description: `Test plan exported successfully!`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error exporting test plan:", error);
      toast({
        title: "Error",
        description: "Failed to export test plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPdf(file);
        const newPlan: CreateTestPlanData = {
          projectName: file.name.replace(/\.pdf$/i, ''),
          version: '1.0',
          preparedBy: 'Uploaded',
          dateCreated: new Date().toISOString(),
          reviewedBy: '',
          approvalDate: '',
          introduction: 'Automatically imported from PDF',
          objectives: '',
          inScope: '',
          outOfScope: '',
          testItems: '',
          testStrategy: '',
          testEnvironment: '',
          entryCriteria: '',
          exitCriteria: '',
          testDeliverables: '',
          roles: [],
          schedule: [],
          risks: [],
          members: []
        };
        
        await onCreate();
        toast({
          title: "Success",
          description: "Test plan uploaded successfully",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process the uploaded file",
        variant: "destructive",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      // Load PDF.js from CDN
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.async = true;
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      
      // Set worker path
      const pdfjs = (window as any).pdfjsLib;
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        text += strings.join(' ') + '\n';
      }
      
      return text.trim();
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCreateClick = () => {
    onCreate().catch(console.error);
  };

  const getSortIcon = (field: keyof PdfTestPlanData) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testPlans?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testPlans?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testPlans?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search test plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          {selectedPlans.size > 0 && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportSelected}
                disabled={selectedPlans.size === 0 || isExporting}
              >
                <Download className={`w-4 h-4 mr-2 ${isExporting ? 'animate-spin' : ''}`} />
                {isExporting ? 'Exporting...' : `Export (${selectedPlans.size})`}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedPlans.size})
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleUploadClick} className="gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf"
            className="hidden"
          />
          <Button onClick={handleCreateClick} className="gap-2">
            <Plus className="w-4 h-4" />
            New Test Plan
          </Button>
        </div>
      </div>

      {/* Test Plans Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedPlans.size === filteredAndSortedPlans.length && filteredAndSortedPlans.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4"
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('projectName')}
                >
                  <div className="flex items-center gap-2">
                    Project
                    {getSortIcon('projectName')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('version')}
                >
                  <div className="flex items-center gap-2">
                    Version
                    {getSortIcon('version')}
                  </div>
                </TableHead>
                <TableHead>Test Items</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('preparedBy')}
                >
                  <div className="flex items-center gap-2">
                    Prepared By
                    {getSortIcon('preparedBy')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('dateCreated')}
                >
                  <div className="flex items-center gap-2">
                    Created
                    {getSortIcon('dateCreated')}
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedPlans.map((plan) => {
                if (!plan) return null;
                
                const planId = plan.id || plan.projectName || `plan-${Math.random().toString(36).substr(2, 9)}`;
                const projectName = plan.name || plan.title || plan.projectName || 'Unnamed Project';
                const version = plan.version || '1.0';
                const preparedBy = plan.createdBy || plan.preparedBy || 'Unknown';
                const dateCreated = plan.createdAt || plan.dateCreated || new Date().toISOString();
                
                return (
                  <TableRow key={planId} className="hover:bg-muted/50">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedPlans.has(planId)}
                        onChange={() => handleSelectPlan(planId)}
                        className="w-4 h-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="font-semibold">{projectName}</div>
                      {plan.objectives && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {typeof plan.objectives === 'string' 
                            ? plan.objectives 
                            : JSON.stringify(plan.objectives)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{version}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {plan.testItems 
                        ? (typeof plan.testItems === 'string' 
                            ? plan.testItems 
                            : JSON.stringify(plan.testItems))
                        : 'No test items'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {plan.testEnvironment || 'Not specified'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {preparedBy}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(dateCreated), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.approvalDate ? 'default' : 'secondary'}>
                        {plan.approvalDate ? 'Approved' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* Preview Button */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handlePreviewPlan(plan)}
                          disabled={isPreviewing}
                          title="Preview PDF"
                        >
                          <Eye className={`w-4 h-4 ${isPreviewing ? 'animate-pulse' : ''}`} />
                        </Button>

                        {/* Export (Download) Button */}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleExportPlan(plan)}
                          disabled={isExporting}
                          title="Download PDF"
                        >
                          <Download className={`w-4 h-4 ${isExporting ? 'animate-spin' : ''}`} />
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onEdit(plan.id)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onDelete(plan.id)}
                          title="Delete"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {filteredAndSortedPlans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No test plans found matching your search.' : 'No test plans created yet.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}