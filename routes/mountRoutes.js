// to mount all routes in server.js
const postsRouter = require('../post/routes/mainRouter.js');
const usersRouter = require('../user/routes/mainRouter.js');
const schoolRouter = require('../school/routes/mainRouter.js');
const forumRouter = require('../forum/routes/mainRouter.js');
const threadRouter = require('../thread/routes/mainRouter.js');
const searchRouter = require('../search/routes/mainRouter.js');
const chatRouter = require('../chat/routes/mainRouter.js');
const reportRouter = require('../report/routes/mainRouter.js');
const adminRouter = require('../admin/routes/mainRouter.js');
const gamificationRouter = require('../gamification/routes/mainRouter.js');

module.exports = function(app) {
    app.use('/api/users', usersRouter);
    app.use('/api/schools', schoolRouter);
    app.use('/api/posts', postsRouter);
    app.use('/api/forums', forumRouter);
    app.use('/api/threads', threadRouter);
    app.use('/api/search', searchRouter);
    app.use('/api/chats', chatRouter);
    app.use('/api/report', reportRouter);
    app.use('/api/admin', adminRouter);
    app.use('/api/gamification', gamificationRouter);
}