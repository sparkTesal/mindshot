/**
 * 认证相关工具函数
 */

const TOKEN_KEY = 'mind_shot_token';
const USER_KEY = 'mind_shot_user';

/**
 * 保存 Token
 */
export const saveToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * 获取 Token
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 删除 Token
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * 保存用户信息
 */
export const saveUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * 获取用户信息
 */
export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

/**
 * 删除用户信息
 */
export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

/**
 * 登出
 */
export const logout = () => {
  removeToken();
  removeUser();
};

/**
 * 检查是否已登录
 */
export const isLoggedIn = () => {
  return !!getToken();
};
