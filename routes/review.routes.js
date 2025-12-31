//review.routes.js

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

    // Basic validation
    if (!name || !email || !message || !rating) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // Save review to DB
    const review = await Review.create({
      name,
      email,
      message,
      rating,
      approved: false
    });

    // Send emails (NON-BLOCKING)
    mailAdmin({ name, email, message, rating }).catch(console.error);
    mailUserConfirmation({ name, email }).catch(console.error);

    return res.json({
      success: true,
      message: "Review submitted for approval"
    });
  } catch (err) {
    console.error("Review submit error:", err);
    return res.status(500).json({
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
