import express from 'express';
import PositionController from '../controllers/position.controller.js';

const router = express.Router();

// Rutas para puestos
router.post('/', PositionController.createPosition);
router.get('/all', PositionController.getAllPositions);
router.get('/', PositionController.getPositionsWithPagination);
router.get('/search', PositionController.searchPositions);
router.get('/:id', PositionController.getPositionById);
router.put('/:id', PositionController.updatePosition);
router.delete('/:id', PositionController.deletePosition);

export default router;