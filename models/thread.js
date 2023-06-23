const mongoose = require('mongoose');
const { deleteFiles } = require('../utils/general/firebaseStorageDelete.js');

const threadSchema = new mongoose.Schema({
    parent_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Forum',
        required: true,
        immutable: true
    },
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
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true
    },
    content_link: {
        type: String
    },
    comment_count: {
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
    tags: {
        type: [String],
        default: []
    }
});

// automatically clean comments associated with the thread on delete
threadSchema.post('findOneAndDelete', function(doc, next) {
    try {
        // delete associated file if any
        if (doc.content_link) {
            deleteFiles([doc.content_link]);
        }

        // delete associated comments
        const commentModel = mongoose.model('Comment');
        commentModel.deleteMany({ parent_id: doc._id }).catch(error => console.log(error));

        next();
    }
    catch (error) {
        console.log(error);
    }
});


module.exports = mongoose.model('Thread', threadSchema);