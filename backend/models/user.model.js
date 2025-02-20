import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minLength: 7
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: []
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: []
    }],
    profileImg: {
        type: String,
        default: null
    },
    coverImg: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        default: null
    },
    link: {
        type: String,
        default: null,
        validate: {
            validator: function (v) {
                return /^(https?:\/\/)?([\w-]+.)+[\w-]+(\/[\w-]*)?$/.test(v);
            },
            message: "Invalid URL format"
        }
    },
    likedPost: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        default: []
    }]
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
