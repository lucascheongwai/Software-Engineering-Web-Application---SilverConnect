import { Request, Response } from 'express';
import { ClubsService } from '../services/clubsService';

export class ClubsController {
  static async getClubs(req: Request, res: Response): Promise<void> {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const clubs = await ClubsService.getClubs(forceRefresh);
      res.json({ clubs });
    } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({ error: 'Failed to fetch clubs', clubs: [] });
    }
  }
}