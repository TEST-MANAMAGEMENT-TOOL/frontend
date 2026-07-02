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

  const { id } = req.query;

  try {
    // GET - Get a single bug report by ID
    if (req.method === 'GET') {
      const bugReport = await prisma.bugReport.findUnique({
        where: { id: id as string },
      });

      if (!bugReport) {
        return res.status(404).json({ error: 'Bug report not found' });
      }

      return res.status(200).json(bugReport);
    }

    // PATCH - Update a bug report
    if (req.method === 'PATCH') {
      const updates: Partial<BugReport> = req.body;
      
      // Don't allow updating the ID or dateReported
      if (updates.id || updates.dateReported) {
        return res.status(400).json({ error: 'Cannot update ID or dateReported' });
      }

      const updatedBugReport = await prisma.bugReport.update({
        where: { id: id as string },
        data: updates,
      });

      return res.status(200).json(updatedBugReport);
    }

    // DELETE - Delete a bug report
    if (req.method === 'DELETE') {
      await prisma.bugReport.delete({
        where: { id: id as string },
      });

      return res.status(204).end();
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('API Error:', error);
    
    // Handle Prisma not found error
    const err = error as any;
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Bug report not found' });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
