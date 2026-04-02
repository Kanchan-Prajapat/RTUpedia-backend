import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// 🔥 GOOGLE ONLY AUTH
export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { name, email, picture } = payload;

    let user = await User.findOne({ email });

    // ✅ create if not exist
    if (!user) {
      user = await User.create({
        name,
        email,
        password: "google_auth", // dummy
        profileImage: picture,
      });
    }

    const jwtToken = generateToken(user._id);

    res.json({
      token: jwtToken,
      user: {
        _id: user._id,
        name,
        email,
        profileImage: picture,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Google login failed" });
  }
};