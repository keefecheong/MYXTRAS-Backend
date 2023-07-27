// initialize AI moderation
const axios = require('axios');


module.exports = function moderateImage(imageLink) {
    axios.get('https://api.sightengine.com/1.0/check-workflow.json', {
    params: {
        'url': imageLink,
        'workflow': 'wfl_etq0TFMWzXigAAdbbws3m',
        'api_user': process.env.SIGHTENGINE_USER,
        'api_secret': process.env.SIGHTENGINE_API_KEY,
    }
    })
    .then(function (response) {
        // on success: handle response
        console.log(response.data);
    })
    .catch(function (error) {
        // handle error
        if (error.response) console.log(error.response.data);
        else console.log(error.message);
    });
}