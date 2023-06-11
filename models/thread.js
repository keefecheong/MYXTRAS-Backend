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
    comments: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, 
            ref: 'Comment' }],
        default: []
    },
    numOfComments: {
        type: Number,
        default: 0,
    }
})

threadSchema.pre('save', function (next) {
    this.numOfComments = this.comments.length;
    next();
  });

module.exports = mongoose.model('Thread', threadSchema);