// to upload files to firebase storage

const crypto = require('crypto');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { deleteFiles } = require('./firebaseStorageDelete.js');

const firebaseStorage = getStorage();

const UPLOAD_TYPE_POST = 'posts';
const UPLOAD_TYPE_FORUM = 'forums';
const UPLOAD_TYPE_THREAD = 'threads';
const UPLOAD_TYPE_USER = 'users';
const UPLOAD_TYPE_REPORT = 'reports';
const UPLOAD_TYPE_CHAT = 'chats';

// upload image to firebase storage and update image links
// if uploading fails then delete all the uploaded images (ask user to retry later)
async function uploadImages(images, imageLinks, objId, type, forumID) {
    for (let i = 0; i < images.length; i++) {
        let prefix = `${type}/${objId}`;

        const image = images[i];

        // upload image
        const uploadResult = await uploadFunction(image.buffer, prefix, image.originalname, image.mimetype);

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

// upload file to firebase storage and return file link
// if uploading fails then delete file
async function uploadFile(buffer, objId, name, type) {
    const prefix = `${UPLOAD_TYPE_CHAT}/${objId}`;

    // upload file
    const uploadResult = await uploadFunction(buffer, prefix, name, type);

    // delete files if upload unsuccessful
    if (!uploadResult.success) {
        deleteFiles([fileLink]);
    }

    // return file upload status and link
    return {
        successful: uploadResult.success,
        fileLink: uploadResult.link
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
    UPLOAD_TYPE_CHAT
}

// common function to upload file
async function uploadFunction(buffer, prefix, name, type) {
    let success = false;
    let link = '';

    // create new file name with hash
    const newName = crypto.createHash('md5').update(name).update(Date.now().toString()).digest('hex');
    
    // create reference
    const fileRef = ref(firebaseStorage, `${prefix}/${newName}`);

    // set metadata of the file
    const metadata = {
        cacheControl: 'max-age=31536000',  // set max cache lifetime to 1 year
        contentType: type
    }

    // upload file
    await uploadBytes(fileRef, buffer, metadata)
        .then(async (result) => {
            // get link to file
            await getDownloadURL(result.ref)
                .then((downloadURL) => {
                    link = downloadURL.split('&token')[0];
                    success = true;
                });
        })
        .catch((error) => {
            console.log(error);
        });

    // return file upload status and link
    return {
        success,
        link
    };
}