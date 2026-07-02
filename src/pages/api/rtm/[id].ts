import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  if (req.method === 'PUT') {
    try {
      const { requirementId, mainFeature, subFeature, description, testCaseId, testStatus, remarks } = req.body;

      if (!requirementId || !mainFeature || !description || !testCaseId || !testStatus) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const updatedEntry = await prisma.rTMEntry.update({
        where: { id },
        data: {
          requirementId,
          mainFeature,
          subFeature,
          description,
          testCaseId,
          testStatus,
          remarks
        }
      });

      res.status(200).json(updatedEntry);
    } catch (error) {
      console.error('Error updating RTM entry:', error);
      const err = error as any;
      if (err.code === 'P2025') {
        res.status(404).json({ error: 'RTM entry not found' });
      } else {
        res.status(500).json({ error: 'Failed to update RTM entry' });
      }
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.rTMEntry.delete({
        where: { id }
      });

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting RTM entry:', error);
      const err = error as any;
      if (err.code === 'P2025') {
        res.status(404).json({ error: 'RTM entry not found' });
      } else {
        res.status(500).json({ error: 'Failed to delete RTM entry' });
      }
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
