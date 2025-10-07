// ----- Imports -----
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import multer from "multer";
import path from "path";
import fs from "fs";
import mammoth from "mammoth";
import axios from "axios"; // --- ADDED: import axios for NLP microservice

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// ----- Database Setup -----
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
  })
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
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
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
    cb(new Error("Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed."), false);
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
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return await parseDOCX(filePath);
  } else if (mimeType === "text/plain") {
    return await parseTXT(filePath);
  }
  throw new Error("Unsupported file type");
}

// ==================== IMPROVED EXTRACTION FUNCTIONS ====================

// Helper: Call Python NLP Service for Semantic Skills
async function getSemanticSkills(resumeText, skillsList) {
  try {
    const response = await axios.post("ai-applicant-selector-production-9af5.up.railway.app/parse_resume/", {
      text: resumeText,
      skills: skillsList,
    });
    console.log("DEBUG: Semantic skills from Python:", response.data.skills);
    return response.data.skills || [];
  } catch (error) {
    console.error("❌ Error calling NLP service:", error.message);
    return [];
  }
}

function extractName(text) {
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

  const skipWords = [
    "resume", "cv", "curriculum", "vitae", "results", "oriented",
    "professional", "experience", "summary", "objective", "profile",
    "headline", "contact", "about", "technical", "support", "engineer",
    "developer", "manager", "specialist", "analyst", "consultant",
    "coordinator", "administrator", "director", "senior", "junior",
    "lead", "principal", "staff", "associate", "key", "achievements",
    "education", "skills", "work", "employment",
  ];

  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i];
    if (line.length > 60) continue;
    if (/^[>\-\*\d•\[\(]/.test(line)) continue;

    const lowerLine = line.toLowerCase();
    if (skipWords.some((word) => lowerLine.includes(word))) continue;

    const namePattern = /^([A-Z][a-z]+(?:['\-][A-Z][a-z]+)?|[A-Z]\.?)\s+([A-Z][a-z]+(?:['\-][A-Z][a-z]+)?|[A-Z]\.?)(?:\s+([A-Z][a-z]+(?:['\-][A-Z][a-z]+)?|[A-Z]\.))?(?:\s+([A-Z][a-z]+(?:['\-][A-Z][a-z]+)?|[A-Z]\.))?$/;

    if (namePattern.test(line)) {
      if (line !== line.toUpperCase() && line.length >= 5 && line.length <= 50) {
        return line;
      }
    }
  }

  const nameWithLabelPattern = /(?:name|full\s+name|applicant)[:\s]+([A-Z][a-z]+(?:['\-\s][A-Z][a-z]+){1,3})/i;
  const labelMatch = text.match(nameWithLabelPattern);
  if (labelMatch) {
    return labelMatch[1].trim();
  }

  return null;
}

function extractEmail(text) {
  const emailRegex = /\b[A-Za-z0-9](?:[A-Za-z0-9._-]{0,63})[A-Za-z0-9]@[A-Za-z0-9](?:[A-Za-z0-9.-]{0,253})[A-Za-z0-9]\.[A-Za-z]{2,}\b/g;
  const emails = text.match(emailRegex);

  if (!emails) return null;

  const validEmails = emails.filter((email) => {
    const lower = email.toLowerCase();
    return !lower.includes("example.com") && !lower.includes("test.com") &&
           !lower.includes("sample.com") && !lower.includes("dummy.com");
  });

  return validEmails.length > 0 ? validEmails[0] : null;
}

function extractPhone(text) {
  const phonePatterns = [
    /\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}/g,
    /\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
  ];

  for (const pattern of phonePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      const validPhones = matches.filter((phone) => {
        const digits = phone.replace(/\D/g, "");
        return digits.length >= 10 && digits.length <= 15;
      });

      if (validPhones.length > 0) {
        return validPhones[0];
      }
    }
  }

  return null;
}

function extractEducation(text) {
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

  const flexiblePatterns = [
    /\b(Bachelor(?:'s)?|B\.?Sc\.?|BSc|BA|B\.?A\.?)\s*[,\-:]?\s*([A-Za-z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|$)/i,
    /\b(Master(?:'s)?|M\.?Sc\.?|MSc|MA|M\.?A\.?)\s*[,\-:]?\s*([A-Za-z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|$)/i,
    /\b(PhD|Ph\.?D\.?|Doctorate)\s*[,\-:]?\s*([A-Za-z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|$)/i,
    /\b(HND|Diploma)\s*[,\-:]?\s*([A-Za-z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|$)/i,
  ];

  for (const line of lines) {
    for (const pattern of flexiblePatterns) {
      const match = line.match(pattern);
      if (match) {
        const degree = match[1].trim();
        let field = match[2] ? match[2].trim() : "";
        field = field.replace(/\s+(from|at|in|of|with|and|the|university|college|institute).*$/i, "");
        
        if (field.length > 3 && field.length < 50 && /^[A-Za-z\s&]+$/.test(field)) {
          return `${normalizeDegree(degree)} ${field}`;
        } else if (field.length >= 3) {
          return normalizeDegree(degree);
        }
      }
    }
  }

  const simpleDegreePattern = /\b(Bachelor(?:'s)?|B\.?Sc\.?|BSc|BA|B\.?A\.?|Master(?:'s)?|M\.?Sc\.?|MSc|MA|M\.?A\.?|PhD|Ph\.?D\.?|HND|Diploma)\b/i;
  const simpleMatch = text.match(simpleDegreePattern);
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
  const explicitPatterns = [
    /\b(?:over|more than|approximately|about)?\s*(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+)?experience\b/i,
    /\bexperience[:\s]+(?:over|more than|approximately|about)?\s*(\d{1,2})\+?\s*(?:years?|yrs?)\b/i,
    /\b(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+)?(?:work\s+)?experience\b/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = text.match(pattern);
    if (match) {
      const years = parseInt(match[1]);
      if (years >= 0 && years <= 50) {
        return years;
      }
    }
  }

  const experienceYears = calculateExperienceFromDates(text);
  if (experienceYears !== null && experienceYears >= 0 && experienceYears <= 50) {
    return experienceYears;
  }

  const workedPattern = /\b(?:worked|employed)\s+for\s+(?:over|about|approximately)?\s*(\d{1,2})\+?\s*(?:years?|yrs?)\b/i;
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
        startYear = parseInt(match[2]);
        endYear = match[4].match(/\d{4}/) ? parseInt(match[4]) : currentYear;
      } else {
        startYear = parseInt(match[1]);
        endYear = match[2].match(/\d{4}/) ? parseInt(match[2]) : currentYear;
      }

      if (startYear >= 1970 && startYear <= currentYear && 
          endYear >= startYear && endYear <= currentYear + 1) {
        totalMonths += (endYear - startYear) * 12;
      }
    }
  }

  if (totalMonths > 0) {
    const years = Math.round(totalMonths / 12);
    return years >= 0 && years <= 50 ? years : null;
  }

  return null;
}

function extractSkills(text) {
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
    'TypeScript', 'Swift', 'Kotlin', 'Dart', 'Scala', 'R', 'PowerShell',
    'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask',
    'Spring Boot', 'Laravel', 'HTML', 'CSS', 'SASS', 'Tailwind CSS',
    'React Native', 'Flutter', 'Android', 'iOS',
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SharePoint',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD',
    'Terraform', 'DevOps', 'Linux', 'Git', 'Active Directory', 'Exchange',
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
    'Pandas', 'NumPy', 'Data Analysis', 'Data Science', 'NLP',
    'Agile', 'Scrum', 'REST API', 'GraphQL', 'Microservices',
    'Blockchain', 'Web3', 'Solidity', 'Cybersecurity', 'Ethical Hacking',
    'Office 365', 'Microsoft 365', 'M365', 'Teams', 'OneDrive', 'BitLocker',
    'Windows Server', 'Networking', 'AVAYA'
  ];
  
  const foundSkills = new Set();
  const lowerText = text.toLowerCase();
  
  commonSkills.forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  });
  
  return Array.from(foundSkills);
}

function calculateResumeQuality(text) {
  let score = 0;
  const wordCount = text.split(/\s+/).length;
  
  if (wordCount >= 500 && wordCount <= 2000) score += 30;
  else if (wordCount >= 300 && wordCount < 500) score += 20;
  else if (wordCount > 2000 && wordCount <= 3000) score += 20;
  
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
  const analyzer = new natural.SentimentAnalyzer("English", natural.PorterStemmer, "afinn");
  
  const tokens = tokenizer.tokenize(text);
  const sentiment = analyzer.getSentiment(tokens);
  const baseScore = ((sentiment + 5) / 10) * 50 + 25;
  
  const wordCount = text.split(/\s+/).length;
  let lengthScore = 0;
  if (wordCount >= 200 && wordCount <= 500) lengthScore = 25;
  else if (wordCount >= 100 && wordCount < 200) lengthScore = 15;
  else if (wordCount > 500 && wordCount <= 700) lengthScore = 15;
  
  let toneScore = 0;
  const professionalPhrases = [
    "i am writing", "dear", "sincerely", "regards", "position",
    "opportunity", "experience", "skills", "qualified",
  ];
  
  const lowerText = text.toLowerCase();
  professionalPhrases.forEach((phrase) => {
    if (lowerText.includes(phrase)) toneScore += 2;
  });
  
  return Math.min(Math.round(baseScore + lengthScore + Math.min(toneScore, 25)), 100);
}

// ----- Improved extractName -----
function extractName(text) {
  // Try strict, then fallback to first non-header, non-email
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const skipWords = [
    "resume", "cv", "curriculum", "vitae", "results", "contact", "profile",
    "summary", "objective", "experience", "skills", "education"
  ];
  for (let line of lines.slice(0, 20)) {
    if (line.length < 3 || skipWords.some(w => line.toLowerCase().includes(w))) continue;
    if (/^[a-z\d]/i.test(line) && !/@/.test(line)) return line;
  }
  return "Unknown";
}

// ----- Improved extractExperience -----
function extractExperience(text) {
  // Pattern for explicit experience
  let years = null;
  const match = text.match(/(\d{1,2})\s*(?:years|yrs)[^.\d]{0,20}(?:experience|exp)?/i);
  if (match) {
    years = parseInt(match[1]);
    if (years > 0 && years < 35) return years;
  }
  // Range between first and last year (simple fallback)
  const dates = [...text.matchAll(/(19|20)\d{2}/g)].map(m => parseInt(m[0]));
  if (dates.length >= 2) {
    const expEstimate = Math.abs(Math.max(...dates) - Math.min(...dates));
    if (expEstimate > 0 && expEstimate < 35) return expEstimate;
  }
  return 0;
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
});

