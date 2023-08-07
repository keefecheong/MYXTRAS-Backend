// expected outcomes when deleting chats (after terminating user)

const Chat = require('../models/chat.js');
const Message = require('../models/message.js');

const expectEmpty = require('../../utils/test/expectEmpty.js');

const compareId = require('../../utils/general/compareId.js');

// expect no chats and associated messages to exist for the terminated user if terminated
async function verifyDBTerminateUserChats(terminatedUserId, terminated) {
    const chats = await Chat.find().lean();

    const terminatedUserEnrolledChats = [];
    const terminatedUserNotEnrolledChats = [];

    chats.forEach(chat => {
        chat.users.some(userId => compareId(userId, terminatedUserId)) ?
            terminatedUserEnrolledChats.push(chat) :
            terminatedUserNotEnrolledChats.push(chat);
    });

    // check if there are chats that the terminated user is enrolled in
    expectEmpty(terminatedUserEnrolledChats, terminated);

    const messages = await Message.find().lean();

    // check if there are messages not in the chats that the terminated user is not enrolled in
    expectEmpty(messages.filter(message => !terminatedUserNotEnrolledChats.some(chat => compareId(chat._id, message.chat_id))), terminated);
}

module.exports = {
    verifyDBTerminateUserChats
}