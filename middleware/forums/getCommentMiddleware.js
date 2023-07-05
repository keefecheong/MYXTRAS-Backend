// middleware to get a forum based on forum _id in request URL

const Comment = require('../../models/comment.js');

const returnNotFoundReq = require('../../utils/general/returnNotFoundReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// find comment by _id
async function getComment(req, res, next) {
    let target;
    
    try {
        // populate comment data to get creator's username and profile pic link
        target = await Comment.findById(req.params.commentId).getCreator();

        if (!target) {
            return returnNotFoundReq(res);
        }
    }
    catch (error) {
        return returnServerErrorReq(res);
    }

    res.comment = target;
    next();
}

module.exports = {
    getComment
}