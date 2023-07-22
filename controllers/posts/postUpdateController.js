// controller functions to handle POST and PATCH requests for posts

const Post = require('../../models/post.js');

const { uploadImages, UPLOAD_TYPE_POST } = require('../../utils/firebase/firebaseStorageUpload.js');
const { deleteFiles } = require('../../utils/firebase/firebaseStorageDelete.js');

const compareId = require('../../utils/general/compareId.js');
const saveDocAsync = require('../../utils/cache/saveDocAsync.js');

const { cacheNewPost, updateCachedPost } = require('../../cache/posts/postUpdateCache.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// create a post
async function createPost(req, res) {
    // check if images are provided in the body
    // if provided, continue to create post
    // otherwise return 400 error
    if (req.files.length <= 0) {
        return returnBadReq(res, 'At least one image is required.');
    }

    const creatorId = req.user._id;

    const post = new Post({
        creator_id: creatorId,
        content_links: [],
        original_names: req.files.map(image => image.originalname)
    });

    // check if there is request body (data for other fields)
    if (req.body) {
        if (req.body.caption) {
            post.caption = req.body.caption;
        }

        if (req.body.location) {
            post.location = req.body.location;
        }

        if (req.body.commentsEnabled) {
            post.comments_enabled = req.body.commentsEnabled == 'true';
        }

        if (req.body.tags) {
            post.tags = req.body.tags;
        }
    }

    try {
        // upload images and store the links in content_links of the new post
        const uploadSuccessful = await uploadImages(req.files, post.content_links, post._id, UPLOAD_TYPE_POST);

        // if failed to upload images then return error message
        if (!uploadSuccessful) {
            return returnServerErrorReq(res);
        }

        const userDetails = {
            _id: creatorId,
            username: req.user.username,
            profile_pic_link: req.user.profile_pic_link,
            blocked_users: req.user.blocked_users
        }

        // upload to cache if key exists
        const updateCacheResult = await cacheNewPost(post, userDetails);

        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(post, updateCacheResult);

        returnGoodReq(res, { message: 'Post created.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// update a post
async function updatePost(req, res) {
    const userId = req.user._id;
    const postId = req.params.postId;

    // check if there is request body provided
    // if no request body is present return 400 error
    // otherwise continue to update post
    if (!req.body) {
        return returnBadReq(res, 'At least one field is required.');
    }

    // check if images are provided in the body
    // if provided, continue to update post,
    // otherwise, if 'noFilesChanged' field is provided and set to true, continue to update post
    // otherwise return 400 error
    if (req.files.length <= 0 && req.body.noFilesChanged != 'true') {
        return returnBadReq(res, 'At least one image is required.'); 
    }

    // check if the creator of the post is the requesting user
    // if creator is not the requesting user return 401 error
    if (!compareId(userId, res.post.creator_id._id)) {
        return returnUnauthorizedReq(res);
    }

    // convert post to mongoose document to perform operations
    const post = new Post(res.post);
    post.isNew = false;

    const updatedValues = {};

    // update fields and add to updatedValues if changed
    if (req.body.caption && req.body.caption != post.caption) {
        post.caption = req.body.caption;
        updatedValues.caption = req.body.caption;
    }

    if (req.body.location && req.body.location != post.location) {
        post.location = req.body.location;
        updatedValues.location = req.body.location;
    }

    if (req.body.commentsEnabled && req.body.commentsEnabled != post.comments_enabled) {
        post.comments_enabled = req.body.commentsEnabled == 'true';
        updatedValues.comments_enabled = req.body.commentsEnabled == 'true';
    }

    if (req.body.tags && req.body.tags != post.tags) {
        post.tags = req.body.tags;
        updatedValues.tags = req.body.tags;
    }

    try {
        // upload new images and update post if provided
        if (req.body.noFilesChanged != 'true') {
            var newImageLinks = [];
    
            const uploadSuccessful = await uploadImages(req.files, newImageLinks, postId, UPLOAD_TYPE_POST);
    
            // if failed to upload images then send error message
            if (!uploadSuccessful) {
                return returnServerErrorReq(res);
            }
    
            // otherwise delete old images, update content_links and save the post
            deleteFiles(post.content_links);

            const newOriginalNames = req.files.map(image => image.originalname);
    
            post.content_links = newImageLinks;
            post.original_names = newOriginalNames;

            updatedValues.content_links = newImageLinks;
            updatedValues.original_names = newOriginalNames;
        }

        // update last modified time
        const newLastModifiedTime = Date.now();

        post.last_modified_time = newLastModifiedTime;
        updatedValues.last_modified_time = newLastModifiedTime;
        
        // update cache entry if post is in cache
        const updateCacheResult = await updateCachedPost(updatedValues, userId, postId, res.postFromCache);
        
        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(post, updateCacheResult);

        returnGoodReq(res, { message: 'Post updated.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    createPost,
    updatePost
}