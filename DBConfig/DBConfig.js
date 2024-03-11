import mongoose from 'mongoose';

import dotenv from 'dotenv';

dotenv.config();

const DBConfig = async () => {
  try {
    const conn = mongoose.connect(process.env.MONGODB_URL).then(() => {
      console.log(
        `MongoDB connected to host: ${mongoose.connection.host}`.bold.underline
      );
    });
  } catch (error) {
    console.log(`Error: ${error.message}`.red.bold);
    process.exit();
  }
};

export default DBConfig;
