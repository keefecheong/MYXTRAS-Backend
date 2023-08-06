// to flush cache and exit after completing tests

const redisClient = require('../../cache/redis.js');

module.exports = async function exitAfterTest() {
    await redisClient.sendCommand(['flushall']).then(() => console.log('Flushed cache.'));
    process.exit(0);
}