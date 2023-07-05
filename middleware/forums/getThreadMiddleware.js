// middleware to get a post based on post id in request URL

const Thread = require('../../models/thread.js');

const returnNotFoundReq = require('../../utils/general/returnNotFoundReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// find post by id
async function getThread(req, res, next) {
    let target;
    
    try {
        // populate thread data to get creator's username and profile pic link
        target = await Thread.findById(req.params.threadID).getCreator();
        
        if (!target) {
            return returnNotFoundReq(res);
        }
    }
    catch (error) {
        return returnServerErrorReq(res);
    }

    res.thread = target;
    next();
}

module.exports = {
    getThread
}