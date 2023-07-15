// route to report a user

const express = require('express');
const reportRouter = express.Router();

const { reportUser } = require('../../controllers/users/userReportController.js');

// to report a user
reportRouter.post('/', reportUser);

module.exports = reportRouter;