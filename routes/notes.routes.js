import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import NotesPDF from "../models/NotesPDF.model.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();
const semestersByYear = {
  "first-year": ["1", "2"],
  "second-year": ["3", "4"],
  "third-year": ["5", "6"],
  "fourth-year": ["7", "8"]
};
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!file.originalname.toLowerCase().endsWith(".pdf")) {
      callback(new Error("Only PDF files are allowed"));
      return;
    }

    callback(null, true);
  }
});

const isValidLocation = (yearSlug, branch, semester) =>
  Object.prototype.hasOwnProperty.call(semestersByYear, yearSlug) &&
  semestersByYear[yearSlug].includes(semester) &&
  /^[A-Z0-9-]{2,12}$/.test(branch);

router.get("/", async (req, res) => {
  const yearSlug = String(req.query.yearSlug || "");
  const branch = String(req.query.branch || "").toUpperCase();
  const semester = String(req.query.semester || "");

  if (!isValidLocation(yearSlug, branch, semester)) {
    return res.status(400).json({ message: "Invalid year, branch, or semester" });
  }

  try {
    const notes = await NotesPDF.find({ yearSlug, branch, semester })
      .select("subject unit originalName")
      .sort({ createdAt: -1 });

    return res.json(
      notes.map((note) => ({
        id: note._id.toString(),
        subject: note.subject,
        unit: note.unit,
        filename: note.originalName,
        pdf: `/api/notes/${note._id}/pdf`
      }))
    );
  } catch (error) {
    console.error("Failed to fetch notes PDFs:", error);
    return res.status(500).json({ message: "Unable to fetch notes PDFs" });
  }
});

router.get("/:id/pdf", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Notes PDF not found" });
  }

  try {
    const note = await NotesPDF.findById(req.params.id).select("data");
    if (!note) {
      return res.status(404).json({ message: "Notes PDF not found" });
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="notes.pdf"',
      "Cache-Control": "public, max-age=3600"
    });
    return res.end(note.data);
  } catch (error) {
    console.error("Failed to read notes PDF:", error);
    return res.status(500).json({ message: "Unable to read notes PDF" });
  }
});

router.post(
  "/",
  protect,
  adminOnly,
  (req, res, next) => {
    upload.single("pdf")(req, res, (error) => {
      if (!error) {
        next();
        return;
      }

      const status = error instanceof multer.MulterError
        ? error.code === "LIMIT_FILE_SIZE" ? 413 : 400
        : 400;
      res.status(status).json({ message: error.message || "Invalid PDF upload" });
    });
  },
  async (req, res) => {
    const yearSlug = String(req.body.yearSlug || "");
    const branch = String(req.body.branch || "").toUpperCase();
    const semester = String(req.body.semester || "");
    const subject = String(req.body.subject || "").trim();
    const unit = String(req.body.unit || "").trim();
    const file = req.file;

    if (!isValidLocation(yearSlug, branch, semester)) {
      return res.status(400).json({ message: "Invalid year, branch, or semester" });
    }
    if (!subject || subject.length > 120 || !unit || unit.length > 160) {
      return res.status(400).json({ message: "Subject and unit title are required" });
    }
    if (!file || file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return res.status(400).json({ message: "Choose a valid PDF file" });
    }

    try {
      const note = await NotesPDF.create({
        yearSlug,
        branch,
        semester,
        subject,
        unit,
        originalName: file.originalname.replace(/[^\w.-]/g, "_").slice(0, 180),
        data: file.buffer
      });

      return res.status(201).json({
        id: note._id.toString(),
        subject: note.subject,
        unit: note.unit,
        filename: note.originalName,
        pdf: `/api/notes/${note._id}/pdf`
      });
    } catch (error) {
      console.error("Failed to upload notes PDF:", error);
      return res.status(500).json({ message: "Unable to save notes PDF" });
    }
  }
);

export default router;
