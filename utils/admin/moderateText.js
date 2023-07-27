// initialize AI moderation
const axios = require('axios');
const FormData = require('form-data');

module.exports = function moderateText(text) {
    data = new FormData();
    data.append('text', text);
    data.append('lang', 'en');
    data.append('mode', 'ml');
    data.append('api_user', process.env.SIGHTENGINE_USER);
    data.append('api_secret', process.env.SIGHTENGINE_API_KEY);
    axios({
        url: 'https://api.sightengine.com/1.0/text/check.json',
        method:'post',
        data: data,
        headers: data.getHeaders()
        })
        .then(function (response) {
            // on success: handle response
            console.log(response.data);
        })
        .catch(function (error) {
            // handle error
            if (error.response) console.log(error.response.data);
            else console.log(error.message);
        }
    );
}