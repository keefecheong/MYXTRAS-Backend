// controller functions to handle DELETE requests for threads

const Thread = require('../../models/thread.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// to delete a thread
async function deleteThread(req, res) {
    // check if requesting user is the creator of the thread
    // if the requesting user is not the creator then return 401 error
    if (!req.user._id.equals(res.thread.creator_id._id)) {
        returnUnauthorizedReq(res);
    }

    try {
        await Thread.findByIdAndDelete(req.params.threadID);
        returnGoodReq(res, { message: 'Thread removed.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    deleteThread
}