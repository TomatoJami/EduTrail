import { Router } from 'express';
import { userController } from '../controllers/userController';

const router = Router();

// Public routes
router.post('/signup', (req, res) => userController.signup(req, res));
router.post('/login', (req, res) => userController.login(req, res));

// Protected routes (TODO: Add auth middleware)
router.get('/:id', (req, res) => userController.getUser(req, res));
router.get('/', (req, res) => userController.getAllUsers(req, res));
router.put('/:id', (req, res) => userController.updateUser(req, res));

// Wishlist routes
router.post('/:id/wishlist/add', (req, res) => userController.addToWishlist(req, res));
router.post('/:id/wishlist/remove', (req, res) => userController.removeFromWishlist(req, res));
router.get('/:id/wishlist', (req, res) => userController.getWishlist(req, res));

export default router;
