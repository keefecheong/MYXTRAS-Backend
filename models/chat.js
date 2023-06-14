const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    users: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }],
        required: true
    },
    last_message_timestamp: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('Chat', chatSchema);