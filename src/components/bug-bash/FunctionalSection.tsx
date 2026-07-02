import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Trash2,
  Eye,
  Pencil,
  X,
  Check,
  FileSpreadsheet,
  Upload,
  Loader2,
} from 'lucide-react';
import { FunctionalIssue } from '@/types/bug-bash';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { bugBashFunctionalService } from '@/services/bugBashFunctionalService';
import { toast } from '@/hooks/use-toast';
import { BugImportModal } from './BugImportModal';
import { FeatureImportModal } from './FeatureImportModal';

interface FunctionalSectionProps {
  bugBashId: string;
  issues: FunctionalIssue[];
  onAdd: (data: FormData) => Promise<void>;
  onUpdate: (id: string, data: FormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
  filterType?: 'bug' | 'feature' | 'improvement';
  onBugsCountChange?: (counts: { bugs: number; features: number; improvements: number }) => void;
}

export default function FunctionalSection({
  bugBashId,
  issues = [],
  onAdd,
  onUpdate,
  onDelete,
  isLoading = false,
  filterType,
  onBugsCountChange,
}: FunctionalSectionProps) {
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isLoadingBugs, setIsLoadingBugs] = useState(false);
  const [apiBugs, setApiBugs] = useState<any[]>([]);
  const [apiFeatures, setApiFeatures] = useState<any[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFeatureImportModalOpen, setIsFeatureImportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Fetch both bugs and features counts on mount for summary cards
  useEffect(() => {
    const fetchAllCounts = async () => {
      if (!bugBashId) {
        console.warn('⚠️ No bugBashId provided, skipping fetch');
        return;
      }
      
      console.log('📊 Fetching all counts for summary cards...');
      
      try {
        // Fetch bugs count
        const { bugs } = await bugBashFunctionalService.getBugsByBugBashId(bugBashId);
        setApiBugs(bugs || []);
        console.log('📊 Bugs count:', bugs?.length || 0);
      } catch (error) {
        console.error('❌ Failed to fetch bugs count:', error);
        setApiBugs([]);
      }
      
      try {
        // Fetch features count
        const { features } = await bugBashFunctionalService.getFeaturesByBugBashId(bugBashId);
        setApiFeatures(features || []);
        console.log('📊 Features count:', features?.length || 0);
      } catch (error) {
        console.error('❌ Failed to fetch features count:', error);
        setApiFeatures([]);
      }
    };
    
    fetchAllCounts();
  }, [bugBashId]);

  // Fetch bugs from API when viewing bugs tab
  useEffect(() => {
    const fetchBugs = async () => {
      if (!bugBashId || filterType !== 'bug') return;
      
      try {
        setIsLoadingBugs(true);
        console.log('📡 Fetching bugs from API for bug bash:', bugBashId);
        
        const { bugs, message } = await bugBashFunctionalService.getBugsByBugBashId(bugBashId);
        
        console.log('✅ Bugs fetched successfully:', {
          count: bugs?.length || 0,
          message,
          bugs
        });
        
        setApiBugs(bugs || []);
      } catch (error) {
        console.error('❌ Failed to fetch bugs:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load bugs from server',
          variant: 'destructive',
        });
        setApiBugs([]);
      } finally {
        setIsLoadingBugs(false);
      }
    };

    fetchBugs();
  }, [bugBashId, filterType]);

