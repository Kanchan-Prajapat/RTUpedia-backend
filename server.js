import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ✅ Health check (Render / browser)
app.get("/", (req, res) => {
  res.status(200).send("RTUpedia Backend is Live ✅");
});

// Base directory for PDFs
const BASE_DIR = path.join(process.cwd(), "main");

// ✅ Backend base URL (important for frontend)
const BASE_URL =
  process.env.BASE_URL || "https://rtupedia-backend.onrender.com";

// 🔒 Ensure main/ folder exists (prevents crash)
if (!fs.existsSync(BASE_DIR)) {
  fs.mkdirSync(BASE_DIR, { recursive: true });
}

// 📌 Fetch PYQs for a specific branch & semester
app.get("/api/pyq/:branch/:semester", (req, res) => {
  const { branch, semester } = req.params;

  const folderPath = path.join(BASE_DIR, branch.toUpperCase(), semester);

  if (!fs.existsSync(folderPath)) {
    return res.json([]);
  }

  const files = fs
    .readdirSync(folderPath)
    .filter(file => file.toLowerCase().endsWith(".pdf"));

  const response = files.map(filename => ({
    title: filename.replace(".pdf", ""),
    pdf: `${BASE_URL}/main/${branch.toUpperCase()}/${semester}/${encodeURIComponent(
      filename
    )}`,
  }));

  res.json(response);
});

// 📌 Fetch ALL PYQs for a branch
app.get("/api/pyq/:branch", (req, res) => {
  const { branch } = req.params;

  const branchPath = path.join(BASE_DIR, branch.toUpperCase());
  if (!fs.existsSync(branchPath)) {
    return res.json([]);
  }

  let output = [];

  fs.readdirSync(branchPath).forEach(semester => {
    const semPath = path.join(branchPath, semester);
    if (!fs.lstatSync(semPath).isDirectory()) return;

    fs.readdirSync(semPath)
      .filter(file => file.toLowerCase().endsWith(".pdf"))
      .forEach(filename => {
        output.push({
          title: filename.replace(".pdf", ""),
          semester,
          pdf: `${BASE_URL}/main/${branch.toUpperCase()}/${semester}/${encodeURIComponent(
            filename
          )}`,
        });
      });
  });

  res.json(output);
});

// 📂 Serve PDF files
app.use("/main", express.static(BASE_DIR));

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
