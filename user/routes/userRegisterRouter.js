// handle routes related to registering a new user

const express = require("express");
const registerRouter = express.Router();

const { registerUser } = require("../controllers/userRegisterController.js");

// to register a new user
registerRouter.post("/", registerUser);

module.exports = registerRouter;
