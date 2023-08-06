// to verify that chats are populated in the database properly

const Chat = require('../models/chat.js');

const expectEqualLengthResults = require('../../utils/test/expectEqualLengthResults.js');

// check that all chats specified by chatIds are in the database
async function verifyDBPopulatedChats(chatIds) {
    const populatedChats = await Chat.find(
        { _id: { $in: chatIds } },
        { _id: 1 }
    ).lean();

    expectEqualLengthResults(populatedChats, chatIds);
}

module.exports = {
    verifyDBPopulatedChats
}