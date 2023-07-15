// handle routes related to saving/removing a saved post

const express = require('express');
const savePostRouter = express.Router();

// get controller functions
const { savePost, removeSavedPost } = require('../../controllers/users/userSavePostController.js');

// to save a post
savePostRouter.post('/', savePost);

// to remove a saved post
savePostRouter.delete('/', removeSavedPost);

module.exports = savePostRouter;