// middleware to get a forum based on forum _id in request URL

const Forum = require('../../models/forum.js');

const returnNotFoundReq = require('../../utils/general/returnNotFoundReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// find post by _id
async function getForum(req, res, next) {
    let target;

    try {
        // populate forum data to get creator's username and profile pic link
        target = await Forum.findById(req.params.forumID).getCreator();
        
        if (!target) {
            return returnNotFoundReq(res);
        }
    }
    catch (error) {
        return returnServerErrorReq(res);
    }

    res.forum = target;
    next();
}

module.exports = {
    getForum
}