<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import TripleAnnotator from '../components/TripleAnnotator.vue'
import EntityAnnotator from '../components/EntityAnnotator.vue'
import AttributeAnnotator from '../components/AttributeAnnotator.vue'

// 导入Element Plus图标
import {
    Edit,
    DocumentAdd,
    ArrowLeft,
    Check,
    Back,
    InfoFilled,
    Connection,
    Collection,
    Filter,
    Document,
    Download,
    Upload,
    Select
} from '@element-plus/icons-vue'

import { getTest, createTestAnnotation, getTestAnnotation, updateTestAnnotation } from '../api'
import type { Test, Triple, Entity, Attribute, Relationship } from '../types'

const route = useRoute()
const router = useRouter()

// 状态
const isLoading = ref(true)
const isSaving = ref(false)
const testData = ref<Test | null>(null)
const annotation = ref<any>(null)

// 标注数据
const entities = ref<Entity[]>([])
const attributes = ref<Attribute[]>([])
const triples = ref<Triple[]>([])

// 提取测试类型
const extractionType = computed(() => {
    return testData.value?.extractionType || 'entity'
})

// 加载测试数据
const loadTestData = async () => {
    isLoading.value = true

    try {
        // 获取测试数据
        const id = route.params.id
        const test = await getTest(id.toString())
        testData.value = test

        // 加载标注数据
        await loadAnnotation()
    } catch (error) {
        console.error('加载测试数据失败:', error)
        ElMessage.error('加载测试数据失败')
        testData.value = null
    } finally {
        isLoading.value = false
    }
}

// 加载标注数据
const loadAnnotation = async () => {
    if (!testData.value || !testData.value.id) return;

    try {
        const testId = testData.value.id;
        const existingAnnotation = await getTestAnnotation(testId);
        annotation.value = existingAnnotation;

        if (existingAnnotation && existingAnnotation.data) {
            // 设置实体/属性/三元组数据
            if (testData.value.extractionType === 'entity') {
                entities.value = existingAnnotation.data.entities || [];
            } else if (testData.value.extractionType === 'attribute') {
                attributes.value = existingAnnotation.data.attributes || [];
            } else {
                triples.value = existingAnnotation.data.triples || [];
            }
        }
    } catch (error) {
        console.error('加载标注数据失败:', error);
        // 如果加载失败，不影响用户继续操作
    }
}

// 保存标注
const saveAnnotation = async () => {
    if (isSaving.value) return
    isSaving.value = true

    try {
        // 根据标注类型，准备标注数据
        const annotationData = {}

        // 根据标注类型，设置标注数据
        if (extractionType.value === 'entity') {
            if (entities.value.length === 0) {
                ElMessage.warning('请先标注实体')
                isSaving.value = false
                return
            }
            annotationData.entities = entities.value
        } else if (extractionType.value === 'attribute') {
            if (attributes.value.length === 0) {
                ElMessage.warning('请先标注属性')
                isSaving.value = false
                return
            }
            annotationData.attributes = attributes.value
        } else {
            if (triples.value.length === 0) {
                ElMessage.warning('请先标注三元组')
                isSaving.value = false
                return
            }
            annotationData.triples = triples.value
        }

        // 获取当前测试ID
        const testId = testData.value?.id

        if (!testId) {
            ElMessage.error('测试ID不存在')
            isSaving.value = false
            return
        }

        // 创建或更新标注
        if (annotation.value) {
            await updateTestAnnotation(testId, annotationData)
        } else {
            await createTestAnnotation(testId, annotationData)
        }

        ElMessage.success('保存成功')

        // 重新加载标注数据，避免递归更新问题
        await loadAnnotation()
    } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('保存失败')
    } finally {
        isSaving.value = false
    }
}

// 完成标注并返回
const completeAnnotation = async () => {
    // 验证是否有标注数据
    if (
        (extractionType.value === 'entity' && entities.value.length === 0) ||
        (extractionType.value === 'attribute' && attributes.value.length === 0) ||
        (extractionType.value === 'relationship' && triples.value.length === 0)
    ) {
        ElMessageBox.confirm('当前没有标注数据，确定要完成标注吗?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            router.push('/')
        }).catch(() => { })
        return
    }

    // 保存并返回
    try {
        await saveAnnotation()
        router.push('/')
    } catch (error) {
        // 错误处理已在 saveAnnotation 中完成
    }
}

// 获取当前标注类型的说明
const annotationTypeDescription = computed(() => {
    switch (extractionType.value) {
        case 'entity':
            return '在当前页面，您需要标注实体。选择文本，然后选择实体类别，点击添加实体按钮完成标注。'
        case 'attribute':
            return '在当前页面，您需要标注属性。选择文本，然后选择属性类别，点击添加属性按钮完成标注。'
        case 'relationship':
            return '在当前页面，您需要标注三元组关系。依次选择主体、谓语和客体，完成标注。'
        default:
            return ''
    }
})

// 获取标注类型图标
const annotationTypeIcon = computed(() => {
    switch (extractionType.value) {
        case 'entity':
            return Collection
        case 'attribute':
            return Filter
        case 'relationship':
            return Connection
        default:
            return Document
    }
})

// 页面加载时获取数据
onMounted(() => {
    loadTestData()
})
</script>

