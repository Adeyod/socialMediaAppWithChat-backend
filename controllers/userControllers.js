import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Token from '../models/tokenModel.js';
import { changePassword, verifyEmail } from '../utils/nodemailer.js';
import { generateToken } from '../utils/jwtAuth.js';
import {
  cloudinaryDestroy,
  cloudinaryUploads,
  handleFileUpload,
} from '../utils/cloudinary.js';
import { error, profile } from 'console';

const forbiddenCharsRegex = /[|!{}()&=[\]===><>]/;

const registerUser = async (req, res) => {
  try {
    const { username, name, email, password, confirmPassword } = req.body;

    // const profilePicture = req.file;

    const isEmpty = Object.values(req.body).some((v) => !v);
    if (isEmpty) {
      return res.json({
        message: 'All fields are required',
        status: 400,
        success: false,
      });
    }

    // if (!profilePicture) {
    //   return res.json({
    //     message: 'Profile picture is required',
    //     status: 400,
    //     success: false,
    //   });
    // }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (forbiddenCharsRegex.test(trimmedName)) {
      return res.json({
        message: 'Invalid character for field name',
        success: false,
        status: 400,
      });
    }

    if (forbiddenCharsRegex.test(trimmedUsername)) {
      return res.json({
        message: 'Invalid character for field username',
        success: false,
        status: 400,
      });
    }

    // check the email field to prevent input of unwanted characters
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.json({
        message: 'Invalid input for email...',
        status: 400,
        success: false,
      });
    }

    // // strong password check
    if (
      !/^(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,20}$/.test(
        password
      )
    ) {
      return res.json({
        message:
          'Password must contain at least 1 special character, 1 lowercase letter, and 1 uppercase letter. Also it must be minimum of 8 characters and maximum of 20 characters',
        success: false,
        status: 401,
      });
    }

    if (password !== confirmPassword) {
      return res.json({
        message: 'Password and confirm password do not match',
        status: 400,
        success: false,
      });
    }

    // upload profile picture
    // const result = await handleFileUpload(req, res);

    // console.log(result);
    // const profileImg = {
    //   url: result.url,
    //   publicId: result.publicId,
    //   assetId: result.assetId,
    //   signature: result.signature,
    // };

    const userExist = await User.findOne({
      $or: [
        { email: trimmedEmail },
        { username: { $regex: `^${trimmedUsername}$`, $options: 'i' } },
      ],
    });

    if (userExist) {
      return res.json({
        message: 'User already exist',
        status: 400,
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await new User({
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
      username: trimmedUsername,
    }).save();

    if (!user) {
      return res.json({
        message: 'Unable to create user',
        success: false,
        status: 400,
      });
    }
    const token =
      crypto.randomBytes(32).toString('hex') +
      crypto.randomBytes(32).toString('hex');

    const newToken = await new Token({
      token,
      userId: user._id,
    }).save();

    console.log(newToken);

    // const link = `${process.env.FRONTEND_URL}/user-verification/?userId=${newToken.userId}&token=${newToken.token}`;
    const link = `${process.env.FRONTEND_URL}/api/user/user-verification/${newToken.userId}/${newToken.token}`;

    await verifyEmail(link, user.email);

    return res.json({
      message: 'Email verification link has been sent to your email address',
      status: 200,
      success: true,
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

const emailVerification = async (req, res) => {
  try {
    const { userId, token } = req.params;
    const tokenExist = await Token.findOne({
      token,
      userId,
    });

    if (!tokenExist) {
      return res.json({
        message: 'Token does not exist',
        success: false,
        status: 404,
      });
    }

    const userUpdate = await User.findOneAndUpdate(
      {
        _id: tokenExist.userId,
      },
      {
        $set: {
          isVerified: true,
        },
      },
      { new: true }
    );

    if (!userUpdate) {
      return res.json({
        message: 'Unable to update user',
        success: false,
        status: 400,
      });
    }

    await tokenExist.deleteOne();

    return res.json({
      message: 'User has been updated successfully. You can now login',
      status: 200,
      success: true,
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

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const trimmedUsername = username.trim();

    const isEmpty = Object.values(req.body).some((v) => !v);

    if (isEmpty) {
      return res.json({
        message: 'All fields are required',
        status: 400,
        success: false,
      });
    }

    if (forbiddenCharsRegex.test(trimmedUsername)) {
      return res.json({
        message: 'Invalid character for field username',
        success: false,
        status: 400,
      });
    }

    // // strong password check
    if (
      !/^(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,20}$/.test(
        password
      )
    ) {
      return res.json({
        message:
          'Password must contain at least 1 special character, 1 lowercase letter, and 1 uppercase letter. Also it must be minimum of 8 characters and maximum of 20 characters',
        success: false,
        status: 401,
      });
    }

    const userExist = await User.findOne({
      username: { $regex: `^${trimmedUsername}$`, $options: 'i' },
    });

    if (!userExist) {
      return res.json({
        message: 'Invalid credentials',
        success: false,
        status: 400,
      });
    }

    const confirmPassword = await bcrypt.compare(password, userExist.password);

    if (!confirmPassword) {
      return res.json({
        message: 'Invalid credentials',
        success: false,
        status: 400,
      });
    }

    if (userExist.isVerified === false) {
      // check if there is valid token
      const validToken = await Token.findOne({
        userId: userExist._id,
      });

      if (validToken) {
        // const link = `${process.env.FRONTEND_URL}/user-verification/?userId=${validToken.userId}&token=${validToken.token}`;
        const link = `${process.env.FRONTEND_URL}/api/user/user-verification/${validToken.userId}/${validToken.token}`;

        await verifyEmail(link, userExist.email);
        return res.json({
          message:
            'Please verify your email with the link sent to your email address',
        });
      }

      const token =
        crypto.randomBytes(32).toString('hex') +
        crypto.randomBytes(32).toString('hex');

      const newToken = await new Token({
        token,
        userId: userExist._id,
      }).save();

      // const link = `${process.env.FRONTEND_URL}/user-verification/?userId=${newToken.userId}&token=${newToken.token}`;
      const link = `${process.env.FRONTEND_URL}/user-verification/${newToken.userId}/${newToken.token}`;

      await verifyEmail(link, userExist.email);

      return res.json({
        message: 'Please verify your email address',
      });
    }

    const { password: hashedPassword, ...others } = userExist._doc;

    await generateToken(userExist._id, userExist.email, res);

    return res.json({
      message: 'Login successful',
      status: 200,
      success: true,
      user: others,
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

const logoutUser = async (req, res) => {
  try {
    const logout = res.cookie('token', '', { maxAge: 1 });
    if (!logout) {
      return res.json({
        message: 'Unable to log user out',
        status: 400,
        success: false,
      });
    }

    return res.json({
      message: 'User logged out successfully',
      status: 200,
      success: true,
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

const resendEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const trimmedEmail = email.trim();
    // check the email field to prevent input of unwanted characters
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.json({
        message: 'Invalid input for email...',
        status: 400,
        success: false,
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: 'User can not be found',
        status: 404,
        success: false,
      });
    }

    if (user.isVerified === true) {
      return res.json({
        message: 'User already verified',
        status: 400,
        success: false,
      });
    }

    const findToken = await Token.findOne({
      userId: user._id,
    });

    if (findToken) {
      const link = `${process.env.FRONTEND_URL}/api/user/user-verification/${findToken.userId}/${findToken.token}`;
      // const link = `${process.env.FRONTEND_URL}/api/user/user-verification/?userId=${findToken.userId}&token=${findToken.token}`;
      // const link = `${process.env.FRONTEND_URL}/api/user/allow-reset-password/?userId=${findToken.userId}&token=${findToken.token}`;

      await verifyEmail(link, email);

      return res.json({
        message: 'Verification mail has been sent to your email address',
        success: true,
      });
    } else {
      const token =
        crypto.randomBytes(32).toString('hex') +
        crypto.randomBytes(32).toString('hex');

      const newToken = await new Token({
        token,
        userId: user._id,
      }).save();

      const link = `${process.env.FRONTEND_URL}/api/user/user-verification/${newToken.userId}/${newToken.token}`;
      // const link = `${process.env.FRONTEND_URL}/api/user/user-verification/?userId=${newToken.userId}&token=${newToken.token}`;

      await verifyEmail(link, email);

      return res.json({
        message: 'Please check your email to verify your email',
        success: true,
      });
    }
  } catch (error) {
    return res.json({
      message: 'Something happened',
      status: 500,
      success: false,
      error: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const trimmedEmail = email.trim();
    // check the email field to prevent input of unwanted characters
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.json({
        message: 'Invalid input for email...',
        status: 400,
        success: false,
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: 'User can not be found',
        status: 404,
        success: false,
      });
    }

    // generate a link with token and userId.
    // send the link to the email address of the user
    // return with a message to the frontend

    const findToken = await Token.findOne({
      userId: user._id,
    });

    if (findToken) {
      const link = `${process.env.FRONTEND_URL}/api/user/allow-reset-password/${findToken.userId}/${findToken.token}`;
      // const link = `${process.env.FRONTEND_URL}/api/user/allow-reset-password/?userId=${findToken.userId}&token=${findToken.token}`;

      const passChange = await changePassword(link, user.email, user.username);

      return res.json({
        message:
          'Link to change your password has been sent to your email address',
        success: true,
      });
    } else {
      const token =
        crypto.randomBytes(32).toString('hex') +
        crypto.randomBytes(32).toString('hex');

      const newToken = await new Token({
        token,
        userId: user._id,
      }).save();

      const link = `${process.env.FRONTEND_URL}/api/user/allow-reset-password/${newToken.userId}/${newToken.token}`;
      // const link = `${process.env.FRONTEND_URL}/api/user/allow-reset-password/?userId=${newToken.userId}&token=${newToken.token}`;

      const passChange = await changePassword(link, email, user.username);

      return res.json({
        message: 'Password change link has been sent to your email address',
        success: true,
      });
    }
  } catch (error) {
    return res.json({
      message: 'Something happened',
      status: 500,
      success: false,
      error: error.message,
    });
  }
};

const allowResetPassword = async (req, res) => {
  try {
    const { userId, token } = req.params;

    console.log(req.params);

    const userToken = await Token.findOne({
      token,
      userId,
    });

    if (!userToken) {
      return res.json({
        message: 'Token can not be found',
        status: 404,
        success: false,
      });
    }

    const confirmUser = await User.findOne({
      _id: userId,
    });

    if (!confirmUser) {
      return res.json({
        message: 'user not found',
        status: 404,
        success: false,
      });
    }

    return res.json({
      message: 'Token found',
      status: 200,
      success: true,
      userId,
      token,
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

const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmNewPassword } = req.body;

    // // strong password check
    if (
      !/^(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,20}$/.test(
        newPassword
      )
    ) {
      return res.json({
        message:
          'Password must contain at least 1 special character, 1 lowercase letter, and 1 uppercase letter. Also it must be minimum of 8 characters and maximum of 20 characters',
        success: false,
        status: 401,
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.json({
        message: 'Password and confirm password do not match',
        status: 400,
        success: false,
      });
    }

    const { userId, token } = req.params;
    const userToken = await Token.findOne({
      token,
      userId,
    });

    if (!userToken) {
      return res.json({
        message: 'Token can not be found',
        status: 404,
        success: false,
      });
    }

    const confirmUser = await User.findOne({
      _id: userId,
    });

    if (!confirmUser) {
      return res.json({
        message: 'user not found',
        status: 404,
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    confirmUser.password = hashedPassword;
    await confirmUser.save();

    await userToken.deleteOne();

    const { password: hashedPassword2, ...others } = confirmUser._doc;

    return res.json({
      message: 'Password updated successfully',
      status: 200,
      success: true,
      user: others,
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

const updateUserProfile = async (req, res) => {
  try {
    const { username, name, email, password, bio } = req.body;
    const profilePic = req.file;

    if (name !== '') {
      if (forbiddenCharsRegex.test(name)) {
        return res.json({
          message: 'Invalid character for field name',
          success: false,
          status: 400,
        });
      }
    }

    if (username !== '') {
      if (forbiddenCharsRegex.test(username)) {
        return res.json({
          message: 'Invalid character for field username',
          success: false,
          status: 400,
        });
      }
    }

    if (bio !== '') {
      if (forbiddenCharsRegex.test(bio)) {
        return res.json({
          message: 'Invalid character for field bio',
          success: false,
          status: 400,
        });
      }
    }

    // if (email !== '') {
    //   // check the email field to prevent input of unwanted characters
    //   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    //     return res.json({
    //       message: 'Invalid input for email...',
    //       status: 400,
    //       success: false,
    //     });
    //   }
    // }

    if (req.params.id !== req.user._id.toString()) {
      return res.json({
        message: 'You can only update your profile',
        status: 400,
        success: false,
      });
    }

    // const emailExist = await User.findOne({
    //   $or: [{ email }, { username: { $regex: username, $options: 'i' } }],
    // });

    // if (!emailExist) {
    //   return res.json({
    //     message: 'User can not be found',
    //     status: 404,
    //     success: false,
    //   });
    // }

    let user = await User.findById({ _id: req.user._id });
    if (!user) {
      return res.json({
        message: 'User not found',
        status: 404,
        success: false,
      });
    }

    if (username !== user.username) {
      // check if new username exist
      const usernameExist = await User.findOne({
        username: { $regex: username, $options: 'i' },
      });

      if (usernameExist) {
        return res.json({
          message: 'New username already exist',
          status: 400,
          success: false,
        });
      }
    }

    if (password) {
      // strong password check
      if (
        !/^(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,20}$/.test(
          password
        )
      ) {
        return res.json({
          message:
            'Password must contain at least 1 special character, 1 lowercase letter, and 1 uppercase letter. Also it must be minimum of 8 characters and maximum of 20 characters',
          success: false,
          status: 401,
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    if (profilePic) {
      // check if profile pic is not empty string
      if (user.profilePic !== '') {
        // remove the profile pic and upload the new one
        const deleteInitialPic = await cloudinaryDestroy(
          user.profilePic.publicId
        );

        const uploadNewPic = await handleFileUpload(req, res);
        const result = {
          url: uploadNewPic.url,
          publicId: uploadNewPic.publicId,
          assetId: uploadNewPic.assetId,
          signature: uploadNewPic.signature,
        };

        user.profilePic = result;
      } else {
        const uploadNewPic = await handleFileUpload(req, res);

        const result = {
          url: uploadNewPic.url,
          publicId: uploadNewPic.publicId,
          assetId: uploadNewPic.assetId,
          signature: uploadNewPic.signature,
        };
        user.profilePic = result;
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;

    user = await user.save();

    if (!user) {
      return res.json({
        message: 'Unable to update user profile',
        status: 400,
        success: false,
      });
    }

    const { password: hashedPassword, ...others } = user._doc;
    return res.json({
      message: 'User profile updated successfully',
      status: 200,
      success: true,
      user: others,
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

const followUnFollowUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userToModify = await User.findById({ _id: id });
    const currentUser = await User.findById({ _id: req.user._id });

    if (!userToModify || !currentUser) {
      return res.json({
        message: 'User can not be found',
        status: 404,
        success: false,
      });
    }

    if (userToModify._id.toString() === currentUser._id.toString()) {
      return res.json({
        message: 'You can not follow or unfollow yourself',
        status: 400,
        success: false,
      });
    }

    const isFollowing = currentUser.following.includes(userToModify._id);
    if (isFollowing) {
      await User.findByIdAndUpdate(
        { _id: currentUser._id },
        { $pull: { following: userToModify._id } }
      );
      await User.findByIdAndUpdate(
        { _id: userToModify._id },
        { $pull: { followers: currentUser._id } }
      );
      currentUser.following.pull(userToModify._id);
      userToModify.followers.pull(currentUser._id);
      return res.json({
        message: 'User unfollowed',
        status: 200,
        success: true,
      });
    } else {
      await User.findByIdAndUpdate(
        { _id: currentUser._id },
        { $push: { following: userToModify._id } }
      );

      await User.findByIdAndUpdate(
        { _id: userToModify._id },
        { $push: { followers: currentUser._id } }
      );

      return res.json({
        message: 'User followed',
        status: 200,
        success: true,
      });
    }

    return;
  } catch (error) {
    return res.json({
      message: 'Something happened',
      success: false,
      status: 500,
      error: error.message,
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username })
      .select('-password')
      .select('-updatedAt');
    if (!user) {
      return res.json({
        message: 'User can not be found',
        status: 404,
        success: false,
      });
    }

    return res.json({
      message: 'User fetched successfully',
      status: 200,
      success: true,
      user,
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

export {
  logoutUser,
  followUnFollowUser,
  loginUser,
  getUserProfile,
  registerUser,
  emailVerification,
  updateUserProfile,
  resetPassword,
  forgotPassword,
  allowResetPassword,
  resendEmailVerification,
};
