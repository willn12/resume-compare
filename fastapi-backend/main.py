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

        json_format = '''
{
    "technical_skills": <score>,
    "soft_skills": <score>,
    "formatting": <score>,
    "measurable_results": <score>,
    "core_values": <score>,
    "section_feedback": {
        "technical_skills": {
            "key_issues": "<main problems identified>",
            "improvements": [
                "<specific improvement 1>",
                "<specific improvement 2>",
                "<specific improvement 3>"
            ],
            "examples": [
                "Real example of how a successful candidate presented their technical skills, including specific technologies and frameworks",
                "Another specific example showing technology stack presentation and proficiency levels"
            ],
            "best_practices": "<common patterns in successful resumes>"
        },
        "soft_skills": {
            "key_issues": "<main problems identified>",
            "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
            "examples": [
                "Concrete example of leadership achievement with metrics and outcome",
                "Specific collaboration example showing cross-functional team impact"
            ],
            "best_practices": "<best practices>"
        },
        "formatting": {
            "key_issues": "<main problems identified>",
            "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
            "examples": [
                "Example of clean, ATS-friendly bullet point structure with proper keywords",
                "Sample header format that successfully passed ATS screening"
            ],
            "best_practices": "<best practices>"
        },
        "measurable_results": {
            "key_issues": "<main problems identified>",
            "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
            "examples": [
                "Real metric-driven result showing revenue/cost impact with percentages",
                "Specific project outcome with team size, timeline, and business impact"
            ],
            "best_practices": "<best practices>"
        },
        "core_values": {
            "key_issues": "<main problems identified>",
            "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
            "examples": [
                "Example showing alignment with company's innovation culture through specific project",
                "Demonstration of company's customer-first value through measurable impact"
            ],
            "best_practices": "<best practices>"
        }
    }
}
'''
        
        prompt = f"""As an expert ATS system and hiring manager at top tech companies, analyze this resume for a {job_title} position at {company}. Be critical in your scoring and provide detailed, actionable feedback. Compare it with successful resumes that have secured interviews and offers at FAANG/top tech companies.

When providing examples, be extremely specific and realistic. Include actual metrics, technologies, and achievements that have worked for successful candidates. Avoid generic statements. Each example should be detailed enough that someone could use it as a direct template for their own resume.

For each section below, provide:
1. A score out of 100
2. 3-4 specific bullet points of improvements needed
3. Real, detailed examples from successful candidates (anonymized but with specific metrics, technologies, and achievements)
4. Common patterns seen in top-performing resumes

Example of the level of detail expected in examples:
❌ "Led a team to improve system performance"
✅ "Led a 6-person backend team to optimize API response times by 47% through implementation of Redis caching and GraphQL query optimization, reducing server costs by $12K/month"

Sections to analyze:

1. Technical Skills (20% of total)
- Compare keywords present vs. successful {job_title} resumes
- Gap analysis between this resume's tech stack and what {company} typically requires
- Missing critical technical skills that successful candidates demonstrate
- Recommended certifications/skills that increase interview chances

2. Soft Skills (20% of total)
- Leadership and communication demonstration
- Problem-solving abilities presentation
- Team collaboration examples
- Initiative and proactivity indicators

3. Formatting (20% of total)
- ATS compatibility analysis
- Visual hierarchy effectiveness
- Consistency in style and presentation
- Space utilization and readability

4. Measurable Results (20% of total)
- Compare achievement metrics with successful candidates
- Analysis of quantifiable results
- Project outcome presentations
- Missing impact metrics that top candidates typically showcase

5. Company Core Values Alignment (20% of total)
- Alignment with {company}'s culture and values
- Specific patterns from successful {company} resumes
- Key differentiators that successful candidates typically showcase
- Cultural fit indicators

For the examples in each section, ensure they are:
- Specific to the {job_title} role
- Relevant to {company}'s industry and scale
- Include actual metrics and technologies where applicable
- Show clear cause-and-effect relationships
- Demonstrate both technical and business impact
- Are formatted in a way that passes ATS screening

Return the response in this JSON format:
{json_format}

Resume:
{resume_text}"""

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert resume reviewer for top tech companies. Provide clear, actionable feedback to help candidates improve their resumes."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        # Log the raw response
        print("GPT-4 Raw Response:", response.choices[0].message.content)
        
        try:
            feedback_data = json.loads(response.choices[0].message.content)
        except json.JSONDecodeError as json_error:
            print("JSON Parsing Error:", str(json_error))
            print("Failed to parse response:", response.choices[0].message.content)
            raise HTTPException(
                status_code=500, 
                detail="Failed to analyze resume. Please try again or contact support if the issue persists."
            )
        
        # Calculate overall score
        scores = [
            feedback_data["technical_skills"],
            feedback_data["soft_skills"],
            feedback_data["formatting"],
            feedback_data["measurable_results"],
            feedback_data["core_values"]
        ]
        overall_score = sum(scores) / len(scores)
        
        # Return data in the expected format
        return {
            "technical_skills": feedback_data["technical_skills"],
            "soft_skills": feedback_data["soft_skills"],
            "formatting": feedback_data["formatting"],
            "measurable_results": feedback_data["measurable_results"],
            "core_values": feedback_data["core_values"],
            "overall_score": overall_score,
            "section_feedback": feedback_data["section_feedback"]
        }
        
    except HTTPException as http_error:
        # Re-raise HTTP exceptions with their original status code and detail
        raise
    except Exception as e:
        print(f"Error type: {type(e)}")
        print(f"Error details: {str(e)}")
        # Return a generic error message for unexpected errors
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing your resume. Please try again."
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
