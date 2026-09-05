from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import pdfplumber
import io
import shutil
from sqlalchemy import func
import os
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import List, Optional, Union 
import models
from database import engine, get_db
from resume_parser import parse_resume
import random
import string
from datetime import datetime, timedelta 
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
from assessment import (
    generate_test_for_skill, 
    evaluate_test_submission, 
    get_test_results,
    get_available_skills_for_assessment,
    has_test_been_taken,
    get_completed_skills
)
import os
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client
import bcrypt

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

app = FastAPI(title="Career Pathfinder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
            body=f"Hello {name}! Your OTP for Career Pathfinder is: {otp}. Valid for 5 minutes.",
            from_=TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        
        print(f"✅ SMS sent to {phone_number}! SID: {message.sid}")
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
                    <h1 style="color: white; margin: 0; font-size: 28px;">Career Pathfinder</h1>
                </div>
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333;">Hello {name}!</h2>
                    <p style="color: #666; font-size: 16px;">Your OTP for Career Pathfinder login is:</p>
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
        msg['From'] = SMTP_EMAIL
        msg['To'] = email
        msg['Subject'] = "Your OTP for Career Pathfinder"
        msg.attach(MIMEText(html_content, 'html'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_APP_PASSWORD.replace(' ', ''))
        server.send_message(msg)
        server.quit()
        
        print(f"📧 Email OTP sent to {email}")  
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
        
        existing_student = db.query(models.Resume).filter(models.Resume.email == parsed_data.get('email')).first()
        if existing_student:
            raise HTTPException(status_code=400, detail="Email already registered as student")
        
        existing_trainer = db.query(models.Trainer).filter(models.Trainer.email == parsed_data.get('email')).first()
        if existing_trainer:
            raise HTTPException(status_code=400, detail="Email already registered as trainer")
        
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
            current_step="review"
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
        
        return {
            "message": "Resume uploaded successfully",
            "id": resume.id,
            "filename": resume.filename,
            "name": resume.name,
            "email": resume.email,
            "phone": resume.phone,
            "skills": all_skills
        }
        
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
        print(f"⚠️ Email {trainer_data.email} is also a student, proceeding with trainer registration")
    
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
        "message": "Trainer registered successfully. Please wait for admin approval.",
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
        
        url = f"http://localhost:8000/uploads/{filename}"
        
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
    duration_minutes = session_data.get('duration_minutes', 60)
    max_students = session_data.get('max_students', 10)
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

def generate_referral_code(name):
    """Generate a unique referral code"""
    name_part = name[:3].upper() if name else "STU"
    digits = ''.join(random.choices(string.digits, k=4))
    return f"{name_part}{digits}"

@app.post("/api/generate-referral")
def generate_referral_code_for_user(gen_data: dict, db: Session = Depends(get_db)):
    """Generate referral code for a student (works with email or resume_id)"""
    identifier = gen_data.get('identifier')
    name = gen_data.get('name', 'Student')
    email = gen_data.get('email', '')
    
    if not identifier:
        raise HTTPException(status_code=400, detail="Identifier required")
    
    # Find user by resume_id, email, or phone
    resume = db.query(models.Resume).filter(
        (models.Resume.id == identifier) |
        (models.Resume.email == identifier) |
        (models.Resume.phone == identifier)
    ).first()
    
    if not resume:
        # Create a temporary user record if doesn't exist
        resume = models.Resume(
            name=name,
            email=email,
            status="pending"
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)
    
    if resume.referral_code:
        return {
            "referral_code": resume.referral_code,
            "message": "Referral code already exists"
        }
    
    # Generate unique referral code
    code = generate_referral_code(name)
    
    # Make sure it's unique
    while db.query(models.Resume).filter(models.Resume.referral_code == code).first():
        code = generate_referral_code(name)
    
    resume.referral_code = code
    db.commit()
    db.refresh(resume)
    
    return {
        "referral_code": code,
        "message": "Referral code generated successfully"
    }

@app.get("/api/referral/{identifier}")
def get_referral_info(identifier: str, db: Session = Depends(get_db)):
    """Get referral code and stats for a student"""
    # Find by resume_id, email, or phone
    resume = db.query(models.Resume).filter(
        (models.Resume.id == identifier) |
        (models.Resume.email == identifier) |
        (models.Resume.phone == identifier) |
        (models.Resume.referral_code == identifier)
    ).first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Count referred users
    referred_count = db.query(models.Resume).filter(
        models.Resume.referred_by == resume.referral_code
    ).count()
    
    return {
        "referral_code": resume.referral_code,
        "referred_count": referred_count,
        "referral_earnings": resume.referral_earnings or 0,
        "referral_link": f"https://careerpathfinder.com/signup?ref={resume.referral_code}"
    }

@app.post("/api/referral/apply")
def apply_referral(apply_data: dict, db: Session = Depends(get_db)):
    """Apply referral code when a new student signs up"""
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
    
    # Find student by various identifiers
    student = None
    if student_id:
        student = db.query(models.Resume).filter(
            (models.Resume.id == student_id) |
            (models.Resume.email == student_id) |
            (models.Resume.phone == student_id)
        ).first()
    
    if not student and student_email:
        student = db.query(models.Resume).filter(
            models.Resume.email == student_email
        ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Don't allow self-referral
    if referrer.id == student.id:
        raise HTTPException(status_code=400, detail="You cannot refer yourself")
    
    # Check if student already has a referral
    if student.referred_by:
        raise HTTPException(status_code=400, detail="Referral already applied")
    
    # Apply referral
    student.referred_by = referral_code
    referrer.referral_count = (referrer.referral_count or 0) + 1
    referrer.referral_earnings = (referrer.referral_earnings or 0) + 1
    
    db.commit()
    
    return {
        "message": "Referral applied successfully",
        "referrer": referrer.name,
        "referral_code": referral_code
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

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)