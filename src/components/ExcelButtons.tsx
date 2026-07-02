import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useTestCaseStore } from "@/store/testcase-store";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { ChangeEvent, useRef } from "react";

export const ExcelButtons = () => {
  const { testCases, setTestCases } = useTestCaseStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(testCases);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TestCases");
    const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, "testcases.xlsx");
  };

  const importExcel = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws) as any[];
      // Trusting file headers to match store fields
      setTestCases(rows as any);
    };
    reader.readAsArrayBuffer(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={exportExcel}>
        <Download className="w-4 h-4 mr-2" />
        Export Excel
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={importExcel}
      />
      <Button variant="outline" onClick={() => fileRef.current?.click()}>
        <Upload className="w-4 h-4 mr-2" />
        Import Excel
      </Button>
    </div>
  );
};
