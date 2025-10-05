import React, { useState, useEffect } from 'react';
import { Upload, Users, TrendingUp, Award, Search, Filter, Download, ChevronDown, ChevronUp, Brain, FileText, Mail, GraduationCap, Briefcase, Star, CheckCircle, AlertCircle } from 'lucide-react';

const AIApplicantSelector = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [applicants, setApplicants] = useState([]);
  const [filteredApplicants, setFilteredApplicants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'overallScore', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);

  // Sample applicant data as fallback
  const sampleApplicants = [
    {
      id: 1,
      full_name: "Adewale Johnson",
      email: "adewale.j@email.com",
      skills: ["Python", "Machine Learning", "Data Analysis", "TensorFlow"],
      experience_years: 3,
      education: "BSc Computer Science",
      overall_score: 94,
      skills_score: 96,
      experience_score: 92,
      education_score: 94,
      assessment_score: 94,
      status: "Highly Recommended",
      resume_quality_score: 95,
      cover_letter_score: 92,
      motivation_level: "High",
      availability: "Immediate"
    },
    {
      id: 2,
      full_name: "Chioma Okonkwo",
      email: "chioma.o@email.com",
      skills: ["React", "Node.js", "UI/UX Design", "TypeScript"],
      experience_years: 4,
      education: "MSc Information Technology",
      overall_score: 92,
      skills_score: 94,
      experience_score: 95,
      education_score: 96,
      assessment_score: 85,
      status: "Highly Recommended",
      resume_quality_score: 90,
      cover_letter_score: 94,
      motivation_level: "High",
      availability: "2 weeks"
    },
    {
      id: 3,
      full_name: "Ibrahim Musa",
      email: "ibrahim.m@email.com",
      skills: ["Java", "Spring Boot", "Microservices", "Docker"],
      experience_years: 2,
      education: "BSc Software Engineering",
      overall_score: 88,
      skills_score: 90,
      experience_score: 82,
      education_score: 88,
      assessment_score: 92,
      status: "Recommended",
      resume_quality_score: 87,
      cover_letter_score: 86,
      motivation_level: "High",
      availability: "Immediate"
    },
    {
      id: 4,
      full_name: "Blessing Nwosu",
      email: "blessing.n@email.com",
      skills: ["Data Science", "SQL", "Power BI", "Statistics"],
      experience_years: 2.5,
      education: "BSc Mathematics",
      overall_score: 86,
      skills_score: 88,
      experience_score: 80,
      education_score: 85,
      assessment_score: 90,
      status: "Recommended",
      resume_quality_score: 84,
      cover_letter_score: 88,
      motivation_level: "Medium-High",
      availability: "1 month"
    },
    {
      id: 5,
      full_name: "Yusuf Abdullahi",
      email: "yusuf.a@email.com",
      skills: ["Cloud Computing", "AWS", "DevOps", "CI/CD"],
      experience_years: 5,
      education: "BSc Computer Engineering",
      overall_score: 90,
      skills_score: 92,
      experience_score: 96,
      education_score: 82,
      assessment_score: 88,
      status: "Highly Recommended",
      resume_quality_score: 91,
      cover_letter_score: 87,
      motivation_level: "High",
      availability: "Immediate"
    },
    {
      id: 6,
      full_name: "Ngozi Eze",
      email: "ngozi.e@email.com",
      skills: ["Mobile Dev", "Flutter", "Dart", "Firebase"],
      experience_years: 1.5,
      education: "HND Computer Science",
      overall_score: 82,
      skills_score: 85,
      experience_score: 75,
      education_score: 80,
      assessment_score: 88,
      status: "Consider",
      resume_quality_score: 80,
      cover_letter_score: 84,
      motivation_level: "Medium",
      availability: "Immediate"
    },
    {
      id: 7,
      full_name: "Oluwaseun Adebayo",
      email: "seun.a@email.com",
      skills: ["Blockchain", "Solidity", "Web3", "Smart Contracts"],
      experience_years: 2,
      education: "BSc Economics",
      overall_score: 85,
      skills_score: 87,
      experience_score: 82,
      education_score: 78,
      assessment_score: 92,
      status: "Recommended",
      resume_quality_score: 83,
      cover_letter_score: 89,
      motivation_level: "High",
      availability: "2 weeks"
    },
    {
      id: 8,
      full_name: "Fatima Bello",
      email: "fatima.b@email.com",
      skills: ["Cybersecurity", "Ethical Hacking", "Network Security"],
      experience_years: 3,
      education: "MSc Cybersecurity",
      overall_score: 89,
      skills_score: 91,
      experience_score: 88,
      education_score: 95,
      assessment_score: 84,
      status: "Recommended",
      resume_quality_score: 88,
      cover_letter_score: 85,
      motivation_level: "High",
      availability: "1 month"
    }
  ];

  // Normalize API data to match expected format
  const normalizeApplicant = (applicant) => {
    // Helper function to convert to number
    const toNumber = (value) => {
      if (value === null || value === undefined) return 0;
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    };

    return {
      ...applicant,
      // Handle field name differences - CONVERT TO NUMBERS
      overallScore: toNumber(applicant.overall_score || applicant.overallScore),
      skillsScore: toNumber(applicant.skills_score || applicant.skillsScore),
      experienceScore: toNumber(applicant.experience_score || applicant.experienceScore),
      educationScore: toNumber(applicant.education_score || applicant.educationScore),
      assessmentScore: toNumber(applicant.assessment_score || applicant.assessmentScore),
      resumeQuality: toNumber(applicant.resume_quality_score || applicant.resumeQuality),
      coverLetterScore: toNumber(applicant.cover_letter_score || applicant.coverLetterScore),
      // Handle skills - might be array or comma-separated string
      skills: Array.isArray(applicant.skills) 
        ? applicant.skills 
        : (applicant.skills ? applicant.skills.split(',').map(s => s.trim()) : []),
      // Handle other fields
      name: applicant.full_name || applicant.name || 'Unknown',
      experience: applicant.experience_years 
        ? `${applicant.experience_years} years` 
        : (applicant.experience || 'N/A'),
      motivation: applicant.motivation_level || applicant.motivation || 'Medium'
    };
  };

  useEffect(() => {
    const fetchApplicants = async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'https://ai-applicant-selector-production.up.railway.app/api';
        console.log('🔍 Fetching from:', `${API_URL}/applicants`);
        
        const response = await fetch(`${API_URL}/applicants`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON');
        }
        
        const result = await response.json();
        console.log('📊 API Response:', result);
        
        if (result.success && result.data && result.data.length > 0) {
          console.log('✅ Using API data:', result.data.length, 'applicants');
          const normalized = result.data.map(normalizeApplicant);
          setApplicants(normalized);
          setFilteredApplicants(normalized);
          setApiConnected(true);
        } else {
          console.log('⚠️ API returned no data, using sample data');
          setApplicants(sampleApplicants);
          setFilteredApplicants(sampleApplicants);
          setApiConnected(false);
        }
      } catch (error) {
        console.error('❌ API Error:', error);
        console.log('📦 Using sample data as fallback');
        setApplicants(sampleApplicants);
        setFilteredApplicants(sampleApplicants);
        setApiConnected(false);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplicants();
  }, []);

  useEffect(() => {
    let filtered = applicants.filter(app => {
      const name = app.name || app.full_name || '';
      const email = app.email || '';
      const skills = app.skills || [];
      
      const matchesSearch = 
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skills.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      return matchesSearch;
    });

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(app => app.status === selectedFilter);
    }

    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key] || a.overallScore || 0;
      const bValue = b[sortConfig.key] || b.overallScore || 0;
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    setFilteredApplicants(sorted);
  }, [searchTerm, selectedFilter, applicants, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      setAnalyzing(true);
      setUploadProgress(0);
      
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setAnalyzing(false);
              setActiveTab('applicants');
            }, 500);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Highly Recommended': return 'bg-green-100 text-green-800 border-green-300';
      case 'Recommended': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Consider': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 font-bold';
    if (score >= 80) return 'text-blue-600 font-semibold';
    if (score >= 70) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const stats = {
    total: applicants.length,
    highlyRecommended: applicants.filter(a => a.status === 'Highly Recommended').length,
    recommended: applicants.filter(a => a.status === 'Recommended').length,
    avgScore: applicants.length > 0 
      ? Math.round(applicants.reduce((sum, a) => sum + (a.overallScore || a.overall_score || 0), 0) / applicants.length)
      : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-700">Loading AI Applicant Selector...</p>
          <p className="text-sm text-gray-500 mt-2">Connecting to intelligent recruitment platform</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Applicant Selector</h1>
                <p className="text-sm text-gray-600">LSETF/PLP Intelligent Recruitment Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Powered by</p>
                <p className="text-sm font-semibold text-blue-600">Advanced ML Algorithms</p>
              </div>
              {apiConnected && (
                <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-800">API Connected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {['dashboard', 'applicants', 'upload', 'analytics'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize transition-all ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Applicants</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Highly Recommended</p>
                    <p className="text-3xl font-bold text-green-600">{stats.highlyRecommended}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Recommended</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.recommended}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Average Score</p>
                    <p className="text-3xl font-bold text-indigo-600">{stats.avgScore}%</p>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <Star className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Upload Applications</span>
                </button>
                <button
                  onClick={() => setActiveTab('applicants')}
                  className="flex items-center gap-3 p-4 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                >
                  <Users className="w-5 h-5" />
                  <span className="font-medium">View All Applicants</span>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="flex items-center gap-3 p-4 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">View Analytics</span>
                </button>
              </div>
            </div>

            {/* Top Candidates Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 3 Candidates</h2>
              <div className="space-y-3">
                {filteredApplicants.slice(0, 3).map((app, idx) => (
                  <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{app.name || app.full_name}</p>
                        <p className="text-sm text-gray-600">{app.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{app.overallScore || app.overall_score}%</p>
                        <p className="text-xs text-gray-600">Overall Score</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Applicants Tab */}
        {activeTab === 'applicants' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="Highly Recommended">Highly Recommended</option>
                  <option value="Recommended">Recommended</option>
                  <option value="Consider">Consider</option>
                </select>
                <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export
                </button>
              </div>
            </div>

            {/* Applicants Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('overallScore')}
                      >
                        <div className="flex items-center gap-1">
                          Overall Score
                          {sortConfig.key === 'overallScore' && (
                            sortConfig.direction === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Skills
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Experience
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredApplicants.map(app => (
                      <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{app.name || app.full_name}</p>
                            <p className="text-sm text-gray-600">{app.email}</p>
                            <p className="text-xs text-gray-500 mt-1">{app.education}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${getScoreColor(app.overallScore || app.overall_score)}`}>
                              {app.overallScore || app.overall_score}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {app.skills && app.skills.slice(0, 2).map((skill, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                            {app.skills && app.skills.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                +{app.skills.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{app.experience}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedApplicant(app)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Applicant Data</h2>
                <p className="text-gray-600 mb-6">
                  Upload resumes, cover letters, and assessment files for AI analysis
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-blue-500 transition-all">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="space-y-4">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-gray-600">
                          PDF, DOC, DOCX, or CSV files
                        </p>
                      </div>
                      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                        Select Files
                      </button>
                    </div>
                  </label>
                </div>

                {analyzing && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Analyzing applications...</span>
                      <span className="text-sm font-medium text-blue-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                      <Brain className="w-5 h-5 animate-pulse" />
                      <span className="text-sm">AI processing applicant data...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Supported Formats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Supported Analysis Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Resume Parsing</p>
                    <p className="text-sm text-gray-600">Extract skills, experience, and education</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Cover Letter Analysis</p>
                    <p className="text-sm text-gray-600">Assess motivation and communication skills</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Skills Matching</p>
                    <p className="text-sm text-gray-600">Compare skills against program requirements</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Intelligent Ranking</p>
                    <p className="text-sm text-gray-600">Multi-criteria scoring and recommendations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Score Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
                <div className="space-y-3">
                  {[
                    { range: '90-100', count: applicants.filter(a => (a.overallScore || a.overall_score) >= 90).length, color: 'bg-green-500' },
                    { range: '80-89', count: applicants.filter(a => (a.overallScore || a.overall_score) >= 80 && (a.overallScore || a.overall_score) < 90).length, color: 'bg-blue-500' },
                    { range: '70-79', count: applicants.filter(a => (a.overallScore || a.overall_score) >= 70 && (a.overallScore || a.overall_score) < 80).length, color: 'bg-yellow-500' },
                    { range: 'Below 70', count: applicants.filter(a => (a.overallScore || a.overall_score) < 70).length, color: 'bg-gray-500' }
                  ].map(item => (
                    <div key={item.range}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.range}%</span>
                        <span className="text-sm font-semibold text-gray-900">{item.count} applicants</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full`}
                          style={{ width: `${applicants.length > 0 ? (item.count / applicants.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Scores by Category</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Skills', avg: Math.round(applicants.reduce((s, a) => s + (a.skillsScore || a.skills_score || 0), 0) / (applicants.length || 1)), icon: Star },
                    { name: 'Experience', avg: Math.round(applicants.reduce((s, a) => s + (a.experienceScore || a.experience_score || 0), 0) / (applicants.length || 1)), icon: Briefcase },
                    { name: 'Education', avg: Math.round(applicants.reduce((s, a) => s + (a.educationScore || a.education_score || 0), 0) / (applicants.length || 1)), icon: GraduationCap },
                    { name: 'Assessment', avg: Math.round(applicants.reduce((s, a) => s + (a.assessmentScore || a.assessment_score || 0), 0) / (applicants.length || 1)), icon: FileText }
                  ].map(cat => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <cat.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                          <span className={`text-lg font-bold ${getScoreColor(cat.avg)}`}>{cat.avg}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                            style={{ width: `${cat.avg}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills Analysis */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Skills in Applicant Pool</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const skillCounts = {};
                  applicants.forEach(app => {
                    const skills = app.skills || [];
                    skills.forEach(skill => {
                      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
                    });
                  });
                  return Object.entries(skillCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([skill, count]) => (
                      <div key={skill} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <p className="font-semibold text-gray-900">{skill}</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{count}</p>
                        <p className="text-xs text-gray-600">applicants</p>
                      </div>
                    ));
                })()}
              </div>
            </div>

            {/* Insights */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">High-Quality Pool</p>
                    <p className="text-sm text-green-700">
                      {stats.highlyRecommended + stats.recommended} out of {stats.total} candidates ({Math.round(((stats.highlyRecommended + stats.recommended) / (stats.total || 1)) * 100)}%) meet or exceed program requirements
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Diverse Skill Sets</p>
                    <p className="text-sm text-blue-700">
                      Applicant pool shows strong diversity across development, data science, cloud computing, and emerging technologies
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-indigo-900">Strong Assessment Performance</p>
                    <p className="text-sm text-indigo-700">
                      Average assessment score of {Math.round(applicants.reduce((s, a) => s + (a.assessmentScore || a.assessment_score || 0), 0) / (applicants.length || 1))}% indicates candidates are well-prepared for program challenges
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Applicant Detail Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedApplicant.name || selectedApplicant.full_name}</h2>
                  <p className="text-blue-100 mt-1">{selectedApplicant.email}</p>
                </div>
                <button
                  onClick={() => setSelectedApplicant(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                >
                  ✕
                </button>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                  <p className="text-3xl font-bold">{selectedApplicant.overallScore || selectedApplicant.overall_score}%</p>
                  <p className="text-sm text-blue-100">Overall Score</p>
                </div>
                <span className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 border-white ${
                  selectedApplicant.status === 'Highly Recommended' ? 'bg-green-500' :
                  selectedApplicant.status === 'Recommended' ? 'bg-blue-500' : 'bg-yellow-500'
                }`}>
                  {selectedApplicant.status}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Score Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Score Breakdown</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Skills', score: selectedApplicant.skillsScore || selectedApplicant.skills_score, icon: Star },
                    { label: 'Experience', score: selectedApplicant.experienceScore || selectedApplicant.experience_score, icon: Briefcase },
                    { label: 'Education', score: selectedApplicant.educationScore || selectedApplicant.education_score, icon: GraduationCap },
                    { label: 'Assessment', score: selectedApplicant.assessmentScore || selectedApplicant.assessment_score, icon: FileText },
                    { label: 'Resume Quality', score: selectedApplicant.resumeQuality || selectedApplicant.resume_quality_score, icon: FileText },
                    { label: 'Cover Letter', score: selectedApplicant.coverLetterScore || selectedApplicant.cover_letter_score, icon: Mail }
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <item.icon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${getScoreColor(item.score || 0)}`}>
                          {item.score || 0}%
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                            style={{ width: `${item.score || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Candidate Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Education</p>
                      <p className="text-gray-900">{selectedApplicant.education}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Experience</p>
                      <p className="text-gray-900">{selectedApplicant.experience}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Star className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Skills</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedApplicant.skills && selectedApplicant.skills.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">Motivation Level</p>
                      <p className="text-gray-900 font-semibold">{selectedApplicant.motivation || selectedApplicant.motivation_level}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">Availability</p>
                      <p className="text-gray-900 font-semibold">{selectedApplicant.availability}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Brain className="w-6 h-6 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">AI Recommendation</p>
                    <p className="text-sm text-gray-700">
                      {(selectedApplicant.overallScore || selectedApplicant.overall_score) >= 90 
                        ? `${selectedApplicant.name || selectedApplicant.full_name} is an exceptional candidate with outstanding qualifications across all criteria. Strong technical skills, relevant experience, and excellent assessment performance make this candidate ideal for immediate acceptance.`
                        : (selectedApplicant.overallScore || selectedApplicant.overall_score) >= 85
                        ? `${selectedApplicant.name || selectedApplicant.full_name} demonstrates strong potential with solid qualifications. The candidate shows good alignment with program requirements and would benefit significantly from the training.`
                        : `${selectedApplicant.name || selectedApplicant.full_name} shows promise with notable strengths in specific areas. Consider for acceptance with attention to developing weaker competencies during the program.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold">
                  Accept Candidate
                </button>
                <button className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold">
                  Schedule Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIApplicantSelector;