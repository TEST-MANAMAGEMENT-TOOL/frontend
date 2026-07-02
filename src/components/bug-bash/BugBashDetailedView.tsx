import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bug, Shield, Gauge, Plus, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { BugBash, BugBashPerformanceItem, BugBashSecurityItem, FunctionalIssue } from '@/types/bug-bash';
import { fetchBugBashById, updateBugBash } from '@/services/bugBashService';
import { toast } from '@/hooks/use-toast';
import SummaryCards from './SummaryCards';
import FunctionalSection from './FunctionalSection';
import PerformanceSection from './PerformanceSection';
import SecuritySection from './SecuritySection';
import { v4 as uuidv4 } from 'uuid';

// Helper function to extract bug bash data from API response
const getBugBashData = (response: any): BugBash => {
  try {
    // If response has a data property, use that, otherwise use the response itself
    const data = response?.data || response || {};
    
    console.log('Processing bug bash data in getBugBashData:', {
      hasData: !!data,
      functional: Array.isArray(data?.functional) ? data.functional.length : 'not an array',
      performance: Array.isArray(data?.performance) ? data.performance.length : 'not an array',
      security: Array.isArray(data?.security) ? data.security.length : 'not an array',
      participants: Array.isArray(data?.participants) ? data.participants.length : 'not an array'
    });
    
    const result = {
      ...data,
      id: data.id || '',
      title: data.title || 'Untitled Bug Bash',
      description: data.description || '',
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: data.status || 'planned',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      functional: Array.isArray(data?.functional) ? data.functional : [],
      performance: Array.isArray(data?.performance) ? data.performance : [],
      security: Array.isArray(data?.security) ? data.security : [],
      participants: Array.isArray(data?.participants) ? data.participants : [],
    };
    
    console.log('Processed bug bash data:', {
      ...result,
      functional: result.functional.length,
      performance: result.performance.length,
      security: result.security.length,
      participants: result.participants.length
    });
    
    return result;
  } catch (error) {
    console.error('Error in getBugBashData:', error);
    // Return a valid BugBash object with empty arrays to prevent runtime errors
    return {
      id: '',
      title: 'Error Loading Bug Bash',
      description: 'There was an error loading this bug bash',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'planned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      functional: [],
      performance: [],
      security: [],
      participants: [],
      name: 'Error Loading',
      scope: 'general',
      createdBy: 'system'
    };
  }
};

interface BugBashDetailedViewProps {
  bugBash: BugBash;
  onUpdate: (updatedBugBash: BugBash) => Promise<BugBash | void>;
  onRefresh?: () => Promise<void>;
  isReadOnly?: boolean;
}

type TabType = 'functional' | 'performance' | 'security';
type FunctionalType = 'bug' | 'feature' | 'improvement';

