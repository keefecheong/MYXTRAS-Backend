// controller functions to get chats

const Chat = require('../models/chat.js');

const returnGoodReq = require('../../utils/returnReq/returnGoodReq.js');
const returnBadReq = require('../../utils/returnReq/returnBadReq.js');
const returnServerErrorReq = require('../../utils/returnReq/returnServerErrorReq.js');
const compareId = require('../../utils/general/compareId.js');

const formatChat = require('../utils/formatChat.js');

// get all enrolled chats of the requesting user
async function getEnrolledChats(req, res) {
    try {
        // get all chats with requesting user's user id in users
        const enrolledChats = await Chat
            .find({ users: req.user._id })
            .sort({ last_message_timestamp: -1 })
            .getUser(req.user._id)
            .lean();
    
        const result = [];
    
        // if user has chats then format each chat to suit frontend parsing
        if (enrolledChats) {
            enrolledChats.forEach(chat => {
                result.push(formatChat(chat, req.user._id, req.user.blocked_users));
            });
        }
    
        returnGoodReq(res, { chats: result });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// to check if the current user has an existing chat with another user
async function checkExistingChat(req, res) {
    // if user is requesting to have chat with the same user id then return 400 error
    if (compareId(req.user._id, req.params.userId)) {
        return returnBadReq(res, 'Cannot chat with self.');
    }

    try {
        var existingChat = await Chat
            .findOne({ 
                $or: [
                    { users: [req.user._id, req.params.userId] },
                    { users: [req.params.userId, req.user._id] }
                ]
            })
            .getUser(req.user._id)
            .lean();

        // format existing chat if present
        if (existingChat) {
            existingChat = formatChat(existingChat, req.user._id, req.user.blocked_users);
        }

        // returns the existing chat if present, null otherwise
        returnGoodReq(res, { existingChat });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    getEnrolledChats,
    checkExistingChat
}