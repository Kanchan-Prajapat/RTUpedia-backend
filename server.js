import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();

/* =======================
   ✅ CORS CONFIG
   ======================= */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://rtupedia.vercel.app"
    ],
    methods: ["GET"],
    allowedHeaders: ["Content-Type"]
  })
);

app.options("*", cors());
app.use(express.json());

/* =======================
   ✅ HEALTH CHECK
   ======================= */
app.get("/", (req, res) => {
  res.status(200).send("RTUpedia Backend is Live ✅");
});

/* =======================
   📂 FILE SYSTEM
   ======================= */
const BASE_DIR = path.join(process.cwd(), "main");

if (!fs.existsSync(BASE_DIR)) {
  fs.mkdirSync(BASE_DIR, { recursive: true });
}

/* =======================
   🌐 BASE URL (AUTO-DETECT)
   ======================= */
const getBaseUrl = (req) => {
  return `${req.protocol}://${req.get("host")}`;
};

/* =======================
   📌 API: BRANCH + SEMESTER
   ======================= */
app.get("/api/pyq/:branch/:semester", (req, res) => {
  const { branch, semester } = req.params;
  const folderPath = path.join(BASE_DIR, branch.toUpperCase(), semester);

  if (!fs.existsSync(folderPath)) {
    return res.json([]);
  }

  const baseUrl = getBaseUrl(req);

  const files = fs
    .readdirSync(folderPath)
    .filter(file => file.toLowerCase().endsWith(".pdf"));

  res.json(
    files.map(filename => ({
      title: filename.replace(".pdf", ""),
      pdf: `${baseUrl}/main/${branch.toUpperCase()}/${semester}/${encodeURIComponent(
        filename
      )}`
    }))
  );
});

/* =======================
   📌 API: ALL PYQs OF BRANCH
   ======================= */
app.get("/api/pyq/:branch", (req, res) => {
  const { branch } = req.params;
  const branchPath = path.join(BASE_DIR, branch.toUpperCase());

  if (!fs.existsSync(branchPath)) {
    return res.json([]);
  }

  const baseUrl = getBaseUrl(req);
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
          pdf: `${baseUrl}/main/${branch.toUpperCase()}/${semester}/${encodeURIComponent(
            filename
          )}`
        });
      });
  });

  res.json(output);
});

/* =======================
   📂 STATIC PDF SERVING
   ======================= */
app.use("/main", express.static(BASE_DIR));

/* =======================
   🚀 START SERVER
   ======================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
