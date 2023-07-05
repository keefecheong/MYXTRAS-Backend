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

// custom query to get details of the other user
chatSchema.query.getUser = function(userId) {
    return this.populate({
        path: 'users',
        select: 'username profile_pic_link',
        match: { _id: { $ne: userId } }
    });
}

module.exports = mongoose.model('Chat', chatSchema);