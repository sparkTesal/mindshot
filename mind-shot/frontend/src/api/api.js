/**
 * API 请求封装
 */
import axios from 'axios';
import { getToken, logout } from '../utils/auth';

// API 基础地址
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 Token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Token 过期或无效
      if (status === 401) {
        logout();
        window.location.href = '/login';
      }
      
      // 返回错误信息
      const message = data?.error || '请求失败';
      return Promise.reject(new Error(message));
    }
    
    // 网络错误
    if (error.request) {
      return Promise.reject(new Error('网络错误，请检查网络连接'));
    }
    
    return Promise.reject(error);
  }
);

// ============ API 方法 ============

/**
 * 用户注册
 */
export const register = async (username, password) => {
  const response = await api.post('/register', { username, password });
  return response.data;
};

/**
 * 用户登录
 */
export const login = async (username, password) => {
  const response = await api.post('/login', { username, password });
  return response.data;
};

/**
 * 获取消息列表
 */
export const getMessages = async (limit = 100) => {
  const response = await api.get('/messages', { params: { limit } });
  return response.data;
};

/**
 * 发送消息
 */
export const sendMessage = async (content) => {
  const response = await api.post('/messages', { content });
  return response.data;
};

/**
 * 获取消息详情
 */
export const getMessageDetail = async (messageId) => {
  const response = await api.get(`/messages/${messageId}`);
  return response.data;
};

/**
 * 上传文件
 */
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default api;
