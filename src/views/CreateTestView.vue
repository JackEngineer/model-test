<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createTest } from '../api'
import type { CreateTestDto } from '../types'

// 导入Element Plus图标
import {
  DocumentAdd,
  Edit,
  Select,
  Document,
  Reading,
  Filter,
  ArrowLeft,
  InfoFilled,
  Histogram,
  Collection,
  Connection
} from '@element-plus/icons-vue'

const router = useRouter()

// 表单数据
const form = ref<CreateTestDto>({
  name: '',
  text: '',
  extractionType: 'relationship'
})

// 表单规则
const rules = {
  name: [
    { required: true, message: '请输入测试名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  text: [
    { required: true, message: '请输入测试文本', trigger: 'blur' },
    { min: 10, message: '文本长度不能少于 10 个字符', trigger: 'blur' }
  ],
  extractionType: [
    { required: true, message: '请选择抽取类型', trigger: 'change' }
  ]
}

// 提交状态
const isSubmitting = ref(false)

// 提交表单
const submitForm = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    // 创建测试
    await createTest(form.value)

    ElMessage.success('创建成功')
    router.push('/')
  } catch (error) {
    console.error('创建失败:', error)
    ElMessage.error('创建失败')
  } finally {
    isSubmitting.value = false
  }
}

// 抽取类型选项
const extractionTypeOptions = [
  {
    value: 'entity',
    label: '实体抽取',
    icon: Collection,
    description: '从文本中识别并提取实体（例如人物、组织、地点等）'
  },
  {
    value: 'attribute',
    label: '属性抽取',
    icon: Filter,
    description: '从文本中识别并提取属性（例如颜色、尺寸、规格等）'
  },
  {
    value: 'relationship',
    label: '关系抽取',
    icon: Connection,
    description: '从文本中识别并提取实体间的关系，以三元组形式呈现'
  }
]

// 抽取结果示例
const resultExamples = {
  entity: '苹果,华为,三星',
  attribute: '高通骁龙8,OLED,6.7英寸',
  relationship: '华为-使用-麒麟芯片,iPhone-生产-苹果公司'
}

// 当前选择的抽取类型
const currentType = computed(() => {
  return extractionTypeOptions.find(option => option.value === form.value.extractionType) || extractionTypeOptions[2]
})
</script>

