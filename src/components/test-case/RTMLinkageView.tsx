import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Link, ExternalLink, Eye } from 'lucide-react';
import { RTMEntry, getRTMEntriesForTestCase } from '@/services/rtmService';
import { useToast } from '@/hooks/use-toast';

interface RTMLinkageViewProps {
  testCaseId: string;
  className?: string;
}

export const RTMLinkageView: React.FC<RTMLinkageViewProps> = ({
  testCaseId,
  className = '',
}) => {
  const { toast } = useToast();
  const [rtmEntries, setRtmEntries] = useState<RTMEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (testCaseId) {
      loadRTMEntries();
    }
  }, [testCaseId]);

  const loadRTMEntries = async () => {
    setLoading(true);
    try {
      const entries = await getRTMEntriesForTestCase(testCaseId);
      setRtmEntries(entries);
    } catch (error) {
      console.error('Error loading RTM entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load linked requirements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Link className="h-4 w-4" />
            Linked Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (rtmEntries.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Link className="h-4 w-4" />
            Linked Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            No requirements linked to this test case.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Link className="h-4 w-4" />
          Linked Requirements ({rtmEntries.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rtmEntries.map((entry, index) => (
          <div key={entry.id || index}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {entry.mainFeature}
                  </Badge>
                  {entry.subFeature && (
                    <Badge variant="secondary" className="text-xs">
                      {entry.subFeature}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm font-medium line-clamp-2">
                  {entry.description}
                </p>
                
                {entry.remarks && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {entry.remarks}
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-6 w-6"
                onClick={() => {
                  // Navigate to RTM page with this entry highlighted
                  window.open(`/rtm?highlight=${entry.id}`, '_blank');
                }}
                title="View in RTM"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
            
            {index < rtmEntries.length - 1 && (
              <Separator className="mt-3" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};