// to upload files to s3 storage

const crypto = require("crypto");
const { deleteFiles } = require("./s3Delete.js");

const UPLOAD_TYPE_POST = "posts";
const UPLOAD_TYPE_FORUM = "forums";
const UPLOAD_TYPE_THREAD = "threads";
const UPLOAD_TYPE_USER = "users";
const UPLOAD_TYPE_REPORT = "reports";
const UPLOAD_TYPE_CHAT = "chats";
const UPLOAD_TYPE_EVENT = "events";

// upload image to s3 and update image links
// if uploading fails then delete all the uploaded images
async function uploadImages(images, imageLinks, objId, type) {
  for (let i = 0; i < images.length; i++) {
    let prefix = `${type}/${objId}`;

    const image = images[i];

    // upload image
    const uploadResult = await uploadFunction(
      image.buffer,
      prefix,
      image.originalname,
      image.mimetype,
    );

    // delete images if upload unsuccessful and return false
    if (!uploadResult.success) {
      deleteFiles(imageLinks);
      return false;
    }

    // otherwise add link to imageLinks
    imageLinks.push(uploadResult.link);
  }

  return true;
}

// upload file to s3 and return file link
// if uploading fails then delete file
async function uploadFile(buffer, objId, name, type) {
  const prefix = `${UPLOAD_TYPE_CHAT}/${objId}`;

  // upload file
  const uploadResult = await uploadFunction(buffer, prefix, name, type);

  // return file upload status and link
  return {
    successful: uploadResult.success,
    fileLink: uploadResult.link,
  };
}

module.exports = {
  uploadImages,
  uploadFile,
  UPLOAD_TYPE_POST,
  UPLOAD_TYPE_FORUM,
  UPLOAD_TYPE_THREAD,
  UPLOAD_TYPE_USER,
  UPLOAD_TYPE_REPORT,
  UPLOAD_TYPE_CHAT,
  UPLOAD_TYPE_EVENT,
};

// common function to upload file
async function uploadFunction(buffer, prefix, name, type) {
  let success = false;
  let link = "";

  // create new file name with hash
  const newName = crypto
    .createHash("md5")
    .update(name)
    .update(Date.now().toString())
    .digest("hex");

  const body = JSON.stringify({
    key: `${prefix}/${newName}`,
    buffer: JSON.stringify(buffer),
    type: type,
  });

  // send name, buffer, and file type to lambda upload function
  await fetch(`${process.env.AWS_S3_LAMBDA_BASE_URL}/upload`, {
    method: "POST",
    mode: "cors",
    body: body,
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(async (res) => {
      if (res.ok) {
        await res.json().then((data) => {
          link = data.link;
          success = true;
        });
      }
    })
    .catch((err) => console.error(err));

  return { success, link };
}
