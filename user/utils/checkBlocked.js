// to check if either user is blocked by the other user

const compareId = require('../../utils/general/compareId.js');

module.exports = function checkBlocked(user1Id, user1BlockedUsers, user2Id, user2BlockedUsers) {
    const user1Blocked = user2BlockedUsers.some(entry => compareId(entry.user_id, user1Id));
    const user2Blocked = user1BlockedUsers.some(entry => compareId(entry.user_id, user2Id));

    return user1Blocked || user2Blocked;
}