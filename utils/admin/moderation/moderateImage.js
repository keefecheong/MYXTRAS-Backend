// initialize AI moderation
const axios = require('axios');

// check image and return any reasons for rejection
module.exports = async function moderateImage(imageLink) {
    if (!imageLink) {
        return [];
    }
    
    const res = await axios.get('https://api.sightengine.com/1.0/check-workflow.json', {
        params: {
            'url': imageLink,
            'workflow': process.env.SIGHTENGINE_WORKFLOW,
            'api_user': process.env.SIGHTENGINE_USER,
            'api_secret': process.env.SIGHTENGINE_API_KEY,
        }
    });

    return res.data.summary.reject_reason.map(reason => reason.id);
}