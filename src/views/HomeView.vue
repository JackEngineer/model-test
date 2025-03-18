<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTests, deleteTest, getModels, createModelTest } from '../api'
import ModelConfigDialog from '../components/ModelConfigDialog.vue'
import type { Test, Model } from '../types'

// 导入Element Plus图标
import {
  DataLine,
  DataBoard,
  Document,
  DocumentAdd,
  Delete,
  Edit,
  Timer,
  Loading,
  VideoPlay,
  Plus,
  Search,
  Collection,
  CollectionTag,
  Connection,
  Check,
  Setting,
  Warning
} from '@element-plus/icons-vue'

const router = useRouter()
const searchQuery = ref('')
const tests = ref<Test[]>([])
const models = ref<Model[]>([])
const isLoading = ref(true)
const isTestingLoading = ref<Record<string, boolean>>({})

// 全局默认选择的模型ID
const defaultModelId = ref('')

// API配置对话框控制
const configDialogVisible = ref(false)

// 设置选中的模型
const setSelectedModel = (testId: string, modelId: string) => {
  // 为每个测试保存不同的选定模型
  selectedModelIds.value.set(testId, modelId)
}

// 获取选中的模型
const getSelectedModel = (testId: string) => {
  // 返回测试对应的选定模型，如果未选择则返回空字符串
  return selectedModelIds.value.get(testId) || ''
}

// 添加选定模型IDs的状态管理
const selectedModelIds = ref<Map<string, string>>(new Map())

// 加载测试列表和模型列表
const loadData = async () => {
  isLoading.value = true
  try {
    const [testsData, modelsData] = await Promise.all([
      getTests(),
      getModels()
    ])
    tests.value = testsData
    models.value = modelsData

    // 为每个测试设置默认选中的模型
    tests.value.forEach(test => {
      // 如果尚未为此测试选择模型，且有可用模型，则选择第一个
      if (!selectedModelIds.value.has(test.id) && models.value.length > 0) {
        selectedModelIds.value.set(test.id, models.value[0].id)
      }
    })

    // 设置全局默认选择的模型，优先使用API配置的默认模型
    if (models.value.length > 0) {
      defaultModelId.value = models.value[0].id
    } else {
      defaultModelId.value = ''
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    isLoading.value = false
  }
}

// 初始化数据
onMounted(loadData)

// 基于搜索条件过滤测试
const filteredTests = computed(() => {
  if (!searchQuery.value) return tests.value

  const query = searchQuery.value.toLowerCase()
  return tests.value.filter(test =>
    test.name.toLowerCase().includes(query) ||
    test.extractionType.toLowerCase().includes(query)
  )
})

// 检查是否有可用的模型
const hasModels = computed(() => {
  return models.value.length > 0;
});

// 格式化日期
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取抽取类型显示名称
const getExtractionTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    'entity': '实体抽取',
    'attribute': '属性抽取',
    'relationship': '关系抽取'
  }
  return typeMap[type] || type
}

// 创建新测试
const createNewTest = () => {
  router.push('/create')
}

// 查看测试详情
const viewTest = (test: Test) => {
  console.log('正在跳转到标注页面:', test.id)
  router.push(`/annotate/${test.id}`)
}

