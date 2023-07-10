// initialize cache

const Redis = require('redis');
const redisClient = Redis.createClient({
    host: process.env.REDIS_URL,
    post: process.env.REDIS_PORT
});

// connect to redis server
redisClient.connect()
.then(async () => {
    // clear cache when connected
    await redisClient.flushDb();
    console.log('Connected to Redis Server.');
});

redisClient.on('error', () => console.error('Failed to connect to Redis Server.'));

module.exports = redisClient;