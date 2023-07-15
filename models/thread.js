const mongoose = require('mongoose');
const Comment = require('./comment.js');
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

// custom query to get parent forum details
threadSchema.query.getForum = function() {
    return this.populate({
        path: 'parent_id',
        select: 'forum_name forum_id forum_pic_link'
    });
}

// custom query to get creator details
threadSchema.query.getCreator = function() {
    return this.populate({ 
        path: 'creator_id',
        select: 'username profile_pic_link'
    });
}

// craft query based on given arguments
threadSchema.statics.commonQuery = function (filter, sort, cache, cacheOptions) {
    const query = this
        .find(filter)
        .sort(sort ?? { creation_time: -1 })
        .getForum()
        .getCreator()
        .lean();

    if (cache) {
        query.cache(cacheOptions);
    }

    return query;
}

// automatically clean comments associated with the thread on delete
threadSchema.post('findOneAndDelete', function(doc, next) {
    try {
        // delete associated file if any
        if (doc.content_link) {
            deleteFiles([doc.content_link]);
        }

        // delete associated comments
        Comment.deleteMany({ parent_id: doc._id }).catch(error => console.log(error));

        next();
    }
    catch (error) {
        console.log(error);
    }
});


module.exports = mongoose.model('Thread', threadSchema);