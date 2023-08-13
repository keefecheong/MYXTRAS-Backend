// middleware to get a post based on post id in request URL

const { User } = require("../models/user.js");

const returnNotFoundReq = require("../../utils/returnReq/returnNotFoundReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");

const { getUserKey } = require("../cache/userCache.js");

// find user by id
async function getUser(req, res, next) {
  let target;

  try {
    const userId = req.params.userId;
    target = await User.findById(userId)
      .lean()
      .cache({
        key: getUserKey(userId),
      });

    if (!target) {
      return returnNotFoundReq(res);
    }
  } catch (error) {
    return returnServerErrorReq(res);
  }

  res.user = target;
  next();
}

module.exports = {
  getUser,
};
