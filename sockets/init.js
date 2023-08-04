const socketIO = require('socket.io');

const { chatHandler } = require('../chat/sockets/chatHandler.js');

// initialize socket
function initSocket(server, corsOptions) {
    const io = socketIO(server, {
        cors: corsOptions
    });

    // set up chat event handler
    chatHandler(io);
}

module.exports = {
    initSocket
}