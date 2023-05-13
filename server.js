// import required libraries
require('dotenv').config();

const express = require('express');
const app = express();
const mongoose = require('mongoose');

// make connection with mongodb (create .env file and put mongodb URL as variable DATABASE_URL)
mongoose.connect(process.env.DATABASE_URL);
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to database.'));

// use express json middleware
app.use(express.json());

// routes
const postsRouter = require('./routes/posts.js');
app.use('/api/posts', postsRouter);

// start server (put port number as variable PORT in .env file)
app.listen(process.env.PORT, () => console.log(`Listening on Port ${process.env.PORT}...`));