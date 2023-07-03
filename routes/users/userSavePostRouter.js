// handle routes related to saving/removing a saved post

const express = require('express');
const savePostRouter = express.Router();

// get controller functions
const { savePost, removeSavedPost } = require('../../controllers/users/userSavePostController.js');

// to save a post
savePostRouter.post('/:postId', savePost);

// to remove a saved post
savePostRouter.delete('/:postId', removeSavedPost);

module.exports = savePostRouter;