import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Outlet, Navigate } from 'react-router-dom';
import BugBashDashboard from "@/components/bug-bash/BugBashDashboard";
import { BugBashForm } from "@/components/bug-bash/BugBashForm";
import { BugBashDetailedView } from "@/components/bug-bash/BugBashDetailedView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Eye, Pencil, Trash2, Loader2 } from 'lucide-react';
import type { BugBash } from '@/types/bug-bash';
import { fetchBugBashes, fetchBugBashById, createBugBash, updateBugBash, deleteBugBash } from '@/services/bugBashService';
import { toast } from '@/hooks/use-toast';

// Context to share bug bashes state
export const BugBashContext = React.createContext<{
  bugBashes: BugBash[];
  refreshBugBashes: (force?: boolean) => Promise<BugBash[]>;
}>({
  bugBashes: [],
  refreshBugBashes: async () => []
});

// Root layout for all /bug-bash/* routes
export default function BugBashPage() {
  const [bugBashes, setBugBashes] = useState<BugBash[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const lastFetchRef = React.useRef<number>(0);

  const refreshBugBashes = useCallback(async (force = false) => {
    // Prevent multiple rapid calls (debounce with 1 second) unless forced
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 1000) {
      console.log('Skipping refresh - too soon after last fetch');
      return bugBashes;
    }
    lastFetchRef.current = now;

    try {
      setIsLoading(true);
      const data = await fetchBugBashes();
      console.log('Fetched bug bashes:', data);
      setBugBashes(data);
      return data;
    } catch (error: any) {
      console.error('Error refreshing bug bashes:', error);
      
      // Handle rate limiting gracefully
      if (error?.response?.status === 429) {
        toast({
          title: "Rate Limit Exceeded",
          description: "Too many requests. Please wait a moment and try again.",
          variant: "destructive"
        });
        // Return existing data instead of throwing
        return bugBashes;
      }
      
      toast({
        title: "Error",
        description: "Failed to refresh bug bash list",
        variant: "destructive"
      });
      
      // Return existing data instead of throwing to prevent crashes
      return bugBashes;
    } finally {
      setIsLoading(false);
    }
  }, [bugBashes]);

  // Initial data load
  useEffect(() => {
    refreshBugBashes();
  }, [refreshBugBashes]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    bugBashes,
    refreshBugBashes
  }), [bugBashes, refreshBugBashes]);

  return (
    <BugBashContext.Provider value={contextValue}>
      <Outlet />
    </BugBashContext.Provider>
  );
}

