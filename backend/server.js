import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import { upload } from './middleware/upload.js';
import { 
  parseDocument, 
  extractEmail, 
  extractName, 
  extractPhone,
  extractSkills,
  extractEducation,
  extractExperience,
  calculateResumeQuality,
  analyzeCoverLetter
} from './utils/documentParser.js';

// Upload and process resume
app.post('/api/upload/resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    console.log(`📄 Processing resume: ${req.file.originalname}`);

    // Parse document
    const text = await parseDocument(req.file.path, req.file.mimetype);
    
    // Extract information
    const extractedData = {
      name: extractName(text),
      email: extractEmail(text),
      phone: extractPhone(text),
      education: extractEducation(text),
      experience_years: extractExperience(text),
      skills: extractSkills(text),
      resume_quality_score: calculateResumeQuality(text),
      raw_text: text.substring(0, 1000) // First 1000 chars for reference
    };

    // Calculate scores (simplified for now)
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
        educationScore,
        file: {
          originalname: req.file.originalname,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
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

// Upload and process cover letter
app.post('/api/upload/cover-letter', upload.single('coverLetter'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    console.log(`📝 Processing cover letter: ${req.file.originalname}`);

    const text = await parseDocument(req.file.path, req.file.mimetype);
    const coverLetterScore = analyzeCoverLetter(text);

    console.log(`✅ Cover letter analyzed, score: ${coverLetterScore}`);

    res.json({
      success: true,
      data: {
        coverLetterScore,
        wordCount: text.split(/\s+/).length,
        raw_text: text.substring(0, 500),
        file: {
          originalname: req.file.originalname,
          filename: req.file.filename,
          size: req.file.size
        }
      },
      message: 'Cover letter processed successfully'
    });

  } catch (error) {
    console.error('❌ Error processing cover letter:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Complete application upload (resume + cover letter + create applicant)
app.post('/api/upload/complete-application', 
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'coverLetter', maxCount: 1 }
  ]), 
  async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Process resume
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

      // Process cover letter
      let coverLetterScore = 75; // default
      if (req.files['coverLetter']) {
        const coverFile = req.files['coverLetter'][0];
        const coverText = await parseDocument(coverFile.path, coverFile.mimetype);
        coverLetterScore = analyzeCoverLetter(coverText);
      }

      // Calculate scores
      const skillsScore = Math.min((resumeData.skills?.length * 10) + 50, 100);
      const experienceScore = resumeData.experience_years 
        ? Math.min((resumeData.experience_years * 15) + 40, 100)
        : 50;
      const educationScore = resumeData.education ? 85 : 50;
      const assessmentScore = 80; // Default - would come from actual assessment
      const resumeQualityScore = resumeData.resume_quality_score || 75;

      // Calculate overall score
      const overallScore = (
        skillsScore * 0.25 +
        experienceScore * 0.25 +
        educationScore * 0.20 +
        assessmentScore * 0.15 +
        resumeQualityScore * 0.10 +
        coverLetterScore * 0.05
      ).toFixed(2);

      // Determine status
      let status = 'Under Review';
      if (overallScore >= 90) status = 'Highly Recommended';
      else if (overallScore >= 80) status = 'Recommended';
      else if (overallScore >= 70) status = 'Consider';

      // Insert applicant
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
          resumeData.email || 'noemail@example.com',
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
          'Medium', // default
          'Immediate' // default
        ]
      );

      const applicantId = applicantResult.rows[0].id;

      // Insert skills
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection with error handling
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// CORS - Allow all origins for demo
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add explicit OPTIONS handler
app.options('*', cors());

// Body parser
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== ROUTES ====================

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Applicant Selector API',
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      applicants: '/api/applicants',
      statistics: '/api/statistics'
    }
  });
});

// Health check endpoint
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

