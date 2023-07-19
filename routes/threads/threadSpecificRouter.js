// routes to handle updates on a single thread

const express = require('express');
const specificRouter = express.Router({ mergeParams: true });

// nested routers
const commentRouter = require('./threadCommentRouter.js');
const likeRouter = require('./threadLikeRouter.js');
const dislikeRouter = require('./threadDislikeRouter.js');

// get middleware
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');

// get controllers
const { updateThread } = require('../../controllers/threads/threadSaveController.js');
const { deleteThread } = require('../../controllers/threads/threadDeleteController.js');

// mount routes
// handle like requests
specificRouter.use('/like', likeRouter);

// handle dislike requests
specificRouter.use('/dislike', dislikeRouter);

// handle comment requests
specificRouter.use('/comments', commentRouter);

// update thread
specificRouter.patch('/', multerConfig.array('picture'), multerErrorHandler, updateThread);

// delete thread
specificRouter.delete('/', deleteThread);

module.exports = specificRouter;