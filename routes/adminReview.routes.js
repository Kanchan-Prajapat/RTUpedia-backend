import express from "express";
import Review from "../models/Review.model.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
const router = express.Router();

/* 🔐 Get Pending Reviews */
router.get("/pending", adminOnly, protect, async (req, res) => {
  try {
    const reviews = await Review.find({ approved: false }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch {
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

/* ✅ Approve Review */
router.put("/approve/:id", adminOnly, protect, async (req, res) => {
  await Review.findByIdAndUpdate(req.params.id, { approved: true });
  res.json({ message: "Approved" });
});

/* ❌ Delete Review */
router.delete("/:id", adminOnly, protect, async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

export default router;