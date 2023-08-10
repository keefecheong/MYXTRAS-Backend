// controller functions to handle DELETE requests for threads

const returnGoodReq = require('../../utils/returnReq/returnGoodReq.js');
const returnUnauthorizedReq = require('../../utils/returnReq/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/returnReq/returnServerErrorReq.js');
const compareId = require('../../utils/general/compareId.js');

const deleteThreadUtil = require('../utils/deleteThread.js');

// to delete a thread
async function deleteThread(req, res) {
    // check if requesting user is the creator of the thread
    // if the requesting user is not the creator then return 401 error
    if (!compareId(req.user._id, res.thread.creator_id._id)) {
        returnUnauthorizedReq(res);
    }

    try {
        // delete thread from cache and database
        await deleteThreadUtil(req.params.forumId, req.params.threadId, res.threadFromCache);

        returnGoodReq(res, { message: 'Thread removed.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    deleteThread
}