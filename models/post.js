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
        required: true,
        validate: {
            validator: function(links) {
                return links.length > 0;
            },
            message: 'At least one image is required.'
        }
    },
    creation_time: {
        type: Date,
        immutable: true,
        default: Date.now()
    },
    last_modified_time: {
        type: Date,
        default: null
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
    if (!this.isNew) {
        this.last_modified_time = Date.now();
    }

    next()
});

module.exports = mongoose.model('Post', postSchema);