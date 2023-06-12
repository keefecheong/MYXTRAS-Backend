// handle requests for specific chats

const express = require('express');
const chatSpecificRouter = express.Router();

// get controllers
// const { getHistoryMessages } = require('../../controllers/chats/chatMessageController.js);

// get previous messages of requested chat
// chatSpecificRouter.get('/', getHistoryMessages);

module.exports = chatSpecificRouter;