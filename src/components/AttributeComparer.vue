<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Attribute } from '../types'

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
    manualAttributes: Attribute[] // 用户标注的属性
    modelAttributes: Attribute[] // 模型抽取的属性
    modelName: string // 模型名称
    readonly?: boolean // 是否只读模式
}>()

// 事件
const emit = defineEmits<{
    'update:modelAttributes': [attributes: Attribute[]]
}>()

// 本地状态
const localModelAttributes = ref<Attribute[]>([])

// 初始化本地状态
watch(() => props.modelAttributes, (newAttributes) => {
    localModelAttributes.value = JSON.parse(JSON.stringify(newAttributes))
}, { immediate: true })

// 更新模型属性的评估结果
const updateAttributeEvaluation = (attribute: Attribute, evaluation: 'correct' | 'incorrect' | 'extra') => {
    const index = localModelAttributes.value.findIndex(a => a.id === attribute.id)
    if (index === -1) return

    const updatedAttribute = { ...localModelAttributes.value[index] }
    updatedAttribute.evaluation = evaluation
    updatedAttribute.isPositive = evaluation === 'correct'

    localModelAttributes.value[index] = updatedAttribute

    // 通知父组件更新
    emit('update:modelAttributes', [...localModelAttributes.value])
}

// 统计信息
const stats = computed(() => {
    const total = props.manualAttributes.length
    const modelTotal = localModelAttributes.value.length

    const correct = localModelAttributes.value.filter(a => a.evaluation === 'correct').length
    const incorrect = localModelAttributes.value.filter(a => a.evaluation === 'incorrect' || a.evaluation === 'extra').length
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

// 格式化属性数据为逗号分隔的列表
const formattedManualAttributes = computed(() => {
    return props.manualAttributes.map(attribute => attribute.name).join(',')
})

const formattedModelAttributes = computed(() => {
    return localModelAttributes.value.map(attribute => attribute.name).join(',')
})
</script>

<template>
    <div class="attribute-comparer">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 用户标注的属性 -->
            <div class="manual-attributes bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-800 flex items-center">
                        <el-icon class="mr-2 text-blue-500">
                            <User />
                        </el-icon>
                        用户标注的属性
                    </h3>
                    <div class="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                        共 {{ stats.total }} 个属性
                    </div>
                </div>

                <!-- 属性标签展示 -->
                <div class="mb-4">
                    <div class="text-sm text-gray-500 mb-2">标注的属性：</div>
                    <div class="flex flex-wrap gap-2">
                        <el-tag v-for="attribute in manualAttributes" :key="attribute.id" class="attribute-tag"
                            effect="plain"
                            :type="localModelAttributes.some(a => a.name === attribute.name && a.category === attribute.category) ? 'success' : 'danger'">
                            {{ attribute.name }}
                            <span class="text-xs ml-1 opacity-70">({{ attribute.category }})</span>
                        </el-tag>
                    </div>
                </div>

                <el-table :data="manualAttributes" border style="width: 100%" class="attribute-table"
                    :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: 'bold' }">
                    <el-table-column label="属性名称" min-width="120">
                        <template #default="{ row }">
                            <div class="font-medium">{{ row.name }}</div>
                            <div class="text-xs text-gray-500">{{ row.category }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column label="状态" width="100" align="center">
                        <template #default="{ row }">
                            <el-tag
                                v-if="localModelAttributes.some(a => a.name === row.name && a.category === row.category)"
                                type="success" effect="dark" size="small" class="status-tag">
                                已抽取
                            </el-tag>
                            <el-tag v-else type="danger" effect="dark" size="small" class="status-tag">
                                漏报
                            </el-tag>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <!-- 模型抽取的属性 -->
            <div class="model-attributes bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-800 flex items-center">
                        <el-icon class="mr-2 text-green-500">
                            <Cpu />
                        </el-icon>
                        {{ modelName }}抽取的属性
                    </h3>
                    <div class="text-sm bg-green-50 text-green-600 px-3 py-1 rounded-full font-medium">
                        共 {{ stats.modelTotal }} 个属性
                    </div>
                </div>

                <!-- 属性标签展示 -->
                <div class="mb-4">
                    <div class="text-sm text-gray-500 mb-2">模型抽取的属性：</div>
                    <div class="flex flex-wrap gap-2">
                        <el-tag v-for="attribute in localModelAttributes" :key="attribute.id" class="attribute-tag"
                            :type="getEvaluationTagType(attribute.evaluation)" effect="plain">
                            {{ attribute.name }}
                            <span class="text-xs ml-1 opacity-70">({{ attribute.category }})</span>
                        </el-tag>
                    </div>
                </div>

                <el-table :data="localModelAttributes" border style="width: 100%" class="attribute-table"
                    :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: 'bold' }">
                    <el-table-column label="属性名称" min-width="120">
                        <template #default="{ row }">
                            <div class="font-medium">{{ row.name }}</div>
                            <div class="text-xs text-gray-500">{{ row.category }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column label="置信度" width="80" align="center">
                        <template #default="{ row }">
                            <div class="confidence-badge"
                                :class="row.confidence && row.confidence > 0.7 ? 'high' : 'low'">
                                {{ formatConfidence(row.confidence) }}
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="评估" width="80" align="center">
                        <template #default="{ row }">
                            <el-tag :type="getEvaluationTagType(row.evaluation)" effect="dark" size="small"
                                class="status-tag">
                                {{ getEvaluationLabel(row.evaluation) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column v-if="!readonly" label="操作" width="180">
                        <template #default="{ row }">
                            <div class="flex gap-2">
                                <el-button size="small" type="success" :disabled="row.evaluation === 'correct'"
                                    :class="{ 'opacity-50': row.evaluation === 'correct' }"
                                    @click="updateAttributeEvaluation(row, 'correct')">
                                    标为正确
                                </el-button>
                                <el-button size="small" type="danger" :disabled="row.evaluation === 'incorrect'"
                                    :class="{ 'opacity-50': row.evaluation === 'incorrect' }"
                                    @click="updateAttributeEvaluation(row, 'incorrect')">
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
.attribute-comparer {
    font-family: system-ui, -apple-system, sans-serif;
}

.attribute-tag {
    margin-bottom: 4px;
    transition: all 0.2s ease;
}

.attribute-tag:hover {
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

.attribute-table {
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