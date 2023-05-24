const express = require('express');
const User = require('../models/user');
const bodyParser = require('body-parser');
const router = express.Router();
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

app.use(bodyParser.json());

//
router.get('/login', async (req, res) => {
    // Retrieve user credentials from request body
    const { email, password } = req.body;

    // Validate credentials (e.g., check if user exists and password is correct)
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, 'your-secret-key');

    // Send the token back to the client
    res.json({ token });
})
// 
router.get('/:id', (req, res) => {
   
})

// Registration
router.post('/', express.json(), async (req, res) => {
    
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
        
        const token = jwt.sign({ userId: user._id }, 'your-secret-key');
        // Send the token back to the client
        res.json({ token });
        res.status(201).json({ message: 'User created.' });

        // send verification email
        // const verificationUrl = `http://localhost:3000/api/users/verify/${newUser.activeToken}`;
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

// Setupprofile / Profile Management
router.patch('/:userId', async (req, res) => {
    const userId = req.params.userId;
    const updates = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        Object.assign(user, updates);
        const updatedUser = await user.save();
        res.json(updatedUser);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }


})  

module.exports = router;