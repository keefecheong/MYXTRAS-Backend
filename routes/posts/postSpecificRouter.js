// handle routes for individual posts

const express = require('express');
const postSpecificRouter = express.Router({ mergeParams: true });

// get nested routers
const postLikeRouter = require('./postLikeRouter.js');
const postCommentRouter = require('./postCommentRouter.js');
const postSaveRouter = require('./postSaveRouter.js');

// get middleware
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');

// get controllers
const { updatePost } = require('../../controllers/posts/postUpdateController.js');
const { deletePost } = require('../../controllers/posts/postDeleteController.js');

// mount routes
// modify a post
postSpecificRouter.patch('/', multerConfig.array('selectedImages'), multerErrorHandler, updatePost);

// delete a post
postSpecificRouter.delete('/', deletePost);

// handle comment requests
postSpecificRouter.use('/comments', postCommentRouter);

// handle like requests
postSpecificRouter.use('/likes', postLikeRouter);

// handle save requests
postSpecificRouter.use('/save', postSaveRouter);

module.exports = postSpecificRouter;