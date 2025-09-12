import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';

const router = Router();
const documentController = new DocumentController();

router.post('/create', documentController.createDocument);
router.get('/:id/steps', documentController.getStepsSince);
router.delete('/:id', documentController.deleteDocument);


export default router;
