import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

const router = Router();
const healthController = new HealthController();

router.get('/', healthController.healthCheck);
router.get('/db', healthController.databaseCheck);

export default router;
