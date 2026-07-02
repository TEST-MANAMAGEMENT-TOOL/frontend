import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rtmEntries = await prisma.rTMEntry.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
      res.status(200).json(rtmEntries);
    } catch (error) {
      console.error('Error fetching RTM entries:', error);
      res.status(500).json({ error: 'Failed to fetch RTM entries' });
    }
  } else if (req.method === 'POST') {
    try {
      const { requirementId, mainFeature, subFeature, description, testCaseId, testStatus, remarks } = req.body;

      if (!requirementId || !mainFeature || !description || !testCaseId || !testStatus) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newEntry = await prisma.rTMEntry.create({
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

      res.status(201).json(newEntry);
    } catch (error) {
      console.error('Error creating RTM entry:', error);
      res.status(500).json({ error: 'Failed to create RTM entry' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
