<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Relationship } from '../types'

// 组件属性
const props = defineProps<{
    manualRelationships: Relationship[] // 用户标注的关系
    modelRelationships: Relationship[] // 模型抽取的关系
    modelName: string // 模型名称
    readonly?: boolean // 是否只读模式
}>()

// 事件
const emit = defineEmits<{
    'update:modelRelationships': [relationships: Relationship[]]
}>()

// 本地状态
const localModelRelationships = ref<Relationship[]>([])

// 初始化本地状态
watch(() => props.modelRelationships, (newRelationships) => {
    localModelRelationships.value = JSON.parse(JSON.stringify(newRelationships))
}, { immediate: true })

// 更新模型关系的评估结果
const updateRelationshipEvaluation = (relationship: Relationship, evaluation: 'correct' | 'incorrect' | 'extra') => {
    const index = localModelRelationships.value.findIndex(r => r.id === relationship.id)
    if (index === -1) return

    const updatedRelationship = { ...localModelRelationships.value[index] }
    updatedRelationship.evaluation = evaluation
    updatedRelationship.isPositive = evaluation === 'correct'

    localModelRelationships.value[index] = updatedRelationship

    // 通知父组件更新
    emit('update:modelRelationships', [...localModelRelationships.value])
}

// 统计信息
const stats = computed(() => {
    const total = props.manualRelationships.length
    const modelTotal = localModelRelationships.value.length

    const correct = localModelRelationships.value.filter(r => r.evaluation === 'correct').length
    const incorrect = localModelRelationships.value.filter(r => r.evaluation === 'incorrect' || r.evaluation === 'extra').length
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

// 格式化关系为三元组字符串
const formatTriple = (relationship: Relationship) => {
    return `${relationship.subject}-${relationship.predicate}-${relationship.object}`
}

// 格式化关系数据为逗号分隔的三元组列表
const formattedManualRelationships = computed(() => {
    return props.manualRelationships.map(formatTriple).join(',')
})

const formattedModelRelationships = computed(() => {
    return localModelRelationships.value.map(formatTriple).join(',')
})
</script>

<template>
    <div class="relationship-comparer">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 用户标注的关系 -->
            <div class="manual-relationships">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-lg font-bold">用户标注的关系</h3>
                    <div class="text-sm text-gray-500">
                        共 {{ stats.total }} 个关系
                    </div>
                </div>

                <!-- 逗号分隔的三元组列表 -->
                <div class="bg-gray-50 p-4 rounded-md mb-3 whitespace-pre-wrap">
                    {{ formattedManualRelationships }}
                </div>

                <el-table :data="manualRelationships" border style="width: 100%">
                    <el-table-column label="主体" prop="subject" min-width="100" show-overflow-tooltip />
                    <el-table-column label="谓语" prop="predicate" min-width="100" show-overflow-tooltip />
                    <el-table-column label="客体" prop="object" min-width="100" show-overflow-tooltip />
                    <el-table-column label="状态" width="80" align="center">
                        <template #default="{ row }">
                            <el-tag v-if="localModelRelationships.some(r =>
                                r.subject === row.subject &&
                                r.predicate === row.predicate &&
                                r.object === row.object
                            )" type="success" size="small">
                                已抽取
                            </el-tag>
                            <el-tag v-else type="danger" size="small">
                                漏报
                            </el-tag>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <!-- 模型抽取的关系 -->
            <div class="model-relationships">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-lg font-bold">{{ modelName }}抽取的关系</h3>
                    <div class="text-sm text-gray-500">
                        共 {{ stats.modelTotal }} 个关系
                    </div>
                </div>

                <!-- 逗号分隔的三元组列表 -->
                <div class="bg-gray-50 p-4 rounded-md mb-3 whitespace-pre-wrap">
                    {{ formattedModelRelationships }}
                </div>

                <el-table :data="localModelRelationships" border style="width: 100%">
                    <el-table-column label="主体" prop="subject" min-width="100" show-overflow-tooltip />
                    <el-table-column label="谓语" prop="predicate" min-width="100" show-overflow-tooltip />
                    <el-table-column label="客体" prop="object" min-width="100" show-overflow-tooltip />
                    <el-table-column label="置信度" width="80" align="center">
                        <template #default="{ row }">
                            {{ formatConfidence(row.confidence) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="评估" width="80" align="center">
                        <template #default="{ row }">
                            <el-tag :type="getEvaluationTagType(row.evaluation)" size="small">
                                {{ getEvaluationLabel(row.evaluation) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column v-if="!readonly" label="操作" width="180" align="center">
                        <template #default="{ row }">
                            <div class="flex justify-center gap-2">
                                <el-button size="small" type="success" :disabled="row.evaluation === 'correct'"
                                    @click="updateRelationshipEvaluation(row, 'correct')">
                                    标为正确
                                </el-button>
                                <el-button size="small" type="danger" :disabled="row.evaluation === 'incorrect'"
                                    @click="updateRelationshipEvaluation(row, 'incorrect')">
                                    标为错误
                                </el-button>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>

        <!-- 评估统计 -->
        <div class="evaluation-stats mt-6 p-4 bg-gray-50 rounded-md">
            <h3 class="text-lg font-bold mb-3">评估统计</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="stat-item p-3 bg-white rounded-md shadow-sm">
                    <div class="text-sm text-gray-500">正确抽取</div>
                    <div class="text-xl font-bold text-green-600">{{ stats.correct }}</div>
                </div>
                <div class="stat-item p-3 bg-white rounded-md shadow-sm">
                    <div class="text-sm text-gray-500">错误抽取</div>
                    <div class="text-xl font-bold text-red-600">{{ stats.incorrect }}</div>
                </div>
                <div class="stat-item p-3 bg-white rounded-md shadow-sm">
                    <div class="text-sm text-gray-500">漏报数量</div>
                    <div class="text-xl font-bold text-blue-600">{{ stats.missing }}</div>
                </div>
                <div class="stat-item p-3 bg-white rounded-md shadow-sm">
                    <div class="text-sm text-gray-500">总体评估</div>
                    <div class="text-xl font-bold">
                        {{ stats.correct }} / {{ stats.modelTotal + stats.missing }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.relationship-comparer {
    font-family: system-ui, -apple-system, sans-serif;
}
</style>