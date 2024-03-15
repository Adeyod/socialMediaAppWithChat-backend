import express from 'express';
import {
  createPost,
  getPost,
  deletePost,
  likeUnlikePost,
  replyToPost,
  getFeedPosts,
  getUserPosts,
} from '../controllers/postControllers.js';
import { verifyToken } from '../utils/jwtAuth.js';
import multerUpload from '../middleware/multer.js';
const router = express.Router();

router.post('/create', verifyToken, multerUpload.array('file'), createPost);
router.get('/feeds', verifyToken, getFeedPosts);
router.get('/:id', getPost);
router.get('/user/:username', getUserPosts);
router.delete('/:id', verifyToken, deletePost);
router.put('/likes/:id', verifyToken, likeUnlikePost);
router.put('/reply/:id', verifyToken, replyToPost);

export default router;
