import Review from "../models/Review.model.js";

// 🔐 ADD REVIEW (ONLY LOGGED USER)
export const addReview = async (req, res) => {
  try {
    const review = await Review.create({
      user: req.user._id,
      name: req.user.name,
      email: req.user.email,
      message: req.body.message,
      rating: req.body.rating || 5,
    });

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: "Failed to add review" });
  }
};

// 🌍 GET ONLY APPROVED REVIEWS
export const getReviews = async (req, res) => {
  const reviews = await Review.find({ approved: true }).sort({
    createdAt: -1,
  });

  res.json(reviews);
};