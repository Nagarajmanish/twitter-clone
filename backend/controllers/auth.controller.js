import User  from "../models/user.model.js";
import bcrypt from "bcryptjs"
import generateToken from "../utils/generateToken.js";


export const signup = async (req,res)=>{
    try {
        const {username , fullName , email ,password} = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
           return res.status(400).json({error:"Invalid Email format"})
        }
        const existingEmail = await User.findOne({email})
        const existingusername = await User.findOne({username})

        if(existingEmail || existingusername){
            return res.status(400).json({message:"Already user or Email Exists"})
        }

        if(password.length<6){
            return res.status(400).json({Error:'password length must be more than 6 characters'})
        }
        

        // hashing the password
        // for eg 12345 = cn2ffre34fg

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt)

        const user = new User({
            username,
            fullName,
            email,
            password : hashedPassword
        })

        if(user){
            generateToken(user._id , res)
            await user.save();
            return res.status(200).json({
                _id :user.id,
                username:user.username,
                fullName:user.fullName,
                email:user.email,
                followers:user.followers,
                following:user.following,
                profileImg:user.profileImg,
                coverImg:user.coverImg,
                bio:user.bio,
                link:user.link,
            })
        }
        else{
          return res.status(200).json({message: "Invalid user Data"})
        }
    } 
    catch (error) {
        console.log(`error is occuring on signup ${error}`)
       return  res.status(500).json({Error :'Internal Server Error'})
    }
}
export const login = async(req,res)=>{
    try {
        const {username , password} = req.body;
        const user = await User.findOne({username});
        const isPasswordCorrect = await bcrypt.compare(password ,user?.password || "");
    
        if(!user || !isPasswordCorrect){
            return res.status(400).json({error: "Invalid username or password"})
        }
        // console.log("User authenticated successfully");
        const token = generateToken(user._id, res);
        if(token){
        console.log("JWT token set in cookie");
        }
        res.status(200).json({
                _id :user.id,
                username:user.username,
                fullName:user.fullName,
                email:user.email,
                followers:user.followers,
                following:user.following,
                profileImg:user.profileImg,
                coverImg:user.coverImg,
                bio:user.bio,
                link:user.link
        })

    } catch (error) {
        console.log(`Error in Login Controller: ${error}`);
        res.status(500).json({Error: "Internal Server Error"});
    }
   
}
export const logout = (req,res)=>{
   try {
     res.cookie("jwt" ,"", {maxAge:0})
     res.status(200).json({message : 'logout successfully'})
   } catch (error) {
      console.log(`Error in Logout Controller: ${error}`);
      res.status(500).json({Error: "Internal Server Error"});
   } 
}

export const getMe =  async(req,res)=>{
    try {
        const user =  await User.findOne({_id : req.user._id}).select("-password");
        console.log(user);
        res.status(200).json(user);
    } catch (error) {
        console.log(`Error in Route Controller: ${error}`);
        res.status(500).json({Error: "Internal Server Error"});
    }
}