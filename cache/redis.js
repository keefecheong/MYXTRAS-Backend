// initialize cache
const { createClient } = require("redis");

const socket = {
  // reconnect after 1 minute
  reconnectStrategy: 60 * 1000,
};

// use tls if in production (aws elasticache configuration)
if (process.env.NODE_ENV == 'production') {
  socket.tls = true;
}

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket
});

// connect to redis server
redisClient.connect().then(async () => {
  console.log("Connected to Redis Server.");
});

redisClient.on("error", () =>
  console.error("Failed to connect to Redis Server.")
);

module.exports = redisClient;
