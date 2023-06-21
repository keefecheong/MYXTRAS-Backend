const { StringFormat } = require('firebase/storage');
const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
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
    thread_title: {
        type: String,
        required: true,
    },
    thread_desc: {
        type: String
    },
    content_links: {
        type: [String],
        required: true,
    },
    comments: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, 
            ref: 'Comment' }],
        default: []
    },
    numOfComments: {
        type: Number,
        default: 0,
    },
    likes: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, 
            ref: 'User' }],
        default: []
    },
    dislikes: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, 
            ref: 'User' }],
        default: []
    },
    category: {
        type: [String],
        default: []
    }
})

threadSchema.pre('save', function (next) {
    this.numOfComments = this.comments.length;
    next();
  });

module.exports = mongoose.model('Thread', threadSchema);