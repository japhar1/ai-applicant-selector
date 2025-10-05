import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse'; // FIX: Import correctly
import mammoth from 'mammoth';
import natural from 'natural';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== DATABASE SETUP ====================

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// ==================== MIDDLEWARE ====================

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== FILE UPLOAD SETUP ====================

const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// ==================== DOCUMENT PARSING FUNCTIONS ====================

async function parsePDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer); // FIX: Use pdfParse
  return data.text;
}

async function parseDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function parseTXT(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

async function parseDocument(filePath, mimeType) {
  if (mimeType === 'application/pdf') {
    return await parsePDF(filePath);
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return await parseDOCX(filePath);
  } else if (mimeType === 'application/msword') {
    return await parseDOCX(filePath);
  } else if (mimeType === 'text/plain') {
    return await parseTXT(filePath);
  }
  throw new Error('Unsupported file type');
}

// ==================== EXTRACTION FUNCTIONS ====================

function extractEmail(text) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex);
  return emails ? emails[0] : null;
}

function extractPhone(text) {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex);
  return phones ? phones[0] : null;
}

function extractName(text) {
  // FIX: Better name extraction - skip common headers and look for actual names
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // Skip common resume headers/keywords
  const skipKeywords = [
    'resume', 'cv', 'curriculum vitae', 'results-oriented', 
    'professional', 'experience', 'summary', 'objective',
    'key achievements', 'education', 'skills', 'contact'
  ];
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Skip if it contains skip keywords
    const shouldSkip = skipKeywords.some(keyword => lowerLine.includes(keyword));
    if (shouldSkip) continue;
    
    // Skip if line is too long (likely a description)
    if (line.length > 50) continue;
    
    // Skip if it starts with symbols or numbers
    if (/^[>\-\*\d]/.test(line)) continue;
    
    // Look for pattern: FirstName LastName (2-4 words, capitalized)
    const namePattern = /^[A-Z][a-z]+(?: [A-Z][a-z]+){1,3}$/;
    if (namePattern.test(line)) {
      // Additional check: avoid lines with common title words
      if (!/engineer|developer|specialist|manager|analyst|consultant/i.test(line)) {
        return line;
      }
    }
  }
  
  // Fallback: Look for "Name:" pattern
  const namePatternWithLabel = /(?:name|full name)[:\s]+([A-Z][a-z]+(?: [A-Z][a-z]+){1,3})/i;
  const nameMatch = text.match(namePatternWithLabel);
  if (nameMatch) {
    return nameMatch[1];
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

function extractEducation(text) {
  const educationPatterns = [
    /\b(B\.?Sc\.?|Bachelor|BSc|BA|B\.A\.)\s+(?:of|in|of Science in|of Arts in)?\s*([A-Za-z\s]+)/gi,
    /\b(M\.?Sc\.?|Master|MSc|MA|M\.A\.)\s+(?:of|in|of Science in|of Arts in)?\s*([A-Za-z\s]+)/gi,
    /\b(PhD|Ph\.D\.|Doctorate)\s+(?:of|in)?\s*([A-Za-z\s]+)/gi,
    /\b(HND)\s+(?:in)?\s*([A-Za-z\s]+)/gi
  ];
  
  for (const pattern of educationPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  
  return null;
}

function extractExperience(text) {
  const expPatterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?experience/gi,
    /experience[:\s]+(\d+)\+?\s*years?/gi,
    /(\d+)\+?\s*years?\s+in/gi,
    /over\s+(\d+)\s+years/gi
  ];
  
  for (const pattern of expPatterns) {
    const match = text.match(pattern);
    if (match) {
      return parseFloat(match[1]);
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
  const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
  
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
    'i am writing', 'dear', 'sincerely', 'regards', 'position', 
    'opportunity', 'experience', 'skills', 'qualified'
  ];
  
  const lowerText = text.toLowerCase();
  professionalPhrases.forEach(phrase => {
    if (lowerText.includes(phrase)) toneScore += 2;
  });
  
  return Math.min(Math.round(baseScore + lengthScore + Math.min(toneScore, 25)), 100);
}

// ==================== ROUTES ====================

app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Applicant Selector API',
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      applicants: '/api/applicants',
      statistics: '/api/statistics',
      upload: '/api/upload/complete-application'
    }
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const dbTest = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: dbTest.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

app.get('/api/applicants', async (req, res) => {
  try {
    console.log('📊 Fetching applicants with skills...');
    
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
      count: result.rows.length 
    });
  } catch (error) {
    console.error('❌ Error fetching applicants:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

app.get('/api/applicants/:id', async (req, res) => {
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
        error: 'Applicant not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('❌ Error fetching applicant:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/statistics', async (req, res) => {
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
        avgScore: parseFloat(stats.rows[0].avg_score) || 0
      }
    });
  } catch (error) {
    console.error('❌ Error calculating statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== UPLOAD ENDPOINTS ====================

app.post('/api/upload/resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    console.log(`📄 Processing resume: ${req.file.originalname}`);

    const text = await parseDocument(req.file.path, req.file.mimetype);
    
    const extractedData = {
      name: extractName(text),
      email: extractEmail(text),
      phone: extractPhone(text),
      education: extractEducation(text),
      experience_years: extractExperience(text),
      skills: extractSkills(text),
      resume_quality_score: calculateResumeQuality(text)
    };

    const skillsScore = Math.min((extractedData.skills.length * 10) + 50, 100);
    const experienceScore = extractedData.experience_years 
      ? Math.min((extractedData.experience_years * 15) + 40, 100)
      : 50;
    const educationScore = extractedData.education ? 85 : 50;

    console.log(`✅ Extracted: ${extractedData.name}, ${extractedData.skills.length} skills`);

    res.json({
      success: true,
      data: {
        ...extractedData,
        skillsScore,
        experienceScore,
        educationScore
      },
      message: 'Resume processed successfully'
    });

  } catch (error) {
    console.error('❌ Error processing resume:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/upload/complete-application', 
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'coverLetter', maxCount: 1 }
  ]), 
  async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      let resumeData = {};
      if (req.files['resume']) {
        const resumeFile = req.files['resume'][0];
        const resumeText = await parseDocument(resumeFile.path, resumeFile.mimetype);
        
        resumeData = {
          name: extractName(resumeText),
          email: extractEmail(resumeText),
          phone: extractPhone(resumeText),
          education: extractEducation(resumeText),
          experience_years: extractExperience(resumeText),
          skills: extractSkills(resumeText),
          resume_quality_score: calculateResumeQuality(resumeText)
        };
      }

      let coverLetterScore = 75;
      if (req.files['coverLetter']) {
        const coverFile = req.files['coverLetter'][0];
        const coverText = await parseDocument(coverFile.path, coverFile.mimetype);
        coverLetterScore = analyzeCoverLetter(coverText);
      }

      const skillsScore = Math.min((resumeData.skills?.length * 10) + 50, 100);
      const experienceScore = resumeData.experience_years 
        ? Math.min((resumeData.experience_years * 15) + 40, 100)
        : 50;
      const educationScore = resumeData.education ? 85 : 50;
      const assessmentScore = 80;
      const resumeQualityScore = resumeData.resume_quality_score || 75;

      const overallScore = (
        skillsScore * 0.25 +
        experienceScore * 0.25 +
        educationScore * 0.20 +
        assessmentScore * 0.15 +
        resumeQualityScore * 0.10 +
        coverLetterScore * 0.05
      ).toFixed(2);

      let status = 'Under Review';
      if (overallScore >= 90) status = 'Highly Recommended';
      else if (overallScore >= 80) status = 'Recommended';
      else if (overallScore >= 70) status = 'Consider';

      const applicantResult = await client.query(
        `INSERT INTO applicants (
          full_name, email, phone, education, experience_years,
          overall_score, skills_score, experience_score, education_score,
          assessment_score, resume_quality_score, cover_letter_score,
          status, motivation_level, availability
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          resumeData.name || 'Unknown',
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
          'Medium',
          'Immediate'
        ]
      );

      const applicantId = applicantResult.rows[0].id;

      if (resumeData.skills && resumeData.skills.length > 0) {
        for (const skill of resumeData.skills) {
          await client.query(
            'INSERT INTO skills (applicant_id, skill_name) VALUES ($1, $2)',
            [applicantId, skill]
          );
        }
      }

      await client.query('COMMIT');

      console.log(`✅ Created applicant ID: ${applicantId} with ${resumeData.skills?.length || 0} skills`);

      res.status(201).json({
        success: true,
        data: applicantResult.rows[0],
        extractedData: resumeData,
        message: 'Application submitted successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error processing application:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    } finally {
      client.release();
    }
  }
);

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found',
    path: req.path
  });
});

app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: err.message 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 =====================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🚀 =====================================');
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('💤 Database pool closed');
    process.exit(0);
  });
});