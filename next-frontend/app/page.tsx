'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  CircularProgress, 
  Paper, 
  Container, 
  LinearProgress, 
  AppBar, 
  Toolbar, 
  Divider,
  Autocomplete,
  Grid,
  Dialog,
  Backdrop,
  Fade
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AssessmentIcon from '@mui/icons-material/Assessment';
import WorkIcon from '@mui/icons-material/Work';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';

type SectionFeedback = {
  key_issues: string;
  improvements: string[];
  examples: string[];
  best_practices: string;
};

type ScoreData = {
  technical_skills: number;
  soft_skills: number;
  formatting: number;
  measurable_results: number;
  core_values: number;
  overall_score: number;
  section_feedback: {
    technical_skills: SectionFeedback;
    soft_skills: SectionFeedback;
    formatting: SectionFeedback;
    measurable_results: SectionFeedback;
    core_values: SectionFeedback;
  };
};

type Company = {
  name: string;
  domain: string;
};

const TOP_COMPANIES: Company[] = [
  { name: 'Google', domain: 'google.com' },
  { name: 'Apple', domain: 'apple.com' },
  { name: 'Amazon', domain: 'amazon.com' },
  { name: 'Meta', domain: 'meta.com' },
  { name: 'Microsoft', domain: 'microsoft.com' },
  { name: 'Netflix', domain: 'netflix.com' },
  { name: 'Tesla', domain: 'tesla.com' },
  { name: 'NVIDIA', domain: 'nvidia.com' },
  { name: 'Salesforce', domain: 'salesforce.com' },
  { name: 'Rocket Lab', domain: 'adobe.com' },
];

