import { useState } from "react";
import { useQaReportStore } from "@/store/qa-report-store";
import { generateQaReportPdf } from "@/utils/pdf-generator";
import type { QaReport } from "@/types/qa-report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, Plus, Search, Edit, Trash2 } from "lucide-react";
import QaReportForm from "@/components/qa-report/QaReportForm";

const QaReport = () => {
  const { qaReports, deleteQaReport } = useQaReportStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<string | undefined>(undefined);

  const filteredReports = qaReports.filter(report =>
    report.reportTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (id: string) => {
    console.log(`Editing report with ID: ${id}`);
    setEditingReport(id);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    console.log(`Deleting report with ID: ${id}`);
    if (confirm("Are you sure you want to delete this QA report?")) {
      deleteQaReport(id);
    }
  };

  const handleDownload = (report: QaReport) => {
    console.log(`Downloading report: ${report.reportTitle}`);
    console.log('Report data:', report); // Log the report data
    generateQaReportPdf(report);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingReport(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QA Reports</h1>
          <p className="text-muted-foreground">
            Manage and generate quality assurance reports
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>QA Reports</CardTitle>
          <CardDescription>
            View and manage all quality assurance reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search reports..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Title</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>RAG Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No QA reports found. Create your first report to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.reportTitle}
                      </TableCell>
                      <TableCell>{report.group}</TableCell>
                      <TableCell>{report.projectName}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                            report.ragStatus === "Green"
                              ? "bg-success/15 text-success border-success/20"
                              : report.ragStatus === "Amber"
                              ? "bg-warning/15 text-warning border-warning/20"
                              : "bg-destructive/15 text-destructive border-destructive/20"
                          }`}
                        >
                          {report.ragStatus}
                        </span>
                      </TableCell>
                      <TableCell>{report.createdAt}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log('Download button clicked for report:', report.id);
                              handleDownload(report);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(report.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(report.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <QaReportForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        reportId={editingReport}
        onSuccess={handleFormClose}
      />
    </div>
  );
};

export default QaReport;
