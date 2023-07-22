const mongoose = require('mongoose');

const { REPORT_TARGET_TYPES, REPORT_REASONS } = require('./report.js');

const DEFAULT_PROFILE_PIC_LINK = "https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg";

// user status
const USER_STATUS_SUSPENDED = 'Suspended';
const USER_STATUS_TERMINATED = 'Terminated';

const USER_STATUSES = [USER_STATUS_SUSPENDED, USER_STATUS_TERMINATED];

// messages to return if user is suspended/terminated
const USER_SUSPENDED_MSG = 'Your account has been suspended, please try again later.';
const USER_TERMINATED_MSG = 'Your account has been terminated, access denied.';

// array field name to clean up
const FIELD_SAVED_POSTS = 'saved_posts';
const FIELD_BLOCKED_USERS = 'blocked_users';
const FIELD_FOLLOWERS = 'followers';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        immutable: true,
        unique: true,
        select: false
    },
    username: {
        type: String,
        unique: true,
        required: true
    },
    real_name: {
        type: String
    },
    phone_number: {
        type: String,
        immutable: true,
        unique: true,
        select: false
    },
    school: {
        type: String
    },
    course: {
        type: String
    },
    profile_pic_link: {
        type: String,
        default: DEFAULT_PROFILE_PIC_LINK
    },
    gender:{
        type: String
    },
    biography: {
        type: String,
        default: function() {
            return `Hi! I am ${this.username}.`;
        }
    },
    followers: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }],
        default: []
    },
    saved_posts: {
        type: [{
            post_id: {
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'Post'
            },
            // to easily remove saved posts when user is blocked
            creator_id: {
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'User'
            }
        }],
        default: []
    },
    interests: {
        type: [String],
        default: []
    },
    is_admin: {
        type: Boolean,
        default: false
    },
    blocked_users: {
        type: [{
            user_id: {
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'User',
                required: true,
                immutable: true
            },
            block_time: {
                type: Date,
                required: true,
                immutable: true
            }
        }],
        default: []
    },
    password: {
        type: String,
        immutable: true,
        select: false
    },
    is_profile_setup: {
        type: Boolean,
        default: false
    },
    gems: {
        type: Number,
        default: 0
    },
    daily_missions:{
        type: [{
            title:{
                type: String,
                required: true
            },
            claimed:{
                type: Boolean,
                default: false
            },
            locked:{
                type: Boolean,
                default: true
            }
        }],
        default: []
    },
    last_checkin_date: {
        type: Date,
    },
    checkin_count: {
        type: Number,
        default: 1
    },
    claimed: {
        type: Boolean,
        default: false
    },
    warnings: {
        type: [{
            // include content_link if the reported and removed object is a post
            content_link: {
                type: String,
                immutable: true
            },
            object_id: {
                type: mongoose.SchemaTypes.ObjectId,
                required: true,
                immutable: true,
                refPath: 'object_type'
            },
            object_type: {
                type: String,
                required: true,
                immutable: true,
                enum: REPORT_TARGET_TYPES
            },
            reason: {
                type: String,
                required: true,
                immutable: true,
                enum: REPORT_REASONS
            },
            review_time: {
                type: Date,
                required: true,
                immutable: true
            }
        }],
        default: []
    },
    status: {
        status: {
            type: String,
            enum: USER_STATUSES
        },
        end_time: {
            type: Date,
            // specify required if user is suspended
            required: function() {
                return this.status.status == USER_STATUS_SUSPENDED;
            }
        }
    }
});

// custom query to get follower details
userSchema.query.getFollowers = function() {
    return this.populate({
        path: 'followers',
        select: 'username profile_pic_link'
    });
}

// specify validation only for new documents
userSchema.pre('save', function(next) {
    if (this.isNew) {
        if (!this.email) {
            throw new mongoose.Error.ValidatorError({ type: 'required', path: 'email' });
        }

        if (!this.password) {
            throw new mongoose.Error.ValidatorError({ type: 'required', path: 'password' });
        }

        if (!this.phone_number) {
            throw new mongoose.Error.ValidatorError({ type: 'required', path: 'phone_number' });
        }
    }

    next();
});

// delete given id/ids from the specified array fields if exists
userSchema.statics.deleteFromArrayField = function(arrayField, id, asJSON) {
    if (!arrayField || !id) {
        return;
    }

    let filter = {};
    let update = {};

    // set filter and update based on arrayField
    switch (arrayField) {
        case FIELD_SAVED_POSTS:
            filter[`${FIELD_SAVED_POSTS}.post_id`] = { $in: id };
            update = {
                $pull: {
                    saved_posts: { post_id: { $in: id } }
                }
            };

            break;
        
        case FIELD_BLOCKED_USERS:
            filter[`${FIELD_BLOCKED_USERS}.user_id`] = id;
            update = {
                $pull: {
                    blocked_users: { user_id: id }
                }
            };

            break;

        case FIELD_FOLLOWERS:
            filter.followers = { $in: [id] };
            update = {
                $pull: {
                    followers: id
                }
            };
            
            break;

        default:
            break;
    }

    return asJSON ? { updateMany: { filter, update } } : this.updateMany(filter, update);
}

module.exports = {
    User: mongoose.model('User', userSchema),
    DEFAULT_PROFILE_PIC_LINK,
    USER_STATUS_SUSPENDED,
    USER_STATUS_TERMINATED,
    USER_STATUSES,
    USER_SUSPENDED_MSG,
    USER_TERMINATED_MSG,
    FIELD_SAVED_POSTS,
    FIELD_BLOCKED_USERS,
    FIELD_FOLLOWERS
}