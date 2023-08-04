// to delete a message

const Message = require('../models/message.js');

module.exports = function deleteMessageUtil(messageId) {
    return Message.findByIdAndDelete(messageId);
}