<template>
    <div class="annotate-view">
        <div class="container mx-auto py-8 px-6 max-w-6xl">
            <!-- 页面标题 -->
            <div class="flex justify-between items-center mb-8">
                <div class="flex items-center">
                    <div
                        class="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mr-5 shadow-md">
                        <el-icon class="text-white text-2xl">
                            <Edit />
                        </el-icon>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-800">标注测试</h1>
                        <p v-if="testData" class="text-gray-500 text-sm mt-1">{{ testData.name }}</p>
                    </div>
                </div>
                <div class="flex gap-3">
                    <el-button @click="router.push('/')" class="flex items-center" type="default">
                        <el-icon class="mr-1">
                            <ArrowLeft />
                        </el-icon>
                        返回列表
                    </el-button>
                    <el-button type="primary" @click="saveAnnotation" :loading="isSaving" class="flex items-center">
                        <el-icon class="mr-1">
                            <Select />
                        </el-icon>
                        保存
                    </el-button>
                    <el-button type="success" @click="completeAnnotation" :loading="isSaving" class="flex items-center">
                        <el-icon class="mr-1">
                            <Check />
                        </el-icon>
                        完成标注
                    </el-button>
                </div>
            </div>

            <!-- 加载状态 -->
            <div v-if="isLoading" class="flex justify-center items-center py-20">
                <el-skeleton :rows="10" animated />
            </div>

            <!-- 标注内容 -->
            <div v-else-if="testData" class="annotation-content">
                <!-- 操作指南 -->
                <div class="guide-card p-6 mb-8 rounded-xl border border-blue-100">
                    <div class="flex items-center mb-4">
                        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <el-icon class="text-blue-600 text-lg">
                                <component :is="annotationTypeIcon" />
                            </el-icon>
                        </div>
                        <h3 class="text-lg font-bold text-blue-800">{{ extractionType === 'entity' ? '实体标注' :
                            extractionType === 'attribute' ? '属性标注' : '关系标注' }}</h3>
                    </div>

                    <div class="mb-4 flex items-start">
                        <el-icon class="mr-2 mt-1 text-blue-500 flex-shrink-0">
                            <InfoFilled />
                        </el-icon>
                        <p class="text-sm text-gray-700">{{ annotationTypeDescription }}</p>
                    </div>

                    <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div v-if="extractionType === 'entity'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-start">
                                <div
                                    class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center mr-2 font-bold">
                                    1</div>
                                <div>在文本中选中需要标注的实体</div>
                            </div>
                            <div class="flex items-start">
                                <div
                                    class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center mr-2 font-bold">
                                    2</div>
                                <div>选择实体类别</div>
                            </div>
                            <div class="flex items-start">
                                <div
                                    class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center mr-2 font-bold">
                                    3</div>
                                <div>点击"添加实体"按钮</div>
                            </div>
                            <div class="flex items-start">
                                <div
                                    class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center mr-2 font-bold">
                                    4</div>
                                <div>完成标注后点击"保存"或"完成标注"</div>
                            </div>
                        </div>

                        <div v-else-if="extractionType === 'attribute'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-start">
                                <div
                                    class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center mr-2 font-bold">
                                    1</div>
                                <div>在文本中选中需要标注的属性</div>
                            </div>
                            <div class="flex items-start">
                                <div
                                    class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center mr-2 font-bold">
                                    2</div>
                                <div>选择属性类别</div>
                            </div>
                            <div class="flex items-start">
                                <div
                                    class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center mr-2 font-bold">
                                    3</div>
                                <div>点击"添加属性"按钮</div>
                            </div>
                            <div class="flex items-start">
                                <div
                                    class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center mr-2 font-bold">
                                    4</div>
                                <div>完成标注后点击"保存"或"完成标注"</div>
                            </div>
                        </div>

                        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-start">
                                <div
                                    class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center mr-2 font-bold">
                                    1</div>
                                <div>在文本中选中三元组的主体、谓语或客体</div>
                            </div>
                            <div class="flex items-start">
                                <div
                                    class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center mr-2 font-bold">
                                    2</div>
                                <div>点击对应的"添加为主体"、"添加为谓语"或"添加为客体"按钮</div>
                            </div>
                            <div class="flex items-start">
                                <div
                                    class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center mr-2 font-bold">
                                    3</div>
                                <div>重复上述步骤完成三元组标注</div>
                            </div>
                            <div class="flex items-start">
                                <div
                                    class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center mr-2 font-bold">
                                    4</div>
                                <div>完成标注后点击"保存"或"完成标注"</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 实体标注组件 -->
                <EntityAnnotator v-if="extractionType === 'entity'" :content="testData.text" :entities="entities"
                    @update:entities="newEntities => entities = newEntities" />

                <!-- 属性标注组件 -->
                <AttributeAnnotator v-else-if="extractionType === 'attribute'" :content="testData.text"
                    :attributes="attributes" @update:attributes="newAttributes => attributes = newAttributes" />

                <!-- 三元组标注组件 -->
                <TripleAnnotator v-else :content="testData.text" :triples="triples"
                    @update:triples="newTriples => triples = newTriples" />
            </div>

            <!-- 错误状态 -->
            <div v-else class="py-10 text-center">
                <p class="text-xl text-gray-500">数据加载失败，请重试</p>
                <el-button class="mt-4" type="primary" @click="loadTestData">重新加载</el-button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.annotate-view {
    min-height: calc(100vh - 60px);
    background-color: #f0f4f8;
    background-image:
        linear-gradient(135deg, rgba(235, 244, 255, 0.8) 0%, rgba(240, 249, 255, 0.8) 100%);
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

:deep(.el-button--success) {
    background-color: #10b981;
    border-color: #10b981;
}

:deep(.el-button--success:hover) {
    background-color: #059669;
    border-color: #059669;
    box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.3);
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

.guide-card {
    background-color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.guide-card:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>