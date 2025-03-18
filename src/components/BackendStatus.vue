<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { testBackendConnection, toggleBackendMode } from '../api';

const isConnected = ref(false);
const isLoading = ref(true);
const error = ref<string | null>(null);
const message = ref<string | null>(null);
const messageTimer = ref<number | null>(null);

async function checkConnection() {
    isLoading.value = true;
    error.value = null;
    message.value = null;

    try {
        const result = await testBackendConnection();
        isConnected.value = result;

        if (result) {
            showMessage('已连接到后端服务');
        } else {
            showMessage('无法连接到后端，将使用模拟数据');
        }
    } catch (err) {
        error.value = err instanceof Error ? err.message : '连接错误';
        isConnected.value = false;
        showMessage('连接出错，将使用模拟数据');
    } finally {
        isLoading.value = false;
    }
}

function handleToggleMode() {
    toggleBackendMode();
    showMessage(`已切换到${isConnected.value ? '模拟数据' : '真实后端'}模式`);
    isConnected.value = !isConnected.value;
}

function showMessage(msg: string) {
    message.value = msg;

    if (messageTimer.value) {
        clearTimeout(messageTimer.value);
    }

    messageTimer.value = window.setTimeout(() => {
        message.value = null;
        messageTimer.value = null;
    }, 3000);
}

onMounted(() => {
    checkConnection();
});
</script>

<template>
    <div class="backend-status">
        <div v-if="isLoading" class="loading">
            正在检查连接...
        </div>

        <div v-else class="status-container">
            <div :class="['status', isConnected ? 'status-connected' : 'status-disconnected']">
                <span class="status-indicator"></span>
                <span class="status-text">后端{{ isConnected ? '已连接' : '未连接' }}</span>
            </div>

            <div class="actions">
                <button @click="checkConnection" class="btn refresh" title="刷新连接状态">
                    ↻
                </button>
                <button @click="handleToggleMode" class="btn toggle" title="切换数据模式">
                    {{ isConnected ? '切换至模拟数据' : '切换至真实后端' }}
                </button>
            </div>
        </div>

        <div v-if="message" class="message">
            {{ message }}
        </div>
    </div>
</template>

<style scoped>
.backend-status {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    padding: 8px 12px;
    position: relative;
}

.loading {
    color: #fff;
    font-size: 14px;
}

.status-container {
    display: flex;
    align-items: center;
    gap: 10px;
}

.status {
    display: flex;
    align-items: center;
    gap: 6px;
}

.status-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.status-connected .status-indicator {
    background-color: #4caf50;
    box-shadow: 0 0 5px #4caf50;
}

.status-disconnected .status-indicator {
    background-color: #f44336;
    box-shadow: 0 0 5px #f44336;
}

.status-text {
    color: #fff;
    font-size: 14px;
}

.actions {
    display: flex;
    gap: 8px;
}

.btn {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: background-color 0.2s;
}

.btn.refresh {
    background-color: transparent;
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn.refresh:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.btn.toggle {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn.toggle:hover {
    background-color: rgba(255, 255, 255, 0.3);
}

.message {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.7);
    color: #fff;
    font-size: 12px;
    padding: 5px 10px;
    border-radius: 0 0 4px 4px;
    margin-top: 5px;
    animation: fadeInOut 3s ease-in-out;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
}

@keyframes fadeInOut {
    0% {
        opacity: 0;
    }

    10% {
        opacity: 1;
    }

    80% {
        opacity: 1;
    }

    100% {
        opacity: 0;
    }
}
</style>