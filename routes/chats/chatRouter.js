// handle requests for generic chats (for each user)

const express = require('express');
const chatRouter = express.Router();

// get controllers
// const { getEnrolledChats } = require('../../controllers/chats/chatController.js');

// get enrolled chats by current user
// chatRouter.get('/', getEnrolledChats);

module.exports = chatRouter;