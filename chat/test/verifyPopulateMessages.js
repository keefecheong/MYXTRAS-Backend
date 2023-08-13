// to verify that messages are populated in the database correctly

const Message = require("../models/message.js");

const expectEqualLengthResults = require("../../utils/test/expectEqualLengthResults.js");

// check that all messages specified by messageIds are in the database
function verifyDBPopulatedMessages(messageIds) {
  return {
    title: "should add messages to database",
    callback: async () =>
      expectEqualLengthResults(
        await Message.find({ _id: { $in: messageIds } }, { _id: 1 }).lean(),
        messageIds,
      ),
    params: [messageIds],
  };
}

module.exports = {
  verifyDBPopulatedMessages,
};
