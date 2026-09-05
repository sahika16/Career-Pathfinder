from sqlalchemy import Column, Integer, String, DateTime, LargeBinary, Text, Float, ForeignKey, Boolean, DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_data = Column(LargeBinary, nullable=False)
    file_size = Column(Integer, nullable=False)
    extracted_text = Column(Text, nullable=True)
    
    name = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    year_of_passout = Column(String(20), nullable=True)
    degree = Column(String(100), nullable=True)
    branch = Column(String(100), nullable=True)
    experience = Column(Text, nullable=True) 
    skills = Column(Text, nullable=True)       
    registered_without_resume = Column(Boolean, default=False)
    
    role = Column(String(20), default="student")
    password = Column(String(255), nullable=True)
    is_approved = Column(Boolean, default=False)
    specialty = Column(String(100), nullable=True)
    education = Column(Text, nullable=True)
    
    otp = Column(String(6), nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    is_verified = Column(Boolean, default=False)
    
    skills_reviewed = Column(Boolean, default=False)
    skills_rated = Column(Boolean, default=False)
    test_completed = Column(Boolean, default=False)
    concept_test_completed = Column(Boolean, default=False)
    current_step = Column(String(50), default="upload")
    complete_status = Column(Boolean, default=False)
    
    status = Column(String(50), default="pending")
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    referral_code = Column(String(20), nullable=True, unique=True)
    referred_by = Column(String(20), nullable=True)  
    referral_count = Column(Integer, default=0) 
    referral_earnings = Column(Integer, default=0)  
    
    referred_users = relationship("Resume", 
                                   remote_side=[id],
                                   foreign_keys=[referred_by],
                                   backref="referrer")
    
    skills = relationship("Skill", back_populates="resume", cascade="all, delete-orphan")
    concept_skills = relationship("ConceptSkill", back_populates="resume", cascade="all, delete-orphan")
    test_results = relationship("TestResult", back_populates="resume", cascade="all, delete-orphan")
    coachings = relationship("PersonalizedCoaching", back_populates="student", cascade="all, delete-orphan")

# ====== Trainer Table ======
class Trainer(Base):
    __tablename__ = "trainers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), default="trainer")
    category = Column(String(50), default="regular")
    specialty = Column(String(100), nullable=True)
    experience = Column(Text, nullable=True)  # ✅ Changed to match main.py
    education = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    availability = Column(Text, nullable=True)
    hourly_rate = Column(DECIMAL(10,2), nullable=True)
    skills_taught = Column(Text, nullable=True)
    rating = Column(DECIMAL(3,2), default=0)
    is_approved = Column(Boolean, default=False)
    status = Column(String(50), default="pending_approval")
    
    # Trainer Settings Fields
    available_days = Column(Text, nullable=True)
    available_time_start = Column(String(10), nullable=True)
    available_time_end = Column(String(10), nullable=True)
    about = Column(Text, nullable=True)
    expertise = Column(Text, nullable=True)
    qualifications = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    contents = relationship("TrainerContent", back_populates="trainer", cascade="all, delete-orphan")
    sessions = relationship("TrainerSession", back_populates="trainer", cascade="all, delete-orphan")
    coachings = relationship("PersonalizedCoaching", back_populates="trainer", cascade="all, delete-orphan")

# ====== Skill Models ======
class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    skill_name = Column(String(100), nullable=False)
    rating = Column(Integer, nullable=True)
    rating_level = Column(String(20), nullable=True)
    is_core = Column(Boolean, default=True)
    
    resume = relationship("Resume", back_populates="skills")

class ConceptSkill(Base):
    __tablename__ = "concept_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    concept_name = Column(String(100), nullable=False)
    rating = Column(Integer, nullable=True)
    rating_level = Column(String(20), nullable=True)
    
    resume = relationship("Resume", back_populates="concept_skills")

# ====== Assessment Models ======
class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    skill_name = Column(String(100), nullable=False)
    difficulty = Column(String(20), nullable=False)
    question_text = Column(Text, nullable=False)
    option_a = Column(Text, nullable=False)
    option_b = Column(Text, nullable=False)
    option_c = Column(Text, nullable=False)
    option_d = Column(Text, nullable=False)
    correct_answer = Column(String(1), nullable=False)
    explanation = Column(Text, nullable=True)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    test_results = relationship("TestResult", back_populates="question")

class TestResult(Base):
    __tablename__ = "test_results"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    skill_name = Column(String(100), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"))
    user_answer = Column(String(1), nullable=True)
    is_correct = Column(Boolean, default=False)
    test_date = Column(DateTime(timezone=True), server_default=func.now())
    
    resume = relationship("Resume", back_populates="test_results")
    question = relationship("Question", back_populates="test_results")

class TestSummary(Base):
    __tablename__ = "test_summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    skill_name = Column(String(100), nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    score_percentage = Column(Float, nullable=False)
    result_status = Column(String(20), nullable=False)
    test_date = Column(DateTime(timezone=True), server_default=func.now())
    
    resume = relationship("Resume")

# ====== Trainer Content Model ======
class TrainerContent(Base):
    __tablename__ = "trainer_contents"
    
    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content_type = Column(String(50), default="video")
    content_url = Column(Text, nullable=True)
    skill_name = Column(String(100), nullable=True)
    difficulty = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    trainer = relationship("Trainer", back_populates="contents")

# ====== Trainer Session Model ======
class TrainerSession(Base):
    __tablename__ = "trainer_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    session_date = Column(DateTime(timezone=True), nullable=True)
    start_time = Column(String(10), nullable=True)
    end_time = Column(String(10), nullable=True)
    duration_minutes = Column(Integer, default=60)
    max_students = Column(Integer, default=10)
    enrolled_count = Column(Integer, default=0)
    price = Column(DECIMAL(10,2), default=0)
    category = Column(String(100), nullable=True)
    level = Column(String(50), nullable=True)
    meeting_link = Column(Text, nullable=True)
    status = Column(String(50), default="scheduled")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    trainer = relationship("Trainer", back_populates="sessions")

# ====== Personalized Coaching Model ======
class PersonalizedCoaching(Base):
    __tablename__ = "personalized_coachings"
    
    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"))
    student_id = Column(Integer, ForeignKey("resumes.id"))
    student_name = Column(String(100), nullable=True)
    student_email = Column(String(100), nullable=True)
    skill_name = Column(String(100), nullable=True)
    current_level = Column(String(20), nullable=True)
    target_level = Column(String(20), nullable=True)
    status = Column(String(50), default="pending")
    session_count = Column(Integer, default=0)
    total_sessions = Column(Integer, default=5)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    trainer = relationship("Trainer", back_populates="coachings")
    student = relationship("Resume", back_populates="coachings")