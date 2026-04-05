import { Router } from 'express';
import { HawkerController } from '../controllers/hawker.controller';

const router = Router();

router.get('/hawkers', HawkerController.getHawkers);

export default router;