// controller functions to handle DELETE requests for forums

const Forum = require('../../models/forum.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// to delete a forum
async function deleteForum(req, res) {
    if (!req.user._id.equals(res.forum.creator_id._id)) {
        return returnUnauthorizedReq(res);
    }

    try {
        await Forum.findByIdAndDelete(req.params.forumID);
        returnGoodReq(res, { message: 'Thread removed.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    deleteForum
}