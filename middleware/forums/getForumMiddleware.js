// middleware to get a post based on post id in request URL

const Forum = require('../../models/forum.js');

// find post by id
const getForum = async (req, res, next) => {
    let target;
    try {
        // populate post data to get creator's username and profile pic link
        target = await Forum.findOne({forumID: req.params.forumID}).populate({ path: 'creator_id', select: 'username profile_pic_link'});
        if (!target) {
            return res.status(404).json({ message: 'Unable to find the specified Forum.' });
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
    res.forum = target;
    next();
}

module.exports = {
    getForum
}