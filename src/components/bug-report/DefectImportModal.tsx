import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { bugReportService } from '@/services/bugReportService';
import { fetchTestCases } from '@/services/testCaseService';
import { backend_url } from '@/config';
import { toast } from '@/hooks/use-toast';

type ColumnMapping = Record<string, string>;

interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  failedCount: number;
}

interface DefectImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  testPlanId?: string | number;
  requirementId?: string | number;
  onImportComplete?: (importedDefect?: any) => void;
}

const systemFields = [
  { value: 'TestCaseName', label: 'Test Case' },
  { value: 'title', label: 'Title' },
  { value: 'description', label: 'Description' },
  { value: 'status', label: 'Status' },
  { value: 'assignedtoname', label: 'Assigned To User ID' },
  { value: 'priority', label: 'Priority' },
  { value: 'severity', label: 'Severity' },
  { value: 'stepsToReproduce', label: 'Steps To Reproduce' },
  { value: 'expectedResult', label: 'Expected Result' },
  { value: 'actualResult', label: 'Actual Result' },
  { value: 'attachments', label: 'Attachments' },
  { value: 'environment', label: 'Environment' },
  { value: 'remarks', label: 'Remarks' },
];

export const DefectImportModal: React.FC<DefectImportModalProps> = ({
  isOpen,
  onClose,
  testPlanId,
  requirementId,
  onImportComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [localTestPlanId, setLocalTestPlanId] = useState(testPlanId?.toString() || '');
  const [localRequirementId, setLocalRequirementId] = useState(requirementId?.toString() || '');

  const handleClose = () => {
    setExcelHeaders([]);
    setColumnMapping({});
    setFile(null);
    setImportResult(null);
    setError(null);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setError(null);
    setExcelHeaders([]);
    setColumnMapping({});
    setFile(uploadedFile);
    setImportResult(null);

    if (!uploadedFile.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

      if (json.length === 0) {
        setError('Excel sheet is empty.');
        return;
      }

      const headers = json[0]
        .map((h) => h.toString().trim())
        .filter((h) => h !== ''); // Filter out empty headers
      setExcelHeaders(headers);

      const findMatchingSystemField = (header: string): string => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = systemFields.find(field => {
          const normalizedValue = field.value.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normalizedLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normalizedHeader === normalizedValue || normalizedHeader === normalizedLabel;
        });
        return match ? match.value : '';
      };

      const initialMapping: ColumnMapping = {};
      headers.forEach((header) => {
        initialMapping[header] = findMatchingSystemField(header);
      });
      setColumnMapping(initialMapping);
    } catch (err) {
      setError('Failed to read Excel file. Check format and try again.');
    }
  };

  const handleMappingChange = (excelHeader: string, systemField: string) => {
    setColumnMapping((prev) => ({ ...prev, [excelHeader]: systemField }));
  };

  const getAvailableFields = (currentHeader: string) => {
    const selectedFields = Object.entries(columnMapping)
      .filter(([header, field]) => field && header !== currentHeader)
      .map(([_, field]) => field);
    return systemFields.filter((field) => !selectedFields.includes(field.value));
  };

  const handleImport = async () => {
    if (!file) return;

    setError(null);
    setIsImporting(true);

    try {
      const filteredMapping: ColumnMapping = {};
      Object.entries(columnMapping).forEach(([excelHeader, systemField]) => {
        if (systemField && systemField.trim() !== '') {
          filteredMapping[excelHeader] = systemField;
        }
      });

      console.log('Filtered column mapping:', filteredMapping);
      console.log('Test Plan ID:', localTestPlanId);
      console.log('Requirement ID:', localRequirementId);
      console.log('File:', file.name, file.size, 'bytes');

      if (!localTestPlanId || !localRequirementId) {
        setError('Test Plan ID and Requirement ID are required');
        setIsImporting(false);
        return;
      }

      if (Object.keys(filteredMapping).length === 0) {
        setError('Please map at least one column before importing');
        setIsImporting(false);
        return;
      }

      const requiredFields = ['title'];
      const mappedFields = Object.values(filteredMapping);
      const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
      
      if (missingFields.length > 0) {
        setError(`Required fields not mapped: ${missingFields.join(', ')}`);
        setIsImporting(false);
        return;
      }

      // Fetch test cases to map string titles to database IDs
      let testCases: any[] = [];
      try {
        console.log('Fetching test cases to map Excel titles to actual IDs...');
        testCases = await fetchTestCases();
        console.log(`Successfully fetched ${testCases.length} test cases.`);
      } catch (err) {
        console.warn('Could not fetch test cases for title mapping. Fallback to direct insertion without ID association:', err);
      }

      // Read Excel file client-side
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

      if (json.length <= 1) {
        setError('Excel sheet is empty or contains no data rows.');
        setIsImporting(false);
        return;
      }

      const headers = json[0].map((h) => h?.toString().trim() || '');
      const rows = json.slice(1);
      const activeRows = rows.filter(row => row.some(cell => cell !== ''));

      if (activeRows.length === 0) {
        setError('Excel sheet contains no active data rows.');
        setIsImporting(false);
        return;
      }

      console.log(`Parsing ${activeRows.length} active rows from Excel...`);

      const importedDefects: any[] = [];
      let successCount = 0;
      let failedCount = 0;
      const errorsList: string[] = [];

      for (const row of activeRows) {
        const rawReport: any = {};
        headers.forEach((header, index) => {
          const systemField = filteredMapping[header];
          if (systemField) {
            rawReport[systemField] = row[index];
          }
        });

        // Ensure title is present, skip invalid rows
        if (!rawReport.title || String(rawReport.title).trim() === '') {
          failedCount++;
          errorsList.push('Skipped a row because it was missing a Title.');
          continue;
        }

        // Set default reporter and date if not provided
        if (!rawReport.reportedBy) {
          rawReport.reportedBy = 'Excel Importer';
        }
        if (!rawReport.dateReported) {
          rawReport.dateReported = new Date().toISOString();
        }

        // Normalize first
        const normalized = bugReportService.normalizeBugReport(rawReport);

        // Map TestCaseName to module and relatedIssues
        if (rawReport.TestCaseName) {
          const testCaseStr = String(rawReport.TestCaseName).trim();
          if (testCaseStr) {
            const isNumericId = /^\d+$/.test(testCaseStr);
            if (isNumericId) {
              // If it's already an integer ID, map it directly
              normalized.relatedIssues = [testCaseStr];
              normalized.module = normalized.module || testCaseStr;
            } else {
              // Try to find a matching test case by title
              const matchedTestCase = testCases.find(tc => 
                tc.title && tc.title.trim().toLowerCase() === testCaseStr.toLowerCase()
              );

              if (matchedTestCase) {
                console.log(`Successfully mapped test case "${testCaseStr}" to database ID: ${matchedTestCase.id}`);
                normalized.relatedIssues = [String(matchedTestCase.id)];
                normalized.module = normalized.module || matchedTestCase.title;
              } else {
                console.log(`No test case matching "${testCaseStr}" found. Omitting relatedIssues to prevent database constraint crash, and setting module name only.`);
                normalized.relatedIssues = [];
                normalized.module = normalized.module || testCaseStr;
              }
            }
          }
        }

        // Include Plan & Requirement associations (can be kept as custom properties on the normalized object)
        (normalized as any).testPlanId = localTestPlanId;
        (normalized as any).requirementId = localRequirementId;
        (normalized as any).test_plan_id = localTestPlanId;
        (normalized as any).requirement_id = localRequirementId;

        // Post each row individually to secure 100% DB persistence
        try {
          const created = await bugReportService.createBugReport(normalized);
          importedDefects.push(created);
          successCount++;
        } catch (err: any) {
          failedCount++;
          const msg = err instanceof Error ? err.message : String(err);
          errorsList.push(`Failed to import "${normalized.title}": ${msg}`);
          console.error(`Row import failed for "${normalized.title}":`, err);
        }
      }

      const importResult: ImportResult = {
        success: successCount > 0,
        message: successCount > 0 
          ? `Successfully imported ${successCount} defects.` 
          : 'Failed to import any defects.',
        importedCount: successCount,
        failedCount: failedCount,
      };

      setImportResult(importResult);

      if (successCount > 0) {
        console.log('Import successful, calling onImportComplete with:', importedDefects);
        toast({
          title: 'Import Successful',
          description: `Imported: ${successCount}, Failed: ${failedCount}`,
        });

        if (errorsList.length > 0) {
          console.warn('Some rows failed during import:', errorsList);
        }
        
        if (onImportComplete) {
          console.log('Calling onImportComplete callback...');
          await onImportComplete(importedDefects);
          console.log('onImportComplete callback completed');
        }
        
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        const errorDetail = errorsList.join('\n') || 'Import failed';
        setError(errorDetail);
        toast({
          title: 'Import Failed',
          description: 'No items could be imported. Check mapping and try again.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Import error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Import failed. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Import Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Defects from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file and map columns to system fields
          </DialogDescription>
        </DialogHeader>

        {backend_url !== '/api' && backend_url !== 'https://kiwamitestcloud.com/dashboardapis/api/' && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            <strong>Warning:</strong> The configured backend URL is <code>{backend_url}</code>.
            For defect imports, the expected base URL is <code>https://kiwamitestcloud.com/dashboardapis/api/</code>.
          </div>
        )}

        <div className="space-y-6">
          {/* Test Plan ID and Requirement ID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testPlanId">Test Plan ID *</Label>
              <Input
                id="testPlanId"
                type="text"
                value={localTestPlanId}
                onChange={(e) => setLocalTestPlanId(e.target.value)}
                placeholder="Enter test plan ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requirementId">Requirement ID *</Label>
              <Input
                id="requirementId"
                type="text"
                value={localRequirementId}
                onChange={(e) => setLocalRequirementId(e.target.value)}
                placeholder="Enter requirement ID"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Select Excel File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {excelHeaders.length > 0 && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Map Excel Columns to System Fields</h3>
                <span className="text-xs text-muted-foreground">
                  {Object.values(columnMapping).filter(Boolean).length} of {excelHeaders.length} mapped
                </span>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto border rounded-md p-4">
                {excelHeaders.map((header, index) => (
                  <div key={`${header}-${index}`} className="flex items-center gap-3">
                    <Label className="w-1/3 text-sm font-medium truncate" title={header}>
                      {header || `Column ${index + 1}`}
                    </Label>
                    <select
                      value={columnMapping[header]}
                      onChange={(e) => handleMappingChange(header, e.target.value)}
                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="">-- Select Field --</option>
                      {getAvailableFields(header).map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={isImporting}>
                  {isImporting ? 'Importing...' : 'Import Defects'}
                </Button>
              </div>
            </div>
          )}

          {importResult && (
            <div className="space-y-3 p-4 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">Import Complete</h3>
              </div>
              <div className="space-y-1 text-sm">
                <p>Status: {importResult.success ? 'Success' : 'Failed'}</p>
                <p>Message: {importResult.message}</p>
                <p>Imported: {importResult.importedCount}</p>
                <p>Failed: {importResult.failedCount}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
