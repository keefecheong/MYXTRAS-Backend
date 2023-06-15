// common functions to check user socket connection status

function getUserConnectionIndex(connections, targetUserId) {
    return connections.findIndex(connection => connection.userId == targetUserId);
}

function getUserOnline(connections, targetUserId) {
    return connections.some(connection => connection.userId == targetUserId);
}

module.exports = {
    getUserConnectionIndex,
    getUserOnline
}