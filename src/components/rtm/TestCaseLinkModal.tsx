import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Search, Link, Unlink, Eye } from 'lucide-react';
import { fetchTestCases } from '@/services/testCaseService';
import { TestCase } from '@/store/testcase-store';
import { RTMEntry, getLinkedTestCases } from '@/services/rtmService';

interface TestCaseLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rtmEntry: RTMEntry | null;
  onLinksUpdated: (rtmEntryId: string, linkedTestCaseIds: string[]) => void;
}

export const TestCaseLinkModal: React.FC<TestCaseLinkModalProps> = ({
  open,
  onOpenChange,
  rtmEntry,
  onLinksUpdated,
}) => {
  const { toast } = useToast();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [linkedTestCaseIds, setLinkedTestCaseIds] = useState<string[]>([]);

  useEffect(() => {
    if (open && rtmEntry) {
      loadTestCases();
      // Initialize with existing linked test cases from backend
      loadLinkedTestCases();
    }
  }, [open, rtmEntry]);

  const loadLinkedTestCases = async () => {
    if (!rtmEntry?.id) return;
    
    try {
      const linkedIds = await getLinkedTestCases(rtmEntry.id);
      setLinkedTestCaseIds(linkedIds);
      console.log('Loaded linked test case IDs from backend:', linkedIds);
    } catch (error) {
      console.error('Error loading linked test cases:', error);
      // Fallback to prop data if available
      setLinkedTestCaseIds(rtmEntry.testCaseIds || []);
    }
  };

  const loadTestCases = async () => {
    setLoading(true);
    try {
      const data = await fetchTestCases();
      setTestCases(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading test cases:', error);
      toast({
        title: 'Error',
        description: 'Failed to load test cases',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTestCases = testCases.filter(tc =>
    tc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tc.featureId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tc.id?.toString().includes(searchTerm)
  );

  const handleTestCaseToggle = (testCaseId: string, checked: boolean) => {
    if (checked) {
      setLinkedTestCaseIds(prev => [...prev, testCaseId]);
    } else {
      setLinkedTestCaseIds(prev => prev.filter(id => id !== testCaseId));
    }
  };

  const handleSave = () => {
    if (!rtmEntry?.id) return;
    
    onLinksUpdated(rtmEntry.id, linkedTestCaseIds);
    onOpenChange(false);
    
    toast({
      title: 'Success',
      description: `Linked ${linkedTestCaseIds.length} test cases to requirement`,
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Passed': return 'default';
      case 'Failed': return 'destructive';
      case 'Blocked': return 'secondary';
      case 'Skipped': return 'outline';
      default: return 'outline';
    }
  };

  if (!rtmEntry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Link Test Cases to Requirement
          </DialogTitle>
          <DialogDescription>
            Select test cases to link with "{rtmEntry.mainFeature}" requirement.
            Currently {linkedTestCaseIds.length} test case(s) linked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search test cases by title, feature ID, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Test Cases List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading test cases...
              </div>
            ) : filteredTestCases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No test cases match your search.' : 'No test cases available.'}
              </div>
            ) : (
              filteredTestCases.map((testCase) => {
                const isLinked = linkedTestCaseIds.includes(testCase.id);
                return (
                  <div
                    key={testCase.id}
                    className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                      isLinked ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <Checkbox
                      checked={isLinked}
                      onCheckedChange={(checked) => 
                        handleTestCaseToggle(testCase.id, checked as boolean)
                      }
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">#{testCase.id}</span>
                        <Badge variant={getStatusBadgeVariant(testCase.status)}>
                          {testCase.status}
                        </Badge>
                        {testCase.featureId && (
                          <Badge variant="outline" className="text-xs">
                            {testCase.featureId}
                          </Badge>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-sm line-clamp-1">
                        {testCase.title}
                      </h4>
                      
                      {testCase.preconditions && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {testCase.preconditions}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => {
                        // You could implement a quick view modal here
                        console.log('View test case:', testCase);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* Summary */}
          {linkedTestCaseIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Link className="h-4 w-4" />
                <span className="font-medium">
                  {linkedTestCaseIds.length} test case(s) will be linked to this requirement
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Links ({linkedTestCaseIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};