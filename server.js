// use dotenv for .env variables
require('dotenv').config();

const express = require('express');
const app = express();

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// configure cors
const cors = require('cors');
const corsOptions = {
    origin: process.env.FRONTEND_SERVER_URL,
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PATCH'],
    credentials: true,
};

app.use(cors(corsOptions));

function getRandomElements(arr, n) {
  const shuffled = arr.slice();
  let i = arr.length;
  const min = i - n;
  let temp;
  let index;

  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }

  return shuffled.slice(min);
}

// make connection with mongodb
const mongoose = require('mongoose');
const { User } = require('./models/user.js');

mongoose.connect(process.env.DATABASE_URL);

const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to database.'));

// - like 5 threads
// - follow a new user
// - create a new blog
// - say something nice (or comment)
// - share a blog to a friend
// - Start a new thread discussion
// - Share your socials
// - Find a love
async function assignDailyMissions() {
    try {
      const users = await User.find({});

        const missions = ['Like 5 threads', 'Follow a new user', 'Create a new blog', 'Say something nice', 'Share a blog to a friend',
    'Start a new thread discussion', 'Share your socials', 'Find a love']
      users.forEach(async (user) => {
        // Get 4 random missions from the available missions
        const randomMissions = getRandomElements(missions, 4);
  
        // Assign the daily missions to the user
        user.daily_missions = randomMissions;
        console.log(user.daily_missions)
  
        // Save the user with updated daily missions
        await user.save();
      });
      console.log('Daily missions assigned successfully');
    } catch (error) {
      console.error('Error assigning daily missions:', error);
    }
  };
  
  // Call the function to assign daily missions
  assignDailyMissions();
  
  // Function to reset the daily missions for all users
  async function resetDailyMissions() {
    try {
      const users = await User.find({});
      const missions = ['Like 5 threads', 'Follow a new user', 'Create a new blog', 'Say something nice', 'Share a blog to a friend',
      'Start a new thread discussion', 'Share your socials', 'Find a love']
      users.forEach(async (user) => {
        // Clear existing assigned missions
        user.daily_missions = [];
  
        // Get 4 random missions from the available missions
        const randomMissions = getRandomElements(missions, 4);
  
        // Assign the daily missions to the user
        user.daily_missions = randomMissions;
  
        // Save the user with updated daily missions
        await user.save();
      });
  
      console.log('Daily missions reset successfully');
    } catch (error) {
      console.error('Error resetting daily missions:', error);
    }
  };
  
  // Call the function to reset daily missions
  resetDailyMissions();

  const checkDateAndReset = () => {
    // Get the current date
    const currentDate = new Date();
  
    // Check if the date has changed
    if (currentDate.getDate() !== checkDateAndReset.lastDate) {
      // Call the resetDailyMissions function
      resetDailyMissions();
  
      // Update the lastDate to the current date
      checkDateAndReset.lastDate = currentDate.getDate();
    }
  };
  
  // Initialize the lastDate to the current date
  checkDateAndReset.lastDate = new Date().getDate();
  
  // Set the interval to check the date every 1 day (adjust as needed)
  setInterval(checkDateAndReset, 60 * 1000 * 60 * 24); // 1 minute



// initialize cache
require('./cache/init.js');

// initialize Firebase (for storing files/images)
const { initializeApp } = require('firebase/app');

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    appId: process.env.FIREBASE_APP_ID
}

initializeApp(firebaseConfig);

// mount routes
const mountRoutes = require('./routes/mountRoutes.js');
mountRoutes(app);

// start server
const server = app.listen(process.env.PORT, () => console.log(`Listening on Port ${process.env.PORT}...`));

// initialize socket
const { initSocket } = require('./sockets/init.js');
initSocket(server, corsOptions);