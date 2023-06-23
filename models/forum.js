const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
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
    // Ex. NP InfoComm
    forum_name: {
        type: String,
        required: true,
    },
    // Ex. NPICT
    forum_id: {
        type: String,
        required: true,
        unique: true  // forum ID must be unique
    },
    forum_desc: {
        type: String
    },
    forum_pic_link: {
        type: String,
    },
    banner_link: {
        type: String,
    },
    tags: {
        type: [String],
        default: []
    },
    subscribers: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }],
        default: []
    }
})

module.exports = mongoose.model('Forum', forumSchema);