import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import { getProfile,followUnfollow,getSuggested,updateProfile} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile/:username",protectRoute , getProfile);
router.post("/follow/:id",protectRoute , followUnfollow);
router.get("/suggested",protectRoute, getSuggested)
router.post("/update" ,protectRoute, updateProfile)

export default router;