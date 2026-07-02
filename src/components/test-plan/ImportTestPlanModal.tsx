import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { importTestPlan } from '@/services/testPlanService';
import { fetchProjects } from '@/services/projectService';
import type { Project } from '@/types/project';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface ImportTestPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (planData: any) => Promise<void>;
}

interface ParsedContent {
  title: string;
  content: string;
  sections: {
    introduction?: string;
    objectives?: string;
    scope?: string;
    strategy?: string;
    environment?: string;
    criteria?: string;
    deliverables?: string;
  };
}

export const ImportTestPlanModal: React.FC<ImportTestPlanModalProps> = ({
  open,
  onOpenChange,
  onImport,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
  const [status, setStatus] = useState<string>('Draft');

  // Load projects when modal opens
  useEffect(() => {
    const loadProjects = async () => {
      if (open) {
        try {
          const projectsData = await fetchProjects();
          setProjects(projectsData);
        } catch (error) {
          console.error('Failed to load projects:', error);
          toast({
            title: 'Error',
            description: 'Failed to load projects',
            variant: 'destructive',
          });
        }
      }
    };

    loadProjects();
  }, [open, toast]);

  const supportedFormats = [
    { ext: '.pdf', desc: 'PDF Documents', icon: FileText },
    { ext: '.docx', desc: 'Word Documents (2007+)', icon: FileText },
    { ext: '.doc', desc: 'Word Documents (Legacy)', icon: FileText },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - only PDF and Word documents
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a PDF or Word document.',
        variant: 'destructive',
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setPlanName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
  };

  const handleImport = async () => {
    if (!selectedFile || !planName.trim() || !selectedProjectId || !startDate || !endDate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields and select a file.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Format dates as DD-MM-YYYY as shown in the Postman request
      const formatToDashDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const formattedStartDate = formatToDashDate(startDate);
      const formattedEndDate = formatToDashDate(endDate);
      
      console.log('Importing test plan with:', {
        name: planName.trim(),
        description: planDescription.trim(),
        projectId: selectedProjectId,
        fileName: selectedFile.name,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        status
      });

      // Use the new import API
      const importedPlan = await importTestPlan(
        planName.trim(),
        planDescription.trim(),
        selectedProjectId,
        selectedFile,
        formattedStartDate,
        formattedEndDate,
        status
      );

      // Call the onImport callback with the imported plan
      await onImport(importedPlan);
      
      toast({
        title: 'Success',
        description: 'Test plan imported successfully',
      });
      
      handleClose();
    } catch (error) {
      console.error('Error importing test plan:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import the test plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPlanName('');
    setPlanDescription('');
    setSelectedProjectId('');
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setStatus('Draft');
    onOpenChange(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Test Plan</DialogTitle>
          <DialogDescription>
            Upload a PDF or Word document and provide the required details to import as a test plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <Label>Select Document *</Label>
            
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supported formats: PDF, Word (.docx, .doc)
                </p>
                <p className="text-xs text-gray-400">Maximum file size: 10MB</p>
              </div>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc"
              onChange={handleFileSelect}
            />
          </div>

          {/* Plan Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="planName">Test Plan Name *</Label>
              <Input
                id="planName"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Enter test plan name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planDescription">Description</Label>
              <Textarea
                id="planDescription"
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                placeholder="Brief description of the test plan"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No projects found
                    </div>
                  ) : (
                    projects.map((project) => (
                      <SelectItem 
                        key={project.id?.toString() || 'unknown'}
                        value={project.id?.toString() || ''}
                      >
                        {project.projectName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  className="w-full p-2 border rounded-md"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select start date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  className="w-full p-2 border rounded-md"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select end date"
                  minDate={startDate || undefined}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Import Notice */}
          <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Import Notice</p>
              <p className="text-blue-700">
                The file will be uploaded and a test plan will be created with the provided details. 
                You can then edit the test plan to add content from your document.
              </p>
            </div>
          </div>

          {/* Supported Formats */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Supported Formats</Label>
            <div className="grid grid-cols-1 gap-2">
              {supportedFormats.map((format) => {
                const Icon = format.icon;
                return (
                  <div
                    key={format.ext}
                    className="flex items-center space-x-2 text-sm text-gray-600"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{format.ext} - {format.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || !planName.trim() || !selectedProjectId || !startDate || !endDate || isProcessing}
          >
            {isProcessing ? 'Importing...' : 'Import Test Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};