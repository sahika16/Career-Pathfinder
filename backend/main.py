from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import pdfplumber
import io
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import List, Optional
import models
from database import engine, get_db
from resume_parser import parse_resume
import random
from datetime import datetime, timedelta
from assessment import (
    generate_test_for_skill, 
    evaluate_test_submission, 
    get_test_results,
    get_available_skills_for_assessment,
    has_test_been_taken,
    get_completed_skills
)

# ====== ENVIRONMENT VARIABLES ======
import os
from dotenv import load_dotenv

# ====== SMTP ======
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ====== TWILIO ======
from twilio.rest import Client

# ====== BCRYPT ======
import bcrypt

# Load environment variables from .env file
load_dotenv()

# ====== SMTP CREDENTIALS ======
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_APP_PASSWORD = os.getenv("SMTP_APP_PASSWORD")

# ====== TWILIO CREDENTIALS ======
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

# ====== ADMIN CREDENTIALS (from .env) ======
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH")

# ====== DATABASE URL ======
DATABASE_URL = os.getenv("DATABASE_URL")

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Career Pathfinder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====== Request Models ======
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
    password: str

class TrainerLogin(BaseModel):
    email: str
    password: str

class AdminLogin(BaseModel):
    email: str
    password: str

# ====== Helper Functions ======
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

# ====== PHONE NUMBER CLEANING FUNCTION ======
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

# ====== TWILIO OTP SENDING FUNCTION ======
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

# ====== SMTP EMAIL OTP FUNCTION ======
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

