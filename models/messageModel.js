import mongoose, { Schema } from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    text: String,
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
