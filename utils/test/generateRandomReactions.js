// to generate random array of user ids to react to an object
module.exports = function generateRandomReaction(userIds) {
    return userIds.map(userId => Math.round(Math.random()) ? userId : null).filter(userId => userId);
}