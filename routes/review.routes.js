import express from "express";
import Review from "../models/Review.model.js";
import {
  mailAdmin,
  mailUserConfirmation
} from "../services/mail.service.js";

const router = express.Router();

/* =========================
   Submit a Review
========================= */
router.post("/", async (req, res) => {
  try {
    const { name, email, message, rating } = req.body;

    // Validation
    if (!name || !email || !message || !rating) {
      return res.status(400).json({
        success: false,
        message: "Missing fields"
      });
    }

    // ✅ SAVE TO DB FIRST
    await Review.create({
      name,
      email,
      message,
      rating,
      approved: false
    });

    // ✅ RESPOND IMMEDIATELY
    res.json({
      success: true,
      message: "Review submitted for approval"
    });

    // 🔥 EMAILS (NON-BLOCKING, SAFE)
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
   Get Approved Reviews
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
