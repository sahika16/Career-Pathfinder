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