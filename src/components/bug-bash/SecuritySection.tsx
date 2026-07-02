import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Trash2, Pencil, X, Check, ShieldAlert } from 'lucide-react';
import { BugBashSecurityItem } from '@/types/bug-bash';
import { Input } from '@/components/ui/input';

interface SecuritySectionProps {
  vulnerabilities: BugBashSecurityItem[];
  onAdd: (vulnerability: Omit<BugBashSecurityItem, 'id'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<BugBashSecurityItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const SecuritySection: React.FC<SecuritySectionProps> = ({ 
  vulnerabilities = [], 
  onAdd, 
  onUpdate, 
  onDelete,
  isLoading = false 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newVulnerability, setNewVulnerability] = useState<Omit<BugBashSecurityItem, 'id' | 'createdAt' | 'updatedAt' | 'comments'>>({
    title: '',
    description: '',
    severity: 'medium',
    status: 'reported',
    reporterId: 'current-user',
    endpoint: '',
    impact: '',
    stepsToReproduce: [],
    recommendations: [],
    owaspCategory: '',
    attachments: [],
    cvssScore: 0
  });

  const [editValue, setEditValue] = useState<Omit<BugBashSecurityItem, 'id' | 'createdAt' | 'updatedAt' | 'comments'>>();
  const currentVulnerability = viewingId || editingId 
    ? vulnerabilities.find(v => v.id === (viewingId || editingId))
    : null;

  const handleAddClick = () => {
    setIsAdding(true);
    setNewVulnerability({
      title: '',
      description: '',
      severity: 'medium',
      status: 'reported',
      reporterId: 'current-user',
      endpoint: '',
      impact: '',
      stepsToReproduce: [],
      recommendations: [],
      owaspCategory: '',
      attachments: [],
      cvssScore: 0
    });
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
  };

  const handleAddVulnerability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVulnerability.title.trim() || !newVulnerability.description.trim() || !newVulnerability.endpoint.trim()) return;
    
    try {
      await onAdd({
        ...newVulnerability,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        comments: []
      });
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding security vulnerability:', error);
    }
  };

  const startEditing = (vulnerability: BugBashSecurityItem) => {
    setEditingId(vulnerability.id);
    setViewingId(null);
    const { id, createdAt, updatedAt, comments, ...rest } = vulnerability;
    setEditValue(rest);
  };

