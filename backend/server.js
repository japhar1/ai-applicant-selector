import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import multer from "multer";
import path from "path";
import fs from "fs";
// Remove static import for pdf-parse; use dynamic import in parsePDF
import mammoth from "mammoth";
import natural from "natural";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== DATABASE SETUP ====================

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection error:", err);
  } else {
    console.log("✅ Database connected successfully at:", res.rows[0].now);
  }
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
});

// ==================== MIDDLEWARE ====================

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.options("*", cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== FILE UPLOAD SETUP ====================

const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.",
      ),
      false,
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// ==================== DOCUMENT PARSING FUNCTIONS ====================

async function parsePDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const { createRequire } = await import("module");
  const require = createRequire(import.meta.url);
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(dataBuffer);
  return data.text;
}

async function parseDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function parseTXT(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}

async function parseDocument(filePath, mimeType) {
  if (mimeType === "application/pdf") {
    return await parsePDF(filePath);
  } else if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return await parseDOCX(filePath);
  } else if (mimeType === "application/msword") {
    return await parseDOCX(filePath);
  } else if (mimeType === "text/plain") {
    return await parseTXT(filePath);
  }
  throw new Error("Unsupported file type");
}

let coverLetterScore = 75;
if (req.files["coverLetter"]) {
  const coverFile = req.files["coverLetter"][0];
  const coverText = await parseDocument(coverFile.path, coverFile.mimetype);
  coverLetterScore = analyzeCoverLetter(coverText);
}

// ==================== IMPROVED EXTRACTION FUNCTIONS ====================

