// TestSuites.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTestSuiteStore } from "@/store/test-suite-store";
import { TestSuite } from "@/store/test-suite-store";
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
  FileText,
  Calendar,
  ChevronUp,
  ChevronDown,
  Eye,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import TestSuiteForm from "@/components/test-suite/TestSuiteForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export const TestSuites = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSuiteId, setEditingSuiteId] = useState<string | undefined>(undefined);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const { 
    testSuites, 
    currentProjectId,
    setCurrentProject,
    fetchTestSuites, 
    isLoading, 
    error,
    clearError
  } = useTestSuiteStore();
  const navigate = useNavigate();

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const projectList = Array.isArray(data) ? data : (data.details || []);
          const formattedProjects = projectList.map((p: any) => ({
            id: String(p.id || p._id),
            name: p.name || p.projectName || `Project ${p.id}`
          }));
          setProjects(formattedProjects);
          
          // Set first project as current if none selected
          if (formattedProjects.length > 0 && !currentProjectId) {
            setCurrentProject(formattedProjects[0].id);
          }
        }
      } catch (error) {
        // Silently handle project loading errors
      }
    };
    
    loadProjects();
  }, [currentProjectId, setCurrentProject]);

  // Fetch suites when project changes
  useEffect(() => {
    const loadTestSuites = async () => {
      if (currentProjectId) {
        try {
          await fetchTestSuites(currentProjectId);
        } catch (error) {
          // Silently handle test suite loading errors
        }
      }
    };
    loadTestSuites();
  }, [currentProjectId, fetchTestSuites]);

  const handleProjectChange = (projectId: string) => {
    setCurrentProject(projectId);
  };

  const handleCreateNewSuite = () => {
    setEditingSuiteId(undefined);
    setIsFormOpen(true);
  };

  const handleEditSuite = (suiteId: string) => {
    setEditingSuiteId(suiteId);
    setIsFormOpen(true);
  };

  const handleFormSuccess = async () => {
    setIsFormOpen(false);
    setEditingSuiteId(undefined);
    try {
      await fetchTestSuites(currentProjectId || undefined);
    } catch {
      // handled by store error state
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchTestSuites(currentProjectId || undefined);
    } catch {
      // handled by store error state
    }
  };

  const handleErrorClose = () => {
    clearError();
  };

  // Show loading state
  if (isLoading && testSuites.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error message if any
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="outline" onClick={handleErrorClose} className="ml-4">
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Test Suites</h1>
          {currentProjectId && (
            <p className="text-sm text-muted-foreground mt-1">
              Project: {projects.find(p => p.id === currentProjectId)?.name || currentProjectId}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleCreateNewSuite} 
            disabled={isLoading || !currentProjectId}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Test Suite
          </Button>
        </div>
      </div>

      {/* Project Selector */}
      {projects.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Project:</label>
            <Select value={currentProjectId || ''} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <TestSuiteList 
        onEdit={handleEditSuite} 
        onCreate={handleCreateNewSuite}
      />

      <TestSuiteForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        suiteId={editingSuiteId}
        onSuccess={handleFormSuccess}
        onCancel={() => setIsFormOpen(false)}
      />
    </div>
  );
};

interface TestSuiteListProps {
  onEdit: (suiteId: string) => void;
  onCreate: () => void;
}

const TestSuiteList: React.FC<TestSuiteListProps> = ({ onEdit, onCreate }) => {
  const { testSuites, deleteTestSuite, fetchTestSuites } = useTestSuiteStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof TestSuite>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedSuites, setSelectedSuites] = useState<Set<string>>(new Set());
  const [deletingSuites, setDeletingSuites] = useState<Set<string>>(new Set());
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  // Filtered & sorted suites
  const filteredAndSortedSuites = useMemo(() => {
    const filtered = testSuites.filter(suite => {
      const name = suite.name || '';
      const description = suite.description || '';
      const owner = suite.owner || '';
      const search = searchTerm.toLowerCase();
      
      return (
        name.toLowerCase().includes(search) ||
        description.toLowerCase().includes(search) ||
        owner.toLowerCase().includes(search)
      );
    });

    return [...filtered].sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';

      if (aValue === bValue) return 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      return 0;
    });
  }, [testSuites, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof TestSuite) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectSuite = (suiteId: string) => {
    const newSelected = new Set(selectedSuites);
    if (newSelected.has(suiteId)) {
      newSelected.delete(suiteId);
    } else {
      newSelected.add(suiteId);
    }
    setSelectedSuites(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSuites.size === filteredAndSortedSuites.length && filteredAndSortedSuites.length > 0) {
      setSelectedSuites(new Set());
    } else {
      setSelectedSuites(new Set(filteredAndSortedSuites.map(s => s.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedSuites.size === 0) return;
    if (window.confirm(`Delete ${selectedSuites.size} test suite(s)? This cannot be undone.`)) {
      setIsDeletingSelected(true);
      try {
        await Promise.all(Array.from(selectedSuites).map(id => deleteTestSuite(id)));
        setSelectedSuites(new Set());
        await fetchTestSuites();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete some test suites';
        alert(`Error: ${errorMessage}`);
      } finally {
        setIsDeletingSelected(false);
      }
    }
  };

  const handleDeleteSingle = async (suiteId: string, suiteName: string) => {
    if (window.confirm(`Delete "${suiteName}"? This action cannot be undone.`)) {
      setDeletingSuites(prev => new Set(prev).add(suiteId));
      try {
        await deleteTestSuite(suiteId);
        setSelectedSuites(prev => {
          const next = new Set(prev);
          next.delete(suiteId);
          return next;
        });
        await fetchTestSuites();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete test suite';
        alert(`Error: ${errorMessage}`);
      } finally {
        setDeletingSuites(prev => {
          const next = new Set(prev);
          next.delete(suiteId);
          return next;
        });
      }
    }
  };

  const getSortIcon = (field: keyof TestSuite) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      'Active': { label: 'Active', className: 'bg-success/15 text-success border border-success/20 hover:bg-success/25' },
      'Inactive': { label: 'Inactive', className: 'bg-muted text-muted-foreground border border-border hover:bg-muted/80' },
      'Draft': { label: 'Draft', className: 'bg-warning/15 text-warning border border-warning/20 hover:bg-warning/25' },
      'Completed': { label: 'Completed', className: 'bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25' },
    };
    const config = map[status] || map['Inactive'];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  const totalCases = testSuites.reduce((sum, s) => sum + s.testCases.length, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suites</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testSuites.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {testSuites.filter(s => s.status === 'Active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {testSuites.filter(s => s.status === 'Draft').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, description, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {selectedSuites.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={isDeletingSelected}
              className="flex items-center gap-2"
            >
              {isDeletingSelected ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isDeletingSelected ? 'Deleting...' : `Delete Selected (${selectedSuites.size})`}
            </Button>
          )}
        </div>

        <Button onClick={onCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Test Suite
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedSuites.size === filteredAndSortedSuites.length && filteredAndSortedSuites.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300"
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Name
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('testCases')}
                >
                  <div className="flex items-center gap-1">
                    Cases
                    {getSortIcon('testCases')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('owner')}
                >
                  <div className="flex items-center gap-1">
                    Owner
                    {getSortIcon('owner')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Created
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSuites.length > 0 ? (
                filteredAndSortedSuites.map((suite) => (
                  <TableRow key={suite.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedSuites.has(suite.id)}
                        onChange={() => handleSelectSuite(suite.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{suite.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {suite.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{suite.testCases.length}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(suite.status)}</TableCell>
                    <TableCell>{suite.owner}</TableCell>
                    <TableCell>{formatDate(suite.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/test-suite-detail?suiteId=${suite.id}`)}
                          title="View Test Cases"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(suite.id)}
                          title="Edit Suite"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSingle(suite.id, suite.name)}
                          disabled={deletingSuites.has(suite.id)}
                          title="Delete Suite"
                        >
                          {deletingSuites.has(suite.id) ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchTerm 
                      ? `No test suites found matching "${searchTerm}"`
                      : "No test suites created yet. Click 'New Test Suite' to get started."
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestSuites;