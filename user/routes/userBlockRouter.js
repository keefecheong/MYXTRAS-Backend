// routes to block/unblock a user

const express = require('express');
const blockRouter = express.Router();

const { blockUser, unblockUser } = require('../controllers/userBlockController.js');

// block a user
blockRouter.post('/', blockUser);

// unblock a user
blockRouter.delete('/', unblockUser);

module.exports = blockRouter;