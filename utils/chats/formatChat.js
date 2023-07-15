// to format retrieved chat to match front-end display

const checkBlocked = require('../users/checkBlocked.js');

module.exports = function formatChat(chat, userId, blockedUsers) {
    const targetUser = chat.users[0];

    return {
        _id: chat._id,
        targetUserId: targetUser._id,
        name: targetUser.username,
        pic: targetUser.profile_pic_link,
        last_message_timestamp: chat.last_message_timestamp,
        blocked: checkBlocked(targetUser._id, targetUser.blocked_users, userId, blockedUsers)
    };
}