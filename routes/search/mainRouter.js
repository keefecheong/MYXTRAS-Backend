// main router to consolidate routes for searching

const express = require('express');
const mainRouter = express.Router();

// nested routers
const searchForumRouter = require('./searchForumRouter.js');
const searchUserRouter = require('./searchUserRouter.js');

// get middleware
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');

// get controller function
const { search } = require('../../controllers/search/searchController.js');

mainRouter.use(validateUserHTTP);

// for general (user/forum) searching
mainRouter.use('/users-forums', (req, res) => search(req, res, 'all'));

// for searching users only
mainRouter.use('/users', searchUserRouter);

// for searching forums only
mainRouter.use('/forums', searchForumRouter);

module.exports = mainRouter;