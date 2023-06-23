// handle routes related to like status of threads

const express = require('express');
const likeRouter = express.Router();

const { addLikeThread, removeLikeThread } = require('../../controllers/forums/threadLikeController');

// add a like to thread
likeRouter.post('/', addLikeThread);

// remove like from thread
likeRouter.delete('/', removeLikeThread);

module.exports = likeRouter;