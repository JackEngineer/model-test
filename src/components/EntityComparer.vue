<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Entity } from '../types'

// 导入Element Plus图标
import {
  User,
  Cpu,
  Edit,
  Check,
  Close,
  DataLine
} from '@element-plus/icons-vue'

// 组件属性
const props = defineProps<{
  manualEntities: Entity[] // 用户标注的实体
  modelEntities: Entity[] // 模型抽取的实体
  modelName: string // 模型名称
  readonly?: boolean // 是否只读模式
}>()

// 事件
const emit = defineEmits<{
  'update:modelEntities': [entities: Entity[]]
}>()

// 本地状态
const localModelEntities = ref<Entity[]>([])

// 初始化本地状态
watch(() => props.modelEntities, (newEntities) => {
  localModelEntities.value = JSON.parse(JSON.stringify(newEntities))
}, { immediate: true })

// 更新模型实体的评估结果
const updateEntityEvaluation = (entity: Entity, evaluation: 'correct' | 'incorrect' | 'extra') => {
  const index = localModelEntities.value.findIndex(e => e.id === entity.id)
  if (index === -1) return

  const updatedEntity = { ...localModelEntities.value[index] }
  updatedEntity.evaluation = evaluation
  updatedEntity.isPositive = evaluation === 'correct'

  localModelEntities.value[index] = updatedEntity

  // 通知父组件更新
  emit('update:modelEntities', [...localModelEntities.value])
}

// 统计信息
const stats = computed(() => {
  const total = props.manualEntities.length
  const modelTotal = localModelEntities.value.length

  const correct = localModelEntities.value.filter(e => e.evaluation === 'correct').length
  const incorrect = localModelEntities.value.filter(e => e.evaluation === 'incorrect' || e.evaluation === 'extra').length
  const missing = total - correct

  return {
    total,
    modelTotal,
    correct,
    incorrect,
    missing
  }
})

// 格式化置信度
const formatConfidence = (confidence?: number) => {
  if (confidence === undefined) return '-'
  return (confidence * 100).toFixed(1) + '%'
}

// 获取评估结果标签样式
const getEvaluationTagType = (evaluation?: string) => {
  const typeMap: Record<string, string> = {
    'correct': 'success',
    'incorrect': 'danger',
    'extra': 'warning',
    'missing': 'info'
  }
  return typeMap[evaluation || ''] || 'info'
}

// 获取评估结果标签文本
const getEvaluationLabel = (evaluation?: string) => {
  const labelMap: Record<string, string> = {
    'correct': '正确',
    'incorrect': '错误',
    'extra': '多余',
    'missing': '漏报'
  }
  return labelMap[evaluation || ''] || '未评估'
}

// 格式化实体数据为逗号分隔的列表
const formattedManualEntities = computed(() => {
  return props.manualEntities.map(entity => entity.name).join(',')
})

const formattedModelEntities = computed(() => {
  return localModelEntities.value.map(entity => entity.name).join(',')
})
</script>

