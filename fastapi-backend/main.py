from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from typing import List
import openai
import fitz  # PyMuPDF for PDF text extraction
import io
import os
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

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
    job_title: str = Form(...)
):
    try:
        resume_text = await extract_text_from_pdf(file)
        
        prompt = f"""As an expert ATS system and hiring manager at top tech companies, analyze this resume for a {job_title} position at {company}. Compare it with successful resumes that have secured interviews and offers at FAANG/top tech companies.

Provide detailed analysis in these critical areas:

1. ATS Optimization & Keyword Analysis
- Compare keywords present in this resume vs. successful {job_title} resumes
- Identify missing critical keywords that ATS systems flag for this role
- Specific formatting improvements for better ATS scoring

2. Experience Impact Analysis
- Compare achievement metrics with successful candidates
- Identify missing quantifiable results that top candidates typically showcase
- Provide specific examples of high-impact statements from successful resumes

3. Technical Skills Evaluation
- Gap analysis between this resume's tech stack and what {company} typically requires
- Missing critical technical skills that successful candidates demonstrate
- Recommended certifications/skills that increase interview chances

4. FAANG-Specific Success Patterns
- Specific patterns from successful {company} resumes that are missing here
- Examples of standout projects/achievements from candidates who got interviews
- Key differentiators that successful candidates at {company} typically showcase

5. Competitive Edge Assessment
- Direct comparison with successful resumes for similar roles
- Missing elements that make other candidates stand out
- Specific examples of successful resume sections that secured interviews

6. Action Plan for Improvement
- Prioritized list of changes needed to match successful resume patterns
- Specific examples of better phrasing/formatting from successful resumes
- Timeline-based improvement roadmap

Remember to provide specific, real-world examples from successful resumes while maintaining anonymity. Focus on actionable, detailed feedback that directly compares with proven successful resumes.

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
        
        feedback = response.choices[0].message.content
        return {"resume_feedback": feedback}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
