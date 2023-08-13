const mongoose = require("mongoose");

// make connection with mongodb
(async () => {
  const testEnv = process.env.NODE_ENV == "test";

  // if in test environment then set up memory server and connect to it
  if (testEnv) {
    const { MongoMemoryServer } = require("mongodb-memory-server");

    const memoryServer = await MongoMemoryServer.create();

    mongoose.connect(memoryServer.getUri());
    console.log(memoryServer.getUri());
  }
  // otherwise connect to mongoDB URL specified in env
  else {
    mongoose.connect(process.env.DATABASE_URL);
  }

  const db = mongoose.connection;

  db.on("error", (error) => console.error(error));
  db.once("open", async () => {
    // show connection successful
    console.log("Connected to database.");

    // seed user accounts if not in test mode
    if (!testEnv) {
      const seedUsers = require("./seedUsers.js");

      await seedUsers();
    }
  });
})();
