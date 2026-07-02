import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { authService } from '@/services/authService';
import { toast } from '@/hooks/use-toast';

type ColumnMapping = Record<string, string>;

interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  failedCount: number;
}

interface TestCaseImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  testPlanId?: string | number;
  requirementId?: string | number;
  onImportComplete?: () => void;
}

const systemFields = [
  { value: 'title', label: 'Title' },
  { value: 'preconditions', label: 'Preconditions' },
  { value: 'testSteps', label: 'Test Steps' },
  { value: 'testData', label: 'Test Data' },
  { value: 'expectedResults', label: 'Expected Results' },
  { value: 'actualResults', label: 'Actual Results' },
  { value: 'status', label: 'Status' },
  { value: 'testType', label: 'Test Type' },
  { value: 'remarks', label: 'Remarks' },
];

export const TestCaseImportModal: React.FC<TestCaseImportModalProps> = ({
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

      const initialMapping: ColumnMapping = {};
      headers.forEach((header) => (initialMapping[header] = ''));
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

      const formData = new FormData();
      formData.append('testPlanId', localTestPlanId);
      formData.append('requirementId', localRequirementId);
      formData.append('excel', file);
      formData.append('columnMapping', JSON.stringify(filteredMapping));

      console.log('FormData contents:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
        } else {
          console.log(`  ${key}:`, value);
        }
      }

      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      console.log('Making request to:', 'https://kiwamitestcloud.com/dashboardapis/api/importtestcases');
      
      const response = await fetch(
        'https://kiwamitestcloud.com/dashboardapis/api/importtestcases',
        {
          method: 'POST',
          headers: {
            Authorization: authToken,
          },
          body: formData,
        }
      );
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `Import failed: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('Import failed:', response.status, errorData);
          errorMessage = errorData.message || errorData.error || errorData.details?.message || errorMessage;
        } catch {
          const errorText = await response.text();
          console.error('Import failed:', response.status, errorText);
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Import response:', result);
      
      let importResult: ImportResult;
      
      // Check if response is a created test case object (has title and no success field)
      if (result.title && result.success === undefined) {
        // Backend returned the created test case, treat as success
        importResult = {
          success: true,
          message: 'Test case imported successfully',
          importedCount: 1,
          failedCount: 0,
        };
      } else if (result.success !== undefined) {
        importResult = result;
      } else if (result.data) {
        importResult = result.data;
      } else {
        importResult = {
          success: result.message?.toLowerCase().includes('success') || false,
          message: result.message || 'Import completed',
          importedCount: result.importedCount || result.imported || 0,
          failedCount: result.failedCount || result.failed || 0,
        };
      }
      
      setImportResult(importResult);

      if (importResult.success) {
        toast({
          title: 'Import Successful',
          description: `Imported: ${importResult.importedCount}, Failed: ${importResult.failedCount}`,
        });
        
        if (onImportComplete) {
          await onImportComplete();
        }
        
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError(importResult.message || 'Import failed');
        toast({
          title: 'Import Failed',
          description: importResult.message || 'Some items failed to import',
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
            Import Test Cases from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file and map columns to system fields
          </DialogDescription>
        </DialogHeader>

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
                  {isImporting ? 'Importing...' : 'Import Test Cases'}
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
