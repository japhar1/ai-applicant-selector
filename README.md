# 🚀 PLP AI Applicant Selector

> **Intelligent Candidate Screening Platform** - AI-powered resume analysis and candidate evaluation system for Lagos State Employment Trust Fund (LSETF) and Power Learn Project (PLP)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-purple)](https://web.dev/progressive-web-apps/)

## 📱 Live Demo

- **Frontend**: [https://plp-ai-applicant-selector.vercel.app](https://plp-ai-applicant-selector.vercel.app)
- **API Backend**: [https://plp-ai-applicant-selector.onrender.com](https://plp-ai-applicant-selector.onrender.com)
- **Health Check**: [/api/health](https://plp-ai-applicant-selector.onrender.com/api/health)

## ✨ Features

### 🤖 **AI-Powered Analysis**
- Intelligent resume parsing and candidate evaluation
- Skills extraction and matching algorithms
- Automated scoring and ranking system
- Natural language processing for job descriptions

### 📊 **Advanced Analytics Dashboard**
- Real-time candidate statistics and metrics
- Interactive charts and data visualizations
- Performance tracking and trend analysis
- Exportable reports (PDF, Excel, CSV)

### 👥 **Comprehensive User Management**
- Role-based access control (5 hierarchical roles)
- 51 granular permissions system
- Activity monitoring and audit trails
- Bulk operations and user import/export

### 📱 **Progressive Web App (PWA)**
- **Mobile-first design** with touch-optimized interface
- **Offline functionality** with background sync
- **Installable app** experience on all devices
- **Push notifications** ready infrastructure
- **File upload** with drag & drop support

### 🔐 **Enterprise Security**
- JWT-based authentication system
- Session management and timeout controls
- Audit logs for compliance tracking
- Secure file upload and storage

## 🏗 Architecture

### **Frontend Stack**
- **Framework**: React 18.2 with Vite
- **Styling**: Tailwind CSS + Custom mobile-first CSS
- **State Management**: React Context + Hooks
- **Charts**: Chart.js with React wrapper
- **PWA**: Service Worker + Web App Manifest
- **Mobile**: Native HTML5 drag & drop, touch optimizations

### **Backend Stack**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Authentication**: JWT tokens
- **File Processing**: Multer for file uploads
- **Data Storage**: JSON-based candidate storage
- **API**: RESTful endpoints with comprehensive CRUD operations

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- Git for version control

### **1. Clone Repository**
```bash
git clone https://github.com/dev-orochi/plp-ai-applicant-selector.git
cd plp-ai-applicant-selector
```

### **2. Backend Setup**
```bash
cd backend
npm install
node server.js
```
Server runs on `http://localhost:8080`

### **3. Frontend Setup**
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

### **4. Access Application**
- **Web App**: http://localhost:5173
- **API Docs**: http://localhost:8080/api/health

## 📋 Available Scripts

### **Frontend Commands**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### **Backend Commands**
```bash
node server.js              # Start backend server
node generate-passwords.js  # Generate user passwords
node test-sample.js         # Run API tests
```

## 🌐 Deployment

### **🎯 Vercel (Frontend) - Automatic Deployment**

1. **Push to GitHub** (triggers automatic deployment):
```bash
git add .
git commit -m "Deploy PWA application"
git push origin main
```

2. **Vercel Configuration** (already included):
   - `vercel.json` configured for React Router
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node.js 18+ runtime

3. **Environment Variables** (set in Vercel dashboard):
```env
VITE_API_BASE_URL=https://your-backend.render.com/api
VITE_APP_ENV=production
```

### **🎯 Render (Backend) - Automatic Deployment**

1. **Connect GitHub Repository** in Render dashboard

2. **Build Configuration**:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Environment**: Node.js

3. **Environment Variables** (set in Render dashboard):
```env
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://your-app.vercel.app
```

### **📋 Deployment Checklist**

#### **Pre-Deployment**
- [ ] All tests passing locally
- [ ] PWA manifest and service worker tested
- [ ] Environment variables configured
- [ ] Build process working (`npm run build`)

#### **Post-Deployment**
- [ ] HTTPS enabled (required for PWA)
- [ ] Service worker registering correctly
- [ ] PWA install banner working
- [ ] Mobile responsiveness verified
- [ ] API endpoints accessible
- [ ] File uploads functioning
- [ ] Authentication flow working

## 🔧 Environment Configuration

### **Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0
```

### **Backend Environment**
```env
NODE_ENV=development
PORT=8080
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-jwt-secret-here
```

## 📱 PWA Features

### **Installation**
- Users can install the app from any modern browser
- Add to Home Screen on mobile devices
- Standalone app experience without browser UI

### **Offline Capabilities**
- View previously loaded candidate data
- Queue file uploads for when connection returns
- Custom offline page with retry functionality

### **Mobile Optimizations**
- Touch-friendly 44px minimum button sizes
- Swipe gestures and mobile navigation
- iOS safe area support (notch compatibility)
- Android adaptive icons

## 🔑 Default User Accounts

### **Super Admin (LSETF Admin)**
- **Email**: admin@lsetf.gov.ng
- **Role**: Full system access
- **Permissions**: All 51 permissions

### **PLP Admin**
- **Email**: admin@plp.org
- **Role**: Program administration
- **Permissions**: Program management + user oversight

### **HR Manager**
- **Email**: hr@lsetf.gov.ng
- **Role**: Recruitment management
- **Permissions**: Candidate and user management

### **Recruiter**
- **Email**: recruiter@lsetf.gov.ng
- **Role**: Daily recruitment tasks
- **Permissions**: Candidate operations

### **Viewer**
- **Email**: viewer@lsetf.gov.ng
- **Role**: Read-only access
- **Permissions**: View-only access to data

*Passwords generated using `node generate-passwords.js`*

## 📊 API Documentation

### **Authentication Endpoints**
```
POST /api/login          # User authentication
POST /api/logout         # User logout
GET  /api/profile        # Get user profile
```

### **Candidate Management**
```
POST /api/upload         # Upload resume files
GET  /api/candidates     # List all candidates
GET  /api/candidates/:id # Get specific candidate
PUT  /api/candidates/:id # Update candidate
DELETE /api/candidates/:id # Delete candidate
```

### **User Management** (Admin only)
```
GET    /api/users        # List users
POST   /api/users        # Create user
PUT    /api/users/:id    # Update user
DELETE /api/users/:id    # Delete user
POST   /api/users/bulk   # Bulk operations
```

### **Analytics**
```
GET /api/analytics/stats     # System statistics
GET /api/analytics/reports   # Generate reports
GET /api/activity           # Activity logs
```

## 🔒 Security Features

### **Authentication & Authorization**
- JWT token-based authentication
- Role-based access control (RBAC)
- Session timeout and refresh tokens
- Password hashing with bcrypt

### **Data Protection**
- Input validation and sanitization
- File type restrictions and size limits
- CORS policy configuration
- XSS and CSRF protection headers

### **Audit & Compliance**
- Comprehensive activity logging
- User action tracking
- Login/logout audit trails
- Data access monitoring

## 🎯 Performance Optimizations

### **Frontend**
- **Code splitting** with React lazy loading
- **Image optimization** and lazy loading
- **Service worker caching** strategies
- **Bundle size optimization** with Vite

### **Backend**
- **Response caching** for frequently accessed data
- **File upload optimization** with streaming
- **Database query optimization**
- **Compression** for API responses

## 🐛 Troubleshooting

### **Common Issues**

#### **PWA Not Installing**
- Ensure HTTPS is enabled in production
- Check service worker registration in DevTools
- Verify manifest.json is accessible

#### **File Upload Failing**
- Check file size limits (10MB default)
- Verify supported file types: PDF, DOC, DOCX, JPG, PNG
- Ensure backend upload endpoint is accessible

#### **Mobile UI Issues**
- Clear browser cache and reload
- Check viewport meta tag configuration
- Verify touch event handlers

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### **Development Guidelines**
- Follow React best practices and hooks patterns
- Use TypeScript for type safety (future enhancement)
- Write comprehensive tests for new features
- Follow mobile-first design principles
- Ensure PWA compliance for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏢 Organizations

### **Lagos State Employment Trust Fund (LSETF)**
> Empowering youth through innovative employment solutions

### **Power Learn Project (PLP)**
> Building Africa's next generation of tech talent

## 📞 Support

- **Technical Issues**: Create an issue in this repository
- **Feature Requests**: Submit a pull request or issue
- **Documentation**: Check the `/docs` folder for detailed guides

## 🎉 Acknowledgments

- **React Team** for the excellent frontend framework
- **Vite** for lightning-fast development experience
- **Chart.js** for beautiful data visualizations
- **Tailwind CSS** for utility-first styling approach
- **PWA Community** for progressive web app standards

---

**Built with ❤️ for African talent development**

*Last Updated: October 10, 2025*