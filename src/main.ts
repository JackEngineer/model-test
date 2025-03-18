import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import App from "./App.vue";
import router from "./router";
import { initDemoData, testBackendConnection } from "./api";
import { setBaseUrl } from "./api/apiClient";

// 自动探测后端端口
const detectBackendPort = async () => {
  // 尝试检测可能的端口
  const possiblePorts = [3000, 3001, 3002, 3003, 3004, 3005];

  console.log("正在探测后端服务端口...");

  for (const port of possiblePorts) {
    try {
      const url = `http://localhost:${port}/api`;
      const response = await fetch(`${url}/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
        // 设置较短的超时时间
        signal: AbortSignal.timeout(1000),
      });

      if (response.ok) {
        console.log(`检测到后端服务运行在端口 ${port}`);
        // 设置后端API基础URL
        setBaseUrl(url);
        return true;
      }
    } catch (error) {
      // 忽略错误，继续尝试下一个端口
    }
  }

  console.warn("未检测到运行中的后端服务，将使用默认端口3000");
  return false;
};

// 初始化应用
const initApp = async () => {
  // 初始化模拟数据
  initDemoData();

  // 尝试探测后端端口
  await detectBackendPort();

  // 测试后端连接
  const isConnected = await testBackendConnection();
  if (isConnected) {
    console.log("成功连接到后端API");
  } else {
    console.warn("无法连接到后端API，将使用模拟数据");
  }

  const app = createApp(App);

  // 注册所有 Element Plus 图标
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }

  app.use(createPinia());
  app.use(router);
  app.use(ElementPlus);

  app.mount("#app");
};

// 启动应用
initApp();
