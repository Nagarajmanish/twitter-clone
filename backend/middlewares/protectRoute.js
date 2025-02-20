import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const protectRoute = async (req, res, next) => {
  try {
    // console.log("Cookies:", req.cookies);
    const token = req.cookies.jwt; // Access the "jwt" cookie

    if (!token) {
      console.error("No token provided.");
      return res.status(400).json({ error: "Unauthorized: No Token Provided" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by ID (excluding the password field)
    const user = await User.findById(decoded.userId).select("-password").lean();

    if (!user) {
      console.error("User not found.");
      return res.status(400).json({ error: "User not found" });
    }

    req.user = user; // Attach user to request object for later use
    next(); // Proceed to the next middleware/route handler

  } catch (error) {
    console.error("Error in protectRoute middleware:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default protectRoute;
