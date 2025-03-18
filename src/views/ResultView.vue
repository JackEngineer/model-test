<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'

import TripleComparer from '../components/TripleComparer.vue'
import EntityComparer from '../components/EntityComparer.vue'
import AttributeComparer from '../components/AttributeComparer.vue'
import RelationshipComparer from '../components/RelationshipComparer.vue'

import { getModelTestResult, getModelTest, getTestAnnotation, updateModelTestResult } from '../api'
import type { ModelTest, Test, Triple, Entity, Attribute, Relationship } from '../types'

// 导入Element Plus图标
import {
    Document,
    Reading,
    DataAnalysis,
    Warning,
    RefreshRight,
    ArrowLeft,
    Cpu,
    DataLine,
    Edit
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 状态
const isLoading = ref(true)
const modelTest = ref<ModelTest | null>(null)
const annotations = ref<any>(null)
const modelResults = ref<any>(null)

// 获取路由参数
const modelTestId = route.params.id as string

// 提取类型
const extractionType = computed(() => {
    return modelTest.value?.test?.extractionType || 'relationship'
})

// 检查是否有标注数据
const hasAnnotationData = computed(() => {
    if (!annotations.value || !annotations.value.data) return false

    // 根据测试类型检查相应的标注数据是否存在
    if (extractionType.value === 'relationship') {
        return manualRelationships.value.length > 0
    } else if (extractionType.value === 'entity') {
        return manualEntities.value.length > 0
    } else if (extractionType.value === 'attribute') {
        return manualAttributes.value.length > 0
    } else if (extractionType.value === 'triple') {
        return manualTriples.value.length > 0
    }

    return false
})

// 手动标注的数据
const manualTriples = computed(() => {
    return annotations.value?.data?.triples || []
})

const manualEntities = computed(() => {
    return annotations.value?.data?.entities || []
})

const manualAttributes = computed(() => {
    return annotations.value?.data?.attributes || []
})

const manualRelationships = computed(() => {
    return annotations.value?.data?.relationships || []
})

// 模型提取的数据
const modelTriples = computed(() => {
    return modelResults.value?.triples || []
})

const modelEntities = computed(() => {
    return modelResults.value?.entities || []
})

const modelAttributes = computed(() => {
    return modelResults.value?.attributes || []
})

const modelRelationships = computed(() => {
    return modelResults.value?.relationships || []
})

// 加载数据
const loadData = async () => {
    isLoading.value = true

    try {
        // 获取模型测试信息
        const testData = await getModelTest(modelTestId)
        modelTest.value = testData

        try {
            // 获取标注数据
            const annotationData = await getTestAnnotation(testData.testId)
            annotations.value = annotationData
        } catch (error) {
            console.warn('获取标注数据失败:', error)
            // 设置为空对象而不是null，确保后续计算属性不会出错
            annotations.value = { data: { entities: [], attributes: [], relationships: [], triples: [] } }
        }

        // 获取模型结果
        const resultData = await getModelTestResult(modelTestId)
        modelResults.value = resultData.result
    } catch (error) {
        console.error('加载数据失败:', error)
        ElMessage.error('加载数据失败')
    } finally {
        isLoading.value = false
    }
}

// 更新模型三元组数据
const updateModelTriples = async (newTriples: Triple[]) => {
    try {
        if (!modelResults.value) {
            modelResults.value = { triples: [] }
        }

        modelResults.value.triples = newTriples
        await updateModelTestResult(modelTestId, { result: modelResults.value })
        ElMessage.success('更新成功')
    } catch (error) {
        console.error('更新失败:', error)
        ElMessage.error('更新失败')
    }
}

// 更新模型实体数据
const updateModelEntities = async (newEntities: Entity[]) => {
    try {
        if (!modelResults.value) {
            modelResults.value = { entities: [] }
        }

        modelResults.value.entities = newEntities
        await updateModelTestResult(modelTestId, { result: modelResults.value })
        ElMessage.success('更新成功')
    } catch (error) {
        console.error('更新失败:', error)
        ElMessage.error('更新失败')
    }
}

// 更新模型属性数据
const updateModelAttributes = async (newAttributes: Attribute[]) => {
    try {
        if (!modelResults.value) {
            modelResults.value = { attributes: [] }
        }

        modelResults.value.attributes = newAttributes
        await updateModelTestResult(modelTestId, { result: modelResults.value })
        ElMessage.success('更新成功')
    } catch (error) {
        console.error('更新失败:', error)
        ElMessage.error('更新失败')
    }
}

// 更新模型关系数据
const updateModelRelationships = async (newRelationships: Relationship[]) => {
    try {
        if (!modelResults.value) {
            modelResults.value = { relationships: [] }
        }

        modelResults.value.relationships = newRelationships
        await updateModelTestResult(modelTestId, { result: modelResults.value })
        ElMessage.success('更新成功')
    } catch (error) {
        console.error('更新失败:', error)
        ElMessage.error('更新失败')
    }
}

// 返回列表
const goBack = () => {
    router.push('/')
}

// 页面加载时获取数据
onMounted(() => {
    loadData()
})

// 格式化指标
const formatMetric = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return `${(value * 100).toFixed(2)}%`;
};

