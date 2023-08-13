// controller functions to verify email and phone number during registration

const { User } = require("../models/user.js");

const returnGoodReq = require("../../utils/returnReq/returnGoodReq.js");
const returnBadReq = require("../../utils/returnReq/returnBadReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");

// check if email exists
async function verifyEmail(req, res) {
  const email = req.body.email;

  if (!email) {
    return returnBadReq(res, "Invalid request body.");
  }

  try {
    const existingEmail = await User.findOne({ email: email });

    if (existingEmail) {
      returnBadReq(res, "Email already exists");
    } else {
      returnGoodReq(res);
    }
  } catch (error) {
    returnServerErrorReq(res);
  }
}

// check if phone number exists
async function verifyPhoneNum(req, res) {
  const phoneNumber = req.body.phoneNumber;

  if (!phoneNumber) {
    return returnBadReq(res, "Invalid request body.");
  }

  try {
    const existingPhone = await User.findOne({ phone_number: phoneNumber });

    if (existingPhone) {
      returnBadReq(res, "Phone number already exists");
    } else {
      returnGoodReq(res);
    }
  } catch (error) {
    returnServerErrorReq(res);
  }
}

// check if phone number exists
async function verifyUsername(req, res) {
  const username = req.body.username;

  if (!username) {
    return returnBadReq(res, "Invalid request body.");
  }

  try {
    const existingUsername = await User.findOne({ username: username });

    if (existingUsername) {
      returnBadReq(res, "Username already exists");
    } else {
      returnGoodReq(res);
    }
  } catch (error) {
    returnServerErrorReq(res);
  }
}

module.exports = {
  verifyEmail,
  verifyPhoneNum,
  verifyUsername,
};
