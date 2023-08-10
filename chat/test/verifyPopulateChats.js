// to verify that chats are populated in the database properly

const Chat = require('../models/chat.js');

const expectEqualLengthResults = require('../../utils/test/expectEqualLengthResults.js');

// check that all chats specified by chatIds are in the database
function verifyDBPopulatedChats(chatIds) {
    return {
        title: 'should add chats to database',
        callback: async () => expectEqualLengthResults(await Chat.find(
            { _id: { $in: chatIds } },
            { _id: 1 }
        ).lean(), chatIds),
        params: [chatIds]
    }
}

module.exports = {
    verifyDBPopulatedChats
}