import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// REGISTER
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists)
    return res.status(400).json({ message: "User exists" });

  const user = await User.create({ name, email, password });

  res.json({
    token: generateToken(user._id),
    user: { name: user.name, email: user.email, _id: user._id },
  });
};

// LOGIN
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword?.(password)))
    return res.status(400).json({ message: "Invalid credentials" });

  res.json({
    token: generateToken(user._id),
    user: { name: user.name, email: user.email, _id: user._id },
  });
};

// FORGOT
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ message: "No user" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = token;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    res.json({ resetToken: token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// RESET
export const resetPassword = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({ message: "Invalid token" });

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.json({
    token: generateToken(user._id),
    user: { name: user.name, email: user.email },
  });
};