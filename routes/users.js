const express = require('express');
const User = require('../models/user');
const router = express.Router();
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const axios = require('axios');

router.get('/setupprofile', (req, res) => {
    // Redirect to a different HTML page
    res.redirect(process.env.FRONTEND_SERVER_URL + '/setupprofile.html');
});

router.get('/feed', (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', "http://127.0.0.1:5173");
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    // Redirect to a different HTML page
    res.redirect(process.env.FRONTEND_SERVER_URL + '/feed.html');
});

// login
router.get('/login', authenticateToken, async (req, res) => {
    // Retrieve user credentials from request body
    const { email, password } = req.body;

    // Validate credentials (e.g., check if user exists and password is correct)
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    //const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    // Send the token back to the client
    res.json({ token });
})

// 
router.get('/:id', (req, res) => {
   
})

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
    try {
        const newUser = new User({
            username: 'user' + crypto.randomBytes(4).toString("hex"),
            email: emailAddress,
            phonenumber: phoneNumber,
            password: await bcrypt.hash(password, 10),
        });

        // Save user into database
        await newUser.save();
        
        
        const accessToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);

        //res.setHeader("Authorization", "Bearer " + accessToken)
        res.cookie("auth-api", accessToken, {
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

// send cookies
router.get("/cookie", (req, res) => {
    //res.send(req.cookies);
    return res.json("hii")
 });

 
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"]
    console.log(authHeader)
    // Checks if authHeader exists or return undefined
    const token = authHeader && authHeader.split(' ')[1]

    console.log(token)
    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        // Check of error
        console.log(err)
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}
// Setupprofile / Profile Management
router.patch('/setup', express.json(), async (req, res) => {
    
    const { emailAddress, realName, userName, biography, selectedSchool, selectedCourse, selectedOption} = req.body;
    try {
        const user = await User.findOne({ email: emailAddress });
    
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
    
        user.name = realName;
        user.username = userName;
        user.biography = biography;
        user.school = selectedSchool;
        user.course = selectedCourse;
        user.interests = selectedOption;
    
        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: 'Failed to update user' });
    }
    // const userId = req.params.userId;
    // const updates = req.body;
    // console.log(updates);
    // try {
    //     const user = await User.findById(userId);
    //     if (!user) {
    //         return res.status(404).json({ error: 'User not found' });
    //     }
    //     Object.assign(user, updates);
    //     const updatedUser = await user.save();
    //     res.json(updatedUser);


    // } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ error: 'Server error' });
    // }


})  

module.exports = router;