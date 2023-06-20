// middleware to get a post based on post id in request URL

const Thread = require('../../models/thread.js');

// find post by id
const getThread = async (req, res, next) => {
    let target;
    try {
        // populate post data to get creator's username and profile pic link
        target = await Thread.findById(req.params.threadID).populate({ path: 'creator_id', select: 'username profile_pic_link'});
        if (!target) {
            return res.status(404).json({ message: 'Unable to find the specified Thread.' });
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }

    res.thread = target;
    next();
}

module.exports = {
    getThread
}