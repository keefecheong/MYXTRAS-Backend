// to populate users

const bcrypt = require('bcryptjs');

const { User } = require('../models/user.js');

const sendMockRequest = require('../../utils/test/sendMockRequest.js');
const generateRandomReactions = require('../../utils/test/generateRandomReactions.js');

const compareId = require('../../utils/general/compareId.js');

// to add users to database
module.exports = async function addUsersToDB(count, needBlocked) {
    const users = [];
    const min = 30000000;
    const max = 99999999;

    for (let i = 0; i < count; i++) {
        users.push(new User({
            email: `email_${i}@gmail.com`,
            username: `username_${i}`,
            real_name: `realname_${i}`,
            phone_number: Math.floor(Math.random() * (max - min)) + min,
            school: 'ICT',
            course: 'CSF',
            is_admin: i % 2 == 0,
            password: await bcrypt.hash('Passw0rd', 10),
            is_profile_setup: true
        }));
    }

    const userIds = users.map(user => user._id);

    // add followers and blocked_users
    users.forEach(user => {
        const otherUserIds = userIds.filter(userId => !compareId(userId, user._id));
        
        user.followers = otherUserIds;

        user.blocked_users = needBlocked ? generateRandomReactions(otherUserIds).map(userId => {
            return { user_id: userId, block_time: Date.now() };
        }) : [];
    });

    // add users to database
    await User.insertMany(users);

    // populate cache
    await populateUserCache(userIds);

    // return list of user ids
    return userIds;
}

// to populate cache with user data
function populateUserCache(userIds) {
    return Promise.all(userIds.map(userId => sendMockRequest(`/api/users/profile/${userId}`, userId, 'get')));
}