  // Fetch features from API when viewing features tab
  useEffect(() => {
    const fetchFeatures = async () => {
      if (!bugBashId || filterType !== 'improvement') return;
      
      try {
        setIsLoadingBugs(true);
        console.log('📡 Fetching features from API for bug bash:', bugBashId);
        
        const { features, message } = await bugBashFunctionalService.getFeaturesByBugBashId(bugBashId);
        
        console.log('✅ Features fetched successfully:', {
          count: features?.length || 0,
          message,
          features
        });
        
        setApiFeatures(features || []);
      } catch (error) {
        console.error('❌ Failed to fetch features:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load features from server',
          variant: 'destructive',
        });
        setApiFeatures([]);
      } finally {
        setIsLoadingBugs(false);
      }
    };

    fetchFeatures();
  }, [bugBashId, filterType]);

  // Form state — matches backend API fields exactly
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'API',
    status: 'Open',
    priority: 'High',
    severity: 'Major',
    browser: 'Chrome',
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: '',
    environment: '',
    attachments: [] as File[],
    remarks: '',
  });

  // Fixed: Partial<typeof form>
  const [editForm, setEditForm] = useState<Partial<typeof form>>({});

  // Merge local issues with API bugs and features
  const mergedIssues = React.useMemo(() => {
    console.log('🔀 Merging issues:', {
      localIssuesCount: Array.isArray(issues) ? issues.length : 0,
      apiBugsCount: apiBugs.length,
      apiFeaturesCount: apiFeatures.length,
      filterType,
      shouldUseApiBugs: filterType === 'bug' && apiBugs.length > 0,
      shouldUseApiFeatures: filterType === 'improvement' && apiFeatures.length > 0
    });
    
    const localIssues = Array.isArray(issues) ? issues : [];
    
    // If we're viewing features and have API features, use them
    if (filterType === 'improvement' && apiFeatures.length > 0) {
      console.log('✅ Using API features:', apiFeatures);
      
      // Convert API features to FunctionalIssue format
      const convertedFeatures = apiFeatures.map((feature: any) => ({
        id: String(feature.id),
        title: feature.title || 'Untitled Feature',
        description: feature.description || '',
        module: feature.type || 'Feature',
        environment: feature.impact || 'medium',
        status: 'open' as const,
        priority: feature.impact === 'high' ? 'high' as const : 'medium' as const,
        type: 'improvement' as const,
        createdAt: feature.created_at || new Date().toISOString(),
        updatedAt: feature.updated_at || new Date().toISOString(),
        reporterId: String(feature.created_by || 'unknown'),
        comments: [],
        attachments: [],
        stepsToReproduce: [],
        expectedBehavior: feature.business_value || '',
        actualBehavior: feature.observedormissing || '',
      }));
      
      return convertedFeatures;
    }
    
    // If we're viewing bugs and have API bugs, use them
    if (filterType === 'bug' && apiBugs.length > 0) {
      console.log('✅ Using API bugs:', apiBugs);
      
      // Convert API bugs to FunctionalIssue format
      const convertedApiBugs = apiBugs.map(bug => ({
        id: bug.id?.toString() || '',
        title: bug.title || '',
        description: bug.description || '',
        type: 'bug' as const,
        status: bug.status || 'open',
        priority: bug.priority || 'medium',
        module: bug.module || '',
        environment: bug.environment || '',
        reporterId: bug.reporter_id?.toString() || '',
        stepsToReproduce: bug.steps_to_reproduce || [],
        expectedBehavior: bug.expected_behavior || '',
        actualBehavior: bug.actual_behavior || '',
        comments: bug.comments || [],
        attachments: bug.attachments || [],
        createdAt: bug.created_at || new Date().toISOString(),
        updatedAt: bug.updated_at || new Date().toISOString(),
      }));
      
      console.log('🔄 Converted API bugs to FunctionalIssue format:', convertedApiBugs);
      return convertedApiBugs;
    }
    
    console.log('📋 Using local issues:', localIssues);
    return localIssues;
  }, [issues, apiBugs, apiFeatures, filterType]);

  const displayedIssues = filterType
    ? mergedIssues.filter((i) => i.type === filterType)
    : mergedIssues;

  console.log('👁️ Displayed issues:', {
    total: displayedIssues.length,
    filterType,
    issues: displayedIssues
  });

  // Notify parent of bug counts whenever they change
  // Use apiBugs and apiFeatures directly to get accurate counts regardless of current filter
  useEffect(() => {
    if (onBugsCountChange) {
      const counts = {
        bugs: apiBugs.length,
        features: 0, // Features are stored as 'improvement' type
        improvements: apiFeatures.length,
      };
      console.log('📊 Notifying parent of bug counts:', counts);
      onBugsCountChange(counts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBugs.length, apiFeatures.length]);

  const statusBadgeClass = (status: string) =>
    cn(
      'px-2 py-0.5 rounded-full text-xs border',
      status === 'Open' && 'bg-warning/15 text-warning border-warning/20',
      status === 'In Progress' && 'bg-primary/15 text-primary border-primary/20',
      status === 'Resolved' && 'bg-success/15 text-success border-success/20',
      status === 'Wont Fix' && 'bg-muted text-muted-foreground border-border',
    );

  const priorityBadgeVariant = (priority: string) =>
    priority === 'Critical'
      ? 'destructive'
      : priority === 'High'
        ? 'secondary'
        : 'outline';

  // ──────────────────────────────────────────────────────────────
  // 1. EXCEL IMPORT – 100% matches curl
  // ──────────────────────────────────────────────────────────────
  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setImportError('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      let importedCount = 0;

      for (const row of json as any[]) {
        const title = row.title?.toString().trim();
        if (!title) continue;

        const formData = new FormData();

        // EXACT FIELD NAMES FROM curl
        formData.append('bug_bash_id', row.bug_bash_id?.toString() || '7');
        formData.append('type', row.type?.toString() || 'API');
        formData.append('title', title);
        formData.append('description', row.description?.toString() || '');
        formData.append('status', row.status?.toString() || 'Open');
        formData.append('priority', row.priority?.toString() || 'Medium');
        formData.append('severity', row.severity?.toString() || 'Major');
        formData.append('browser', row.browser?.toString() || '');
        formData.append('stepsToReproduce', row.stepsToReproduce?.toString() || '');
        formData.append('expectedResult', row.expectedResult?.toString() || row.expectedBehavior?.toString() || '');
        formData.append('actualResult', row.actualResult?.toString() || row.actualBehavior?.toString() || '');
        formData.append('environment', row.environment?.toString() || 'development');
        formData.append('remarks', row.remarks?.toString() || '');

        if (row.attachments && Array.isArray(row.attachments)) {
          row.attachments.forEach((file: File) => formData.append('attachments', file));
        }

        try {
          await onAdd(formData);
          importedCount++;
        } catch (err) {
          console.warn('Import failed for row:', row, err);
        }
      }

      alert(importedCount > 0
        ? `Successfully imported ${importedCount} issue(s)!`
        : 'No valid issues found.'
      );
    } catch (err) {
      setImportError('Failed to read Excel file. Check format and try again.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ──────────────────────────────────────────────────────────────
  // 2. MANUAL ADD – uses FormData with EXACT curl fields
  // ──────────────────────────────────────────────────────────────
  const handleAddClick = () => {
    setIsAdding(true);
    setForm({
      title: '',
      description: '',
      type: 'API',
      status: 'Open',
      priority: 'Medium',
      severity: 'Major',
      browser: '',
      stepsToReproduce: '',
      expectedResult: '',
      actualResult: '',
      environment: '',
      attachments: [],
      remarks: '',
    });
  };

  const handleCancelAdd = () => setIsAdding(false);

  const handleAddIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      // Validate bugBashId
      if (!bugBashId) {
        toast({
          title: 'Error',
          description: 'Bug Bash ID is missing. Cannot add bug.',
          variant: 'destructive',
        });
        return;
      }

      console.log('📝 Adding bug to Bug Bash ID:', bugBashId);

      // If this is a bug type, use the API service
      if (filterType === 'bug') {
        const bugData = {
          title: form.title,
          description: form.description,
          type: 'bug' as const,
          status: form.status.toLowerCase().replace(' ', '-') as 'open' | 'in-progress' | 'resolved' | 'wont-fix',
          priority: form.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
          module: form.type,
          environment: form.environment || 'development',
          browser: form.browser,
          steps_to_reproduce: form.stepsToReproduce.split('\n').filter(s => s.trim()),
          expected_behavior: form.expectedResult,
          actual_behavior: form.actualResult,
          reporter_id: user?.id || 'anonymous',
          reporterId: user?.id || 'anonymous',
          comments: [],
        };

        console.log('📤 Sending bug data:', bugData);
        console.log('🆔 FunctionalSection: Bug Bash ID =', bugBashId, 'Type:', typeof bugBashId);

        const { bug, message } = await bugBashFunctionalService.addBugToBugBash(bugBashId, bugData);
        
        toast({
          title: 'Success',
          description: message || 'Bug added successfully',
        });

        // Refresh the bugs list
        const { bugs } = await bugBashFunctionalService.getBugsByBugBashId(bugBashId);
        setApiBugs(bugs || []);
        
        console.log('✅ Bug added successfully, refreshing parent state...');
        
        // Summary cards will update automatically through the onBugsCountChange callback
        console.log('📊 Summary cards will update automatically');
      } else if (filterType === 'improvement') {
        // For features, use the feature API
        const featureData = {
          title: form.title,
          description: form.description,
          type: 'feature' as const,
          status: form.status.toLowerCase().replace(' ', '-') as 'open' | 'in-progress' | 'resolved' | 'wont-fix',
          priority: form.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
          module: 'Feature',
          environment: 'development',
          steps_to_reproduce: [],
          business_value: form.remarks || 'To be determined',
          observed_or_missing: (form.environment || 'observed') as 'observed' | 'missing',
          impact: form.priority.toLowerCase() as 'low' | 'medium' | 'high',
          reporter_id: user?.id || 'anonymous',
          reporterId: user?.id || 'anonymous',
          comments: [],
        };

        console.log('📤 Sending feature data:', featureData);
        console.log('🆔 FunctionalSection: Bug Bash ID =', bugBashId, 'Type:', typeof bugBashId);

        const { feature, message } = await bugBashFunctionalService.addFeatureToBugBash(bugBashId, featureData);
        
        toast({
          title: 'Success',
          description: message || 'Feature added successfully',
        });

        // Refresh the features list
        const { features } = await bugBashFunctionalService.getFeaturesByBugBashId(bugBashId);
        setApiFeatures(features || []);
        
        console.log('✅ Feature added successfully, refreshing parent state...');
        
        // Summary cards will update automatically through the onBugsCountChange callback
        console.log('📊 Summary cards will update automatically');
      } else {
        // Fallback to the original onAdd method for other types
        const formData = new FormData();
        formData.append('bug_bash_id', bugBashId);
        formData.append('type', form.type);
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('status', form.status);
        formData.append('priority', form.priority);
        formData.append('severity', form.severity);
        formData.append('browser', form.browser);
        formData.append('stepsToReproduce', form.stepsToReproduce);
        formData.append('expectedResult', form.expectedResult);
        formData.append('actualResult', form.actualResult);
        formData.append('environment', form.environment);
        formData.append('reporterId', user?.id || 'anonymous');

        form.attachments.forEach((file) => {
          formData.append('attachments', file);
        });

        await onAdd(formData);
      }

      setIsAdding(false);
      setForm({
        title: '',
        description: '',
        type: 'API',
        status: 'Open',
        priority: 'High',
        severity: 'Major',
        browser: 'Chrome',
        stepsToReproduce: '',
        expectedResult: '',
        actualResult: '',
        environment: '',
        attachments: [],
        remarks: '',
      });
    } catch (error) {
      console.error('Add failed:', error);
      
      let errorMessage = 'Failed to add item';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more helpful error messages
        if (errorMessage.includes('does not exist')) {
          errorMessage = `Bug Bash ID ${bugBashId} does not exist in the database. Please refresh the page or select a different bug bash.`;
        } else if (errorMessage.includes('Unauthenticated')) {
          errorMessage = 'Your session has expired. Please log in again.';
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setForm((prev) => ({ ...prev, attachments: [...prev.attachments, ...files] }));
  };

  const removeAttachment = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  // ──────────────────────────────────────────────────────────────
  // 3. EDIT, VIEW, DELETE
  // ──────────────────────────────────────────────────────────────
  const startEditing = (issue: FunctionalIssue) => {
    setEditingId(issue.id);
    setViewingId(null);
    setEditForm({
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      stepsToReproduce: issue.stepsToReproduce?.join('\n') || '',
      expectedResult: issue.expectedBehavior || '',
      actualResult: issue.actualBehavior || '',
      environment: issue.environment,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      // Check if this is an API bug or feature (compare as strings)
      const isApiBug = apiBugs.some(bug => String(bug.id) === String(editingId));
      const isApiFeature = apiFeatures.some(feature => String(feature.id) === String(editingId));

      if (isApiBug && filterType === 'bug') {
        // Update bug via API
        const updateData: any = {};
        if (editForm.title) updateData.title = editForm.title;
        if (editForm.description) updateData.description = editForm.description;
        if (editForm.status) updateData.status = editForm.status;
        if (editForm.priority) updateData.priority = editForm.priority;
        if (editForm.environment) updateData.environment = editForm.environment;

        const { message } = await bugBashFunctionalService.updateBug(editingId, updateData);
        
        toast({
          title: 'Success',
          description: message || 'Bug updated successfully',
        });

        // Refresh bugs list
        const { bugs } = await bugBashFunctionalService.getBugsByBugBashId(bugBashId);
        setApiBugs(bugs || []);
      } else if (isApiFeature && filterType === 'improvement') {
        // Update feature via API
        const updateData: any = {};
        if (editForm.title) updateData.title = editForm.title;
        if (editForm.description) updateData.description = editForm.description;

        const { message } = await bugBashFunctionalService.updateFeature(editingId, updateData);
        
        toast({
          title: 'Success',
          description: message || 'Feature updated successfully',
        });

        // Refresh features list
        const { features } = await bugBashFunctionalService.getFeaturesByBugBashId(bugBashId);
        setApiFeatures(features || []);
      } else {
        // Use parent's onUpdate for local issues
        const formData = new FormData();
        if (editForm.title) formData.append('title', editForm.title);
        if (editForm.description) formData.append('description', editForm.description);
        if (editForm.status) formData.append('status', editForm.status);
        if (editForm.priority) formData.append('priority', editForm.priority);
        if (editForm.stepsToReproduce) formData.append('stepsToReproduce', editForm.stepsToReproduce);
        if (editForm.expectedResult) formData.append('expectedResult', editForm.expectedResult);
        if (editForm.actualResult) formData.append('actualResult', editForm.actualResult);
        if (editForm.environment) formData.append('environment', editForm.environment);

        await onUpdate(editingId, formData);
      }
      
      setEditingId(null);
    } catch (error) {
      console.error('Update failed:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update item',
        variant: 'destructive',
      });
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setViewingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this issue?')) return;
    try {
      // If this is a bug from the API, use the API service (compare as strings)
      const isApiBug = apiBugs.some(bug => String(bug.id) === String(id));
      
      if (isApiBug && filterType === 'bug') {
        const { message } = await bugBashFunctionalService.deleteBug(id);
        
        toast({
          title: 'Success',
          description: message || 'Bug deleted successfully',
        });

        // Refresh the bugs list
        const { bugs } = await bugBashFunctionalService.getBugsByBugBashId(bugBashId);
        setApiBugs(bugs || []);
      } else if (filterType === 'improvement') {
        // For features, use the feature API
        const { message } = await bugBashFunctionalService.deleteFeature(id);
        
        toast({
          title: 'Success',
          description: message || 'Feature deleted successfully',
        });

        // Refresh the features list
        const { features } = await bugBashFunctionalService.getFeaturesByBugBashId(bugBashId);
        setApiFeatures(features || []);
      } else {
        // Fallback to the original onDelete method
        await onDelete(id);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const viewDetails = (issue: FunctionalIssue) => {
    console.log('👁️ Viewing issue:', issue);
    setViewingId(issue.id);
    setEditingId(null);
  };

  // Find the current issue in displayedIssues (not issues prop)
  const currentIssue = React.useMemo(() => {
    if (!viewingId) return null;
    const found = displayedIssues.find((i) => i.id === viewingId);
    console.log('🔍 Looking for issue:', { viewingId, found: !!found, displayedIssuesCount: displayedIssues.length });
    return found || null;
  }, [viewingId, displayedIssues]);

  // ──────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────
  return (
    <Card className="mt-4">
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Functional Issues</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (filterType === 'improvement') {
                  setIsFeatureImportModalOpen(true);
                } else {
                  setIsImportModalOpen(true);
                }
              }}
              disabled={isLoading}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Import Excel
            </Button>
            <Button
              size="sm"
              onClick={handleAddClick}
              disabled={isAdding || isLoading}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add {filterType === 'improvement' ? 'Feature' : 'Issue'}
            </Button>
          </div>
        </div>
        {importError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {importError}
            <button onClick={() => setImportError(null)} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4">
        {/* LOADING STATE */}
        {isLoadingBugs && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading bugs...</span>
          </div>
        )}

        {/* ADD FORM */}
        {isAdding && (
          <form onSubmit={handleAddIssue} className="mb-6 p-4 border rounded-lg bg-muted/10">
            <h3 className="font-medium mb-4 flex items-center">
              <Plus className="h-5 w-5 mr-2 text-primary" />
              Add New {filterType === 'improvement' ? 'Feature' : 'Issue'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={filterType === 'improvement' ? 'e.g., Add dark mode support' : 'e.g., Login button not responding'}
                  required
                />
              </div>

              {filterType === 'improvement' ? (
                <>
                  {/* Feature-specific fields */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Impact *</label>
                    <select
                      value={form.priority.toLowerCase()}
                      onChange={(e) => setForm({ ...form, priority: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Description *</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full p-2 border rounded min-h-[80px]"
                      placeholder="Describe the feature in detail..."
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Business Value *</label>
                    <textarea
                      value={form.remarks}
                      onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                      className="w-full p-2 border rounded min-h-[80px]"
                      placeholder="Explain the business value and benefits of this feature..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Observed or Missing</label>
                    <select
                      value={form.environment || 'observed'}
                      onChange={(e) => setForm({ ...form, environment: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="observed">Observed</option>
                      <option value="missing">Missing</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* Bug-specific fields */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Browser</label>
                    <Input
                      value={form.browser}
                      onChange={(e) => setForm({ ...form, browser: e.target.value })}
                      placeholder="e.g., Chrome"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                      <option>Wont Fix</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Severity</label>
                    <select
                      value={form.severity}
                      onChange={(e) => setForm({ ...form, severity: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option>Minor</option>
                      <option>Major</option>
                      <option>Critical</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Environment</label>
                    <Input
                      value={form.environment}
                      onChange={(e) => setForm({ ...form, environment: e.target.value })}
                      placeholder="e.g., iOS 15.0, iPhone 12"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Description *</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full p-2 border rounded min-h-[80px]"
                      placeholder="Describe the issue in detail..."
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Steps to Reproduce</label>
                    <textarea
                      value={form.stepsToReproduce}
                      onChange={(e) => setForm({ ...form, stepsToReproduce: e.target.value })}
                      className="w-full p-2 border rounded min-h-[80px]"
                      placeholder="1. Open app\n2. Tap login..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Expected Result</label>
                    <Input
                      value={form.expectedResult}
                      onChange={(e) => setForm({ ...form, expectedResult: e.target.value })}
                      placeholder="Should login instantly"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Actual Result</label>
                    <Input
                      value={form.actualResult}
                      onChange={(e) => setForm({ ...form, actualResult: e.target.value })}
                      placeholder="Button unresponsive"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Attachments</label>
                <div className="flex items-center gap-2">
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    multiple
                    onChange={handleAttachmentChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => attachmentInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {form.attachments.length} file(s) selected
                  </span>
                </div>
                {form.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {form.attachments.map((file, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeAttachment(i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancelAdd}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Issue'}
              </Button>
            </div>
          </form>
        )}

        {/* TABLE */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Title</TableHead>
                {filterType === 'improvement' ? (
                  <>
                    <TableHead>Impact</TableHead>
                    <TableHead>Business Value</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                  </>
                )}
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedIssues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="font-medium">{issue.id.substring(0, 6)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{issue.title}</span>
                      {filterType !== 'improvement' && (
                        <Badge variant={priorityBadgeVariant(issue.priority)}>{issue.priority}</Badge>
                      )}
                    </div>
                    {issue.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {issue.description}
                      </div>
                    )}
                  </TableCell>
                  {filterType === 'improvement' ? (
                    <>
                      <TableCell>
                        <Badge variant={issue.environment === 'high' ? 'destructive' : 'outline'}>
                          {issue.environment || 'medium'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm line-clamp-2 max-w-[300px]">
                          {issue.expectedBehavior || 'N/A'}
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        <span className={statusBadgeClass(issue.status)}>{issue.status}</span>
                      </TableCell>
                      <TableCell>{issue.priority}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => viewDetails(issue)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => startEditing(issue)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(issue.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {displayedIssues.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No {filterType === 'improvement' ? 'features' : 'issues'} found. Click "Add {filterType === 'improvement' ? 'Feature' : 'Issue'}" to start.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* VIEW MODAL */}
        {viewingId && currentIssue ? (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={cancelEditing}>
            <div className="bg-card text-card-foreground border border-border shadow-2xl rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{currentIssue.title}</h3>
                <Button variant="ghost" size="icon" onClick={cancelEditing}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1">{currentIssue.description || 'No description'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="mt-1">{currentIssue.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                    <p className="mt-1">{currentIssue.priority}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Module</label>
                    <p className="mt-1">{currentIssue.module || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Environment</label>
                    <p className="mt-1">{currentIssue.environment || 'N/A'}</p>
                  </div>
                </div>
                
                {currentIssue.stepsToReproduce && currentIssue.stepsToReproduce.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Steps to Reproduce</label>
                    <ol className="mt-1 list-decimal list-inside space-y-1">
                      {currentIssue.stepsToReproduce.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                
                {currentIssue.expectedBehavior && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Expected Behavior</label>
                    <p className="mt-1">{currentIssue.expectedBehavior}</p>
                  </div>
                )}
                
                {currentIssue.actualBehavior && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Actual Behavior</label>
                    <p className="mt-1">{currentIssue.actualBehavior}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={cancelEditing}>Close</Button>
                <Button onClick={() => startEditing(currentIssue)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        ) : viewingId ? (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card text-card-foreground border border-border shadow-2xl rounded-lg p-6">
              <p>Loading issue details... (viewingId: {viewingId}, found: {currentIssue ? 'yes' : 'no'})</p>
              <Button onClick={cancelEditing}>Close</Button>
            </div>
          </div>
        ) : null}

        {/* EDIT MODAL */}
        {editingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={cancelEditing}>
            <div className="bg-card text-card-foreground border border-border shadow-2xl rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">Edit Issue</h3>
                <Button variant="ghost" size="icon" onClick={cancelEditing}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full p-2 border border-input bg-background text-foreground rounded min-h-[100px] focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={editForm.status || 'Open'}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full p-2 border border-input bg-background text-foreground rounded focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Wont Fix">Wont Fix</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <select
                      value={editForm.priority || 'Medium'}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                      className="w-full p-2 border border-input bg-background text-foreground rounded focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Steps to Reproduce</label>
                  <textarea
                    value={editForm.stepsToReproduce || ''}
                    onChange={(e) => setEditForm({ ...editForm, stepsToReproduce: e.target.value })}
                    className="w-full p-2 border border-input bg-background text-foreground rounded min-h-[80px] focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="One step per line"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Expected Result</label>
                  <Input
                    value={editForm.expectedResult || ''}
                    onChange={(e) => setEditForm({ ...editForm, expectedResult: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Actual Result</label>
                  <Input
                    value={editForm.actualResult || ''}
                    onChange={(e) => setEditForm({ ...editForm, actualResult: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Environment</label>
                  <Input
                    value={editForm.environment || ''}
                    onChange={(e) => setEditForm({ ...editForm, environment: e.target.value })}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={cancelEditing}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </CardContent>

      {/* Import Modal */}
      <BugImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        bugBashId={bugBashId}
        onImportComplete={async () => {
          // Refresh bugs after import
          try {
            const { bugs } = await bugBashFunctionalService.getBugsByBugBashId(bugBashId);
            setApiBugs(bugs || []);
            toast({
              title: 'Success',
              description: 'Bugs imported and list refreshed',
            });
          } catch (error) {
            console.error('Failed to refresh bugs after import:', error);
          }
        }}
      />

      {/* Feature Import Modal */}
      <FeatureImportModal
        isOpen={isFeatureImportModalOpen}
        onClose={() => setIsFeatureImportModalOpen(false)}
        bugBashId={bugBashId}
        onImportComplete={async () => {
          try {
            const { features } = await bugBashFunctionalService.getFeaturesByBugBashId(bugBashId);
            setApiFeatures(features || []);
            toast({
              title: 'Success',
              description: 'Features imported and list refreshed',
            });
          } catch (error) {
            console.error('Failed to refresh features after import:', error);
          }
        }}
      />
    </Card>
  );
}
