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

// initialize gamification
require('./utils/gamification/init.js');

// initialize cache             
require('./cache/init.js');

// mount routes
const mountRoutes = require('./routes/mountRoutes.js');
mountRoutes(app);

// start server
const server = app.listen(process.env.PORT, () => console.log(`Listening on Port ${process.env.PORT}...`));

// initialize socket
const { initSocket } = require('./sockets/init.js');
initSocket(server, corsOptions);