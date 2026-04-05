import { Router } from 'express';
import { ParksController } from '../controllers/parks.controller';

const router = Router();

router.get('/parks', ParksController.getParks);

export default router;