  const viewDetails = (vulnerability: BugBashSecurityItem) => {
    setViewingId(vulnerability.id);
    setEditingId(null);
    const { id, createdAt, updatedAt, comments, ...rest } = vulnerability;
    setEditValue(rest);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setViewingId(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editValue) return;
    try {
      await onUpdate(editingId, editValue);
      cancelEdit();
    } catch (error) {
      console.error('Error updating security vulnerability:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this security vulnerability?')) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Error deleting security vulnerability:', error);
      }
    }
  };

  const getSeverityBadge = (severity: string) => {
    const severityClasses = {
      low: 'bg-primary/15 text-primary border-primary/20',
      medium: 'bg-warning/15 text-warning border-warning/20',
      high: 'bg-orange-500/15 text-orange-500 border-orange-500/20',
      critical: 'bg-destructive/15 text-destructive border-destructive/20'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs border ${
        severityClasses[severity as keyof typeof severityClasses] || 'bg-muted text-muted-foreground border-border'
      }`}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return <div>Loading security vulnerabilities...</div>;
  }

  return (
    <Card className="mt-4">
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Security Vulnerabilities</CardTitle>
          <Button 
            size="sm" 
            onClick={handleAddClick} 
            disabled={isAdding || isLoading}
            className="gap-2"
          >
            <ShieldAlert className="h-4 w-4" />
            Add Vulnerability
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Add New Vulnerability Form */}
        {isAdding && (
          <form onSubmit={handleAddVulnerability} className="mb-6 p-4 border rounded-lg bg-muted/10">
            <h3 className="font-medium mb-4 flex items-center">
              <ShieldAlert className="h-5 w-5 mr-2 text-red-600" />
              Report New Security Vulnerability
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={newVulnerability.title}
                  onChange={(e) => setNewVulnerability({...newVulnerability, title: e.target.value})}
                  placeholder="Brief title of the vulnerability"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Severity *</label>
                <select
                  value={newVulnerability.severity}
                  onChange={(e) => setNewVulnerability({...newVulnerability, severity: e.target.value as any})}
                  className="w-full p-2 border border-input bg-background text-foreground rounded focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={newVulnerability.status}
                  onChange={(e) => setNewVulnerability({...newVulnerability, status: e.target.value as any})}
                  className="w-full p-2 border border-input bg-background text-foreground rounded focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="reported">Reported</option>
                  <option value="investigating">Investigating</option>
                  <option value="fixing">Fixing</option>
                  <option value="fixed">Fixed</option>
                  <option value="wont-fix">Won't Fix</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">OWASP Category</label>
                <Input
                  value={newVulnerability.owaspCategory || ''}
                  onChange={(e) => setNewVulnerability({...newVulnerability, owaspCategory: e.target.value})}
                  placeholder="e.g., A1: Injection"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Endpoint *</label>
                <Input
                  value={newVulnerability.endpoint}
                  onChange={(e) => setNewVulnerability({...newVulnerability, endpoint: e.target.value})}
                  placeholder="e.g., /api/v1/users"
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Description *</label>
                <textarea
                  value={newVulnerability.description}
                  onChange={(e) => setNewVulnerability({...newVulnerability, description: e.target.value})}
                  className="w-full p-2 border border-input bg-background text-foreground rounded min-h-[100px] focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Detailed description of the vulnerability..."
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Impact</label>
                <textarea
                  value={newVulnerability.impact || ''}
                  onChange={(e) => setNewVulnerability({...newVulnerability, impact: e.target.value})}
                  className="w-full p-2 border border-input bg-background text-foreground rounded min-h-[80px] focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="What is the potential impact of this vulnerability?"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Steps to Reproduce</label>
                <textarea
                  value={newVulnerability.stepsToReproduce?.join('\n') || ''}
                  onChange={(e) => setNewVulnerability({...newVulnerability, stepsToReproduce: e.target.value.split('\n')})}
                  className="w-full p-2 border border-input bg-background text-foreground rounded min-h-[100px] focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder={`1. Go to...\n2. Perform action...\n3. Observe...`}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Recommendations</label>
                <textarea
                  value={newVulnerability.recommendations?.join('\n') || ''}
                  onChange={(e) => setNewVulnerability({...newVulnerability, recommendations: e.target.value.split('\n')})}
                  className="w-full p-2 border border-input bg-background text-foreground rounded min-h-[80px] focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder={`1. Implement input validation\n2. Use parameterized queries\n3. ...`}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">CVSS Score</label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={newVulnerability.cvssScore || ''}
                  onChange={(e) => setNewVulnerability({...newVulnerability, cvssScore: parseFloat(e.target.value)})}
                  placeholder="e.g., 7.5"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Attachments (URLs, one per line)</label>
                <textarea
                  value={newVulnerability.attachments?.join('\n') || ''}
                  onChange={(e) => setNewVulnerability({...newVulnerability, attachments: e.target.value.split('\n')})}
                  className="w-full p-2 border border-input bg-background text-foreground rounded min-h-[60px] focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="https://example.com/screenshot1.png\nhttps://example.com/logs.txt"
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
              <Button type="submit" variant="destructive" disabled={isLoading}>
                {isLoading ? 'Submitting...' : (
                  <>
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Report Vulnerability
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
                <TableHead>Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vulnerabilities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    No security vulnerabilities found
                  </TableCell>
                </TableRow>
              ) : (
                vulnerabilities.map((vulnerability) => (
                  <TableRow key={vulnerability.id}>
                    <TableCell className="font-medium">{vulnerability.title}</TableCell>
                    <TableCell>
                      {getSeverityBadge(vulnerability.severity)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${
                        vulnerability.status === 'reported' ? 'bg-warning/15 text-warning border-warning/20' :
                        vulnerability.status === 'investigating' || vulnerability.status === 'fixing' ? 'bg-primary/15 text-primary border-primary/20' :
                        vulnerability.status === 'fixed' ? 'bg-success/15 text-success border-success/20' :
                        'bg-muted text-muted-foreground border-border'
                      }`}>
                        {vulnerability.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            viewDetails(vulnerability);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(vulnerability);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(vulnerability.id);
                          }}
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
        {(viewingId || editingId) && currentVulnerability && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card text-card-foreground border border-border shadow-2xl p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium flex items-center">
                  <ShieldAlert className="h-5 w-5 mr-2 text-amber-500" />
                  {editingId ? 'Edit' : 'View'} Vulnerability: {currentVulnerability.title}
                </h3>
                <Button variant="ghost" size="icon" onClick={cancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    {editingId ? (
                      <Input
                        type="text"
                        value={editValue?.title || ''}
                        onChange={(e) => editValue && setEditValue({...editValue, title: e.target.value})}
                        className="w-full p-2 border rounded"
                      />
                    ) : (
                      <div className="p-2 bg-muted/20 rounded">{currentVulnerability.title}</div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Severity</label>
                    {editingId ? (
                      <select
                        value={editValue?.severity || 'medium'}
                        onChange={(e) => editValue && setEditValue({...editValue, severity: e.target.value as any})}
                        className="w-full p-2 border border-input bg-background text-foreground rounded focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    ) : (
                      <div className="p-2">
                        {getSeverityBadge(currentVulnerability.severity)}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    {editingId ? (
                      <select
                        value={editValue?.status || 'reported'}
                        onChange={(e) => editValue && setEditValue({...editValue, status: e.target.value as any})}
                        className="w-full p-2 border border-input bg-background text-foreground rounded focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="reported">Reported</option>
                        <option value="investigating">Investigating</option>
                        <option value="fixing">Fixing</option>
                        <option value="fixed">Fixed</option>
                        <option value="wont-fix">Won't Fix</option>
                      </select>
                    ) : (
                      <div className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${
                          currentVulnerability?.status === 'reported' ? 'bg-warning/15 text-warning border-warning/20' :
                          currentVulnerability?.status === 'investigating' || currentVulnerability?.status === 'fixing' ? 'bg-primary/15 text-primary border-primary/20' :
                          currentVulnerability?.status === 'fixed' ? 'bg-success/15 text-success border-success/20' :
                          'bg-muted text-muted-foreground border-border'
                        }`}>
                          {currentVulnerability?.status}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    {editingId ? (
                      <textarea
                        value={editValue?.description || ''}
                        onChange={(e) => editValue && setEditValue({...editValue, description: e.target.value})}
                        className="w-full p-2 border border-input bg-background text-foreground rounded min-h-[100px] focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    ) : (
                      <div className="p-2 bg-muted/20 rounded whitespace-pre-line">
                        {currentVulnerability.description || 'No description provided'}
                      </div>
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

export default SecuritySection;