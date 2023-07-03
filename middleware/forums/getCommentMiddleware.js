// middleware to get a forum based on forum _id in request URL

const Comment = require('../../models/comment.js');

// find comment by _id
const getComment = async (req, res, next) => {
    let target;
    try {
        // populate comment data to get creator's username and profile pic link
        target = await Comment.findById(req.params.commentId).populate({ path: 'creator_id', select: 'username profile_pic_link'});
        if (!target) {
            return res.status(404).json({ message: 'Unable to find the specified Comment.' });
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
    res.comment = target;
    next();
}

module.exports = {
    getComment
}