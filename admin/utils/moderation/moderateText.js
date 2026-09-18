// to moderate text content
const axios = require("axios");
const FormData = require("form-data");

// send text content for moderation and return reasons for rejection
module.exports = async function moderateText(text) {
  if (!text) {
    return [];
  }

  const data = new FormData();
  data.append("text", text);
  data.append("lang", "en");
  data.append("mode", "ml");
  data.append("api_user", process.env.SIGHTENGINE_USER);
  data.append("api_secret", process.env.SIGHTENGINE_API_KEY);

  const res = await axios({
    url: "https://api.sightengine.com/1.0/text/check.json",
    method: "post",
    data: data,
    headers: data.getHeaders(),
  });

  const classes = res.data.moderation_classes;
  return classes.available.filter((reason) => classes[reason] > 0.5);
};
