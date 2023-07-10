// to mount all routes in server.js
const postsRouter = require('./posts/mainRouter.js');
const usersRouter = require('./users/mainRouter.js');
const schoolRouter = require('./schools/mainRouter.js');
const forumRouter = require('./forums/mainRouter.js');
const threadRouter = require('./threads/mainRouter.js');
const searchRouter = require('./search/mainRouter.js');
const chatRouter = require('./chats/mainRouter.js');

module.exports = function(app) {
    app.use('/api/users', usersRouter);
    app.use('/api/schools', schoolRouter);
    app.use('/api/posts', postsRouter);
    app.use('/api/forums', forumRouter);
    app.use('/api/threads', threadRouter);
    app.use('/api/search', searchRouter);
    app.use('/api/chats', chatRouter);
}