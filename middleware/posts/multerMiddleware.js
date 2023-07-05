// middleware to use multer for image uploading

const multer = require('multer');

const returnBadReq = require('../../utils/general/returnBadReq.js');

// validation values
const acceptedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
const maxImageSize = 2 * 1024 * 1024;
const maxImageCount = 10;

// multer settings
const multerConfig = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: maxImageCount,
        fileSize: maxImageSize
    },
    fileFilter: function(req, file, callback) {
        if (acceptedFileTypes.indexOf(file.mimetype) != -1) {
            callback(null, true);
        }
        else {
            return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file), false);
        }
    }
});

// error handler
const multerErrorHandler = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_UNEXPECTED_FILE") {
            return returnBadReq(res, `Illegal file type, allowed file types: ${acceptedFileTypes.join(', ')}`);
        }
        else if (error.code === "LIMIT_FILE_SIZE") {
            return returnBadReq(res, `File is too large, maximum file size is ${maxImageSize / 1024 / 1024}MB.`);
        }
        else if (error.code === "LIMIT_FILE_COUNT") {
            return returnBadReq(res, `File limit reached, up to ${maxImageCount} files are allowed.`);
        }
    }

    next();
}

module.exports = {
    multerConfig,
    multerErrorHandler
}