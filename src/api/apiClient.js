import axios from 'axios';

// 默认后端API配置
const DEFAULT_BASE_URL = 'http://localhost:3000/api';

// 获取后端API地址，优先使用环境变量或者localStorage存储的值
const getBaseUrl = () => {
  // 优先使用localStorage存储的API地址
  const savedBaseUrl = localStorage.getItem('backendApiUrl');
  if (savedBaseUrl) {
    return savedBaseUrl;
  }
  return DEFAULT_BASE_URL;
};

// 创建axios实例
const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 请求超时时间
});

// 设置后端API地址
export const setBaseUrl = (url) => {
  if (url && url !== DEFAULT_BASE_URL) {
    localStorage.setItem('backendApiUrl', url);
    console.log(`已设置后端API地址: ${url}`);
    // 更新当前实例的baseURL
    apiClient.defaults.baseURL = url;
  } else {
    localStorage.removeItem('backendApiUrl');
    console.log(`已恢复默认后端API地址: ${DEFAULT_BASE_URL}`);
    apiClient.defaults.baseURL = DEFAULT_BASE_URL;
  }
};

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token
    // 例如: config.headers.Authorization = `Bearer ${token}`;
    console.log(`发起请求: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('请求发送失败:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 处理响应数据
    console.log(`请求成功: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    // 处理错误
    if (error.response) {
      // 服务器返回了错误状态码
      console.error(
        `请求失败 ${error.response.status}:`,
        error.response.data || '无错误详情'
      );
    } else if (error.request) {
      // 请求发送成功，但未收到响应
      console.error('未收到响应，可能服务器未运行或网络问题');
    } else {
      // 请求设置有误
      console.error('请求设置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient; 