import express from 'express';
import {
  createPost,
  getPost,
  deletePost,
  likeUnlikePost,
  replyToPost,
  getFeedPosts,
} from '../controllers/postControllers.js';
import { verifyToken } from '../utils/jwtAuth.js';
import multerUpload from '../middleware/multer.js';
const router = express.Router();

router.post('/create', verifyToken, multerUpload.array('img'), createPost);
router.get('/feeds', verifyToken, getFeedPosts);
router.get('/:id', getPost);
router.delete('/:id', verifyToken, deletePost);
router.post('/likes/:id', verifyToken, likeUnlikePost);
router.post('/reply/:id', verifyToken, replyToPost);

export default router;
