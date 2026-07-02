import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { TestCaseImportModal } from "./TestCaseImportModal";
import { toast } from "@/hooks/use-toast";

interface TestCaseExcelButtonsProps {
  onImportComplete?: () => void;
}

export const TestCaseExcelButtons = ({ onImportComplete }: TestCaseExcelButtonsProps) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Import Excel
        </Button>
      </div>

      <TestCaseImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={async () => {
          if (onImportComplete) {
            await onImportComplete();
          }
          toast({
            title: "Success",
            description: "Test cases imported and refreshed"
          });
        }}
      />
    </>
  );
};
