from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import pdfplumber
import io
import shutil
from sqlalchemy import func
import os
from datetime import datetime, timezone, timedelta 
from pydantic import BaseModel
from typing import List, Optional, Union 
import models
from database import engine, get_db
from resume_parser import parse_resume
import random
import string
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client
import bcrypt


class StudentRegister(BaseModel):
    name: str
    email: str
    phone: str
    year_of_passout: Optional[str] = ""
    degree: Optional[str] = ""
    branch: Optional[str] = ""
    experience: Optional[str] = ""
    skills: Optional[str] = ""

class StudentOTPRequest(BaseModel):
    email: str
    phone: Optional[str] = ""

class StudentOTPVerify(BaseModel):
    email: str
    otp: str

class InstituteRegister(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    institute_name: str
    institute_type: str
    address: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    pincode: Optional[str] = ""
    website: Optional[str] = ""
    description: Optional[str] = ""
    contact_person_name: Optional[str] = ""
    contact_person_designation: Optional[str] = ""
    contact_person_phone: Optional[str] = ""
    registration_number: Optional[str] = ""
    gst_number: Optional[str] = ""
    pan_number: Optional[str] = ""
    partnership_type: Optional[str] = "referral"
    display_name: Optional[str] = ""
    business_constitution: Optional[str] = ""
    year_of_establishment: Optional[str] = ""
    primary_training_domain: Optional[str] = ""
    alternate_contact_number: Optional[str] = ""
    preferred_contact_method: Optional[str] = ""
    country: Optional[str] = "India"
    district: Optional[str] = ""
    training_delivery_mode: Optional[str] = ""
    number_of_centres: Optional[str] = ""
    training_centre_addresses: Optional[str] = ""
    facilities: Optional[List[str]] = []
    courses: Optional[List[dict]] = []
    legal_business_name: Optional[str] = ""
    udyam_number: Optional[str] = ""
    government_recognition: Optional[str] = ""
    recognition_authority: Optional[str] = ""
    recognition_number: Optional[str] = ""
    recognition_validity: Optional[str] = ""

class InstituteLogin(BaseModel):
    email: str
    password: str

class InstituteCourseCreate(BaseModel):
    institute_id: int
    title: str
    description: Optional[str] = ""
    category: Optional[str] = ""
    level: Optional[str] = "Beginner"
    duration_hours: Optional[int] = 40
    duration_weeks: Optional[int] = 4
    mode: Optional[str] = "online"
    price: Optional[float] = 0
    max_students_per_batch: Optional[int] = 30
    syllabus: Optional[str] = ""
    prerequisites: Optional[str] = ""
    certification: Optional[bool] = True

class InstituteBatchCreate(BaseModel):
    institute_id: int
    course_id: int
    batch_name: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    timing: Optional[str] = ""
    days: Optional[str] = ""
    max_students: Optional[int] = 30
    trainer_name: Optional[str] = ""
    meeting_link: Optional[str] = ""

class InstituteEnrollmentRequest(BaseModel):
    institute_id: int
    course_id: int
    batch_id: Optional[int] = None
    student_id: int

class StudentProfileUpdate(BaseModel):
    education: Optional[str] = None
    courses: Optional[str] = None
    certifications: Optional[str] = None
    projects: Optional[str] = None
    experience: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    about: Optional[str] = None

from assessment import (
    generate_test_for_skill, 
    evaluate_test_submission, 
    get_test_results,
    get_available_skills_for_assessment,
    has_test_been_taken,
    get_completed_skills
)

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_APP_PASSWORD = os.getenv("SMTP_APP_PASSWORD")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH")

DATABASE_URL = os.getenv("DATABASE_URL")

if not os.path.exists("uploads"):
    os.makedirs("uploads")

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CareerPath API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://careerpath.synersyst.com",
        "http://careerpath.synersyst.com",
        "http://169.58.40.69",
        "https://169.58.40.69",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

class SkillUpdate(BaseModel):
    skill_name: Optional[str] = None
    rating: Optional[int] = None

class SkillCreate(BaseModel):
    skill_name: str

class RatingUpdate(BaseModel):
    id: int
    rating: int

class StatusUpdate(BaseModel):
    skills_rated: Optional[bool] = None
    current_step: Optional[str] = None
    skills_reviewed: Optional[bool] = None
    test_completed: Optional[bool] = None
    concept_test_completed: Optional[bool] = None

class TrainerRegister(BaseModel):
    name: str
    email: str
    phone: str
    education: str
    experience: str
    specialty: str
    role: str = "trainer"
    category: str = "regular"
    password: str

class TrainerLogin(BaseModel):
    email: str
    password: str

class AdminLogin(BaseModel):
    email: str
    password: str

class TrainerSettingsUpdate(BaseModel):
    available_days: Optional[Union[List[str], str]] = []
    available_time_start: Optional[str] = None
    available_time_end: Optional[str] = None
    about: Optional[str] = ""
    expertise: Optional[str] = ""
    qualifications: Optional[str] = ""
    hourly_rate: Optional[str] = None
    skills_taught: Optional[str] = ""


def extract_pdf_text(file_content: bytes) -> str:
    try:
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting PDF text: {str(e)}")

def clean_phone_number(phone: str) -> str:
    if not phone:
        return ""
    return ''.join(filter(str.isdigit, phone))

def normalize_phone_for_db(phone: str) -> str:
    if not phone:
        return ""
    clean = clean_phone_number(phone)
    if len(clean) == 10:
        return "+91" + clean
    if len(clean) == 11 and clean.startswith('0'):
        return "+91" + clean[1:]
    if len(clean) == 12 and clean.startswith('91'):
        return "+" + clean
    if phone.startswith('+'):
        return phone
    return "+" + clean

def find_resume_by_phone(phone: str, db: Session):
    if not phone:
        return None
    
    clean_digits = clean_phone_number(phone)
    phone_formats = [
        phone,
        clean_digits,
        "+91" + clean_digits,
        "91" + clean_digits,
        "+" + clean_digits,
    ]
    
    if len(clean_digits) == 10:
        phone_formats.append("+91" + clean_digits)
    elif len(clean_digits) == 11 and clean_digits.startswith('0'):
        phone_formats.append("+91" + clean_digits[1:])
    elif len(clean_digits) == 12 and clean_digits.startswith('91'):
        phone_formats.append("+" + clean_digits)
    
    phone_formats = list(set(phone_formats))
    
    for fmt in phone_formats:
        resume = db.query(models.Resume).filter(models.Resume.phone == fmt).first()
        if resume:
            return resume
    
    return None

def send_otp_sms(phone_number: str, otp: str, name: str = "Student"):
    try:
        phone_number = clean_phone_number(phone_number)
        
        if len(phone_number) == 10:
            phone_number = "+91" + phone_number
        elif len(phone_number) == 11 and phone_number.startswith('0'):
            phone_number = "+91" + phone_number[1:]
        elif not phone_number.startswith('+'):
            phone_number = "+" + phone_number
        
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        message = client.messages.create(
            body=f"Hello {name}! Your OTP for CareerPath is: {otp}. Valid for 5 minutes.",
            from_=TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        
        #print(f"✅ SMS sent to {phone_number}! SID: {message.sid}")
        return True, message.sid
        
    except Exception as e:
        print(f"❌ SMS Error: {str(e)}")
        return False, str(e)

def send_otp_email(email: str, otp: str, name: str = "Student"):
    try:
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">CareerPath</h1>
                </div>
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333;">Hello {name}!</h2>
                    <p style="color: #666; font-size: 16px;">Your OTP for CareerPath login is:</p>
                    <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; border: 2px dashed #667eea; margin: 20px 0;">
                        {otp}
                    </div>
                    <p style="color: #666; font-size: 14px;">This OTP is valid for <strong>5 minutes</strong>.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center;">If you didn't request this, please ignore this email.</p>
                </div>
            </body>
        </html>
        """
        
        msg = MIMEMultipart()
        msg['From'] = f"CareerPath <{SMTP_EMAIL}>"
        msg['To'] = email
        msg['Subject'] = "Your OTP for CareerPath"
        msg.attach(MIMEText(html_content, 'html'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_APP_PASSWORD.replace(' ', ''))
        server.send_message(msg)
        server.quit()
        
        #print(f"📧 Email OTP sent to {email}")  
        return True, "Email sent successfully"
        
    except Exception as e:
        print(f"❌ Email Error: {str(e)}")
        return False, str(e)

@app.post("/api/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    allowed_extensions = ['.pdf', '.docx', '.doc']
    if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
        raise HTTPException(status_code=400, detail="Only PDF, DOC, and DOCX files are allowed")
    
    file_content = await file.read()
    file_size = len(file_content)
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")
    
    try:
        extracted_text = ""
        parsed_data = {}
        
        if file.filename.lower().endswith('.pdf'):
            extracted_text = extract_pdf_text(file_content)
            parsed_data = parse_resume(extracted_text)
        elif file.filename.lower().endswith('.docx') or file.filename.lower().endswith('.doc'):
            from resume_parser import extract_text_from_docx
            extracted_text = extract_text_from_docx(file_content)
            parsed_data = parse_resume(extracted_text, file_content, file.filename)
        
        phone = parsed_data.get('phone')
        if phone:
            phone = normalize_phone_for_db(phone)
        
        existing_student = db.query(models.Resume).filter(
            func.lower(models.Resume.email) == func.lower(parsed_data.get('email', ''))
        ).first()
        
        if existing_student:
            raise HTTPException(status_code=400, detail="Email already registered as student")
        
        if phone:
            existing_phone_student = db.query(models.Resume).filter(
                models.Resume.phone == phone
            ).first()
            if existing_phone_student:
                raise HTTPException(status_code=400, detail="Phone number already registered as student")
        
        existing_trainer = db.query(models.Trainer).filter(
            func.lower(models.Trainer.email) == func.lower(parsed_data.get('email', ''))
        ).first()
        
        if existing_trainer:
            print(f"ℹ️ Email {parsed_data.get('email')} is already registered as trainer. Creating student profile as well.")
        
        resume = models.Resume(
            filename=file.filename,
            file_data=file_content,
            file_size=file_size,
            extracted_text=extracted_text,
            name=parsed_data.get('name'),
            email=parsed_data.get('email'),
            phone=phone,
            status="processed",
            processed_at=datetime.now(),
            current_step="review",
            role="student"
        )
        
        db.add(resume)
        db.flush()
        
        all_skills = parsed_data.get('skills', [])
        
        for skill_name in all_skills:
            skill = models.Skill(
                resume_id=resume.id,
                skill_name=skill_name,
                is_core=True
            )
            db.add(skill)
        
        db.commit()
        db.refresh(resume)
        
        response_data = {
            "message": "Resume uploaded successfully",
            "id": resume.id,
            "filename": resume.filename,
            "name": resume.name,
            "email": resume.email,
            "phone": resume.phone,
            "skills": all_skills
        }
        
        if existing_trainer:
            response_data["is_also_trainer"] = True
            response_data["trainer_id"] = existing_trainer.id
            response_data["message"] = "Resume uploaded successfully. You are registered as both trainer and student."
        
        return response_data
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    
@app.get("/api/resumes")
def get_all_resumes(db: Session = Depends(get_db)):
    resumes = db.query(models.Resume).order_by(models.Resume.uploaded_at.desc()).all()
    
    result = []
    for resume in resumes:
        skills = db.query(models.Skill).filter(models.Skill.resume_id == resume.id).all()
        concepts = db.query(models.ConceptSkill).filter(models.ConceptSkill.resume_id == resume.id).all()
        result.append({
            "id": resume.id,
            "filename": resume.filename,
            "name": resume.name,
            "email": resume.email,
            "phone": resume.phone,
            "skills": [s.skill_name for s in skills],
            "concepts": [c.concept_name for c in concepts],
            "uploaded_at": resume.uploaded_at,
            "current_step": resume.current_step
        })
    return result

@app.get("/api/skills/{resume_id}")  
def get_skills(resume_id: int, db: Session = Depends(get_db)):
    skills = db.query(models.Skill).filter(models.Skill.resume_id == resume_id).all()
    
    return [
        {
            "id": s.id,
            "skill_name": s.skill_name,
            "rating": s.rating,
            "rating_level": s.rating_level,
            "is_core": s.is_core if s.is_core is not None else True
        }
        for s in skills
    ]

@app.get("/api/concept-skills/{resume_id}")
def get_concept_skills(resume_id: int, db: Session = Depends(get_db)):
    concepts = db.query(models.ConceptSkill).filter(models.ConceptSkill.resume_id == resume_id).all()
    
    return [
        {
            "id": c.id,
            "concept_name": c.concept_name,
            "rating": c.rating,
            "rating_level": c.rating_level
        }
        for c in concepts
    ]

@app.put("/api/skills/{skill_id}")
def update_skill(skill_id: int, skill_data: SkillUpdate, db: Session = Depends(get_db)):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    if skill_data.skill_name is not None:
        skill.skill_name = skill_data.skill_name
    
    if skill_data.rating is not None:
        skill.rating = skill_data.rating
        if skill_data.rating <= 4:
            skill.rating_level = "Basic"
        elif skill_data.rating <= 7:
            skill.rating_level = "Intermediate"
        else:
            skill.rating_level = "Advanced"
    
    db.commit()
    db.refresh(skill)
    
    return {
        "id": skill.id,
        "skill_name": skill.skill_name,
        "rating": skill.rating,
        "rating_level": skill.rating_level,
        "is_core": skill.is_core
    }

@app.post("/api/skills/{resume_id}")
def add_skill(resume_id: int, skill_data: SkillCreate, db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    existing = db.query(models.Skill).filter(
        models.Skill.resume_id == resume_id,
        models.Skill.skill_name == skill_data.skill_name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Skill already exists")
    
    new_skill = models.Skill(
        resume_id=resume_id,
        skill_name=skill_data.skill_name,
        is_core=True
    )
    
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    
    return {
        "id": new_skill.id,
        "skill_name": new_skill.skill_name
    }

@app.delete("/api/skills/{skill_id}")
def delete_skill(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    db.delete(skill)
    db.commit()
    return {"message": "Skill deleted"}

@app.put("/api/skills/{resume_id}/ratings")
def update_ratings(resume_id: int, ratings: List[RatingUpdate], db: Session = Depends(get_db)):
    for rating_data in ratings:
        skill = db.query(models.Skill).filter(
            models.Skill.id == rating_data.id,
            models.Skill.resume_id == resume_id
        ).first()
        if skill:
            skill.rating = rating_data.rating
            if rating_data.rating <= 4:
                skill.rating_level = "Basic"
            elif rating_data.rating <= 7:
                skill.rating_level = "Intermediate"
            else:
                skill.rating_level = "Advanced"
    
    db.commit()
    return {"message": "Ratings updated"}

@app.put("/api/concept-skills/{concept_id}")
def update_concept_skill(concept_id: int, skill_data: SkillUpdate, db: Session = Depends(get_db)):
    concept = db.query(models.ConceptSkill).filter(models.ConceptSkill.id == concept_id).first()
    if not concept:
        raise HTTPException(status_code=404, detail="Concept skill not found")
    
    if skill_data.rating is not None:
        concept.rating = skill_data.rating
        if skill_data.rating <= 4:
            concept.rating_level = "Basic"
        elif skill_data.rating <= 7:
            concept.rating_level = "Intermediate"
        else:
            concept.rating_level = "Advanced"
    
    db.commit()
    db.refresh(concept)
    
    return {
        "id": concept.id,
        "concept_name": concept.concept_name,
        "rating": concept.rating,
        "rating_level": concept.rating_level
    }

@app.put("/api/concept-skills/{resume_id}/ratings")
def update_concept_ratings(resume_id: int, ratings: List[RatingUpdate], db: Session = Depends(get_db)):
    for rating_data in ratings:
        concept = db.query(models.ConceptSkill).filter(
            models.ConceptSkill.id == rating_data.id,
            models.ConceptSkill.resume_id == resume_id
        ).first()
        if concept:
            concept.rating = rating_data.rating
            if rating_data.rating <= 4:
                concept.rating_level = "Basic"
            elif rating_data.rating <= 7:
                concept.rating_level = "Intermediate"
            else:
                concept.rating_level = "Advanced"
    
    db.commit()
    return {"message": "Concept ratings updated"}

@app.put("/api/resume/{resume_id}/status")
def update_resume_status(resume_id: int, status_data: StatusUpdate, db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    if status_data.skills_rated is not None:
        resume.skills_rated = status_data.skills_rated
    if status_data.current_step is not None:
        resume.current_step = status_data.current_step
    if status_data.skills_reviewed is not None:
        resume.skills_reviewed = status_data.skills_reviewed
    if status_data.test_completed is not None:
        resume.test_completed = status_data.test_completed
    if status_data.concept_test_completed is not None:
        resume.concept_test_completed = status_data.concept_test_completed
    
    db.commit()
    return {"message": "Status updated"}

@app.post("/api/login/send-otp")
def send_login_otp(login_data: dict, db: Session = Depends(get_db)):
    """Send OTP to student's email or phone for login"""
    email = login_data.get('email')
    phone = login_data.get('phone')
    
    if not email and not phone:
        raise HTTPException(status_code=400, detail="Email or phone is required")
    
    resume = None
    contact_method = None
    
    # Check if it's an email
    if email and '@' in email and '.' in email:
        # Case-insensitive search for email
        resume = db.query(models.Resume).filter(
            func.lower(models.Resume.email) == func.lower(email.strip())
        ).first()
        contact_method = 'email'
    else:
        # It's a phone number
        phone_clean = ''.join(filter(str.isdigit, phone))
        resume = find_resume_by_phone(phone_clean, db)
        contact_method = 'phone'
    
    # If not found by email, try phone
    if not resume and email:
        phone_clean = ''.join(filter(str.isdigit, email))
        resume = find_resume_by_phone(phone_clean, db)
        contact_method = 'phone'
    
    if not resume:
        raise HTTPException(status_code=404, detail="No account found with this email/phone. Please upload resume first or register.")
    
    # Generate OTP
    otp = str(random.randint(100000, 999999))
    
    resume.otp = otp
    resume.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    resume.is_verified = False
    
    db.commit()
    db.refresh(resume)
    
    # Send OTP based on contact method
    sent = False
    
    if contact_method == 'email' and resume.email:
        sent, result = send_otp_email(resume.email, otp, resume.name or "Student")
    elif contact_method == 'phone' and resume.phone:
        sent, result = send_otp_sms(resume.phone, otp, resume.name or "Student")
    
    if sent:
        return {
            "message": f"OTP sent successfully to your {contact_method}",
            "resume_id": resume.id,
            "name": resume.name,
            "email": resume.email,
            "phone": resume.phone,
            "expires_in": "5 minutes"
        }
    else:
        return {
            "message": "OTP generated but sending failed. Check logs.",
            "otp": otp,
            "resume_id": resume.id,
            "name": resume.name,
            "email": resume.email,
            "phone": resume.phone,
            "expires_in": "5 minutes"
        }

@app.post("/api/login/verify-otp")
def verify_login_otp(verify_data: dict, db: Session = Depends(get_db)):
    otp = verify_data.get('otp')
    resume_id = verify_data.get('resume_id')
    
    if not otp or not resume_id:
        raise HTTPException(status_code=400, detail="OTP and resume_id are required")
    
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    if resume.otp != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if resume.otp_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    
    resume.is_verified = True
    resume.otp = None
    resume.otp_expires_at = None
    
    db.commit()
    db.refresh(resume)
    
    return {
        "message": "Login successful",
        "resume_id": resume.id,
        "name": resume.name,
        "email": resume.email,
        "phone": resume.phone,
        "current_step": resume.current_step,
        "has_skills": len(resume.skills) > 0,
        "skills_rated": resume.skills_rated
    }

@app.get("/api/login/check/{email_or_phone}")
def check_user_exists(email_or_phone: str, db: Session = Depends(get_db)):
    """Check if user exists with given email or phone"""
    
    resume = None
    
    # Check if it's an email
    if '@' in email_or_phone and '.' in email_or_phone:
        # Case-insensitive search
        resume = db.query(models.Resume).filter(
            func.lower(models.Resume.email) == func.lower(email_or_phone.strip())
        ).first()
    else:
        # It's a phone number
        phone_clean = ''.join(filter(str.isdigit, email_or_phone))
        resume = find_resume_by_phone(phone_clean, db)
    
    if not resume:
        return {"exists": False}
    
    return {
        "exists": True,
        "resume_id": resume.id,
        "name": resume.name,
        "email": resume.email,
        "phone": resume.phone,
        "current_step": resume.current_step,
        "skills_rated": resume.skills_rated
    }

@app.get("/api/user/progress/{resume_id}")
def get_user_progress(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    skill_count = db.query(models.Skill).filter(models.Skill.resume_id == resume_id).count()
    
    rated_skills = db.query(models.Skill).filter(
        models.Skill.resume_id == resume_id,
        models.Skill.rating.isnot(None)
    ).count()
    
    concept_count = db.query(models.ConceptSkill).filter(models.ConceptSkill.resume_id == resume_id).count()
    
    rated_concepts = db.query(models.ConceptSkill).filter(
        models.ConceptSkill.resume_id == resume_id,
        models.ConceptSkill.rating.isnot(None)
    ).count()
    
    return {
        "resume_id": resume.id,
        "name": resume.name,
        "email": resume.email,
        "phone": resume.phone,
        "current_step": resume.current_step or "review",
        "has_skills": skill_count > 0,
        "skills_rated": rated_skills > 0,
        "total_skills": skill_count,
        "rated_skills": rated_skills,
        "has_concepts": concept_count > 0,
        "concepts_rated": rated_concepts > 0,
        "total_concepts": concept_count,
        "rated_concepts": rated_concepts
    }

@app.post("/api/trainer/register")
def register_trainer(trainer_data: TrainerRegister, db: Session = Depends(get_db)):
    existing_trainer = db.query(models.Trainer).filter(models.Trainer.email == trainer_data.email).first()
    if existing_trainer:
        raise HTTPException(status_code=400, detail="Email already registered as trainer")
    
    existing_student = db.query(models.Resume).filter(models.Resume.email == trainer_data.email).first()
    if existing_student:
        # Allow trainers to also be students
        print(f"ℹ️ Email {trainer_data.email} is also a student, proceeding with trainer registration")
    
    hashed_password = bcrypt.hashpw(trainer_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    trainer = models.Trainer(
        name=trainer_data.name,
        email=trainer_data.email,
        phone=trainer_data.phone,
        password=hashed_password,
        role=trainer_data.role,
        category=trainer_data.category,
        specialty=trainer_data.specialty,
        experience=trainer_data.experience,
        education=trainer_data.education,
        is_approved=False,
        status="pending_approval"
    )
    
    db.add(trainer)
    db.commit()
    db.refresh(trainer)
    
    return {
        "message": "Trainer registered successfully. You are now registered as both trainer and student." if existing_student else "Trainer registered successfully. Please wait for admin approval.",
        "id": trainer.id,
        "name": trainer.name,
        "email": trainer.email,
        "role": trainer.role,
        "category": trainer.category,
        "status": trainer.status
    }

@app.post("/api/login/trainer")
def login_trainer(login_data: TrainerLogin, db: Session = Depends(get_db)):
    trainer = db.query(models.Trainer).filter(
        models.Trainer.email == login_data.email
    ).first()
    
    if not trainer:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not trainer.is_approved:
        raise HTTPException(status_code=403, detail="Your account is pending approval. Please wait for admin approval.")
    
    if not bcrypt.checkpw(login_data.password.encode('utf-8'), trainer.password.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "message": "Login successful",
        "id": trainer.id,
        "name": trainer.name,
        "email": trainer.email,
        "role": trainer.role,
        "category": trainer.category,
        "is_approved": trainer.is_approved
    }

@app.get("/api/trainer/settings/{trainer_id}")
def get_trainer_settings(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")

    available_days = trainer.available_days
    if isinstance(available_days, str):
        try:
            import json
            available_days = json.loads(available_days)
        except:
            available_days = []
    elif available_days is None:
        available_days = []
    elif not isinstance(available_days, list):
        available_days = []
    
    return {
        "available_days": available_days,
        "available_time_start": trainer.available_time_start or "",
        "available_time_end": trainer.available_time_end or "",
        "about": trainer.about or "",
        "expertise": trainer.expertise or "",
        "qualifications": trainer.qualifications or "",
        "hourly_rate": trainer.hourly_rate or "",
        "skills_taught": trainer.skills_taught or ""
    }

@app.put("/api/trainer/settings/{trainer_id}")
def update_trainer_settings(trainer_id: int, settings: dict, db: Session = Depends(get_db)):
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    if 'available_days' in settings:
        import json
        if isinstance(settings['available_days'], list):
            trainer.available_days = json.dumps(settings['available_days'])
        else:
            trainer.available_days = settings['available_days']
    
    if 'available_time_start' in settings:
        trainer.available_time_start = settings['available_time_start']
    if 'available_time_end' in settings:
        trainer.available_time_end = settings['available_time_end']
    if 'about' in settings:
        trainer.about = settings['about']
    if 'expertise' in settings:
        trainer.expertise = settings['expertise']
    if 'qualifications' in settings:
        trainer.qualifications = settings['qualifications']
    
    if 'hourly_rate' in settings:
        hourly_rate = settings['hourly_rate']
        if hourly_rate == "" or hourly_rate is None:
            trainer.hourly_rate = None
        else:
            try:
                trainer.hourly_rate = float(hourly_rate)
            except ValueError:
                trainer.hourly_rate = None
    
    if 'skills_taught' in settings:
        trainer.skills_taught = settings['skills_taught'] if settings['skills_taught'] else None
    
    db.commit()
    db.refresh(trainer)
    
    available_days = trainer.available_days
    if isinstance(available_days, str):
        try:
            import json
            available_days = json.loads(available_days)
        except:
            available_days = []
    elif available_days is None:
        available_days = []
    elif not isinstance(available_days, list):
        available_days = []
    
    return {
        "message": "Settings updated successfully",
        "available_days": available_days,
        "available_time_start": trainer.available_time_start,
        "available_time_end": trainer.available_time_end,
        "about": trainer.about,
        "expertise": trainer.expertise,
        "qualifications": trainer.qualifications,
        "hourly_rate": trainer.hourly_rate,
        "skills_taught": trainer.skills_taught
    }

@app.post("/api/trainer/video")
def add_trainer_video(video_data: dict, db: Session = Depends(get_db)):
    trainer_id = video_data.get('trainer_id')
    title = video_data.get('title')
    description = video_data.get('description')
    category = video_data.get('category')
    duration = video_data.get('duration')
    video_url = video_data.get('video_url')
    
    if not trainer_id or not title:
        raise HTTPException(status_code=400, detail="trainer_id and title are required")
    
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    new_video = models.TrainerContent(
        trainer_id=trainer_id,
        title=title,
        description=description,
        content_type='video',
        content_url=video_url,
        skill_name=category,
        difficulty='Beginner'
    )
    
    db.add(new_video)
    db.commit()
    db.refresh(new_video)
    
    return {"message": "Video added successfully", "id": new_video.id}

@app.get("/api/trainer/videos/{trainer_id}")
def get_trainer_videos(trainer_id: int, db: Session = Depends(get_db)):
    videos = db.query(models.TrainerContent).filter(
        models.TrainerContent.trainer_id == trainer_id,
        models.TrainerContent.content_type == 'video'
    ).order_by(models.TrainerContent.created_at.desc()).all()
    
    return [
        {
            "id": v.id,
            "title": v.title,
            "description": v.description,
            "category": v.skill_name,
            "duration": "N/A",
            "video_url": v.content_url,
            "views": 0,
            "created_at": v.created_at
        }
        for v in videos
    ]

@app.delete("/api/trainer/video/{video_id}")
def delete_trainer_video(video_id: int, db: Session = Depends(get_db)):
    video = db.query(models.TrainerContent).filter(
        models.TrainerContent.id == video_id
    ).first()
    
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    db.delete(video)
    db.commit()
    
    return {"message": "Video deleted successfully"}

@app.post("/api/member/upload")
async def upload_file(file: UploadFile = File(...), trainer_id: int = None):
    try:
        upload_dir = "uploads"
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = file.filename.replace(" ", "_")
        filename = f"{timestamp}_{safe_filename}"
        file_path = os.path.join(upload_dir, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        base_url = os.getenv("APP_BASE_URL", "https://careerpath.synersyst.com")
        url = f"{base_url}/uploads/{filename}"
        
        return {
            "url": url,
            "filename": filename,
            "size": os.path.getsize(file_path)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
@app.post("/api/member/content")
def add_content(content_data: dict, db: Session = Depends(get_db)):
    trainer_id = content_data.get('trainer_id')
    title = content_data.get('title')
    description = content_data.get('description')
    content_type = content_data.get('content_type', 'video')
    content_url = content_data.get('content_url')
    skill_name = content_data.get('skill_name')
    difficulty = content_data.get('difficulty')
    
    if not trainer_id or not title:
        raise HTTPException(status_code=400, detail="trainer_id and title are required")
    
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    new_content = models.TrainerContent(
        trainer_id=trainer_id,
        title=title,
        description=description,
        content_type=content_type,
        content_url=content_url,
        skill_name=skill_name,
        difficulty=difficulty
    )
    
    db.add(new_content)
    db.commit()
    db.refresh(new_content)
    
    return {"message": "Content added successfully", "id": new_content.id}

@app.get("/api/member/contents/{trainer_id}")
def get_contents(trainer_id: int, db: Session = Depends(get_db)):
    contents = db.query(models.TrainerContent).filter(
        models.TrainerContent.trainer_id == trainer_id
    ).order_by(models.TrainerContent.created_at.desc()).all()
    
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "content_type": c.content_type,
            "content_url": c.content_url,
            "skill_name": c.skill_name,
            "difficulty": c.difficulty,
            "created_at": c.created_at
        }
        for c in contents
    ]

@app.delete("/api/member/content/{content_id}")
def delete_content(content_id: int, db: Session = Depends(get_db)):
    content = db.query(models.TrainerContent).filter(
        models.TrainerContent.id == content_id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    db.delete(content)
    db.commit()
    
    return {"message": "Content deleted successfully"}

@app.post("/api/trainer/session")
def add_session(session_data: dict, db: Session = Depends(get_db)):
    trainer_id = session_data.get('trainer_id')
    title = session_data.get('title')
    description = session_data.get('description')
    session_date = session_data.get('session_date')
    start_time = session_data.get('start_time')
    end_time = session_data.get('end_time')
    duration_minutes = session_data.get('duration_minutes')
    max_students = session_data.get('max_students')
    price = session_data.get('price', 0)
    category = session_data.get('category')
    level = session_data.get('level')
    meeting_link = session_data.get('meeting_link')
    
    if not trainer_id or not title:
        raise HTTPException(status_code=400, detail="trainer_id and title are required")
    
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    if session_date and start_time and end_time:
        try:
            session_datetime = datetime.strptime(f"{session_date} {start_time}", "%Y-%m-%d %H:%M")
            end_datetime = datetime.strptime(f"{session_date} {end_time}", "%Y-%m-%d %H:%M")
            duration_minutes = int((end_datetime - session_datetime).total_seconds() / 60)
        except:
            pass
    
    new_session = models.TrainerSession(
        trainer_id=trainer_id,
        title=title,
        description=description,
        session_date=datetime.fromisoformat(session_date) if session_date else None,
        duration_minutes=duration_minutes,
        max_students=max_students,
        status="scheduled",
        enrolled_count=0,
        price=price,
        category=category,
        level=level,
        meeting_link=meeting_link
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    return {"message": "Session scheduled successfully", "id": new_session.id}

@app.get("/api/trainer/sessions/{trainer_id}")
def get_sessions(trainer_id: int, db: Session = Depends(get_db)):
    sessions = db.query(models.TrainerSession).filter(
        models.TrainerSession.trainer_id == trainer_id
    ).order_by(models.TrainerSession.session_date.desc()).all()
    
    return [
        {
            "id": s.id,
            "title": s.title,
            "description": s.description,
            "session_date": s.session_date,
            "duration_minutes": s.duration_minutes,
            "max_students": s.max_students,
            "enrolled_count": s.enrolled_count,
            "status": s.status,
            "price": s.price,
            "category": s.category,
            "level": s.level,
            "meeting_link": s.meeting_link,
            "created_at": s.created_at
        }
        for s in sessions
    ]

@app.delete("/api/trainer/session/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.TrainerSession).filter(
        models.TrainerSession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    
    return {"message": "Session deleted successfully"}

@app.post("/api/trainer/personalized/assign")
def assign_coaching(coaching_data: dict, db: Session = Depends(get_db)):
    trainer_id = coaching_data.get('trainer_id')
    student_id = coaching_data.get('student_id')
    student_name = coaching_data.get('student_name')
    student_email = coaching_data.get('student_email')
    skill_name = coaching_data.get('skill_name')
    current_level = coaching_data.get('current_level', 'Basic')
    target_level = coaching_data.get('target_level', 'Intermediate')
    total_sessions = coaching_data.get('total_sessions', 5)
    notes = coaching_data.get('notes')
    
    if not trainer_id or not student_id:
        raise HTTPException(status_code=400, detail="trainer_id and student_id are required")
    
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    student = db.query(models.Resume).filter(models.Resume.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    existing = db.query(models.PersonalizedCoaching).filter(
        models.PersonalizedCoaching.trainer_id == trainer_id,
        models.PersonalizedCoaching.student_id == student_id,
        models.PersonalizedCoaching.status.in_(['pending', 'active'])
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Student already assigned")
    
    new_coaching = models.PersonalizedCoaching(
        trainer_id=trainer_id,
        student_id=student_id,
        student_name=student_name or student.name,
        student_email=student_email or student.email,
        skill_name=skill_name,
        current_level=current_level,
        target_level=target_level,
        total_sessions=total_sessions,
        notes=notes,
        status="pending"
    )
    
    db.add(new_coaching)
    db.commit()
    db.refresh(new_coaching)
    
    return {"message": "Student assigned successfully", "id": new_coaching.id}

@app.get("/api/trainer/personalized/students/{trainer_id}")
def get_personalized_students(trainer_id: int, db: Session = Depends(get_db)):
    coachings = db.query(models.PersonalizedCoaching).filter(
        models.PersonalizedCoaching.trainer_id == trainer_id
    ).order_by(models.PersonalizedCoaching.created_at.desc()).all()
    
    return [
        {
            "id": c.id,
            "student_id": c.student_id,
            "student_name": c.student_name,
            "student_email": c.student_email,
            "skill_name": c.skill_name,
            "current_level": c.current_level,
            "target_level": c.target_level,
            "status": c.status,
            "session_count": c.session_count,
            "total_sessions": c.total_sessions,
            "notes": c.notes,
            "created_at": c.created_at
        }
        for c in coachings
    ]

@app.put("/api/trainer/personalized/status/{coaching_id}")
def update_coaching_status(coaching_id: int, status_data: dict, db: Session = Depends(get_db)):
    coaching = db.query(models.PersonalizedCoaching).filter(
        models.PersonalizedCoaching.id == coaching_id
    ).first()
    
    if not coaching:
        raise HTTPException(status_code=404, detail="Coaching not found")
    
    new_status = status_data.get('status')
    if new_status:
        coaching.status = new_status
        if new_status == 'active':
            coaching.session_count = coaching.session_count + 1
    
    db.commit()
    db.refresh(coaching)
    
    return {"message": "Status updated successfully"}

@app.put("/api/trainer/personalized/session/{coaching_id}")
def increment_session(coaching_id: int, db: Session = Depends(get_db)):
    coaching = db.query(models.PersonalizedCoaching).filter(
        models.PersonalizedCoaching.id == coaching_id
    ).first()
    
    if not coaching:
        raise HTTPException(status_code=404, detail="Coaching not found")
    
    coaching.session_count = coaching.session_count + 1
    
    if coaching.session_count >= coaching.total_sessions:
        coaching.status = 'completed'
    
    db.commit()
    db.refresh(coaching)
    
    return {"message": "Session count updated"}

@app.delete("/api/trainer/personalized/coaching/{coaching_id}")
def delete_coaching(coaching_id: int, db: Session = Depends(get_db)):
    coaching = db.query(models.PersonalizedCoaching).filter(
        models.PersonalizedCoaching.id == coaching_id
    ).first()
    
    if not coaching:
        raise HTTPException(status_code=404, detail="Coaching not found")
    
    db.delete(coaching)
    db.commit()
    
    return {"message": "Coaching deleted successfully"}

@app.get("/api/student/find/{email}")
def find_student_by_email(email: str, db: Session = Depends(get_db)):
    student = db.query(models.Resume).filter(
        models.Resume.email == email
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "phone": student.phone
    }

@app.post("/api/login/admin")
def login_admin(login_data: AdminLogin):
    if login_data.email != ADMIN_EMAIL:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(login_data.password.encode('utf-8'), ADMIN_PASSWORD_HASH.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "message": "Login successful",
        "name": "Admin",
        "email": ADMIN_EMAIL,
        "role": "admin"
    }

@app.get("/api/admin/students")
def get_all_students(db: Session = Depends(get_db)):
    students = db.query(models.Resume).order_by(models.Resume.uploaded_at.desc()).all()
    
    result = []
    for student in students:
        skills = db.query(models.Skill).filter(models.Skill.resume_id == student.id).all()
        result.append({
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "phone": student.phone,
            "skills": [skill.skill_name for skill in skills],
            "skills_rated": student.skills_rated,
            "test_completed": student.test_completed,
            "uploaded_at": student.uploaded_at,
            "current_step": student.current_step,
            "status": student.status
        })
    
    return result


@app.get("/api/admin/trainers")
def get_all_trainers(db: Session = Depends(get_db)):
    trainers = db.query(models.Trainer).order_by(models.Trainer.created_at.desc()).all()
    
    result = []
    for t in trainers:
        available_days = t.available_days
        if isinstance(available_days, str):
            try:
                import json
                available_days = json.loads(available_days)
            except:
                available_days = []
        elif available_days is None:
            available_days = []
        elif not isinstance(available_days, list):
            available_days = []
        
        result.append({
            "id": t.id,
            "name": t.name,
            "email": t.email,
            "phone": t.phone,
            "role": t.role,
            "category": t.category,
            "education": t.education,
            "experience": t.experience,
            "specialty": t.specialty,
            "is_approved": t.is_approved,
            "status": t.status,
            "created_at": t.created_at,
            "about": t.about or "",
            "expertise": t.expertise or "",
            "qualifications": t.qualifications or "",
            "available_days": available_days,
            "available_time_start": t.available_time_start or "",
            "available_time_end": t.available_time_end or "",
            "hourly_rate": t.hourly_rate or 0,
            "skills_taught": t.skills_taught or "",
            "rating": t.rating or 0
        })
    
    return result

@app.get("/api/admin/pending-trainers")
def get_pending_trainers(db: Session = Depends(get_db)):
    trainers = db.query(models.Trainer).filter(
        models.Trainer.is_approved == False,
        models.Trainer.status == 'pending_approval'
    ).order_by(models.Trainer.created_at.desc()).all()
    
    return [
        {
            "id": t.id,
            "name": t.name,
            "email": t.email,
            "phone": t.phone,
            "education": t.education,
            "experience": t.experience,
            "specialty": t.specialty,
            "created_at": t.created_at
        }
        for t in trainers
    ]

@app.put("/api/admin/approve-trainer/{trainer_id}")
def approve_trainer(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(models.Trainer).filter(
        models.Trainer.id == trainer_id
    ).first()
    
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    trainer.is_approved = True
    trainer.status = "approved"
    trainer.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(trainer)
    
    return {
        "message": "Trainer approved successfully",
        "id": trainer.id,
        "name": trainer.name,
        "is_approved": trainer.is_approved
    }

@app.put("/api/admin/reject-trainer/{trainer_id}")
def reject_trainer(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(models.Trainer).filter(
        models.Trainer.id == trainer_id
    ).first()
    
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    trainer.status = "rejected"
    trainer.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(trainer)
    
    return {
        "message": "Trainer rejected",
        "id": trainer.id,
        "name": trainer.name,
        "status": trainer.status
    }

@app.get("/api/test/generate/{resume_id}/{skill_name}")
def generate_test(resume_id: int, skill_name: str, db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Student not found")
    
    skill = db.query(models.Skill).filter(
        models.Skill.resume_id == resume_id,
        models.Skill.skill_name.ilike(skill_name)
    ).first()
    
    if not skill:
        raise HTTPException(status_code=404, detail=f"Skill '{skill_name}' not found")
    
    if skill.rating is None:
        raise HTTPException(status_code=400, detail="Skill not rated yet")
    
    if skill.rating <= 4:
        difficulty = "Easy"
    elif skill.rating <= 7:
        difficulty = "Medium"
    else:
        difficulty = "Hard"
    
    from assessment import has_test_been_taken
    if has_test_been_taken(resume_id, skill_name, db):
        return {
            "skill": skill_name,
            "difficulty": difficulty,
            "rating": skill.rating,
            "already_taken": True,
            "message": "You have already completed this test."
        }
    
    questions = generate_test_for_skill(skill_name, difficulty, db)
    
    if not questions:
        raise HTTPException(status_code=404, detail=f"No questions found for {skill_name} with {difficulty} difficulty")
    
    seen = set()
    unique_questions = []
    for q in questions:
        if q.id not in seen:
            seen.add(q.id)
            unique_questions.append(q)
    
    return {
        "skill": skill_name,
        "difficulty": difficulty,
        "rating": skill.rating,
        "total_questions": len(unique_questions),
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d
            }
            for q in unique_questions
        ]
    }

@app.post("/api/test/submit")
def submit_test(submission_data: dict, db: Session = Depends(get_db)):
    resume_id = submission_data.get('resume_id')
    skill_name = submission_data.get('skill_name')
    answers = submission_data.get('answers', {})
    
    if not resume_id or not skill_name:
        raise HTTPException(status_code=400, detail="resume_id and skill_name are required")
    
    results = evaluate_test_submission(resume_id, skill_name, answers, db)
    
    return results

@app.get("/api/test/results/{resume_id}/{skill_name}")
def get_test_results_by_skill(resume_id: int, skill_name: str, db: Session = Depends(get_db)):
    summary = db.query(models.TestSummary).filter(
        models.TestSummary.resume_id == resume_id,
        models.TestSummary.skill_name.ilike(skill_name)
    ).first()
    
    if not summary:
        raise HTTPException(status_code=404, detail="No test results found for this skill")
    
    results = db.query(models.TestResult).filter(
        models.TestResult.resume_id == resume_id,
        models.TestResult.skill_name.ilike(skill_name)
    ).all()
    
    details = []
    for r in results:
        question = db.query(models.Question).filter(models.Question.id == r.question_id).first()
        details.append({
            "question_id": r.question_id,
            "user_answer": r.user_answer,
            "is_correct": r.is_correct,
            "correct_answer": question.correct_answer if question else None,
            "explanation": question.explanation if question else None,
            "question_text": question.question_text if question else None,
            "option_a": question.option_a if question else None,
            "option_b": question.option_b if question else None,
            "option_c": question.option_c if question else None,
            "option_d": question.option_d if question else None
        })
    
    return {
        "summary": {
            "skill_name": summary.skill_name,
            "total_questions": summary.total_questions,
            "correct_answers": summary.correct_answers,
            "score_percentage": summary.score_percentage,
            "result_status": summary.result_status,
            "test_date": summary.test_date
        },
        "details": details
    }

@app.get("/api/test/all-results/{resume_id}")
def get_all_test_results(resume_id: int, db: Session = Depends(get_db)):
    results = db.query(models.TestSummary).filter(
        models.TestSummary.resume_id == resume_id
    ).all()
    
    return [
        {
            "skill_name": r.skill_name,
            "total_questions": r.total_questions,
            "correct_answers": r.correct_answers,
            "score_percentage": r.score_percentage,
            "result_status": r.result_status,
            "test_date": r.test_date
        }
        for r in results
    ]

@app.post("/api/admin/question")
def add_question(question_data: dict, db: Session = Depends(get_db)):
    new_question = models.Question(
        skill_name=question_data.get('skill_name'),
        difficulty=question_data.get('difficulty'),
        question_text=question_data.get('question_text'),
        option_a=question_data.get('option_a'),
        option_b=question_data.get('option_b'),
        option_c=question_data.get('option_c'),
        option_d=question_data.get('option_d'),
        correct_answer=question_data.get('correct_answer'),
        explanation=question_data.get('explanation')
    )
    
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    
    return {"message": "Question added successfully", "id": new_question.id}

@app.get("/api/admin/questions")
def get_all_questions(db: Session = Depends(get_db)):
    questions = db.query(models.Question).all()
    
    return [
        {
            "id": q.id,
            "skill_name": q.skill_name,
            "difficulty": q.difficulty,
            "question_text": q.question_text,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "correct_answer": q.correct_answer,
            "explanation": q.explanation
        }
        for q in questions
    ]

@app.get("/api/admin/questions/{skill_name}")
def get_questions_by_skill(skill_name: str, db: Session = Depends(get_db)):
    questions = db.query(models.Question).filter(
        models.Question.skill_name == skill_name
    ).all()
    
    return [
        {
            "id": q.id,
            "skill_name": q.skill_name,
            "difficulty": q.difficulty,
            "question_text": q.question_text,
            "options": {
                "A": q.option_a,
                "B": q.option_b,
                "C": q.option_c,
                "D": q.option_d
            },
            "correct_answer": q.correct_answer,
            "explanation": q.explanation
        }
        for q in questions
    ]

@app.put("/api/admin/question/{question_id}")
def update_question(question_id: int, question_data: dict, db: Session = Depends(get_db)):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    for key, value in question_data.items():
        if hasattr(question, key) and value is not None:
            setattr(question, key, value)
    
    db.commit()
    db.refresh(question)
    
    return {"message": "Question updated successfully"}

@app.delete("/api/admin/question/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db.delete(question)
    db.commit()
    
    return {"message": "Question deleted successfully"}

@app.get("/api/admin/skills-list")
def get_all_skill_names(db: Session = Depends(get_db)):
    skills = db.query(models.Question.skill_name).distinct().all()
    return {"skills": [s[0] for s in skills]}

@app.get("/api/assessment/skills/{resume_id}")
def get_assessment_skills(resume_id: int, db: Session = Depends(get_db)):
    from assessment import get_available_skills_for_assessment
    return get_available_skills_for_assessment(resume_id, db)

@app.post("/api/admin/skill")
def add_admin_skill(skill_data: dict, db: Session = Depends(get_db)):
    skill_name = skill_data.get('skill_name')
    if not skill_name:
        raise HTTPException(status_code=400, detail="Skill name is required")
    
    existing = db.query(models.Question).filter(
        models.Question.skill_name == skill_name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Skill already exists")
    
    new_question = models.Question(
        skill_name=skill_name,
        difficulty='Medium',
        question_text=f'Question for {skill_name} - please edit',
        option_a='Option A',
        option_b='Option B',
        option_c='Option C',
        option_d='Option D',
        correct_answer='A',
        explanation=''
    )
    
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    
    return {"message": f"Skill '{skill_name}' added successfully", "id": new_question.id}

@app.get("/api/test/completed/{resume_id}")
def get_completed_skills(resume_id: int, db: Session = Depends(get_db)):
    from assessment import get_completed_skills
    completed = get_completed_skills(resume_id, db)
    return {"completed": completed}


# ====== STUDENT LEARNING RESOURCES ENDPOINTS ======

@app.get("/api/student/content/{student_id}")
def get_student_content(student_id: int, db: Session = Depends(get_db)):
    """Get all learning content categorized by role"""
    
    student = db.query(models.Resume).filter(models.Resume.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    trainers = db.query(models.Trainer).filter(
        models.Trainer.is_approved == True
    ).all()
    
    result = {
        "regular_content": [],
        "member_content": [],
        "personalized_coaches": []
    }
    
    for trainer in trainers:
        contents = db.query(models.TrainerContent).filter(
            models.TrainerContent.trainer_id == trainer.id
        ).all()
        
        if not contents:
            continue
        
        trainer_data = {
            "trainer_id": trainer.id,
            "trainer_name": trainer.name,
            "role": trainer.role,  # member or trainer
            "category": trainer.category,  # regular or personalized
            "specialty": trainer.specialty,
            "hourly_rate": trainer.hourly_rate,
            "contents": [
                {
                    "id": c.id,
                    "title": c.title,
                    "description": c.description,
                    "content_type": c.content_type,
                    "content_url": c.content_url,
                    "skill_name": c.skill_name,
                    "difficulty": c.difficulty,
                    "created_at": c.created_at
                }
                for c in contents
            ]
        }
        
        # Categorize based on ROLE first
        if trainer.role == "member":
            result["member_content"].append(trainer_data)
        elif trainer.role == "trainer":
            if trainer.category == "regular":
                result["regular_content"].append(trainer_data)
            elif trainer.category == "personalized":
                # Also add to personalized coaches
                result["personalized_coaches"].append({
                    "trainer_id": trainer.id,
                    "trainer_name": trainer.name,
                    "role": trainer.role,
                    "category": trainer.category,
                    "specialty": trainer.specialty,
                    "skills_taught": trainer.skills_taught,
                    "about": trainer.about,
                    "hourly_rate": trainer.hourly_rate,
                    "available_days": trainer.available_days,
                    "available_time_start": trainer.available_time_start,
                    "available_time_end": trainer.available_time_end,
                    "qualifications": trainer.qualifications,
                    "experience": trainer.experience,
                    "education": trainer.education,
                    "rating": trainer.rating
                })
    
    return result

@app.get("/api/student/trainer-content/{trainer_id}")
def get_trainer_content(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    contents = db.query(models.TrainerContent).filter(
        models.TrainerContent.trainer_id == trainer_id
    ).order_by(models.TrainerContent.created_at.desc()).all()
    
    return {
        "trainer_id": trainer.id,
        "trainer_name": trainer.name,
        "role": trainer.role,
        "category": trainer.category,
        "specialty": trainer.specialty,
        "about": trainer.about,
        "hourly_rate": trainer.hourly_rate,
        "contents": [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "content_type": c.content_type,
                "content_url": c.content_url,
                "skill_name": c.skill_name,
                "difficulty": c.difficulty,
                "created_at": c.created_at
            }
            for c in contents
        ]
    }

@app.get("/api/student/recommended-content/{student_id}")
def get_recommended_content(student_id: int, db: Session = Depends(get_db)):
    """Get content recommended based on student's skills and ratings"""
    student_skills = db.query(models.Skill).filter(
        models.Skill.resume_id == student_id,
        models.Skill.rating.isnot(None)
    ).all()
    
    skill_names = [s.skill_name for s in student_skills]
    recommended = []
    
    # Find trainers who teach these skills
    for skill in student_skills:
        trainers = db.query(models.Trainer).filter(
            models.Trainer.is_approved == True,
            models.Trainer.skills_taught.ilike(f"%{skill.skill_name}%")
        ).all()
        
        for trainer in trainers:
            contents = db.query(models.TrainerContent).filter(
                models.TrainerContent.trainer_id == trainer.id,
                models.TrainerContent.skill_name == skill.skill_name
            ).all()
            
            for content in contents:
                recommended.append({
                    "content_id": content.id,
                    "title": content.title,
                    "description": content.description,
                    "content_type": content.content_type,
                    "content_url": content.content_url,
                    "skill_name": content.skill_name,
                    "trainer_name": trainer.name,
                    "trainer_id": trainer.id,
                    "difficulty": content.difficulty,
                    "created_at": content.created_at
                })
    
    return {"recommended": recommended}

@app.get("/api/student/personalized-trainers/{student_id}")
def get_personalized_trainers_for_student(student_id: int, db: Session = Depends(get_db)):
    """Get personalized trainers available for the student"""
    
    student = db.query(models.Resume).filter(models.Resume.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get student's skills
    skills = db.query(models.Skill).filter(models.Skill.resume_id == student_id).all()
    skill_names = [s.skill_name for s in skills]
    
    # Get all personalized trainers
    trainers = db.query(models.Trainer).filter(
        models.Trainer.is_approved == True,
        models.Trainer.category == "personalized"
    ).all()
    
    result = []
    for trainer in trainers:
        trainer_skills = trainer.skills_taught.split(',') if trainer.skills_taught else []
        matching_skills = [s for s in skill_names if any(s.lower() in ts.lower() for ts in trainer_skills)]
        
        result.append({
            "trainer_id": trainer.id,
            "trainer_name": trainer.name,
            "specialty": trainer.specialty,
            "skills_taught": trainer.skills_taught,
            "matching_skills": matching_skills,
            "about": trainer.about,
            "hourly_rate": trainer.hourly_rate,
            "available_days": trainer.available_days,
            "available_time_start": trainer.available_time_start,
            "available_time_end": trainer.available_time_end,
            "qualifications": trainer.qualifications,
            "experience": trainer.experience,
            "education": trainer.education,
            "rating": trainer.rating,
            "match_score": len(matching_skills) / max(len(skill_names), 1) * 100 if skill_names else 0
        })
    
    result.sort(key=lambda x: x['match_score'], reverse=True)
    
    return result

# ====== STUDENT REGISTRATION ENDPOINTS ======

otp_storage = {}

@app.get("/api/student/check-email/{email}")
def check_email_exists(email: str, db: Session = Depends(get_db)):
    """Check if email already registered"""
    existing = db.query(models.Resume).filter(models.Resume.email == email).first()
    return {"exists": existing is not None}

@app.get("/api/student/check-phone/{phone}")
def check_phone_exists(phone: str, db: Session = Depends(get_db)):
    """Check if phone number already registered"""
    existing = db.query(models.Resume).filter(models.Resume.phone == phone).first()
    return {"exists": existing is not None}

@app.post("/api/student/send-otp")
def student_send_otp(request: StudentOTPRequest, db: Session = Depends(get_db)):
    """Send OTP for student registration"""
    email = request.email
    phone = request.phone
    
    if not email and not phone:
        raise HTTPException(status_code=400, detail="Email or phone is required")
    
    # Check if email already exists
    if email:
        existing = db.query(models.Resume).filter(models.Resume.email == email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered. Please login.")
    
    if phone:
        existing = db.query(models.Resume).filter(models.Resume.phone == phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone already registered. Please login.")
    
    otp = str(random.randint(100000, 999999))
    
    # Store OTP
    otp_storage[email or phone] = {
        "otp": otp,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
    }
    
    # Send OTP via email
    if email:
        sent, result = send_otp_email(email, otp, "Student")
        if sent:
            return {
                "message": "OTP sent to your email",
                "email": email,
                "expires_in": "5 minutes"
            }
    
    # If email fails, try SMS
    if phone:
        sent, result = send_otp_sms(phone, otp, "Student")
        if sent:
            return {
                "message": "OTP sent to your phone",
                "phone": phone,
                "expires_in": "5 minutes"
            }
    
    # If both fail, return OTP for testing
    print(f"⚠️ OTP for testing: {otp}")
    return {
        "message": "OTP generated. For testing, use: " + otp,
        "otp": otp,
        "expires_in": "5 minutes"
    }

@app.post("/api/student/verify-otp")
def student_verify_otp(request: StudentOTPVerify, db: Session = Depends(get_db)):
    """Verify OTP for student registration"""
    email = request.email
    otp = request.otp
    
    if not email or not otp:
        raise HTTPException(status_code=400, detail="Email and OTP are required")
    
    stored_data = otp_storage.get(email)
    
    if not stored_data:
        raise HTTPException(status_code=400, detail="OTP not found. Please request a new one.")
    
    if stored_data["expires_at"] < datetime.now(timezone.utc):
        del otp_storage[email]
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    
    if stored_data["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")
    
    del otp_storage[email]
    
    return {
        "verified": True,
        "email": email,
        "message": "OTP verified successfully"
    }

@app.post("/api/student/register")
def student_register(register_data: StudentRegister, db: Session = Depends(get_db)):
    """Register student without resume"""
    
    if not register_data.name:
        raise HTTPException(status_code=400, detail="Name is required")
    
    if not register_data.email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    if not register_data.phone:
        raise HTTPException(status_code=400, detail="Phone number is required")
    
    # Clean phone
    clean_phone = ''.join(filter(str.isdigit, register_data.phone))
    if len(clean_phone) != 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit phone number")
    
    # Check existing records
    existing_phone = db.query(models.Resume).filter(
        models.Resume.phone == register_data.phone
    ).first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    existing_email = db.query(models.Resume).filter(
        func.lower(models.Resume.email) == func.lower(register_data.email.strip())
    ).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create education text
    education_text = ""
    if register_data.degree:
        education_text += register_data.degree
    if register_data.branch:
        education_text += " in " + register_data.branch
    if register_data.year_of_passout:
        education_text += " (" + register_data.year_of_passout + ")"
    
    # Create student record
    resume = models.Resume(
        filename="registered_without_resume",
        file_data=b"", 
        file_size=0,
        extracted_text="",
        name=register_data.name.strip(),
        email=register_data.email.strip().lower(),
        phone=register_data.phone.strip(),
        year_of_passout=register_data.year_of_passout or "",
        degree=register_data.degree or "",
        branch=register_data.branch or "",
        experience=register_data.experience or "",
        registered_without_resume=True,
        education=education_text,
        role="student",
        status="active",
        current_step="review",
        is_verified=True,
        uploaded_at=datetime.now(timezone.utc)
    )
    
    db.add(resume)
    db.flush()
    
    # Add skills
    if register_data.skills:
        skill_list = [s.strip() for s in register_data.skills.split(',') if s.strip()]
        for skill_name in skill_list:
            skill = models.Skill(
                resume_id=resume.id,
                skill_name=skill_name,
                is_core=True
            )
            db.add(skill)
    
    db.commit()
    db.refresh(resume)
    
    return {
        "message": "Student registered successfully",
        "id": resume.id,
        "name": resume.name,
        "phone": resume.phone,
        "email": resume.email
    }

# ====== REFERRAL ENDPOINTS ======

import time

def generate_referral_code(name):
    name_part = name[:3].upper() if name else "STU"
    timestamp_part = str(int(time.time()))[-4:]
    random_part = ''.join(random.choices(string.digits, k=2))
    return f"{name_part}{timestamp_part}{random_part}"

@app.post("/api/generate-referral")
def generate_referral_code_for_user(gen_data: dict, db: Session = Depends(get_db)):
    identifier = gen_data.get('identifier')
    name = gen_data.get('name', 'Student')
    email = gen_data.get('email', '')
    
    if not identifier:
        raise HTTPException(status_code=400, detail="Identifier required")
    
    resume = None
    
    # Try finding by email first
    if email:
        resume = db.query(models.Resume).filter(
            func.lower(models.Resume.email) == func.lower(email)
        ).first()
    
    # Try by identifier as email
    if not resume and '@' in str(identifier):
        resume = db.query(models.Resume).filter(
            func.lower(models.Resume.email) == func.lower(str(identifier))
        ).first()
    
    # Try by ID
    if not resume and str(identifier).isdigit():
        resume = db.query(models.Resume).filter(
            models.Resume.id == int(identifier)
        ).first()
    
    # Try by phone
    if not resume:
        resume = db.query(models.Resume).filter(
            models.Resume.phone == identifier
        ).first()
    
    if not resume:
        # Create a new student record
        resume = models.Resume(
            name=name,
            email=email if email else identifier,
            status="active",
            registered_without_resume=True
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)
    
    if resume.referral_code:
        return {
            "referral_code": resume.referral_code,
            "message": "Referral code already exists",
            "referral_link": f"https://careerpath.synersyst.com/register?ref={resume.referral_code}"
        }
    
    code = generate_referral_code(name)
    counter = 0
    while db.query(models.Resume).filter(models.Resume.referral_code == code).first():
        code = generate_referral_code(name + str(counter))
        counter += 1
    
    resume.referral_code = code
    resume.referral_count = 0
    resume.referral_earnings = 0
    db.commit()
    db.refresh(resume)
    
    return {
        "referral_code": code,
        "message": "Referral code generated successfully",
        "referral_link": f"https://careerpath.synersyst.com/register?ref={code}"
    }

@app.get("/api/referral/{identifier}")
def get_referral_info(identifier: str, db: Session = Depends(get_db)):
    resume = None
    
    # Try by email first
    if '@' in str(identifier):
        resume = db.query(models.Resume).filter(
            func.lower(models.Resume.email) == func.lower(str(identifier))
        ).first()
    
    # Try by referral code
    if not resume:
        resume = db.query(models.Resume).filter(
            models.Resume.referral_code == identifier
        ).first()
    
    # Try by ID
    if not resume and str(identifier).isdigit():
        resume = db.query(models.Resume).filter(
            models.Resume.id == int(identifier)
        ).first()
    
    # Try by phone
    if not resume:
        resume = db.query(models.Resume).filter(
            models.Resume.phone == identifier
        ).first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Count referred users
    referred_count = db.query(models.Resume).filter(
        models.Resume.referred_by == resume.referral_code
    ).count()
    
    # Get referred users list
    referred_users = db.query(models.Resume).filter(
        models.Resume.referred_by == resume.referral_code
    ).all()
    
    return {
        "referral_code": resume.referral_code,
        "referral_count": resume.referral_count or 0,
        "referral_earnings": resume.referral_earnings or 0,
        "referred_count": referred_count,
        "referred_users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "joined_at": u.uploaded_at
            }
            for u in referred_users
        ],
        "referral_link": f"https://careerpath.synersyst.com/register?ref={resume.referral_code}"
    }

@app.post("/api/referral/apply")
def apply_referral(apply_data: dict, db: Session = Depends(get_db)):
    referral_code = apply_data.get('referral_code')
    student_id = apply_data.get('student_id')
    student_email = apply_data.get('student_email', '')
    
    if not referral_code:
        raise HTTPException(status_code=400, detail="Referral code required")
    
    # Check if referral code exists
    referrer = db.query(models.Resume).filter(
        models.Resume.referral_code == referral_code
    ).first()
    
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    # Find the student
    student = None
    
    # Try by student_email first
    if student_email:
        student = db.query(models.Resume).filter(
            func.lower(models.Resume.email) == func.lower(student_email)
        ).first()
    
    # Try by student_id
    if not student and student_id:
        if str(student_id).isdigit():
            student = db.query(models.Resume).filter(
                models.Resume.id == int(student_id)
            ).first()
        if not student:
            student = db.query(models.Resume).filter(
                models.Resume.email == student_id
            ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Don't allow self-referral
    if referrer.id == student.id:
        raise HTTPException(status_code=400, detail="You cannot refer yourself")
    
    # Check if student already applied a referral
    if student.referred_by:
        raise HTTPException(status_code=400, detail="You have already applied a referral code")
    
    # Apply referral - give points to referrer
    student.referred_by = referral_code
    referrer.referral_count = (referrer.referral_count or 0) + 1
    referrer.referral_earnings = (referrer.referral_earnings or 0) + 10
    
    # Also give 10 points to the new student (referred person)
    student.referral_earnings = (student.referral_earnings or 0) + 10
    
    db.commit()
    
    return {
        "message": "Referral applied successfully! You both earned 10 points!",
        "referrer": {
            "id": referrer.id,
            "name": referrer.name,
            "email": referrer.email
        },
        "student": {
            "id": student.id,
            "name": student.name,
            "email": student.email
        },
        "referral_code": referral_code,
        "reward": "10 points added to both accounts"
    }

@app.get("/api/referral/check/{student_id}")
def check_referral_applied(student_id: str, db: Session = Depends(get_db)):
    """Check if a student has already applied a referral code"""
    student = None
    
    # Try by ID
    if str(student_id).isdigit():
        student = db.query(models.Resume).filter(
            models.Resume.id == int(student_id)
        ).first()
    
    # Try by email
    if not student:
        student = db.query(models.Resume).filter(
            func.lower(models.Resume.email) == func.lower(str(student_id))
        ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return {
        "has_applied": student.referred_by is not None,
        "referred_by": student.referred_by,
        "student_id": student.id,
        "student_name": student.name,
        "student_email": student.email
    }
# ====== ENROLLMENT AND ATTENDANCE ENDPOINTS ======

class EnrollmentRequest(BaseModel):
    student_id: int
    session_id: int

class AttendanceRequest(BaseModel):
    student_id: int
    session_id: int
    status: str  # present, absent, late
    notes: Optional[str] = ""

class ProgressUpdate(BaseModel):
    progress: int

@app.post("/api/enroll")
def enroll_student(enrollment_data: EnrollmentRequest, db: Session = Depends(get_db)):
    """Enroll a student in a course session"""
    
    # Check if student exists
    student = db.query(models.Resume).filter(models.Resume.id == enrollment_data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if session exists
    session = db.query(models.TrainerSession).filter(models.TrainerSession.id == enrollment_data.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if already enrolled
    existing = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == enrollment_data.student_id,
        models.Enrollment.session_id == enrollment_data.session_id,
        models.Enrollment.status.in_(['enrolled', 'completed'])
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled in this course")
    
    # Check capacity
    current_enrolled = db.query(models.Enrollment).filter(
        models.Enrollment.session_id == enrollment_data.session_id,
        models.Enrollment.status == 'enrolled'
    ).count()
    
    if current_enrolled >= session.max_students:
        # Add to waitlist
        import json
        waitlist = json.loads(session.waitlist) if session.waitlist else []
        if enrollment_data.student_id not in waitlist:
            waitlist.append(enrollment_data.student_id)
            session.waitlist = json.dumps(waitlist)
            db.commit()
        raise HTTPException(status_code=400, detail="Course is full. Added to waitlist.")
    
    # Create enrollment
    enrollment = models.Enrollment(
        student_id=enrollment_data.student_id,
        session_id=enrollment_data.session_id,
        status="enrolled",
        progress=0
    )
    
    db.add(enrollment)
    session.enrolled_count = current_enrolled + 1
    db.commit()
    db.refresh(enrollment)
    
    return {
        "message": "Student enrolled successfully",
        "enrollment_id": enrollment.id,
        "student_id": enrollment.student_id,
        "session_id": enrollment.session_id,
        "status": enrollment.status
    }

@app.get("/api/enrollments/{student_id}")
def get_student_enrollments(student_id: int, db: Session = Depends(get_db)):
    """Get all enrollments for a student"""
    
    student = db.query(models.Resume).filter(models.Resume.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == student_id
    ).all()
    
    result = []
    for enrollment in enrollments:
        session = db.query(models.TrainerSession).filter(
            models.TrainerSession.id == enrollment.session_id
        ).first()
        
        if session:
            trainer = db.query(models.Trainer).filter(
                models.Trainer.id == session.trainer_id
            ).first()
            
            # Get attendance count
            attendance_count = db.query(models.Attendance).filter(
                models.Attendance.student_id == student_id,
                models.Attendance.session_id == session.id,
                models.Attendance.status == 'present'
            ).count()
            
            total_attendance = db.query(models.Attendance).filter(
                models.Attendance.student_id == student_id,
                models.Attendance.session_id == session.id
            ).count()
            
            attendance_percentage = (attendance_count / total_attendance * 100) if total_attendance > 0 else 0
            
            result.append({
                "enrollment_id": enrollment.id,
                "session_id": session.id,
                "session_title": session.title,
                "trainer_name": trainer.name if trainer else "Unknown",
                "trainer_id": session.trainer_id,
                "status": enrollment.status,
                "progress": enrollment.progress,
                "enrolled_at": enrollment.enrolled_at,
                "attendance_percentage": round(attendance_percentage, 2),
                "present_days": attendance_count,
                "total_days": total_attendance
            })
    
    return result

@app.put("/api/enrollment/{enrollment_id}/progress")
def update_progress(enrollment_id: int, progress_data: ProgressUpdate, db: Session = Depends(get_db)):
    """Update student's progress in a course"""
    
    enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.id == enrollment_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    enrollment.progress = progress_data.progress
    
    if progress_data.progress >= 100:
        enrollment.status = "completed"
    
    db.commit()
    db.refresh(enrollment)
    
    return {
        "message": "Progress updated",
        "enrollment_id": enrollment.id,
        "progress": enrollment.progress,
        "status": enrollment.status
    }

@app.get("/api/enrollment/session/{session_id}/students")
def get_session_students(session_id: int, db: Session = Depends(get_db)):
    """Get all students enrolled in a session (for trainers)"""
    
    session = db.query(models.TrainerSession).filter(
        models.TrainerSession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.session_id == session_id,
        models.Enrollment.status == 'enrolled'
    ).all()
    
    result = []
    for enrollment in enrollments:
        student = db.query(models.Resume).filter(
            models.Resume.id == enrollment.student_id
        ).first()
        
        if student:
            # Get today's attendance
            today = datetime.now(timezone.utc).date()
            today_attendance = db.query(models.Attendance).filter(
                models.Attendance.student_id == student.id,
                models.Attendance.session_id == session_id,
                func.date(models.Attendance.date) == today
            ).first()
            
            # Get attendance stats
            attendance_count = db.query(models.Attendance).filter(
                models.Attendance.student_id == student.id,
                models.Attendance.session_id == session_id,
                models.Attendance.status == 'present'
            ).count()
            
            total_attendance = db.query(models.Attendance).filter(
                models.Attendance.student_id == student.id,
                models.Attendance.session_id == session_id
            ).count()
            
            attendance_percentage = (attendance_count / total_attendance * 100) if total_attendance > 0 else 0
            
            result.append({
                "student_id": student.id,
                "student_name": student.name,
                "student_email": student.email,
                "enrollment_id": enrollment.id,
                "progress": enrollment.progress,
                "today_status": today_attendance.status if today_attendance else "not_marked",
                "attendance_percentage": round(attendance_percentage, 2),
                "present_days": attendance_count,
                "total_days": total_attendance
            })
    
    return result

@app.post("/api/attendance/mark")
def mark_attendance(attendance_data: AttendanceRequest, db: Session = Depends(get_db)):
    """Mark attendance for a student"""
    
    # Check if student exists
    student = db.query(models.Resume).filter(models.Resume.id == attendance_data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if session exists
    session = db.query(models.TrainerSession).filter(
        models.TrainerSession.id == attendance_data.session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if already marked today
    today = datetime.now(timezone.utc).date()
    existing = db.query(models.Attendance).filter(
        models.Attendance.student_id == attendance_data.student_id,
        models.Attendance.session_id == attendance_data.session_id,
        func.date(models.Attendance.date) == today
    ).first()
    
    if existing:
        # Update existing attendance
        existing.status = attendance_data.status
        existing.notes = attendance_data.notes or existing.notes
        existing.marked_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return {
            "message": "Attendance updated",
            "attendance_id": existing.id,
            "student_id": existing.student_id,
            "status": existing.status,
            "date": existing.date
        }
    
    # Create new attendance record
    attendance = models.Attendance(
        student_id=attendance_data.student_id,
        session_id=attendance_data.session_id,
        status=attendance_data.status,
        notes=attendance_data.notes,
        marked_by=None  # Will be set if trainer is logged in
    )
    
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    
    return {
        "message": "Attendance marked successfully",
        "attendance_id": attendance.id,
        "student_id": attendance.student_id,
        "status": attendance.status,
        "date": attendance.date
    }

@app.get("/api/attendance/{student_id}/{session_id}")
def get_attendance(student_id: int, session_id: int, db: Session = Depends(get_db)):
    """Get attendance records for a student in a session"""
    
    attendance_records = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id,
        models.Attendance.session_id == session_id
    ).order_by(models.Attendance.date.desc()).all()
    
    result = []
    for record in attendance_records:
        result.append({
            "id": record.id,
            "date": record.date,
            "status": record.status,
            "notes": record.notes,
            "marked_at": record.marked_at
        })
    
    return result

@app.get("/api/attendance/session/{session_id}")
def get_session_attendance(session_id: int, db: Session = Depends(get_db)):
    """Get all attendance records for a session (for trainers)"""
    
    attendance_records = db.query(models.Attendance).filter(
        models.Attendance.session_id == session_id
    ).order_by(models.Attendance.date.desc()).all()
    
    result = []
    for record in attendance_records:
        student = db.query(models.Resume).filter(
            models.Resume.id == record.student_id
        ).first()
        
        result.append({
            "id": record.id,
            "student_id": record.student_id,
            "student_name": student.name if student else "Unknown",
            "date": record.date,
            "status": record.status,
            "notes": record.notes,
            "marked_at": record.marked_at
        })
    
    return result

@app.get("/api/attendance/student/{student_id}/summary")
def get_student_attendance_summary(student_id: int, db: Session = Depends(get_db)):
    """Get attendance summary for a student across all sessions"""
    
    # Get all enrollments
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == student_id
    ).all()
    
    result = []
    for enrollment in enrollments:
        session = db.query(models.TrainerSession).filter(
            models.TrainerSession.id == enrollment.session_id
        ).first()
        
        if session:
            attendance_count = db.query(models.Attendance).filter(
                models.Attendance.student_id == student_id,
                models.Attendance.session_id == session.id,
                models.Attendance.status == 'present'
            ).count()
            
            total_attendance = db.query(models.Attendance).filter(
                models.Attendance.student_id == student_id,
                models.Attendance.session_id == session.id
            ).count()
            
            attendance_percentage = (attendance_count / total_attendance * 100) if total_attendance > 0 else 0
            
            result.append({
                "session_id": session.id,
                "session_title": session.title,
                "present_days": attendance_count,
                "total_days": total_attendance,
                "attendance_percentage": round(attendance_percentage, 2)
            })
    
    return result

# ====== CONTENT APPROVAL ENDPOINTS ======

@app.get("/api/admin/content/pending")
def get_pending_content(db: Session = Depends(get_db)):
    """Admin gets pending content for approval"""
    content = db.query(models.TrainerContent).filter(
        models.TrainerContent.is_approved == False,
        models.TrainerContent.status == "pending"
    ).order_by(models.TrainerContent.created_at.desc()).all()
    
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "content_type": c.content_type,
            "content_url": c.content_url,
            "skill_name": c.skill_name,
            "difficulty": c.difficulty,
            "trainer_id": c.trainer_id,
            "trainer_name": c.trainer.name if c.trainer else "Unknown",
            "trainer_email": c.trainer.email if c.trainer else "Unknown",
            "created_at": c.created_at,
            "status": c.status,
            "is_approved": c.is_approved
        }
        for c in content
    ]


@app.get("/api/admin/content/all")
def get_all_content(db: Session = Depends(get_db)):
    """Admin gets all content with status"""
    content = db.query(models.TrainerContent).order_by(
        models.TrainerContent.created_at.desc()
    ).all()
    
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "content_type": c.content_type,
            "content_url": c.content_url,
            "skill_name": c.skill_name,
            "difficulty": c.difficulty,
            "is_approved": c.is_approved,
            "status": c.status,
            "admin_notes": c.admin_notes,
            "trainer_id": c.trainer_id,
            "trainer_name": c.trainer.name if c.trainer else "Unknown",
            "created_at": c.created_at,
            "approved_at": c.approved_at,
            "rejected_at": c.rejected_at
        }
        for c in content
    ]


@app.put("/api/admin/content/{content_id}/approve")
def approve_content(content_id: int, approval_data: dict = None, db: Session = Depends(get_db)):
    """Admin approves content"""
    content = db.query(models.TrainerContent).filter(
        models.TrainerContent.id == content_id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    content.is_approved = True
    content.status = "approved"
    content.approved_at = datetime.now(timezone.utc)
    content.rejected_at = None
    
    if approval_data and approval_data.get('admin_notes'):
        content.admin_notes = approval_data.get('admin_notes')
    
    db.commit()
    db.refresh(content)
    
    return {
        "message": "Content approved successfully",
        "id": content.id,
        "status": content.status,
        "is_approved": content.is_approved
    }


@app.put("/api/admin/content/{content_id}/reject")
def reject_content(content_id: int, reject_data: dict, db: Session = Depends(get_db)):
    """Admin rejects content with reason"""
    content = db.query(models.TrainerContent).filter(
        models.TrainerContent.id == content_id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    content.is_approved = False
    content.status = "rejected"
    content.rejected_at = datetime.now(timezone.utc)
    content.approved_at = None
    content.admin_notes = reject_data.get('admin_notes', 'No reason provided')
    
    db.commit()
    db.refresh(content)
    
    return {
        "message": "Content rejected",
        "id": content.id,
        "status": content.status,
        "admin_notes": content.admin_notes
    }


@app.get("/api/trainer/content/{trainer_id}")
def get_trainer_content_with_status(trainer_id: int, db: Session = Depends(get_db)):
    """Trainer gets their content with approval status"""
    content = db.query(models.TrainerContent).filter(
        models.TrainerContent.trainer_id == trainer_id
    ).order_by(models.TrainerContent.created_at.desc()).all()
    
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "content_type": c.content_type,
            "content_url": c.content_url,
            "skill_name": c.skill_name,
            "difficulty": c.difficulty,
            "is_approved": c.is_approved,
            "status": c.status,
            "admin_notes": c.admin_notes,
            "created_at": c.created_at,
            "approved_at": c.approved_at,
            "rejected_at": c.rejected_at
        }
        for c in content
    ]


# ====== COURSE APPROVAL ENDPOINTS ======

@app.post("/api/trainer/course")
def create_course(course_data: dict, db: Session = Depends(get_db)):
    """Trainer creates a course (pending approval)"""
    trainer_id = course_data.get('trainer_id')
    title = course_data.get('title')
    description = course_data.get('description')
    category = course_data.get('category')
    level = course_data.get('level')
    duration_minutes = course_data.get('duration_minutes', 60)
    max_students = course_data.get('max_students', 10)
    price = course_data.get('price', 0)
    meeting_link = course_data.get('meeting_link')
    
    if not trainer_id or not title:
        raise HTTPException(status_code=400, detail="trainer_id and title are required")
    
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    if not trainer.is_approved:
        raise HTTPException(status_code=403, detail="Your account is not approved. Please wait for admin approval.")
    
    new_course = models.Course(
        trainer_id=trainer_id,
        title=title,
        description=description,
        category=category,
        level=level,
        duration_minutes=int(duration_minutes) if duration_minutes else 60,
        max_students=int(max_students) if max_students else 10,
        price=float(price) if price else 0,
        meeting_link=meeting_link,
        status="pending",
        is_approved=False
    )
    
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    return {
        "message": "Course created successfully. Waiting for admin approval.",
        "id": new_course.id,
        "status": new_course.status,
        "is_approved": new_course.is_approved
    }


@app.get("/api/trainer/courses/{trainer_id}")
def get_trainer_courses(trainer_id: int, db: Session = Depends(get_db)):
    """Get all courses for a trainer with approval status"""
    courses = db.query(models.Course).filter(
        models.Course.trainer_id == trainer_id
    ).order_by(models.Course.created_at.desc()).all()
    
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "category": c.category,
            "level": c.level,
            "duration_minutes": c.duration_minutes,
            "max_students": c.max_students,
            "price": c.price,
            "meeting_link": c.meeting_link,
            "status": c.status,
            "is_approved": c.is_approved,
            "admin_notes": c.admin_notes,
            "enrolled_count": db.query(models.CourseEnrollment).filter(
                models.CourseEnrollment.course_id == c.id
            ).count(),
            "created_at": c.created_at,
            "approved_at": c.approved_at,
            "rejected_at": c.rejected_at
        }
        for c in courses
    ]


@app.get("/api/admin/courses/pending")
def get_pending_courses(db: Session = Depends(get_db)):
    """Admin gets pending courses for approval"""
    courses = db.query(models.Course).filter(
        models.Course.is_approved == False,
        models.Course.status == "pending"
    ).order_by(models.Course.created_at.desc()).all()
    
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "category": c.category,
            "level": c.level,
            "price": c.price,
            "duration_minutes": c.duration_minutes,
            "max_students": c.max_students,
            "trainer_id": c.trainer_id,
            "trainer_name": c.trainer.name if c.trainer else "Unknown",
            "trainer_email": c.trainer.email if c.trainer else "Unknown",
            "created_at": c.created_at,
            "status": c.status,
            "is_approved": c.is_approved
        }
        for c in courses
    ]


@app.get("/api/admin/courses/all")
def get_all_courses(db: Session = Depends(get_db)):
    """Admin gets all courses with status"""
    courses = db.query(models.Course).order_by(
        models.Course.created_at.desc()
    ).all()
    
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "category": c.category,
            "level": c.level,
            "duration_minutes": c.duration_minutes,
            "max_students": c.max_students,
            "price": c.price,
            "is_approved": c.is_approved,
            "status": c.status,
            "admin_notes": c.admin_notes,
            "trainer_id": c.trainer_id,
            "trainer_name": c.trainer.name if c.trainer else "Unknown",
            "enrolled_count": db.query(models.CourseEnrollment).filter(
                models.CourseEnrollment.course_id == c.id
            ).count(),
            "created_at": c.created_at,
            "approved_at": c.approved_at,
            "rejected_at": c.rejected_at
        }
        for c in courses
    ]


@app.put("/api/admin/courses/{course_id}/approve")
def approve_course(course_id: int, approval_data: dict = None, db: Session = Depends(get_db)):
    """Admin approves a course"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    course.is_approved = True
    course.status = "approved"
    course.approved_at = datetime.now(timezone.utc)
    course.rejected_at = None
    
    if approval_data and approval_data.get('admin_notes'):
        course.admin_notes = approval_data.get('admin_notes')
    
    db.commit()
    db.refresh(course)
    
    return {
        "message": "Course approved successfully",
        "id": course.id,
        "status": course.status,
        "is_approved": course.is_approved
    }


@app.put("/api/admin/courses/{course_id}/reject")
def reject_course(course_id: int, reject_data: dict, db: Session = Depends(get_db)):
    """Admin rejects a course with reason"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    course.is_approved = False
    course.status = "rejected"
    course.rejected_at = datetime.now(timezone.utc)
    course.approved_at = None
    course.admin_notes = reject_data.get('admin_notes', 'No reason provided')
    
    db.commit()
    db.refresh(course)
    
    return {
        "message": "Course rejected",
        "id": course.id,
        "status": course.status,
        "admin_notes": course.admin_notes
    }


@app.put("/api/trainer/course/{course_id}")
def update_course(course_id: int, course_data: dict, db: Session = Depends(get_db)):
    """Trainer updates a course (resets to pending if approved)"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    for key in ['title', 'description', 'category', 'level', 'duration_minutes', 'max_students', 'price', 'meeting_link']:
        if key in course_data and course_data[key] is not None:
            setattr(course, key, course_data[key])
    
    # Reset approval status if course was already approved/rejected
    if course.status != "pending":
        course.status = "pending"
        course.is_approved = False
        course.approved_at = None
        course.rejected_at = None
        course.admin_notes = None
    
    db.commit()
    db.refresh(course)
    
    return {
        "message": "Course updated successfully. Waiting for admin approval.",
        "id": course.id,
        "status": course.status
    }


@app.delete("/api/trainer/course/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    """Trainer deletes a course"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    db.delete(course)
    db.commit()
    
    return {"message": "Course deleted successfully"}


@app.post("/api/student/course/enroll")
def enroll_in_course(enrollment_data: dict, db: Session = Depends(get_db)):
    """Student enrolls in a course"""
    student_id = enrollment_data.get('student_id')
    course_id = enrollment_data.get('course_id')
    
    if not student_id or not course_id:
        raise HTTPException(status_code=400, detail="student_id and course_id are required")
    
    course = db.query(models.Course).filter(
        models.Course.id == course_id,
        models.Course.is_approved == True
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or not approved")
    
    existing = db.query(models.CourseEnrollment).filter(
        models.CourseEnrollment.student_id == student_id,
        models.CourseEnrollment.course_id == course_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    enrolled_count = db.query(models.CourseEnrollment).filter(
        models.CourseEnrollment.course_id == course_id
    ).count()
    
    if enrolled_count >= course.max_students:
        raise HTTPException(status_code=400, detail="Course is full")
    
    enrollment = models.CourseEnrollment(
        student_id=student_id,
        course_id=course_id,
        status="enrolled"
    )
    
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    
    return {
        "message": "Successfully enrolled in the course",
        "enrollment_id": enrollment.id,
        "course_title": course.title
    }


@app.get("/api/student/courses/enrolled/{student_id}")
def get_enrolled_courses(student_id: int, db: Session = Depends(get_db)):
    """Get all courses a student is enrolled in"""
    enrollments = db.query(models.CourseEnrollment).filter(
        models.CourseEnrollment.student_id == student_id
    ).all()
    
    result = []
    for e in enrollments:
        course = db.query(models.Course).filter(models.Course.id == e.course_id).first()
        if course:
            result.append({
                "enrollment_id": e.id,
                "course_id": course.id,
                "course_title": course.title,
                "course_description": course.description,
                "trainer_name": course.trainer.name if course.trainer else "Unknown",
                "status": e.status,
                "progress": e.progress,
                "attendance_percentage": e.attendance_percentage,
                "enrolled_at": e.enrolled_at,
                "completed_at": e.completed_at
            })
    
    return result


@app.get("/api/student/courses/available")
def get_available_courses(db: Session = Depends(get_db)):
    """Get all approved courses for students"""
    courses = db.query(models.Course).filter(
        models.Course.is_approved == True,
        models.Course.status == "approved"
    ).order_by(models.Course.created_at.desc()).all()
    
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "category": c.category,
            "level": c.level,
            "duration_minutes": c.duration_minutes,
            "max_students": c.max_students,
            "price": c.price,
            "trainer_id": c.trainer_id,
            "trainer_name": c.trainer.name if c.trainer else "Unknown",
            "enrolled_count": db.query(models.CourseEnrollment).filter(
                models.CourseEnrollment.course_id == c.id
            ).count(),
            "created_at": c.created_at
        }
        for c in courses
    ]


@app.put("/api/student/course/progress/{enrollment_id}")
def update_course_progress(enrollment_id: int, progress_data: dict, db: Session = Depends(get_db)):
    """Update student's course progress"""
    enrollment = db.query(models.CourseEnrollment).filter(
        models.CourseEnrollment.id == enrollment_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    progress = progress_data.get('progress')
    if progress is not None:
        enrollment.progress = progress
        if progress >= 100:
            enrollment.status = "completed"
            enrollment.completed_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(enrollment)
    
    return {
        "message": "Progress updated",
        "progress": enrollment.progress,
        "status": enrollment.status
    }

# ====== TRAINING INSTITUTE/PARTNER ENDPOINTS ======

@app.post("/api/institute/register")
def register_institute(institute_data: InstituteRegister, db: Session = Depends(get_db)):
    """Register a new training institute/partner"""
    
    # Check if email already exists
    existing = db.query(models.TrainingInstitute).filter(
        func.lower(models.TrainingInstitute.email) == func.lower(institute_data.email)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered as institute/partner")
    
    # Check if email exists as student or trainer
    existing_student = db.query(models.Resume).filter(
        func.lower(models.Resume.email) == func.lower(institute_data.email)
    ).first()
    
    existing_trainer = db.query(models.Trainer).filter(
        func.lower(models.Trainer.email) == func.lower(institute_data.email)
    ).first()
    
    # Hash password
    hashed_password = bcrypt.hashpw(
        institute_data.password.encode('utf-8'), 
        bcrypt.gensalt()
    ).decode('utf-8')
    
    # Generate referral code
    import time
    import random
    import string
    name_part = institute_data.institute_name[:3].upper() if institute_data.institute_name else "INS"
    timestamp_part = str(int(time.time()))[-4:]
    random_part = ''.join(random.choices(string.digits, k=2))
    referral_code = f"{name_part}{timestamp_part}{random_part}"
    
    # Create institute record
    institute = models.TrainingInstitute(
        name=institute_data.name,
        email=institute_data.email.lower().strip(),
        phone=institute_data.phone,
        password=hashed_password,
        role="institute",
        institute_name=institute_data.institute_name,
        institute_type=institute_data.institute_type,
        address=institute_data.address,
        city=institute_data.city,
        state=institute_data.state,
        pincode=institute_data.pincode,
        website=institute_data.website,
        description=institute_data.description,
        contact_person_name=institute_data.contact_person_name,
        contact_person_designation=institute_data.contact_person_designation,
        contact_person_phone=institute_data.contact_person_phone,
        registration_number=institute_data.registration_number,
        gst_number=institute_data.gst_number,
        pan_number=institute_data.pan_number,
        partnership_type=institute_data.partnership_type,
        referral_code=referral_code,
        is_approved=False,
        status="pending_approval"
    )
    
    db.add(institute)
    db.commit()
    db.refresh(institute)
    
    return {
        "message": "Institute/Partner registered successfully. Please wait for admin approval.",
        "id": institute.id,
        "name": institute.name,
        "email": institute.email,
        "institute_name": institute.institute_name,
        "institute_type": institute.institute_type,
        "status": institute.status,
        "referral_code": institute.referral_code
    }


@app.post("/api/institute/login")
def login_institute(login_data: InstituteLogin, db: Session = Depends(get_db)):
    institute = db.query(models.TrainingInstitute).filter(
        func.lower(models.TrainingInstitute.email) == func.lower(login_data.email)
    ).first()

    if not institute:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not bcrypt.checkpw(
        login_data.password.encode('utf-8'),
        institute.password.encode('utf-8')
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Block if not approved yet
    if not institute.is_approved or institute.status == "pending_approval":
        raise HTTPException(
            status_code=403,
            detail="Your account is pending admin approval. You will be able to login once approved."
        )

    if institute.status == "rejected":
        raise HTTPException(
            status_code=403,
            detail="Your registration was rejected. Please contact support."
        )

    if institute.status == "suspended":
        raise HTTPException(
            status_code=403,
            detail="Your account has been suspended. Please contact support."
        )

    return {
        "message": "Login successful",
        "id": institute.id,
        "name": institute.name,
        "email": institute.email,
        "institute_name": institute.institute_name,
        "institute_type": institute.institute_type,
        "role": institute.role,
        "is_approved": institute.is_approved,
        "status": institute.status,
        "referral_code": institute.referral_code
    }

@app.get("/api/institute/profile/{institute_id}")
def get_institute_profile(institute_id: int, db: Session = Depends(get_db)):
    """Get institute profile details"""
    
    institute = db.query(models.TrainingInstitute).filter(
        models.TrainingInstitute.id == institute_id
    ).first()
    
    if not institute:
        raise HTTPException(status_code=404, detail="Institute not found")
    
    return {
        "id": institute.id,
        "name": institute.name,
        "email": institute.email,
        "phone": institute.phone,
        "institute_name": institute.institute_name,
        "institute_type": institute.institute_type,
        "address": institute.address,
        "city": institute.city,
        "state": institute.state,
        "pincode": institute.pincode,
        "website": institute.website,
        "description": institute.description,
        "contact_person_name": institute.contact_person_name,
        "contact_person_designation": institute.contact_person_designation,
        "contact_person_phone": institute.contact_person_phone,
        "registration_number": institute.registration_number,
        "gst_number": institute.gst_number,
        "pan_number": institute.pan_number,
        "partnership_type": institute.partnership_type,
        "commission_rate": institute.commission_rate,
        "is_approved": institute.is_approved,
        "status": institute.status,
        "referral_code": institute.referral_code,
        "referral_count": institute.referral_count,
        "referral_earnings": institute.referral_earnings,
        "total_students_enrolled": institute.total_students_enrolled,
        "total_courses_offered": institute.total_courses_offered,
        "rating": institute.rating,
        "created_at": institute.created_at
    }


@app.put("/api/institute/profile/{institute_id}")
def update_institute_profile(institute_id: int, profile_data: dict, db: Session = Depends(get_db)):
    """Update institute profile"""
    
    institute = db.query(models.TrainingInstitute).filter(
        models.TrainingInstitute.id == institute_id
    ).first()
    
    if not institute:
        raise HTTPException(status_code=404, detail="Institute not found")
    
    updatable_fields = [
        'name', 'phone', 'institute_name', 'institute_type', 'address', 'city',
        'state', 'pincode', 'website', 'description', 'contact_person_name',
        'contact_person_designation', 'contact_person_phone', 'registration_number',
        'gst_number', 'pan_number', 'partnership_type', 'available_days',
        'available_time_start', 'available_time_end'
    ]
    
    for field in updatable_fields:
        if field in profile_data and profile_data[field] is not None:
            setattr(institute, field, profile_data[field])
    
    db.commit()
    db.refresh(institute)
    
    return {
        "message": "Profile updated successfully",
        "id": institute.id
    }


# ====== INSTITUTE COURSE ENDPOINTS ======

@app.post("/api/institute/course")
def create_institute_course(course_data: InstituteCourseCreate, db: Session = Depends(get_db)):
    """Create a new course for institute"""
    
    institute = db.query(models.TrainingInstitute).filter(
        models.TrainingInstitute.id == course_data.institute_id
    ).first()
    
    if not institute:
        raise HTTPException(status_code=404, detail="Institute not found")
    
    if not institute.is_approved:
        raise HTTPException(status_code=403, detail="Your institute is not approved yet. Please wait for admin approval.")
    
    new_course = models.InstituteCourse(
        institute_id=course_data.institute_id,
        title=course_data.title,
        description=course_data.description,
        category=course_data.category,
        level=course_data.level,
        duration_hours=course_data.duration_hours,
        duration_weeks=course_data.duration_weeks,
        mode=course_data.mode,
        price=course_data.price,
        max_students_per_batch=course_data.max_students_per_batch,
        syllabus=course_data.syllabus,
        prerequisites=course_data.prerequisites,
        certification=course_data.certification,
        status="pending",
        is_approved=False
    )
    
    db.add(new_course)
    
    # Update institute course count
    institute.total_courses_offered = (institute.total_courses_offered or 0) + 1
    
    db.commit()
    db.refresh(new_course)
    
    return {
        "message": "Course created successfully. Waiting for admin approval.",
        "id": new_course.id,
        "title": new_course.title,
        "status": new_course.status
    }


@app.get("/api/institute/courses/{institute_id}")
def get_institute_courses(institute_id: int, db: Session = Depends(get_db)):
    """Get all courses for an institute"""
    
    courses = db.query(models.InstituteCourse).filter(
        models.InstituteCourse.institute_id == institute_id
    ).order_by(models.InstituteCourse.created_at.desc()).all()
    
    result = []
    for course in courses:
        batch_count = db.query(models.InstituteBatch).filter(
            models.InstituteBatch.course_id == course.id
        ).count()
        
        enrollment_count = db.query(models.InstituteEnrollment).filter(
            models.InstituteEnrollment.course_id == course.id
        ).count()
        
        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "category": course.category,
            "level": course.level,
            "duration_hours": course.duration_hours,
            "duration_weeks": course.duration_weeks,
            "mode": course.mode,
            "price": float(course.price) if course.price else 0,
            "max_students_per_batch": course.max_students_per_batch,
            "syllabus": course.syllabus,
            "prerequisites": course.prerequisites,
            "certification": course.certification,
            "is_approved": course.is_approved,
            "status": course.status,
            "admin_notes": course.admin_notes,
            "batch_count": batch_count,
            "enrollment_count": enrollment_count,
            "created_at": course.created_at
        })
    
    return result


@app.put("/api/institute/course/{course_id}")
def update_institute_course(course_id: int, course_data: dict, db: Session = Depends(get_db)):
    """Update institute course"""
    
    course = db.query(models.InstituteCourse).filter(
        models.InstituteCourse.id == course_id
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    updatable_fields = [
        'title', 'description', 'category', 'level', 'duration_hours',
        'duration_weeks', 'mode', 'price', 'max_students_per_batch',
        'syllabus', 'prerequisites', 'certification'
    ]
    
    for field in updatable_fields:
        if field in course_data and course_data[field] is not None:
            setattr(course, field, course_data[field])
    
    # Reset approval if course was approved
    if course.status == "approved":
        course.status = "pending"
        course.is_approved = False
    
    db.commit()
    db.refresh(course)
    
    return {
        "message": "Course updated successfully. Waiting for admin approval.",
        "id": course.id,
        "status": course.status
    }


@app.delete("/api/institute/course/{course_id}")
def delete_institute_course(course_id: int, db: Session = Depends(get_db)):
    """Delete institute course"""
    
    course = db.query(models.InstituteCourse).filter(
        models.InstituteCourse.id == course_id
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    institute = db.query(models.TrainingInstitute).filter(
        models.TrainingInstitute.id == course.institute_id
    ).first()
    
    db.delete(course)
    
    if institute:
        institute.total_courses_offered = max(0, (institute.total_courses_offered or 1) - 1)
    
    db.commit()
    
    return {"message": "Course deleted successfully"}


# ====== INSTITUTE BATCH ENDPOINTS ======

@app.post("/api/institute/batch")
def create_institute_batch(batch_data: InstituteBatchCreate, db: Session = Depends(get_db)):
    """Create a new batch for a course"""
    
    institute = db.query(models.TrainingInstitute).filter(
        models.TrainingInstitute.id == batch_data.institute_id
    ).first()
    
    if not institute:
        raise HTTPException(status_code=404, detail="Institute not found")
    
    course = db.query(models.InstituteCourse).filter(
        models.InstituteCourse.id == batch_data.course_id,
        models.InstituteCourse.institute_id == batch_data.institute_id
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if not course.is_approved:
        raise HTTPException(status_code=403, detail="Course is not approved yet. Please wait for admin approval.")
    
    new_batch = models.InstituteBatch(
        institute_id=batch_data.institute_id,
        course_id=batch_data.course_id,
        batch_name=batch_data.batch_name,
        start_date=datetime.fromisoformat(batch_data.start_date) if batch_data.start_date else None,
        end_date=datetime.fromisoformat(batch_data.end_date) if batch_data.end_date else None,
        timing=batch_data.timing,
        days=batch_data.days,
        max_students=batch_data.max_students,
        trainer_name=batch_data.trainer_name,
        meeting_link=batch_data.meeting_link,
        status="upcoming"
    )
    
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)
    
    return {
        "message": "Batch created successfully",
        "id": new_batch.id,
        "batch_name": new_batch.batch_name,
        "status": new_batch.status
    }


@app.get("/api/institute/batches/{institute_id}")
def get_institute_batches(institute_id: int, db: Session = Depends(get_db)):
    """Get all batches for an institute"""
    
    batches = db.query(models.InstituteBatch).filter(
        models.InstituteBatch.institute_id == institute_id
    ).order_by(models.InstituteBatch.created_at.desc()).all()
    
    result = []
    for batch in batches:
        course = db.query(models.InstituteCourse).filter(
            models.InstituteCourse.id == batch.course_id
        ).first()
        
        result.append({
            "id": batch.id,
            "batch_name": batch.batch_name,
            "course_id": batch.course_id,
            "course_title": course.title if course else "Unknown",
            "start_date": batch.start_date,
            "end_date": batch.end_date,
            "timing": batch.timing,
            "days": batch.days,
            "max_students": batch.max_students,
            "enrolled_count": batch.enrolled_count,
            "trainer_name": batch.trainer_name,
            "meeting_link": batch.meeting_link,
            "status": batch.status,
            "created_at": batch.created_at
        })
    
    return result


@app.get("/api/institute/batch/{batch_id}/students")
def get_batch_students(batch_id: int, db: Session = Depends(get_db)):
    """Get all students enrolled in a batch"""
    
    enrollments = db.query(models.InstituteEnrollment).filter(
        models.InstituteEnrollment.batch_id == batch_id
    ).all()
    
    result = []
    for enrollment in enrollments:
        result.append({
            "enrollment_id": enrollment.id,
            "student_id": enrollment.student_id,
            "student_name": enrollment.student_name,
            "student_email": enrollment.student_email,
            "student_phone": enrollment.student_phone,
            "status": enrollment.status,
            "progress": enrollment.progress,
            "attendance_percentage": enrollment.attendance_percentage,
            "payment_status": enrollment.payment_status,
            "amount_paid": float(enrollment.amount_paid) if enrollment.amount_paid else 0,
            "enrolled_at": enrollment.enrolled_at
        })
    
    return result


@app.delete("/api/institute/batch/{batch_id}")
def delete_institute_batch(batch_id: int, db: Session = Depends(get_db)):
    """Delete a batch"""
    
    batch = db.query(models.InstituteBatch).filter(
        models.InstituteBatch.id == batch_id
    ).first()
    
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    db.delete(batch)
    db.commit()
    
    return {"message": "Batch deleted successfully"}


# ====== INSTITUTE ENROLLMENT ENDPOINTS ======

@app.post("/api/institute/enroll")
def enroll_student_in_institute(enrollment_data: InstituteEnrollmentRequest, db: Session = Depends(get_db)):
    """Enroll a student in an institute course"""
    
    # Check institute
    institute = db.query(models.TrainingInstitute).filter(
        models.TrainingInstitute.id == enrollment_data.institute_id
    ).first()
    
    if not institute:
        raise HTTPException(status_code=404, detail="Institute not found")
    
    # Check course
    course = db.query(models.InstituteCourse).filter(
        models.InstituteCourse.id == enrollment_data.course_id,
        models.InstituteCourse.institute_id == enrollment_data.institute_id
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if not course.is_approved:
        raise HTTPException(status_code=403, detail="Course is not approved yet")
    
    # Check student
    student = db.query(models.Resume).filter(
        models.Resume.id == enrollment_data.student_id
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if already enrolled
    existing = db.query(models.InstituteEnrollment).filter(
        models.InstituteEnrollment.institute_id == enrollment_data.institute_id,
        models.InstituteEnrollment.course_id == enrollment_data.course_id,
        models.InstituteEnrollment.student_id == enrollment_data.student_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled in this course")
    
    # Check batch capacity if batch_id provided
    if enrollment_data.batch_id:
        batch = db.query(models.InstituteBatch).filter(
            models.InstituteBatch.id == enrollment_data.batch_id
        ).first()
        
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")
        
        if batch.enrolled_count >= batch.max_students:
            raise HTTPException(status_code=400, detail="Batch is full")
        
        batch.enrolled_count = (batch.enrolled_count or 0) + 1
    
    # Create enrollment
    enrollment = models.InstituteEnrollment(
        institute_id=enrollment_data.institute_id,
        course_id=enrollment_data.course_id,
        batch_id=enrollment_data.batch_id,
        student_id=enrollment_data.student_id,
        student_name=student.name,
        student_email=student.email,
        student_phone=student.phone,
        status="enrolled"
    )
    
    db.add(enrollment)
    
    # Update institute stats
    institute.total_students_enrolled = (institute.total_students_enrolled or 0) + 1
    
    db.commit()
    db.refresh(enrollment)
    
    return {
        "message": "Student enrolled successfully",
        "enrollment_id": enrollment.id,
        "student_name": enrollment.student_name,
        "course_title": course.title
    }


@app.get("/api/institute/enrollments/{institute_id}")
def get_institute_enrollments(institute_id: int, db: Session = Depends(get_db)):
    """Get all enrollments for an institute"""
    
    enrollments = db.query(models.InstituteEnrollment).filter(
        models.InstituteEnrollment.institute_id == institute_id
    ).order_by(models.InstituteEnrollment.enrolled_at.desc()).all()
    
    result = []
    for enrollment in enrollments:
        course = db.query(models.InstituteCourse).filter(
            models.InstituteCourse.id == enrollment.course_id
        ).first()
        
        batch = db.query(models.InstituteBatch).filter(
            models.InstituteBatch.id == enrollment.batch_id
        ).first() if enrollment.batch_id else None
        
        result.append({
            "id": enrollment.id,
            "student_id": enrollment.student_id,
            "student_name": enrollment.student_name,
            "student_email": enrollment.student_email,
            "student_phone": enrollment.student_phone,
            "course_id": enrollment.course_id,
            "course_title": course.title if course else "Unknown",
            "batch_id": enrollment.batch_id,
            "batch_name": batch.batch_name if batch else None,
            "status": enrollment.status,
            "progress": enrollment.progress,
            "attendance_percentage": enrollment.attendance_percentage,
            "payment_status": enrollment.payment_status,
            "amount_paid": float(enrollment.amount_paid) if enrollment.amount_paid else 0,
            "enrolled_at": enrollment.enrolled_at,
            "completed_at": enrollment.completed_at
        })
    
    return result


@app.put("/api/institute/enrollment/{enrollment_id}/progress")
def update_institute_enrollment_progress(enrollment_id: int, progress_data: dict, db: Session = Depends(get_db)):
    """Update student progress in institute course"""
    
    enrollment = db.query(models.InstituteEnrollment).filter(
        models.InstituteEnrollment.id == enrollment_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    if 'progress' in progress_data:
        enrollment.progress = progress_data['progress']
        if progress_data['progress'] >= 100:
            enrollment.status = "completed"
            enrollment.completed_at = datetime.now(timezone.utc)
    
    if 'attendance_percentage' in progress_data:
        enrollment.attendance_percentage = progress_data['attendance_percentage']
    
    if 'payment_status' in progress_data:
        enrollment.payment_status = progress_data['payment_status']
    
    if 'amount_paid' in progress_data:
        enrollment.amount_paid = progress_data['amount_paid']
    
    db.commit()
    db.refresh(enrollment)
    
    return {
        "message": "Progress updated",
        "progress": enrollment.progress,
        "status": enrollment.status
    }


# ====== ADMIN ENDPOINTS FOR INSTITUTE MANAGEMENT ======

@app.get("/api/admin/institutes")
def get_all_institutes(db: Session = Depends(get_db)):
    """Admin gets all institutes"""
    
    institutes = db.query(models.TrainingInstitute).order_by(
        models.TrainingInstitute.created_at.desc()
    ).all()
    
    result = []
    for institute in institutes:
        result.append({
            "id": institute.id,
            "name": institute.name,
            "email": institute.email,
            "phone": institute.phone,
            "institute_name": institute.institute_name,
            "institute_type": institute.institute_type,
            "city": institute.city,
            "state": institute.state,
            "partnership_type": institute.partnership_type,
            "is_approved": institute.is_approved,
            "status": institute.status,
            "total_students_enrolled": institute.total_students_enrolled,
            "total_courses_offered": institute.total_courses_offered,
            "rating": float(institute.rating) if institute.rating else 0,
            "created_at": institute.created_at
        })
    
    return result


@app.get("/api/admin/institutes/pending")
def get_pending_institutes(db: Session = Depends(get_db)):
    """Admin gets pending institutes for approval"""
    
    institutes = db.query(models.TrainingInstitute).filter(
        models.TrainingInstitute.is_approved == False,
        models.TrainingInstitute.status == 'pending_approval'
    ).order_by(models.TrainingInstitute.created_at.desc()).all()
    
    return [
        {
            "id": i.id,
            "name": i.name,
            "email": i.email,
            "phone": i.phone,
            "institute_name": i.institute_name,
            "institute_type": i.institute_type,
            "address": i.address,
            "city": i.city,
            "state": i.state,
            "registration_number": i.registration_number,
            "gst_number": i.gst_number,
            "contact_person_name": i.contact_person_name,
            "contact_person_phone": i.contact_person_phone,
            "partnership_type": i.partnership_type,
            "created_at": i.created_at
        }
        for i in institutes
    ]


@app.put("/api/admin/institute/{institute_id}/approve")
def approve_institute(institute_id: int, approval_data: dict = None, db: Session = Depends(get_db)):
    """Admin approves an institute"""
    
    institute = db.query(models.TrainingInstitute).filter(
        models.TrainingInstitute.id == institute_id
    ).first()
    
    if not institute:
        raise HTTPException(status_code=404, detail="Institute not found")
    
    institute.is_approved = True
    institute.status = "approved"
    institute.updated_at = datetime.now(timezone.utc)
    
    if approval_data and approval_data.get('commission_rate'):
        institute.commission_rate = approval_data['commission_rate']
    
    db.commit()
    db.refresh(institute)
    
    return {
        "message": "Institute approved successfully",
        "id": institute.id,
        "name": institute.name,
        "status": institute.status,
        "is_approved": institute.is_approved
    }


@app.put("/api/admin/institute/{institute_id}/reject")
def reject_institute(institute_id: int, reject_data: dict, db: Session = Depends(get_db)):
    """Admin rejects an institute"""
    
    institute = db.query(models.TrainingInstitute).filter(
        models.TrainingInstitute.id == institute_id
    ).first()
    
    if not institute:
        raise HTTPException(status_code=404, detail="Institute not found")
    
    institute.is_approved = False
    institute.status = "rejected"
    institute.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(institute)
    
    return {
        "message": "Institute rejected",
        "id": institute.id,
        "name": institute.name,
        "status": institute.status
    }


@app.get("/api/admin/institute-courses/pending")
def get_pending_institute_courses(db: Session = Depends(get_db)):
    """Admin gets pending institute courses for approval"""
    
    courses = db.query(models.InstituteCourse).filter(
        models.InstituteCourse.is_approved == False,
        models.InstituteCourse.status == "pending"
    ).order_by(models.InstituteCourse.created_at.desc()).all()
    
    result = []
    for course in courses:
        institute = db.query(models.TrainingInstitute).filter(
            models.TrainingInstitute.id == course.institute_id
        ).first()
        
        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "category": course.category,
            "level": course.level,
            "duration_hours": course.duration_hours,
            "price": float(course.price) if course.price else 0,
            "institute_id": course.institute_id,
            "institute_name": institute.institute_name if institute else "Unknown",
            "institute_email": institute.email if institute else "Unknown",
            "created_at": course.created_at,
            "status": course.status
        })
    
    return result


@app.put("/api/admin/institute-course/{course_id}/approve")
def approve_institute_course(course_id: int, approval_data: dict = None, db: Session = Depends(get_db)):
    """Admin approves an institute course"""
    
    course = db.query(models.InstituteCourse).filter(
        models.InstituteCourse.id == course_id
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    course.is_approved = True
    course.status = "approved"
    course.updated_at = datetime.now(timezone.utc)
    
    if approval_data and approval_data.get('admin_notes'):
        course.admin_notes = approval_data['admin_notes']
    
    db.commit()
    db.refresh(course)
    
    return {
        "message": "Course approved successfully",
        "id": course.id,
        "title": course.title,
        "status": course.status,
        "is_approved": course.is_approved
    }


@app.put("/api/admin/institute-course/{course_id}/reject")
def reject_institute_course(course_id: int, reject_data: dict, db: Session = Depends(get_db)):
    """Admin rejects an institute course"""
    
    course = db.query(models.InstituteCourse).filter(
        models.InstituteCourse.id == course_id
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    course.is_approved = False
    course.status = "rejected"
    course.updated_at = datetime.now(timezone.utc)
    course.admin_notes = reject_data.get('admin_notes', 'No reason provided')
    
    db.commit()
    db.refresh(course)
    
    return {
        "message": "Course rejected",
        "id": course.id,
        "status": course.status,
        "admin_notes": course.admin_notes
    }


# ====== STUDENT VIEW INSTITUTE COURSES ======

@app.get("/api/student/institute-courses")
def get_available_institute_courses(db: Session = Depends(get_db)):
    """Get all approved institute courses for students"""
    
    courses = db.query(models.InstituteCourse).filter(
        models.InstituteCourse.is_approved == True,
        models.InstituteCourse.status == "approved"
    ).order_by(models.InstituteCourse.created_at.desc()).all()
    
    result = []
    for course in courses:
        institute = db.query(models.TrainingInstitute).filter(
            models.TrainingInstitute.id == course.institute_id
        ).first()
        
        batches = db.query(models.InstituteBatch).filter(
            models.InstituteBatch.course_id == course.id,
            models.InstituteBatch.status.in_(['upcoming', 'ongoing'])
        ).all()
        
        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "category": course.category,
            "level": course.level,
            "duration_hours": course.duration_hours,
            "duration_weeks": course.duration_weeks,
            "mode": course.mode,
            "price": float(course.price) if course.price else 0,
            "certification": course.certification,
            "institute_id": course.institute_id,
            "institute_name": institute.institute_name if institute else "Unknown",
            "institute_city": institute.city if institute else "",
            "institute_rating": float(institute.rating) if institute and institute.rating else 0,
            "available_batches": [
                {
                    "id": b.id,
                    "batch_name": b.batch_name,
                    "start_date": b.start_date,
                    "timing": b.timing,
                    "days": b.days,
                    "enrolled_count": b.enrolled_count,
                    "max_students": b.max_students,
                    "status": b.status
                }
                for b in batches
            ],
            "created_at": course.created_at
        })
    
    return result


@app.get("/api/student/institute/{institute_id}")
def get_institute_details_for_student(institute_id: int, db: Session = Depends(get_db)):
    """Get institute details for students"""
    
    institute = db.query(models.TrainingInstitute).filter(
        models.TrainingInstitute.id == institute_id,
        models.TrainingInstitute.is_approved == True
    ).first()
    
    if not institute:
        raise HTTPException(status_code=404, detail="Institute not found or not approved")

    courses = db.query(models.InstituteCourse).filter(
        models.InstituteCourse.institute_id == institute_id,
        models.InstituteCourse.is_approved == True
    ).all()
    
    return {
        "id": institute.id,
        "institute_name": institute.institute_name,
        "institute_type": institute.institute_type,
        "description": institute.description,
        "city": institute.city,
        "state": institute.state,
        "website": institute.website,
        "rating": float(institute.rating) if institute.rating else 0,
        "total_students_enrolled": institute.total_students_enrolled,
        "total_courses_offered": institute.total_courses_offered,
        "courses": [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "category": c.category,
                "level": c.level,
                "price": float(c.price) if c.price else 0,
                "duration_hours": c.duration_hours,
                "mode": c.mode
            }
            for c in courses
        ]
    }

# ============ RECRUITER MODELS ============

class RecruiterRegister(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    password: str
    company_name: Optional[str] = None
    company_website: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    designation: Optional[str] = None
    location: Optional[str] = None


class RecruiterLogin(BaseModel):
    email: str
    password: str


# ============ RECRUITER MODELS ============

import json as _json  # added to safely parse/serialize industry list

FREE_EMAIL_DOMAINS = {
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com",
    "rediffmail.com", "yahoo.co.in", "live.com"
}


def is_free_email(email: str) -> bool:
    if not email or "@" not in email:
        return False
    domain = email.split("@")[-1].strip().lower()
    return domain in FREE_EMAIL_DOMAINS


def parse_industry(raw):
    """industry column stores a JSON list string; return [] on legacy/plain values"""
    if not raw:
        return []
    if isinstance(raw, list):
        return raw
    try:
        return _json.loads(raw)
    except Exception:
        return [s.strip() for s in str(raw).split(",") if s.strip()]


class RecruiterRegister(BaseModel):
    # login / account
    name: str
    email: str
    password: str
    phone: Optional[str] = None

    # recruiter profile
    designation: Optional[str] = None
    linkedin_url: Optional[str] = None
    preferred_contact_method: Optional[str] = None

    # company profile
    company_name: Optional[str] = None
    company_type: Optional[str] = None
    company_website: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[List[str]] = []
    company_description: Optional[str] = None
    company_logo_url: Optional[str] = None

    # location
    country: Optional[str] = "India"
    state: Optional[str] = None
    city: Optional[str] = None
    complete_address: Optional[str] = None
    pincode: Optional[str] = None

    # verification
    legal_business_name: Optional[str] = None
    gst_number: Optional[str] = None
    cin_number: Optional[str] = None
    business_registration_url: Optional[str] = None
    company_domain_proof_url: Optional[str] = None


class RecruiterLogin(BaseModel):
    email: str
    password: str


# ============ RECRUITER REGISTRATION ============

@app.post("/api/recruiter/register")
def register_recruiter(recruiter_data: RecruiterRegister, db: Session = Depends(get_db)):
    """Register a new recruiter (needs admin approval)."""

    # Case-insensitive duplicate check
    existing = db.query(models.Recruiter).filter(
        func.lower(models.Recruiter.email) == func.lower(recruiter_data.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Also check against other account types
    existing_student = db.query(models.Resume).filter(
        func.lower(models.Resume.email) == func.lower(recruiter_data.email)
    ).first()
    existing_trainer = db.query(models.Trainer).filter(
        func.lower(models.Trainer.email) == func.lower(recruiter_data.email)
    ).first()
    existing_institute = db.query(models.TrainingInstitute).filter(
        func.lower(models.TrainingInstitute.email) == func.lower(recruiter_data.email)
    ).first()

    if existing_student or existing_trainer or existing_institute:
        raise HTTPException(
            status_code=400,
            detail="This email is already registered on the platform with a different role"
        )

    hashed_password = bcrypt.hashpw(
        recruiter_data.password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    # Build a legacy "location" string for old code paths / admin display
    location_str = ", ".join(
        [p for p in [recruiter_data.city, recruiter_data.state, recruiter_data.country] if p]
    ) or None

    # Serialize industry list to JSON
    industry_str = _json.dumps(recruiter_data.industry or [])

    # Decide initial status — if free email, mark for stricter manual verification
    initial_status = "pending_approval"
    if is_free_email(recruiter_data.email):
        initial_status = "pending_verification"

    recruiter = models.Recruiter(
        # login / account
        name=recruiter_data.name,
        email=recruiter_data.email.lower().strip(),
        phone=recruiter_data.phone,
        password=hashed_password,
        role="recruiter",

        # recruiter profile
        designation=recruiter_data.designation,
        linkedin_url=recruiter_data.linkedin_url,
        preferred_contact_method=recruiter_data.preferred_contact_method,

        # company profile
        company_name=recruiter_data.company_name,
        company_type=recruiter_data.company_type,
        company_website=recruiter_data.company_website,
        company_size=recruiter_data.company_size,
        industry=industry_str,
        company_description=recruiter_data.company_description,
        company_logo_url=recruiter_data.company_logo_url,

        # location
        country=recruiter_data.country,
        state=recruiter_data.state,
        city=recruiter_data.city,
        complete_address=recruiter_data.complete_address,
        pincode=recruiter_data.pincode,
        location=location_str,

        # verification
        legal_business_name=recruiter_data.legal_business_name,
        gst_number=recruiter_data.gst_number,
        cin_number=recruiter_data.cin_number,
        business_registration_url=recruiter_data.business_registration_url,
        company_domain_proof_url=recruiter_data.company_domain_proof_url,

        # status
        is_approved=False,
        status=initial_status,
    )

    db.add(recruiter)
    db.commit()
    db.refresh(recruiter)

    return {
        "message": "Recruiter registered successfully. Please wait for admin approval.",
        "id": recruiter.id,
        "name": recruiter.name,
        "email": recruiter.email,
        "company_name": recruiter.company_name,
        "status": recruiter.status,
    }


# ============ RECRUITER LOGIN ============

@app.post("/api/login/recruiter")
def login_recruiter(login_data: RecruiterLogin, db: Session = Depends(get_db)):
    """Recruiter login (email + password only)."""
    recruiter = db.query(models.Recruiter).filter(
        func.lower(models.Recruiter.email) == func.lower(login_data.email)
    ).first()

    if not recruiter:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not bcrypt.checkpw(
        login_data.password.encode("utf-8"),
        recruiter.password.encode("utf-8")
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Gate by approval status (after password check so we don't leak info)
    if recruiter.status == "rejected":
        raise HTTPException(status_code=403, detail="Your registration was rejected. Please contact support.")

    if recruiter.status == "suspended":
        raise HTTPException(status_code=403, detail="Your account has been suspended. Please contact support.")

    if not recruiter.is_approved:
        raise HTTPException(
            status_code=403,
            detail="Your account is pending approval. You will be able to login once approved."
        )

    return {
        "message": "Login successful",
        "id": recruiter.id,
        "name": recruiter.name,
        "email": recruiter.email,
        "phone": recruiter.phone,
        "company_name": recruiter.company_name,
        "company_type": recruiter.company_type,
        "industry": parse_industry(recruiter.industry),
        "designation": recruiter.designation,
        "preferred_contact_method": recruiter.preferred_contact_method,
        "role": "recruiter",
        "is_approved": recruiter.is_approved,
        "status": recruiter.status,
    }


# ============ ADMIN: MANAGE RECRUITERS ============

@app.get("/api/admin/recruiters")
def get_all_recruiters(db: Session = Depends(get_db)):
    """Get all recruiters with full company details."""
    recruiters = db.query(models.Recruiter).order_by(
        models.Recruiter.created_at.desc()
    ).all()

    return [
        {
            "id": r.id,
            "name": r.name,
            "email": r.email,
            "phone": r.phone,
            "designation": r.designation,
            "linkedin_url": r.linkedin_url,
            "preferred_contact_method": r.preferred_contact_method,

            "company_name": r.company_name,
            "company_type": r.company_type,
            "company_website": r.company_website,
            "company_size": r.company_size,
            "industry": parse_industry(r.industry),
            "company_description": r.company_description,
            "company_logo_url": r.company_logo_url,

            "country": r.country,
            "state": r.state,
            "city": r.city,
            "complete_address": r.complete_address,
            "pincode": r.pincode,
            "location": r.location,

            "legal_business_name": r.legal_business_name,
            "gst_number": r.gst_number,
            "cin_number": r.cin_number,
            "business_registration_url": r.business_registration_url,
            "company_domain_proof_url": r.company_domain_proof_url,

            "is_approved": r.is_approved,
            "status": r.status,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        }
        for r in recruiters
    ]


@app.put("/api/admin/approve-recruiter/{recruiter_id}")
def approve_recruiter(recruiter_id: int, db: Session = Depends(get_db)):
    """Approve a recruiter."""
    recruiter = db.query(models.Recruiter).filter(
        models.Recruiter.id == recruiter_id
    ).first()

    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")

    recruiter.is_approved = True
    recruiter.status = "approved"
    recruiter.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(recruiter)

    return {
        "message": "Recruiter approved successfully",
        "id": recruiter.id,
        "status": recruiter.status,
        "is_approved": recruiter.is_approved,
    }


@app.put("/api/admin/reject-recruiter/{recruiter_id}")
def reject_recruiter(recruiter_id: int, db: Session = Depends(get_db)):
    """Reject a recruiter."""
    recruiter = db.query(models.Recruiter).filter(
        models.Recruiter.id == recruiter_id
    ).first()

    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")

    recruiter.is_approved = False
    recruiter.status = "rejected"
    recruiter.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(recruiter)

    return {
        "message": "Recruiter rejected",
        "id": recruiter.id,
        "status": recruiter.status,
    }


@app.put("/api/admin/recruiter/{recruiter_id}/status")
def set_recruiter_status(recruiter_id: int, data: dict, db: Session = Depends(get_db)):
    """Update recruiter verification status.

    Allowed values:
      email_verified, company_verified, recruiter_verified,
      pending_verification, verification_required,
      suspended, approved, rejected
    """
    allowed = {
        "email_verified", "company_verified", "recruiter_verified",
        "pending_verification", "verification_required",
        "suspended", "approved", "rejected",
    }
    new_status = data.get("status")
    if new_status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")

    recruiter = db.query(models.Recruiter).filter(
        models.Recruiter.id == recruiter_id
    ).first()
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")

    recruiter.status = new_status

    # Toggle is_approved based on status
    if new_status in ("approved", "company_verified", "recruiter_verified", "email_verified"):
        recruiter.is_approved = True
    elif new_status in ("rejected", "suspended", "pending_verification", "verification_required"):
        recruiter.is_approved = False

    recruiter.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(recruiter)

    return {
        "message": "Status updated",
        "id": recruiter.id,
        "status": recruiter.status,
        "is_approved": recruiter.is_approved,
    }

from sqlalchemy import text as _sql_text

@app.put("/api/admin/student/{student_id}/toggle-recruiter-visibility")
def toggle_recruiter_visibility(student_id: int, data: dict, db: Session = Depends(get_db)):
    """Admin approves/hides student profile from recruiters.
    Uses raw SQL so it works even if the ORM model is stale."""
    is_visible = bool(data.get('is_visible_to_recruiters', True))
    admin_notes = data.get('admin_notes', None)

    # Verify student exists
    exists = db.execute(
        _sql_text("SELECT id FROM resumes WHERE id = :sid"),
        {"sid": student_id}
    ).fetchone()
    if not exists:
        raise HTTPException(status_code=404, detail="Student not found")

    db.execute(
        _sql_text("""
            UPDATE resumes
            SET is_visible_to_recruiters = :visible,
                approved_by_admin_at = :approved_at,
                admin_notes = COALESCE(:notes, admin_notes)
            WHERE id = :sid
        """),
        {
            "visible": is_visible,
            "approved_at": datetime.now(timezone.utc) if is_visible else None,
            "notes": admin_notes if is_visible else None,
            "sid": student_id,
        }
    )
    db.commit()
    row = db.execute(
        _sql_text("SELECT is_visible_to_recruiters FROM resumes WHERE id = :sid"),
        {"sid": student_id}
    ).fetchone()

    return {
        "message": f"Student visibility set to {is_visible}",
        "id": student_id,
        "is_visible_to_recruiters": bool(row[0]) if row else is_visible,
    }


@app.get("/api/recruiter/students")
def get_recruiter_students(
    min_rating: Optional[int] = None,
    skill: Optional[str] = None,
    location: Optional[str] = None,
    education: Optional[str] = None,
    min_score: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """
    Get students visible to recruiters with filters.
    Only returns students approved by admin (is_visible_to_recruiters=True)
    """
    query = db.query(models.Resume).filter(
        models.Resume.is_visible_to_recruiters == True
    )
    
    # Filter by location
    if location:
        query = query.filter(models.Resume.location.ilike(f"%{location}%"))
    
    # Filter by education
    if education:
        query = query.filter(models.Resume.education.ilike(f"%{education}%"))
    
    students = query.order_by(models.Resume.approved_by_admin_at.desc()).all()
    
    result = []
    for student in students:
        # Get skills
        skills = db.query(models.Skill).filter(
            models.Skill.resume_id == student.id
        ).all()
        
        # Filter by skill
        if skill:
            skill_match = any(skill.lower() in s.skill_name.lower() for s in skills)
            if not skill_match:
                continue
        
        # Filter by minimum rating
        if min_rating:
            max_rating = max([s.rating for s in skills if s.rating] or [0])
            if max_rating < min_rating:
                continue
        
        # Get test results
        test_results = db.query(models.TestSummary).filter(
            models.TestSummary.resume_id == student.id
        ).all()
        
        # Filter by minimum test score
        if min_score:
            max_score = max([t.score_percentage for t in test_results] or [0])
            if max_score < min_score:
                continue
        
        result.append({
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "phone": student.phone,
            "location": student.location,
            "education": student.education,
            "about": student.about,
            "linkedin_url": student.linkedin_url,
            "github_url": student.github_url,
            "portfolio_url": student.portfolio_url,
            "skills": [
                {
                    "id": s.id,
                    "skill_name": s.skill_name,
                    "rating": s.rating,
                    "rating_level": s.rating_level
                }
                for s in skills
            ],
            "test_results": [
                {
                    "skill_name": t.skill_name,
                    "score_percentage": t.score_percentage,
                    "result_status": t.result_status,
                    "test_date": t.test_date
                }
                for t in test_results
            ],
            "courses": student.courses,
            "certifications": student.certifications,
            "projects": student.projects,
            "experience": student.experience,
            "approved_at": student.approved_by_admin_at
        })
    
    return result


@app.get("/api/recruiter/student/{student_id}")
def get_recruiter_student_detail(student_id: int, db: Session = Depends(get_db)):
    """Get detailed view of a single student for recruiter"""
    student = db.query(models.Resume).filter(
        models.Resume.id == student_id,
        models.Resume.is_visible_to_recruiters == True
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found or not visible to recruiters")
    
    skills = db.query(models.Skill).filter(
        models.Skill.resume_id == student.id
    ).all()
    
    test_results = db.query(models.TestSummary).filter(
        models.TestSummary.resume_id == student.id
    ).all()
    
    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "phone": student.phone,
        "location": student.location,
        "education": student.education,
        "about": student.about,
        "linkedin_url": student.linkedin_url,
        "github_url": student.github_url,
        "portfolio_url": student.portfolio_url,
        "experience": student.experience,
        "courses": student.courses,
        "certifications": student.certifications,
        "projects": student.projects,
        "skills": [
            {
                "id": s.id,
                "skill_name": s.skill_name,
                "rating": s.rating,
                "rating_level": s.rating_level
            }
            for s in skills
        ],
        "test_results": [
            {
                "skill_name": t.skill_name,
                "total_questions": t.total_questions,
                "correct_answers": t.correct_answers,
                "score_percentage": t.score_percentage,
                "result_status": t.result_status,
                "test_date": t.test_date
            }
            for t in test_results
        ]
    }

# ============ STUDENT PROFILE ENDPOINTS ============

@app.get("/api/student/profile/{resume_id}")
def get_student_profile(resume_id: int, db: Session = Depends(get_db)):
    """Get student profile details"""
    student = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "phone": student.phone,
        "education": student.education,
        "courses": student.courses,
        "certifications": student.certifications,
        "projects": student.projects,
        "experience": student.experience,
        "location": student.location,
        "linkedin_url": student.linkedin_url,
        "github_url": student.github_url,
        "portfolio_url": student.portfolio_url,
        "about": student.about,
        "is_visible_to_recruiters": student.is_visible_to_recruiters
    }


@app.put("/api/student/profile/{resume_id}")
def update_student_profile(
    resume_id: int,
    data: StudentProfileUpdate,
    db: Session = Depends(get_db)
):
    """Update student profile details"""
    student = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if data.education is not None:
        student.education = data.education
    if data.courses is not None:
        student.courses = data.courses
    if data.certifications is not None:
        student.certifications = data.certifications
    if data.projects is not None:
        student.projects = data.projects
    if data.experience is not None:
        student.experience = data.experience
    if data.location is not None:
        student.location = data.location
    if data.linkedin_url is not None:
        student.linkedin_url = data.linkedin_url
    if data.github_url is not None:
        student.github_url = data.github_url
    if data.portfolio_url is not None:
        student.portfolio_url = data.portfolio_url
    if data.about is not None:
        student.about = data.about
    
    db.commit()
    db.refresh(student)
    
    return {"message": "Profile updated successfully", "id": student.id}

@app.get("/api/resumes")
def get_all_resumes(db: Session = Depends(get_db)):
    resumes = db.query(models.Resume).order_by(models.Resume.uploaded_at.desc()).all()
    
    result = []
    for resume in resumes:
        skills = db.query(models.Skill).filter(models.Skill.resume_id == resume.id).all()
        concepts = db.query(models.ConceptSkill).filter(models.ConceptSkill.resume_id == resume.id).all()
        result.append({
            "id": resume.id,
            "filename": resume.filename,
            "name": resume.name,
            "email": resume.email,
            "phone": resume.phone,
            "role": resume.role or "student",
            "skills": [s.skill_name for s in skills],
            "concepts": [c.concept_name for c in concepts],
            "skills_rated": resume.skills_rated,
            "test_completed": resume.test_completed,
            "uploaded_at": resume.uploaded_at,
            "current_step": resume.current_step,
            "status": resume.status,
            # NEW FIELDS
            "is_visible_to_recruiters": resume.is_visible_to_recruiters or False,
            "approved_by_admin_at": resume.approved_by_admin_at,
            "admin_notes": resume.admin_notes,
            "location": resume.location,
            "education": resume.education,
            "about": resume.about,
            "linkedin_url": resume.linkedin_url,
            "github_url": resume.github_url,
            "portfolio_url": resume.portfolio_url,
            "courses": resume.courses,
            "certifications": resume.certifications,
            "projects": resume.projects,
            "experience": resume.experience
        })
    return result

class PositionCreate(BaseModel):
    recruiter_id: int
    title: str
    department: Optional[str] = None
    vacancies: Optional[int] = 1
    location: Optional[str] = None
    work_mode: Optional[str] = None
    employment_type: Optional[str] = None
    min_qualification: Optional[str] = None
    specialization: Optional[str] = None
    graduation_years: Optional[str] = None
    min_percentage: Optional[str] = None
    required_skills: Optional[str] = None
    preferred_skills: Optional[str] = None
    experience_level: Optional[str] = None
    salary_range: Optional[str] = None
    joining_requirement: Optional[str] = None


class SendProfilesPayload(BaseModel):
    position_id: int
    student_ids: List[int]
    admin_notes: Optional[str] = None



@app.post("/api/recruiter/position")
def create_position(data: PositionCreate, db: Session = Depends(get_db)):
    recruiter = db.query(models.Recruiter).filter(
        models.Recruiter.id == data.recruiter_id
    ).first()
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")

    position = models.Position(**data.dict())
    db.add(position)
    db.commit()
    db.refresh(position)

    return {"message": "Position created", "id": position.id, "status": position.status}


@app.get("/api/recruiter/{recruiter_id}/positions")
def list_positions(recruiter_id: int, db: Session = Depends(get_db)):
    positions = db.query(models.Position).filter(
        models.Position.recruiter_id == recruiter_id
    ).order_by(models.Position.created_at.desc()).all()

    return [
        {
            "id": p.id,
            "title": p.title,
            "department": p.department,
            "vacancies": p.vacancies,
            "location": p.location,
            "work_mode": p.work_mode,
            "employment_type": p.employment_type,
            "required_skills": p.required_skills,
            "status": p.status,
            "created_at": p.created_at,
            "candidate_count": len(p.recommendations)
        }
        for p in positions
    ]


@app.get("/api/recruiter/{recruiter_id}/stats")
def recruiter_stats(recruiter_id: int, db: Session = Depends(get_db)):
    """Dashboard metrics"""
    positions = db.query(models.Position).filter(
        models.Position.recruiter_id == recruiter_id,
        models.Position.status == "open"
    ).all()

    all_recs = db.query(models.ProfileRecommendation).filter(
        models.ProfileRecommendation.recruiter_id == recruiter_id
    ).all()

    def count(statuses):
        return len([r for r in all_recs if r.status in statuses])

    return {
        "activePositions": len(positions),
        "profilesReceived": len(all_recs),
        "newProfiles": count(["sent"]),
        "shortlisted": count(["shortlisted"]),
        "interviews": count(["interview"]),
        "selected": count(["selected", "offered", "joined"]),
        "onHold": count(["on_hold"]),
        "rejected": count(["rejected"]),
    }

@app.get("/api/admin/position/{position_id}/matching-students")
def get_matching_students(position_id: int, db: Session = Depends(get_db)):
    """Find students matching a position's requirements"""
    position = db.query(models.Position).filter(models.Position.id == position_id).first()
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    # Start with all students
    students = db.query(models.Resume).filter(
        models.Resume.role == "student"
    ).all()

    # Already-recommended student IDs for this position
    already_recs = db.query(models.ProfileRecommendation.student_id).filter(
        models.ProfileRecommendation.position_id == position_id
    ).all()
    already_sent = {r[0] for r in already_recs}

    required_skills = []
    if position.required_skills:
        required_skills = [s.strip().lower() for s in position.required_skills.split(",") if s.strip()]

    result = []
    for student in students:
        skills = db.query(models.Skill).filter(
            models.Skill.resume_id == student.id
        ).all()
        skill_names = [s.skill_name.lower() for s in skills]

        # Skill match
        matched = [rs for rs in required_skills if any(rs in sn for sn in skill_names)]
        match_score = (len(matched) / len(required_skills) * 100) if required_skills else 0

        # Test scores
        tests = db.query(models.TestSummary).filter(
            models.TestSummary.resume_id == student.id
        ).all()
        avg_score = sum([t.score_percentage for t in tests]) / len(tests) if tests else 0

        result.append({
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "location": student.location,
            "education": student.education or student.degree,
            "graduation_year": student.year_of_passout,
            "skills": [s.skill_name for s in skills],
            "match_score": round(match_score, 1),
            "matched_skills": matched,
            "avg_test_score": round(avg_score, 1),
            "already_recommended": student.id in already_sent,
            "profile_complete": bool(student.education and student.skills),
            "is_visible_to_recruiters": student.is_visible_to_recruiters or False
        })

    result.sort(key=lambda x: (x["match_score"], x["avg_test_score"]), reverse=True)
    return result


@app.post("/api/admin/send-profiles")
def send_profiles_to_recruiter(data: SendProfilesPayload, db: Session = Depends(get_db)):
    """Admin sends selected students to recruiter for a position"""
    position = db.query(models.Position).filter(models.Position.id == data.position_id).first()
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    sent = 0
    skipped = 0
    for student_id in data.student_ids:
        # Skip if already sent
        existing = db.query(models.ProfileRecommendation).filter(
            models.ProfileRecommendation.position_id == data.position_id,
            models.ProfileRecommendation.student_id == student_id
        ).first()

        if existing:
            skipped += 1
            continue

        rec = models.ProfileRecommendation(
            position_id=data.position_id,
            student_id=student_id,
            recruiter_id=position.recruiter_id,
            admin_notes=data.admin_notes,
            status="sent"
        )
        db.add(rec)

        # Also mark student visible to recruiters (so they can be viewed)
        student = db.query(models.Resume).filter(models.Resume.id == student_id).first()
        if student and not student.is_visible_to_recruiters:
            student.is_visible_to_recruiters = True
            student.approved_by_admin_at = datetime.now(timezone.utc)
            if data.admin_notes:
                student.admin_notes = data.admin_notes

        sent += 1

    db.commit()
    return {"message": f"Sent {sent} profiles", "sent": sent, "skipped": skipped}


@app.get("/api/admin/pipeline/{position_id}")
def admin_pipeline(position_id: int, db: Session = Depends(get_db)):
    """Admin: track hiring pipeline for a position"""
    position = db.query(models.Position).filter(models.Position.id == position_id).first()
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    recs = db.query(models.ProfileRecommendation).filter(
        models.ProfileRecommendation.position_id == position_id
    ).all()

    def count(statuses):
        return len([r for r in recs if r.status in statuses])

    return {
        "position_title": position.title,
        "vacancies": position.vacancies,
        "total_recommended": len(recs),
        "sent": count(["sent"]),
        "viewed": count(["viewed"]),
        "shortlisted": count(["shortlisted"]),
        "interview": count(["interview"]),
        "selected": count(["selected", "offered"]),
        "joined": count(["joined"]),
        "rejected": count(["rejected"]),
    }
@app.get("/api/admin/recruiters")
def get_all_recruiters(db: Session = Depends(get_db)):
    """Get all recruiters with full company details (safe against missing columns)."""
    recruiters = db.query(models.Recruiter).order_by(
        models.Recruiter.created_at.desc()
    ).all()

    def safe(obj, attr, default=None):
        return getattr(obj, attr, default)

    return [
        {
            "id": r.id,
            "name": safe(r, "name"),
            "email": safe(r, "email"),
            "phone": safe(r, "phone"),
            "designation": safe(r, "designation"),
            "linkedin_url": safe(r, "linkedin_url"),
            "preferred_contact_method": safe(r, "preferred_contact_method"),

            "company_name": safe(r, "company_name"),
            "company_type": safe(r, "company_type"),
            "company_website": safe(r, "company_website"),
            "company_size": safe(r, "company_size"),
            "industry": parse_industry(safe(r, "industry")),
            "company_description": safe(r, "company_description"),
            "company_logo_url": safe(r, "company_logo_url"),

            "country": safe(r, "country"),
            "state": safe(r, "state"),
            "city": safe(r, "city"),
            "complete_address": safe(r, "complete_address"),
            "pincode": safe(r, "pincode"),
            "location": safe(r, "location"),

            "legal_business_name": safe(r, "legal_business_name"),
            "gst_number": safe(r, "gst_number"),
            "cin_number": safe(r, "cin_number"),
            "business_registration_url": safe(r, "business_registration_url"),
            "company_domain_proof_url": safe(r, "company_domain_proof_url"),

            "is_approved": safe(r, "is_approved", False),
            "status": safe(r, "status", "pending_approval"),
            "created_at": safe(r, "created_at"),
            "updated_at": safe(r, "updated_at"),
        }
        for r in recruiters
    ]

@app.get("/api/recruiter/{recruiter_id}/recommendations")
def get_recruiter_recommendations(recruiter_id: int, db: Session = Depends(get_db)):
    """Get all profiles sent to this recruiter by admin"""
    recs = db.query(models.ProfileRecommendation).filter(
        models.ProfileRecommendation.recruiter_id == recruiter_id
    ).order_by(models.ProfileRecommendation.sent_at.desc()).all()

    result = []
    for r in recs:
        student = r.student
        skills = db.query(models.Skill).filter(
            models.Skill.resume_id == student.id
        ).all() if student else []

        result.append({
            "id": r.id,
            "student_id": r.student_id,
            "student_name": student.name if student else "Unknown",
            "student_email": student.email if student else "",
            "position_id": r.position_id,
            "position_title": r.position.title if r.position else "Unknown",
            "top_skills": [s.skill_name for s in skills[:5]],
            "status": r.status,
            "admin_notes": r.admin_notes,
            "sent_at": r.sent_at
        })

    return result


@app.get("/api/recruiter/recommendation/{rec_id}")
def get_recommendation_detail(rec_id: int, db: Session = Depends(get_db)):
    """Full candidate profile for a recommendation"""
    r = db.query(models.ProfileRecommendation).filter(
        models.ProfileRecommendation.id == rec_id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    student = r.student
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    skills = db.query(models.Skill).filter(models.Skill.resume_id == student.id).all()
    tests = db.query(models.TestSummary).filter(models.TestSummary.resume_id == student.id).all()

    return {
        "id": r.id,
        "status": r.status,
        "admin_notes": r.admin_notes,

        "student_name": student.name,
        "student_email": student.email,
        "phone": student.phone,
        "location": student.location,
        "education": student.education or student.degree,
        "graduation_year": student.year_of_passout,
        "experience": student.experience,
        "about": student.about,
        "linkedin_url": student.linkedin_url,
        "github_url": student.github_url,
        "portfolio_url": student.portfolio_url,
        "courses": student.courses,
        "certifications": student.certifications,
        "projects": student.projects,

        "skills": [
            {"skill_name": s.skill_name, "rating": s.rating, "level": s.rating_level}
            for s in skills
        ],
        "assessments": [
            {"skill": t.skill_name, "score": t.score_percentage, "status": t.result_status}
            for t in tests
        ],

        "position_title": r.position.title if r.position else None
    }


@app.put("/api/recruiter/recommendation/{rec_id}/viewed")
def mark_viewed(rec_id: int, db: Session = Depends(get_db)):
    r = db.query(models.ProfileRecommendation).filter(
        models.ProfileRecommendation.id == rec_id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")

    if r.status == "sent":
        r.status = "viewed"
        r.viewed_at = datetime.now(timezone.utc)
        db.commit()

    return {"message": "Marked viewed", "status": r.status}


@app.put("/api/recruiter/recommendation/{rec_id}/status")
def update_recommendation_status(rec_id: int, data: dict, db: Session = Depends(get_db)):
    """Update status through the hiring pipeline."""
    valid = {
        "viewed", "shortlisted", "interview",
        "selected", "offered", "joined",
        "rejected", "on_hold",
    }
    new_status = data.get("status")

    if new_status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {sorted(valid)}")

    r = db.query(models.ProfileRecommendation).filter(
        models.ProfileRecommendation.id == rec_id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")

    r.status = new_status
    if new_status == "shortlisted":
        r.shortlisted_at = datetime.now(timezone.utc)

    db.commit()
    return {"message": "Status updated", "status": r.status}

@app.put("/api/recruiter/recommendation/{rec_id}/feedback")
def submit_feedback(rec_id: int, data: dict, db: Session = Depends(get_db)):
    """Recruiter submits structured feedback"""
    r = db.query(models.ProfileRecommendation).filter(
        models.ProfileRecommendation.id == rec_id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")

    r.technical_rating = data.get("technical_rating")
    r.communication_rating = data.get("communication_rating")
    r.relevance = data.get("relevance")
    r.next_action = data.get("next_action")
    r.recruiter_feedback = data.get("comments")

    db.commit()
    return {"message": "Feedback submitted"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)