// to populate messages

const Message = require('../models/message.js');

// to add messages into the database
module.exports = async function addMessagesToDB(chats, count) {
    // generate messages
    const messages = chats.flatMap(chat => generateMessagesPerChatAndUser(chat._id, chat.users, count));

    await Message.insertMany(messages);

    return messages.map(message => {
        return {
            _id: message._id,
            chat_id: message.chat_id,
            creator_id: message.creator_id
        }
    });
}

// generate <count> messages per user in each chat
function generateMessagesPerChatAndUser(chatId, userIds, count) {
    const messages = [];

    for (let i = 0; i < count; i++) {
        userIds.forEach(userId => {
            messages.push(new Message({
                creator_id: userId,
                content: `message ${i}`,
                chat_id: chatId
            }));
        });
    }

    return messages
}