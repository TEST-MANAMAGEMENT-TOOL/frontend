import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BugReport } from "@/types/bug-report";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { backend_url } from '@/config';
import { useBugReportStore } from "@/store/bug-report-store";
import { Loader2 } from "lucide-react";
import { formatDateToYMD, isYMDDateFormat } from '@/utils/dateUtils';
import type { FieldErrors } from "react-hook-form";

const defaultValues: Partial<BugReport> = {
  title: "",
  module: "",
  shortDescription: "",
  severity: "Medium",
  priority: "Medium",
  status: "Open",
  type: "Functional",
  reportedBy: "",
  dateReported: formatDateToYMD(new Date().toISOString()) || '',
  dateResolved: '',
  stepsToReproduce: "",
  expectedResults: "",
  actualResults: "",
  assignedTo: "",
  environment: "",
  browser: 'Unknown',
  os: 'Unknown',
  buildVersion: '1.0.0',
  attachments: [],
  comments: "",
  remarks: "",
  resolution: "Other",
  relatedIssues: [],
  timeSpent: "",
};

const getDefaultValues = (): Partial<BugReport> => defaultValues;

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  module: z.string().optional(),
  shortDescription: z.string().min(1, "Short description is required"),
  severity: z.enum(["Critical", "High", "Medium", "Low"]),
  priority: z.enum(["Critical", "High", "Medium", "Low"]),
  status: z.enum(["Open", "In Progress", "Resolved", "Closed", "Reopened"]),
  type: z.enum(["Functional", "UI", "Performance", "Security", "Other"]),
  reportedBy: z.string().min(1, "Reported by is required"),
  dateReported: z.string().min(1, "Date reported is required").refine(
    (val) => !val || isYMDDateFormat(val),
    { message: 'Date must be in YYYY-MM-DD format' }
  ),
  stepsToReproduce: z.string().min(1, "Steps to reproduce are required"),
  expectedResults: z.string().min(1, "Expected results are required"),
  actualResults: z.string().min(1, "Actual results are required"),
  assignedTo: z.string().min(1, "Assigned to is required"),
  environment: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  buildVersion: z.string().optional(),
  attachments: z.array(z.union([
    z.string(),
    z.object({
      url: z.string(),
      name: z.string().optional(),
    }),
  ])).default([]),
  comments: z.string().optional(),
  remarks: z.string().optional(),
  dateResolved: z.string().refine(
    (val) => !val || isYMDDateFormat(val),
    { message: 'Date must be in YYYY-MM-DD format' }
  ).optional(),
  resolution: z.enum(["Fixed", "Duplicate", "Won't Fix", 'Cannot Reproduce', 'Not a Bug', 'Other']).default('Other'),
  relatedIssues: z.array(z.string()).default([]),
  timeSpent: z.string().optional(),
});

type BugReportFormValues = Omit<BugReport, 'id' | 'module' | 'reportedBy' | 'dateReported' | 'environment' | 'status' | 'type' | 'browser' | 'os' | 'buildVersion' | 'attachments' | 'resolution' | 'relatedIssues' | 'timeSpent'> & {
  id?: string;
  module?: string;
  reportedBy?: string;
  dateReported?: string;
  environment?: string;
  status?: BugReport['status'];
  type?: BugReport['type'];
  browser?: string;
  os?: string;
  buildVersion?: string;
  attachments?: BugReport['attachments'];
  resolution?: BugReport['resolution'];
  relatedIssues?: BugReport['relatedIssues'];
  timeSpent?: string;
};

interface BugReportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bug?: BugReport;
  onSubmit?: (data: BugReportFormValues) => void | Promise<void>;
  onSuccess?: () => void;
  testCaseId?: string | null;
  testSuiteId?: string | null;
}

