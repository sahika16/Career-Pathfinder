const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isLocal 
    ? 'http://localhost:8000/api'  // Local development
    : 'https://careerpath.synersyst.com/api';  // Production server

export default API_BASE_URL;