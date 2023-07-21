// controller functions to handle cookie related requests

const { USER_STATUS_SUSPENDED, USER_STATUS_TERMINATED, USER_SUSPENDED_MSG, USER_TERMINATED_MSG } = require('../../models/user.js');
const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnForbiddenReq = require('../../utils/general/returnForbiddenReq.js');

// check if cookie is valid
// authMiddleware used to check cookie
// return 204 if user in jwt is valid (invalid cookies handled in middleware)
function verifyCookie(req, res) {
    const user = req.user;

    if (user) {
        // return 403 if user is suspended or terminated
        if (user.status?.status == USER_STATUS_SUSPENDED) {
            return returnForbiddenReq(res, USER_SUSPENDED_MSG);
        }
        else if (user.status?.status == USER_STATUS_TERMINATED) {
            return returnForbiddenReq(res, USER_TERMINATED_MSG);
        }

        returnGoodReq(res, req.user);
    }
    else {
        returnUnauthorizedReq(res);
    }
}

// clear jwt cookie and return 204
function clearCookie(req, res) {
    res.clearCookie('authapi');
    returnNoContentReq(res);
}

module.exports = {
    verifyCookie,
    clearCookie
}