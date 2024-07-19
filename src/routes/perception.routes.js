import express from 'express';
import PerceptionController from '../controllers/perception.controller.js';

const router = express.Router();

// Rutas para percepciones
router.post('/', PerceptionController.createPerception);
router.get('/all', PerceptionController.getAllPerceptions);
router.get('/', PerceptionController.getPerceptionsWithPagination);
router.get('/search', PerceptionController.searchPerceptions);
router.get('/:id', PerceptionController.getPerceptionById);
router.put('/:id', PerceptionController.updatePerception);
router.delete('/:id', PerceptionController.deletePerception);

export default router;