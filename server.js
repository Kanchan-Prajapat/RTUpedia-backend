import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
app.use(cors());

const BASE_DIR = path.join(process.cwd(), "main");

// 🔥 Standardized: SEM NAMES MUST MATCH (Sem-I / Sem-II / 3 / 4 etc.)

// 📌 Fetch PYQs for a specific branch & semester
app.get("/api/pyq/:branch/:semester", (req, res) => {
  const { branch, semester } = req.params;

  const folderPath = path.join(BASE_DIR, branch.toUpperCase(), semester);

  if (!fs.existsSync(folderPath)) return res.json([]);

  const files = fs
    .readdirSync(folderPath)
    .filter((f) => f.toLowerCase().endsWith(".pdf"));

  const list = files.map((filename) => ({
    title: filename.replace(".pdf", ""),
    pdf: `/main/${branch.toUpperCase()}/${semester}/${encodeURIComponent(filename)}`
  }));

  res.json(list);
});

// 📌 Fetch ALL PYQs from a branch
app.get("/api/pyq/:branch", (req, res) => {
  const { branch } = req.params;

  const branchPath = path.join(BASE_DIR, branch.toUpperCase());
  if (!fs.existsSync(branchPath)) return res.json([]);

  const semesters = fs.readdirSync(branchPath);

  let output = [];

  semesters.forEach((sem) => {
    const semPath = path.join(branchPath, sem);
    if (!fs.lstatSync(semPath).isDirectory()) return;

    const files = fs
      .readdirSync(semPath)
      .filter((f) => f.toLowerCase().endsWith(".pdf"));

    files.forEach((filename) => {
      output.push({
        title: filename.replace(".pdf", ""),
        semester: sem,
        pdf: `/main/${branch.toUpperCase()}/${sem}/${encodeURIComponent(filename)}`
      });
    });
  });

  res.json(output);
});

// Serve PDF files
app.use("/main", express.static(path.join(BASE_DIR)));

const PORT = 5000;
app.listen(PORT, () =>
  console.log(` Backend running at http://localhost:${PORT}`)
);
