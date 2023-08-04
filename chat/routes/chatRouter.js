// handle requests for generic chats (for each user)

const express = require('express');
const chatRouter = express.Router();

// get controllers
const { getEnrolledChats, checkExistingChat } = require('../controllers/chatController.js');
const { getLatestMessages } = require('../controllers/chatMessageController.js');

// get enrolled chats by current user
chatRouter.get('/', getEnrolledChats);

// get messages for top 5 latest used chats
chatRouter.get('/latestMessages', getLatestMessages);

// check if there is an existing chat between the current user and the requested user
chatRouter.get('/check/:userId', checkExistingChat);

module.exports = chatRouter;