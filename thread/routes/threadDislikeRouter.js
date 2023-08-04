// handle routes related to dislike status of threads

const express = require('express');
const dislikeRouter = express.Router();

const { addDislikeThread, removeDislikeThread } = require('../controllers/threadDislikeController.js');

// add dislike to thread
dislikeRouter.post('/', addDislikeThread);

// remove dislike from thread
dislikeRouter.delete('/', removeDislikeThread);

module.exports = dislikeRouter;