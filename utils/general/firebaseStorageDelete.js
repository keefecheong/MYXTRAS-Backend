// to delete files from firebase storage

const { getStorage, ref, deleteObject } = require('firebase/storage');

const firebaseStorage = getStorage();

// delete files based on a list of URLs from firebase storage
function deleteFiles(fileLinks) {
    const baseURL = process.env.FIREBASE_STORAGE_BASE_URL;
    
    for (let i = 0; i < fileLinks.length; i++) {
        let path = decodeURIComponent(fileLinks[i].replace(baseURL, '').split('?')[0]);
        const fileRef = ref(firebaseStorage, path);
        deleteObject(fileRef)
            .catch((error) => {
                console.log(error);
            });
    }
}

module.exports = {
    deleteFiles
}