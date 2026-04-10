import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
	try {
		const token = req.cookies.jwt;
		if (!token) {
			return res.status(401).json({ error: "Unauthorized: No Token Provided" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		if (!decoded) {
			return res.status(401).json({ error: "Unauthorized: Invalid Token" });
		}

		const user = await User.findById(decoded.userId).select("-password");

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

        if (user.isBanned) {
            return res.status(403).json({ error: "Tài khoản của bạn đã bị khóa bởi Quản trị viên." });
        }

		req.user = user;
		next();
	} catch (err) {
		console.log("Error in protectRoute middleware:", err.message);
		if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
			return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
		}
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

export const adminRoute = (req, res, next) => {
	if (req.user && (req.user.role === "admin" || req.user.email === "admin@gmail.com")) {
		next();
	} else {
		return res.status(403).json({ error: "Access denied: Admin only" });
	}
};
