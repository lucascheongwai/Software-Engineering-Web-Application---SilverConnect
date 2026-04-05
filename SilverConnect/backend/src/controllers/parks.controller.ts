import { Request, Response } from 'express';
import { ParksService } from '../services/parksService';

export class ParksController {
  static async getParks(req: Request, res: Response): Promise<void> {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const parks = await ParksService.getParks(forceRefresh);
      res.json({ parks });
    } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({ error: 'Failed to fetch parks', parks: [] });
    }
  }
}