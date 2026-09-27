import axios from 'axios'

import { API_BASE_URL } from '../config';

export const uploadResume = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
        const response = await axios.post(`${API_BASE_URL}/upload-resume`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return response.data
    } catch (error) {
        throw error
    }
}

export const getSkills = async (resumeId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/skills/${resumeId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const updateSkill = async (skillId, data) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/skills/${skillId}`, data)
        return response.data
    } catch (error) {
        throw error
    }
}

export const addSkill = async (resumeId, skillName) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/skills/${resumeId}`, { skill_name: skillName })
        return response.data
    } catch (error) {
        throw error
    }
}

export const deleteSkill = async (skillId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/skills/${skillId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const updateAllRatings = async (resumeId, ratings) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/skills/${resumeId}/ratings`, ratings)
        return response.data
    } catch (error) {
        throw error
    }
}

export const updateResumeStatus = async (resumeId, data) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/resume/${resumeId}/status`, data)
        return response.data
    } catch (error) {
        throw error
    }
}

export const sendLoginOTP = async (emailOrPhone) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/login/send-otp`, { 
            email: emailOrPhone,
            phone: emailOrPhone
        })
        return response.data
    } catch (error) {
        throw error
    }
}

export const verifyLoginOTP = async (otp, resumeId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/login/verify-otp`, { 
            otp: otp,
            resume_id: resumeId
        })
        return response.data
    } catch (error) {
        throw error
    }
}

export const checkUserExists = async (emailOrPhone) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/login/check/${emailOrPhone}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getUserProgress = async (resumeId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/user/progress/${resumeId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const generateTest = async (resumeId, skillName) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/test/generate/${resumeId}/${skillName}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const submitTest = async (submissionData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/test/submit`, submissionData)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getTestResults = async (resumeId, skillName) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/test/results/${resumeId}/${skillName}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getAllTestResults = async (resumeId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/test/all-results/${resumeId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getAssessmentSkills = async (resumeId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/assessment/skills/${resumeId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getCompletedSkills = async (resumeId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/test/completed/${resumeId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getAllTrainers = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/trainers`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getPendingTrainers = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/pending-trainers`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const approveTrainer = async (trainerId) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/admin/approve-trainer/${trainerId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const rejectTrainer = async (trainerId) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/admin/reject-trainer/${trainerId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const loginTrainer = async (email, password) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/login/trainer`, { email, password })
        return response.data
    } catch (error) {
        throw error
    }
}

export const registerTrainer = async (trainerData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/trainer/register`, trainerData)
        return response.data
    } catch (error) {
        throw error
    }
}

export const addQuestion = async (questionData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/admin/question`, questionData)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getAllQuestions = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/questions`)
        if (response.data && response.data.questions) {
            return response.data.questions
        }
        if (response.data && response.data.data) {
            return response.data.data
        }
        if (response.data && response.data.items) {
            return response.data.items
        }
        if (Array.isArray(response.data)) {
            return response.data
        }
        if (response.data && response.data.results) {
            return response.data.results
        }
        return []
    } catch (error) {
        throw error
    }
}

export const getQuestionsBySkill = async (skillName) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/questions/${skillName}`)
        if (response.data && response.data.questions) {
            return response.data.questions
        }
        if (response.data && response.data.data) {
            return response.data.data
        }
        if (response.data && response.data.items) {
            return response.data.items
        }
        if (Array.isArray(response.data)) {
            return response.data
        }
        if (response.data && response.data.results) {
            return response.data.results
        }
        return []
    } catch (error) {
        throw error
    }
}

export const updateQuestion = async (questionId, questionData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/admin/question/${questionId}`, questionData)
        return response.data
    } catch (error) {
        throw error
    }
}

export const deleteQuestion = async (questionId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/admin/question/${questionId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getAllSkillNames = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/skills-list`)
        if (response.data && response.data.skills) {
            return { skills: response.data.skills }
        }
        if (response.data && response.data.data) {
            return { skills: response.data.data }
        }
        if (response.data && response.data.items) {
            return { skills: response.data.items }
        }
        if (Array.isArray(response.data)) {
            return { skills: response.data }
        }
        if (response.data && response.data.results) {
            return { skills: response.data.results }
        }
        return { skills: [] }
    } catch (error) {
        throw error
    }
}

