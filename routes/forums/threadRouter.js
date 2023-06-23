// handle general routes related to threads

const express = require('express');
const threadRouter = express.Router();

const { getThread } = require('../../middleware/forums/getThreadMiddleware.js');
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');

const { getAll, getForumThreads, getOneThread, getPopularThreads } = require('../../controllers/forums/threadController.js');
const { createThread, updateThread } = require('../../controllers/forums/threadSaveController.js');

// get all threads for explore 
threadRouter.get('/', getAll);

// Retrieve 6 popular threads 
threadRouter.get('/popular', getPopularThreads);

// get list of threads for a forum
threadRouter.get('/forum/:forumID', getForumThreads);

// get single thread to display on threadView
threadRouter.get('/:threadID', getThread, getOneThread);

// creating a new thread
threadRouter.post('/:forumID', multerConfig.array('picture'), multerErrorHandler, createThread);

// update thread
threadRouter.patch('/:threadID', multerConfig.array('picture'), multerErrorHandler, getThread, updateThread);

module.exports = threadRouter;