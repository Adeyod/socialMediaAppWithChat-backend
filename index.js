import express from 'express';
import DBConfig from './DBConfig/DBConfig.js';
import colors from 'colors';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

const port = process.env.PORT || 5500;

app.use('/api/user', userRoutes);
app.use('/api/post', postRoutes);

app.get('/', (req, res) => {
  res.send('WELCOME TO GIST WITH FRIENDS BACKEND APPLICATION');
});
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`.yellow.underline);
  DBConfig();
});
