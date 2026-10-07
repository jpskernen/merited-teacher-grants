import { Router, Request, Response } from 'express';
import {
  scanCampusMentions,
  checkApplicationQuality,
  findApprovedVendorAlternatives,
  summarizeApplicationForReviewer,
} from './geminiService.ts';

export const apiRouter = Router();

apiRouter.post('/gemini/scan-campus', async (req: Request, res: Response) => {
  try {
    const { text } = req.body || {};
    const result = await scanCampusMentions(String(text || ''));
    res.json(result);
  } catch (error) {
    console.error('API /gemini/scan-campus error:', error);
    res.status(500).json({ error: 'Failed to scan narrative for campus mentions' });
  }
});

apiRouter.post('/gemini/check-application', async (req: Request, res: Response) => {
  try {
    const appData = req.body || {};
    const result = await checkApplicationQuality(appData);
    res.json(result);
  } catch (error) {
    console.error('API /gemini/check-application error:', error);
    res.status(500).json({ error: 'Failed to evaluate application' });
  }
});

apiRouter.post('/gemini/vendor-alternatives', async (req: Request, res: Response) => {
  try {
    const { itemDescription, currentVendor, price, approvedVendors } = req.body || {};
    const result = await findApprovedVendorAlternatives(
      String(itemDescription || ''),
      String(currentVendor || ''),
      Number(price || 0),
      Array.isArray(approvedVendors) ? approvedVendors : []
    );
    res.json(result);
  } catch (error) {
    console.error('API /gemini/vendor-alternatives error:', error);
    res.status(500).json({ error: 'Failed to locate vendor alternatives' });
  }
});

apiRouter.post('/gemini/summarize-application', async (req: Request, res: Response) => {
  try {
    const appData = req.body || {};
    const summary = await summarizeApplicationForReviewer(appData);
    res.json({ summary });
  } catch (error) {
    console.error('API /gemini/summarize-application error:', error);
    res.status(500).json({ error: 'Failed to generate neutral summary' });
  }
});
