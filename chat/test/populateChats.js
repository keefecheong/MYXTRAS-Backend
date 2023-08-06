// to populate chats

const Chat = require('../models/chat.js');

const addMessagesToDB = require('./populateMessages.js');

// to add chats to database
module.exports = async function addChatsToDB(userIds, messageCount) {
    const possiblePairs = userIds.flatMap(userId1 => userIds.map(userId2 => {
        return [ userId1.toString(), userId2.toString() ];
    }));

    // get the unique combinations of user ids to create chats between all users
    const uniquePairs = new Set();

    for (const pair of possiblePairs) {
        if (pair[0] == pair[1]) continue;

        const sortedPair = pair.sort();
        uniquePairs.add(JSON.stringify(sortedPair));
    }

    const chats = Array.from(uniquePairs).map(pair => {
        return new Chat({
            users: JSON.parse(pair)
        });
    });

    // insert chats
    await Chat.insertMany(chats);

    // create messages
    const messageIds = await addMessagesToDB(chats, 20);

    return { chatIds: chats.map(chat => chat._id), messageIds };
}