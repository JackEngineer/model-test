import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 可以在这里添加认证令牌等
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 直接返回响应数据
    return response.data;
  },
  (error: AxiosError) => {
    // 处理错误响应
    if (error.response) {
      // 服务器返回错误
      console.error('API错误:', error.response.data);
    } else if (error.request) {
      // 请求发送但没有收到响应
      console.error('网络错误: 没有收到响应');
    } else {
      // 请求设置时发生错误
      console.error('请求错误:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient; 