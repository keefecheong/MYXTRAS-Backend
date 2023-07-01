const mongoose = require('mongoose');
const { deleteFiles } = require('../utils/general/firebaseStorageDelete.js');

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
    },
    reply_message: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Message'
    }
});

// automatically update parent chat's last_message_timestamp for new messages
messageSchema.post('save', async function(doc, next) {
    if (!doc.isNew) {
        return next();
    }

    try {
        const chatModel = mongoose.model('Chat');

        chatModel.findByIdAndUpdate(
            doc.chat_id,
            { last_message_timestamp: doc.creation_time }
        ).catch(error => console.log(error));

        next();
    }
    catch (error) {
        console.log(error);
    }
});

// on delete automatically clean up files associated with the message if any
messageSchema.post('findOneAndDelete', function(doc, next) {
    if (!doc.file_link) {
        return next();
    }

    try {
        // delete associated files
        deleteFiles([doc.file_link]);

        next();
    }
    catch (error) {
        console.log(error);
    }
});

module.exports = mongoose.model('Message', messageSchema);