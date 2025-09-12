import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const router = Router();
const userController = new UserController();

router.post('/create', userController.createUser);
router.get('/:userId', userController.getUser);
router.get('/:userId/documents', userController.getUserDocuments);

export default router;