// List View
export function BugBashList() {
  const navigate = useNavigate();
  const { bugBashes: contextBugBashes, refreshBugBashes } = useContext(BugBashContext);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localBugBashes, setLocalBugBashes] = useState<BugBash[]>(contextBugBashes || []);

  // Initial data load - runs every time component mounts
  useEffect(() => {
    console.log('BugBashList: Component mounted, loading data...');
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await refreshBugBashes();
        console.log('Data from refreshBugBashes:', data);
        setLocalBugBashes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching bug bashes:', error);
        toast({
          title: "Error",
          description: "Failed to load bug bash sessions",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    
    // Force refresh on mount to ensure we have latest data
    return () => {
      console.log('BugBashList: Component unmounting');
    };
  }, []); // Empty deps array means this runs on every mount

  // Update local state when context changes
  useEffect(() => {
    console.log('📊 Context bug bashes changed:', contextBugBashes?.length || 0);
    if (contextBugBashes) {
      console.log('📝 Updating localBugBashes with:', contextBugBashes);
      setLocalBugBashes([...contextBugBashes]);
    }
  }, [contextBugBashes]);

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/bug-bash/${id}/edit`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this bug bash session? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(id);
    try {
      await deleteBugBash(id);
      await refreshBugBashes(true);
      toast({
        title: "Success",
        description: "Bug bash session deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting bug bash:', error);
      toast({
        title: "Error",
        description: "Failed to delete bug bash session",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalBugs = (bugBash: BugBash) => {
    return (bugBash.functional?.length || 0) + 
           (bugBash.performance?.length || 0) + 
           (bugBash.security?.length || 0);
  };

  const handleCardClick = (bugBashId: string, e?: React.MouseEvent) => {
    if (e && (e.target as HTMLElement).closest('button, a, [role="button"]')) {
      return;
    }
    navigate(`/bug-bash/${bugBashId}`);
  };

  console.log('🎨 Render state:', { 
    isLoading, 
    localBugBashesCount: localBugBashes.length,
    contextBugBashesCount: contextBugBashes?.length || 0 
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  console.log('🖼️ About to render. Condition check:', {
    hasItems: localBugBashes.length > 0,
    count: localBugBashes.length,
    ids: localBugBashes.map(bb => bb.id),
    titles: localBugBashes.map(bb => bb.title || bb.name)
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bug Bash Sessions</h1>
        <Button onClick={() => navigate('/bug-bash/new')}>
          <Plus className="mr-2 h-4 w-4" /> New Bug Bash
        </Button>
      </div>

      {localBugBashes.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Participants
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Bugs
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {localBugBashes.map((bugBash) => (
                <tr 
                  key={bugBash.id} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={(e) => handleCardClick(bugBash.id, e)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{bugBash.title}</div>
                    <div className="text-sm text-muted-foreground">{bugBash.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{bugBash.participants?.length || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{formatDate(bugBash.startDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border bg-primary/15 text-primary border-primary/20">
                      {getTotalBugs(bugBash)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="p-2 h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); navigate(`/bug-bash/${bugBash.id}`); }}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="p-2 h-8 w-8"
                        onClick={(e) => handleEdit(e, bugBash.id)}
                        disabled={isDeleting === bugBash.id}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="p-2 h-8 w-8"
                        onClick={(e) => handleDelete(e, bugBash.id)}
                        disabled={isDeleting === bugBash.id}
                        title="Delete"
                      >
                        {isDeleting === bugBash.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-gray-100 p-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium">No bug bashes found</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Get started by creating a new bug bash session to track and manage issues.
            </p>
            <Button onClick={() => navigate('/bug-bash/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Bug Bash
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Form
export function CreateBugBash() {
  const navigate = useNavigate();
  const { refreshBugBashes } = useContext(BugBashContext);

  const handleCreateBugBash = async (data: Omit<BugBash, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Form data before processing:', data);
      
      // Keep only the fields the API expects
      const formattedData = {
        name: data.name || data.title || `bugbash-${Date.now()}`,
        scope: data.scope || 'general',
        // Add required fields with defaults for internal use
        title: data.name || data.title || `bugbash-${Date.now()}`,
        description: data.description || '',
        startDate: data.startDate || new Date().toISOString(),
        endDate: data.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: data.status || 'planned',
        participants: [],
        createdBy: 'system',
        functional: [],
        performance: [],
        security: [],
      };

      console.log('Sending data to API:', JSON.stringify(formattedData, null, 2));
      
      const result = await createBugBash(formattedData);
      console.log('✅ Bug bash created successfully:', result);
      console.log('Created bug bash ID:', result?.id);
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Bug bash created successfully',
      });
      
      // Wait for backend to save (backend might have delay/caching)
      console.log('⏳ Waiting 1 second for backend to save...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh the bug bash list BEFORE navigating
      try {
        console.log('🔄 Refreshing bug bash list...');
        const refreshedData = await refreshBugBashes(true);
        console.log('✅ Bug bash list refreshed successfully. Count:', refreshedData?.length || 0);
        console.log('Refreshed bug bashes:', refreshedData);
      } catch (error) {
        console.error('❌ Error refreshing bug bash list:', error);
      }
      
      // Navigate back to the bug bash list
      console.log('📍 Navigating to /bug-bash/list');
      navigate('/bug-bash/list', { replace: false });
    } catch (error: any) {
      console.error('Error creating bug bash:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create bug bash';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/bug-bash')}
        className="mb-4"
      >
        Back to Bug Bashes
      </Button>
      <div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-6">Create New Bug Bash</h2>
        <BugBashForm 
          onSubmit={handleCreateBugBash} 
          initialData={{
            title: '',
            description: '',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'planned',
            participants: [],
            createdBy: 'unknown',
            functional: [],
            performance: [],
            security: []
          }} 
          onCancel={() => navigate('/bug-bash')} 
        />
      </div>
    </div>
  );
}

// Edit Form
export function EditBugBash() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshBugBashes } = useContext(BugBashContext);
  const [bugBash, setBugBash] = useState<BugBash | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBugBash = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const data = await fetchBugBashById(id);
        setBugBash(data);
      } catch (error) {
        console.error('Error fetching bug bash:', error);
        toast({
          title: "Error",
          description: "Failed to load bug bash details",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBugBash();
  }, [id]);

  const handleUpdateBugBash = async (data: Omit<BugBash, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!id) return;
    
    try {
      await updateBugBash(id, data);
      toast({
        title: 'Success',
        description: 'Bug bash updated successfully',
      });
      await refreshBugBashes(true);
      navigate('/bug-bash');
    } catch (error) {
      console.error('Error updating bug bash:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bug bash',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!bugBash) return <div className="p-8 text-center">Bug bash not found</div>;

  return (
    <div className="container mx-auto p-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/bug-bash')}
        className="mb-4"
      >
        Back to Bug Bashes
      </Button>
      <div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-6">Edit Bug Bash</h2>
        <BugBashForm 
          onSubmit={handleUpdateBugBash} 
          initialData={bugBash} 
          onCancel={() => navigate('/bug-bash')} 
        />
      </div>
    </div>
  );
}

// Detail View
export function BugBashDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshBugBashes } = useContext(BugBashContext);
  const [bugBash, setBugBash] = useState<BugBash | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchBugBash = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const data = await fetchBugBashById(id);
        
        const mappedData: BugBash = {
          ...data,
          id: data.id || id,
          title: data.title || data.name || 'Untitled Bug Bash',
          description: data.description || '',
          startDate: data.startDate || data.startTime || new Date().toISOString(),
          endDate: data.endDate || data.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: data.status || 'planned',
          participants: Array.isArray(data.participants) ? data.participants : [],
          createdBy: data.createdBy || 'unknown',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          functional: Array.isArray(data.functional) ? data.functional : [],
          performance: Array.isArray(data.performance) ? data.performance : [],
          security: Array.isArray(data.security) ? data.security : []
        };
        
        setBugBash(mappedData);
      } catch (error) {
        console.error('Error fetching bug bash:', error);
        toast({
          title: "Error",
          description: "Failed to load bug bash details.",
          variant: "destructive"
        });
        navigate('/bug-bash');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBugBash();
  }, [id, navigate]);

  const handleUpdateBugBash = async (updatedBugBash: BugBash): Promise<void | BugBash> => {
    if (!updatedBugBash.id) return;

    try {
      setIsSaving(true);
      const currentBugBash = bugBash || {};
      const requiredFields = {
        name: updatedBugBash.name || 'Untitled Bug Bash',
        scope: updatedBugBash.scope || 'general',
        updatedAt: new Date().toISOString()
      };

      const changedFields: Partial<BugBash> = { ...requiredFields };
      Object.entries(updatedBugBash).forEach(([key, value]) => {
        const currentValue = (currentBugBash as any)[key];
        if (JSON.stringify(currentValue) !== JSON.stringify(value)) {
          (changedFields as any)[key] = value;
        }
      });

      const updated = await updateBugBash(updatedBugBash.id, changedFields);
      
      if (updated) {
        const newBugBash: BugBash = {
          ...currentBugBash,
          ...updated,
          id: updated.id || updatedBugBash.id,
          functional: Array.isArray(updated.functional) ? [...updated.functional] : [],
          performance: Array.isArray(updated.performance) ? [...updated.performance] : [],
          security: Array.isArray(updated.security) ? [...updated.security] : [],
          participants: Array.isArray(updated.participants) ? [...updated.participants] : []
        };
        
        setBugBash({ ...newBugBash });
        
        // Refresh the bug bash list in the background
        refreshBugBashes(true).catch(err => {
          console.error('Failed to refresh bug bash list:', err);
        });
        
        toast({
          title: "Success",
          description: "Bug bash updated successfully"
        });
        
        return newBugBash;
      }
    } catch (error) {
      console.error('Error updating bug bash:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update bug bash",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Function to refresh the current bug bash from the server
  const refreshCurrentBugBash = useCallback(async () => {
    if (!id) return;
    
    try {
      console.log('🔄 Refreshing bug bash from server...');
      const data = await fetchBugBashById(id);
      
      const mappedData: BugBash = {
        ...data,
        id: data.id || id,
        title: data.title || data.name || 'Untitled Bug Bash',
        description: data.description || '',
        startDate: data.startDate || data.startTime || new Date().toISOString(),
        endDate: data.endDate || data.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: data.status || 'planned',
        participants: Array.isArray(data.participants) ? data.participants : [],
        createdBy: data.createdBy || 'unknown',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        functional: Array.isArray(data.functional) ? data.functional : [],
        performance: Array.isArray(data.performance) ? data.performance : [],
        security: Array.isArray(data.security) ? data.security : []
      };
      
      setBugBash(mappedData);
      
      // Also refresh the list
      refreshBugBashes().catch(err => {
        console.error('Failed to refresh bug bash list:', err);
      });
      
      console.log('✅ Bug bash refreshed successfully');
    } catch (error) {
      console.error('Error refreshing bug bash:', error);
    }
  }, [id, refreshBugBashes]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading bug bash details...</p>
      </div>
    );
  }

  if (!bugBash) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-2">Bug Bash not found</h2>
        <Button onClick={() => navigate('/bug-bash')}>
          Back to Bug Bashes
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{bugBash.title || 'Untitled Bug Bash'}</h1>
          <p className="text-muted-foreground">
            Created on {new Date(bugBash.createdAt || '').toLocaleDateString()}
            {bugBash.updatedAt && ` • Last updated: ${new Date(bugBash.updatedAt).toLocaleString()}`}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate(`/bug-bash/${bugBash.id}/edit`)}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </>
          )}
        </Button>
      </div>
      
      <div key={`bug-bash-${bugBash.id}-${bugBash.updatedAt || Date.now()}`}>
        <BugBashDetailedView 
          key={`${bugBash.id}-${bugBash.updatedAt || Date.now()}`}
          bugBash={bugBash} 
          onUpdate={handleUpdateBugBash}
          onRefresh={refreshCurrentBugBash}
          isReadOnly={isSaving}
        />
      </div>
    </div>
  );
}