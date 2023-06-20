// controller functions to handle POST and PATCH requests for posts

const Post = require('../../models/post.js');
const { uploadImages } = require('../../utils/general/firebaseStorageUpload.js');
const { deleteFiles } = require('../../utils/general/firebaseStorageDelete.js');

// create a post
const createPost = async (req, res) => {
    // check if images are provided in the body
    // if provided, continue to create post
    // otherwise return 400 error
    if (req.files.length <= 0) {
        return res.status(400).json({ message: 'At least one image is required.' });
    }

    try {
        const post = new Post({
            creator_id: req.user._id,
            content_links: [],
            original_names: req.files.map(image => image.originalname)
        });

        // save post to make post_id available
        await post.save();
        
        // upload images and store the links in content_links of the new post
        const uploadSuccessful = await uploadImages(req.files, post.content_links, post.id, 'post');

        // if failed to upload images then delete the post from database and return error message
        if (!uploadSuccessful) {
            await Post.findByIdAndDelete(post.id);
            res.status(500).json({ message: 'Failed to upload images, please try again later.' });
        }

        await post.save();

        res.status(200).json({ message: 'Post created.' });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const updatePost = async (req, res) => {
    // check if images are provided in the body
    // if provided, continue to update post,
    // otherwise, return 400 error
    if (req.files.length <= 0) {
        return res.status(400).json({ message: 'At least one image is required.' });   
    }

    // check if the creator of the post is the requesting user
    // if creator is not the requesting user return 401 error
    if (!req.user._id.equals(res.post.creator_id._id)) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    try {
        var newImageLinks = [];

        const uploadSuccessful = await uploadImages(req.files, newImageLinks, req.params.postId, 'post');

        // if failed to upload images then send error message
        if (!uploadSuccessful) {
            res.status(500).json({ message: 'Failed to update post, please try again later.' });
        }

        // otherwise delete old images, update content_links and save the post
        deleteFiles(res.post.content_links);

        res.post.content_links = newImageLinks;
        res.post.original_names = req.files.map(image => image.originalname);
        
        await res.post.save();

        res.status(200).json({ message: 'Post updated.' });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    createPost,
    updatePost
}