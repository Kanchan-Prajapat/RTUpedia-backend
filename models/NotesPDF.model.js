import mongoose from "mongoose";

const notesPdfSchema = new mongoose.Schema(
  {
    yearSlug: {
      type: String,
      required: true,
      enum: ["first-year", "second-year", "third-year", "fourth-year"]
    },
    branch: {
      type: String,
      required: true
    },
    semester: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    originalName: {
      type: String,
      required: true
    },
    data: {
      type: Buffer,
      required: true
    }
  },
  { timestamps: true }
);

notesPdfSchema.index({ yearSlug: 1, branch: 1, semester: 1, createdAt: -1 });

export default mongoose.model("NotesPDF", notesPdfSchema);
