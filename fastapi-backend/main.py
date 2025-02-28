from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from typing import List
import openai
import fitz  # PyMuPDF for PDF text extraction
import io
import os
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import json
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO
from fastapi.responses import StreamingResponse

load_dotenv()

app = FastAPI()

# Get OpenAI API key from environment variable for security
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("Please set OPENAI_API_KEY environment variable")
openai.api_key = OPENAI_API_KEY

# Add this after creating the FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResumeRequest(BaseModel):
    company: str
    job_title: str

class ScoreResponse(BaseModel):
    technical_skills: float
    soft_skills: float
    formatting: float
    measurable_results: float
    core_values: float
    overall_score: float
    resume_feedback: str
    section_feedback: dict

class ImprovedResumeRequest(BaseModel):
    original_text: str
    improvements: dict
    formatting_suggestions: str

# Function to extract text from PDF
async def extract_text_from_pdf(file: UploadFile):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Please upload a PDF file")
    
    try:
        contents = await file.read()
        pdf_document = fitz.open(stream=contents, filetype="pdf")
        text = "\n".join([page.get_text() for page in pdf_document])
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail="Error processing PDF file")

@app.post("/upload_resume")
async def upload_resume(
    file: UploadFile = File(...),
    company: str = Form(...),
    job_title: str = Form(...),
    job_description: str = Form(None)
):
    try:
        # Validate file size (e.g., max 10MB)
        file_size = 0
        chunk_size = 1024  # 1KB chunks
        while chunk := await file.read(chunk_size):
            file_size += len(chunk)
            if file_size > 10 * 1024 * 1024:  # 10MB
                raise HTTPException(
                    status_code=400, 
                    detail="File size too large. Maximum size is 10MB"
                )
        
        # Reset file pointer after reading
        await file.seek(0)
        
        # Extract and validate resume text
        resume_text = await extract_text_from_pdf(file)
        
        # Check if resume text is too short (likely invalid or empty PDF)
        if len(resume_text.strip()) < 100:  # Adjust minimum length as needed
            raise HTTPException(
                status_code=400,
                detail="Resume appears to be empty or contains too little text. Please check the PDF file."
            )
            
        # Check if resume text is too long (likely not a resume)
        if len(resume_text.strip()) > 10000:  # Adjust maximum length as needed
            raise HTTPException(
                status_code=400,
                detail="Document appears too long for a resume. Please ensure you're uploading a resume and not a different document."
            )

        prompt = f"""As an elite ATS system and hiring manager with experience at top-tier tech companies (FAANG and industry leaders), critically analyze this resume for a {job_title} position at {company}. Provide expert-level, data-driven feedback that will directly increase this candidate's chances of landing an interview.

Your evaluation must be brutally honest, highly specific, and backed by real-world successful examples. The goal is to transform this resume into a top 1% application by aligning it with what has worked for candidates securing interviews and offers at leading tech firms.

For each section below, provide:
1. A score out of 100 (be strict—FAANG-level resumes rarely score above 90)
2. Key issues identified
3. Specific improvements needed (3-4 highly detailed points)
4. Real examples from successful candidates (must include actual metrics and technologies)
5. Best practices from top-performing resumes

Example of Expected Depth in Feedback:
❌ "Led a team to improve system performance."
✅ "Managed a 6-person backend team to optimize API response times by 47% through Redis caching and GraphQL query optimization, reducing server costs by $12K/month."

Sections to Analyze (with Weighting):

1. Technical Skills (20%)
- Keyword Optimization: Compare resume keywords against FAANG-level {job_title} resumes
- Tech Stack Alignment: Identify missing technologies/tools that {company} prioritizes
- Depth vs. Breadth: Does the candidate showcase mastery in key skills or only list buzzwords?
- Certifications & Skills: Recommend top industry-recognized certifications that improve interview chances

2. Soft Skills & Leadership (20%)
- Executive Presence: How effectively does the resume demonstrate leadership, ownership, and influence?
- Problem-Solving & Decision-Making: Are challenges and solutions presented with clear impact?
- Cross-Team Collaboration: Evidence of working across functions (e.g., engineering, product, design)?
- Proactivity: Does the candidate demonstrate initiative and innovation beyond core responsibilities?

3. Formatting & ATS Optimization (20%)
- ATS Compatibility: Identify missing elements that could cause rejection
- Readability & Hierarchy: Is information structured for hiring managers scanning in <6 seconds?
- Consistent Style: Ensure uniform font, bullet points, and section spacing
- Space Utilization: Is the most impactful content prioritized?

4. Measurable Impact & Achievements (20%)
- Impact Metrics: Evaluate if achievements are quantified (e.g., revenue impact, efficiency gains)
- Comparison to Top Candidates: Are the numbers strong enough vs. successful hires?
- Results-Oriented Writing: Ensure each bullet follows a "Problem → Action → Result" format
- Missed Opportunities: Identify places where more data, KPIs, or business impact should be included

5. Company & Role Alignment (20%)
- Culture Fit: Analyze alignment with {company}'s mission, values, and priorities
- Industry-Specific Differentiation: How well does the resume reflect {company}'s unique challenges?
- Top Candidate Patterns: Identify what consistently appears in successful resumes at {company}
- Branding & Positioning: Does the candidate present themselves as a top-tier, high-impact hire?

For each section, provide approximately 20 real resume bullets from successful candidates, organized by relevant categories. These bullets should demonstrate best practices and have proven success in landing interviews at top tech companies. these are included in  the real_resume_bullets section.

Return the response in this JSON format, but for the real_resume_bullets section, include 10 bullets for each category:
{{
    "technical_skills": "<score>",
    "soft_skills": "<score>",
    "formatting": "<score>",
    "measurable_results": "<score>",
    "core_values": "<score>",
    "section_feedback": {{
        "technical_skills": {{
            "key_issues": "<main problems identified>",
            "improvements": [
                "<specific improvement 1>",
                "<specific improvement 2>",
                "<specific improvement 3>"
            ],
            "examples": [
                "Real example showing specific technologies and metrics",
                "Another specific example with quantifiable results"
            ],
            "best_practices": "<patterns from successful resumes>",
            "real_resume_bullets": [
                {{
                    "category": "System Design & Architecture",
                    "bullets": [
                        "Architected and implemented a microservices-based payment processing system handling 2M+ daily transactions using Java Spring Boot and Kafka, reducing latency by 40%",
                        "Designed and deployed distributed caching solution using Redis cluster, improving API response times by 65% and reducing database load by 40%"
                    ]
                }},
                {{
                    "category": "Cloud & Infrastructure",
                    "bullets": [
                        "Led migration of 200+ services to AWS, implementing Infrastructure as Code using Terraform and reducing deployment time by 65%",
                        "Architected and implemented auto-scaling Kubernetes clusters on AWS EKS, reducing infrastructure costs by 45% while improving availability to 99.99%"
                    ]
                }}
            ]
        }},
        "soft_skills": {{
            "key_issues": "<main problems identified>",
            "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
            "examples": ["<example 1>", "<example 2>"],
            "best_practices": "<patterns from successful resumes>",
            "real_resume_bullets": [
                {{
                    "category": "Leadership & Management",
                    "bullets": [
                        "Led cross-functional team of 12 engineers, delivering a mission-critical payment platform that increased transaction volume by 300%",
                        "Mentored 5 junior developers through structured training program, with all achieving promotion within 18 months"
                    ]
                }}
            ]
        }},
        "formatting": {{
            "key_issues": "<main problems identified>",
            "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
            "examples": ["<example 1>", "<example 2>"],
            "best_practices": "<patterns from successful resumes>",
            "real_resume_bullets": [
                {{
                    "category": "Structure & Organization",
                    "bullets": [
                        "Technical Skills: Python (Django, Flask), Java (Spring), AWS (ECS, Lambda), Kubernetes, Docker, CI/CD",
                        "Achievements highlighted with metrics: Reduced cloud costs by 40%, Improved API performance by 65%"
                    ]
                }}
            ]
        }},
        "measurable_results": {{
            "key_issues": "<main problems identified>",
            "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
            "examples": ["<example 1>", "<example 2>"],
            "best_practices": "<patterns from successful resumes>",
            "real_resume_bullets": [
                {{
                    "category": "Performance Improvements",
                    "bullets": [
                        "Optimized database queries reducing average response time from 2s to 200ms, improving user satisfaction by 45%",
                        "Implemented caching strategy that reduced server load by 60% while handling 2x increase in daily active users"
                    ]
                }}
            ]
        }},
        "core_values": {{
            "key_issues": "<main problems identified>",
            "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
            "examples": ["<example 1>", "<example 2>"],
            "best_practices": "<patterns from successful resumes>",
            "real_resume_bullets": [
                {{
                    "category": "Innovation & Impact",
                    "bullets": [
                        "Pioneered adoption of microservices architecture, becoming internal champion and reducing deployment conflicts by 90%",
                        "Initiated and led company-wide migration to TypeScript, reducing production bugs by 45% in 6 months"
                    ]
                }}
            ]
        }}
    }}
}}

Resume Text:
{resume_text}"""

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert resume reviewer for top tech companies. Provide clear, actionable feedback to help candidates improve their resumes."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        # Log the raw response for debugging
        print("Raw GPT Response:", response.choices[0].message.content)
        
        try:
            feedback_data = json.loads(response.choices[0].message.content)
            
            def parse_score(score):
                if isinstance(score, (int, float)):
                    return float(score)
                try:
                    # Remove any non-numeric characters except decimal points
                    score_str = ''.join(c for c in str(score) if c.isdigit() or c == '.')
                    return float(score_str)
                except (ValueError, TypeError):
                    return 0.0  # Default score if parsing fails
            
            # Parse all scores using the helper function
            scores = {
                "technical_skills": parse_score(feedback_data.get("technical_skills", 0)),
                "soft_skills": parse_score(feedback_data.get("soft_skills", 0)),
                "formatting": parse_score(feedback_data.get("formatting", 0)),
                "measurable_results": parse_score(feedback_data.get("measurable_results", 0)),
                "core_values": parse_score(feedback_data.get("core_values", 0))
            }
            
            # Calculate overall score
            overall_score = sum(scores.values()) / len(scores)
            
            # Return data with all numeric scores
            return {
                **scores,
                "overall_score": overall_score,
                "section_feedback": feedback_data["section_feedback"]
            }
            
        except json.JSONDecodeError as json_error:
            print("JSON Parsing Error:", str(json_error))
            print("Failed to parse response:", response.choices[0].message.content)
            raise HTTPException(
                status_code=500, 
                detail="Failed to analyze resume. Please try again."
            )
        
    except Exception as e:
        print(f"Error type: {type(e)}")
        print(f"Error details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing your resume."
        )

@app.post("/generate_improved_resume")
async def generate_improved_resume(request: ImprovedResumeRequest):
    try:
        # Create a BytesIO buffer to store the PDF
        buffer = BytesIO()
        
        # Create the PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=14,
            spaceAfter=30
        )
        
        # Build the document content
        content = []
        
        # Add sections based on improvements
        for section, improvements in request.improvements.items():
            # Add section title
            content.append(Paragraph(section.upper(), title_style))
            content.append(Spacer(1, 12))
            
            # Add section content
            content.append(Paragraph(improvements, styles["Normal"]))
            content.append(Spacer(1, 20))
        
        # Build and save the PDF
        doc.build(content)
        
        # Prepare the buffer for reading
        buffer.seek(0)
        
        # Return the PDF as a downloadable file
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=improved_resume.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
