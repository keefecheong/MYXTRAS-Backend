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
    threads: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, 
            ref: 'Thread' }],
        default: []
    },
    subscribers: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, 
            ref: 'User' }],
    },
    numOfSubs: {
        type: [],
    }
})

module.exports = mongoose.model('Forum', forumSchema);