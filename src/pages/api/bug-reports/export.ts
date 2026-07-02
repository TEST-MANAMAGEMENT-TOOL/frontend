import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  
  // Require authentication
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Get all bug reports
    const bugReports = await prisma.bugReport.findMany({
      orderBy: {
        dateReported: 'desc',
      },
    });

    // Format data for Excel
    const exportData = bugReports.map(report => ({
      'ID': report.id,
      'Title': report.title,
      'Module': report.module,
      'Short Description': report.shortDescription,
      'Severity': report.severity,
      'Priority': report.priority,
      'Status': report.status,
      'Type': report.type,
      'Reported By': report.reportedBy,
      'Date Reported': report.dateReported,
      'Assigned To': report.assignedTo,
      'Environment': report.environment,
      'Browser': report.browser,
      'OS': report.os,
      'Build Version': report.buildVersion,
      'Steps to Reproduce': report.stepsToReproduce,
      'Expected Results': report.expectedResults,
      'Actual Results': report.actualResults,
      'Comments': report.comments,
      'Remarks': report.remarks,
      'Date Resolved': report.dateResolved || '',
      'Resolution': report.resolution || '',
      'Related Issues': report.relatedIssues?.join(', ') || '',
      'Time Spent': report.timeSpent || '',
    }));

    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const wscols = [
      { wch: 10 }, // ID
      { wch: 30 }, // Title
      { wch: 20 }, // Module
      { wch: 40 }, // Short Description
      { wch: 10 }, // Severity
      { wch: 10 }, // Priority
      { wch: 12 }, // Status
      { wch: 15 }, // Type
      { wch: 15 }, // Reported By
      { wch: 20 }, // Date Reported
      { wch: 15 }, // Assigned To
      { wch: 20 }, // Environment
      { wch: 15 }, // Browser
      { wch: 15 }, // OS
      { wch: 15 }, // Build Version
      { wch: 40 }, // Steps to Reproduce
      { wch: 30 }, // Expected Results
      { wch: 30 }, // Actual Results
      { wch: 30 }, // Comments
      { wch: 30 }, // Remarks
      { wch: 15 }, // Date Resolved
      { wch: 20 }, // Resolution
      { wch: 20 }, // Related Issues
      { wch: 15 }, // Time Spent
    ];
    ws['!cols'] = wscols;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Bug Reports');

    // Generate the Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename=bug-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Send the Excel file
    return res.status(200).send(excelBuffer);
  } catch (error) {
    console.error('Export Error:', error);
    return res.status(500).json({ 
      error: 'Failed to export bug reports',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
