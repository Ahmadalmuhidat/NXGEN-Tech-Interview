import axios from 'axios';
import { toast } from 'react-toastify';

const AxiosClient = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

AxiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem("token");
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

AxiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = data?.error || data?.message || data?.error_message || error.message;
    const skipToast = error.config?.skipToast || false;
    
    if (!skipToast) {
      if (status === 401) {
        toast.warning("Unauthorized - please log in again.");
      } else if (status === 500) {
        toast.error("Server error. Please try again later.");
      } else if (status >= 400 && status < 500) {
        toast.error(message || "Request failed");
      }
    }

    return Promise.reject(error);
  }
);

export default AxiosClient;
