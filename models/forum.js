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
    forum_pic_link: {
        type: [String],
        default: []
    },
    banner_link: {
        type: [String],
        default: []
    },
    category: {
        type: String,
        required: true,
    },
    threads: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, 
            ref: 'Thread' }],
        default: []
    },
    subscribers: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, 
            ref: 'User' }],
            default: []
    },
    numOfSubs: {
        type: Number,
        default: 0,
    }
})

forumSchema.pre('save', function (next) {
    this.numOfSubs = this.subscribers.length;
    next();
  });
module.exports = mongoose.model('Forum', forumSchema);