// middleware to get chat from chatId

const Chat = require('../../models/chat.js');

const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnNotFoundReq = require('../../utils/general/returnNotFoundReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// find chat by id
async function getChat(req, res, next) {
    let target;

    try {
        target = await Chat.findById(req.params.chatId);
        
        // if chat does not exist return 404 error
        if (!target) {
            return returnNotFoundReq(res);
        }

        // check if user is a member of the chat
        // if requesting user is not a member of the chat return 401 error
        if (target.users.indexOf(req.user._id) == -1) {
            return returnUnauthorizedReq(res);
        }
    }
    catch (error) {
        return returnServerErrorReq(res);
    }

    res.chat = target;
    next();
}

module.exports = {
    getChat
}