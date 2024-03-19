import express from 'express';
import DBConfig from './DBConfig/DBConfig.js';
import colors from 'colors';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { app, server } from './socket/socket.js';
import cron from 'node-cron';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(
  cors({
    // origin: 'https://socialmediaappwithchat-frontend.onrender.com',
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

const port = process.env.PORT || 5500;

app.use('/api/user', userRoutes);
app.use('/api/post', postRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
  res.send('WELCOME TO GIST WITH FRIENDS BACKEND APPLICATION');
});

cron.schedule('*/30 * * * *', async () => {
  const getWebsite = await fetch(
    'https://socialmediaappwithchat-backend.onrender.com/'
  );
  // const data = await getWebsite.json();
  if (getWebsite) {
    console.log('running a task every minute');
    console.log(getWebsite.headers);
  }
});
app.use(notFound);
app.use(errorHandler);

server.listen(port, () => {
  console.log(`Server listening on port ${port}`.yellow.underline);
  DBConfig();
});
