import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { BugReport } from '@/types/bug-report';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  
  // Require authentication
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // GET - Get all bug reports
    if (req.method === 'GET') {
      const { status, severity, priority, assignedTo } = req.query;
      
      const where: any = {};
      
      if (status) where.status = status;
      if (severity) where.severity = severity;
      if (priority) where.priority = priority;
      if (assignedTo) where.assignedTo = assignedTo;

      const bugReports = await prisma.bugReport.findMany({
        where,
        orderBy: {
          dateReported: 'desc',
        },
      });

      return res.status(200).json(bugReports);
    }

    // POST - Create a new bug report
    if (req.method === 'POST') {
      const bugReportData: Omit<BugReport, 'id' | 'dateReported'> = req.body;
      
      // Validate required fields
      if (!bugReportData.title || !bugReportData.module || !bugReportData.shortDescription) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newBugReport = await prisma.bugReport.create({
        data: {
          ...bugReportData,
          dateReported: new Date().toISOString(),
        },
      });

      return res.status(201).json(newBugReport);
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
