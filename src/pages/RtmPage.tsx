import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit, Download, Upload, Plus, Eye, Link } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { RTMEntry, fetchRTMEntries, createRTMEntry, updateRTMEntry, deleteRTMEntry, linkTestCasesToRTM, getLinkedTestCases } from "@/services/rtmService";
import { fetchTestCases } from "@/services/testCaseService";
import { fetchTestPlans } from "@/services/testPlanService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RequirementImportModal } from "@/components/rtm/RequirementImportModal";
import { TestCaseLinkModal } from "@/components/rtm/TestCaseLinkModal";

const RtmPage = () => {
  const [entries, setEntries] = useState<RTMEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [linkProgress, setLinkProgress] = useState({ current: 0, total: 0 });
  const [testCases, setTestCases] = useState<any[]>([]);
  const [testPlans, setTestPlans] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const [form, setForm] = useState<Omit<RTMEntry, 'id'>>({
    reqId: "",
    mainFeature: "",
    subFeature: "",
    description: "",
    remarks: "",
    status: "",
    testStatus: "",
    actions: "",
    testPlanId: ""
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<RTMEntry | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkingEntry, setLinkingEntry] = useState<RTMEntry | null>(null);

  // Fetch entries and test cases from API on component mount
  useEffect(() => {
    fetchEntries();
    fetchAvailableTestCases();
    fetchAvailableTestPlans();
  }, []);

  const fetchAvailableTestCases = async () => {
    try {
      const data = await fetchTestCases();
      setTestCases(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching test cases:', error);
    }
  };

  const fetchAvailableTestPlans = async () => {
    try {
      const data = await fetchTestPlans();
      console.log('Fetched test plans:', data);
      setTestPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching test plans:', error);
    }
  };

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const data = await fetchRTMEntries();
      console.log('=== FETCH ENTRIES DEBUG ===');
      console.log('Fetched RTM entries in component:', data);
      console.log('New entries count:', data.length);
      
      if (data.length > 0) {
        console.log('First entry from API:', data[0]);
        console.log('Last entry from API:', data[data.length - 1]);
      }
      
      // Merge local links from localStorage if they exist (local client-side fallback links)
      const storageKey = 'rtm_testcase_links';
      let localLinks: Record<string, any[]> = {};
      try {
        localLinks = JSON.parse(localStorage.getItem(storageKey) || '{}');
      } catch (e) {
        console.error('Failed to parse rtm_testcase_links from localStorage:', e);
      }

      const mergedData = data.map((entry: RTMEntry) => {
        if (!entry.id) return entry;
        const entryLocalLinks = localLinks[entry.id] || [];
        // Combine backend-provided and local fallback links (remove duplicates)
        const combined = [...new Set([...(entry.testCaseIds || []), ...entryLocalLinks.map(String)])];
        return { ...entry, testCaseIds: combined };
      });

      setEntries(mergedData);
      setCurrentPage(1);
      setLoading(false);
      console.log('=== END DEBUG ===');
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch RTM entries",
        variant: "destructive",
        fill: "outline"
      } as any);
    } finally {
      setLoading(false);
      setLoadingLinks(false);
    }
  };

  const handleAddEntry = async () => {
    try {
      // Prepare entry with both legacy testCaseId and new testCaseIds
      const entryToSave = {
        ...form,
        testCaseIds: editingIndex !== null ? entries[editingIndex]?.testCaseIds || [] : form.testCaseIds || [],
      };

      console.log('handleAddEntry called with form:', form);
      console.log('Entry to save:', entryToSave);
      console.log('Editing index:', editingIndex);

      if (editingIndex !== null && entries[editingIndex]?.id) {
        // Update existing entry
        console.log('Updating existing entry with ID:', entries[editingIndex].id);
        const updatedEntry = await updateRTMEntry(entries[editingIndex].id!, entryToSave);
        console.log('Update successful, received:', updatedEntry);
        
        setEntries(prev => prev.map((e, idx) => idx === editingIndex ? updatedEntry : e));
        setEditingIndex(null);
        
        toast({
          title: "Success",
          description: "RTM entry updated successfully",
        });
      } else {
        // Add new entry
        console.log('Creating new entry');
        const newEntry = await createRTMEntry(entryToSave);
        console.log('Create successful, received:', newEntry);
        
        setEntries(prev => [...prev, newEntry]);
        
        toast({
          title: "Success",
          description: "RTM entry added successfully",
        });
      }
      
      // Reset form and close dialog instantly
      setForm({
        reqId: "",
        mainFeature: "",
        subFeature: "",
        description: "",
        remarks: "",
        status: "",
        testStatus: "",
        actions: "",
        testPlanId: ""
      });
      setShowForm(false);

      // Proactively fetch updated list in the background to sync with server
      console.log('Fetching updated list in the background...');
      fetchEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save RTM entry",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string | undefined, index: number) => {
    if (!id) {
      console.error('Cannot delete entry: No ID provided');
      toast({
        title: "Error",
        description: "Cannot delete entry: Missing entry ID",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteRTMEntry(id);
      const updatedEntries = entries.filter((_, i) => i !== index);
      setEntries(updatedEntries);
      
      toast({
        title: "Success",
        description: "RTM entry deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete RTM entry",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (index: number) => {
    const entryToEdit = entries[index];
    setForm({
      reqId: entryToEdit.reqId || "",
      mainFeature: entryToEdit.mainFeature || "",
      subFeature: entryToEdit.subFeature || "",
      description: entryToEdit.description || "",
      remarks: entryToEdit.remarks || "",
      status: entryToEdit.status || "",
      testStatus: entryToEdit.testStatus || "",
      actions: entryToEdit.actions || "",
      testPlanId: entryToEdit.testPlanId || ""
    });
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm({
      reqId: "",
      mainFeature: "",
      subFeature: "",
      description: "",
      remarks: "",
      status: "",
      testStatus: "",
      actions: "",
      testPlanId: ""
    });
    setEditingIndex(null);
    setShowForm(false);
  };

  const handleExportToExcel = async () => {
    if (entries.length === 0) {
      alert("No data to export");
      return;
    }

    try {
      // Dynamically import XLSX and file-saver only when needed
      const [XLSX, { saveAs }] = await Promise.all([
        import('xlsx'),
        import('file-saver')
      ]);

      // Prepare data for export
      const exportData = entries.map(entry => ({
        "Req ID": entry.reqId,
        "Main Feature": entry.mainFeature,
        "Sub Feature": entry.subFeature,
        "Description": entry.description,
        "Status": entry.status,
        "Test Status": entry.testStatus,
        "Actions": entry.actions,
        "Linked Test Cases": entry.testCaseIds?.join(', '),
        "Remarks": entry.remarks
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "RTM");
      
      // Generate Excel file
      const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      
      // Download the file
      saveAs(blob, "requirements_traceability_matrix.xlsx");
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export RTM entries",
        variant: "destructive",
      });
    }
  };

  const handleImportFromExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Logic to import entries from Excel
    const file = event.target.files?.[0];
    if (file) {
      console.log("Import from Excel:", file);
      // In a real implementation, you would parse the Excel file
      // and set the entries state with the parsed data
    }
  };

  const openView = (entry: RTMEntry) => {
    setViewEntry(entry);
    setViewOpen(true);
  };

  const openLinkModal = (entry: RTMEntry) => {
    setLinkingEntry(entry);
    setIsLinkModalOpen(true);
  };

  const handleLinksUpdated = async (rtmEntryId: string, linkedTestCaseIds: string[]) => {
    try {
      await linkTestCasesToRTM(rtmEntryId, linkedTestCaseIds);
      
      // Update the local state to reflect the changes
      setEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === rtmEntryId 
            ? { ...entry, testCaseIds: linkedTestCaseIds }
            : entry
        )
      );
      
      toast({
        title: "Success",
        description: "Test case links updated successfully",
      });
    } catch (error) {
      console.error('Error updating test case links:', error);
      toast({
        title: "Error",
        description: "Failed to update test case links",
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const displayedEntries = entries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Requirements Traceability Matrix</h1>
          <p className="text-muted-foreground">Manage and track requirements with their corresponding test cases</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            console.log('Manual refresh triggered');
            setRefreshKey(prevRefreshKey => prevRefreshKey + 1);
            fetchEntries();
          }}>
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportToExcel}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button 
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Entry
          </Button>
        </div>
      </div>

      <Card key={refreshKey}>
        <CardHeader>
          <CardTitle>RTM Entries</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} found`}
            {loadingLinks && (
              <div className="mt-2 text-sm text-blue-600">
                Loading test case links... ({linkProgress.current}/{linkProgress.total})
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading RTM entries...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Req ID</TableHead>
                    <TableHead className="min-w-[150px]">Main Feature</TableHead>
                    <TableHead className="min-w-[120px]">Sub Feature</TableHead>
                    <TableHead className="min-w-[250px]">Description</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[100px]">Test Status</TableHead>
                    <TableHead className="min-w-[100px]">Linked Tests</TableHead>
                    <TableHead className="min-w-[200px]">Remarks</TableHead>
                    <TableHead className="text-right min-w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No entries found. Add your first requirement traceability entry by clicking the "Add New Entry" button.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedEntries.map((entry, index) => (
                      <TableRow key={entry.id || index} className="hover:bg-muted/50">
                        <TableCell>{entry.reqId || '-'}</TableCell>
                        <TableCell className="font-medium">{entry.mainFeature}</TableCell>
                        <TableCell>{entry.subFeature || '-'}</TableCell>
                        <TableCell>
                          <div className="max-w-md whitespace-normal break-words">
                            {entry.description}
                          </div>
                        </TableCell>
                        <TableCell>{entry.status || '-'}</TableCell>
                        <TableCell>{entry.testStatus || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {loadingLinks && !entry.testCaseIds ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs">Loading...</span>
                              </div>
                            ) : (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  {entry.testCaseIds?.length || 0} linked
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openLinkModal(entry)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Link className="w-3 h-3 mr-1" />
                                  Manage
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs whitespace-normal break-words">
                            {entry.remarks || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openView(entry)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(index)}
                              title="Edit Entry"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => entry.id && handleDelete(entry.id, index)}
                              title="Delete Entry"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between gap-4 mt-4 px-2 text-sm text-muted-foreground">
                <div>
                  Showing {displayedEntries.length} of {entries.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Entry Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Entry" : "Add New Entry"}</DialogTitle>
            <DialogDescription>
              {editingIndex !== null 
                ? "Update the requirement traceability entry" 
                : "Add a new requirement traceability entry"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              <div className="space-y-2">
                <Label htmlFor="testPlanId">Test Plan *</Label>
                <Select
                  value={form.testPlanId}
                  onValueChange={(value) => setForm({ ...form, testPlanId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select test plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {testPlans.length === 0 ? (
                      <SelectItem value="none" disabled>No test plans available</SelectItem>
                    ) : (
                      testPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name || plan.title || plan.id}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reqId">Requirement ID</Label>
                <Input
                  id="reqId"
                  value={form.reqId}
                  onChange={(e) => setForm({ ...form, reqId: e.target.value })}
                  placeholder="REQ-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainFeature">Main Feature *</Label>
                <Input
                  id="mainFeature"
                  value={form.mainFeature}
                  onChange={(e) => setForm({ ...form, mainFeature: e.target.value })}
                  placeholder="Authentication"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subFeature">Sub Feature</Label>
                <Input
                  id="subFeature"
                  value={form.subFeature}
                  onChange={(e) => setForm({ ...form, subFeature: e.target.value })}
                  placeholder="Login Flow"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  placeholder="Active, In Progress, Completed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="testStatus">Test Status</Label>
                <Input
                  id="testStatus"
                  value={form.testStatus}
                  onChange={(e) => setForm({ ...form, testStatus: e.target.value })}
                  placeholder="Pass, Fail, Blocked"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actions">Actions</Label>
                <Input
                  id="actions"
                  value={form.actions}
                  onChange={(e) => setForm({ ...form, actions: e.target.value })}
                  placeholder="Ready for testing"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Requirement Description *</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="User should be able to login with valid credentials"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="remarks">Remarks</Label>
                <Input
                  id="remarks"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Additional notes or comments"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddEntry} 
                disabled={!form.mainFeature || !form.description || !form.testPlanId}
              >
                {editingIndex !== null ? "Update Entry" : "Add Entry"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Entry Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>RTM Entry Details</DialogTitle>
            <DialogDescription>Read-only view of the requirement traceability entry.</DialogDescription>
          </DialogHeader>
          {viewEntry && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Req ID</Label>
                  <div className="font-medium">{viewEntry.reqId || '-'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div className="font-medium">{viewEntry.status || '-'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Main Feature</Label>
                  <div className="font-medium">{viewEntry.mainFeature || '-'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Test Status</Label>
                  <div className="font-medium">{viewEntry.testStatus || '-'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Sub Feature</Label>
                  <div className="font-medium">{viewEntry.subFeature || '-'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Actions</Label>
                  <div className="font-medium">{viewEntry.actions || '-'}</div>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Description</Label>
                <div className="whitespace-pre-wrap text-sm">{viewEntry.description || '-'}</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Remarks</Label>
                <div className="whitespace-pre-wrap text-sm">{viewEntry.remarks || '-'}</div>
              </div>
              
              {/* Linked Test Cases */}
              {viewEntry.testCaseIds && viewEntry.testCaseIds.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Linked Test Cases</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewEntry.testCaseIds.map((testCaseId) => (
                      <Badge key={testCaseId} variant="outline">
                        Test Case #{testCaseId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={() => setViewOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Case Link Modal */}
      <TestCaseLinkModal
        open={isLinkModalOpen}
        onOpenChange={setIsLinkModalOpen}
        rtmEntry={linkingEntry}
        onLinksUpdated={handleLinksUpdated}
      />

      {/* Import Modal */}
      <RequirementImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={async () => {
          await fetchEntries();
          toast({ 
            title: "Success", 
            description: "Requirements imported and refreshed" 
          });
        }}
      />
    </div>
  );
};

export default RtmPage;