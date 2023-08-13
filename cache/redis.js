// initialize cache
const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    // reconnect after 1 minute
    reconnectStrategy: 60 * 1000,
  },
});

// connect to redis server
redisClient.connect().then(async () => {
  console.log("Connected to Redis Server.");
});

redisClient.on("error", () =>
  console.error("Failed to connect to Redis Server."),
);

module.exports = redisClient;
