// handle routes related to posts

// initialize router
const express = require('express');
const postRouter = express.Router();

// get middleware
const { getPost } = require('../../middleware/posts/getPostMiddleware.js');
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');

// get controller functions
const { getAllPosts, getFollowingPosts, getOnePost, getOwnPosts, getUserPost, getPopularPosts, getSavedPosts } = require('../../controllers/posts/postController.js');
const { createPost, updatePost } = require('../../controllers/posts/postSaveController.js');
const { deletePost } = require('../../controllers/posts/postDeleteController.js');

// retrieve all posts
postRouter.get('/', getAllPosts);

// retrieve user's own posts and posts by users followed
postRouter.get('/following', getFollowingPosts);

// retrieve popular posts for 'explore'
postRouter.get('/explore', getPopularPosts);

// retireve user's own posts
postRouter.get('/by/self', getOwnPosts);

// retrieve a post by userid
postRouter.get('/by/:userId', getUserPost);

// retrieve posts saved by the user
postRouter.get('/saved', getSavedPosts);

// retrieve a post by id
postRouter.get('/:postId', getPost, getOnePost);

// create a post
postRouter.post('/', multerConfig.array('selectedImages'), multerErrorHandler, createPost);

// modify a post
postRouter.patch('/:postId', multerConfig.array('selectedImages'), multerErrorHandler, getPost, updatePost);

// delete a post
postRouter.delete('/:postId', getPost, deletePost);

module.exports = postRouter;