# ====== UPLOAD RESUME ======
@app.post("/api/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    file_content = await file.read()
    file_size = len(file_content)
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")
    
    try:
        extracted_text = extract_pdf_text(file_content)
        parsed_data = parse_resume(extracted_text)
        
        phone = parsed_data.get('phone')
        if phone:
            phone = normalize_phone_for_db(phone)
        
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
        print(f"✅ Found {len(all_skills)} skills: {all_skills}")
        
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

# ====== GET ALL RESUMES ======
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

# ====== GET SKILLS FOR A RESUME ======
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

# ====== GET CONCEPT SKILLS ======
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

# ====== UPDATE A SKILL ======
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

# ====== ADD A SKILL ======
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

# ====== DELETE A SKILL ======
@app.delete("/api/skills/{skill_id}")
def delete_skill(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    db.delete(skill)
    db.commit()
    return {"message": "Skill deleted"}

# ====== UPDATE ALL RATINGS ======
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

# ====== UPDATE CONCEPT SKILL RATING ======
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

# ====== UPDATE ALL CONCEPT RATINGS ======
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

# ====== UPDATE RESUME STATUS ======
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

# ====== STUDENT OTP LOGIN ENDPOINTS ======

@app.post("/api/login/send-otp")
def send_login_otp(login_data: dict, db: Session = Depends(get_db)):
    email = login_data.get('email')
    phone = login_data.get('phone')
    
    if not email and not phone:
        raise HTTPException(status_code=400, detail="Email or phone is required")
    
    is_email = email and '@' in email and '.' in email
    
    resume = None
    contact_method = None
    
    if is_email:
        resume = db.query(models.Resume).filter(models.Resume.email == email).first()
        contact_method = 'email'
    else:
        resume = find_resume_by_phone(phone, db)
        contact_method = 'phone'
    
    if not resume:
        raise HTTPException(status_code=404, detail="No account found with this email/phone. Please upload resume first.")
    
    otp = str(random.randint(100000, 999999))
    
    resume.otp = otp
    resume.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    resume.is_verified = False
    
    db.commit()
    db.refresh(resume)
    
    sent = False
    
    if contact_method == 'email' and resume.email:
        sent, result = send_otp_email(resume.email, otp, resume.name or "Student")
        print(f"📧 OTP sent to email: {resume.email}")
    elif contact_method == 'phone' and resume.phone:
        sent, result = send_otp_sms(resume.phone, otp, resume.name or "Student")
        print(f"📱 OTP sent to phone: {resume.phone}")
    else:
        sent = False
    
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
        print(f"⚠️ OTP sending failed. OTP for testing: {otp}")
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
    if '@' in email_or_phone and '.' in email_or_phone:
        resume = db.query(models.Resume).filter(models.Resume.email == email_or_phone).first()
    else:
        resume = find_resume_by_phone(email_or_phone, db)
    
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

# ====== TRAINER REGISTRATION ======
@app.post("/api/trainer/register")
def register_trainer(trainer_data: TrainerRegister, db: Session = Depends(get_db)):
    existing = db.query(models.Resume).filter(models.Resume.email == trainer_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = bcrypt.hashpw(trainer_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    trainer = models.Resume(
        name=trainer_data.name,
        email=trainer_data.email,
        phone=trainer_data.phone,
        role="trainer",
        password=hashed_password,
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
        "email": trainer.email
    }

# ====== TRAINER LOGIN ======
@app.post("/api/login/trainer")
def login_trainer(login_data: TrainerLogin, db: Session = Depends(get_db)):
    trainer = db.query(models.Resume).filter(
        models.Resume.email == login_data.email,
        models.Resume.role == 'trainer'
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
        "role": "trainer"
    }

# ====== ADMIN LOGIN ======
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

# ====== ADMIN: Get Pending Trainers ======
@app.get("/api/admin/pending-trainers")
def get_pending_trainers(db: Session = Depends(get_db)):
    trainers = db.query(models.Resume).filter(
        models.Resume.role == 'trainer',
        models.Resume.is_approved == False
    ).all()
    
    return [
        {
            "id": t.id,
            "name": t.name,
            "email": t.email,
            "phone": t.phone,
            "education": t.education,
            "experience": t.experience,
            "specialty": t.specialty,
            "created_at": t.uploaded_at
        }
        for t in trainers
    ]

# ====== ADMIN: Approve Trainer ======
@app.put("/api/admin/approve-trainer/{trainer_id}")
def approve_trainer(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(models.Resume).filter(
        models.Resume.id == trainer_id,
        models.Resume.role == 'trainer'
    ).first()
    
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    trainer.is_approved = True
    trainer.status = "approved"
    
    db.commit()
    db.refresh(trainer)
    
    return {
        "message": "Trainer approved successfully",
        "id": trainer.id,
        "name": trainer.name
    }

# ====== ADMIN: Get All Trainers ======
@app.get("/api/admin/trainers")
def get_all_trainers(db: Session = Depends(get_db)):
    trainers = db.query(models.Resume).filter(models.Resume.role == 'trainer').all()
    
    return [
        {
            "id": t.id,
            "name": t.name,
            "email": t.email,
            "phone": t.phone,
            "is_approved": t.is_approved,
            "status": t.status,
            "created_at": t.uploaded_at
        }
        for t in trainers
    ]

# ====== ADMIN: Get All Students ======
@app.get("/api/admin/students")
def get_all_students(db: Session = Depends(get_db)):
    students = db.query(models.Resume).filter(models.Resume.role == 'student').all()
    
    return [
        {
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "phone": s.phone,
            "skills": [skill.skill_name for skill in s.skills],
            "concepts": [concept.concept_name for concept in s.concept_skills],
            "uploaded_at": s.uploaded_at
        }
        for s in students
    ]

# ====== ASSESSMENT ENDPOINTS ======

@app.get("/api/test/generate/{resume_id}/{skill_name}")
def generate_test(resume_id: int, skill_name: str, db: Session = Depends(get_db)):
    """Generate a test for a specific skill"""
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Get the skill rating
    skill = db.query(models.Skill).filter(
        models.Skill.resume_id == resume_id,
        models.Skill.skill_name.ilike(skill_name)
    ).first()
    
    if not skill:
        raise HTTPException(status_code=404, detail=f"Skill '{skill_name}' not found")
    
    if skill.rating is None:
        raise HTTPException(status_code=400, detail="Skill not rated yet")
    
    # Determine difficulty based on rating
    if skill.rating <= 4:
        difficulty = "Easy"
    elif skill.rating <= 7:
        difficulty = "Medium"
    else:
        difficulty = "Hard"
    
    # Check if test already taken
    from assessment import has_test_been_taken
    if has_test_been_taken(resume_id, skill_name, db):
        return {
            "skill": skill_name,
            "difficulty": difficulty,
            "rating": skill.rating,
            "already_taken": True,
            "message": "You have already completed this test."
        }
    
    # Generate test questions
    questions = generate_test_for_skill(skill_name, difficulty, db)
    
    if not questions:
        raise HTTPException(status_code=404, detail=f"No questions found for {skill_name} with {difficulty} difficulty")
    
    return {
        "skill": skill_name,
        "difficulty": difficulty,
        "rating": skill.rating,
        "total_questions": len(questions),
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d
            }
            for q in questions
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
        models.TestSummary.skill_name == skill_name
    ).first()
    
    if not summary:
        raise HTTPException(status_code=404, detail="No test results found for this skill")
    
    results = db.query(models.TestResult).filter(
        models.TestResult.resume_id == resume_id,
        models.TestResult.skill_name == skill_name
    ).all()
    
    return {
        "summary": {
            "skill_name": summary.skill_name,
            "total_questions": summary.total_questions,
            "correct_answers": summary.correct_answers,
            "score_percentage": summary.score_percentage,
            "result_status": summary.result_status,
            "test_date": summary.test_date
        },
        "details": [
            {
                "question_id": r.question_id,
                "user_answer": r.user_answer,
                "is_correct": r.is_correct
            }
            for r in results
        ]
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

# ====== ADMIN: Question Management ======

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
    """Get all skills with ratings AND questions for assessment"""
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
    """Get list of skills already completed by student"""
    from assessment import get_completed_skills
    completed = get_completed_skills(resume_id, db)
    return {"completed": completed}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)