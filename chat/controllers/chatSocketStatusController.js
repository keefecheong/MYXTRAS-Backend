// controller functions for chat socket user status events

const { emitSocketEvent } = require('../utils/emitSocketEvent.js');
const { getUserOnline } = require('../utils/getUserStatus.js');

// handle 'query-user-presence' event
function handleQueryUserPresence(data, callback, socket, connections) {
    // check if requested user has a socket connection in connections
    // return requested user's online status
    callback({
        online: getUserOnline(connections, data.targetUserId, true, socket.user)
    });
}

// handle 'user-typing' event
function handleUserTyping(data, socket) {
    // tell target user that current user is typing/not typing
    emitSocketEvent(socket, data.targetUserId, 'receive-user-typing', { userId: socket.user._id, typing: data.typing });
}

module.exports = {
    handleQueryUserPresence,
    handleUserTyping
}