<template>
  <div class="create-test-view">
    <div class="container mx-auto py-12 px-6 max-w-6xl">
      <!-- 页面标题 -->
      <div class="flex justify-between items-center mb-10 px-2">
        <div class="flex items-center">
          <div
            class="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mr-5 shadow-md">
            <el-icon class="text-white text-2xl">
              <DocumentAdd />
            </el-icon>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-800">创建测试</h1>
            <p class="text-gray-500 text-sm mt-1">填写以下信息创建一个新的模型测试</p>
          </div>
        </div>
        <el-button @click="router.push('/')" class="flex items-center" type="default">
          <el-icon class="mr-1">
            <ArrowLeft />
          </el-icon>
          返回列表
        </el-button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 表单区域 -->
        <div class="lg:col-span-2">
          <div class="card p-8">
            <h2 class="text-lg font-bold mb-8 text-gray-800 flex items-center pb-4 border-b border-gray-100">
              <el-icon class="mr-3 text-blue-600 text-xl">
                <Edit />
              </el-icon>
              测试信息
            </h2>

            <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="w-full" :label-suffix="'：'"
              size="large">
              <el-form-item label="测试名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入测试名称" clearable :prefix-icon="Document"
                  class="rounded-lg" />
                <div class="text-xs text-gray-400 mt-1.5 ml-1">给测试起一个有意义的名称，便于后续识别</div>
              </el-form-item>

              <el-form-item label="抽取类型" prop="extractionType" class="mt-8">
                <div class="grid grid-cols-3 gap-5">
                  <div v-for="option in extractionTypeOptions" :key="option.value"
                    @click="form.extractionType = option.value"
                    class="extraction-type-option p-5 border rounded-xl cursor-pointer transition-all" :class="form.extractionType === option.value ?
                      'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' :
                      'border-gray-200 hover:border-blue-300 hover:bg-blue-50'">
                    <div class="flex justify-center mb-3">
                      <el-icon class="text-3xl"
                        :class="form.extractionType === option.value ? 'text-blue-600' : 'text-gray-500'">
                        <component :is="option.icon" />
                      </el-icon>
                    </div>
                    <div class="text-center font-medium">{{ option.label }}</div>
                  </div>
                </div>
                <div class="mt-5 p-5 rounded-lg text-sm text-gray-700 flex items-start border" :class="{
                  'bg-blue-50 border-blue-100': form.extractionType === 'relationship',
                  'bg-green-50 border-green-100': form.extractionType === 'entity',
                  'bg-amber-50 border-amber-100': form.extractionType === 'attribute'
                }">
                  <el-icon class="mr-3 mt-0.5 flex-shrink-0" :class="{
                    'text-blue-500': form.extractionType === 'relationship',
                    'text-green-500': form.extractionType === 'entity',
                    'text-amber-500': form.extractionType === 'attribute'
                  }">
                    <InfoFilled />
                  </el-icon>
                  <div>
                    <div>{{ currentType.description }}</div>
                    <div class="mt-3 font-medium flex items-center">
                      <span class="mr-2">示例格式:</span>
                      <code class="px-3 py-1.5 bg-white rounded-md border text-xs" :class="{
                        'border-blue-200 text-blue-600': form.extractionType === 'relationship',
                        'border-green-200 text-green-600': form.extractionType === 'entity',
                        'border-amber-200 text-amber-600': form.extractionType === 'attribute'
                      }">
                        {{ resultExamples[form.extractionType] }}
                      </code>
                    </div>
                  </div>
                </div>
              </el-form-item>

              <el-form-item label="测试文本" prop="text" class="mt-8">
                <el-input v-model="form.text" type="textarea" :rows="10" placeholder="请输入测试文本"
                  class="font-mono text-content rounded-lg" resize="vertical" />
                <div class="text-xs text-gray-400 mt-1.5 ml-1">请输入需要测试的文本内容，文本长度不少于10个字符</div>
              </el-form-item>

              <el-form-item class="mt-10">
                <div class="flex">
                  <el-button type="primary" @click="submitForm" :loading="isSubmitting">
                    <span v-if="!isSubmitting">创建测试</span>
                    <span v-else>创建中...</span>
                  </el-button>
                  <el-button @click="router.push('/')" class="ml-4">取消</el-button>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 帮助信息区域 -->
        <div class="lg:col-span-1">
          <div class="card p-7 sticky top-6">
            <h2 class="text-lg font-bold mb-7 text-gray-800 flex items-center pb-3 border-b border-gray-100">
              <el-icon class="mr-3 text-blue-600 text-xl">
                <Reading />
              </el-icon>
              使用指南
            </h2>

            <div class="space-y-6">
              <!-- 实体抽取 -->
              <div
                class="guide-item p-5 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl border-l-4 border-green-500">
                <div class="flex items-center mb-3">
                  <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <el-icon class="text-green-600 text-lg">
                      <Collection />
                    </el-icon>
                  </div>
                  <h3 class="font-bold text-green-700">实体抽取</h3>
                </div>
                <p class="text-sm text-gray-600 leading-relaxed">从文本中识别并提取实体（例如人物、组织、地点等），输出格式为逗号分隔的实体列表。</p>
                <div class="mt-3 p-2.5 bg-white rounded-md border border-green-200 text-xs font-mono">
                  示例: 苹果,华为,三星
                </div>
              </div>

              <!-- 属性抽取 -->
              <div
                class="guide-item p-5 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl border-l-4 border-amber-500">
                <div class="flex items-center mb-3">
                  <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                    <el-icon class="text-amber-600 text-lg">
                      <Filter />
                    </el-icon>
                  </div>
                  <h3 class="font-bold text-amber-700">属性抽取</h3>
                </div>
                <p class="text-sm text-gray-600 leading-relaxed">从文本中识别并提取属性（例如颜色、尺寸、规格等），输出格式为逗号分隔的属性列表。</p>
                <div class="mt-3 p-2.5 bg-white rounded-md border border-amber-200 text-xs font-mono">
                  示例: 高通骁龙8,OLED,6.7英寸
                </div>
              </div>

              <!-- 关系抽取 -->
              <div
                class="guide-item p-5 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border-l-4 border-blue-500">
                <div class="flex items-center mb-3">
                  <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <el-icon class="text-blue-600 text-lg">
                      <Connection />
                    </el-icon>
                  </div>
                  <h3 class="font-bold text-blue-700">关系抽取</h3>
                </div>
                <p class="text-sm text-gray-600 leading-relaxed">从文本中识别并提取实体间的关系，以三元组形式呈现（主体-谓语-客体），输出格式为逗号分隔的三元组列表。</p>
                <div class="mt-3 p-2.5 bg-white rounded-md border border-blue-200 text-xs font-mono">
                  示例: 华为-使用-麒麟芯片,iPhone-生产-苹果公司
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-test-view {
  min-height: calc(100vh - 60px);
  background-color: #f0f4f8;
  background-image:
    linear-gradient(135deg, rgba(235, 244, 255, 0.8) 0%, rgba(240, 249, 255, 0.8) 100%);
}

.extraction-type-option {
  transition: all 0.3s ease;
  border-width: 1.5px;
}

.extraction-type-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px -3px rgba(0, 0, 0, 0.08);
}

.guide-item {
  transition: all 0.3s ease;
}

.guide-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #374151;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  border-color: #60a5fa;
  box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.2);
}

:deep(.el-input__wrapper:focus-within),
:deep(.el-textarea__inner:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

:deep(.el-button) {
  height: 40px;
  border-radius: 8px;
  font-weight: 500;
  padding: 0 20px;
  transition: all 0.25s ease;
}

:deep(.el-button:not(.is-text):hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.1);
}

:deep(.el-button--primary) {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

:deep(.el-button--primary:hover) {
  background-color: #2563eb;
  border-color: #2563eb;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
}

:deep(.el-button--default) {
  border-color: #d1d5db;
  color: #4b5563;
}

:deep(.el-button--default:hover) {
  border-color: #93c5fd;
  color: #3b82f6;
  background-color: #eff6ff;
}

.text-content {
  font-family: ui-monospace, SFMono, Monaco, 'Cascadia Mono', 'Segoe UI Mono', 'Roboto Mono', monospace;
  line-height: 1.6;
}

.card {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(226, 232, 240, 0.8);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>