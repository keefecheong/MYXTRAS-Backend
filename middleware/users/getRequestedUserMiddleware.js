// middleware to get a post based on post id in request URL

const User = require('../../models/user.js');

const returnNotFoundReq = require('../../utils/general/returnNotFoundReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// find user by id
async function getUser (req, res, next) {
    let target;

    try {
        target = await User.findById(req.params.userId);

        if (!target) {
            return returnNotFoundReq(res);
        }
    }
    catch (error) {
        return returnServerErrorReq(res);
    }

    res.user = target;
    next();
}

module.exports = {
    getUser
}