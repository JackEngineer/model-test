<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Triple } from '../types'

// 导入Element Plus图标
import {
    User,
    Cpu,
    Edit,
    Check,
    Close,
    DataLine,
    Connection
} from '@element-plus/icons-vue'

// 组件属性
const props = defineProps<{
    manualTriples: Triple[] // 用户标注的三元组
    modelTriples: Triple[] // 模型抽取的三元组
    modelName: string // 模型名称
    readonly?: boolean // 是否只读模式
}>()

// 事件
const emit = defineEmits<{
    'update:modelTriples': [triples: Triple[]]
}>()

// 本地状态
const localModelTriples = ref<Triple[]>([])

// 初始化本地状态
watch(() => props.modelTriples, (newTriples) => {
    localModelTriples.value = JSON.parse(JSON.stringify(newTriples))
}, { immediate: true })

// 更新模型三元组的评估结果
const updateTripleEvaluation = (triple: Triple, evaluation: 'correct' | 'incorrect' | 'extra') => {
    const index = localModelTriples.value.findIndex(t => t.id === triple.id)
    if (index === -1) return

    const updatedTriple = { ...localModelTriples.value[index] }
    updatedTriple.evaluation = evaluation
    updatedTriple.isPositive = evaluation === 'correct'

    localModelTriples.value[index] = updatedTriple

    // 通知父组件更新
    emit('update:modelTriples', [...localModelTriples.value])
}

// 统计信息
const stats = computed(() => {
    const total = props.manualTriples.length
    const modelTotal = localModelTriples.value.length

    const correct = localModelTriples.value.filter(t => t.evaluation === 'correct').length
    const incorrect = localModelTriples.value.filter(t => t.evaluation === 'incorrect' || t.evaluation === 'extra').length
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

// 检查三元组是否匹配模型结果
const isTripleMatch = (triple: Triple) => {
    return localModelTriples.value.some(t =>
        t.subject === triple.subject &&
        t.predicate === triple.predicate &&
        t.object === triple.object
    );
}
</script>

<template>
    <div class="triple-comparer">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- A. 用户标注的三元组 -->
            <div class="manual-triples bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-800 flex items-center">
                        <el-icon class="mr-2 text-blue-500">
                            <User />
                        </el-icon>
                        用户标注的三元组
                    </h3>
                    <div class="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                        共 {{ stats.total }} 个三元组
                    </div>
                </div>

                <!-- 三元组卡片列表 -->
                <div class="space-y-3 mb-4">
                    <div v-for="(triple, index) in manualTriples" :key="triple.id"
                        class="triple-card p-3 bg-gray-50 rounded-md border border-gray-200">
                        <div class="flex justify-between">
                            <div class="text-sm font-medium">#{{ index + 1 }}</div>
                            <el-tag v-if="isTripleMatch(triple)" type="success" effect="dark" size="small"
                                class="status-tag">
                                已抽取
                            </el-tag>
                            <el-tag v-else type="danger" effect="dark" size="small" class="status-tag">
                                漏报
                            </el-tag>
                        </div>
                        <div class="mt-2 flex items-center">
                            <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mr-2">主体</span>
                            <span class="text-sm">{{ triple.subject }}</span>
                        </div>
                        <div class="mt-1 flex items-center">
                            <span class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded mr-2">谓语</span>
                            <span class="text-sm">{{ triple.predicate }}</span>
                        </div>
                        <div class="mt-1 flex items-center">
                            <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded mr-2">客体</span>
                            <span class="text-sm">{{ triple.object }}</span>
                        </div>
                    </div>
                </div>

                <!-- 无数据状态 -->
                <div v-if="manualTriples.length === 0" class="text-center py-6 text-gray-500">
                    暂无用户标注的三元组数据
                </div>
            </div>

            <!-- B. 模型抽取的三元组 -->
            <div class="model-triples bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-800 flex items-center">
                        <el-icon class="mr-2 text-green-500">
                            <Cpu />
                        </el-icon>
                        {{ modelName }}抽取的三元组
                    </h3>
                    <div class="text-sm bg-green-50 text-green-600 px-3 py-1 rounded-full font-medium">
                        共 {{ stats.modelTotal }} 个三元组
                    </div>
                </div>

                <!-- 三元组卡片列表 -->
                <div class="space-y-3 mb-4">
                    <div v-for="(triple, index) in localModelTriples" :key="triple.id"
                        class="triple-card p-3 bg-gray-50 rounded-md border border-gray-200">
                        <div class="flex justify-between">
                            <div class="text-sm font-medium">#{{ index + 1 }}</div>
                            <div class="flex items-center gap-2">
                                <div v-if="triple.confidence" class="confidence-badge"
                                    :class="triple.confidence > 0.7 ? 'high' : 'low'">
                                    {{ formatConfidence(triple.confidence) }}
                                </div>
                                <el-tag :type="getEvaluationTagType(triple.evaluation)" effect="dark" size="small"
                                    class="status-tag">
                                    {{ getEvaluationLabel(triple.evaluation) }}
                                </el-tag>
                            </div>
                        </div>
                        <div class="mt-2 flex items-center">
                            <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mr-2">主体</span>
                            <span class="text-sm">{{ triple.subject }}</span>
                        </div>
                        <div class="mt-1 flex items-center">
                            <span class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded mr-2">谓语</span>
                            <span class="text-sm">{{ triple.predicate }}</span>
                        </div>
                        <div class="mt-1 flex items-center">
                            <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded mr-2">客体</span>
                            <span class="text-sm">{{ triple.object }}</span>
                        </div>
                        <div v-if="!readonly" class="mt-3 flex justify-end gap-2">
                            <el-button size="small" type="success" :disabled="triple.evaluation === 'correct'"
                                :class="{ 'opacity-50': triple.evaluation === 'correct' }"
                                @click="updateTripleEvaluation(triple, 'correct')">
                                标为正确
                            </el-button>
                            <el-button size="small" type="danger" :disabled="triple.evaluation === 'incorrect'"
                                :class="{ 'opacity-50': triple.evaluation === 'incorrect' }"
                                @click="updateTripleEvaluation(triple, 'incorrect')">
                                标为错误
                            </el-button>
                        </div>
                    </div>
                </div>

                <!-- 无数据状态 -->
                <div v-if="localModelTriples.length === 0" class="text-center py-6 text-gray-500">
                    暂无模型抽取的三元组数据
                </div>
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
.triple-comparer {
    font-family: system-ui, -apple-system, sans-serif;
}

.triple-tag {
    margin-bottom: 4px;
    transition: all 0.2s ease;
}

.triple-tag:hover {
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

.triple-table {
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

.triple-card {
    transition: all 0.3s ease;
}

.triple-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>