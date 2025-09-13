import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const router = Router();
const userController = new UserController();

// Authentication routes
router.post('/login', userController.loginWithEmail);
router.get('/profile/:email', userController.getUserProfile);
router.put('/preferences/:email', userController.updateUserPreferences);
router.post('/track-access', userController.trackDocumentAccess);

// Keep existing routes
router.post('/create', userController.createUser);
router.get('/:userId', userController.getUser);
router.get('/:userId/documents', userController.getUserDocuments);

export default router;
