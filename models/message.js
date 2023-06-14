const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    creator_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    content: {
        type: String,
        required: true
    },
    creation_time: {
        type: Date,
        immutable: true,
        default: Date.now()
    },
    last_modified_time: {
        type: Date,
        default: function() {
            return this.creation_time;
        }
    },
    chat_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Chat',
        required: true,
        immutable: true
    }
});

// automatically update last_modified_time with the current time when an existing document is saved (updated)
messageSchema.pre('save', function(next) {
    if (!this.isNew > 0) {
        this.last_modified_time = Date.now();
    }

    next();
});

module.exports = mongoose.model('Message', messageSchema);