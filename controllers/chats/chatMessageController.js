// controller functions to get chat messages

const Chat = require('../../models/chat.js');
const Message = require('../../models/message.js');
const compareId = require('../../utils/general/compareId.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// get stored messages for the specifically requested chat
async function getChatMessages(req, res) {
    try {
        // get <count> messages associated with the requested chat
        const messages = await retrieveMessages({
            chat_id: res.chat._id
        }, req.params.count, req.user._id);

        returnGoodReq(res, messages);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// get last 50 messages from each of the top 5 last used chats
async function getLatestMessages(req, res) {
    try {
        // get id of top 5 latest used chats (based on last_message_timestamp) that the requesting user is a member of
        const latestChats = await Chat
            .find({ users: req.user._id }, { '_id': 1 })
            .sort({ last_message_timestamp: -1 })
            .limit(5);

        const result = {};

        // get latest 50 messages for each of the top 5 latest used chats
        for (let i = 0; i < latestChats.length; i++) {
            const messages = await retrieveMessages({
                chat_id: latestChats[i]._id
            }, 50, req.user._id);
            
            // format the messages and add to result in ascending creation_time
            result[latestChats[i]._id] = messages;
        }

        returnGoodReq(res, { data: result });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// get additional messages from chat
async function getPreviousMessages(req, res) {
    try {
        // decode URI encoded timestamp
        const decodedTimestamp = decodeURIComponent(req.params.oldestMessageTime);

        // get <count> more messages before the message with the creation_time of <oldestMessageTime> from the specified chat
        const messages = await retrieveMessages({
            chat_id: res.chat._id,
            creation_time: {
                $lt: new Date(decodedTimestamp)
            }
        }, req.params.count, req.user._id);

        returnGoodReq(res, messages);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    getChatMessages,
    getLatestMessages,
    getPreviousMessages
}

// format an array of messages to frontend usage format
function formatMessages(messages, userId) {
    const result = [];

    messages.forEach(message => {
        // set is_sender based on creator_id and requesting user id
        message.is_sender = compareId(message.creator_id, userId);
        
        if (message.reply_message) {
            message.reply_message.is_sender = compareId(message.reply_message.creator_id, userId);

            delete message.reply_message.creator_id;
        }

        // remove unneeded fields
        delete message.creator_id;
        delete message.chat_id;
        delete message.__v;
        
        // remove last_modified_time if not edited
        if (message.creation_time.toString() == message.last_modified_time.toString()) {
            delete message.last_modified_time;
        }
        
        result.push(message);
    });
    
    return result;
}

// common function to get messages with given filter and limit, format messages and return in chronological order
async function retrieveMessages(filter, limit, userId) {
    const messages = await Message
        .find(filter)
        .sort({ creation_time: -1 })
        .limit(limit)
        .getReplyMessage()
        .lean();

    return formatMessages(messages, userId).reverse();
}