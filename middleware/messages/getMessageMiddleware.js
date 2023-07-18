// middleware to get a message

const Message = require('../../models/message.js');

const returnNotFoundReq = require('../../utils/general/returnNotFoundReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// get message by id
async function getMessage(req, res, next) {
    const messageId = req.params.messageId;
    let target = null;

    try {
        target = await Message.findById(messageId).lean();

        // if message is not found then return 404 error
        if (!target) {
            return returnNotFoundReq(res);
        }
    }
    catch (error) {
        return returnServerErrorReq(res);
    }

    res.message = target;
    next();
}

module.exports = { 
    getMessage
}