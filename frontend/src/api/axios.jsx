import axios from 'axios';

const apiBaseURL = import.meta.env.VITE_API_URL || '/api';

const API = axios.create({ 
    baseURL: apiBaseURL,
    withCredentials: true 
});

export default API;
