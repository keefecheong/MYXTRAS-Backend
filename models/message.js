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
        // specify content to be required only if file_link is empty
        required: function () {
            return !this.file_link;
        }
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
    },
    file_link: {
        type: String,
        // specify file_link to be required only if content is empty
        required: function() {
            return !this.content;
        }
    },
    original_name: {
        type: String,
        // specify original_name to be required only if file_link is provided
        required: function() {
            return this.file_link;
        }
    },
    file_type: {
        type: String,
        // specify original_name to be required only if file_link is provided
        required: function() {
            return this.file_link;
        }
    }
});

module.exports = mongoose.model('Message', messageSchema);