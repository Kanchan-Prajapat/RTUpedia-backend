import express from "express";
import multer from "multer";

import {
  processRTUPDFResult,
} from "../controllers/sgpaPDFController.js";

const router = express.Router();

const upload = multer({
  dest: "uploads/",
});

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "SGPA route working",
  });
});

router.post(
  "/upload-result",
  upload.single("marksheet"),
  processRTUPDFResult
);

export default router;