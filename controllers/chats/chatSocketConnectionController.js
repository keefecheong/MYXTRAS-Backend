// controller functions for chat socket connection

const { getUserConnectionIndex, getUserOnline } = require("../../utils/chats/getUserStatus");

// handle 'connection' event
function handleNewConnection(socket, connections) {
    // manage user connection information

    const userId = socket.user._id.toString();

    // check if user has an existing socket connection
    const userConnectionIndex = getUserConnectionIndex(connections, userId);

    // if user does not have an existing socket then add the user id and socket id to connections
    if (userConnectionIndex == -1) {
        connections.push({
            userId: userId,
            socketId: [socket.id]
        });

        // tell all other sockets that this user is online
        socket.broadcast.emit('update-user-presence', {
            userId: userId,
            online: true
        });
    }
    // otherwise add the new socket id to the existing connection object
    else {
        connections[userConnectionIndex].socketId.push(socket.id);
    }

    // add socket to a room based on user id
    socket.join(userId);
}

// handle 'disconnect' event
function handleDisconnection(socket, connections) {
    // remove socket id from the user's list of socket id in the connections array
    const userConnectionIndex = getUserConnectionIndex(connections, socket.user._id.toString());

    const socketIdIndex = connections[userConnectionIndex].socketId.indexOf(socket.id);
    
    connections[userConnectionIndex].socketId.splice(socketIdIndex, 1);

    // if there are no other associated sockets with the user then delete the whole object from the connections array
    if (connections[userConnectionIndex].socketId.length <= 0) {
        connections.splice(userConnectionIndex, 1);

        // set timeout to only tell other users that the user is offline after 2 seconds of disconnection
        // makes the user appear to be online even if the socket is reconnected during page changes
        setTimeout((userId = socket.user._id.toString()) => {

            // only send broadcast if the user is offline after 2 seconds
            if (!getUserOnline(connections, userId)) {
                // tell all other sockets that this user is offline
                socket.broadcast.emit('update-user-presence', {
                    userId: userId,
                    online: false
                });
            }

        }, 2000);
    }
}

module.exports = {
    handleNewConnection,
    handleDisconnection
}