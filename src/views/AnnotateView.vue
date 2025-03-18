<script setup lang="ts">
import { ref, computed, onMounted, nextTick, shallowRef, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'

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
const annotation = shallowRef<any>(null)

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

// 加载标注数据 - 改进版本
const loadAnnotation = async () => {
    if (!testData.value || !testData.value.id) return;

    try {
        const testId = testData.value.id;
        // 获取标注数据
        const existingAnnotation = await getTestAnnotation(testId);
        if (existingAnnotation) {
            let entityData: Entity[] = [];
            let attributeData: Attribute[] = [];
            let tripleData: Triple[] = [];

            // 处理双重嵌套的data.data结构（API实际返回的格式）
            if (existingAnnotation.data && existingAnnotation.data.data) {
                console.log('检测到双重嵌套data.data结构');
                entityData = existingAnnotation.data.data.entities || [];
                attributeData = existingAnnotation.data.data.attributes || [];
                tripleData = existingAnnotation.data.data.triples || [];
            }
            // 处理单层data对象结构
            else if (existingAnnotation.data && typeof existingAnnotation.data === 'object') {
                entityData = existingAnnotation.data.entities || [];
                attributeData = existingAnnotation.data.attributes || [];
                tripleData = existingAnnotation.data.triples || [];
            }
            // 处理顶层数据结构
            else if (existingAnnotation.entities || existingAnnotation.attributes || existingAnnotation.triples) {
                entityData = existingAnnotation.entities || [];
                attributeData = existingAnnotation.attributes || [];
                tripleData = existingAnnotation.triples || [];
            }
            // 处理字符串格式的数据
            else if (typeof existingAnnotation.data === 'string') {
                try {
                    const parsedData = JSON.parse(existingAnnotation.data);
                    // 检查解析后的数据是否也有嵌套结构
                    if (parsedData.data && parsedData.data.entities) {
                        entityData = parsedData.data.entities || [];
                        attributeData = parsedData.data.attributes || [];
                        tripleData = parsedData.data.triples || [];
                    } else {
                        entityData = parsedData.entities || [];
                        attributeData = parsedData.attributes || [];
                        tripleData = parsedData.triples || [];
                    }
                } catch (e) {
                    console.error('解析JSON字符串标注数据失败:', e);
                }
            }

            console.log('提取的实体数据:', entityData);
            console.log('提取的属性数据:', attributeData);
            console.log('提取的三元组数据:', tripleData);

            // 根据当前提取类型设置相应的数据
            if (testData.value.extractionType === 'entity') {
                // 使用深拷贝避免引用问题，确保数据完全独立
                entities.value = JSON.parse(JSON.stringify(entityData));
                console.log('设置到entities的数据:', entities.value);
            } else if (testData.value.extractionType === 'attribute') {
                attributes.value = JSON.parse(JSON.stringify(attributeData));
            } else if (testData.value.extractionType === 'relationship') {
                triples.value = JSON.parse(JSON.stringify(tripleData));
            }

            // 最后设置完整annotation对象
            annotation.value = existingAnnotation;
        } else {
            // 无现有数据，重置为空
            console.log('无现有标注数据，初始化空数据');
            entities.value = [];
            attributes.value = [];
            triples.value = [];
            annotation.value = {
                testId,
                data: {
                    entities: [],
                    attributes: [],
                    triples: [],
                    relationships: []
                }
            };
        }
    } catch (error) {
        console.error('加载标注数据失败:', error);
        ElMessage.error('加载标注数据失败，已初始化为空数据');

        // 重置为空数据
        entities.value = [];
        attributes.value = [];
        triples.value = [];
        annotation.value = {
            testId: testData.value.id,
            data: {
                entities: [],
                attributes: [],
                triples: [],
                relationships: []
            }
        };
    }
}

// 保存标注 - 改进版本：修复数据回显问题
const saveAnnotation = async () => {
    if (isSaving.value) return false;
    isSaving.value = true;

    try {
        // 准备要保存的数据结构 - 确保数据格式一致
        const saveData = {
            entities: extractionType.value === 'entity' ? [...entities.value] : [],
            attributes: extractionType.value === 'attribute' ? [...attributes.value] : [],
            triples: extractionType.value === 'relationship' ? [...triples.value] : [],
            relationships: []
        };

        // 验证数据
        const isEmpty = (extractionType.value === 'entity' && saveData.entities.length === 0) ||
            (extractionType.value === 'attribute' && saveData.attributes.length === 0) ||
            (extractionType.value === 'relationship' && saveData.triples.length === 0);

        if (isEmpty) {
            const typeLabel = extractionType.value === 'entity' ? '实体' :
                extractionType.value === 'attribute' ? '属性' : '三元组';
            ElMessage.warning(`请先标注${typeLabel}`);
            isSaving.value = false;
            return false;
        }

        if (!testData.value?.id) {
            ElMessage.error('测试ID不存在');
            isSaving.value = false;
            return false;
        }

        // 执行保存操作 - 使用标准的API调用
        console.log('准备保存的数据:', saveData);
        const response = await createTestAnnotation(testData.value.id, saveData);
        console.log('保存成功，API返回:', response);

        ElMessage.success('标注保存成功');

        // 确保响应数据格式正确，并更新本地数据
        if (response) {
            // 完全替换annotation对象，避免部分更新
            annotation.value = response;

            // 根据响应更新对应标注数据
            // 特别注意实体数据的回显问题
            if (extractionType.value === 'entity') {
                // 提取实体数据，支持不同的数据结构
                let updatedEntities: Entity[] = [];

                // 处理双重嵌套结构 - 适应API返回格式
                if (response.data && response.data.data && response.data.data.entities) {
                    updatedEntities = response.data.data.entities;
                }
                // 处理单层data结构
                else if (response.data && response.data.entities) {
                    updatedEntities = response.data.entities;
                }
                // 处理顶层结构
                else if (response.entities) {
                    updatedEntities = response.entities;
                }

                // 使用深拷贝并确保entities被完全替换
                entities.value = JSON.parse(JSON.stringify(updatedEntities));
                console.log('更新后的实体数据:', entities.value);
            }
            else if (extractionType.value === 'attribute') {
                let updatedAttributes: Attribute[] = [];

                // 处理双重嵌套结构
                if (response.data && response.data.data && response.data.data.attributes) {
                    updatedAttributes = response.data.data.attributes;
                }
                // 处理单层结构
                else if (response.data && response.data.attributes) {
                    updatedAttributes = response.data.attributes;
                }
                // 处理顶层结构
                else if (response.attributes) {
                    updatedAttributes = response.attributes;
                }

                attributes.value = JSON.parse(JSON.stringify(updatedAttributes));
            }
            else if (extractionType.value === 'relationship') {
                let updatedTriples: Triple[] = [];

                // 处理双重嵌套结构
                if (response.data && response.data.data && response.data.data.triples) {
                    updatedTriples = response.data.data.triples;
                }
                // 处理单层结构
                else if (response.data && response.data.triples) {
                    updatedTriples = response.data.triples;
                }
                // 处理顶层结构
                else if (response.triples) {
                    updatedTriples = response.triples;
                }

                triples.value = JSON.parse(JSON.stringify(updatedTriples));
            }
        }

        isSaving.value = false;
        return true;
    } catch (error: any) {
        console.error('保存失败:', error);
        ElMessage.error('保存失败: ' + (error.message || '未知错误'));
        isSaving.value = false;
        return false;
    }
}

// 更新实体列表的处理函数 - 断开响应式连锁反应
const updateEntities = (newEntities: Entity[]) => {
    // 使用深拷贝确保断开引用
    entities.value = JSON.parse(JSON.stringify(newEntities));
}

// 更新属性列表的处理函数
const updateAttributes = (newAttributes: Attribute[]) => {
    // 使用深拷贝确保断开引用
    attributes.value = JSON.parse(JSON.stringify(newAttributes));
}

// 更新三元组列表的处理函数
const updateTriples = (newTriples: Triple[]) => {
    // 使用深拷贝确保断开引用
    triples.value = JSON.parse(JSON.stringify(newTriples));
}

// 完成标注并返回首页 - 完全分离保存和导航操作
const completeAnnotation = async () => {
    // 验证是否有标注数据
    const isEmpty = (
        (extractionType.value === 'entity' && entities.value.length === 0) ||
        (extractionType.value === 'attribute' && attributes.value.length === 0) ||
        (extractionType.value === 'relationship' && triples.value.length === 0)
    );

    if (isEmpty) {
        ElMessageBox.confirm('当前没有标注数据，确定要完成标注吗?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            // 直接返回首页，不尝试保存
            router.push('/');
        }).catch(() => {
            // 用户取消操作
        });
        return;
    }

    // 显示加载状态 - 使用ElLoading服务
    const loadingInstance = ElLoading.service({
        lock: true,
        text: '正在保存...',
        background: 'rgba(255, 255, 255, 0.7)'
    });

    try {
        // 尝试保存，注意这里使用await等待保存完成
        const saveResult = await saveAnnotation();

        // 关闭加载提示
        loadingInstance.close();

        if (saveResult) {
            // 保存成功后，使用延时导航避免同一事件循环中的状态更新冲突
            setTimeout(() => {
                router.push('/');
            }, 100);
        }
    } catch (error: any) {
        // 关闭加载提示
        loadingInstance.close();
        console.error('完成标注失败:', error);
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
                    @update:entities="updateEntities" />

                <!-- 属性标注组件 -->
                <AttributeAnnotator v-else-if="extractionType === 'attribute'" :content="testData.text"
                    :attributes="attributes" @update:attributes="updateAttributes" />

                <!-- 三元组标注组件 -->
                <TripleAnnotator v-else :content="testData.text" :triples="triples" @update:triples="updateTriples" />
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