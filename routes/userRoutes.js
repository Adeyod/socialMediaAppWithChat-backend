import express from 'express';

import {
  emailVerification,
  loginUser,
  logoutUser,
  registerUser,
  getUserProfile,
  followUnFollowUser,
  updateUserProfile,
  resetPassword,
  forgotPassword,
  allowResetPassword,
  resendEmailVerification,
} from '../controllers/userControllers.js';
import { verifyToken } from '../utils/jwtAuth.js';
import multerUpload from '../middleware/multer.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/follow/:id', verifyToken, followUnFollowUser);
router.put(
  '/update/:id',
  verifyToken,
  multerUpload.single('file'),
  updateUserProfile
);
router.post('/register', registerUser);
router.post('/logout', logoutUser);
router.post('/resend-email-verification', resendEmailVerification);
router.post('/forgot-password', forgotPassword);
router.post('/allow-reset-password/:userId/:token', allowResetPassword);
router.post('/reset-password/:userId/:token', resetPassword);
router.post('/user-verification/:userId/:token', emailVerification);
router.get('/profile/:username', getUserProfile);

export default router;
