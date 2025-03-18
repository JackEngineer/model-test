<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { testBackendConnection } from '../api';

const isConnected = ref(false);
const isLoading = ref(false);

// 检查后端连接状态
const checkConnection = async () => {
  isLoading.value = true;
  try {
    const connected = await testBackendConnection();
    isConnected.value = connected;
  } catch (error) {
    console.error('检查后端连接失败:', error);
    isConnected.value = false;
  } finally {
    isLoading.value = false;
  }
};

// 组件挂载时检查连接
onMounted(() => {
  checkConnection();
});
</script>

<template>
  <div class="backend-status">
    <div class="status-container" :class="{ 'is-connected': isConnected, 'is-loading': isLoading }">
      <div class="status-indicator" :class="{ 'pulse': isConnected }">
        <div class="inner-circle"></div>
      </div>
      <div class="status-text">
        <span>{{ isConnected ? '服务已连接' : '服务未连接' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backend-status {
  display: inline-flex;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.backend-status:hover {
  background-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.status-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.status-container.is-connected {
  border-color: rgba(52, 211, 153, 0.5);
}

.status-container.is-loading .status-indicator {
  animation: rotate 1.5s linear infinite;
}

.status-indicator {
  position: relative;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background-color: #ef4444;
  transition: background-color 0.3s ease;
}

.status-container.is-connected .status-indicator {
  background-color: #34d399;
}

.inner-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0.25rem;
  height: 0.25rem;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  opacity: 0.7;
}

.status-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  white-space: nowrap;
}

/* 脉冲动画 */
.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7);
  }

  70% {
    box-shadow: 0 0 0 6px rgba(52, 211, 153, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(52, 211, 153, 0);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>