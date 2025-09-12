import { Router } from 'express';
import documentRoutes from './documentRoutes';
import healthRoutes from './healthRoutes';
import userRoutes from './userRoutes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/api/documents', documentRoutes);
router.use('/api/users', userRoutes);

export default router;
