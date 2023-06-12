// to upload files to firebase storage

const crypto = require('crypto');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { deleteImages } = require('./firebaseStorageDelete.js');

const firebaseStorage = getStorage();

// upload image to firebase storage and update image links
// if uploading fails then delete all the uploaded images (ask user to retry later)
const uploadImages = async (images, imageLinks, postId) => {
    for (let i = 0; i < images.length; i++) {
        const image = images[i];

        // create new file name with hash
        const newName = crypto.createHash('md5').update(image.originalname).update(Date.now().toString()).digest('hex');

        // set metadata of the image
        const metadata = {
            cacheControl: 'max-age=300',
            contentType: image.mimetype
        }

        const imageRef = ref(firebaseStorage, `posts/${postId}/${newName}`);
        await uploadBytes(imageRef, image.buffer, metadata)
            .then(async (result) => {
                await getDownloadURL(result.ref)
                    .then((downloadURL) => {
                        imageLinks.push(downloadURL.split('&token')[0]);
                    })
                    .catch(async (error) => {
                        console.log(error);
                        deleteImages(imageLinks);
                        return false;
                    });

            })
            .catch(async (error) => {
                console.log(error);
                deleteImages(imageLinks);
                return false;
            });
    }

    return true;
}

module.exports = {
    uploadImages
}