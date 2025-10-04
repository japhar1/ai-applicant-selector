import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Temporary fix for demo
app.use(cors({
  origin: '*', // Allow all origins (only for demo/testing!)
  credentials: true
}));

// CORS - MUST come before routes
/*
app.use(cors({
  origin: [
    'https://ai-applicant-selector.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
*/

// Middleware
app.use(express.json());

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully!');
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Applicant Selector API',
    status: 'online',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Search applicants
app.get('/api/applicants/search', async (req, res) => {
  try {
    const { q } = req.query;
    const result = await pool.query(
      `SELECT * FROM applicants 
       WHERE full_name ILIKE $1 
       OR email ILIKE $1 
       ORDER BY overall_score DESC`,
      [`%${q}%`]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Filter by status
app.get('/api/applicants/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const result = await pool.query(
      'SELECT * FROM applicants WHERE status = $1 ORDER BY overall_score DESC',
      [status]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get statistics
app.get('/api/statistics', async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM applicants');
    const highlyRec = await pool.query(
      "SELECT COUNT(*) FROM applicants WHERE status = 'Highly Recommended'"
    );
    const recommended = await pool.query(
      "SELECT COUNT(*) FROM applicants WHERE status = 'Recommended'"
    );
    const avgScore = await pool.query(
      'SELECT AVG(overall_score) as avg FROM applicants'
    );

    res.json({
      success: true,
      data: {
        total: parseInt(total.rows[0].count),
        highlyRecommended: parseInt(highlyRec.rows[0].count),
        recommended: parseInt(recommended.rows[0].count),
        avgScore: Math.round(parseFloat(avgScore.rows[0].avg))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new applicant
app.post('/api/applicants', async (req, res) => {
  try {
    const { full_name, email, education, experience_years, status } = req.body;
    
    const result = await pool.query(
      `INSERT INTO applicants (full_name, email, education, experience_years, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [full_name, email, education, experience_years, status]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update applicant status
app.patch('/api/applicants/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(
      'UPDATE applicants SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Applicant not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Example: Get all applicants
app.get('/api/applicants', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM applicants ORDER BY overall_score DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Example: Get single applicant
app.get('/api/applicants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM applicants WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Applicant not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching applicant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});