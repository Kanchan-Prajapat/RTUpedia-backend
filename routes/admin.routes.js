import express from "express";
import Review from "../models/Review.model.js";

const router = express.Router();

// Admin auth (simple key)
router.use((req, res, next) => {
  if (req.headers["x-admin-key"] !== "rtupedia_admin_secret") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
});

// GET pending reviews
router.get("/reviews", async (req, res) => {
  const reviews = await Review.find({ approved: false }).sort({ createdAt: -1 });
  res.json(reviews);
});

// APPROVE review
router.put("/reviews/:id/approve", async (req, res) => {
  await Review.findByIdAndUpdate(req.params.id, { approved: true });
  res.json({ success: true });
});

// DELETE review
router.delete("/reviews/:id", async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
