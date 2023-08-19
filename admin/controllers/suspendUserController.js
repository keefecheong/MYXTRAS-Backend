// controller functions to suspend/unsuspend user

const { USER_STATUS_SUSPENDED } = require("../../user/models/user.js");

const returnGoodReq = require("../../utils/returnReq/returnGoodReq.js");
const returnBadReq = require("../../utils/returnReq/returnBadReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");

const suspendUserUtil = require("../../report/utils/suspendUserUtil.js");
const compareId = require("../../utils/general/compareId.js");

// to suspend user
async function suspendUser(req, res) {
  // return 400 if user to suspend is self
  if (compareId(res.user._id, req.user._id)) {
    return returnBadReq(res, "You cannot suspend yourself");
  }

  // return 400 if user to suspend is already suspended or terminated
  if (res.user.status?.status) {
    return returnBadReq(res, `User is already ${res.user.status.status}`);
  }

  const duration = req.body?.duration;

  // return 400 if suspend duration is invalid or missing
  if (duration == null || isNaN(duration)) {
    return returnBadReq(res, "Invalid suspend duration.");
  }

  // calculate end time (duration in minutes)
  const endTime = Date.now() + parseInt(duration);

  try {
    // suspend user
    await suspendUserUtil(true, res.user, req.user._id, endTime);

    returnGoodReq(res, {
      message: `User suspended until ${new Date(endTime).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })}.`,
    });
  } catch (error) {
    returnServerErrorReq(res);
  }
}

// to unsuspend user
async function unsuspendUser(req, res) {
  // return 400 if user to unsuspend is self
  if (compareId(res.user._id, req.user._id)) {
    return returnBadReq(res, "You cannot unsuspend yourself.");
  }

  // return 400 if user to unsuspend is not suspended
  if (res.user.status?.status != USER_STATUS_SUSPENDED) {
    return returnBadReq(res, "User is not suspended.");
  }

  try {
    // unsuspend user
    await suspendUserUtil(false, res.user, req.user._id);

    returnGoodReq(res, { message: "User unsuspended successfully." });
  } catch (error) {
    returnServerErrorReq(res);
  }
}

module.exports = {
  suspendUser,
  unsuspendUser,
};
