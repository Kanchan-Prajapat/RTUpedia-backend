import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
app.use(cors());

// ✅ Railway health check
app.get("/", (req, res) => {
  res.status(200).send("RTUpedia Backend is Live ✅");
});

const BASE_DIR = path.join(process.cwd(), "main");

// Fetch PYQs by branch & semester
app.get("/api/pyq/:branch/:semester", (req, res) => {
  const { branch, semester } = req.params;
  const folderPath = path.join(BASE_DIR, branch.toUpperCase(), semester);

  if (!fs.existsSync(folderPath)) return res.json([]);

  const files = fs.readdirSync(folderPath).filter(f =>
    f.toLowerCase().endsWith(".pdf")
  );

  res.json(
    files.map(filename => ({
      title: filename.replace(".pdf", ""),
      pdf: `/main/${branch.toUpperCase()}/${semester}/${encodeURIComponent(filename)}`
    }))
  );
});

// Fetch all PYQs of a branch
app.get("/api/pyq/:branch", (req, res) => {
  const branchPath = path.join(BASE_DIR, branch.toUpperCase());
  if (!fs.existsSync(branchPath)) return res.json([]);

  let output = [];

  fs.readdirSync(branchPath).forEach(sem => {
    const semPath = path.join(branchPath, sem);
    if (!fs.lstatSync(semPath).isDirectory()) return;

    fs.readdirSync(semPath)
      .filter(f => f.toLowerCase().endsWith(".pdf"))
      .forEach(filename => {
        output.push({
          title: filename.replace(".pdf", ""),
          semester: sem,
          pdf: `/main/${branch.toUpperCase()}/${sem}/${encodeURIComponent(filename)}`
        });
      });
  });

  res.json(output);
});

// Serve PDFs
app.use("/main", express.static(BASE_DIR));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Backend running on port ${PORT}`)
);
