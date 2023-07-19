const Gamification = require('../../models/gamification');

const returnNotFoundReq = require('../../utils/general/returnNotFoundReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');


async function getGameData(req, res, next, type) {
    let target = null;
    console.log("!1111")
    try {
        const user_id = req.user._id;
        console.log(req.user)
        
        target = await Gamification.findOne({user_id: user_id}).lean();
        console.log(target)
        console.log('111111111')
        // if target is still null means the comment does not exist, return 404 error
        if (!target) {
            return returnNotFoundReq(res);
        }
    }
    catch (error) {
        return returnServerErrorReq(res);
    }

    res.comment = target;
    next();
}

module.exports = {
    getGameData
}