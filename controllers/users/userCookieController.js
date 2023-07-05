// controller functions to handle cookie related requests

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');

// check if cookie is valid
// authMiddleware used to check cookie
// return 204 if user in jwt is valid (invalid cookies handled in middleware)
function verifyCookie(req, res) {
    if (req.user) {
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