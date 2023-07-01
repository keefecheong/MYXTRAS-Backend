const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        select: false
    },
    username: {
        type: String,
        unique: true,
        required: true
    },
    real_name: {
        type: String,
    },
    phone_number: {
        type: String,
        required: true,
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
        default: "https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg"
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
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Post'
        }],
        default: []
    },
    interests: {
        type: [String],
        default: []
    },
    is_admin: {
        type: Boolean,
        default: false,
        select: false
    },
    blocked: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }],
        default: []
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    is_profile_setup: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('User', userSchema);