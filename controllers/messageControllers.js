import Conversation from '../models/conversationModel.js';
import Message from '../models/messageModel.js';
import { getRecipientSocketId, io } from '../socket/socket.js';

const sendMessage = async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    const senderId = req.user._id;

    if (recipientId.toString() === senderId.toString()) {
      return res.json({
        message: 'You can not message yourself',
        status: 400,
        success: false,
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] },
    });

    if (!conversation) {
      conversation = await new Conversation({
        participants: [senderId, recipientId],
        lastMessage: {
          text: message,
          sender: senderId,
        },
      }).save();
    }

    const newMessage = new Message({
      conversationId: conversation._id,
      sender: senderId,
      text: message,
    });

    await Promise.all([
      newMessage.save(),
      conversation.updateOne({
        lastMessage: {
          text: message,
          sender: senderId,
        },
      }),
    ]);

    const recipientSocketId = getRecipientSocketId(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('newMessage', newMessage);
    }

    // return res.json(newMessage);
    return res.json({
      message: 'Message sent',
      status: 200,
      success: true,
      newMessage,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      status: 500,
      success: false,
      error: error.message,
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: {
        $all: [userId, otherUserId],
      },
    });

    if (!conversation) {
      return res.json({
        message: 'Conversation can not be found',
        status: 404,
        success: false,
      });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    return res.json({
      message: 'I am being called. Messages fetched successfully',
      status: 200,
      success: true,
      messages,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      status: 500,
      success: false,
      error: error.message,
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    let conversations = await Conversation.find({
      participants: userId,
    }).populate({
      path: 'participants',
      select: 'username profilePic.url',
    });

    conversations.forEach((conversation) => {
      conversation.participants = conversation.participants.filter(
        (participant) => participant._id.toString() !== userId.toString()
      );
    });

    return res.json({
      message: 'Conversations fetched successfully',
      status: 200,
      success: true,
      conversations,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      status: 500,
      success: false,
      error: error.message,
    });
  }
};

export { sendMessage, getMessages, getConversations };
