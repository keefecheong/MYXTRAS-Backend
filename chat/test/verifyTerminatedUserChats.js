// expected outcomes when deleting chats (after terminating user)

const Chat = require('../models/chat.js');
const Message = require('../models/message.js');

const expectEmpty = require('../../utils/test/expectEmpty.js');

const compareId = require('../../utils/general/compareId.js');

// expect no chats and associated messages to exist for the terminated user if terminated
async function verifyDBTerminatedUserChats(terminatedUserId, terminated) {
    const enrolledChats = await Chat.find({ users: { $in: terminatedUserId } }).lean();

    // check if there are chats that the terminated user is enrolled in
    expectEmpty(enrolledChats, terminated);

    const messages = await Message.find().lean();

    // check if there are messages in the chats that the terminated user is enrolled in
    const enrolledChatIds = enrolledChats.map(chat => chat._id);
    expectEmpty(messages.filter(message => enrolledChatIds.some(chatId => compareId(chatId, message.chat_id))), terminated);

    // check if there are any messages created by the terminated user
    expectEmpty(messages.filter(message => compareId(message.creator_id, terminatedUserId)), terminated);
}

module.exports = {
    verifyDBTerminatedUserChats
}