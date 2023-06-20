// to upload files to firebase storage

const crypto = require('crypto');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { deleteFiles } = require('./firebaseStorageDelete.js');

const firebaseStorage = getStorage();

// upload image to firebase storage and update image links
// if uploading fails then delete all the uploaded images (ask user to retry later)
const uploadImages = async (images, imageLinks, objId, type, forumID) => {
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        // create new file name with hash
        const newName = crypto.createHash('md5').update(image.originalname).update(Date.now().toString()).digest('hex');

        // set metadata of the image
        const metadata = {
            cacheControl: 'max-age=300',
            contentType: image.mimetype
        }
        let imageRef;

        if (type === "post") {
            imageRef = ref(firebaseStorage, `posts/${objId}/${newName}`);
        }
        else if (type === 'user'){
            imageRef = ref(firebaseStorage, `users/${objId}/${newName}`);
        }
        else if (type === 'forum'){
            imageRef = ref(firebaseStorage, `forums/${objId}/${newName}`);
        }
        else if (type === 'thread'){
            imageRef = ref(firebaseStorage, `threads/${forumID}/${objId}/${newName}`);

        }
        await uploadBytes(imageRef, image.buffer, metadata)
            .then(async (result) => {
                await getDownloadURL(result.ref)
                    .then((downloadURL) => {
                        imageLinks.push(downloadURL.split('&token')[0]);
                    })
                    .catch((error) => {
                        console.log(error);
                        deleteFiles(imageLinks);
                        return false;
                    });

            })
            .catch((error) => {
                console.log(error);
                deleteFiles(imageLinks);
                return false;
            });
        
    }

    return true;
}

// upload file to firebase storage and return file link
// if uploading fails then delete file
const uploadFile = async (buffer, objId, name, type) => {
    // create new file name with hash
    const newName = crypto.createHash('md5').update(name).update(Date.now().toString()).digest('hex');

    // set metadata of the file
    const metadata = {
        cacheControl: 'max-age=300',
        contentType: type
    }

    const fileRef = ref(firebaseStorage, `chats/${objId}/${newName}`);
    let fileLink = '';
    
    await uploadBytes(fileRef, buffer, metadata)
        .then(async (result) => {
            await getDownloadURL(result.ref)
                .then((downloadURL) => {
                    fileLink = downloadURL.split('&token')[0];
                })
                .catch((error) => {
                    console.log(error);
                    deleteFiles([fileLink]);
                });

        })
        .catch((error) => {
            console.log(error);
            deleteFiles([fileLink]);
        });

    const result = {
        successful: fileLink != '',
        fileLink: fileLink
    }

    return result;
}

module.exports = {
    uploadImages,
    uploadFile
}