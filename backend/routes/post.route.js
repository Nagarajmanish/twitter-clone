import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import { createPost, 
    deletePost,
    commentPost,
    likeOrUnlikePost,
    getAllPosts, 
    getLikedPost,
    getFollowingPost,
    getUserPosts,
    getPostCount
} from "../controllers/post.controller.js";
const router = express.Router();
 
router.get("/followingPost",protectRoute,getFollowingPost)
router.get("/likedPost/:id",protectRoute,getLikedPost)
router.get("/user/:username",protectRoute,getUserPosts)
router.get("/all",protectRoute,getAllPosts)
router.get("/count/:username",protectRoute,getPostCount)
router.post("/create",protectRoute,createPost)
router.post("/likes/:id",protectRoute,likeOrUnlikePost)
router.post("/comment/:id",protectRoute,commentPost)
router.delete("/:id",protectRoute,deletePost)

export default router;