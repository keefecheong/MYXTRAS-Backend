// controller functions to handle DELETE requests for threads

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const compareId = require('../../utils/general/compareId.js');

const deleteThreadUtil = require('../../utils/threads/deleteThread.js');

// to delete a thread
async function deleteThread(req, res) {
    // check if requesting user is the creator of the thread
    // if the requesting user is not the creator then return 401 error
    if (!compareId(req.user._id, res.thread.creator_id._id)) {
        returnUnauthorizedReq(res);
    }

    try {
        // delete thread from cache and database
        await deleteThreadUtil(req.params.forumID, req.params.threadID, res.threadFromCache);

        returnGoodReq(res, { message: 'Thread removed.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    deleteThread
}