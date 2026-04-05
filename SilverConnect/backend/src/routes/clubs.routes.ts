import { Router } from 'express';
import { ClubsController } from '../controllers/clubs.controller';

const router = Router();

router.get('/clubs', ClubsController.getClubs);

export default router;