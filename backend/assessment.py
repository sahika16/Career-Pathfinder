from sqlalchemy.orm import Session
from sqlalchemy import func
import random
import models
from datetime import datetime, timezone

def get_difficulty_from_rating(rating: int) -> str:
    """Determine difficulty level based on rating"""
    if rating <= 4:
        return "Easy"
    elif rating <= 7:
        return "Medium"
    else:
        return "Hard"

def generate_test_for_skill(skill_name: str, difficulty: str, db: Session, limit: int = None):
    """
    Generate test questions for a specific skill and difficulty
    If limit is not provided, get all available questions
    """
    # Get all questions for this skill and difficulty
    questions = db.query(models.Question).filter(
        models.Question.skill_name == skill_name,
        models.Question.difficulty == difficulty
    ).all()
    
    if not questions:
        return []
    
    # If limit not specified, use all questions
    if limit is None:
        limit = len(questions)
    
    # Shuffle and select up to limit
    shuffled = random.sample(questions, min(limit, len(questions)))
    
    return shuffled

def evaluate_test_submission(resume_id: int, skill_name: str, answers: dict, db: Session):
    """
    Evaluate student's test submission
    answers: {question_id: user_answer}
    """
    total_questions = len(answers)
    correct_count = 0
    results = []
    
    for question_id, user_answer in answers.items():
        # Get question from database
        question = db.query(models.Question).filter(
            models.Question.id == int(question_id)
        ).first()
        
        if not question:
            continue
        
        is_correct = user_answer.upper() == question.correct_answer.upper()
        if is_correct:
            correct_count += 1
        
        # Store individual result
        test_result = models.TestResult(
            resume_id=resume_id,
            skill_name=skill_name,
            question_id=question.id,
            user_answer=user_answer,
            is_correct=is_correct,
            test_date=datetime.now(timezone.utc)
        )
        db.add(test_result)
        results.append({
            "question_id": question.id,
            "user_answer": user_answer,
            "correct_answer": question.correct_answer,
            "is_correct": is_correct
        })
    
    # Calculate score
    score_percentage = (correct_count / total_questions) * 100 if total_questions > 0 else 0
    result_status = "Passed" if score_percentage >= 60 else "Failed"
    
    # Store summary
    summary = models.TestSummary(
        resume_id=resume_id,
        skill_name=skill_name,
        total_questions=total_questions,
        correct_answers=correct_count,
        score_percentage=score_percentage,
        result_status=result_status,
        test_date=datetime.now(timezone.utc)
    )
    db.add(summary)
    
    db.commit()
    
    return {
        "skill_name": skill_name,
        "total_questions": total_questions,
        "correct_answers": correct_count,
        "score_percentage": score_percentage,
        "result_status": result_status,
        "details": results
    }

def get_test_results(resume_id: int, skill_name: str, db: Session):
    """Get test results for a specific skill"""
    summary = db.query(models.TestSummary).filter(
        models.TestSummary.resume_id == resume_id,
        models.TestSummary.skill_name == skill_name
    ).first()
    
    if not summary:
        return None
    
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

def get_available_skills_for_assessment(resume_id: int, db: Session):
    """Get skills with ratings for assessment"""
    skills = db.query(models.Skill).filter(
        models.Skill.resume_id == resume_id,
        models.Skill.rating.isnot(None)
    ).all()
    
    result = []
    for skill in skills:
        # Check if questions exist for this skill
        question_count = db.query(models.Question).filter(
            models.Question.skill_name == skill.skill_name
        ).count()
        
        if question_count > 0:
            result.append({
                "id": skill.id,
                "skill_name": skill.skill_name,
                "rating": skill.rating,
                "rating_level": skill.rating_level,
                "questions_available": question_count
            })
    
    return result