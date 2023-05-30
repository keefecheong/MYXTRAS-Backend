// to delete files from firebase storage

const { getStorage, ref, deleteObject } = require('firebase/storage');

const firebaseStorage = getStorage();

// delete images based on a list of URLs from firebase storage
const deleteImages = (imageLinks) => {
    const baseURL = process.env.FIREBASE_STORAGE_BASE_URL;
    
    for (let i = 0; i < imageLinks.length; i++) {
        let path = decodeURIComponent(imageLinks[i].replace(baseURL, '').split('?')[0]);
        const imageRef = ref(firebaseStorage, path);
        deleteObject(imageRef)
            .catch((error) => {
                console.log(error);
            });
    }
}

module.exports = {
    deleteImages
}