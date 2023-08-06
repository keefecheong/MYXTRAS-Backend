const mongoose = require('mongoose');
const updateParentCommentCount = require('../utils/updateParentCommentCount.js');

// valid parent_model values
const PARENT_MODEL_POST = 'Post';
const PARENT_MODEL_THREAD = 'Thread';

const commentSchema = new mongoose.Schema({
    creator_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    creation_time: {
        type: Date,
        immutable: true,
        default: function() {
            return Date.now();
        }
    },
    content: {
        type: String,
        immutable: true,
        required: true
    },
    parent_id: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        immutable: true,
        refPath: 'parent_model'
    },
    parent_model: {
        type: String,
        enum: [
            PARENT_MODEL_POST,
            PARENT_MODEL_THREAD
        ],
        immutable: true
    }
});

// custom query to get creator details
commentSchema.query.getCreator = function (getRealname) {
    return this.populate({
        path: 'creator_id',
        select: `username profile_pic_link ${getRealname ? 'real_name' : ''}`
    });
}

// custom query crafted based on given arguments
commentSchema.statics.commonQuery = function (filter, sort, cache, cacheOptions) {
    const query = this
        .find(filter)
        .select('-parent_id -parent_model')
        .sort(sort ?? { creation_time: -1 })
        .getCreator()
        .lean();

    if (cache) {
        query.cache(cacheOptions);
    }

    return query;
}

// automatically increment parent object's comment_count by 1 on save
commentSchema.pre('save', function (next) {
    if (!this.isNew) {
        return next();
    }
    
    updateParentCommentCount(this.parent_model, this.parent_id, true).catch(error => console.log(error));

    next();
});

// automatically increment parent object's comment_count by <count> on insertMany (mainly for test case population)
commentSchema.post('insertMany', function(docs, next) {
    updateParentCommentCount(docs[0].parent_model, docs[0].parent_id, true, false, docs.length).catch(error => console.log(error));

    next();
});

// automatically decrement parent object's comment_count by 1 on delete
commentSchema.post('findOneAndDelete', function (doc, next) {
    updateParentCommentCount(doc.parent_model, doc.parent_id, false).catch(error => console.log(error));

    next();
});

// delete all comments 1. under a specified parent, 2. created by a specified user, 3. under a specified parent, created by a specified user
commentSchema.statics.deleteAllSpecified = function(parentIds, userId, asJSON) {
    if (parentIds?.length <= 0 && !userId) {
        return null;
    }

    let filter = {};
    
    // set respective fields if provided
    if (userId) {
        filter.creator_id = userId;
    }
    
    if (parentIds?.length > 0) {
        filter.parent_id = { $in: parentIds };
    }

    // return JSON object for bulkWrite operation
    return asJSON ? { deleteMany: { filter } } : this.deleteMany(filter);
}

module.exports = {
    Comment: mongoose.model('Comment', commentSchema),
    PARENT_MODEL_POST,
    PARENT_MODEL_THREAD
}