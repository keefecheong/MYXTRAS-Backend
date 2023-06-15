// handle requests for specific chats

const express = require('express');
const chatSpecificRouter = express.Router();

// get controllers
const { getChatMessages, getPreviousMessages } = require('../../controllers/chats/chatMessageController.js');

// get <count> messages of requested chat
chatSpecificRouter.get('/:count', getChatMessages);

// get more previous messages of requested chat
// oldestMessageTime - the creation_time of the message with the oldest creation_time
// count - number of messages to get
chatSpecificRouter.get('/:oldestMessageTime/:count', getPreviousMessages)

module.exports = chatSpecificRouter;