// 获取指标类型样式
const getMetricType = (value: number | null) => {
    if (value === null || value === undefined) return '';
    if (value >= 0.8) return 'success';
    if (value >= 0.6) return 'warning';
    return 'danger';
};

// 跳转到标注页面
const goToAnnotation = () => {
    // 确保我们有测试ID
    if (modelTest.value && modelTest.value.testId) {
        router.push(`/annotation/${modelTest.value.testId}`)
    } else {
        ElMessage.warning('无法获取测试ID，请返回列表重试')
        router.push('/')
    }
}
</script>

<template>
    <div class="result-view">
        <div class="container mx-auto py-8 px-4">
            <!-- 页面标题 -->
            <div class="flex justify-between items-center mb-8">
                <div class="flex items-center">
                    <h1 class="text-2xl font-bold text-gray-800">
                        模型测试结果
                        <span v-if="modelTest" class="ml-2 text-primary-600">({{ modelTest.model.name }})</span>
                    </h1>
                    <div v-if="modelTest && modelTest.status === 'completed'" class="ml-4">
                        <el-tag type="success" effect="dark">测试完成</el-tag>
                    </div>
                </div>
                <el-button type="primary" plain @click="goBack">
                    <el-icon>
                        <ArrowLeft />
                    </el-icon> 返回列表
                </el-button>
            </div>

            <!-- 加载状态 -->
            <div v-if="isLoading" class="flex justify-center items-center py-32">
                <div class="text-center">
                    <el-skeleton :rows="10" animated />
                    <p class="mt-4 text-gray-500">正在加载测试结果...</p>
                </div>
            </div>

            <!-- 无标注数据提示 -->
            <el-alert v-if="!isLoading && modelTest && !hasAnnotationData" type="warning" :closable="false"
                class="mb-6">
                <div class="flex flex-col gap-3">
                    <div class="font-medium">未找到标注数据</div>
                    <p class="text-sm">
                        这个测试没有标注数据，无法计算准确率、召回率等指标。为了获得完整的测试结果，建议：
                    </p>
                    <ul class="list-disc list-inside text-sm ml-2">
                        <li>返回并为该测试添加标注数据</li>
                        <li>然后重新运行测试</li>
                    </ul>
                    <div class="mt-2">
                        <el-button type="primary" plain size="small" @click="goToAnnotation">
                            <el-icon class="mr-1">
                                <Edit />
                            </el-icon>添加标注
                        </el-button>
                    </div>
                </div>
            </el-alert>

            <!-- 测试结果内容 -->
            <div v-if="!isLoading && modelTest" class="result-content space-y-8">
                <!-- 测试信息和模型信息卡片 -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- 测试信息 -->
                    <div class="bg-white p-6 rounded-lg shadow-md transition-shadow hover:shadow-lg">
                        <div class="flex items-center mb-4">
                            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <el-icon class="text-blue-500">
                                    <Document />
                                </el-icon>
                            </div>
                            <h2 class="text-xl font-bold text-gray-800">测试信息</h2>
                        </div>
                        <div class="space-y-3">
                            <p class="flex justify-between">
                                <span class="text-gray-600 font-medium">测试名称:</span>
                                <span class="text-gray-800">{{ modelTest.test.name }}</span>
                            </p>
                            <p class="flex justify-between">
                                <span class="text-gray-600 font-medium">创建时间:</span>
                                <span class="text-gray-800">{{ new Date(modelTest.createdAt).toLocaleString() }}</span>
                            </p>
                            <p class="flex justify-between items-center">
                                <span class="text-gray-600 font-medium">抽取类型:</span>
                                <el-tag v-if="extractionType === 'entity'" type="success" effect="plain">实体抽取</el-tag>
                                <el-tag v-else-if="extractionType === 'attribute'" type="warning"
                                    effect="plain">属性抽取</el-tag>
                                <el-tag v-else type="primary" effect="plain">关系抽取</el-tag>
                            </p>
                        </div>
                    </div>

                    <!-- 模型信息 -->
                    <div class="bg-white p-6 rounded-lg shadow-md transition-shadow hover:shadow-lg">
                        <div class="flex items-center mb-4">
                            <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                <el-icon class="text-green-500">
                                    <Cpu />
                                </el-icon>
                            </div>
                            <h2 class="text-xl font-bold text-gray-800">模型信息</h2>
                        </div>
                        <div class="space-y-3">
                            <p class="flex justify-between">
                                <span class="text-gray-600 font-medium">模型名称:</span>
                                <span class="text-gray-800">{{ modelTest.model.name }}</span>
                            </p>
                            <p class="flex justify-between">
                                <span class="text-gray-600 font-medium">API端点:</span>
                                <span class="text-gray-800 truncate max-w-xs" :title="modelTest.model.apiEndpoint">
                                    {{ modelTest.model.apiEndpoint }}
                                </span>
                            </p>
                            <p class="flex justify-between items-center">
                                <span class="text-gray-600 font-medium">状态:</span>
                                <el-tag v-if="modelTest.status === 'completed'" type="success">已完成</el-tag>
                                <el-tag v-else-if="modelTest.status === 'pending'" type="warning">处理中</el-tag>
                                <el-tag v-else type="danger">失败</el-tag>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- 文本内容 -->
                <div class="bg-white p-6 rounded-lg shadow-md transition-shadow hover:shadow-lg">
                    <div class="flex items-center mb-4">
                        <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                            <el-icon class="text-indigo-500">
                                <Reading />
                            </el-icon>
                        </div>
                        <h2 class="text-xl font-bold text-gray-800">文本内容</h2>
                    </div>
                    <div
                        class="text-content whitespace-pre-wrap bg-gray-50 p-5 rounded-md border border-gray-200 text-gray-700 leading-relaxed">
                        {{ modelTest.test.text }}
                    </div>
                </div>

                <!-- 抽取结果比较 -->
                <div class="bg-white p-6 rounded-lg shadow-md transition-shadow hover:shadow-lg">
                    <div class="flex items-center mb-6">
                        <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                            <el-icon class="text-purple-500">
                                <DataAnalysis />
                            </el-icon>
                        </div>
                        <h2 class="text-xl font-bold text-gray-800">抽取结果比较</h2>
                    </div>

                    <div class="bg-gray-50 p-4 rounded-md mb-6">
                        <div class="text-sm text-gray-600 mb-2">根据用户标注的数据评估模型抽取结果的准确性，可以通过"标为正确"或"标为错误"按钮来更新评估结果。</div>
                        <div class="text-sm text-gray-600">评估完成后，系统会自动计算准确率、召回率等指标。</div>
                    </div>

                    <!-- 关系抽取结果 - 三元组比较器 -->
                    <transition name="fade" mode="out-in">
                        <TripleComparer v-if="extractionType === 'relationship'" :manual-triples="manualTriples"
                            :model-triples="modelTriples" :model-name="modelTest.model.name"
                            @update:model-triples="updateModelTriples" />

                        <!-- 实体抽取结果 - 实体比较器 -->
                        <EntityComparer v-else-if="extractionType === 'entity'" :manual-entities="manualEntities"
                            :model-entities="modelEntities" :model-name="modelTest.model.name"
                            @update:model-entities="updateModelEntities" />

                        <!-- 属性抽取结果 - 属性比较器 -->
                        <AttributeComparer v-else-if="extractionType === 'attribute'"
                            :manual-attributes="manualAttributes" :model-attributes="modelAttributes"
                            :model-name="modelTest.model.name" @update:model-attributes="updateModelAttributes" />

                        <!-- 关系抽取结果 - 关系比较器 -->
                        <RelationshipComparer v-else :manual-relationships="manualRelationships"
                            :model-relationships="modelRelationships" :model-name="modelTest.model.name"
                            @update:model-relationships="updateModelRelationships" />
                    </transition>
                </div>

                <!-- 测试结果指标 -->
                <div class="metrics-section mb-6 bg-white p-5 rounded-lg shadow">
                    <div class="flex items-center mb-4">
                        <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <el-icon class="text-blue-500">
                                <DataLine />
                            </el-icon>
                        </div>
                        <h2 class="text-lg font-medium text-gray-800">测试结果指标</h2>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <!-- 准确率卡片 -->
                        <div
                            class="metric-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                            <h3 class="text-sm font-medium text-gray-600 mb-1">准确率 (Precision)</h3>
                            <div class="flex items-center">
                                <div class="text-2xl font-bold" :class="{
                                    'text-green-600': modelTest.result?.precision >= 0.8,
                                    'text-yellow-600': modelTest.result?.precision >= 0.6 && modelTest.result?.precision < 0.8,
                                    'text-red-600': modelTest.result?.precision !== null && modelTest.result?.precision !== undefined && modelTest.result?.precision < 0.6,
                                    'text-gray-400': modelTest.result?.precision === null || modelTest.result?.precision === undefined
                                }">
                                    {{ formatMetric(modelTest.result?.precision) }}
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">正确预测的数量 / 总预测数量</p>
                        </div>

                        <!-- 召回率卡片 -->
                        <div
                            class="metric-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                            <h3 class="text-sm font-medium text-gray-600 mb-1">召回率 (Recall)</h3>
                            <div class="flex items-center">
                                <div class="text-2xl font-bold" :class="{
                                    'text-green-600': modelTest.result?.recall >= 0.8,
                                    'text-yellow-600': modelTest.result?.recall >= 0.6 && modelTest.result?.recall < 0.8,
                                    'text-red-600': modelTest.result?.recall !== null && modelTest.result?.recall !== undefined && modelTest.result?.recall < 0.6,
                                    'text-gray-400': modelTest.result?.recall === null || modelTest.result?.recall === undefined
                                }">
                                    {{ formatMetric(modelTest.result?.recall) }}
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">正确预测的数量 / 实际标准数量</p>
                        </div>

                        <!-- F1分数卡片 -->
                        <div
                            class="metric-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                            <h3 class="text-sm font-medium text-gray-600 mb-1">F1分数</h3>
                            <div class="flex items-center">
                                <div class="text-2xl font-bold" :class="{
                                    'text-green-600': modelTest.result?.f1Score >= 0.8,
                                    'text-yellow-600': modelTest.result?.f1Score >= 0.6 && modelTest.result?.f1Score < 0.8,
                                    'text-red-600': modelTest.result?.f1Score !== null && modelTest.result?.f1Score !== undefined && modelTest.result?.f1Score < 0.6,
                                    'text-gray-400': modelTest.result?.f1Score === null || modelTest.result?.f1Score === undefined
                                }">
                                    {{ formatMetric(modelTest.result?.f1Score) }}
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">准确率和召回率的调和平均值</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 错误状态 -->
            <div v-else class="py-20 text-center bg-white rounded-lg shadow-md">
                <el-icon class="text-yellow-500 text-6xl mb-4">
                    <Warning />
                </el-icon>
                <p class="text-xl text-gray-600 mb-4">数据加载失败，请重试</p>
                <el-button type="primary" @click="loadData">
                    <el-icon>
                        <RefreshRight />
                    </el-icon> 重新加载
                </el-button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.result-view {
    min-height: calc(100vh - 60px);
    background-color: #f5f7fa;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

:deep(.el-tag) {
    font-weight: 500;
}

:deep(.stat-item) {
    transition: all 0.3s ease;
}

:deep(.stat-item:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>