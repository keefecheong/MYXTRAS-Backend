// handle general routes related to threads

const express = require('express');
const threadRouter = express.Router();

const { getForum } = require('../../middleware/forums/getForumMiddleware.js');
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');

const { getForumThreads, getPopularThreads, getExploreThreads, getRecentThreads } = require('../../controllers/threads/threadController.js');
const { createThread } = require('../../controllers/threads/threadSaveController.js');

// get threads for explore 
threadRouter.get('/explore', getExploreThreads);

// Retrieve 6 popular threads 
threadRouter.get('/popular', getPopularThreads);

// get recent threads
threadRouter.get('/recent', getRecentThreads);

// get list of threads for a forum
threadRouter.get('/forum/:forumID', getForumThreads);

// creating a new thread
threadRouter.post('/:forumID', getForum, multerConfig.array('picture'), multerErrorHandler, createThread);

module.exports = threadRouter;