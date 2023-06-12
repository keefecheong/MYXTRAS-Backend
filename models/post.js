const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    creator_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    content_links: {
        type: [String],
        required: true
    },
    original_names: {
        type: [String],
        required: true
    },
    creation_time: {
        type: Date,
        immutable: true,
        default: Date.now()
    },
    last_modified_time: {
        type: Date,
        default: Date.now()
    },
    likes: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }],
        default: []
    },
    comments: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Comment'
        }],
        default: []
    }
});

// automatically update last_modified_time with the current time when an existing document is saved (updated)
postSchema.pre('save', function(next) {
    if (!this.isNew && this.content_links.length > 0) {
        this.last_modified_time = Date.now();
    }

    next()
});

module.exports = mongoose.model('Post', postSchema);