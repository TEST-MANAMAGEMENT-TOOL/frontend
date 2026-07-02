import { BugReport } from "@/types/bug-report";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dispatch, SetStateAction, useEffect } from "react";

interface BugReportDetailsProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  bug: BugReport | null;
  onEdit: () => void;
}

export const BugReportDetails = ({
  open,
  onOpenChange,
  bug,
  onEdit,
}: BugReportDetailsProps) => {
  // Debug effect to log when the component receives new props
  useEffect(() => {
    console.log('BugReportDetails - Received props:', { open, bug });
  }, [open, bug]);

  if (!bug) {
    console.log('BugReportDetails - No bug data provided');
    return null;
  }

  console.log('BugReportDetails - Rendering with bug:', bug);

  const getSeverityBadge = (severity: string) => {
    if (!severity) return <Badge className="bg-muted text-muted-foreground border border-border">Not Set</Badge>;
    
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
    if (!priority) return <Badge className="bg-muted text-muted-foreground border border-border">Not Set</Badge>;
    
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Bug Report Details</span>
            <span className="text-sm font-normal text-muted-foreground">
              {bug.id || 'No ID'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Basic Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title:</span>
                  <span className="font-medium">{bug.title || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Module:</span>
                  <span>{bug.module || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Severity:</span>
                  <span>{getSeverityBadge(bug.severity || '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority:</span>
                  <span>{getPriorityBadge(bug.priority || '')}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Assignment & Dates</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reported By:</span>
                  <span>{bug.reportedBy || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date Reported:</span>
                  <span>{bug.dateReported || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned To:</span>
                  <span>{bug.assignedTo || 'Unassigned'}</span>
                </div>
                {bug.dateResolved && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date Resolved:</span>
                    <span>{bug.dateResolved}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          {bug.shortDescription && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  {bug.shortDescription}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Steps to Reproduce */}
          {bug.stepsToReproduce && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Steps to Reproduce</h3>
                <div className="bg-muted/50 p-3 rounded-md">
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {bug.stepsToReproduce}
                  </pre>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Expected vs Actual Results */}
          {(bug.expectedResults || bug.actualResults) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bug.expectedResults && (
                <div>
                  <h3 className="font-semibold mb-2">Expected Results</h3>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    {bug.expectedResults}
                  </p>
                </div>
              )}
              {bug.actualResults && (
                <div>
                  <h3 className="font-semibold mb-2">Actual Results</h3>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    {bug.actualResults}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Additional Information */}
          {(bug.comments || (bug.attachments && bug.attachments.length > 0)) && <Separator />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bug.comments && (
              <div>
                <h3 className="font-semibold mb-2">Additional Comments</h3>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  {bug.comments}
                </p>
              </div>
            )}
            
            {Array.isArray(bug.attachments) && bug.attachments.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Attachments</h3>
                <div className="space-y-2">
                  {bug.attachments.map((attachment, index) => {
                    const url = typeof attachment === 'string' ? attachment : attachment?.url;
                    const name = (typeof attachment === 'string' 
                      ? `Attachment ${index + 1}` 
                      : attachment?.name) || `Attachment ${index + 1}`;
                    
                    return url ? (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:underline"
                      >
                        {name}
                      </a>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
