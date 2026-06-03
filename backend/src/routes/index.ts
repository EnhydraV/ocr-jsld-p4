import {Router} from 'express';
import {AuthController} from '../controllers/auth.controller';
import {SessionController} from '../controllers/session.controller';
import {TeacherController} from '../controllers/teacher.controller';
import {UserController} from '../controllers/user.controller';
import {authMiddleware} from '../middleware/auth.middleware';

const router = Router();

const authController = new AuthController();
const sessionController = new SessionController();
const teacherController = new TeacherController();
const userController = new UserController();

// Auth routes (public)
router.post('/api/auth/login', (req, res, next) => authController.login(req, res, next));
router.post('/api/auth/register', (req, res, next) => authController.register(req, res, next));

// Session routes (protected)
router.get('/api/session', authMiddleware, (req, res, next) => sessionController.getAll(req, res, next));
router.get('/api/session/:id', authMiddleware, (req, res, next) => sessionController.getById(req, res, next));
router.post('/api/session', authMiddleware, (req, res, next) => sessionController.create(req, res, next));
router.put('/api/session/:id', authMiddleware, (req, res, next) => sessionController.update(req, res, next));
router.delete('/api/session/:id', authMiddleware, (req, res, next) => sessionController.delete(req, res, next));
router.post('/api/session/:id/participate/:userId', authMiddleware, (req, res, next) => sessionController.participate(req, res, next));
router.delete('/api/session/:id/participate/:userId', authMiddleware, (req, res, next) => sessionController.unparticipate(req, res, next));

// Teacher routes (protected)
router.get('/api/teacher', authMiddleware, (req, res, next) => teacherController.getAll(req, res, next));
router.get('/api/teacher/:id', authMiddleware, (req, res, next) => teacherController.getById(req, res, next));

// User routes (protected)
router.get('/api/user/:id', authMiddleware, (req, res, next) => userController.getById(req, res, next));
router.post('/api/user/promote-admin', authMiddleware, (req, res, next) => userController.promoteSelfToAdmin(req, res, next));
router.delete('/api/user/:id', authMiddleware, (req, res, next) => userController.delete(req, res, next));

export default router;
