import User from "../models/user.model.js";
import cloudinary from "cloudinary";
import Post from "../models/postModel.js";
import Notification from "../models/notificationModel.js";


export const createPost = async (req, res) => {
    try {
        const { text } = req.body;
        let { img } = req.body;
        const userId = req.user._id.toString();

        const user = await User.findById({ _id: userId });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!text && !img) {
            return res.status(400).json({ error: 'Post must have text or an image' });
        }

        if (img) {
            const maxSize = 10 * 1024 * 1024; // 10 MB
            const imgSize = Buffer.byteLength(img, 'base64'); // Calculate the image size

            if (imgSize > maxSize) {
                return res.status(400).json({ error: 'Image size exceeds the 10MB limit' });
            }

            try {
                const uploadedResponse = await cloudinary.uploader.upload(img, {
                    timeout: 0 // Optional: increase timeout duration to 1 minute
                });
                img = uploadedResponse.secure_url;
            } catch (cloudinaryError) {
                console.error("Cloudinary Upload Error:", cloudinaryError);
                return res.status(500).json({ error: 'Image upload failed' });
            }
        }

        const newPost = new Post({
            user: userId,
            text,
            img
        });

        await newPost.save();
        res.status(201).json(newPost);

    } catch (error) {
        console.error(`Error in createPost Controller: ${error}`);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};


export const deletePost = async(req,res)=>{
    try {
        const {id} = req.params;

        const post =  await Post.findById({_id : id});
        if(!post){
            return res.status(404).json({error:'post not found'});
        }
        
        if(post.user.toString()!==req.user._id.toString()){
            return res.status(401).json({error:'you are not authorized to delete this post'});
        }
        
        if(post.img){
            const img = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(img);
        }
        await Post.findByIdAndDelete({_id:id})
        return res.status(200).json({message:'post deleted successfully'});
    } catch (error) {
        console.log(`Error in deletePost Controller : ${error}`);
        res.status(500).json({error:'Internal Server Error'})
    }
}

export const commentPost = async(req,res)=>{
    try {
        const {text} = req.body
        const postId = req.params.id;
        const userId = req.user._id;
        
        if(!text){
            return res.status(400).json({error:'comment text is required'})
        }

        const post = await Post.findOne({_id : postId})
        if(!post){
            return res.status(404).json({error:'post not found'})
        }

        const comment = {
            user : userId,
            text
        }
        post.comments.push(comment);
        await post.save();
        const newNotification  = new Notification({
            type : "comment",
            from : req.user._id,
            To : postId
        })
        await newNotification.save();
        res.status(200).json(post);
    } catch (error) {
        console.log(`Error in commentPost controller: ${error}`);
        res.status(500).json({error:'Internal server error'})
    }
}

export const likeOrUnlikePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const postId = req.params.id;

        if (!userId || !postId) {
            return res.status(400).json({ error: 'Invalid user or post ID' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const userLikedPost = post.likes.includes(userId);

        if (userLikedPost) {
            // Unlike post
            await Post.updateOne({_id : postId }, { $pull: { likes: userId } });
            await User.updateOne({ _id: userId }, { $pull: { likedPost: postId } });
            const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());
            return res.status(200).json(updatedLikes);
        } else {
            // Like post
            post.likes.push(userId);
            await Post.findByIdAndUpdate(postId, { $push: { likes: userId } });
            await User.updateOne({_id :userId}, { $push: { likedPost: postId } });

            // Create and save new notification
            const newNotification = new Notification({
                type: "like",
                from: req.user._id,
                To: post.user, // Assuming `post.user` holds the ID of the post author
            });
            await newNotification.save();
            const updatedLikes = post.likes;
            return res.status(200).json(updatedLikes);
        }
    } catch (error) {
        console.error(`Error in likeOrUnlikePost Controller: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const getAllPosts = async(req,res)=>{
    try {
      const posts = await Post.find().sort({createdAt :-1}).populate({
        path :'user',
        select : "-password"
      }).populate({
         path : "comments.user",
         select :["-password","-email","-followers","-following","-bio","-link"]
      })
      if(posts.length===0){
        return res.status(200).json([])
      }
      res.status(200).json(posts)
    } catch (error) {
        console.log(`Error in getAllUsers controller : ${error}`)
        res.status(500).json({error:'Internal server error'})
    }
}

export const getLikedPost = async (req, res) => {
    try {
        const user = req.user._id;

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userDocument = await User.findById(user);
        if (!userDocument || !userDocument.likedPost || userDocument.likedPost.length === 0) {
            return res.status(404).json({ error: 'No liked posts found for the user' });
        }

        const likedPosts = await Post.find({ _id: { $in: userDocument.likedPost } })
            .populate({
                path: 'user',
                select: '-password',
            })
            .populate({
                path: 'comments.user',
                select: ['-password', '-email', '-followers', '-following', '-bio', '-link'],
            });

        return res.status(200).json(likedPosts);
    } catch (error) {
        console.error(`Error in getLikedPost Controller: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getFollowingPost = async(req,res)=>{
    try {
        const userId = req.user._id;
        const user = await User.findById({_id:userId});
        if(!user){
            return res.status(404).json({error:'user not found'});
        }
        const following  = user.following;
        const feedposts = await Post.find({user :{$in : following}})
        .populate({
            path: 'user',
            select: '-password',
        })
        .populate({
            path: 'comments.user',
            select: ['-password', '-email', '-followers', '-following', '-bio', '-link'],
        });
        return res.status(200).json(feedposts)
    } catch (error) {
        console.log(`Error in getFollowingPost controller : ${error}`);
        res.status(500).json({error:'Internal Server error'});    
    }
}

export const getUserPosts = async(req,res)=>{
    try {
        const {username} = req.params;
        // console.log(username)
        const user = await User.findOne({ username: username });
        //console.log(user);
        if(!user){
            return res.status(404).json({error:'user not found'});
        }
        const userposts = await Post.find({user:user._id}).sort({createdAt : -1})
        .populate({
            path: 'user',
            select: '-password',
        })
        .populate({
            path: 'comments.user',
            select: ['-password', '-email', '-followers', '-following', '-bio', '-link'],
        });
        return res.status(200).json(userposts);
    } catch (error) {
        console.log(`Error in getUsersPosts Controller : ${error}`)
        res.status(500).json({error:'Internal server error'});
    }
}

export const getPostCount = async (req, res) => {
    try {
        const { username } = req.params;
        
        // First find the user by username
        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Count posts by this user
        const count = await Post.countDocuments({ user: user._id });
        
        res.status(200).json({ count });
    } catch (error) {
        console.error(`Error in getPostCount Controller: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};