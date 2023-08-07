// controller functions to terminate/unterminate user

const { User, USER_STATUS_TERMINATED } = require("../../user/models/user");

const returnBadReq = require("../../utils/returnReq/returnBadReq");
const returnGoodReq = require("../../utils/returnReq/returnGoodReq");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq");

const { updateCachedUser } = require("../../user/cache/userUpdateCache");
const terminateUserUtil = require("../../report/utils/terminateUserUtil");
const compareId = require("../../utils/general/compareId")

// to terminate user
async function terminateUser(req, res) {
    // return 400 if user to terminate is self
    if (compareId(res.user._id, req.user._id)) {
        return returnBadReq(res, 'You cannot terminate yourself.');
    }

    // return 400 if user to terminate is already terminated
    if (res.user.status?.status == USER_STATUS_TERMINATED) {
        return returnBadReq(res, 'User is already terminated.');
    }

    try {
        // terminate user
        await terminateUserUtil(res.user, req.user._id);

        returnGoodReq(res, { message: 'User terminated successfully.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// to unterminate user
async function unterminateUser(req, res) {
    // return 400 if user to unterminate is self
    if (compareId(res.user._id, req.user._id)) {
        return returnBadReq(res, 'You cannot unterminate yourself.');
    }

    // return 400 if user to unterminate is not terminated
    if (res.user.status?.status != USER_STATUS_TERMINATED) {
        return returnBadReq(res, 'User is not terminated.');
    }

    try {
        const user = new User(res.user);
        user.isNew = false;
        
        user.status = {};
        
        await Promise.all([
            // unterminate user
            user.save(),
            // update cache
            updateCachedUser({ status: {} }, user._id, true)
        ]);

        returnGoodReq(res, { message: 'User unterminated successfully.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    terminateUser,
    unterminateUser
}