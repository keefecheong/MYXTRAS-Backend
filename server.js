// use dotenv for .env variables
require('dotenv').config();

const express = require('express');
const app = express();

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// configure cors
const cors = require('cors');
const corsOptions = {
    origin: process.env.FRONTEND_SERVER_URL,
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PATCH'],
    credentials: true,
};

app.use(cors(corsOptions));

// make connection with mongodb
const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL);

const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to database.'));

// initialize Firebase (for storing files/images)
const { initializeApp } = require('firebase/app');

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    appId: process.env.FIREBASE_APP_ID
}

const firebaseApp = initializeApp(firebaseConfig);

// routes
const postsRouter = require('./routes/posts/mainRouter.js');
app.use('/api/posts', postsRouter);

const usersRouter = require('./routes/users/mainRouter.js');
app.use('/api/users', usersRouter);

const schoolRouter = require('./routes/schools/mainRouter.js');
app.use('/api/schools', schoolRouter);

const forumRouter = require('./routes/forums/mainRouter.js');
app.use('/api/forums', forumRouter);

const searchRouter = require('./routes/search/mainRouter.js');
app.use('/api/search', searchRouter);

const chatRouter = require('./routes/chats/mainRouter.js');
app.use('/api/chats', chatRouter);

// start server
const server = app.listen(process.env.PORT, () => console.log(`Listening on Port ${process.env.PORT}...`));

// initialize socket
const { initSocket } = require('./sockets/init.js');
initSocket(server, corsOptions);