import { useState, useEffect } from "react";
import { Search, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBugReportStore } from "@/store/bug-report-store";
import { BugReportForm } from "@/components/bug-report/BugReportForm";
import { BugReportDetails } from "@/components/bug-report/BugReportDetails";
import { BugReportExcelButtons } from "@/components/bug-report/BugReportExcelButtons";
import { BugReport } from "@/types/bug-report";
import { toast } from "@/components/ui/use-toast";
import { userService } from "@/services/userService";
import { User } from "@/types/user";

export const BugReports = () => {
  const { bugReports, deleteBugReport, fetchBugReports, isLoading, error, updateBugReport, addBugReport, addBugReportToStore } = useBugReportStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingBug, setEditingBug] = useState<BugReport | undefined>();
  const [viewingBug, setViewingBug] = useState<BugReport | undefined>();
  const [usersById, setUsersById] = useState<Record<string, User>>({});

  // Fetch bug reports when component mounts
  useEffect(() => {
    const loadBugReports = async () => {
      try {
        console.log('1. Starting to load bug reports...');
        console.log('2. Current bug reports in store:', bugReports);
        console.log('3. Calling fetchBugReports...');
        
        await fetchBugReports();
        
        console.log('4. Bug reports fetched successfully');
        console.log('5. Updated bug reports in store:', bugReports);
      } catch (err) {
        console.error('Error loading bug reports:', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined
        });
      }
    };

    loadBugReports();
  }, [fetchBugReports]);

  useEffect(() => {
    const addUserToMap = (acc: Record<string, User>, user: User) => {
      if (user.id) acc[String(user.id)] = user;
      if (user._id) acc[String(user._id)] = user;
      return acc;
    };

    const loadUsers = async () => {
      try {
        const users = await userService.getUsers();
        const userMap = users.reduce<Record<string, User>>(addUserToMap, {});
        const currentUser = localStorage.getItem('user');
        if (currentUser) {
          addUserToMap(userMap, JSON.parse(currentUser));
        }
        setUsersById(userMap);
      } catch (err) {
        console.warn('Unable to load users for reporter names:', err);
        const currentUser = localStorage.getItem('user');
        if (currentUser) {
          setUsersById(addUserToMap({}, JSON.parse(currentUser)));
        }
      }
    };

    loadUsers();
  }, []);

  // Log when bugReports changes
  useEffect(() => {
    console.log('Bug reports updated:', bugReports);
  }, [bugReports]);

  // Log when viewingBug changes
  useEffect(() => {
    console.log('viewingBug updated:', viewingBug);
  }, [viewingBug]);

  // Log when detailsOpen changes
  useEffect(() => {
    console.log('detailsOpen updated:', detailsOpen);
  }, [detailsOpen]);

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <Badge className="bg-destructive/15 text-destructive border border-destructive/20 hover:bg-destructive/25">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/15 text-orange-500 border border-orange-500/20 hover:bg-orange-500/25">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning/15 text-warning border border-warning/20 hover:bg-warning/25">Medium</Badge>;
      case 'low':
        return <Badge className="bg-success/15 text-success border border-success/20 hover:bg-success/25">Low</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border border-border hover:bg-muted/80">{severity}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return <Badge className="bg-destructive/15 text-destructive border border-destructive/20 hover:bg-destructive/25">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/15 text-orange-500 border border-orange-500/20 hover:bg-orange-500/25">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning/15 text-warning border border-warning/20 hover:bg-warning/25">Medium</Badge>;
      case 'low':
        return <Badge className="bg-success/15 text-success border border-success/20 hover:bg-success/25">Low</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border border-border hover:bg-muted/80">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'closed':
      case 'fixed':
        return <Badge className="bg-success/15 text-success border border-success/20 hover:bg-success/25">{status}</Badge>;
      case 'in progress':
      case 'assigned':
        return <Badge className="bg-warning/15 text-warning border border-warning/20 hover:bg-warning/25">{status}</Badge>;
      case 'reopened':
        return <Badge className="bg-orange-500/15 text-orange-500 border border-orange-500/20 hover:bg-orange-500/25">{status}</Badge>;
      default:
        return <Badge className="bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25">{status || 'Open'}</Badge>;
    }
  };

  const safeBugReports = Array.isArray(bugReports) ? bugReports : [];
  console.log('Rendering with bug reports:', safeBugReports);

  const getUserDisplayName = (user?: User) => {
    if (!user) return '';
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.username || user.email || '';
  };

  const getPersonDisplayName = (value?: string, fallback = 'N/A') => {
    if (!value) return fallback;
    return getUserDisplayName(usersById[String(value)]) || value;
  };

  const filteredBugs = safeBugReports.filter((bug: BugReport) => {
    if (!bug) return false;

    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = !searchLower || [
      bug.title,
      bug.id,
      bug.module,
      bug.reportedBy,
      getPersonDisplayName(bug.reportedBy),
      bug.assignedTo,
      getPersonDisplayName(bug.assignedTo),
    ].some((value) => value != null && String(value).toLowerCase().includes(searchLower));

    const matchesSeverity = severityFilter === "all" || 
      bug.severity?.toLowerCase() === severityFilter.toLowerCase();
      
    const matchesPriority = priorityFilter === "all" || 
      bug.priority?.toLowerCase() === priorityFilter.toLowerCase();
    
    return matchesSearch && matchesSeverity && matchesPriority;
  });

  console.log('Filtered bugs count:', filteredBugs.length, { searchTerm, severityFilter, priorityFilter });

  const handleCreateBug = () => {
    setEditingBug(undefined);
    setFormOpen(true);
  };

  const handleViewBug = (bug: BugReport) => {
    console.log('handleViewBug called with bug:', bug);
    setViewingBug({
      ...bug,
      reportedBy: getPersonDisplayName(bug.reportedBy),
      assignedTo: getPersonDisplayName(bug.assignedTo),
    });
    setDetailsOpen(true);
    console.log('After setting state - viewingBug:', bug, 'detailsOpen:', true);
  };

  const handleEditBug = (bug: BugReport) => {
    setEditingBug(bug);
    setFormOpen(true);
  };

  const handleDeleteBug = async (id: string) => {
    if (confirm("Are you sure you want to delete this bug report?")) {
      try {
        await deleteBugReport(id);
        toast({
          title: "Bug deleted",
          description: "The bug report has been deleted successfully.",
        });
      } catch (error) {
        toast({
          title: "Failed to delete bug",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFormSubmit = async (data: Partial<BugReport> & {
    title: string;
    shortDescription: string;
    severity: BugReport['severity'];
    priority: BugReport['priority'];
    stepsToReproduce: string;
    expectedResults: string;
    actualResults: string;
    id?: string;
    dateReported?: string;
    status?: BugReport['status'];
    type?: BugReport['type'];
    browser?: string;
    os?: string;
    buildVersion?: string;
    attachments?: BugReport['attachments'];
    resolution?: BugReport['resolution'];
    relatedIssues?: BugReport['relatedIssues'];
    timeSpent?: string;
  }) => {
    const bugData: BugReport = {
      id: data.id || `BUG-${Date.now()}`,
      title: data.title,
      module: data.module || '',
      shortDescription: data.shortDescription,
      severity: data.severity,
      priority: data.priority,
      status: data.status || 'Open',
      type: data.type || 'Functional',
      reportedBy: data.reportedBy || '',
      dateReported: data.dateReported || new Date().toISOString(),
      stepsToReproduce: data.stepsToReproduce,
      expectedResults: data.expectedResults,
      actualResults: data.actualResults,
      assignedTo: data.assignedTo || '',
      environment: data.environment || '',
      browser: data.browser || 'Unknown',
      os: data.os || 'Unknown',
      buildVersion: data.buildVersion || '1.0.0',
      attachments: data.attachments || [],
      comments: data.comments || '',
      remarks: data.remarks || '',
      resolution: data.resolution || 'Other',
      relatedIssues: data.relatedIssues || [],
      timeSpent: data.timeSpent || '0h',
      dateResolved: data.dateResolved
    };

    const refreshBugReports = async () => {
      try {
        await fetchBugReports();
      } catch (refreshError) {
        console.warn('Bug report saved, but refreshing the list failed:', refreshError);
      }
    };

    try {
      if (editingBug) {
        const updatedBug = await updateBugReport(editingBug.id, bugData);
        await refreshBugReports();
        const existsAfterRefresh = useBugReportStore
          .getState()
          .bugReports
          .some((bug) => bug.id === updatedBug.id);

        if (!existsAfterRefresh) {
          addBugReportToStore(updatedBug);
        }

        toast({
          title: "Bug updated",
          description: "The bug has been updated successfully.",
        });
      } else {
        const createdBug = await addBugReport(bugData);
        await refreshBugReports();
        const existsAfterRefresh = useBugReportStore
          .getState()
          .bugReports
          .some((bug) => bug.id === createdBug.id);

        if (!existsAfterRefresh) {
          addBugReportToStore(createdBug);
        }

        toast({
          title: "Bug reported",
          description: "The bug has been reported successfully.",
        });
      }
      
      setEditingBug(undefined);
      setFormOpen(false);
    } catch (error) {
      toast({
        title: editingBug ? "Failed to update bug" : "Failed to report bug",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading && safeBugReports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading bug reports...</p>
          <p className="text-sm text-muted-foreground">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading bug reports</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
              <p className="mt-2">Please try refreshing the page or contact support if the problem persists.</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bug Reports</h1>
          <p className="text-muted-foreground mt-1">Track and manage reported issues</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary" onClick={handleCreateBug}>
            <Plus className="w-4 h-4 mr-2" />
            Report Bug
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search bugs by title, ID, module, reporter, or assignee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bug Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bug Reports ({filteredBugs.length})</span>
            <BugReportExcelButtons data={filteredBugs} />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="data-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Bug ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-24">Severity</TableHead>
                <TableHead className="w-24">Priority</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32">Reporter</TableHead>
                <TableHead className="w-32">Assigned To</TableHead>
                <TableHead className="w-28">Reported</TableHead>
                <TableHead className="w-28">Resolved</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBugs.length === 0 ? (
                safeBugReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-sm text-muted-foreground">
                      No defects found. Try refreshing or check your filter settings.
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-sm text-muted-foreground">
                      No bug reports match the current filters.
                    </TableCell>
                  </TableRow>
                )
              ) : (
                filteredBugs.map((bug) => (
                  <TableRow key={bug.id}>
                    <TableCell className="font-medium">{bug.id}</TableCell>
                    <TableCell className="font-medium">{bug.title}</TableCell>
                    <TableCell>{getSeverityBadge(bug.severity || '')}</TableCell>
                    <TableCell>{getPriorityBadge(bug.priority || '')}</TableCell>
                    <TableCell>{getStatusBadge(bug.status)}</TableCell>
                    <TableCell>{getPersonDisplayName(bug.reportedBy)}</TableCell>
                    <TableCell>{getPersonDisplayName(bug.assignedTo, 'Unassigned')}</TableCell>
                    <TableCell>{bug.dateReported ? new Date(bug.dateReported).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{bug.dateResolved ? new Date(bug.dateResolved).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewBug(bug)}
                          title="View bug details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditBug(bug)}
                          title="Edit bug report"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => bug.id && handleDeleteBug(bug.id)}
                          title="Delete bug report"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <BugReportForm
        open={formOpen}
        onOpenChange={setFormOpen}
        bug={editingBug}
        onSubmit={handleFormSubmit}
      />

      {/* Bug Report Details Dialog */}
      {viewingBug && (
        <BugReportDetails
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          bug={viewingBug}
          onEdit={() => {
            if (viewingBug) {
              handleEditBug(viewingBug);
              setDetailsOpen(false);
            }
          }}
        />
      )}
    </div>
  );
};