function extractEducation(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Strategy 1: Flexible degree/field patterns
  const flexiblePatterns = [
    // e.g. BSc Computer Science
    /\b(Bachelor(?:'s)?|B\.?Sc\.?|BSc|BA|B\.?A\.?)\s*[,\-:]?\s*([A-Za-z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|$)/i,
    /\b(Master(?:'s)?|M\.?Sc\.?|MSc|MA|M\.?A\.?)\s*[,\-:]?\s*([A-Za-z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|$)/i,
    /\b(PhD|Ph\.?D\.?|Doctorate)\s*[,\-:]?\s*([A-Za-z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|$)/i,
    /\b(HND|Diploma)\s*[,\-:]?\s*([A-Za-z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|$)/i,
  ];

  // Strategy 2: Scan all lines for degree/field combos
  for (const line of lines) {
    for (const pattern of flexiblePatterns) {
      const match = line.match(pattern);
      if (match) {
        const degree = match[1].trim();
        let field = match[2] ? match[2].trim() : "";
        field = field.replace(
          /\s+(from|at|in|of|with|and|the|university|college|institute).*$/i,
          "",
        );
        if (
          field.length > 3 &&
          field.length < 50 &&
          /^[A-Za-z\s&]+$/.test(field)
        ) {
          return `${normalizeDegree(degree)} ${field}`;
        } else if (field.length >= 3) {
          return normalizeDegree(degree);
        }
      }
    }
  }

  // Strategy 3: Look in EDUCATION section specifically
  const educationSectionRegex =
    /(?:EDUCATION|ACADEMIC|QUALIFICATION)[\s\S]{0,500}?(?:\n\n|\n[A-Z]{3})/i;
  const educationSection = text.match(educationSectionRegex);
  const searchText = educationSection ? educationSection[0] : text;
  for (const pattern of flexiblePatterns) {
    const match = searchText.match(pattern);
    if (match) {
      const degree = match[1].trim();
      let field = match[2] ? match[2].trim() : "";
      field = field.replace(
        /\s+(from|at|in|of|with|and|the|university|college|institute).*$/i,
        "",
      );
      if (
        field.length > 3 &&
        field.length < 50 &&
        /^[A-Za-z\s&]+$/.test(field)
      ) {
        return `${normalizeDegree(degree)} ${field}`;
      } else if (field.length >= 3) {
        return normalizeDegree(degree);
      }
    }
  }

  // Strategy 4: Look for degree without field (fallback)
  const simpleDegreePattern =
    /\b(Bachelor(?:'s)?|B\.?Sc\.?|BSc|BA|B\.?A\.?|Master(?:'s)?|M\.?Sc\.?|MSc|MA|M\.?A\.?|PhD|Ph\.?D\.?|HND|Diploma)\b/i;
  for (const line of lines) {
    const simpleMatch = line.match(simpleDegreePattern);
    if (simpleMatch) {
      return normalizeDegree(simpleMatch[1]);
    }
  }
  const simpleMatch = searchText.match(simpleDegreePattern);
  if (simpleMatch) {
    return normalizeDegree(simpleMatch[1]);
  }

  return null;
}

function normalizeDegree(degree) {
  const normalized = degree.toLowerCase().replace(/[.']/g, "");

  if (/bachelor|bsc|ba/.test(normalized)) return "BSc";
  if (/master|msc|ma/.test(normalized)) return "MSc";
  if (/phd|doctorate/.test(normalized)) return "PhD";
  if (/hnd/.test(normalized)) return "HND";
  if (/diploma/.test(normalized)) return "Diploma";

  return degree;
}

function extractExperience(text) {
  // Strategy 1: Look for explicit "X years of experience" statements
  const explicitPatterns = [
    /\b(?:over|more than|approximately|about)?\s*(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+)?experience\b/i,
    /\bexperience[:\s]+(?:over|more than|approximately|about)?\s*(\d{1,2})\+?\s*(?:years?|yrs?)\b/i,
    /\b(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+)?(?:work\s+)?experience\b/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = text.match(pattern);
    if (match) {
      const years = parseInt(match[1]);
      // Sanity check: reasonable range
      if (years >= 0 && years <= 50) {
        return years;
      }
    }
  }

  // Strategy 2: Calculate from job dates in EXPERIENCE section
  const experienceYears = calculateExperienceFromDates(text);
  if (
    experienceYears !== null &&
    experienceYears >= 0 &&
    experienceYears <= 50
  ) {
    return experienceYears;
  }

  // Strategy 3: Look for "worked for X years" pattern
  const workedPattern =
    /\b(?:worked|employed)\s+for\s+(?:over|about|approximately)?\s*(\d{1,2})\+?\s*(?:years?|yrs?)\b/i;
  const workedMatch = text.match(workedPattern);
  if (workedMatch) {
    const years = parseInt(workedMatch[1]);
    if (years >= 0 && years <= 50) {
      return years;
    }
  }

  return null;
}

function calculateExperienceFromDates(text) {
  // Look for date ranges like "Jan 2019 - May 2024" or "2019 - 2024"
  const dateRangePatterns = [
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(\d{4})\s*[-–—]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(\d{4}|Present|Current|Now)\b/gi,
    /\b(\d{4})\s*[-–—]\s*(\d{4}|Present|Current|Now)\b/gi,
  ];

  let totalMonths = 0;
  const currentYear = new Date().getFullYear();

  for (const pattern of dateRangePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let startYear, endYear;

      if (match.length === 5) {
        // Format: "Jan 2019 - May 2024"
        startYear = parseInt(match[2]);
        endYear = match[4].match(/\d{4}/) ? parseInt(match[4]) : currentYear;
      } else {
        // Format: "2019 - 2024"
        startYear = parseInt(match[1]);
        endYear = match[2].match(/\d{4}/) ? parseInt(match[2]) : currentYear;
      }

      // Validate years are reasonable
      if (
        startYear >= 1970 &&
        startYear <= currentYear &&
        endYear >= startYear &&
        endYear <= currentYear + 1
      ) {
        totalMonths += (endYear - startYear) * 12;
      }
    }
  }

  if (totalMonths > 0) {
    const years = Math.round(totalMonths / 12);
    // Sanity check
    return years >= 0 && years <= 50 ? years : null;
  }

  return null;
}

function extractName(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Skip words that indicate this is not a name
  const skipWords = [
    "resume",
    "cv",
    "curriculum",
    "vitae",
    "results",
    "oriented",
    "professional",
    "experience",
    "summary",
    "objective",
    "profile",
    "headline",
    "contact",
    "about",
    "technical",
    "support",
    "engineer",
    "developer",
    "manager",
    "specialist",
    "analyst",
    "consultant",
    "coordinator",
    "administrator",
    "director",
    "senior",
    "junior",
    "lead",
    "principal",
    "staff",
    "associate",
    "key",
    "achievements",
    "education",
    "skills",
    "work",
    "employment",
  ];

  // Check first 15 lines
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i];

    // Skip very long lines (likely descriptions)
    if (line.length > 60) continue;

    // Skip lines starting with special characters
    if (/^[>\-\*\d•\[\(]/.test(line)) continue;

    // Skip if contains skip words
    const lowerLine = line.toLowerCase();
    if (skipWords.some((word) => lowerLine.includes(word))) continue;

    // Pattern: 2-4 words, first letter capitalized
    // Allow hyphens, apostrophes, periods (for initials)
    const namePattern =
      /^([A-Z][a-z]+(?:['\-][A-Z][a-z]+)?|[A-Z]\.?)\s+([A-Z][a-z]+(?:['\-][A-Z][a-z]+)?|[A-Z]\.?)(?:\s+([A-Z][a-z]+(?:['\-][A-Z][a-z]+)?|[A-Z]\.))?(?:\s+([A-Z][a-z]+(?:['\-][A-Z][a-z]+)?|[A-Z]\.))?$/;

    if (namePattern.test(line)) {
      // Additional validation: not all caps, reasonable length
      if (
        line !== line.toUpperCase() &&
        line.length >= 5 &&
        line.length <= 50
      ) {
        return line;
      }
    }
  }

  // Fallback: Look for "Name:" label
  const nameWithLabelPattern =
    /(?:name|full\s+name|applicant)[:\s]+([A-Z][a-z]+(?:['\-\s][A-Z][a-z]+){1,3})/i;
  const labelMatch = text.match(nameWithLabelPattern);
  if (labelMatch) {
    return labelMatch[1].trim();
  }

  return null;
}

function extractEmail(text) {
  // Improved email regex - more strict
  const emailRegex =
    /\b[A-Za-z0-9](?:[A-Za-z0-9._-]{0,63})[A-Za-z0-9]@[A-Za-z0-9](?:[A-Za-z0-9.-]{0,253})[A-Za-z0-9]\.[A-Za-z]{2,}\b/g;
  const emails = text.match(emailRegex);

  if (!emails) return null;

  // Filter out common false positives
  const validEmails = emails.filter((email) => {
    const lower = email.toLowerCase();
    // Exclude example/dummy emails
    return (
      !lower.includes("example.com") &&
      !lower.includes("test.com") &&
      !lower.includes("sample.com") &&
      !lower.includes("dummy.com")
    );
  });

  return validEmails.length > 0 ? validEmails[0] : null;
}

function extractPhone(text) {
  // Multiple phone patterns
  const phonePatterns = [
    // International format: +234-803-123-4567
    /\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}/g,
    // Local format: (234) 803-123-4567
    /\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
  ];

  for (const pattern of phonePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      // Filter and validate
      const validPhones = matches.filter((phone) => {
        const digits = phone.replace(/\D/g, "");
        // Phone should have 10-15 digits
        return digits.length >= 10 && digits.length <= 15;
      });

      if (validPhones.length > 0) {
        return validPhones[0];
      }
    }
  }

  return null;
}

function calculateResumeQuality(text) {
  let score = 0;

  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 500 && wordCount <= 2000) {
    score += 30;
  } else if (wordCount >= 300 && wordCount < 500) {
    score += 20;
  } else if (wordCount > 2000 && wordCount <= 3000) {
    score += 20;
  }

  if (extractEmail(text)) score += 15;
  if (extractPhone(text)) score += 10;
  if (extractEducation(text)) score += 15;
  if (extractExperience(text)) score += 15;

  const skills = extractSkills(text);
  if (skills.length > 0) score += 15;

  return Math.min(score, 100);
}

function analyzeCoverLetter(text) {
  const tokenizer = new natural.WordTokenizer();
  const analyzer = new natural.SentimentAnalyzer(
    "English",
    natural.PorterStemmer,
    "afinn",
  );

  const tokens = tokenizer.tokenize(text);
  const sentiment = analyzer.getSentiment(tokens);

  const baseScore = ((sentiment + 5) / 10) * 50 + 25;

  const wordCount = text.split(/\s+/).length;
  let lengthScore = 0;
  if (wordCount >= 200 && wordCount <= 500) {
    lengthScore = 25;
  } else if (wordCount >= 100 && wordCount < 200) {
    lengthScore = 15;
  } else if (wordCount > 500 && wordCount <= 700) {
    lengthScore = 15;
  }

  let toneScore = 0;
  const professionalPhrases = [
    "i am writing",
    "dear",
    "sincerely",
    "regards",
    "position",
    "opportunity",
    "experience",
    "skills",
    "qualified",
  ];

  const lowerText = text.toLowerCase();
  professionalPhrases.forEach((phrase) => {
    if (lowerText.includes(phrase)) toneScore += 2;
  });

  return Math.min(
    Math.round(baseScore + lengthScore + Math.min(toneScore, 25)),
    100,
  );
}

// ==================== ROUTES ====================

app.get("/", (req, res) => {
  res.json({
    message: "AI Applicant Selector API",
    status: "online",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      applicants: "/api/applicants",
      statistics: "/api/statistics",
      upload: "/api/upload/complete-application",
    },
  });

  app.get("/api/applicants/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
      SELECT 
        a.*,
        COALESCE(
          json_agg(
            json_build_object(
              'skill_name', s.skill_name,
              'proficiency_level', s.proficiency_level
            )
          ) FILTER (WHERE s.skill_name IS NOT NULL),
          '[]'
        ) as skills
      FROM applicants a
      LEFT JOIN skills s ON a.id = s.applicant_id
      WHERE a.id = $1
      GROUP BY a.id
    `,
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Applicant not found",
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error("❌ Error fetching applicant:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Highly Recommended') as highly_recommended,
        COUNT(*) FILTER (WHERE status = 'Recommended') as recommended,
        COUNT(*) FILTER (WHERE status = 'Consider') as consider,
        ROUND(AVG(overall_score)::numeric, 2) as avg_score
      FROM applicants
    `);

      res.json({
        success: true,
        data: {
          total: parseInt(stats.rows[0].total),
          highlyRecommended: parseInt(stats.rows[0].highly_recommended),
          recommended: parseInt(stats.rows[0].recommended),
          consider: parseInt(stats.rows[0].consider),
          avgScore: parseFloat(stats.rows[0].avg_score) || 0,
        },
      });
    } catch (error) {
      console.error("❌ Error calculating statistics:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ==================== UPLOAD ENDPOINTS ====================

  app.post(
    "/api/upload/complete-application",
    upload.fields([
      { name: "resume", maxCount: 1 },
      { name: "coverLetter", maxCount: 1 },
    ]),
    async (req, res) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        let resumeData = {};
        if (req.files["resume"]) {
          const resumeFile = req.files["resume"][0];
          const resumeText = await parseDocument(
            resumeFile.path,
            resumeFile.mimetype,
          );
          resumeData = {
            name: extractName(resumeText),
            email: extractEmail(resumeText),
            phone: extractPhone(resumeText),
            education: extractEducation(resumeText),
            experience_years: extractExperience(resumeText),
            skills: extractSkills(resumeText),
            resume_quality_score: calculateResumeQuality(resumeText),
          };
          console.log("🔍 Extracted data:", {
            name: resumeData.name,
            email: resumeData.email,
            education: resumeData.education,
            experience: resumeData.experience_years,
            skills_count: resumeData.skills?.length,
          });
        }

        let coverLetterScore = 75;
        if (req.files["coverLetter"]) {
          const coverFile = req.files["coverLetter"][0];
          const coverText = await parseDocument(
            coverFile.path,
            coverFile.mimetype,
          );
          coverLetterScore = analyzeCoverLetter(coverText);
        }

        const skillsScore = Math.min(resumeData.skills?.length * 10 + 50, 100);
        const experienceScore = resumeData.experience_years
          ? Math.min(resumeData.experience_years * 15 + 40, 100)
          : 50;
        const educationScore = resumeData.education ? 85 : 50;
        const assessmentScore = 80;
        const resumeQualityScore = resumeData.resume_quality_score || 75;

        const overallScore = (
          skillsScore * 0.25 +
          experienceScore * 0.25 +
          educationScore * 0.2 +
          assessmentScore * 0.15 +
          resumeQualityScore * 0.1 +
          coverLetterScore * 0.05
        ).toFixed(2);

        let status = "Under Review";
        if (overallScore >= 90) status = "Highly Recommended";
        else if (overallScore >= 80) status = "Recommended";
        else if (overallScore >= 70) status = "Consider";

        const applicantResult = await client.query(
          `INSERT INTO applicants (
          full_name, email, phone, education, experience_years,
          overall_score, skills_score, experience_score, education_score,
          assessment_score, resume_quality_score, cover_letter_score,
          status, motivation_level, availability
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
          [
            resumeData.name || "Unknown",
            resumeData.email || `applicant_${Date.now()}@temp.com`,
            resumeData.phone,
            resumeData.education,
            resumeData.experience_years,
            overallScore,
            skillsScore,
            experienceScore,
            educationScore,
            assessmentScore,
            resumeQualityScore,
            coverLetterScore,
            status,
            "Medium",
            "Immediate",
          ],
        );

        const applicantId = applicantResult.rows[0].id;

        if (resumeData.skills && resumeData.skills.length > 0) {
          for (const skill of resumeData.skills) {
            await client.query(
              "INSERT INTO skills (applicant_id, skill_name) VALUES ($1, $2)",
              [applicantId, skill],
            );
          }
        }

        await client.query("COMMIT");

        console.log(
          `✅ Created applicant ID: ${applicantId} with ${resumeData.skills?.length || 0} skills`,
        );

        res.status(201).json({
          success: true,
          data: applicantResult.rows[0],
          extractedData: resumeData,
          message: "Application submitted successfully",
        });
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("❌ Error processing application:", error);
        res.status(500).json({
          success: false,
          error: error.message,
        });
      } finally {
        client.release();
      }
    },
  );
  // ...existing code...
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
  });
});

app.use((err, req, res, next) => {
  console.error("💥 Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 =====================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("🚀 =====================================");
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM signal received: closing HTTP server");
  pool.end(() => {
    console.log("💤 Database pool closed");
    process.exit(0);
  });
});