export const addAdminSkill = async (skillName) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/admin/skill`, { skill_name: skillName })
        return response.data
    } catch (error) {
        throw error
    }
}

export const getAllResumes = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/resumes`)
        if (response.data && response.data.resumes) {
            return response.data.resumes
        }
        if (response.data && response.data.data) {
            return response.data.data
        }
        if (response.data && response.data.items) {
            return response.data.items
        }
        if (Array.isArray(response.data)) {
            return response.data
        }
        if (response.data && response.data.results) {
            return response.data.results
        }
        return []
    } catch (error) {
        throw error
    }
}

export const getAllTestResultsForAdmin = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/test/all-results`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getStudentContent = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/student/content/${studentId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getRecommendedContent = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/student/recommended-content/${studentId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getPersonalizedTrainers = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/student/personalized-trainers/${studentId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

// ====== ENROLLMENT API FUNCTIONS ======

export const enrollStudent = async (studentId, sessionId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/enroll`, {
            student_id: studentId,
            session_id: sessionId
        })
        return response.data
    } catch (error) {
        throw error
    }
}

export const getStudentEnrollments = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/enrollments/${studentId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const updateEnrollmentProgress = async (enrollmentId, progress) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/enrollment/${enrollmentId}/progress`, {
            progress: progress
        })
        return response.data
    } catch (error) {
        throw error
    }
}

export const getSessionStudents = async (sessionId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/enrollment/session/${sessionId}/students`)
        return response.data
    } catch (error) {
        throw error
    }
}

// ====== ATTENDANCE API FUNCTIONS ======

export const markAttendance = async (studentId, sessionId, status, notes = "") => {
    try {
        const response = await axios.post(`${API_BASE_URL}/attendance/mark`, {
            student_id: studentId,
            session_id: sessionId,
            status: status,
            notes: notes
        })
        return response.data
    } catch (error) {
        throw error
    }
}

export const getStudentAttendance = async (studentId, sessionId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/attendance/${studentId}/${sessionId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getSessionAttendance = async (sessionId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/attendance/session/${sessionId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getStudentAttendanceSummary = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/attendance/student/${studentId}/summary`)
        return response.data
    } catch (error) {
        throw error
    }
}


export const getReferralInfo = async (identifier) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/referral/${identifier}`)
    return response.data
  } catch (error) {
    throw error
  }
}

export const generateReferralCode = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/generate-referral`, data)
    return response.data
  } catch (error) {
    throw error
  }
}

export const applyReferral = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/referral/apply`, data)
    return response.data
  } catch (error) {
    throw error
  }
}

// ====== RECRUITER API FUNCTIONS ======

export const registerRecruiter = async (recruiterData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/recruiter/register`, recruiterData)
        return response.data
    } catch (error) {
        throw error
    }
}

export const loginRecruiter = async (email, password) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/login/recruiter`, { email, password })
        return response.data
    } catch (error) {
        throw error
    }
}

export const getRecruiterStudents = async (filters = {}) => {
    try {
        const params = new URLSearchParams()
        if (filters.min_rating) params.append('min_rating', filters.min_rating)
        if (filters.skill) params.append('skill', filters.skill)
        if (filters.location) params.append('location', filters.location)
        if (filters.education) params.append('education', filters.education)
        if (filters.degree) params.append('degree', filters.degree)
        if (filters.branch) params.append('branch', filters.branch)
        if (filters.year_of_passout) params.append('year_of_passout', filters.year_of_passout)
        if (filters.min_score) params.append('min_score', filters.min_score)
        
        const response = await axios.get(`${API_BASE_URL}/recruiter/students?${params.toString()}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getRecruiterStudentDetail = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/recruiter/student/${studentId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getAllRecruiters = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/recruiters`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const approveRecruiter = async (recruiterId) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/admin/approve-recruiter/${recruiterId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const rejectRecruiter = async (recruiterId) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/admin/reject-recruiter/${recruiterId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const toggleRecruiterVisibility = async (studentId, isVisible, notes = null) => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/admin/student/${studentId}/toggle-recruiter-visibility`,
            { is_visible_to_recruiters: isVisible, admin_notes: notes }
        )
        return response.data
    } catch (error) {
        throw error
    }
}

export const getStudentProfile = async (resumeId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/student/profile/${resumeId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const updateStudentProfile = async (resumeId, data) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/student/profile/${resumeId}`, data)
        return response.data
    } catch (error) {
        throw error
    }
}