export const BugReportForm = ({
  open,
  onOpenChange,
  bug,
  onSubmit: onSubmitProp,
  onSuccess,
  testCaseId,
  testSuiteId,
}: BugReportFormProps) => {
  const isEditing = !!bug;
  const [currentTab, setCurrentTab] = useState("basic");
  const [submitWarning, setSubmitWarning] = useState<string | null>(null);
  const { toast } = useToast();
  const { addBugReport, updateBugReport, isLoading, error } = useBugReportStore();

  const form = useForm<BugReportFormValues>({
    resolver: zodResolver(formSchema),
    shouldFocusError: false,
    defaultValues: {
      ...getDefaultValues(),
      ...(bug ? {
        ...bug,
        dateReported: bug.dateReported ? formatDateToYMD(bug.dateReported) || '' : '',
        dateResolved: bug.dateResolved ? formatDateToYMD(bug.dateResolved) || '' : '',
      } : {})
    },
  });

  const fieldTabMap: Partial<Record<keyof BugReportFormValues, string>> = {
    title: "basic",
    severity: "basic",
    priority: "basic",
    reportedBy: "assignment",
    dateReported: "assignment",
    assignedTo: "assignment",
    shortDescription: "details",
    stepsToReproduce: "details",
    expectedResults: "details",
    actualResults: "details",
  };

  const fieldLabels: Partial<Record<keyof BugReportFormValues, string>> = {
    title: "Title",
    severity: "Severity",
    priority: "Priority",
    reportedBy: "Reported by",
    dateReported: "Date reported",
    assignedTo: "Assigned to",
    shortDescription: "Description",
    stepsToReproduce: "Steps to reproduce",
    expectedResults: "Expected results",
    actualResults: "Actual results",
  };

  const onSubmit = async (data: BugReportFormValues) => {
    setSubmitWarning(null);
    const formattedData = {
      ...data,
      module: data.module || '',
      reportedBy: data.reportedBy || '',
      dateReported: data.dateReported || new Date().toISOString(),
      environment: data.environment || '',
      status: data.status || 'Open',
      type: data.type || 'Functional',
      browser: data.browser || 'Unknown',
      os: data.os || 'Unknown',
      buildVersion: data.buildVersion || '1.0.0',
      attachments: data.attachments || [],
      resolution: data.resolution || 'Other',
      relatedIssues: testCaseId ? [testCaseId] : (data.relatedIssues || []),
      timeSpent: data.timeSpent || '0h',
    };
    
    if (onSubmitProp) {
      await onSubmitProp(formattedData);
    } else {
      try {
        if (isEditing && bug?.id) {
          await updateBugReport(bug.id, formattedData);
          toast({
            title: "Success",
            description: "Bug report updated successfully",
          });
        } else {
          await addBugReport(formattedData, testSuiteId);
          toast({
            title: "Success",
            description: "Bug report created successfully",
          });
        }
        onOpenChange(false);
        form.reset(getDefaultValues());
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error('Error submitting bug report:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to submit bug report",
          variant: "destructive",
        });
      }
    }
  };

  const onInvalidSubmit = (errors: FieldErrors<BugReportFormValues>) => {
    const errorFields = Object.keys(errors) as Array<keyof BugReportFormValues>;
    const firstTabWithError = errorFields
      .map((field) => fieldTabMap[field])
      .find(Boolean);

    if (firstTabWithError) {
      setCurrentTab(firstTabWithError);
    }

    const missingFields = errorFields
      .map((field) => fieldLabels[field])
      .filter(Boolean)
      .join(", ");

    const warning = missingFields
      ? `Please complete these required fields: ${missingFields}.`
      : "Please complete the required fields before submitting.";

    setSubmitWarning(warning);
    toast({
      title: "Required fields missing",
      description: warning,
      variant: "destructive",
    });
  };

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (bug) {
      form.reset({
        ...bug,
        dateReported: formatDateToYMD(bug.dateReported) || '',
        dateResolved: bug.dateResolved ? formatDateToYMD(bug.dateResolved) : ''
      });
      setCurrentTab("basic");
      setSubmitWarning(null);
    } else {
      form.reset(getDefaultValues());
      setCurrentTab("basic");
      setSubmitWarning(null);
    }
  }, [bug, form, open, testCaseId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Bug Report" : "Create New Bug Report"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the bug report details below."
              : "Fill in the form below to create a new bug report."
            }
          </DialogDescription>
        </DialogHeader>

        {backend_url !== '/api' && backend_url !== 'https://kiwamitestcloud.com/dashboardapis/api/' && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            <strong>Warning:</strong> Your current API base URL is configured as <code>{backend_url}</code>. For the defect APIs, the expected base URL is <code>https://kiwamitestcloud.com/dashboardapis/api/</code>.
            If you are using the live backend, please update your configuration.
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-4">
            {submitWarning && (
              <Alert variant="destructive">
                <AlertDescription>{submitWarning}</AlertDescription>
              </Alert>
            )}

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="assignment">Assignment & Dates</TabsTrigger>
                <TabsTrigger value="details">Bug Details</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Bug title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="module"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module</FormLabel>
                        <FormControl>
                          <Input placeholder="Module name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!testCaseId && (
                    <FormField
                      control={form.control}
                      name="relatedIssues"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Case ID *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 12"
                              value={field.value?.[0] || ''}
                              onChange={(e) => field.onChange(e.target.value ? [e.target.value] : [])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Critical">Critical</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Critical">Critical</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="assignment" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reportedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reported By *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 18" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateReported"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Reported *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={field.value || ''} 
                            onChange={(e) => field.onChange(e.target.value || '')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned To *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Jacky" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="shortDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the issue" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stepsToReproduce"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Steps to Reproduce *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="1. Open app on mobile device&#10;2. Navigate to login screen&#10;3. Enter valid credentials" 
                            rows={5}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expectedResults"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Results *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What should happen" 
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="actualResults"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Actual Results *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What actually happens" 
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="attachments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attachments</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(event) => {
                              const files = Array.from(event.target.files || []);
                              field.onChange(files.map((file) => file.name));
                            }}
                          />
                        </FormControl>
                        {Array.isArray(field.value) && field.value.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {field.value.map((attachment, index) => {
                              const name = typeof attachment === 'string' ? attachment : attachment?.name || attachment?.url;
                              return name ? (
                                <div key={`${name}-${index}`}>{name}</div>
                              ) : null;
                            })}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : isEditing ? (
                  "Update Bug Report"
                ) : (
                  "Create Bug Report"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
