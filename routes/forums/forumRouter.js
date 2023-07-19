// handle general forum routes

const express = require('express');
const forumRouter = express.Router();

const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');

const { verifyForumID, getCreated, getSubscribed, getRecommended, getCategorized } = require('../../controllers/forums/forumController.js');
const { createForum } = require('../../controllers/forums/forumSaveController.js');

// get forums created by the user
forumRouter.get('/created', getCreated);

// get forums subscribed by the user
forumRouter.get('/subscribed', getSubscribed);

// get categorized forums
forumRouter.get('/categorized', getCategorized);

// get recommended forums
forumRouter.get('/recommended', getRecommended);

// create new forum
forumRouter.post('/', multerConfig.array('selectedImages'), multerErrorHandler, createForum);

// verify if forum_id is already taken
forumRouter.post('/verify-forumID', express.json(), verifyForumID);

module.exports = forumRouter;