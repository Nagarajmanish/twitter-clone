import Notification from "../models/notificationModel.js";

export const getNotifications = async(req,res)=>{
  try {
    const userId =  req.user._id;

    const notification = await Notification.find({To : userId}).populate({
        path : 'from',
        select:'username profileImg'
    })
    const x = await Notification.updateMany({To:userId},{read:true})
    // console.log(x);
    return res.status(200).json(notification);

  } catch (error) {
    console.log(`Error in getNotification controller :${error}`);
    res.status(500).json({error:'Internal Server Error'})
  }
}

export const deleteNotifications = async(req,res)=>{
    try {
        const userId = req.user._id;
        await Notification.deleteMany({To :userId});

        return res.status(200).json({message:'Notification deleted successfully'})
    } catch (error) {
        console.log(`Error in deleteNotification controller :${error}`);
        res.status(500).json({error:'Internal Server Error'})
    }
}