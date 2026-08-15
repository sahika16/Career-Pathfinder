import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

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