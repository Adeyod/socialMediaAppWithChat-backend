import Post from '../models/postModel.js';
import User from '../models/userModel.js';
import { cloudinaryDestroy, handleFileUpload } from '../utils/cloudinary.js';

const createPost = async (req, res) => {
  try {
    const { text, postedBy } = req.body;
    const img = req.files;
    console.log(req.body);
    console.log(req.files);

    if (!postedBy || !text) {
      return res.json({
        message: 'PostedBy and text fields are required',
        status: 400,
        success: false,
      });
    }

    const user = await User.findById({ _id: postedBy });
    if (!user) {
      return res.json({
        message: 'user not found',
        success: false,
        status: 404,
      });
    }

    if (user._id.toString() !== req.user._id.toString()) {
      return res.json({
        message: 'Unauthorized to create a post',
        success: false,
        status: 500,
      });
    }

    const maxLength = 500;

    if (text.length > maxLength) {
      return res.json({
        message: 'Text can be maximum of 500 characters',
        success: false,
        status: 400,
      });
    }

    if (img && img !== undefined && img.length !== 0) {
      const uploadImg = await handleFileUpload(req, res);

      const result = {
        url: uploadImg.url,
        publicId: uploadImg.publicId,
        assetId: uploadImg.assetId,
        signature: uploadImg.signature,
      };

      const newPost = await Post({
        postedBy,
        text,
        img: result,
      }).save();

      if (!newPost) {
        return res.json({
          message: 'Unable to create post',
          success: false,
          status: 400,
        });
      }

      return res.json({
        message: 'Post created successfully',
        success: true,
        status: 201,
        post: newPost,
      });
    }

    const newPost = await Post({
      postedBy,
      text,
    }).save();

    if (!newPost) {
      return res.json({
        message: 'Unable to create post',
        success: false,
        status: 400,
      });
    }

    return res.json({
      message: 'Post created successfully',
      success: true,
      status: 201,
      post: newPost,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      success: false,
      status: 500,
      error: error.message,
    });
  }
};

const getPost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById({ _id: id });

    if (!post) {
      return res.json({
        message: 'Post not found',
        status: 404,
        success: false,
      });
    }

    return res.json({
      message: 'Post fetched successfully',
      success: true,
      status: 200,
      post,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      success: false,
      status: 500,
      error: error.message,
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById({ _id: id });

    if (!post) {
      return res.json({
        message: 'Post not found',
        status: 404,
        success: false,
      });
    }

    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res.json({
        message: 'Unauthorized to delete post',
        status: 401,
        success: false,
      });
    }

    if (post.img !== '') {
      await cloudinaryDestroy(post.img.publicId);
    }

    const deletedPost = await Post.findByIdAndDelete({ _id: id });
    if (!deletedPost) {
      return res.json({
        message: 'Unable to delete post',
        status: 400,
        success: false,
      });
    }
    return res.json({
      message: 'Post deleted successfully',
      success: true,
      status: 200,
      post: deletedPost,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      success: false,
      status: 500,
      error: error.message,
    });
  }
};

const likeUnlikePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById({ _id: postId });

    if (!post) {
      return res.json({
        message: 'Post not found',
        success: false,
        status: 404,
      });
    }

    const userLikedPost = post.likes.includes(userId);
    if (userLikedPost) {
      // unlike the post
      await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });
      return res.json({
        message: 'Post unliked',
        success: true,
        status: 200,
      });
    } else {
      // like post
      post.likes.push(userId);
      await post.save();

      return res.json({
        message: 'Post liked',
        success: true,
        status: 200,
      });
    }
  } catch (error) {
    return res.json({
      message: 'Something happened',
      success: false,
      status: 500,
      error: error.message,
    });
  }
};

const replyToPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    const userProfilePic = req.user.profilePic.url;
    const username = req.user.username;

    if (!text) {
      return res.json({
        message: 'Text is required',
        success: false,
        status: 400,
      });
    }

    const post = await Post.findById({ _id: postId });
    if (!post) {
      return res.json({
        message: 'Can not find post',
        success: false,
        status: 404,
      });
    }

    const reply = { userId, text, userProfilePic, username };

    post.replies.push(reply);
    await post.save();

    return res.json({
      message: 'Reply added successfully',
      success: true,
      status: 200,
      reply,
      post,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      success: false,
      status: 500,
      error: error.message,
    });
  }
};

const getFeedPosts = async (req, res) => {
  try {
    console.log('i get here');
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.json({
        message: 'User not found',
        success: false,
        status: 404,
      });
    }

    const following = user.following;
    const feedPosts = await Post.find({ postedBy: { $in: following } }).sort({
      createdAt: -1,
    });

    return res.json({
      message: 'Feeds fetched successfully',
      success: true,
      status: 200,
      feedPosts,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      success: false,
      status: 500,
      error: error.message,
    });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    console.log(req.params);

    const user = await User.findOne({
      username: { $regex: `^${username}$`, $options: 'i' },
    });

    if (!user) {
      return res.json({
        message: 'User can not be found',
        status: 404,
        success: false,
      });
    }

    const posts = await Post.find({ postedBy: user._id }).sort({
      createdAt: -1,
    });

    if (!posts) {
      return res.json({
        message: 'User do not have any post at the moment',
        status: 404,
        success: false,
      });
    }

    return res.json({
      message: 'Posts fetched successfully',
      success: true,
      status: 200,
      posts,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      success: false,
      status: 500,
      error: error.message,
    });
  }
};

export {
  createPost,
  getFeedPosts,
  replyToPost,
  getPost,
  deletePost,
  likeUnlikePost,
  getUserPosts,
};

// 05:01:48
