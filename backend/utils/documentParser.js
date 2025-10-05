import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import natural from 'natural';
import compromise from 'compromise';

// Extract text from PDF
async function parsePDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

// Extract text from DOCX
async function parseDOCX(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new Error(`DOCX parsing failed: ${error.message}`);
  }
}

// Extract text from TXT
async function parseTXT(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`TXT parsing failed: ${error.message}`);
  }
}

// Main parser function
export async function parseDocument(filePath, mimeType) {
  let text = '';
  
  if (mimeType === 'application/pdf') {
    text = await parsePDF(filePath);
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    text = await parseDOCX(filePath);
  } else if (mimeType === 'application/msword') {
    text = await parseDOCX(filePath);
  } else if (mimeType === 'text/plain') {
    text = await parseTXT(filePath);
  } else {
    throw new Error('Unsupported file type');
  }
  
  return text;
}

// Extract email from text
export function extractEmail(text) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex);
  return emails ? emails[0] : null;
}

// Extract phone number
export function extractPhone(text) {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex);
  return phones ? phones[0] : null;
}

// Extract name (simple heuristic - first line or after "Name:")
export function extractName(text) {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Look for "Name:" pattern
  const namePattern = /name[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i;
  const nameMatch = text.match(namePattern);
  if (nameMatch) {
    return nameMatch[1];
  }
  
  // Otherwise, assume first line with capital letters
  for (const line of lines) {
    if (/^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line.trim())) {
      return line.trim();
    }
  }
  
  return null;
}

// Extract skills using NLP
export function extractSkills(text) {
  const commonSkills = [
    // Programming Languages
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
    'TypeScript', 'Swift', 'Kotlin', 'Dart', 'Scala', 'R', 'MATLAB',
    
    // Web Technologies
    'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask',
    'Spring Boot', 'Laravel', 'HTML', 'CSS', 'SASS', 'Tailwind CSS',
    
    // Mobile
    'React Native', 'Flutter', 'Android', 'iOS', 'Swift', 'Kotlin',
    
    // Databases
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQLite',
    'DynamoDB', 'Cassandra', 'Elasticsearch',
    
    // Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD',
    'Terraform', 'Ansible', 'DevOps', 'Linux', 'Git',
    
    // Data Science & AI
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn',
    'Pandas', 'NumPy', 'Data Analysis', 'Data Science', 'NLP', 'Computer Vision',
    
    // Other
    'Agile', 'Scrum', 'REST API', 'GraphQL', 'Microservices', 'Testing',
    'Unit Testing', 'Integration Testing', 'Security', 'Blockchain', 'Web3'
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

// Extract education
export function extractEducation(text) {
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

// Extract years of experience
export function extractExperience(text) {
  const expPatterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?experience/gi,
    /experience[:\s]+(\d+)\+?\s*years?/gi,
    /(\d+)\+?\s*years?\s+in/gi
  ];
  
  for (const pattern of expPatterns) {
    const match = text.match(pattern);
    if (match) {
      return parseFloat(match[1]);
    }
  }
  
  return null;
}

// Calculate resume quality score
export function calculateResumeQuality(text) {
  let score = 0;
  
  // Length check (500-2000 words is ideal)
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 500 && wordCount <= 2000) {
    score += 30;
  } else if (wordCount >= 300 && wordCount < 500) {
    score += 20;
  } else if (wordCount > 2000 && wordCount <= 3000) {
    score += 20;
  }
  
  // Has contact information
  if (extractEmail(text)) score += 15;
  if (extractPhone(text)) score += 10;
  
  // Has education section
  if (extractEducation(text)) score += 15;
  
  // Has experience mentioned
  if (extractExperience(text)) score += 15;
  
  // Has skills
  const skills = extractSkills(text);
  if (skills.length > 0) score += 15;
  
  return Math.min(score, 100);
}

// Sentiment analysis for cover letter
export function analyzeCoverLetter(text) {
  const tokenizer = new natural.WordTokenizer();
  const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
  
  const tokens = tokenizer.tokenize(text);
  const sentiment = analyzer.getSentiment(tokens);
  
  // Convert sentiment (-5 to 5) to score (0 to 100)
  // Positive sentiment = higher score
  const baseScore = ((sentiment + 5) / 10) * 50 + 25;
  
  // Length check
  const wordCount = text.split(/\s+/).length;
  let lengthScore = 0;
  if (wordCount >= 200 && wordCount <= 500) {
    lengthScore = 25;
  } else if (wordCount >= 100 && wordCount < 200) {
    lengthScore = 15;
  } else if (wordCount > 500 && wordCount <= 700) {
    lengthScore = 15;
  }
  
  // Professional tone (check for common phrases)
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