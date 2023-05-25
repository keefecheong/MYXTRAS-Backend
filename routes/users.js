const express = require('express');
const User = require('../models/user');
const router = express.Router();
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

router.get('/login', authenticateToken, async (req, res) => {
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

        const accessToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
          });

        // res.cookie("auth-api", token, {
        //     httpOnly: true,
        //     //secure: process.env.NODE_ENV === "production",
        //     //signed: true,
        //     //maxAge: 1000000
        // })
        // res.status(201).json({ 
        //     token,
        //     data: {
        //         newUser,
        //     },
        //     message: 'User created.' });
        // console.log("test");

        res.json({ accessToken: accessToken})

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
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"]
    
    // Checks if authHeader exists or return undefined
    const token = authHeader && authHeader.split(' ')[1]

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