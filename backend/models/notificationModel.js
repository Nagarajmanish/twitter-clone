import mongoose from "mongoose";

const NotificationSchema = mongoose.Schema({
    from:{
        type : mongoose.Schema.Types.ObjectId,
        ref :"User",
        required : true
    },
    To:{
        type : mongoose.Schema.Types.ObjectId,
        ref :"User",
        required : true
    },
    type : {
        type : String,
        required : true,
        enum : ["follow","like","comment"]
    },
    read:{
        type:Boolean,
        default : false
    }
},{timestamps : true})

const Notification = mongoose.model("Notification",NotificationSchema)
export default Notification;