const BugBashDetailedView: React.FC<BugBashDetailedViewProps> = ({ 
  bugBash: initialBugBash, 
  onUpdate,
  onRefresh,
  isReadOnly = false 
}) => {
  // Use state to manage the bugBash data
  const [localBugBash, setLocalBugBash] = useState<BugBash>(() => getBugBashData(initialBugBash));
  const [activeTab, setActiveTab] = useState<TabType>('functional');
  const [activeFunctionalTab, setActiveFunctionalTab] = useState<FunctionalType>('bug');
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  // Keep internal state in sync with props
  useEffect(() => {
    // Only update if the initialBugBash has a different ID or a newer updatedAt
    if (initialBugBash.id !== localBugBash.id || 
        (initialBugBash.updatedAt && initialBugBash.updatedAt !== localBugBash.updatedAt)) {
      
      // Skip update if the data is effectively the same
      const isSameData = (
        initialBugBash.id === localBugBash.id &&
        initialBugBash.updatedAt === localBugBash.updatedAt &&
        JSON.stringify(initialBugBash.functional) === JSON.stringify(localBugBash.functional) &&
        JSON.stringify(initialBugBash.performance) === JSON.stringify(localBugBash.performance) &&
        JSON.stringify(initialBugBash.security) === JSON.stringify(localBugBash.security)
      );
      
      if (!isSameData) {
        console.log('Updating localBugBash from props:', {
          id: initialBugBash.id,
          updatedAt: initialBugBash.updatedAt,
          functional: initialBugBash.functional?.length || 0,
          performance: initialBugBash.performance?.length || 0,
          security: initialBugBash.security?.length || 0
        });
        
        const processedBugBash = getBugBashData(initialBugBash);
        setLocalBugBash(processedBugBash);
      }
    }
  }, [initialBugBash]); // Only depend on initialBugBash

  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Navigate back to the previous page
  const handleBack = () => {
    navigate(-1); // Go back to the previous page in history
  };
  
  // Handle updates to the bug bash data
  const handleUpdate = async (updates: Partial<BugBash>) => {
    console.log('=== handleUpdate called ===');
    console.log('Updates to apply:', updates);
    
    try {
      setIsSaving(true);
      setHasChanges(false);
      
      // Create updated bug bash with new timestamp
      const updatedBugBash = {
        ...localBugBash,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      console.log('Updated bug bash data before sending:', {
        ...updatedBugBash,
        functional: Array.isArray(updatedBugBash.functional) ? 
          `Array(${updatedBugBash.functional.length})` : 'Not an array',
        performance: Array.isArray(updatedBugBash.performance) ? 
          `Array(${updatedBugBash.performance.length})` : 'Not an array',
        security: Array.isArray(updatedBugBash.security) ? 
          `Array(${updatedBugBash.security.length})` : 'Not an array'
      });
      
      // Update local state immediately for responsive UI
      setLocalBugBash(updatedBugBash);
      
      // Call parent's onUpdate if provided
      if (onUpdate) {
        console.log('Calling parent onUpdate...');
        try {
          const result = await onUpdate(updatedBugBash);
          console.log('Parent onUpdate result:', result ? 'Success' : 'No result');
          
          if (result) {
            // If parent returns updated data, use that
            const processedResult = getBugBashData(result);
            console.log('Processed result from server:', {
              ...processedResult,
              functional: `Array(${processedResult.functional?.length || 0})`,
              performance: `Array(${processedResult.performance?.length || 0})`,
              security: `Array(${processedResult.security?.length || 0})`
            });
            
            setLocalBugBash(processedResult);
            setHasChanges(false);
            toast({
              title: 'Success',
              description: 'Bug bash updated successfully',
              variant: 'default'
            });
            return result;
          }
        } catch (updateError) {
          console.error('Error in parent onUpdate:', updateError);
          toast({
            title: 'Update Failed',
            description: updateError instanceof Error ? 
              updateError.message : 'Failed to update bug bash',
            variant: 'destructive'
          });
          throw updateError;
        }
      }
      
      return updatedBugBash;
    } catch (error) {
      console.error('Error in handleUpdate:', error);
      
      // Revert to previous state on error
      console.log('Reverting to previous state due to error');
      setLocalBugBash(localBugBash);
      
      // Show error toast if not already shown by the parent
      if (!onUpdate) {
        toast({
          title: 'Update Failed',
          description: error instanceof Error ? 
            error.message : 'An unexpected error occurred',
          variant: 'destructive'
        });
      }
      
      throw error;
    } finally {
      console.log('=== handleUpdate completed ===');
      setIsSaving(false);
      setLastUpdated(Date.now());
    }
  };
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-renders

  // Debug log for FunctionalSection props
  useEffect(() => {
    console.log('=== FunctionalSection Data ===');
    console.log('localBugBash.functional:', {
      isArray: Array.isArray(localBugBash.functional),
      length: localBugBash.functional?.length || 0,
      firstItem: localBugBash.functional?.[0] || 'No items',
      allItems: localBugBash.functional || []
    });
    
    const filtered = Array.isArray(localBugBash.functional) 
      ? localBugBash.functional.filter((i: any) => i.type === activeFunctionalTab)
      : [];
      
    console.log(`Filtered (${activeFunctionalTab}):`, {
      count: filtered.length,
      items: filtered
    });
    
    console.log('localBugBash state:', {
      id: localBugBash.id,
      title: localBugBash.title,
      functionalCount: localBugBash.functional?.length || 0,
      performanceCount: localBugBash.performance?.length || 0,
      securityCount: localBugBash.security?.length || 0
    });
    console.log('======================');
  }, [localBugBash, activeFunctionalTab]);
  
  // Update local state when initialBugBash changes
  useEffect(() => {
    if (initialBugBash) {
      console.log('Initial bug bash data received (before processing):', {
        ...initialBugBash,
        functional: initialBugBash.functional?.length || 0,
        performance: initialBugBash.performance?.length || 0,
        security: initialBugBash.security?.length || 0
      });
      
      const newBugBashData = getBugBashData(initialBugBash);
      
      console.log('Processed bug bash data:', {
        ...newBugBashData,
        functional: newBugBashData.functional?.length || 0,
        performance: newBugBashData.performance?.length || 0,
        security: newBugBashData.security?.length || 0
      });
      
      // Always update the local state to ensure we have the latest data
      setLocalBugBash(prevState => {
        console.log('Previous local state:', {
          ...prevState,
          functional: prevState.functional?.length || 0,
          performance: prevState.performance?.length || 0,
          security: prevState.security?.length || 0
        });
        
        const newState = { ...newBugBashData };
        console.log('Updating local bug bash state with new data', {
          ...newState,
          functional: newState.functional?.length || 0,
          performance: newState.performance?.length || 0,
          security: newState.security?.length || 0
        });
        return newState;
      });
      
      // Force a re-render to ensure UI updates
      setForceUpdate(prev => {
        console.log('Force update triggered', prev + 1);
        return prev + 1;
      });
    }
  }, [initialBugBash]);

  // Fetch the latest bug bash data when needed
  const fetchLatestData = useCallback(async () => {
    if (!initialBugBash?.id) return null;
    
    try {
      console.log(`[${new Date().toISOString()}] Fetching latest data for bug bash: ${initialBugBash.id}`);
      const data = await fetchBugBashById(initialBugBash.id);
      
      const sanitizedData = {
        ...data,
        functional: Array.isArray(data.functional) ? data.functional : [],
        performance: Array.isArray(data.performance) ? data.performance : [],
        security: Array.isArray(data.security) ? data.security : [],
        participants: Array.isArray(data.participants) ? data.participants : [],
      };
      
      console.log('Latest bug bash data:', sanitizedData);
      return sanitizedData;
    } catch (error) {
      console.error('Failed to fetch latest bug bash data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh bug bash data. Some information might be outdated.',
        variant: 'destructive',
      });
      return null;
    }
  }, [initialBugBash?.id]);

  // Manual refresh function
  const refreshData = useCallback(async () => {
    if (!initialBugBash?.id) return;
    
    setIsLoading(true);
    try {
      const freshData = await fetchLatestData();
      if (freshData) {
        setLocalBugBash(freshData);
        setLastUpdated(Date.now());
        setHasChanges(false);
        toast({
          title: 'Refreshed',
          description: 'Bug bash data has been refreshed.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchLatestData, initialBugBash?.id]);

  // Set up polling to refresh data periodically
  useEffect(() => {
    if (!initialBugBash?.id) return;
    
    const intervalId = setInterval(() => {
      console.log(`[${new Date().toISOString()}] Polling for updates...`);
      fetchLatestData().then(freshData => {
        if (freshData && !hasChanges) {
          console.log('Updating with fresh data from server');
          setLocalBugBash(freshData);
        }
      });
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [initialBugBash?.id, hasChanges, fetchLatestData]);

  const handleLocalUpdate = async (updatedData: Partial<BugBash>) => {
    console.log('handleLocalUpdate called with:', updatedData);
    if (isSaving) {
      console.warn('Save already in progress, ignoring update');
      return;
    }
    
    // Get the current timestamp for this update
    const updateTimestamp = new Date().toISOString();
    
    // Create a deep copy of the current state to avoid reference issues
    const currentState = JSON.parse(JSON.stringify(localBugBash));
    
    // Always include required fields in the update
    const updateWithRequiredFields = {
      ...updatedData,
      name: updatedData.name !== undefined ? updatedData.name : (currentState.name || 'Untitled Bug Bash'),
      scope: updatedData.scope !== undefined ? updatedData.scope : (currentState.scope || 'general'),
      updatedAt: updateTimestamp,
      // Ensure arrays are always arrays and create new references
      functional: Array.isArray(updatedData.functional) 
        ? [...updatedData.functional] 
        : currentState.functional || [],
      performance: Array.isArray(updatedData.performance) 
        ? [...updatedData.performance] 
        : currentState.performance || [],
      security: Array.isArray(updatedData.security) 
        ? [...updatedData.security] 
        : currentState.security || []
    };
    
    // Prepare the updated bug bash with proper timestamps and required fields
    const updatedBugBash = {
      ...currentState,
      ...updateWithRequiredFields
    };
    
    console.log('Preparing update with data:', {
      currentState: { 
        name: currentState.name, 
        scope: currentState.scope,
        functional: currentState.functional?.length,
        performance: currentState.performance?.length,
        security: currentState.security?.length
      },
      updatedData: { 
        name: updatedData.name, 
        scope: updatedData.scope,
        functional: updatedData.functional?.length,
        performance: updatedData.performance?.length,
        security: updatedData.security?.length
      }
    });
    
    console.log('Performing optimistic update with:', {
      ...updatedBugBash,
      functional: updatedBugBash.functional?.length,
      performance: updatedBugBash.performance?.length,
      security: updatedBugBash.security?.length
    });
    
    // Force a new state object to ensure React detects the change
    setLocalBugBash({...updatedBugBash});
    setHasChanges(true);
    setForceUpdate(prev => prev + 1); // Force re-render
    
    try {
      setIsSaving(true);
      console.log('Saving changes to server...', { updateWithRequiredFields });
      console.log('Saving bug bash update:', updatedData);
      
      // Prepare the update payload with required fields
      const fieldsToUpdate: Record<string, any> = {
        // Always include required fields
        name: updateWithRequiredFields.name,
        scope: updateWithRequiredFields.scope,
        updatedAt: updateWithRequiredFields.updatedAt
      };
      
      // Include any other changed fields
      Object.keys(updatedData).forEach(key => {
        const currentValue = updatedData[key as keyof BugBash];
        const previousValue = currentState[key as keyof BugBash];
        
        // Only include changed fields
        if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
          fieldsToUpdate[key] = currentValue;
          console.log(`Field changed: ${key}`, { from: previousValue, to: currentValue });
        }
      });
      
      console.log('Sending update with fields:', fieldsToUpdate);
      
      console.log('Sending update to server with fields:', fieldsToUpdate);
      
      // Send only the changed fields to the server
      const savedBugBash = await updateBugBash(updatedBugBash.id, {
        ...fieldsToUpdate,
        // Always include updatedAt to prevent race conditions
        updatedAt: updateTimestamp
      });
      
      // Get fresh data from server to ensure we have the latest state
      console.log('Update successful, fetching latest data...');
      const freshData = await fetchLatestData();
      const serverBugBash = freshData || savedBugBash;
      console.log('Server response:', serverBugBash);
      
      if (serverBugBash) {
        // Update local state with server response
        setLocalBugBash(serverBugBash);
        
        // Notify parent component of the update
        onUpdate(serverBugBash);
        
        // Reset the hasChanges flag
        setHasChanges(false);
        
        // Force a re-render
        setForceUpdate(prev => prev + 1);
        
        // Show success message
        toast({
          title: 'Changes saved',
          description: 'Your changes have been successfully saved to the database.',
          variant: 'default',
        });
        
        // Update the last updated timestamp
        setLastUpdated(Date.now());
        
          return serverBugBash;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to save changes:', error);
      
      // Revert to the last known good state on error
      setLocalBugBash(currentState);
      
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
      
      // Re-throw the error to allow callers to handle it if needed
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (isSaving || isReadOnly || !onUpdate) return;
    
    try {
      setIsSaving(true);
      console.log('Saving bug bash changes:', localBugBash);
      
      // Call the parent's onUpdate with the current state
      const result = await onUpdate(localBugBash);
      
      // If the parent returns updated data, use it to update local state
      if (result) {
        console.log('Received updated bug bash from parent:', result);
        
        // Create a properly typed updated bug bash object with all required properties
        const updatedData: BugBash = {
          // Required properties with fallbacks
          id: result.id || localBugBash.id,
          name: result.name || localBugBash.name || 'Untitled Bug Bash',
          scope: result.scope || localBugBash.scope || 'general',
          createdBy: result.createdBy || localBugBash.createdBy || 'Unknown',
          // Other properties with fallbacks
          title: result.title || localBugBash.title,
          description: result.description || localBugBash.description,
          startDate: result.startDate || localBugBash.startDate,
          endDate: result.endDate || localBugBash.endDate,
          status: result.status || localBugBash.status || 'planned',
          createdAt: result.createdAt || localBugBash.createdAt || new Date().toISOString(),
          updatedAt: result.updatedAt || localBugBash.updatedAt || new Date().toISOString(),
          // Handle arrays with proper type safety
          functional: Array.isArray(result.functional) 
            ? [...result.functional] 
            : [...(localBugBash.functional || [])],
          performance: Array.isArray(result.performance) 
            ? [...result.performance] 
            : [...(localBugBash.performance || [])],
          security: Array.isArray(result.security) 
            ? [...result.security] 
            : [...(localBugBash.security || [])],
          participants: Array.isArray(result.participants)
            ? [...result.participants]
            : [...(localBugBash.participants || [])]
        };
        
        setLocalBugBash(updatedData);
      }
      
      setHasChanges(false);
      
      toast({
        title: "Success",
        description: "Bug bash updated successfully"
      });
    } catch (error) {
      console.error('Error saving bug bash:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [localBugBash, onUpdate, isSaving, isReadOnly]);

  const handleCancel = () => {
    setLocalBugBash({ ...initialBugBash });
    setHasChanges(false);
  };

  // Track functional bugs count from FunctionalSection
  const [functionalCounts, setFunctionalCounts] = useState({ bugs: 0, features: 0, improvements: 0 });
  const [performanceCount, setPerformanceCount] = useState(0);

  const summary = {
    functional: {
      totalBugs: functionalCounts.bugs + functionalCounts.features + functionalCounts.improvements,
      bugs: functionalCounts.bugs,
      features: functionalCounts.features,
      improvements: functionalCounts.improvements,
    },
    security: {
      vulnerabilities: localBugBash.security?.length || 0,
      critical: localBugBash.security?.filter(s => s.severity === 'critical').length || 0,
    },
    performance: {
      totalTests: performanceCount,
      tps: '1,200',
      errorRate: '0.5%',
      avgResponseTime: '350ms',
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading bug bash data...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Save/Discard Bar */}
      {!isReadOnly && hasChanges && (
        <div className="bg-blue-50 p-2 flex justify-end space-x-2 border-b">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCancel}
            disabled={isSaving}
          >
            Discard Changes
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </Button>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r p-4 space-y-2">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              className="mr-2 h-8 w-8"
              title="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">Bug Bash: {localBugBash.title}</h2>
          </div>
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as TabType)}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-1 gap-2">
              <TabsTrigger value="functional" className="justify-start gap-2">
                <Bug className="h-4 w-4" />
                Functional
              </TabsTrigger>
              <TabsTrigger value="performance" className="justify-start gap-2">
                <Gauge className="h-4 w-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="security" className="justify-start gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          <SummaryCards bugBash={localBugBash} functionalCounts={functionalCounts} />

          <div className="space-y-4 mt-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                {activeTab === 'functional' ? (
                  <Tabs 
                    value={activeFunctionalTab}
                    onValueChange={(v) => setActiveFunctionalTab(v as any)}
                    className="inline-flex items-center h-9 rounded-lg bg-muted p-1 text-muted-foreground"
                  >
                    <TabsList className="grid grid-cols-2 w-[240px]">
                      <TabsTrigger value="bug">Bugs</TabsTrigger>
                      <TabsTrigger value="improvement">Features</TabsTrigger>
                    </TabsList>
                  </Tabs>
                ) : (
                  <h2 className="text-2xl font-bold tracking-tight">
                    {activeTab === 'performance' ? 'Performance Results' : 'Security Vulnerabilities'}
                  </h2>
                )}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'functional' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    {activeFunctionalTab === 'bug' ? 'Bugs' : 'Features'}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {isSaving && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </div>
                    )}
                  </div>
                </div>
                
                <FunctionalSection
                  key={`functional-${localBugBash.id}-${activeFunctionalTab}`}
                  bugBashId={localBugBash.id}
                  issues={Array.isArray(localBugBash.functional) ? localBugBash.functional : []}
                  isLoading={isSaving}
                  filterType={activeFunctionalTab}
                  onBugsCountChange={(counts) => {
                    console.log('📊 Received bug counts from FunctionalSection:', counts);
                    setFunctionalCounts(counts);
                    // Don't refresh here - it causes infinite loop
                  }}
                  onAdd={async (formData: FormData) => {
                    try {
                      // Convert FormData to plain object
                      const formDataObj = Object.fromEntries(formData.entries());
                      
                      // Extract and type cast values with defaults
                      const title = formDataObj.title?.toString() || 'Untitled Issue';
                      const description = formDataObj.description?.toString() || '';
                      const module = formDataObj.module?.toString() || 'general';
                      const environment = formDataObj.environment?.toString() || 'development';
                      
                      // Type assertions with fallbacks
                      const status = (
                        formDataObj.status === 'open' || 
                        formDataObj.status === 'in-progress' || 
                        formDataObj.status === 'resolved' || 
                        formDataObj.status === 'wont-fix'
                      ) ? formDataObj.status as 'open' | 'in-progress' | 'resolved' | 'wont-fix' : 'open';
                      
                      const priority = (
                        formDataObj.priority === 'low' || 
                        formDataObj.priority === 'medium' || 
                        formDataObj.priority === 'high' || 
                        formDataObj.priority === 'critical'
                      ) ? formDataObj.priority as 'low' | 'medium' | 'high' | 'critical' : 'medium';
                      
                      const type = (
                        formDataObj.type === 'bug' || 
                        formDataObj.type === 'feature' || 
                        formDataObj.type === 'improvement'
                      ) ? formDataObj.type as 'bug' | 'feature' | 'improvement' : 'bug';
                      
                      // Create new issue with all required fields
                      const newItem: FunctionalIssue = {
                        id: `f-${uuidv4()}`,
                        title,
                        description,
                        module,
                        environment,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        reporterId: 'current-user-id',
                        status,
                        priority,
                        type,
                        comments: [],
                        attachments: [],
                        stepsToReproduce: (() => {
                          try {
                            const steps = formDataObj.stepsToReproduce;
                            if (typeof steps === 'string' && steps.trim()) {
                              return JSON.parse(steps);
                            }
                            return [];
                          } catch (error) {
                            console.warn('Failed to parse stepsToReproduce:', error);
                            return [];
                          }
                        })(),
                        expectedBehavior: formDataObj.expectedBehavior?.toString() || '',
                        actualBehavior: formDataObj.actualBehavior?.toString() || ''
                      };
                      
                      const currentFunctionals = Array.isArray(localBugBash.functional) 
                        ? localBugBash.functional 
                        : [];
                        
                      const next = [...currentFunctionals, newItem];
                      await handleLocalUpdate({ functional: next });
                      
                      toast({
                        title: 'Success',
                        description: `${type || 'Item'} added successfully`,
                        variant: 'default',
                      });
                    } catch (error) {
                      console.error('Error adding item:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to add item. Please try again.',
                        variant: 'destructive',
                      });
                    }
                  }}
                  onUpdate={async (id, updates) => {
                    try {
                      const currentFunctionals = Array.isArray(localBugBash.functional) 
                        ? localBugBash.functional 
                        : [];
                        
                      const next = currentFunctionals.map((it) =>
                        it.id === id 
                          ? { 
                              ...it, 
                              ...updates, 
                              updatedAt: new Date().toISOString() 
                            } 
                          : it
                      );
                      
                      await handleLocalUpdate({ functional: next });
                      
                      toast({
                        title: 'Success',
                        description: 'Changes saved successfully',
                        variant: 'default',
                      });
                    } catch (error) {
                      console.error('Error updating item:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to update item. Please try again.',
                        variant: 'destructive',
                      });
                      throw error; // Re-throw to allow the component to handle the error
                    }
                  }}
                  onDelete={async (id) => {
                    try {
                      const currentFunctionals = Array.isArray(localBugBash.functional) 
                        ? localBugBash.functional 
                        : [];
                        
                      const next = currentFunctionals.filter((it) => it.id !== id);
                      await handleLocalUpdate({ functional: next });
                      
                      toast({
                        title: 'Success',
                        description: 'Item deleted successfully',
                        variant: 'default',
                      });
                    } catch (error) {
                      console.error('Error deleting item:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to delete item. Please try again.',
                        variant: 'destructive',
                      });
                      throw error; // Re-throw to allow the component to handle the error
                    }
                  }}
                />
              </div>
            )}
            
            {activeTab === 'performance' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Performance Results</h3>
                  <div className="flex items-center space-x-2">
                    {isSaving && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </div>
                    )}
                  </div>
                </div>
                
                <PerformanceSection
                  bugBashId={localBugBash.id}
                  results={localBugBash.performance || []}
                  isLoading={isSaving}
                  onPerformanceCountChange={(count) => {
                    console.log('📊 Received performance count:', count);
                    setPerformanceCount(count);
                  }}
                  onPerformanceDataChange={(results: any) => {
                    console.log('📡 Received performance data for SummaryCards:', results.length);
                    // Update local state with the API results so SummaryCards can display them
                    setLocalBugBash(prev => ({
                      ...prev,
                      performance: results as BugBashPerformanceItem[]
                    }));
                  }}
                  onAdd={async (result) => {
                    try {
                      const newItem = {
                        ...result,
                        id: `perf-${uuidv4()}`,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        status: result.status || 'pending',
                        severity: result.severity || 'medium',
                        reporterId: 'current-user-id',
                        comments: [],
                        attachments: []
                      };
                      
                      const currentPerformance = Array.isArray(localBugBash.performance) 
                        ? localBugBash.performance 
                        : [];
                        
                      const next = [...currentPerformance, newItem];
                      await handleLocalUpdate({ performance: next });
                      
                      toast({
                        title: 'Success',
                        description: 'Performance result added successfully',
                        variant: 'default',
                      });
                    } catch (error) {
                      console.error('Error adding performance result:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to add performance result. Please try again.',
                        variant: 'destructive',
                      });
                    }
                  }}
                  onUpdate={async (id, updates) => {
                    try {
                      const currentPerformance = Array.isArray(localBugBash.performance) 
                        ? localBugBash.performance 
                        : [];
                        
                      const next = currentPerformance.map((it) =>
                        it.id === id 
                          ? { 
                              ...it, 
                              ...updates, 
                              updatedAt: new Date().toISOString() 
                            } 
                          : it
                      );
                      
                      await handleLocalUpdate({ performance: next });
                      
                      toast({
                        title: 'Success',
                        description: 'Performance result updated successfully',
                        variant: 'default',
                      });
                    } catch (error) {
                      console.error('Error updating performance result:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to update performance result. Please try again.',
                        variant: 'destructive',
                      });
                      throw error;
                    }
                  }}
                  onDelete={async (id) => {
                    try {
                      const currentPerformance = Array.isArray(localBugBash.performance) 
                        ? localBugBash.performance 
                        : [];
                        
                      const next = currentPerformance.filter((it) => it.id !== id);
                      await handleLocalUpdate({ performance: next });
                      
                      toast({
                        title: 'Success',
                        description: 'Performance result deleted successfully',
                        variant: 'default',
                      });
                    } catch (error) {
                      console.error('Error deleting performance result:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to delete performance result. Please try again.',
                        variant: 'destructive',
                      });
                      throw error;
                    }
                  }}
                />
              </div>
            )}
            
            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Security Vulnerabilities</h3>
                  <div className="flex items-center space-x-2">
                    {isSaving && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </div>
                    )}
                  </div>
                </div>
                
                <SecuritySection
                  vulnerabilities={localBugBash.security || []}
                  isLoading={isSaving}
                  onAdd={async (vulnerability) => {
                    try {
                      const newItem = {
                        ...vulnerability,
                        id: `sec-${uuidv4()}`,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        status: vulnerability.status || 'open',
                        severity: vulnerability.severity || 'medium',
                        reporterId: 'current-user-id',
                        comments: [],
                        attachments: []
                      };
                      
                      const currentSecurity = Array.isArray(localBugBash.security) 
                        ? localBugBash.security 
                        : [];
                        
                      const next = [...currentSecurity, newItem];
                      await handleLocalUpdate({ security: next });
                      
                      toast({
                        title: 'Success',
                        description: 'Security vulnerability added successfully',
                        variant: 'default',
                      });
                    } catch (error) {
                      console.error('Error adding security vulnerability:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to add security vulnerability. Please try again.',
                        variant: 'destructive',
                      });
                    }
                  }}
                  onUpdate={async (id, updates) => {
                    try {
                      const currentSecurity = Array.isArray(localBugBash.security) 
                        ? localBugBash.security 
                        : [];
                        
                      const next = currentSecurity.map((it) =>
                        it.id === id 
                          ? { 
                              ...it, 
                              ...updates, 
                              updatedAt: new Date().toISOString() 
                            } 
                          : it
                      );
                      
                      await handleLocalUpdate({ security: next });
                      
                      toast({
                        title: 'Success',
                        description: 'Security vulnerability updated successfully',
                        variant: 'default',
                      });
                    } catch (error) {
                      console.error('Error updating security vulnerability:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to update security vulnerability. Please try again.',
                        variant: 'destructive',
                      });
                      throw error;
                    }
                  }}
                  onDelete={async (id) => {
                    try {
                      const currentSecurity = Array.isArray(localBugBash.security) 
                        ? localBugBash.security 
                        : [];
                        
                      const next = currentSecurity.filter((it) => it.id !== id);
                      await handleLocalUpdate({ security: next });
                      
                      toast({
                        title: 'Success',
                        description: 'Security vulnerability deleted successfully',
                        variant: 'default',
                      });
                    } catch (error) {
                      console.error('Error deleting security vulnerability:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to delete security vulnerability. Please try again.',
                        variant: 'destructive',
                      });
                      throw error;
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { BugBashDetailedView };