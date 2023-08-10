// handle routes related to posts

// initialize router
const express = require('express');
const postRouter = express.Router();

// get middleware
const { multerConfig, multerErrorHandler } = require('../../middleware/multerMiddleware.js');
const { getUser } = require('../../user/middleware/getRequestedUserMiddleware.js');

// get controller functions
const { getFollowingPosts, getUserPosts, getPopularPosts, getSavedPosts } = require('../controllers/postController.js');
const { createPost } = require('../controllers/postUpdateController.js');

// retrieve user's own posts and posts by users followed
postRouter.get('/following', getFollowingPosts);

// retrieve popular posts for 'explore'
postRouter.get('/explore', getPopularPosts);

// retireve user's own posts
postRouter.get('/by/self', getUserPosts);

// retrieve a post by userid
postRouter.get('/by/:userId', getUser, getUserPosts);

// retrieve posts saved by the user
postRouter.get('/saved', getSavedPosts);

// create a post
postRouter.post('/', multerConfig.array('selectedImages'), multerErrorHandler, createPost);

module.exports = postRouter;