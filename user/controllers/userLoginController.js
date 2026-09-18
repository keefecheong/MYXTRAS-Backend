// controller functions to handle user login

const { User } = require("../models/user.js");
const { setJWT } = require("../utils/setJWT.js");
const bcrypt = require("bcryptjs");

const returnGoodReq = require("../../utils/returnReq/returnGoodReq.js");
const returnBadReq = require("../../utils/returnReq/returnBadReq.js");
const returnForbiddenReq = require("../../utils/returnReq/returnForbiddenReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");
const suspendUserUtil = require("../../admin/utils/accounts/suspendUserUtil.js");

// login user
async function loginUser(req, res) {
  // return 400 error if no data is sent
  if (!req.body) {
    return returnBadReq(res, "Invalid request body");
  }

  const { emailAddress, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email: emailAddress }).select(
      "email password is_profile_setup status",
    );

    // User not found
    if (!user) {
      return returnBadReq(res, "Invalid email or password");
    }

    // Check if the password is correct
    if (!bcrypt.compareSync(password, user.password)) {
      return returnBadReq(res, "Invalid email or password");
    }

    // remove suspend if end_time is reached
    const checkUserStatus = await suspendUserUtil(false, user);

    // if accessGranted is false means user is terminated or suspended
    // return 403
    if (!checkUserStatus.accessGranted) {
      return returnForbiddenReq(res, user.lockoutMessage);
    }

    // sign jwt and return as cookie
    setJWT(user._id, res);

    // Authentication successful
    returnGoodReq(res, {
      message: "Login successful",
      is_profile_setup: user.is_profile_setup,
    });
  } catch (error) {
    returnServerErrorReq(res);
  }
}

module.exports = {
  loginUser,
};
