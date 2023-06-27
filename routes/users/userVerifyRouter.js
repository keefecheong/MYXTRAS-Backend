// handle routes related to verifying user information eg email and phone number

const express = require('express');
const verifyRouter = express.Router();

const { verifyEmail, verifyPhoneNum } = require('../../controllers/users/userVerifyController.js');

// verify email
verifyRouter.post('/email', verifyEmail);

// verify phone number
verifyRouter.post('/phone', verifyPhoneNum);

module.exports = verifyRouter;