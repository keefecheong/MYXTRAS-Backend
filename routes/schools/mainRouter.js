const express = require('express');
const mainRouter = express.Router();

const returnGoodReq = require('../../utils/general/returnGoodReq.js');

// get school and course details
mainRouter.get('/', (req, res) => {
    const schools = require('../schools.json');

    returnGoodReq(res, schools);
});

module.exports = mainRouter;