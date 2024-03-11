import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const generateToken = async (userId, email, res) => {
  try {
    const payload = {
      userId,
      email,
    };
    const token = await jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '10days',
    });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 10 * 24 * 60 * 60 * 1000,
    });

    return token;
  } catch (error) {
    console.log(error.message);
  }
};

// verify token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.json({
        message: 'Please login to continue',
        status: 400,
        success: false,
      });
    }
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.json({
        message: 'Invalid token',
        status: 401,
        success: false,
        Error: err.message,
      });
    }
    const user = await User.findById({ _id: decoded.userId }).select(
      '-password'
    );

    req.user = user;

    next();
  } catch (error) {
    console.log(error.message);
    return;
  }
};

export { generateToken, verifyToken };