const StepCard = ({ 
  step, 
  title, 
  feedback,
  isActive 
}: { 
  step: number;
  title: string;
  feedback: SectionFeedback;
  isActive: boolean;
}) => (
  <Paper 
    elevation={isActive ? 3 : 1} 
    sx={{ 
      p: 3,
      borderRadius: 2,
      opacity: isActive ? 1 : 0.7,
      transform: isActive ? 'scale(1)' : 'scale(0.98)',
      transition: 'all 0.2s ease',
      border: isActive ? '2px solid' : '1px solid',
      borderColor: isActive ? 'primary.main' : 'grey.300',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      <Box 
        sx={{ 
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: isActive ? 'primary.main' : 'grey.300',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 2,
          fontWeight: 600,
        }}
      >
        {step}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
    </Box>

    <Typography variant="subtitle1" color="error" sx={{ mb: 2, fontWeight: 500 }}>
      Key Issues:
    </Typography>
    <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
      {feedback.key_issues}
    </Typography>

    <Typography variant="subtitle1" color="primary" sx={{ mb: 2, fontWeight: 500 }}>
      Recommended Improvements:
    </Typography>
    <Box component="ul" sx={{ mb: 3, pl: 2 }}>
      {feedback.improvements.map((improvement, index) => (
        <Typography key={index} component="li" variant="body1" sx={{ mb: 1, color: 'text.secondary' }}>
          {improvement}
        </Typography>
      ))}
    </Box>

    <Typography variant="subtitle1" color="success.main" sx={{ mb: 2, fontWeight: 500 }}>
      Successful Examples:
    </Typography>
    <Box component="ul" sx={{ mb: 3, pl: 2 }}>
      {feedback.examples.map((example, index) => (
        <Typography key={index} component="li" variant="body1" sx={{ mb: 1, color: 'text.secondary' }}>
          {example}
        </Typography>
      ))}
    </Box>

    <Typography variant="subtitle1" color="info.main" sx={{ mb: 2, fontWeight: 500 }}>
      Best Practices:
    </Typography>
    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
      {feedback.best_practices}
    </Typography>
  </Paper>
);

const LoadingOverlay = ({ open }: { open: boolean }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    "Reading resume content...",
    "Analyzing technical skills...",
    "Evaluating experience and achievements...",
    "Comparing with top performers...",
    "Generating detailed feedback..."
  ];

  useEffect(() => {
    if (open) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setCurrentStep(0);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      fullScreen
      PaperProps={{
        style: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px'
        }
      }}
    >
      <CircularProgress 
        size={60}
        thickness={4}
        sx={{ color: 'primary.main' }} 
      />
      <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Analyzing Your Resume
        </Typography>
        <Box sx={{ position: 'relative', height: 24, mb: 2 }}>
          {steps.map((step, index) => (
            <Fade key={step} in={currentStep === index}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  position: 'absolute',
                  width: '100%',
                  top: 0,
                  left: 0,
                  transition: 'all 0.3s ease'
                }}
              >
                {step}
              </Typography>
            </Fade>
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary">
          This may take a minute...
        </Typography>
      </Box>
    </Dialog>
  );
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showError, setShowError] = useState(false);
  const [scores, setScores] = useState<ScoreData | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !company || !jobTitle) {
      setErrorMessage('Please fill in all required fields');
      setShowError(true);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setShowError(false);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('company', company.name);
    formData.append('job_title', jobTitle);
    if (jobDescription) {
      formData.append('job_description', jobDescription);
    }

    try {
      const response = await fetch('http://localhost:8000/upload_resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get feedback');
      }

      const data = await response.json();
      console.log('Response data:', data);
      setScores({
        ...data,
        section_feedback: data.section_feedback || {},
      });
      setFeedback(data.resume_feedback);
    } catch (err) {
      console.error('Error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Error submitting resume. Please try again.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!scores) return;
    
    setGeneratingPDF(true);
    try {
      const response = await fetch('http://localhost:8000/generate_improved_resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_text: file ? await file.text() : '',
          improvements: scores.section_feedback,
          formatting_suggestions: scores.section_feedback.formatting
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate PDF');
      }

      // Create a blob from the PDF Stream
      const blob = await response.blob();
      // Create a link to download it
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = "improved_resume.pdf";
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error:', err);
      setErrorMessage('Error generating improved resume PDF');
      setShowError(true);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const ScoreSection = ({ label, score, feedback }: { label: string; score: number; feedback: string }) => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{label}</Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 700,
            color: score >= 70 ? 'success.main' : score >= 40 ? 'warning.main' : 'error.main'
          }}
        >
          {score ? Math.round(score) : 0}%
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={score || 0} 
        sx={{ 
          height: 8, 
          borderRadius: 4,
          mb: 1,
          backgroundColor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            backgroundColor: score >= 70 ? 'success.main' : score >= 40 ? 'warning.main' : 'error.main',
            borderRadius: 4,
          }
        }} 
      />
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
        {feedback || 'No feedback available'}
      </Typography>
    </Box>
  );

  const CompactScoreSection = ({ label, score }: { label: string; score: number }) => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2">{label}</Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600,
            color: score >= 70 ? 'success.main' : score >= 40 ? 'warning.main' : 'error.main'
          }}
        >
          {score ? Math.round(score) : 0}%
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={score || 0} 
        sx={{ 
          height: 4, 
          borderRadius: 2,
          backgroundColor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            backgroundColor: score >= 70 ? 'success.main' : score >= 40 ? 'warning.main' : 'error.main',
            borderRadius: 2,
          }
        }} 
      />
    </Box>
  );

  const DownloadButton = () => (
    <Button
      variant="contained"
      color="secondary"
      onClick={handleGeneratePDF}
      disabled={generatingPDF || !scores}
      startIcon={<DownloadIcon />}
      sx={{ 
        mt: 4,
        py: 1.5,
        fontWeight: 600,
        boxShadow: 2
      }}
    >
      {generatingPDF ? <CircularProgress size={24} /> : 'Download Improved Resume'}
    </Button>
  );

  const ScoreOverview = () => {
    if (!scores) return null;
    
    return (
      <Paper elevation={3} sx={{ 
        p: 4, 
        mb: 4, 
        borderRadius: 2,
        background: 'linear-gradient(135deg, #f5f7ff 0%, #ffffff 100%)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Resume Score
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Based on analysis of successful resumes at {company?.name || 'top companies'}
            </Typography>
          </Box>
          <Box sx={{ 
            width: 150,
            height: 150,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CircularProgress
              variant="determinate"
              value={scores.overall_score}
              size={150}
              thickness={6}
              sx={{
                color: scores.overall_score >= 70 ? 'success.main' : 
                       scores.overall_score >= 40 ? 'warning.main' : 'error.main',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="h3"
                component="div"
                sx={{
                  fontWeight: 700,
                  color: scores.overall_score >= 70 ? 'success.main' : 
                         scores.overall_score >= 40 ? 'warning.main' : 'error.main',
                  lineHeight: 1,
                }}
              >
                {Math.round(scores.overall_score)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                }}
              >
                SCORE
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <CompactScoreSection label="Technical Skills" score={scores.technical_skills} />
          </Grid>
          <Grid item xs={12} md={6}>
            <CompactScoreSection label="Soft Skills" score={scores.soft_skills} />
          </Grid>
          <Grid item xs={12} md={6}>
            <CompactScoreSection label="Formatting" score={scores.formatting} />
          </Grid>
          <Grid item xs={12} md={6}>
            <CompactScoreSection label="Measurable Results" score={scores.measurable_results} />
          </Grid>
          <Grid item xs={12}>
            <CompactScoreSection label="Core Values Alignment" score={scores.core_values} />
          </Grid>
        </Grid>
      </Paper>
    );
  };

  const ImprovementSteps = () => {
    if (!scores) return null;

    const steps = [
      {
        title: "Enhance Technical Skills",
        content: scores.section_feedback.technical_skills
      },
      {
        title: "Improve Soft Skills Presentation",
        content: scores.section_feedback.soft_skills
      },
      {
        title: "Optimize Formatting",
        content: scores.section_feedback.formatting
      },
      {
        title: "Add Measurable Results",
        content: scores.section_feedback.measurable_results
      },
      {
        title: "Align with Company Values",
        content: scores.section_feedback.core_values
      }
    ];

    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ 
          fontWeight: 700,
          mb: 3,
        }}>
          Step-by-Step Improvements
        </Typography>
        
        <Box sx={{ display: 'flex', mb: 4 }}>
          {steps.map((_, index) => (
            <Button
              key={index}
              variant={currentStep === index + 1 ? "contained" : "outlined"}
              onClick={() => setCurrentStep(index + 1)}
              sx={{ 
                mr: 1,
                minWidth: 40,
                width: 40,
                height: 40,
                borderRadius: '50%',
              }}
            >
              {index + 1}
            </Button>
          ))}
        </Box>

        <StepCard
          step={currentStep}
          title={steps[currentStep - 1].title}
          feedback={steps[currentStep - 1].content}
          isActive={true}
        />
      </Box>
    );
  };

  const ErrorAlert = () => {
    if (!showError || !errorMessage) return null;

    return (
      <Paper
        elevation={4}
        sx={{
          position: 'fixed',
          top: 64,
          left: 0,
          right: 0,
          zIndex: 1200,
          p: 2,
          backgroundColor: 'warning.main',
          color: 'warning.contrastText',
          borderRadius: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box sx={{ 
          maxWidth: 'xl',
          width: '100%',
          mx: 'auto',
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {errorMessage}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setShowError(false)}
            sx={{ 
              color: 'warning.contrastText',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Paper>
    );
  };

  return (
    <>
      <AppBar position="fixed" color="default" elevation={1}>
        <Toolbar>
          <AssessmentIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            AI Resume Optimizer
          </Typography>
        </Toolbar>
      </AppBar>

      <ErrorAlert />
      <LoadingOverlay open={loading} />

      <Container maxWidth="xl">
        <Box sx={{ 
          minHeight: '100vh',
          pt: 12,
          pb: 8,
          px: 4,
        }}>
          <Box sx={{ maxWidth: 800, mx: 'auto', mb: 6, textAlign: 'center' }}>
            <Typography variant="h3" gutterBottom sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
            }}>
              Optimize Your Resume with AI
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
              Get instant AI-powered feedback to match your dream job requirements
            </Typography>
          </Box>

          {/* Score Overview */}
          {scores && <ScoreOverview />}

          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '400px 1fr' },
            gap: 4,
          }}>
            {/* Left Column - Upload Form */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Upload Form */}
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <form onSubmit={handleSubmit}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        borderStyle: 'dashed',
                        borderColor: 'primary.main',
                        transition: 'all 0.2s',
                        '&:hover': { 
                          backgroundColor: 'rgba(33, 150, 243, 0.04)',
                          borderColor: 'primary.dark'
                        }
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
                        <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Upload Resume (PDF)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {file ? file.name : 'Drag and drop or click to upload'}
                        </Typography>
                      </label>
                    </Paper>

                    <Autocomplete
                      options={TOP_COMPANIES}
                      getOptionLabel={(option) => option.name}
                      value={company}
                      onChange={(_, newValue) => setCompany(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Company"
                          required
                          variant="outlined"
                          size="small"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <WorkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      sx={{ width: '100%' }}
                    />

                    <TextField
                      label="Job Title"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      required
                      variant="outlined"
                      size="small"
                    />

                    <Paper elevation={0} sx={{ 
                      backgroundColor: 'grey.50',
                      p: 2,
                      borderRadius: 2
                    }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                        Job Description
                      </Typography>
                      <TextField
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        multiline
                        rows={12}
                        variant="outlined"
                        fullWidth
                        placeholder="Paste the job description here to get more targeted feedback"
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            fontSize: '0.875rem',
                            backgroundColor: 'white',
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(0, 0, 0, 0.1)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(0, 0, 0, 0.2)',
                          },
                        }}
                      />
                      <Typography variant="caption" sx={{ 
                        display: 'block',
                        mt: 1,
                        color: 'text.secondary',
                        fontStyle: 'italic'
                      }}>
                        Adding a job description helps us provide more accurate feedback
                      </Typography>
                    </Paper>

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      sx={{ 
                        py: 1.5,
                        mt: 1,
                        fontWeight: 600,
                        boxShadow: 2
                      }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Analyze Resume'}
                    </Button>
                  </Box>
                </form>
              </Paper>
            </Box>

            {/* Right Column - Improvement Steps */}
            <Paper elevation={2} sx={{ 
              p: 4,
              borderRadius: 2,
              bgcolor: 'grey.50',
            }}>
              {scores ? (
                <ImprovementSteps />
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 8,
                  color: 'text.secondary'
                }}>
                  <AssessmentIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main', opacity: 0.5 }} />
                  <Typography variant="h6" align="center" sx={{ mb: 1 }}>
                    Ready to Analyze Your Resume
                  </Typography>
                  <Typography variant="body1" align="center" color="text.secondary">
                    Upload your resume and provide job details to receive AI-powered feedback
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      </Container>
    </>
  );
}