<template>
  <div class="entity-comparer">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 用户标注的实体 -->
      <div class="manual-entities bg-white p-5 rounded-lg shadow-sm border border-gray-100">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-gray-800 flex items-center">
            <el-icon class="mr-2 text-blue-500">
              <User />
            </el-icon>
            用户标注的实体
          </h3>
          <div class="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
            共 {{ stats.total }} 个实体
          </div>
        </div>

        <!-- 实体标签展示 -->
        <div class="mb-4">
          <div class="text-sm text-gray-500 mb-2">标注的实体：</div>
          <div class="flex flex-wrap gap-2">
            <el-tag v-for="entity in manualEntities" :key="entity.id" class="entity-tag" effect="plain"
              :type="localModelEntities.some(e => e.name === entity.name) ? 'success' : 'danger'">
              {{ entity.name }}
              <span class="text-xs ml-1 opacity-70">({{ entity.category }})</span>
            </el-tag>
          </div>
        </div>

        <el-table :data="manualEntities" border style="width: 100%" class="entity-table"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: 'bold' }">
          <el-table-column label="实体名称" min-width="140">
            <template #default="{ row }">
              <div class="font-medium">{{ row.name }}</div>
              <div class="text-xs text-gray-500">{{ row.category }}</div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="localModelEntities.some(e => e.name === row.name)" type="success" effect="dark" size="small"
                class="status-tag">
                已抽取
              </el-tag>
              <el-tag v-else type="danger" effect="dark" size="small" class="status-tag">
                漏报
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 模型抽取的实体 -->
      <div class="model-entities bg-white p-5 rounded-lg shadow-sm border border-gray-100">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-gray-800 flex items-center">
            <el-icon class="mr-2 text-green-500">
              <Cpu />
            </el-icon>
            {{ modelName }}抽取的实体
          </h3>
          <div class="text-sm bg-green-50 text-green-600 px-3 py-1 rounded-full font-medium">
            共 {{ stats.modelTotal }} 个实体
          </div>
        </div>

        <!-- 实体标签展示 -->
        <div class="mb-4">
          <div class="text-sm text-gray-500 mb-2">模型抽取的实体：</div>
          <div class="flex flex-wrap gap-2">
            <el-tag v-for="entity in localModelEntities" :key="entity.id" class="entity-tag"
              :type="getEvaluationTagType(entity.evaluation)" effect="plain">
              {{ entity.name }}
              <span class="text-xs ml-1 opacity-70">({{ entity.category }})</span>
            </el-tag>
          </div>
        </div>

        <el-table :data="localModelEntities" border style="width: 100%" class="entity-table"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: 'bold' }">
          <el-table-column label="实体名称" min-width="140">
            <template #default="{ row }">
              <div class="font-medium">{{ row.name }}</div>
              <div class="text-xs text-gray-500">{{ row.category }}</div>
            </template>
          </el-table-column>
          <el-table-column label="置信度" width="80" align="center">
            <template #default="{ row }">
              <div class="confidence-badge" :class="row.confidence && row.confidence > 0.7 ? 'high' : 'low'">
                {{ formatConfidence(row.confidence) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="评估" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="getEvaluationTagType(row.evaluation)" effect="dark" size="small" class="status-tag">
                {{ getEvaluationLabel(row.evaluation) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="!readonly" label="操作" width="180">
            <template #default="{ row }">
              <div class="flex gap-2">
                <el-button size="small" type="success" :disabled="row.evaluation === 'correct'"
                  :class="{ 'opacity-50': row.evaluation === 'correct' }"
                  @click="updateEntityEvaluation(row, 'correct')">
                  标为正确
                </el-button>
                <el-button size="small" type="danger" :disabled="row.evaluation === 'incorrect'"
                  :class="{ 'opacity-50': row.evaluation === 'incorrect' }"
                  @click="updateEntityEvaluation(row, 'incorrect')">
                  标为错误
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 评估统计 -->
    <div class="evaluation-stats mt-6 p-5 bg-gray-50 rounded-lg border border-gray-100">
      <h3 class="text-lg font-bold mb-4 text-gray-800 flex items-center">
        <el-icon class="mr-2 text-blue-500">
          <DataLine />
        </el-icon>
        评估统计
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="stat-item p-4 bg-white rounded-lg shadow-sm border-l-4 border-green-500">
          <div class="text-sm text-gray-500 mb-1">正确抽取</div>
          <div class="text-2xl font-bold text-green-600 flex items-end">
            {{ stats.correct }}
            <span class="text-sm text-gray-500 ml-2">个</span>
          </div>
        </div>
        <div class="stat-item p-4 bg-white rounded-lg shadow-sm border-l-4 border-red-500">
          <div class="text-sm text-gray-500 mb-1">错误抽取</div>
          <div class="text-2xl font-bold text-red-600 flex items-end">
            {{ stats.incorrect }}
            <span class="text-sm text-gray-500 ml-2">个</span>
          </div>
        </div>
        <div class="stat-item p-4 bg-white rounded-lg shadow-sm border-l-4 border-blue-500">
          <div class="text-sm text-gray-500 mb-1">漏报数量</div>
          <div class="text-2xl font-bold text-blue-600 flex items-end">
            {{ stats.missing }}
            <span class="text-sm text-gray-500 ml-2">个</span>
          </div>
        </div>
        <div class="stat-item p-4 bg-white rounded-lg shadow-sm border-l-4 border-purple-500">
          <div class="text-sm text-gray-500 mb-1">准确率/召回率</div>
          <div class="text-2xl font-bold text-purple-600 flex items-end">
            {{ stats.modelTotal > 0 ? ((stats.correct / stats.modelTotal) * 100).toFixed(1) : 0 }}% /
            {{ stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0 }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.entity-comparer {
  font-family: system-ui, -apple-system, sans-serif;
}

.entity-tag {
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

.entity-tag:hover {
  transform: translateY(-1px);
}

.status-tag {
  font-weight: 500;
}

.confidence-badge {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.confidence-badge.high {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.confidence-badge.low {
  background-color: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.entity-table {
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.stat-item {
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>