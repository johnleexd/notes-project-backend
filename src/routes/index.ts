import { Router } from 'express';
import authRoutes from '@/routes/auth.routes';
import noteRoutes from '@/routes/note.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/notes', noteRoutes);

export default router;