// 删除测试
const confirmDelete = (test: Test) => {
  ElMessageBox.confirm(
    `确定要删除测试"${test.name}"吗？此操作不可撤销。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteTest(test.id)
      ElMessage.success('删除成功')
      // 重新加载测试列表
      loadData()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

// 开始模型测试
const startModelTest = async (test: Test) => {
  const selectedModelId = getSelectedModel(test.id)

  if (!selectedModelId) {
    ElMessage.warning('请先选择模型')
    return
  }

  isTestingLoading.value[test.id] = true
  try {
    const modelTest = await createModelTest({
      testId: test.id,
      modelId: selectedModelId
    })

    ElMessage.success('模型测试已创建，正在处理中')

    // 等待2秒后跳转到结果页面，给模拟后台处理一些时间
    setTimeout(() => {
      router.push(`/result/${modelTest.id}`)
    }, 2000)
  } catch (error) {
    console.error('创建模型测试失败:', error)
    ElMessage.error('创建模型测试失败')
  } finally {
    isTestingLoading.value[test.id] = false
  }
}

// 格式化准确率和召回率
const formatMetric = (value: number | null) => {
  if (value === null) return '-';
  return `${(value * 100).toFixed(2)}%`;
}

// 获取指标类型显示样式
const getMetricType = (value: number | null) => {
  if (value === null) return '';
  if (value >= 0.8) return 'success';
  if (value >= 0.6) return 'warning';
  return 'danger';
}

// 跳转到结果页面
const viewResult = (testId: string) => {
  if (!testId) return;
  router.push(`/result/${testId}`);
}

// 表格行样式
const tableRowClassName = () => {
  return 'table-row-hover';
}

// 打开配置对话框
const openConfigDialog = () => {
  configDialogVisible.value = true
}

// 处理配置保存
const handleConfigSave = () => {
  ElMessage.success('API配置已保存，模型列表已更新')
  // 重新加载数据
  loadData()
}
</script>

<template>
  <div class="home-view">
    <div class="container mx-auto py-8 px-4">
      <!-- 页面标题和操作 -->
      <div class="header-container mb-8">
        <div class="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <el-icon class="text-blue-500 text-xl">
                <DataBoard />
              </el-icon>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-800">模型测试平台</h1>
              <p class="text-gray-500 text-sm mt-1">浏览、创建和管理您的测试数据</p>
            </div>
          </div>
          <div class="flex gap-3">
            <el-input v-model="searchQuery" placeholder="搜索测试名称或类型" clearable class="w-64 search-input">
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="createNewTest" class="create-button">
              <el-icon class="mr-1">
                <Plus />
              </el-icon> 创建测试
            </el-button>
          </div>
        </div>
      </div>

      <!-- 模型选择区域 -->
      <div class="mb-6 bg-white p-5 rounded-lg shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
              <el-icon class="text-indigo-500">
                <Connection />
              </el-icon>
            </div>
            <div>
              <h2 class="text-lg font-medium text-gray-800">模型列表</h2>
              <p class="text-sm text-gray-500">可用于测试的模型</p>
            </div>
          </div>
          <div class="flex items-center">
            <el-button type="primary" @click="openConfigDialog">
              <el-icon class="mr-1">
                <Setting />
              </el-icon>
              模型管理
            </el-button>
          </div>
        </div>

        <div v-if="hasModels" class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div v-for="model in models" :key="model.id"
            class="model-card bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-medium text-gray-800">{{ model.name }}</h3>
                <p class="text-xs text-gray-500 mt-1">ID: {{ model.id.substring(0, 12) }}</p>
              </div>
              <el-tag size="small" type="info" effect="plain" class="rounded-full">
                {{ model.id === defaultModelId ? '默认' : '' }}
              </el-tag>
            </div>
            <div class="mt-2 text-xs text-gray-600">
              <p>API端点: {{ model.apiEndpoint }}</p>
            </div>
          </div>
        </div>

        <div v-else class="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div class="flex items-center">
            <el-icon class="text-yellow-500 mr-2">
              <Warning />
            </el-icon>
            <span class="text-yellow-700">未配置API或未找到可用模型，请先配置API</span>
          </div>
        </div>
      </div>

      <!-- 测试列表 -->
      <div v-if="!isLoading && filteredTests.length > 0" class="bg-white p-6 rounded-lg shadow-sm">
        <div class="flex items-center mb-4">
          <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <el-icon class="text-blue-500">
              <Document />
            </el-icon>
          </div>
          <h2 class="text-lg font-bold text-gray-800">测试列表</h2>
        </div>

        <el-table :data="filteredTests" style="width: 100%"
          :header-cell-style="{ background: '#f8fafc', color: '#4b5563', fontWeight: 'bold' }"
          :row-class-name="tableRowClassName" class="custom-table">
          <el-table-column label="测试名称" min-width="150">
            <template #default="{ row }">
              <div class="flex items-center">
                <div class="mr-2">
                  <el-icon v-if="row.extractionType === 'entity'" class="text-green-500">
                    <Collection />
                  </el-icon>
                  <el-icon v-else-if="row.extractionType === 'attribute'" class="text-yellow-500">
                    <CollectionTag />
                  </el-icon>
                  <el-icon v-else class="text-purple-500">
                    <Connection />
                  </el-icon>
                </div>
                <div>
                  <div class="font-medium text-gray-800">{{ row.name }}</div>
                  <div class="text-xs text-gray-500">ID: {{ row.id.substring(0, 8) }}</div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="抽取类型" width="120" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.extractionType === 'entity' ? 'success' : row.extractionType === 'attribute' ? 'warning' : 'primary'"
                effect="light" class="rounded-full px-3">
                {{ getExtractionTypeName(row.extractionType) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="准确率" width="120" align="center">
            <template #default="{ row }">
              <div @click="row.lastTestId && viewResult(row.lastTestId)" class="cursor-pointer metric-value">
                <el-tag v-if="row.precision !== null && row.precision !== undefined"
                  :type="getMetricType(row.precision)" effect="plain" class="rounded-full px-3 metric-tag">
                  {{ formatMetric(row.precision) }}
                </el-tag>
                <span v-else class="text-gray-400">-</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="召回率" width="120" align="center">
            <template #default="{ row }">
              <div @click="row.lastTestId && viewResult(row.lastTestId)" class="cursor-pointer metric-value">
                <el-tag v-if="row.recall !== null && row.recall !== undefined" :type="getMetricType(row.recall)"
                  effect="plain" class="rounded-full px-3 metric-tag">
                  {{ formatMetric(row.recall) }}
                </el-tag>
                <span v-else class="text-gray-400">-</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">
              <div class="flex items-center text-gray-600">
                <el-icon class="mr-1 text-gray-400">
                  <Timer />
                </el-icon>
                {{ formatDate(row.createdAt) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" min-width="350" fixed="right">
            <template #default="{ row }">
              <div class="flex flex-wrap gap-2">
                <el-button size="small" type="primary" plain @click="viewTest(row)" class="action-button">
                  <el-icon>
                    <Edit />
                  </el-icon> 标注
                </el-button>

                <el-select v-if="hasModels" :model-value="getSelectedModel(row.id)"
                  @update:model-value="(val) => setSelectedModel(row.id, val)" placeholder="选择模型" style="width: 150px;">
                  <el-option v-for="model in models" :key="model.id" :label="model.name" :value="model.id" />
                </el-select>

                <el-button v-if="hasModels" type="success" size="small" :loading="isTestingLoading[row.id]"
                  @click="startModelTest(row)">
                  <el-icon class="mr-1">
                    <VideoPlay />
                  </el-icon>
                  测试
                </el-button>

                <el-button type="danger" size="small" plain @click="confirmDelete(row)" class="action-button">
                  <el-icon>
                    <Delete />
                  </el-icon> 删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!isLoading" class="bg-white p-10 rounded-lg shadow-sm text-center">
        <div class="flex flex-col items-center">
          <div class="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <el-icon class="text-blue-500 text-3xl">
              <DocumentAdd />
            </el-icon>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">暂无测试数据</h3>
          <p class="text-gray-500 mb-6 max-w-md mx-auto">创建一个新的测试来开始使用模型测试平台，您可以选择实体抽取、属性抽取或关系抽取类型。</p>
          <el-button type="primary" @click="createNewTest" size="large">
            <el-icon class="mr-1">
              <Plus />
            </el-icon> 创建测试
          </el-button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-else class="bg-white p-6 rounded-lg shadow-sm">
        <div class="flex items-center mb-4">
          <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <el-icon class="text-blue-500">
              <Loading />
            </el-icon>
          </div>
          <h2 class="text-lg font-bold text-gray-800">加载测试数据</h2>
        </div>
        <el-skeleton :rows="5" animated />
      </div>
    </div>

    <!-- 阿里云百炼API配置对话框 -->
    <ModelConfigDialog v-model:visible="configDialogVisible" @save="handleConfigSave" />
  </div>
</template>

<style scoped>
.home-view {
  min-height: calc(100vh - 60px);
  background-color: #f8fafc;
  padding-bottom: 2rem;
}

.header-container,
.stats-container {
  transition: all 0.3s ease;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.custom-table {
  --el-table-border-color: #f1f5f9;
  --el-table-header-bg-color: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
}

.custom-table :deep(th) {
  font-weight: 600;
  color: #4b5563;
}

.custom-table :deep(td) {
  padding: 12px 0;
}

.action-button {
  transition: all 0.2s ease;
}

.action-button:hover {
  transform: translateY(-1px);
}

.model-select {
  min-width: 130px;
  transition: all 0.2s ease;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}

.create-button {
  border-radius: 8px;
  font-weight: 500;
}

.metric-tag {
  transition: all 0.2s ease;
}

.metric-value:hover .metric-tag {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 行样式效果 */
.table-row-hover {
  transition: all 0.2s ease;
}

.table-row-hover:hover {
  background-color: #f8fafc;
}

.header-actions {
  display: flex;
  gap: 10px;
}
</style>