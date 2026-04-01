import express from "express";
import Review from "../models/Review.model.js";
import {
  mailAdmin,
  mailUserConfirmation
} from "../services/mail.service.js";

import { protect } from "../middleware/authMiddleware.js"; // 🔥 ADD THIS

const router = express.Router();

/* =========================
   Submit a Review (PROTECTED 🔐)
========================= */
router.post("/", protect, async (req, res) => {
  try {
    const { message, rating } = req.body;

    // 🔥 GET USER FROM TOKEN
    const name = req.user.name;
    const email = req.user.email;

    if (!message || !rating) {
      return res.status(400).json({
        success: false,
        message: "Missing fields"
      });
    }

    // ✅ SAVE REVIEW (linked to user)
    await Review.create({
      user: req.user._id, // 🔥 important
      name,
      email,
      message,
      rating,
      approved: false
    });

    res.json({
      success: true,
      message: "Review submitted for approval"
    });

    // 🔥 EMAILS (same as before)
    Promise.resolve()
      .then(() =>
        mailAdmin({ name, email, message, rating })
      )
      .catch(err =>
        console.error("Admin mail failed:", err.message)
      );

    Promise.resolve()
      .then(() =>
        mailUserConfirmation({ name, email })
      )
      .catch(err =>
        console.error("User mail failed:", err.message)
      );

  } catch (err) {
    console.error("Review submit error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =========================
   Get Approved Reviews (PUBLIC)
========================= */
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find({ approved: true })
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error("Fetch reviews error:", err);
    res.status(500).json({ success: false });
  }
});

export default router;