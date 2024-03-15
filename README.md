## Thread Clone Backend

This is the backend folder of a thread clone project that i embark on since 2 weeks now. I developed the project using Node.js as the runtime and express.js as the framework. This provides the server-side functionality for managing threads MVC, comments and users and user authentication.

# Features

1. RESTful API endpoints for managing users, posts, replies, post like and unlike, user follow and unfollow

1. Authentication and Authorization of users using JSON Web Tokens.

1. MongoDB integration for data storage.

1. Express.js for handling HTTP request and routing.

1. Nodemailer for sending mails.

1. Cloudinary for image upload.

1. Bcryptjs for hashing and comparing of password.

1. cookie-parser to parse cookies coming from the request.

1. Cors for cross-origin resource sharing.

1. Dotenv for saving secret keys.

1. Helmet for securing the App.

# Prerequisites

Before running the project, make sure you have the following packages installed:

1. Node.js
1. MongoDB
1. npm or yarn package manager

# Installation

1. Clone the repository.

1. Install dependencies.

1. Configure environment variables

# Usage

1. Start the MongoDB server
1. Start the server

## API Endpoints

# user routes

1. `POST /api/user/login`: login and authenticate user

1. `POST /api/user/register`: register user

1. `POST /api/user/logout`: logout user

1. `POST /resend-email-verification`: resend email verification

1. `POST /api/user/forgot-password`: forgot password

1. `POST /api/user/follow/:id`: follow and unFollow user

1. `PUT /api/user/update/:id`: update user profile

1. `GET /api/user/allow-reset-password/:userId/`: allow reset password

1. `POST /reset-password/:userId/:token`: reset password

1. `GET /api/user/user-verification/:userId/:token`: email verification

1. `GET /api/user/profile/:query`" get user profile

# post routes

1. `POST /api/post/create`: create post

1. `GET /api/post/feeds`: get feed posts

1. `GET /api/post/:id`: get post

1. `GET /api/post/user/:username`, get user posts

1. `DELETE /api/post/:id`: delete post

1. `PUT /api/post/likes/:id`: verifyToken, like and unlike post

1. `PUT /api/post/reply/:id`: reply to post
