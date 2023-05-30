const express = require('express');
const User = require('../models/user');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('crypto');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');

const firebaseStorage = getStorage();

// Redirect from register to setupprofile
router.get('/setupprofile', (req, res) => {
    // Redirect to a different HTML page
    res.redirect(process.env.FRONTEND_SERVER_URL + '/setupprofile.html');
});

// Redirect from setupprofile to feed
router.get('/feed', (req, res) => {
    // Set CORS headers
    // res.set('Access-Control-Allow-Origin', "http://127.0.0.1:5173");
    // res.set('Access-Control-Allow-Methods', 'GET, POST');
    // Redirect to a different HTML page
    res.redirect(process.env.FRONTEND_SERVER_URL + '/feed.html');
});

// Redirect from profileManagement to profilePage
router.get('/profilePage', (req, res) => {
    // Set CORS headers
    // res.set('Access-Control-Allow-Origin', "http://127.0.0.1:5173");
    // res.set('Access-Control-Allow-Methods', 'GET, POST');
    // Redirect to a different HTML page
    res.redirect(process.env.FRONTEND_SERVER_URL + '/profilePage.html');
});

router.get('/get-cookie', async (req, res) => {
    const token = req.cookies.authapi;
    if (req.cookies && token){
        console.log("2")
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        // Get the user ID from the decoded token
        const userId = decodedToken.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json()
        }
        
        return res.status(200).json()
    } else {
        return res.status(401).json()
    }
}),

router.get('/remove-cookie', (req, res) => {
    res.clearCookie("authapi");
    return res.json();
});

// Redirect from anypage to login
router.get('/redirect-login', (req, res) => {
    res.redirect(process.env.FRONTEND_SERVER_URL + '/login.html');
});

// Get user from session cookie
router.get('/', authenticateToken, async (req, res) => {
    const user = req.user;
    res.json(user);
})

// Middlewawre to verfiy cookie
async function authenticateToken(req, res, next) {
    try {
        // Get the JWT token from the cookie
        const token = req.cookies.authapi;
        if (!token) {
          // No token found, handle unauthorized access
          return res.status(401).json({ message: 'Unauthorized' });
        }
        // Verify and decode the JWT token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        // Get the user ID from the decoded token
        const userId = decodedToken.id;
        // Retrieve the user from the database
        const user = await User.findById(userId);
        if (!user) {
          // User not found, handle unauthorized access
          return res.status(401).json({ message: 'Unauthorized' });
        }
        // Attach the user object to the request for further processing
        req.user = user;
        // Proceed to the next middleware or route handler
        next();
      } catch (error) {
        // Handle token verification or database errors
        return res.status(500).json({ message: 'Internal Server Error' });
      }
}

// Registration
router.post('/register', express.json(), async (req, res) => {
    
    if (!req.body) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }
    const { emailAddress, phoneNumber, password } = req.body;

    // check if user already exists in database
    const existingEmail = await User.findOne({ email: emailAddress });

    if (existingEmail) {
      // User already exists, handle the error
      return res.status(409).json({ error: 'Email already exists' });
    }
    const existingPhone = await User.findOne({ phonenumber: phoneNumber });

    if (existingPhone) {
      // User already exists, handle the error
      return res.status(409).json({ error: 'Phone Number already exists' });
    }
    if (phoneNumber.length != 8){
        return res.status(409).json({ error: 'Inavlid phone number' });
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || password.length < 8){
        return res.status(409).json({ error: 'Password does not meet complexity requirements' });
    }
    try {
        const newUser = new User({
            username: 'user' + crypto.randomBytes(4).toString("hex"),
            email: emailAddress,
            phonenumber: phoneNumber,
            profile_pic_link: "https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg",
            password: await bcrypt.hash(password, 10),
        });

        // Save user into database
        await newUser.save();
        
        const accessToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);

        //res.setHeader("Authorization", "Bearer " + accessToken)
        res.cookie("authapi", accessToken, {
            expires: new Date(
                Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
            // enable sameSite only when secure is true
            //sameSite: 'none',
            secure: process.env.NODE_ENV === 'production',
        })
        
        //res.json({ accessToken: accessToken})
        return res.json();

        // send verification email
        // const verificationUrl = `http://127.0.0.1:3000/api/users/verify/${newUser.activeToken}`;
        // const mailOptions = {
        //     to: email,
        //     subject: 'Verify your email address',
        //     html: `Please click this link to verify your email address: <a href="${verificationUrl}">${verificationUrl}</a>`,
        // };

        // // send verification email using NodeMailer or a similar email service

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
})

// Logging in 
router.post('/login', express.json(), async (req, res) => {
    try {
        const { emailAddress, password } = req.body;
        
        // Find the user by email
        const user = await User.findOne({ email: emailAddress });
        
        if (!user) {
          // User not found
          return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Check if the password is correct
        // if (password !== user.password) {
        if (!bcrypt.compareSync(password, user.password)){
          // Incorrect password
          return res.status(401).json({ message: 'Invalid email or password' });
        }
    
        // Generate JWT token
        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        // Send the token back to the client
        res.cookie("authapi", accessToken, {
            expires: new Date(
                Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
            // enable sameSite only when secure is true
            //sameSite: 'none',
            secure: process.env.NODE_ENV === 'production',
        })

        // Authentication successful
        res.status(200).json({ message: 'Login successful' });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
});


// Setupprofile
router.patch('/setup', express.json(), authenticateToken, async (req, res) => {
    
    const {realName, userName, biography, selectedSchool, selectedCourse, selectedInterests} = req.body;

    try {
        const user = req.user;
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
    
        user.realname = realName;
        user.username = userName;
        user.biography = biography;
        user.school = selectedSchool;
        user.course = selectedCourse;
        user.interests = selectedInterests.sort();
        user.profilesetup = true;
        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: 'Failed to update user' });
    }
}),

// ProfileManagement
router.patch('/update', express.json(), authenticateToken, async (req, res) => {
    
    const {userName, biography, selectedInterests, gender} = req.body;

    try {
       
        const user = req.user;
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
    
        user.username = userName;
        user.biography = biography;
        user.interests = selectedInterests.sort();
        user.gender = gender
        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: 'Failed to update user' });
    }
})  




module.exports = router;