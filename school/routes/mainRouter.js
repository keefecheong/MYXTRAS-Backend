const express = require('express');
const mainRouter = express.Router();

const returnGoodReq = require('../../utils/returnReq/returnGoodReq.js');

// get school and course details
mainRouter.get('/', (req, res) => {
    const schools = require('../utils/schools.json');

    returnGoodReq(res, schools);
});

module.exports = mainRouter;