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
    forumName: {
        type: String,
        required: true,
    },
    // Ex. NPICT
    forumID: {
        type: String,
        required: true,
    },
    forumDesc: {
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