// to verify that messages are populated in the database correctly

const Message = require('../models/message.js');

const expectEqualLengthResults = require('../../utils/test/expectEqualLengthResults.js');

// check that all messages specified by messageIds are in the database
async function verifyDBPopulatedMessages(messageIds) {
    const populatedMessages = await Message.find(
        { _id: { $in: messageIds } },
        { _id: 1 }
    ).lean();

    expectEqualLengthResults(populatedMessages, messageIds);
}

module.exports = {
    verifyDBPopulatedMessages
}