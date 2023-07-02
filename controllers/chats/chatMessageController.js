const Chat = require('../../models/chat.js');
const Message = require('../../models/message.js');

// get stored messages for the specifically requested chat
async function getChatMessages(req, res) {
    try {
        // get <count> messages associated with the requested chat
        const messages = await Message
            .find({ chat_id: res.chat._id })
            .sort({ creation_time: -1 })
            .limit(req.params.count)
            .populate({
                path: 'reply_message',
                select: '-creation_time -last_modified_time -reply_message -chat_id'
            })
            .lean();
    
        const result = formatMessages(messages, req.user._id).reverse();
    
        res.status(200).json({ messages: result });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// get last 50 messages from each of the top 5 last used chats
async function getLatestMessages(req, res) {
    try {
        // get id of top 5 latest used chats (based on last_message_timestamp) that the requesting user is a member of
        const latestChats = await Chat
            .find({ users: req.user._id })
            .sort({ last_message_timestamp: -1 })
            .limit(5)
            .select('_id');

        const result = {};

        // get latest 50 messages for each of the top 5 latest used chats
        for (let i = 0; i < latestChats.length; i++) {
            const messages = await Message
                .find({ chat_id: latestChats[i]._id })
                .sort({ creation_time: -1 })
                .limit(50)
                .populate({
                    path: 'reply_message',
                    select: '-creation_time -last_modified_time -reply_message -chat_id'
                })
                .lean();
            
            // format the messages and add to result in ascending creation_time
            result[latestChats[i]._id] = formatMessages(messages, req.user._id).reverse();
        }

        res.status(200).json({ data: result });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// get additional messages from chat
async function getPreviousMessages(req, res) {
    try {
        // decode URI encoded timestamp
        const decodedTimestamp = decodeURIComponent(req.params.oldestMessageTime);

        // get <count> more messages before the message with the creation_time of <oldestMessageTime> from the specified chat
        const messages = await Message
            .find({ chat_id: res.chat._id, creation_time: { $lt: new Date(decodedTimestamp) }})
            .sort({ creation_time: -1 })
            .limit(req.params.count)
            .populate({
                path: 'reply_message',
                select: '-creation_time -last_modified_time -reply_message -chat_id'
            })
            .lean();

        const result = formatMessages(messages, req.user._id).reverse();

        res.status(200).json({ messages: result });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// format an array of messages to frontend usage format
function formatMessages(messages, userId) {
    const result = [];

    messages.forEach(message => {
        // set is_sender based on creator_id and requesting user id
        message.is_sender = message.creator_id.equals(userId);
        
        if (message.reply_message) {
            message.reply_message.is_sender = message.reply_message.creator_id.equals(userId);

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

module.exports = {
    getChatMessages,
    getLatestMessages,
    getPreviousMessages
}