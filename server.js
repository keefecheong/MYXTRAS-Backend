// use dotenv for .env variables
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());

const cors = require('cors');
app.use(cors({
    origin: process.env.FRONTEND_SERVER_URL,
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PATCH'],
    credentials: true,
}));

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

// start server
app.listen(process.env.PORT, () => console.log(`Listening on Port ${process.env.PORT}...`));