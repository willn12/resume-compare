'use client';

import { useState } from 'react';
import { Box, Button, TextField, Typography, CircularProgress, Paper, Container } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !company || !jobTitle) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('company', company);
    formData.append('job_title', jobTitle);

    try {
      const response = await fetch('http://localhost:8000/upload_resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to get feedback');
      }

      const data = await response.json();
      setFeedback(data.resume_feedback);
    } catch (err) {
      setError('Error submitting resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ 
        minHeight: '100vh',
        py: 8,
        px: 4,
      }}>
        <Typography variant="h3" gutterBottom align="center" sx={{ 
          fontWeight: 700,
          mb: 4,
        }}>
          AI Resume Optimizer
        </Typography>
        
        <Typography variant="h6" align="center" sx={{ mb: 6, color: 'text.secondary' }}>
          Upload your resume and get instant AI-powered feedback to match your dream job
        </Typography>

        <Box sx={{ 
          display: 'flex',
          gap: 4,
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          {/* Left side - Upload Form */}
          <Paper elevation={3} sx={{ 
            flex: 1,
            p: 4,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderStyle: 'dashed',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload">
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Upload Resume (PDF)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {file ? file.name : 'Drag and drop or click to upload'}
                    </Typography>
                  </label>
                </Paper>

                <TextField
                  label="Company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  variant="outlined"
                />

                <TextField
                  label="Job Title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                  variant="outlined"
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  size="large"
                  sx={{ 
                    py: 1.5,
                    mt: 2
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Analyze Resume'}
                </Button>
              </Box>
            </form>

            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
          </Paper>

          {/* Right side - Feedback */}
          <Paper elevation={3} sx={{ 
            flex: 1,
            p: 4,
            borderRadius: 2,
            bgcolor: 'grey.50',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              AI Feedback
            </Typography>
            
            {feedback ? (
              <Typography
                component="div"
                sx={{
                  whiteSpace: 'pre-wrap',
                  p: 2,
                  borderRadius: 1,
                  flex: 1,
                  overflowY: 'auto',
                  maxHeight: '600px',
                  lineHeight: 1.8
                }}
              >
                {feedback}
              </Typography>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                color: 'text.secondary'
              }}>
                <Typography variant="body1" align="center">
                  Upload your resume and provide job details to receive AI-powered feedback
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}