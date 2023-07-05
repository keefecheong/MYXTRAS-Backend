// to upload files to firebase storage

const crypto = require('crypto');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { deleteFiles } = require('./firebaseStorageDelete.js');

const firebaseStorage = getStorage();

// upload image to firebase storage and update image links
// if uploading fails then delete all the uploaded images (ask user to retry later)
async function uploadImages (images, imageLinks, objId, type, forumID) {
    for (let i = 0; i < images.length; i++) {
        let prefix;

        // set prefix based on object type or return false for no matches
        switch (type) {
            case 'post':
                prefix = `posts/${objId}`;
                break;
            case 'user':
                prefix = `users/${objId}`;
                break;
            case 'forum':
                prefix = `forums/${objId}`;
                break;
            case 'thread':
                prefix = `threads/${forumID}/${objId}`;
                break;
            default:
                return false;
        }

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
async function uploadFile (buffer, objId, name, type) {
    const prefix = `chats/${objId}`;

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
    uploadFile
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
        cacheControl: 'max-age=300',
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
                })
                .catch((error) => {
                    console.log(error);
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