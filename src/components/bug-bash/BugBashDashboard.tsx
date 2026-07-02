import React, { useState, useEffect } from 'react';
import { BugBash } from '@/types/bug-bash';
import { BugBashDetailedView } from './BugBashDetailedView';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BugBashDashboardProps {
  bugBash: BugBash;
  onUpdate: (bugBash: BugBash) => void;
}

const migrateBugBash = (oldBugBash: any): BugBash => ({
  ...oldBugBash,
  startDate: oldBugBash.startDate || oldBugBash.startTime || new Date().toISOString(),
  endDate: oldBugBash.endDate || oldBugBash.endTime || new Date().toISOString(),
  status: oldBugBash.status || 'in-progress',
  createdBy: oldBugBash.createdBy || 'unknown',
  createdAt: oldBugBash.createdAt || new Date().toISOString(),
  updatedAt: oldBugBash.updatedAt || new Date().toISOString(),
  functional: oldBugBash.functional || [],
  performance: oldBugBash.performance || [],
  security: oldBugBash.security || []
});

function BugBashDashboard({ bugBash: initialBugBash, onUpdate }: BugBashDashboardProps) {
  const [bugBash, setBugBash] = useState<BugBash>(() => migrateBugBash(initialBugBash));
  const navigate = useNavigate();

  useEffect(() => {
    setBugBash(migrateBugBash(initialBugBash));
  }, [initialBugBash]);

  const handleUpdateBugBash = async (updatedBugBash: BugBash) => {
    const migratedBugBash = migrateBugBash(updatedBugBash);
    setBugBash(migratedBugBash);
    await onUpdate(migratedBugBash);
    return migratedBugBash;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bug Bashes
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{bugBash.title}</h1>
            <p className="text-muted-foreground">{bugBash.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={bugBash.status === 'completed' ? 'default' : 'outline'}>
              {bugBash.status}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/bug-bash/${bugBash.id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {new Date(bugBash.startDate).toLocaleDateString()} - {new Date(bugBash.endDate).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Created By</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">{bugBash.createdBy}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Last Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {new Date(bugBash.updatedAt).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Use the BugBashDetailedView component */}
        <BugBashDetailedView 
          bugBash={bugBash} 
          onUpdate={handleUpdateBugBash} 
        />
      </div>
    </div>
  );
}

export default BugBashDashboard;