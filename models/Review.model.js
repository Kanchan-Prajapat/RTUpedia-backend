import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "Anonymous"
  },
  message: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  email: {
  type: String,
  required: true,
},
  approved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model("Review", reviewSchema);
