// Export applicants to CSV
export const exportToCSV = (applicants, filename = 'applicants') => {
  if (!applicants || applicants.length === 0) {
    alert('No applicants to export');
    return;
  }

  // Define headers
  const headers = [
    'ID',
    'Name',
    'Email',
    'Phone',
    'Education',
    'Experience (Years)',
    'Overall Score',
    'Skills Score',
    'Experience Score',
    'Education Score',
    'Assessment Score',
    'Resume Quality',
    'Cover Letter Score',
    'Status',
    'Motivation',
    'Availability',
    'Skills',
    'Created Date'
  ];

  // Map data to rows
  const rows = applicants.map(a => [
    a.id,
    a.name || a.full_name,
    a.email,
    a.phone || 'N/A',
    a.education,
    a.experience_years || 'N/A',
    a.overallScore || a.overall_score,
    a.skillsScore || a.skills_score,
    a.experienceScore || a.experience_score,
    a.educationScore || a.education_score,
    a.assessmentScore || a.assessment_score,
    a.resumeQuality || a.resume_quality_score,
    a.coverLetterScore || a.cover_letter_score,
    a.status,
    a.motivation || a.motivation_level,
    a.availability,
    (a.skills || []).join('; '),
    a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'
  ]);

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma
      const cellStr = String(cell || '');
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
    .join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Export statistics to CSV
export const exportStatisticsToCSV = (stats) => {
  const headers = ['Metric', 'Value'];
  const rows = [
    ['Total Applicants', stats.total],
    ['Highly Recommended', stats.highlyRecommended],
    ['Recommended', stats.recommended],
    ['Average Score', `${stats.avgScore}%`]
  ];

  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `statistics_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};