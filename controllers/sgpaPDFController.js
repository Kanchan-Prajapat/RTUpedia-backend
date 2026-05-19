// controllers/sgpaPDFController.js

import fs from "fs";
import * as pdf from "pdf-parse";


/* =========================================
   SUBJECT CODE → BRANCH + SEM DETECTOR
========================================= */
const courseData = JSON.parse(
  fs.readFileSync(
    new URL(
      "../data/rtu_courses_by_branch_sem.json",
      import.meta.url
    )
  )
);

const gradeData = JSON.parse(
  fs.readFileSync(
    new URL(
      "../data/grade_points.json",
      import.meta.url
    )
  )
);



/* =========================================
   EXTRACT SUBJECTS + GRADES
========================================= */
const extractSubjectsAndGrades = (text) => {
  /*
    Example RTU PDF line:

    3CS4-05 DATABASE MANAGEMENT SYSTEM A+

    OR

    3CS4-06 TOC B+
  */

  const regex =
    /(\d[A-Z]{2,4}\d-\d{2}).*?(A\+\+|A\+|A|B\+|B|C\+|C|D\+|D|E\+|E|F)/g;

  const results = [];

  let match;

  while ((match = regex.exec(text)) !== null) {
    results.push({
      subjectCode: match[1].trim(),
      grade: match[2].trim(),
    });
  }

  return results;
};

/* =========================================
   MAIN CONTROLLER
========================================= */
const detectBranchAndSemester = (subjectCode) => {

  const clean = subjectCode
    .replace(/\s+/g, "")
    .toUpperCase();

  // Example: 3CS4-05
  const match = clean.match(/\d([A-Z]{2,4})(\d)/);

  if (!match) {
    return {
      branch: "CSE",
      semester: "1",
    };
  }

  const branchCode = match[1];
  const semester = match[2];

  const branchMap = {
    CS: "CSE",
    CE: "CE",
    EE: "EE",
    ME: "ME",
    CHEM: "CHEM",
    IOT: "IOT",
    CY: "CY",
    AIDS: "AIDS",
  };

  return {
    branch: branchMap[branchCode] || "CSE",
    semester,
  };
};



export const processRTUPDFResult = async (
  req,
  res
) => {
  try {
    /* =========================
       CHECK FILE
    ========================= */
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF uploaded",
      });
    }

    const filePath = req.file.path;

    /* =========================
       READ PDF
    ========================= */
    const pdfBuffer = fs.readFileSync(filePath);

    const pdfData = await pdf.default(pdfBuffer);

    const extractedText = pdfData.text;

    console.log(
      "========== PDF TEXT =========="
    );

    console.log(extractedText);

    /* =========================
       EXTRACT SUBJECTS
    ========================= */
    const extractedSubjects =
      extractSubjectsAndGrades(
        extractedText
      );

    if (!extractedSubjects.length) {
      fs.unlinkSync(filePath);

      return res.status(400).json({
        success: false,
        message:
          "Could not detect subjects/grades from PDF",
      });
    }

    let detectedBranch = "CSE";
let detectedSemester = "1";

if (extractedSubjects.length > 0) {

  const detected =
    detectBranchAndSemester(
      extractedSubjects[0].subjectCode
    );

  detectedBranch = detected.branch;
  detectedSemester = detected.semester;
}



    

    /* =========================
       AUTO DETECT BRANCH + SEM
    ========================= */
    const firstSubject =
      extractedSubjects[0];

    const detected =
      detectBranchAndSemester(
        firstSubject.subjectCode
      );

    if (!detected) {
      fs.unlinkSync(filePath);

      return res.status(400).json({
        success: false,
        message:
          "Could not detect branch/semester",
      });
    }

    const { branch, semester } =
      detected;

    console.log(
      "Detected:",
      branch,
      semester
    );

    /* =========================
       GET COURSES
    ========================= */
    const courses =
      courseData[branch]?.[semester] || [];

    if (!courses.length) {
      fs.unlinkSync(filePath);

      return res.status(400).json({
        success: false,
        message:
          "No course data found",
      });
    }

    /* =========================
       CREATE COURSE MAP
    ========================= */
    const courseMap = {};

    courses.forEach((course) => {
      courseMap[
         course.subjectCode
      ?.replace(/\s+/g, "")
      .replace(/[^\w-]/g, "")
          .toUpperCase()
      ] = course;
    });

    /* =========================
       SGPA CALCULATION
    ========================= */
    let totalCredits = 0;
    let totalWeighted = 0;

    const finalSubjects = [];

    extractedSubjects.forEach((item) => {
      const cleanCode = item.subjectCode
        ?.replace(/\s+/g, "")
        .replace(/[^\w-]/g, "")
        .toUpperCase();

      const matchedCourse =
        courseMap[cleanCode];

        console.log(
  "PDF CODE:",
  cleanCode
);

console.log(
  "MATCH FOUND:",
  matchedCourse
);

      if (!matchedCourse) return;

      const gradePoint =
        gradeData.gradePoints[
        item.grade
        ] || 0;

      totalCredits +=
        matchedCourse.credits;

      totalWeighted +=
        matchedCourse.credits *
        gradePoint;

      finalSubjects.push({
        subjectCode:
         matchedCourse.subjectCode ,

        subjectName:
          matchedCourse.name,

        credits:
          matchedCourse.credits,

        grade: item.grade,

        gradePoint,
      });
    });

    const sgpa =
      totalCredits > 0
        ? (
          totalWeighted /
          totalCredits
        ).toFixed(2)
        : "0.00";

    /* =========================
       DELETE TEMP FILE
    ========================= */
    fs.unlinkSync(filePath);

    /* =========================
       RESPONSE
    ========================= */
    return res.json({
      success: true,

      branch,
      semester,

      sgpa,

      totalCredits,

      subjects: finalSubjects,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to process RTU PDF",

      error: error.message,
    });
  }
};