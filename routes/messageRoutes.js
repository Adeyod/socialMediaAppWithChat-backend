import express from 'express';
import { verifyToken } from '../utils/jwtAuth.js';
import {
  sendMessage,
  getMessages,
  getConversations,
} from '../controllers/messageControllers.js';

const router = express.Router();

router.get('/conversations', verifyToken, getConversations);
router.get('/:otherUserId', verifyToken, getMessages);
router.post('/', verifyToken, sendMessage);

export default router;
