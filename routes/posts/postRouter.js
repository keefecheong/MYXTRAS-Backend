// handle routes related to posts

// initialize router
const express = require('express');
const postRouter = express.Router();

// get middleware
const { getPost } = require('../../middleware/posts/getPostMiddleware.js');
const { multerConfig, multerErrorHandler } = require('../../middleware/multerMiddleware.js');

// get controller functions
const { getAllPosts, getFollowingPosts, getOnePost } = require('../../controllers/posts/postController.js');
const { createPost, updatePost } = require('../../controllers/posts/postSaveController.js');
const { deletePost } = require('../../controllers/posts/postDeleteController.js');

// retrieve all posts
postRouter.get('/', getAllPosts);

// retrieve user's own posts and posts by users followed
postRouter.get('/following', getFollowingPosts);

// retrieve a post by id
postRouter.get('/:postId', getPost, getOnePost);

// create a post
postRouter.post('/', multerConfig.array('selectedImages'), multerErrorHandler, createPost);

// modify a post
postRouter.patch('/:postId', multerConfig.array('selectedImages'), multerErrorHandler, getPost, updatePost);

// delete a post
postRouter.delete('/:postId', getPost, deletePost);

module.exports = postRouter;