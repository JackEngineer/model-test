<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { initDemoData } from './api'
import BackendStatus from './components/BackendStatus.vue'

// 初始化示例数据
onMounted(() => {
  initDemoData()
})
</script>

<template>
  <el-config-provider>
    <div class="app-container">
      <header class="bg-blue-600 text-white shadow-md">
        <div class="container mx-auto py-4 px-6 flex justify-between items-center">
          <h1 class="text-xl font-bold">大模型抽取能力测试系统</h1>
          <div class="backend-status-container">
            <BackendStatus/>
          </div>
        </div>
      </header>
      <main class="container mx-auto py-6 px-6">
        <RouterView />
      </main>
    </div>
  </el-config-provider>
</template>

<style>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}
</style>