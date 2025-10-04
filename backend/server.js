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

// Middleware
app.use(cors({
  origin: 'https://ai-applicant-selector.vercel.app',
  credentials: true
}));
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