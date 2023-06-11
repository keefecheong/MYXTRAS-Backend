// middleware to use multer for image uploading

const multer = require('multer');

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
            return res.status(400).json({ message: `Illegal file type, allowed file types: ${acceptedFileTypes.join(', ')}` });
        }
        else if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: `File is too large, maximum file size is ${maxImageSize / 1024 / 1024}MB.` });
        }
        else if (error.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({ message: `File limit reached, up to ${maxImageCount} files are allowed.` });
        }
    }

    next();
}

module.exports = {
    multerConfig,
    multerErrorHandler
}