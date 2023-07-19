// to handle requests for individual forums

const express = require('express');
const forumSpecificRouter = express.Router({ mergeParams: true });

// get nested routers
const subscribeRouter = require('./forumSubscribeRouter.js');

// get middleware
const { getForum } = require('../../middleware/forums/getForumMiddleware.js');
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');

// get controllers
const { getOneForum } = require('../../controllers/forums/forumController.js');
const { updateForum } = require('../../controllers/forums/forumSaveController.js');
const { deleteForum } = require('../../controllers/forums/forumDeleteController.js');

// mount routes
forumSpecificRouter.use('/subscribe', subscribeRouter);

// get one forum
forumSpecificRouter.get('/', getForum, getOneForum);

// update forum
forumSpecificRouter.patch('/', multerConfig.array('selectedImages'), multerErrorHandler, updateForum);

// delete forum
forumSpecificRouter.delete('/', deleteForum);

module.exports = forumSpecificRouter;