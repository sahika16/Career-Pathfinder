from sqlalchemy import Column, Integer, String, DateTime, LargeBinary, Text, Float, ForeignKey, Boolean
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
    
    role = Column(String(20), default="student")
    password = Column(String(255), nullable=True)
    is_approved = Column(Boolean, default=False)
    specialty = Column(String(100), nullable=True)
    experience = Column(Text, nullable=True)
    education = Column(Text, nullable=True)
    
    otp = Column(String(6), nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    is_verified = Column(Boolean, default=False)
    
    skills_reviewed = Column(Boolean, default=False)
    skills_rated = Column(Boolean, default=False)
    test_completed = Column(Boolean, default=False)
    concept_test_completed = Column(Boolean, default=False)
    current_step = Column(String(50), default="upload")
    
    status = Column(String(50), default="pending")
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    skills = relationship("Skill", back_populates="resume", cascade="all, delete-orphan")
    concept_skills = relationship("ConceptSkill", back_populates="resume", cascade="all, delete-orphan")
    test_results = relationship("TestResult", back_populates="resume", cascade="all, delete-orphan")


# ====== Trainer Table (Separate from Resumes) ======
class Trainer(Base):
    __tablename__ = "trainers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password = Column(String(255), nullable=False)
    specialty = Column(String(100), nullable=True)
    experience = Column(Text, nullable=True)
    education = Column(Text, nullable=True)
    is_approved = Column(Boolean, default=False)
    status = Column(String(50), default="pending_approval")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


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