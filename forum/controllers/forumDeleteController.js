// controller functions to handle DELETE requests for forums

const returnGoodReq = require('../../utils/returnReq/returnGoodReq.js');
const returnUnauthorizedReq = require('../../utils/returnReq/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/returnReq/returnServerErrorReq.js');
const compareId = require('../../utils/general/compareId.js');

const deleteForumUtil = require('../utils/deleteForum.js');

// to delete a forum
async function deleteForum(req, res) {
    const userId = req.user._id;
    const forumId = req.params.forumID;

    if (!compareId(userId, res.forum.creator_id._id)) {
        return returnUnauthorizedReq(res);
    }

    try {
        // delete forum from cache and database
        await deleteForumUtil(forumId, userId);

        returnGoodReq(res, { message: 'Forum removed.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    deleteForum
}