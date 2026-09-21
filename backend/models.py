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

    # Referral fields
    referral_code = Column(String(50), nullable=True, unique=True)
    referred_by = Column(String(50), nullable=True)  
    referral_count = Column(Integer, default=0)
    referral_earnings = Column(Integer, default=0)  
    
    # Relationships
    skills = relationship("Skill", back_populates="resume", cascade="all, delete-orphan")
    concept_skills = relationship("ConceptSkill", back_populates="resume", cascade="all, delete-orphan")
    test_results = relationship("TestResult", back_populates="resume", cascade="all, delete-orphan")
    coachings = relationship("PersonalizedCoaching", back_populates="student", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", foreign_keys="Enrollment.student_id", back_populates="student", cascade="all, delete-orphan")
    attendances = relationship("Attendance", foreign_keys="Attendance.student_id", back_populates="student", cascade="all, delete-orphan")
    course_enrollments = relationship("CourseEnrollment", foreign_keys="CourseEnrollment.student_id", back_populates="student", cascade="all, delete-orphan")

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
    experience = Column(Text, nullable=True)
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
    courses = relationship("Course", back_populates="trainer", cascade="all, delete-orphan")
    attendances_marked = relationship("Attendance", foreign_keys="Attendance.marked_by", back_populates="trainer")

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

# ====== Trainer Content Model with Approval ======
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
    # Approval fields
    is_approved = Column(Boolean, default=False)
    status = Column(String(50), default="pending")  # pending, approved, rejected
    admin_notes = Column(Text, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)
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
    enrollments = relationship("Enrollment", foreign_keys="Enrollment.session_id", back_populates="session", cascade="all, delete-orphan")
    attendances = relationship("Attendance", foreign_keys="Attendance.session_id", back_populates="session", cascade="all, delete-orphan")

# ====== Course Model with Approval ======
class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    level = Column(String(50), nullable=True)  # Beginner, Intermediate, Advanced
    duration_minutes = Column(Integer, default=60)
    max_students = Column(Integer, default=10)
    price = Column(DECIMAL(10,2), default=0)
    meeting_link = Column(Text, nullable=True)
    # Approval fields
    is_approved = Column(Boolean, default=False)
    status = Column(String(50), default="pending")  # pending, approved, rejected
    admin_notes = Column(Text, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    trainer = relationship("Trainer", back_populates="courses")
    enrollments = relationship("CourseEnrollment", back_populates="course", cascade="all, delete-orphan")

# ====== Course Enrollment Model ======
class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("resumes.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    status = Column(String(50), default="enrolled")  # enrolled, in_progress, completed
    progress = Column(Integer, default=0)
    attendance_percentage = Column(Integer, default=0)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    student = relationship("Resume", foreign_keys=[student_id], back_populates="course_enrollments")
    course = relationship("Course", back_populates="enrollments")

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

# ====== Enrollment and Attendance Models ======
class Enrollment(Base):
    __tablename__ = "enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("trainer_sessions.id"), nullable=False)
    status = Column(String(50), default="enrolled")
    progress = Column(Integer, default=0)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    student = relationship("Resume", foreign_keys=[student_id], back_populates="enrollments")
    session = relationship("TrainerSession", foreign_keys=[session_id], back_populates="enrollments")

class Attendance(Base):
    __tablename__ = "attendances"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("trainer_sessions.id"), nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), default="present")
    marked_by = Column(Integer, ForeignKey("trainers.id"), nullable=True)
    notes = Column(Text, nullable=True)
    marked_at = Column(DateTime(timezone=True), server_default=func.now())
    
    student = relationship("Resume", foreign_keys=[student_id], back_populates="attendances")
    session = relationship("TrainerSession", foreign_keys=[session_id], back_populates="attendances")
    trainer = relationship("Trainer", foreign_keys=[marked_by], back_populates="attendances_marked")

# ====== Training Institute/Partner Models ======

class TrainingInstitute(Base):
    __tablename__ = "training_institutes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), default="institute")
    
    # Institute Details
    institute_name = Column(String(200), nullable=True)
    institute_type = Column(String(50), default="training")  # training, partner, both
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    website = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    
    # Contact Person
    contact_person_name = Column(String(100), nullable=True)
    contact_person_designation = Column(String(100), nullable=True)
    contact_person_phone = Column(String(20), nullable=True)
    
    # Business Details
    registration_number = Column(String(100), nullable=True)
    gst_number = Column(String(50), nullable=True)
    pan_number = Column(String(20), nullable=True)
    
    # Approval & Status
    is_approved = Column(Boolean, default=False)
    status = Column(String(50), default="pending_approval")  # pending_approval, approved, rejected, suspended
    
    # Partnership Details
    partnership_type = Column(String(50), nullable=True)  # referral, franchise, affiliate
    commission_rate = Column(DECIMAL(5,2), default=0)
    
    # Settings
    available_days = Column(Text, nullable=True)
    available_time_start = Column(String(10), nullable=True)
    available_time_end = Column(String(10), nullable=True)
    
    # Stats
    total_students_enrolled = Column(Integer, default=0)
    total_courses_offered = Column(Integer, default=0)
    rating = Column(DECIMAL(3,2), default=0)
    
    # Referral
    referral_code = Column(String(50), nullable=True, unique=True)
    referral_count = Column(Integer, default=0)
    referral_earnings = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    courses = relationship("InstituteCourse", back_populates="institute", cascade="all, delete-orphan")
    enrollments = relationship("InstituteEnrollment", back_populates="institute", cascade="all, delete-orphan")
    batches = relationship("InstituteBatch", back_populates="institute", cascade="all, delete-orphan")


class InstituteCourse(Base):
    __tablename__ = "institute_courses"
    
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("training_institutes.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    level = Column(String(50), nullable=True)  # Beginner, Intermediate, Advanced
    duration_hours = Column(Integer, default=40)
    duration_weeks = Column(Integer, default=4)
    mode = Column(String(50), default="online")  # online, offline, hybrid
    price = Column(DECIMAL(10,2), default=0)
    max_students_per_batch = Column(Integer, default=30)
    syllabus = Column(Text, nullable=True)
    prerequisites = Column(Text, nullable=True)
    certification = Column(Boolean, default=True)
    
    # Approval
    is_approved = Column(Boolean, default=False)
    status = Column(String(50), default="pending")
    admin_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    institute = relationship("TrainingInstitute", back_populates="courses")
    batches = relationship("InstituteBatch", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("InstituteEnrollment", back_populates="course", cascade="all, delete-orphan")


class InstituteBatch(Base):
    __tablename__ = "institute_batches"
    
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("training_institutes.id"))
    course_id = Column(Integer, ForeignKey("institute_courses.id"))
    batch_name = Column(String(100), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    timing = Column(String(100), nullable=True)
    days = Column(String(100), nullable=True)
    max_students = Column(Integer, default=30)
    enrolled_count = Column(Integer, default=0)
    trainer_name = Column(String(100), nullable=True)
    meeting_link = Column(Text, nullable=True)
    status = Column(String(50), default="upcoming")  # upcoming, ongoing, completed, cancelled
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    institute = relationship("TrainingInstitute", back_populates="batches")
    course = relationship("InstituteCourse", back_populates="batches")
    enrollments = relationship("InstituteEnrollment", back_populates="batch", cascade="all, delete-orphan")


class InstituteEnrollment(Base):
    __tablename__ = "institute_enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("training_institutes.id"))
    course_id = Column(Integer, ForeignKey("institute_courses.id"))
    batch_id = Column(Integer, ForeignKey("institute_batches.id"))
    student_id = Column(Integer, ForeignKey("resumes.id"))
    
    student_name = Column(String(100), nullable=True)
    student_email = Column(String(100), nullable=True)
    student_phone = Column(String(20), nullable=True)
    
    status = Column(String(50), default="enrolled")  # enrolled, in_progress, completed, dropped
    progress = Column(Integer, default=0)
    attendance_percentage = Column(Integer, default=0)
    payment_status = Column(String(50), default="pending")  # pending, partial, completed
    amount_paid = Column(DECIMAL(10,2), default=0)
    
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    institute = relationship("TrainingInstitute", back_populates="enrollments")
    course = relationship("InstituteCourse", back_populates="enrollments")
    batch = relationship("InstituteBatch", back_populates="enrollments")
    student = relationship("Resume")