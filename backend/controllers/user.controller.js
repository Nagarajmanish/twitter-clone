import User from "../models/user.model.js";
import Notification from "../models/notificationModel.js";
import bcrypt from "bcryptjs";
import cloudinary from "cloudinary";

export const getProfile = async(req,res)=>{
    try {
        const {username} = req.params;
        const user = await User.findOne({username: username});
        console.log(user);

        if(!user){
            return res.status(404).json({Message : "User not found"})
        }
        return res.status(200).json(user);
    } catch (error) {
        console.log(`Error in user controller ${error}`);
        res.status(500).json({error : "Internal Server Error"});
    }
}

export const followUnfollow = async (req, res) => {
    try {
        const { id } = req.params;
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if (!userToModify || !currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        if (id === req.user._id.toString()) {
            return res.status(400).json({ error: "You cannot follow or unfollow yourself" });
        }

        const isFollowing = currentUser.following.includes(id);

        if (isFollowing) {
            // Execute both unfollow actions in parallel
            await Promise.all([
                User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } }),
                User.findByIdAndUpdate(req.user._id, { $pull: { following: id } })
            ]);

            return res.status(200).json({ message: "Unfollowed successfully" });
        } else {
            // Execute both follow actions in parallel
            await Promise.all([
                User.findByIdAndUpdate(id, { $push: { followers: req.user._id } }),
                User.findByIdAndUpdate(req.user._id, { $push: { following: id } })
            ]);

            // Save notification
            const newNotification = new Notification({
                type: "follow",
                from: req.user._id,
                To: id
            });
            await newNotification.save();

            return res.status(200).json({ message: "Followed successfully" });
        }
    } catch (error) {
        console.error(`Error in followUnfollow controller: ${error}`);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


export const getSuggested = async(req,res)=>{
  try {
    const userId = req.user._id;
    const userfollowedByMe = await User.findById({_id : userId}).select("-password");

    const users = await User.aggregate([
        {
            $match : {
               _id : {$ne : userId}
            }
        },{
           $sample : {
               size :10
           }
        }
    ])
    const filteredUser =  users.filter((user)=>!userfollowedByMe.following.includes(user._id))
    const suggestedusers = filteredUser.slice(0,4);
    suggestedusers.forEach((user) => (user.password =  null));
    res.status(200).json(suggestedusers); 
  } catch (error) {
    console.log(`Error in getSuggested controller ${error}`);
        res.status(500).json({error : "Internal Server Error"});
  }
}

export const updateProfile = async (req, res) => {
    try {
        // Ensure req.user exists
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "Unauthorized access" });
        }

        const userId = req.user._id;
        const { username, fullName, email, currentPassword, newPassword, bio, link } = req.body;
        let { profileImg, coverImg } = req.body;

        // Find the user by ID
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Handle password update
        if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
            return res.status(400).json({ message: "Provide both current and new password" });
        }

        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Current password is incorrect" });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: "New password must be at least 6 characters long" });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        // Handle profile image update
        if (profileImg) {
            if (user.profileImg) {
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
            }
            const uploadedResponse = await cloudinary.uploader.upload(profileImg);
            profileImg = uploadedResponse.secure_url;
        }

        // Handle cover image update
        if (coverImg) {
            if (user.coverImg) {
                await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
            }
            const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            coverImg = uploadedResponse.secure_url;
        }

        // Update user fields
        user.username = username || user.username;
        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        // Save updated user
        user = await user.save();

        // Do not send back the password
        user.password = null;

        return res.status(200).json({ message: "Profile updated successfully", user });
    } catch (error) {
        console.error(`Error in updateProfile controller: ${error.message}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
