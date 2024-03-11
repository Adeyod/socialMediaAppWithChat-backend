import mongoose from 'mongoose';

const profileImg = {
  url: String,
  publicId: String,
  assetId: String,
  signature: String,
  default: { type: String, default: '' },
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },

    profilePic: profileImg,
    isVerified: {
      type: Boolean,
      default: false,
    },

    followers: {
      type: [String],
      default: [],
    },

    following: {
      type: [String],
      default: [],
    },

    bio: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
