import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

// ====== RESUME UPLOAD ======
export const uploadResume = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
        const response = await axios.post(`${API_BASE_URL}/upload-resume`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return response.data
    } catch (error) {
        console.error('Upload error:', error.response?.data || error.message)
        throw error
    }
}

// ====== SKILL MANAGEMENT ======
export const getSkills = async (resumeId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/skills/${resumeId}`)
        return response.data
    } catch (error) {
        console.error('Error fetching skills:', error)
        throw error
    }
}

export const updateSkill = async (skillId, data) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/skills/${skillId}`, data)
        return response.data
    } catch (error) {
        console.error('Error updating skill:', error)
        throw error
    }
}

export const addSkill = async (resumeId, skillName) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/skills/${resumeId}`, { skill_name: skillName })
        return response.data
    } catch (error) {
        console.error('Error adding skill:', error)
        throw error
    }
}

export const deleteSkill = async (skillId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/skills/${skillId}`)
        return response.data
    } catch (error) {
        console.error('Error deleting skill:', error)
        throw error
    }
}

export const updateAllRatings = async (resumeId, ratings) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/skills/${resumeId}/ratings`, ratings)
        return response.data
    } catch (error) {
        console.error('Error updating ratings:', error)
        throw error
    }
}

export const updateResumeStatus = async (resumeId, data) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/resume/${resumeId}/status`, data)
        return response.data
    } catch (error) {
        console.error('Error updating resume status:', error)
        throw error
    }
}

// ====== OTP LOGIN ======
export const sendLoginOTP = async (emailOrPhone) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/login/send-otp`, { 
            email: emailOrPhone,
            phone: emailOrPhone
        })
        return response.data
    } catch (error) {
        console.error('Error sending OTP:', error)
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
        console.error('Error verifying OTP:', error)
        throw error
    }
}

export const checkUserExists = async (emailOrPhone) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/login/check/${emailOrPhone}`)
        return response.data
    } catch (error) {
        console.error('Error checking user:', error)
        throw error
    }
}

export const getUserProgress = async (resumeId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/user/progress/${resumeId}`)
        return response.data
    } catch (error) {
        console.error('Error getting user progress:', error)
        throw error
    }
}

// ====== ASSESSMENT FUNCTIONS ======
export const generateTest = async (resumeId, skillName) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/test/generate/${resumeId}/${skillName}`)
        return response.data
    } catch (error) {
        console.error('Error generating test:', error)
        throw error
    }
}

export const submitTest = async (submissionData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/test/submit`, submissionData)
        return response.data
    } catch (error) {
        console.error('Error submitting test:', error)
        throw error
    }
}

export const getTestResults = async (resumeId, skillName) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/test/results/${resumeId}/${skillName}`)
        return response.data
    } catch (error) {
        console.error('Error getting test results:', error)
        throw error
    }
}

export const getAllTestResults = async (resumeId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/test/all-results/${resumeId}`)
        return response.data
    } catch (error) {
        console.error('Error getting all test results:', error)
        throw error
    }
}

export const getAssessmentSkills = async (resumeId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/assessment/skills/${resumeId}`)
        return response.data
    } catch (error) {
        console.error('Error getting assessment skills:', error)
        throw error
    }
}

// ====== NEW: Get Completed Skills ======
export const getCompletedSkills = async (resumeId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/test/completed/${resumeId}`)
        return response.data
    } catch (error) {
        console.error('Error getting completed skills:', error)
        throw error
    }
}

// ====== ADMIN: Question Management ======
export const addQuestion = async (questionData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/admin/question`, questionData)
        return response.data
    } catch (error) {
        console.error('Error adding question:', error)
        throw error
    }
}

export const getAllQuestions = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/questions`)
        return response.data
    } catch (error) {
        console.error('Error getting questions:', error)
        throw error
    }
}

export const getQuestionsBySkill = async (skillName) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/questions/${skillName}`)
        return response.data
    } catch (error) {
        console.error('Error getting questions by skill:', error)
        throw error
    }
}

export const updateQuestion = async (questionId, questionData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/admin/question/${questionId}`, questionData)
        return response.data
    } catch (error) {
        console.error('Error updating question:', error)
        throw error
    }
}

export const deleteQuestion = async (questionId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/admin/question/${questionId}`)
        return response.data
    } catch (error) {
        console.error('Error deleting question:', error)
        throw error
    }
}

export const getAllSkillNames = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/skills-list`)
        return response.data
    } catch (error) {
        console.error('Error getting skill names:', error)
        throw error
    }
}

export const addAdminSkill = async (skillName) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/admin/skill`, { skill_name: skillName })
        return response.data
    } catch (error) {
        console.error('Error adding skill:', error)
        throw error
    }
}

export const getAllResumes = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/resumes`)
        return response.data
    } catch (error) {
        console.error('Error fetching resumes:', error)
        throw error
    }
}