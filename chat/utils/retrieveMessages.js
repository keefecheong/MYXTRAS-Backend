const Message = require('../models/message.js');
const compareId = require('../../utils/general/compareId.js');

// format an array of messages to frontend usage format
function formatMessages(messages, userId) {
    const result = [];

    messages.forEach(message => {
        // set is_sender based on creator_id and requesting user id
        message.is_sender = compareId(message.creator_id, userId);

        const replyMessageIsArray = Array.isArray(message.reply_message);

        if (replyMessageIsArray && message.reply_message.length == 0) {
            delete message.reply_message;
        }
        
        if (message.reply_message) {
            if (replyMessageIsArray) {
                message.reply_message = message.reply_message[0];
            }

            message.reply_message.is_sender = compareId(message.reply_message.creator_id, userId);

            delete message.reply_message.creator_id;
            delete message.reply_message.last_modified_time;
            delete message.reply_message.creation_time;
            delete message.reply_message.chat_id;
            delete message.reply_message.__v;
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

module.exports = {
    retrieveMessages,
    formatMessages
}