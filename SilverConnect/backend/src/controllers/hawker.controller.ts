import { Request, Response } from 'express';
import { HawkerService } from '../services/hawkerService';

export class HawkerController {
  static async getHawkers(req: Request, res: Response): Promise<void> {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const hawkers = await HawkerService.getHawkers(forceRefresh);
      res.json({ hawkers });
    } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({ error: 'Failed to fetch hawkers', hawkers: [] });
    }
  }
}