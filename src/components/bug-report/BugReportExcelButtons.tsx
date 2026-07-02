import { useState } from "react";
import { useBugReportStore } from "@/store/bug-report-store";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { DefectImportModal } from "./DefectImportModal";
import { toast } from "@/hooks/use-toast";

import { BugReport } from "@/types/bug-report";
import { bugReportService } from "@/services/bugReportService";

export const BugReportExcelButtons = ({ data }: { data?: BugReport[] }) => {
  const { exportBugReports, fetchBugReports } = useBugReportStore();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => exportBugReports(data)}>
          <Download className="w-4 h-4 mr-2" />
          Export Excel
        </Button>
        <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Import Excel
        </Button>
      </div>

      <DefectImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={async (imported) => {
          if (imported) {
            const { addBugReportToStore } = useBugReportStore.getState();
            const defects = Array.isArray(imported) ? imported : [imported];
            defects.forEach(defect => {
              if (defect) {
                const normalized = bugReportService.normalizeBugReport(defect);
                addBugReportToStore(normalized);
              }
            });
          }
          await fetchBugReports();
          toast({
            title: "Success",
            description: "Defects imported successfully"
          });
        }}
      />
    </>
  );
};
