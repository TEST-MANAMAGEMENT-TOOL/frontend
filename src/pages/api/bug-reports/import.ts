import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  
  // Require authentication
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const fileBuffer = Buffer.from(req.body.file, 'base64');
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Map Excel data to bug report format
    const bugReports = jsonData.map((row: any) => ({
      title: row['Title'] || '',
      module: row['Module'] || '',
      shortDescription: row['Short Description'] || '',
      severity: row['Severity'] || 'Medium',
      priority: row['Priority'] || 'Medium',
      status: row['Status'] || 'Open',
      type: row['Type'] || 'Functional',
      reportedBy: row['Reported By'] || session.user?.name || 'Unknown',
      dateReported: row['Date Reported'] || new Date().toISOString(),
      stepsToReproduce: row['Steps to Reproduce'] || '',
      expectedResults: row['Expected Results'] || '',
      actualResults: row['Actual Results'] || '',
      assignedTo: row['Assigned To'] || '',
      environment: row['Environment'] || '',
      browser: row['Browser'] || '',
      os: row['OS'] || '',
      buildVersion: row['Build Version'] || '',
      comments: row['Comments'] || '',
      remarks: row['Remarks'] || '',
      dateResolved: row['Date Resolved'] || null,
      resolution: row['Resolution'] || null,
      relatedIssues: row['Related Issues'] ? String(row['Related Issues']).split(',').map(s => s.trim()) : [],
      timeSpent: row['Time Spent'] || '',
    }));

    // Validate required fields
    for (const report of bugReports) {
      if (!report.title || !report.module || !report.shortDescription) {
        return res.status(400).json({ 
          error: 'Missing required fields in one or more rows',
          report,
        });
      }
    }

    // Insert all bug reports in a transaction
    const result = await prisma.$transaction(
      bugReports.map(report => 
        prisma.bugReport.create({
          data: report,
        })
      )
    );

    return res.status(201).json({
      message: `${result.length} bug reports imported successfully`,
      count: result.length,
    });
  } catch (error) {
    console.error('Import Error:', error);
    return res.status(500).json({ 
      error: 'Failed to import bug reports',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