// Get all applicants with skills (OPTIMIZED with SQL JOIN)
app.get('/api/applicants', async (req, res) => {
  try {
    console.log('📊 Fetching applicants with skills...');
    
    const result = await pool.query(`
      SELECT 
        a.id,
        a.full_name,
        a.email,
        a.phone,
        a.education,
        a.experience_years,
        a.overall_score,
        a.skills_score,
        a.experience_score,
        a.education_score,
        a.assessment_score,
        a.resume_quality_score,
        a.cover_letter_score,
        a.status,
        a.motivation_level,
        a.availability,
        a.created_at,
        a.updated_at,
        COALESCE(
          json_agg(
            s.skill_name
          ) FILTER (WHERE s.skill_name IS NOT NULL),
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

// Get single applicant by ID with skills
app.get('/api/applicants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Fetching applicant ID: ${id}`);
    
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
    
    console.log(`✅ Found applicant: ${result.rows[0].full_name}`);
    
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

// Search applicants
app.get('/api/applicants/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        success: false, 
        error: 'Search query (q) is required' 
      });
    }
    
    console.log(`🔍 Searching for: ${q}`);
    
    const result = await pool.query(`
      SELECT 
        a.*,
        COALESCE(
          json_agg(s.skill_name) FILTER (WHERE s.skill_name IS NOT NULL),
          '[]'
        ) as skills
      FROM applicants a
      LEFT JOIN skills s ON a.id = s.applicant_id
      WHERE 
        a.full_name ILIKE $1 OR
        a.email ILIKE $1 OR
        a.education ILIKE $1
      GROUP BY a.id
      ORDER BY a.overall_score DESC
    `, [`%${q}%`]);
    
    console.log(`✅ Found ${result.rows.length} matching applicants`);
    
    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length,
      query: q
    });
  } catch (error) {
    console.error('❌ Error searching applicants:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Filter by status
app.get('/api/applicants/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    console.log(`🎯 Filtering by status: ${status}`);
    
    const result = await pool.query(`
      SELECT 
        a.*,
        COALESCE(
          json_agg(s.skill_name) FILTER (WHERE s.skill_name IS NOT NULL),
          '[]'
        ) as skills
      FROM applicants a
      LEFT JOIN skills s ON a.id = s.applicant_id
      WHERE a.status = $1
      GROUP BY a.id
      ORDER BY a.overall_score DESC
    `, [status]);
    
    console.log(`✅ Found ${result.rows.length} applicants with status: ${status}`);
    
    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length,
      status: status
    });
  } catch (error) {
    console.error('❌ Error filtering applicants:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get statistics
app.get('/api/statistics', async (req, res) => {
  try {
    console.log('📈 Calculating statistics...');
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Highly Recommended') as highly_recommended,
        COUNT(*) FILTER (WHERE status = 'Recommended') as recommended,
        COUNT(*) FILTER (WHERE status = 'Consider') as consider,
        ROUND(AVG(overall_score)::numeric, 2) as avg_score,
        ROUND(AVG(skills_score)::numeric, 2) as avg_skills_score,
        ROUND(AVG(experience_score)::numeric, 2) as avg_experience_score,
        ROUND(AVG(education_score)::numeric, 2) as avg_education_score,
        ROUND(AVG(assessment_score)::numeric, 2) as avg_assessment_score
      FROM applicants
    `);
    
    console.log('✅ Statistics calculated');
    
    res.json({
      success: true,
      data: {
        total: parseInt(stats.rows[0].total),
        highlyRecommended: parseInt(stats.rows[0].highly_recommended),
        recommended: parseInt(stats.rows[0].recommended),
        consider: parseInt(stats.rows[0].consider),
        avgScore: parseFloat(stats.rows[0].avg_score) || 0,
        avgSkillsScore: parseFloat(stats.rows[0].avg_skills_score) || 0,
        avgExperienceScore: parseFloat(stats.rows[0].avg_experience_score) || 0,
        avgEducationScore: parseFloat(stats.rows[0].avg_education_score) || 0,
        avgAssessmentScore: parseFloat(stats.rows[0].avg_assessment_score) || 0
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

// Create new applicant
app.post('/api/applicants', async (req, res) => {
  try {
    const { 
      full_name, 
      email, 
      phone,
      education, 
      experience_years, 
      overall_score,
      skills_score,
      experience_score,
      education_score,
      assessment_score,
      resume_quality_score,
      cover_letter_score,
      status,
      motivation_level,
      availability,
      skills
    } = req.body;
    
    // Validate required fields
    if (!full_name || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'full_name and email are required' 
      });
    }
    
    console.log(`➕ Creating new applicant: ${full_name}`);
    
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert applicant
      const applicantResult = await client.query(
        `INSERT INTO applicants (
          full_name, email, phone, education, experience_years,
          overall_score, skills_score, experience_score, education_score,
          assessment_score, resume_quality_score, cover_letter_score,
          status, motivation_level, availability
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          full_name, email, phone, education, experience_years,
          overall_score, skills_score, experience_score, education_score,
          assessment_score, resume_quality_score, cover_letter_score,
          status, motivation_level, availability
        ]
      );
      
      const applicantId = applicantResult.rows[0].id;
      
      // Insert skills if provided
      if (skills && Array.isArray(skills) && skills.length > 0) {
        for (const skill of skills) {
          await client.query(
            'INSERT INTO skills (applicant_id, skill_name) VALUES ($1, $2)',
            [applicantId, skill]
          );
        }
      }
      
      await client.query('COMMIT');
      
      console.log(`✅ Created applicant ID: ${applicantId}`);
      
      res.status(201).json({ 
        success: true, 
        data: applicantResult.rows[0],
        message: 'Applicant created successfully'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error creating applicant:', error);
    
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ 
        success: false, 
        error: 'Email already exists' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
});

// Update applicant status
app.patch('/api/applicants/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        error: 'status is required' 
      });
    }
    
    console.log(`🔄 Updating applicant ${id} status to: ${status}`);
    
    const result = await pool.query(
      `UPDATE applicants 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Applicant not found' 
      });
    }
    
    console.log(`✅ Updated applicant status`);
    
    res.json({ 
      success: true, 
      data: result.rows[0],
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update applicant (full update)
app.put('/api/applicants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log(`🔄 Updating applicant ${id}`);
    
    // Build dynamic update query
    const fields = Object.keys(updates).filter(key => key !== 'skills');
    const values = fields.map(field => updates[field]);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    if (fields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No fields to update' 
      });
    }
    
    const result = await pool.query(
      `UPDATE applicants 
       SET ${setClause}, updated_at = NOW() 
       WHERE id = $${fields.length + 1} 
       RETURNING *`,
      [...values, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Applicant not found' 
      });
    }
    
    console.log(`✅ Updated applicant`);
    
    res.json({ 
      success: true, 
      data: result.rows[0],
      message: 'Applicant updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating applicant:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete applicant
app.delete('/api/applicants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting applicant ${id}`);
    
    const result = await pool.query(
      'DELETE FROM applicants WHERE id = $1 RETURNING full_name',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Applicant not found' 
      });
    }
    
    console.log(`✅ Deleted applicant: ${result.rows[0].full_name}`);
    
    res.json({ 
      success: true,
      message: `Applicant ${result.rows[0].full_name} deleted successfully`
    });
  } catch (error) {
    console.error('❌ Error deleting applicant:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all skills (useful for filters)
app.get('/api/skills', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT skill_name, COUNT(*) as count
      FROM skills
      GROUP BY skill_name
      ORDER BY count DESC, skill_name ASC
    `);
    
    res.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    console.error('❌ Error fetching skills:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 =====================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Database: ${process.env.DATABASE_URL ? '✅ Configured' : '❌ Not configured'}`);
  console.log('🚀 =====================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('💤 Database pool closed');
    process.exit(0);
  });
});