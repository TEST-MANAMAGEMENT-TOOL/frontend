import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Trash2, Pencil, X, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { bugBashPerformanceService, PerformanceResult } from '@/services/bugBashPerformanceService';
import { toast } from '@/hooks/use-toast';

interface PerformanceSectionProps {
  bugBashId: string;
  results?: any[];
  onAdd?: (result: any) => Promise<void>;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onPerformanceCountChange?: (count: number) => void;
  onPerformanceDataChange?: (results: any[]) => void;
  isLoading?: boolean;
}

const PerformanceSection: React.FC<PerformanceSectionProps> = ({ 
  bugBashId,
  results: propResults = [], 
  onAdd, 
  onUpdate, 
  onDelete,
  onPerformanceCountChange,
  onPerformanceDataChange,
  isLoading: propIsLoading = false 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [apiResults, setApiResults] = useState<PerformanceResult[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  
  const [newResult, setNewResult] = useState({
    tps: '',
    response_time: '',
    pass_rate: '',
    error_rate: '',
    jtl_file: ''
  });

  const [editValue, setEditValue] = useState<Partial<PerformanceResult>>();
  
  // Use API results if available, otherwise use prop results
  const results = apiResults.length > 0 ? apiResults : propResults;
  const isLoading = propIsLoading || isLoadingResults;
  
  const currentResult = React.useMemo(() => {
    if (!viewingId && !editingId) return null;
    
    const targetId = viewingId || editingId;
    console.log('🔍 Looking for result with ID:', targetId);
    console.log('📋 Available results:', results.map(r => ({ id: r.id, tps: r.tps })));
    
    const found = results.find(r => String(r.id) === String(targetId));
    console.log('✅ Found result:', found ? 'Yes' : 'No', found);
    
    return found || null;
  }, [viewingId, editingId, results]);

  // Fetch performance results from API
  useEffect(() => {
    const fetchResults = async () => {
      if (!bugBashId) return;
      
      try {
        setIsLoadingResults(true);
        console.log('📡 Fetching performance results for bug bash:', bugBashId);
        
        const { results: fetchedResults } = await bugBashPerformanceService.getPerformanceByBugBashId(bugBashId);
        
        console.log('✅ Performance results fetched:', fetchedResults);
        console.log('📋 First result:', fetchedResults?.[0]);
        console.log('📋 Result IDs:', fetchedResults?.map(r => ({ id: r.id, hasId: !!r.id })));
        
        // Ensure all results have IDs (use index as fallback if missing)
        const resultsWithIds = (fetchedResults || []).map((result, index) => ({
          ...result,
          id: result.id || `temp-${index}-${Date.now()}`
        }));
        
        console.log('📋 Results with IDs:', resultsWithIds.map(r => ({ id: r.id, tps: r.tps })));
        
        setApiResults(resultsWithIds);
      } catch (error) {
        console.error('❌ Failed to fetch performance results:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load performance results',
          variant: 'destructive',
        });
        setApiResults([]);
      } finally {
        setIsLoadingResults(false);
      }
    };

    fetchResults();
  }, [bugBashId]);

  // Notify parent when performance results change
  useEffect(() => {
    if (onPerformanceCountChange && results.length >= 0) {
      console.log('📊 Notifying parent of performance count:', results.length);
      onPerformanceCountChange(results.length);
    }
  }, [results.length, onPerformanceCountChange]);

  // Sync API results to parent so SummaryCards can display them
  // Map API format to BugBash format
  useEffect(() => {
    if (apiResults.length > 0 && onPerformanceDataChange) {
      console.log('📡 Syncing API results to parent for SummaryCards:', apiResults.length);
      // Map PerformanceResult (API format) to BugBashPerformanceItem (app format)
      const mappedResults = apiResults.map(result => ({
        id: String(result.id || ''),
        testName: `Performance Test ${result.id}`,
        testDate: result.created_at || new Date().toISOString(),
        tps: typeof result.tps === 'number' ? result.tps : parseFloat(String(result.tps || 0)),
        errorRate: typeof result.error_rate === 'number' ? result.error_rate : parseFloat(String(result.error_rate || 0)),
        avgResponseTime: typeof result.response_time === 'number' ? result.response_time : parseFloat(String(result.response_time || 0)),
        maxResponseTime: 0, // Not provided by API
        minResponseTime: 0, // Not provided by API
        successRate: typeof result.pass_rate === 'number' ? result.pass_rate : parseFloat(String(result.pass_rate || 0)),
        testDuration: 0, // Not provided by API
        jmeterLogsUrl: result.jtl_file,
        notes: '',
        testerId: 'api-user',
        environment: 'production',
        status: 'completed' as const,
        createdAt: result.created_at || new Date().toISOString(),
        updatedAt: result.updated_at || new Date().toISOString()
      }));
      onPerformanceDataChange(mappedResults as any);
    }
  }, [apiResults, onPerformanceDataChange]);

  const handleAddClick = () => {
    setIsAdding(true);
    setNewResult({
      tps: '',
      response_time: '',
      pass_rate: '',
      error_rate: '',
      jtl_file: ''
    });
  };

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        bug_bash_id: bugBashId,
        tps: newResult.tps,
        response_time: newResult.response_time,
        pass_rate: newResult.pass_rate,
        error_rate: newResult.error_rate,
        jtl_file: newResult.jtl_file
      };

      const { result, message } = await bugBashPerformanceService.addPerformanceResult(data);
      
      toast({
        title: 'Success',
        description: message || 'Performance result added successfully',
      });

      // Refresh results
      const { results: fetchedResults } = await bugBashPerformanceService.getPerformanceByBugBashId(bugBashId);
      setApiResults(fetchedResults || []);
      
      setIsAdding(false);
      setNewResult({
        tps: '',
        response_time: '',
        pass_rate: '',
        error_rate: '',
        jtl_file: ''
      });
    } catch (error) {
      console.error('Error adding performance result:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add performance result',
        variant: 'destructive',
      });
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
  };

  const startEditing = (result: PerformanceResult) => {
    console.log('✏️ Starting edit for result:', result);
    console.log('📋 Result ID:', result.id, 'Type:', typeof result.id);
    setEditingId(String(result.id));
    setViewingId(null);
    setEditValue(result);
  };

  const viewDetails = (result: PerformanceResult) => {
    console.log('👁️ Viewing result:', result);
    console.log('📋 Result ID:', result.id, 'Type:', typeof result.id);
    setViewingId(String(result.id));
    setEditingId(null);
    setEditValue(result);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setViewingId(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editValue) return;
    try {
      const { result, message } = await bugBashPerformanceService.updatePerformanceResult(editingId, editValue);
      
      toast({
        title: 'Success',
        description: message || 'Performance result updated successfully',
      });

      // Refresh results
      const { results: fetchedResults } = await bugBashPerformanceService.getPerformanceByBugBashId(bugBashId);
      setApiResults(fetchedResults || []);
      
      cancelEdit();
    } catch (error) {
      console.error('Error updating performance result:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update performance result',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string | number) => {
    if (confirm('Are you sure you want to delete this performance result?')) {
      try {
        const { message } = await bugBashPerformanceService.deletePerformanceResult(id);
        
        toast({
          title: 'Success',
          description: message || 'Performance result deleted successfully',
        });

        // Refresh results
        const { results: fetchedResults } = await bugBashPerformanceService.getPerformanceByBugBashId(bugBashId);
        setApiResults(fetchedResults || []);
      } catch (error) {
        console.error('Error deleting performance result:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to delete performance result',
          variant: 'destructive',
        });
      }
    }
  };

  if (isLoading) {
    return <div>Loading performance data...</div>;
  }

  return (
    <Card className="mt-4">
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Performance Results</CardTitle>
          <Button 
            size="sm" 
            onClick={handleAddClick} 
            disabled={isAdding || isLoading}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Result
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Add New Performance Result Form */}
        {isAdding && (
          <form onSubmit={handleAddResult} className="mb-6 p-4 border rounded-lg bg-muted/10">
            <h3 className="font-medium mb-4 flex items-center">
              <Plus className="h-5 w-5 mr-2 text-primary" />
              Add New Performance Result
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">TPS (Transactions Per Second) *</label>
                <Input
                  value={newResult.tps}
                  onChange={(e) => setNewResult({...newResult, tps: e.target.value})}
                  placeholder="e.g., 100"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Response Time (ms) *</label>
                <Input
                  value={newResult.response_time}
                  onChange={(e) => setNewResult({...newResult, response_time: e.target.value})}
                  placeholder="e.g., 250"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Pass Rate (%) *</label>
                <Input
                  value={newResult.pass_rate}
                  onChange={(e) => setNewResult({...newResult, pass_rate: e.target.value})}
                  placeholder="e.g., 99.5"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Error Rate (%) *</label>
                <Input
                  value={newResult.error_rate}
                  onChange={(e) => setNewResult({...newResult, error_rate: e.target.value})}
                  placeholder="e.g., 0.5"
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">JTL File Path *</label>
                <Input
                  value={newResult.jtl_file}
                  onChange={(e) => setNewResult({...newResult, jtl_file: e.target.value})}
                  placeholder="e.g., /path/to/results.jtl"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancelAdd}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Add Result
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TPS</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Pass Rate</TableHead>
                <TableHead>Error Rate</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No performance results available
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.tps}</TableCell>
                    <TableCell>{result.response_time} ms</TableCell>
                    <TableCell>{result.pass_rate}%</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${
                        parseFloat(String(result.error_rate)) > 10 ? 'bg-destructive/15 text-destructive border-destructive/20' :
                        parseFloat(String(result.error_rate)) > 5 ? 'bg-warning/15 text-warning border-warning/20' :
                        'bg-success/15 text-success border-success/20'
                      }`}>
                        {result.error_rate}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            viewDetails(result);
                          }}
                          disabled={!result.id}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(result);
                          }}
                          disabled={!result.id}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (result.id) {
                              handleDelete(result.id);
                            }
                          }}
                          disabled={!result.id}
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
        </div>

        {/* View/Edit Modal */}
        {(viewingId || editingId) && currentResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card text-card-foreground border border-border shadow-2xl p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {editingId ? 'Edit' : 'View'} Performance Result: {currentResult.testName}
                </h3>
                <Button variant="ghost" size="icon" onClick={cancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">TPS</label>
                    {editingId ? (
                      <Input
                        value={editValue?.tps || ''}
                        onChange={(e) => editValue && setEditValue({...editValue, tps: e.target.value})}
                      />
                    ) : (
                      <div className="p-2 bg-muted/20 rounded">{currentResult.tps}</div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Response Time (ms)</label>
                    {editingId ? (
                      <Input
                        value={editValue?.response_time || ''}
                        onChange={(e) => editValue && setEditValue({...editValue, response_time: e.target.value})}
                      />
                    ) : (
                      <div className="p-2 bg-muted/20 rounded">{currentResult.response_time}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pass Rate (%)</label>
                    {editingId ? (
                      <Input
                        value={editValue?.pass_rate || ''}
                        onChange={(e) => editValue && setEditValue({...editValue, pass_rate: e.target.value})}
                      />
                    ) : (
                      <div className="p-2 bg-muted/20 rounded">{currentResult.pass_rate}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Error Rate (%)</label>
                    {editingId ? (
                      <Input
                        value={editValue?.error_rate || ''}
                        onChange={(e) => editValue && setEditValue({...editValue, error_rate: e.target.value})}
                      />
                    ) : (
                      <div className="p-2 bg-muted/20 rounded">{currentResult.error_rate}</div>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">JTL File Path</label>
                    {editingId ? (
                      <Input
                        value={editValue?.jtl_file || ''}
                        onChange={(e) => editValue && setEditValue({...editValue, jtl_file: e.target.value})}
                      />
                    ) : (
                      <div className="p-2 bg-muted/20 rounded">{currentResult.jtl_file}</div>
                    )}
                  </div>
                </div>
                
                {editingId && (
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button onClick={saveEdit}>
                      <Check className="h-4 w-4 mr-2" /> Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceSection;