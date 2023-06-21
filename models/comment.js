const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    creator_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    creation_time: {
        type: Date,
        immutable: true,
        default: Date.now()
    },
    content: {
        type: String,
        immutable: true,
        required: true
    },
    parent_id: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        immutable: true
    }
});

module.exports = mongoose.model('Comment', commentSchema);