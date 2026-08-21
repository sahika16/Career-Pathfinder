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
        throw error
    }
}

// ====== SKILL MANAGEMENT ======
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

// ====== OTP LOGIN ======
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

// ====== ASSESSMENT FUNCTIONS ======
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

// ====== ADMIN: Question Management ======
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

// ====== ADMIN: Student Management ======
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

// ====== ADMIN: Get All Test Results (For Dashboard) ======
export const getAllTestResultsForAdmin = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/test/all-results`)
        return response.data
    } catch (error) {
        throw error
    }
}