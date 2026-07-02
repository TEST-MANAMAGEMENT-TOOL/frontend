import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { bugBashFunctionalService } from '@/services/bugBashFunctionalService';
import { toast } from '@/hooks/use-toast';

type ColumnMapping = Record<string, string>;

interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  failedCount: number;
}

interface FeatureImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bugBashId: string;
  onImportComplete?: () => void;
}

const systemFields = [
  { value: 'title', label: 'Title' },
  { value: 'description', label: 'Description' },
  { value: 'impact', label: 'Impact' },
  { value: 'business_value', label: 'Why Its Useful' },
  { value: 'feature', label: 'Feature Name' },
];

export const FeatureImportModal: React.FC<FeatureImportModalProps> = ({
  isOpen,
  onClose,
  bugBashId,
  onImportComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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
      console.log('Bug Bash ID:', bugBashId);
      console.log('File:', file.name, file.size, 'bytes');

      // Check if at least one column is mapped
      if (Object.keys(filteredMapping).length === 0) {
        setError('Please map at least one column before importing');
        setIsImporting(false);
        return;
      }

      // Check if required fields are mapped
      const requiredFields = ['title'];
      const mappedFields = Object.values(filteredMapping);
      const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
      
      if (missingFields.length > 0) {
        setError(`Required fields not mapped: ${missingFields.join(', ')}`);
        setIsImporting(false);
        return;
      }

      // Use the service function instead of direct fetch
      const result = await bugBashFunctionalService.importFeatures(bugBashId, file, filteredMapping);
      
      console.log('Import result:', result);
      
      // Backend sometimes returns success=false but message says "successfully"
      // Check both the success flag and the message content
      const isActuallySuccessful = !!(result.success || 
        (result.message && result.message.toLowerCase().includes('success')));
      
      setImportResult({
        ...result,
        success: isActuallySuccessful,
        importedCount: result.importedCount || 0,
        failedCount: result.failedCount || 0,
      });

      if (isActuallySuccessful) {
        toast({
          title: 'Import Successful',
          description: result.message || `Imported: ${result.importedCount || 0}, Failed: ${result.failedCount || 0}`,
        });
        
        if (onImportComplete) {
          onImportComplete();
        }
        
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(result.message || 'Import failed');
        toast({
          title: 'Import Failed',
          description: result.message || 'Some items failed to import',
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
            Import Features from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file and map columns to system fields
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                  {isImporting ? 'Importing...' : 'Import Features'}
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
