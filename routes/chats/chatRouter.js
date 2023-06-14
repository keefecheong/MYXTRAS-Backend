// handle requests for generic chats (for each user)

const express = require('express');
const chatRouter = express.Router();

// get controllers
const { getEnrolledChats } = require('../../controllers/chats/chatController.js');
const { getLatestMessages } = require('../../controllers/chats/chatMessageController.js');

// get enrolled chats by current user
chatRouter.get('/', getEnrolledChats);

// get messages for top 5 latest used chats
chatRouter.get('/latestMessages', getLatestMessages);

module.exports = chatRouter;