app.get("/api/health", async (req, res) => {
  try {
    const dbTest = await pool.query("SELECT NOW()");
    res.json({
      status: "healthy",
      database: "connected",
      timestamp: dbTest.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
    });
  }
});

app.get("/api/applicants", async (req, res) => {
  try {
    console.log("📊 Fetching applicants with skills...");
    
    const result = await pool.query(`
      SELECT 
        a.id, a.full_name, a.email, a.phone, a.education, a.experience_years,
        a.overall_score, a.skills_score, a.experience_score, a.education_score,
        a.assessment_score, a.resume_quality_score, a.cover_letter_score,
        a.status, a.motivation_level, a.availability, a.created_at, a.updated_at,
        COALESCE(
          json_agg(s.skill_name) FILTER (WHERE s.skill_name IS NOT NULL),
          '[]'
        ) as skills
      FROM applicants a
      LEFT JOIN skills s ON a.id = s.applicant_id
      GROUP BY a.id
      ORDER BY a.overall_score DESC
    `);
    
    console.log(`✅ Found ${result.rows.length} applicants`);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("❌ Error fetching applicants:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/applicants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
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
    `, [id]);
    
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
        const resumeText = await parseDocument(resumeFile.path, resumeFile.mimetype);

        // --- Use a robust semantic skills list (expand as you wish)
        const semanticSkillsList = [
          "Python", "Machine Learning", "Data Science", "React", "AWS", "DevOps",
          "Cybersecurity", "NLP", "Docker", "SQL", "Spring Boot", "TensorFlow"
        ];

        resumeData = {
          name: extractName(resumeText),
          email: extractEmail(resumeText),
          phone: extractPhone(resumeText),
          education: extractEducation(resumeText),
          experience_years: extractExperience(resumeText),
          skills: await getSemanticSkills(resumeText, semanticSkillsList),
          resume_quality_score: calculateResumeQuality(resumeText),
        };
        console.log("DEBUG: Resume extracted data:", resumeData);
      }
      
      // --- Add your logic for cover letter, scoring, and saving to DB (as before) ---

      let coverLetterScore = 75;
      if (req.files["coverLetter"]) {
        const coverFile = req.files["coverLetter"][0];
        const coverText = await parseDocument(coverFile.path, coverFile.mimetype);
        coverLetterScore = analyzeCoverLetter(coverText);
      }

      const skillsScore = Math.min((resumeData.skills?.length || 0) * 10 + 50, 100);
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
          "Medium",      // motivation_level
          "Immediate"    // availability
        ]
      );

      const applicantId = applicantResult.rows[0].id;
      // Skills insert (if any)
      if (resumeData.skills && resumeData.skills.length > 0) {
        for (const skill of resumeData.skills) {
          await client.query(
            "INSERT INTO skills (applicant_id, skill_name) VALUES ($1, $2)",
            [applicantId, skill]
          );
        }
      }

      await client.query("COMMIT");
      console.log(`✅ Created applicant ID: ${applicantId} with ${resumeData.skills?.length || 0} skills`);

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
  }
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
  });
});

// Error handler
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