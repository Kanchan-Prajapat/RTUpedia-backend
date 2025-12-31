import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

import reviewRoutes from "./routes/review.routes.js";
import adminRoutes from "./routes/admin.routes.js";

/* =======================
   BASIC SETUP
======================= */
const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =======================
   LOAD ENV (LOCAL + RENDER)
======================= */
dotenv.config();

/* =======================
   CORS
======================= */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://rtupedia.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-admin-key"
    ]
  })
);

/* =======================
   MONGODB
======================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

/* =======================
   HEALTH CHECK
======================= */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "RTUpedia Backend is Live ✅"
  });
});

/* =======================
   REVIEW ROUTES (IMPORTANT)
======================= */
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

/* =======================
   FILE SYSTEM (PYQs) — DO NOT TOUCH
======================= */
const BASE_DIR = path.join(process.cwd(), "main");

if (!fs.existsSync(BASE_DIR)) {
  fs.mkdirSync(BASE_DIR, { recursive: true });
}

/* =======================
   UTILS
======================= */
const getBaseUrl = (req) =>
  `${req.protocol}://${req.get("host")}`;

/* =======================
   API: PYQ BY BRANCH + SEM
======================= */
app.get("/api/pyq/:branch/:semester", (req, res) => {
  const { branch, semester } = req.params;

  const folderPath = path.join(
    BASE_DIR,
    branch.toUpperCase(),
    semester
  );

  if (!fs.existsSync(folderPath)) {
    return res.json([]);
  }

  const baseUrl = getBaseUrl(req);

  const files = fs
    .readdirSync(folderPath)
    .filter((file) => file.toLowerCase().endsWith(".pdf"));

  res.json(
    files.map((filename) => ({
      title: filename.replace(".pdf", ""),
      pdf: `${baseUrl}/main/${branch.toUpperCase()}/${semester}/${encodeURIComponent(
        filename
      )}`
    }))
  );
});

/* =======================
   API: ALL PYQs (BRANCH)
======================= */
app.get("/api/pyq/:branch", (req, res) => {
  const { branch } = req.params;

  const branchPath = path.join(
    BASE_DIR,
    branch.toUpperCase()
  );

  if (!fs.existsSync(branchPath)) {
    return res.json([]);
  }

  const baseUrl = getBaseUrl(req);
  let output = [];

  fs.readdirSync(branchPath).forEach((semester) => {
    const semPath = path.join(branchPath, semester);
    if (!fs.lstatSync(semPath).isDirectory()) return;

    fs.readdirSync(semPath)
      .filter((file) => file.toLowerCase().endsWith(".pdf"))
      .forEach((filename) => {
        output.push({
          title: filename.replace(".pdf", ""),
          semester,
          pdf: `${baseUrl}/main/${branch.toUpperCase()}/${semester}/${encodeURIComponent(
            filename
          )}`
        });
      });
  });

  res.json(output);
});

/* =======================
   STATIC FILE SERVING
======================= */
app.use("/main", express.static(BASE_DIR));

/* =======================
   ERROR HANDLER
======================= */
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);
  res.status(500).json({ message: "Internal Server Error" });
});

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 RTUpedia Backend running on port ${PORT}`);
});
