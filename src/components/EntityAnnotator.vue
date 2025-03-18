<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import type { Entity } from '../types'

// 导入Element Plus图标
import { Collection, Delete, Plus, Edit, Check, SemiSelect, Tickets, InfoFilled } from '@element-plus/icons-vue'

// 组件属性
const props = defineProps<{
    content: string // 文本内容
    entities: Entity[] // 实体列表
    readonly?: boolean // 是否只读模式
}>()

// 事件
const emit = defineEmits<{
    'update:entities': [entities: Entity[]]
}>()

// 本地状态
const localEntities = ref<Entity[]>([])
const selectedText = ref('')
const highlightedText = ref<HTMLElement | null>(null)
const entityCategory = ref('')

// 初始化本地状态
watch(() => props.entities, (newEntities) => {
    localEntities.value = JSON.parse(JSON.stringify(newEntities))
}, { immediate: true })

// 监听实体变化，触发更新事件
watch(localEntities, (newEntities) => {
    emit('update:entities', newEntities)
}, { deep: true })

// 用于展示的文本（带有高亮标记）
const highlightedContent = computed(() => {
    let content = props.content

    // 创建带高亮的HTML
    localEntities.value.forEach(entity => {
        const textToHighlight = entity.name
        // 使用简单的替换，在实际应用中可能需要更复杂的逻辑来处理重叠
        content = content.replace(
            new RegExp(textToHighlight, 'g'),
            `<span class="entity-highlight entity-type-${entity.category.toLowerCase()}" data-entity-id="${entity.id}">${textToHighlight}</span>`
        )
    })

    return content
})

// 处理文本选择
const handleTextSelect = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const text = range.toString().trim()

    if (text) {
        selectedText.value = text
    }
}

// 添加实体
const addEntity = () => {
    if (!selectedText.value) {
        ElMessage.warning('请先选择文本')
        return
    }

    if (!entityCategory.value) {
        ElMessage.warning('请选择实体类别')
        return
    }

    // 检查是否已存在相同的实体
    const entityExists = localEntities.value.some(
        entity => entity.name === selectedText.value && entity.category === entityCategory.value
    )

    if (entityExists) {
        ElMessage.warning('该实体已存在')
        return
    }

    // 创建新实体
    const newEntity: Entity = {
        id: uuidv4(),
        name: selectedText.value,
        category: entityCategory.value,
        isPositive: true
    }

    // 添加到实体列表
    localEntities.value = [...localEntities.value, newEntity]

    // 清空选择和类别
    selectedText.value = ''
    entityCategory.value = ''

    ElMessage.success('实体添加成功')
}

// 删除实体
const removeEntity = (entityId: string) => {
    localEntities.value = localEntities.value.filter(entity => entity.id !== entityId)
    ElMessage.success('实体已删除')
}

// 清空所有实体
const clearEntities = () => {
    localEntities.value = []
    ElMessage.success('已清空所有实体')
}

// 导出为逗号分隔的实体列表
const exportAsText = computed(() => {
    return localEntities.value.map(entity => entity.name).join(',')
})

// 获取实体类别对应的颜色
const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
        '人物': 'blue',
        '组织': 'orange',
        '地点': 'green',
        '时间': 'purple',
        '事件': 'red',
        '产品': 'cyan',
        '概念': 'pink',
        '其他': 'gray'
    }

    return categoryColors[category] || 'blue'
}

// 实体分类计数
const categoryCounts = computed(() => {
    const counts: Record<string, number> = {}

    localEntities.value.forEach(entity => {
        counts[entity.category] = (counts[entity.category] || 0) + 1
    })

    return counts
})
</script>

<template>
    <div class="entity-annotator">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- 左侧：文本内容 -->
            <div class="md:col-span-2">
                <div class="text-content bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                    <div class="flex items-center mb-3">
                        <el-icon class="text-blue-500 mr-2">
                            <Collection />
                        </el-icon>
                        <h3 class="text-lg font-bold">文本内容</h3>
                    </div>
                    <div ref="highlightedText"
                        class="content-display whitespace-pre-wrap p-3 bg-gray-50 rounded-md border border-gray-100"
                        v-html="highlightedContent" @mouseup="handleTextSelect"></div>
                </div>
            </div>

            <!-- 右侧：标注操作 -->
            <div>
                <div class="annotation-panel bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                    <div class="flex items-center mb-3">
                        <el-icon class="text-blue-500 mr-2">
                            <SemiSelect />
                        </el-icon>
                        <h3 class="text-lg font-bold">实体标注</h3>
                    </div>

                    <template v-if="!readonly">
                        <!-- 实体添加表单 -->
                        <el-card class="entity-form-card mb-4" :body-style="{ padding: '16px' }">
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">选中文本</label>
                                <el-input v-model="selectedText" placeholder="请从左侧选择文本">
                                    <template #prefix>
                                        <el-icon>
                                            <Tickets />
                                        </el-icon>
                                    </template>
                                </el-input>
                            </div>

                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">实体类别</label>
                                <el-select v-model="entityCategory" placeholder="请选择实体类别" class="w-full">
                                    <template #prefix>
                                        <el-icon>
                                            <Tag />
                                        </el-icon>
                                    </template>
                                    <el-option label="人物" value="人物" />
                                    <el-option label="组织" value="组织" />
                                    <el-option label="地点" value="地点" />
                                    <el-option label="时间" value="时间" />
                                    <el-option label="事件" value="事件" />
                                    <el-option label="产品" value="产品" />
                                    <el-option label="概念" value="概念" />
                                    <el-option label="其他" value="其他" />
                                </el-select>
                            </div>

                            <div class="mt-3">
                                <el-button type="primary" @click="addEntity" class="w-full">
                                    <el-icon class="mr-1">
                                        <Plus />
                                    </el-icon>添加实体
                                </el-button>
                            </div>
                        </el-card>
                    </template>

                    <!-- 实体分类统计 -->
                    <div class="mb-4 bg-blue-50 rounded-lg p-3 border border-blue-100" v-if="localEntities.length > 0">
                        <div class="flex items-center mb-2">
                            <el-icon class="text-blue-500 mr-1">
                                <InfoFilled />
                            </el-icon>
                            <span class="text-sm font-medium text-blue-800">实体统计</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div v-for="(count, category) in categoryCounts" :key="category"
                                class="flex items-center bg-white rounded-md p-2 shadow-sm">
                                <div class="w-3 h-3 rounded-full mr-2"
                                    :style="{ backgroundColor: `var(--el-color-${getCategoryColor(category)})` }"></div>
                                <span class="text-xs">{{ category }}: {{ count }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 已标注实体列表 -->
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <div class="flex items-center">
                                <el-icon class="text-green-500 mr-1">
                                    <Check />
                                </el-icon>
                                <h4 class="text-md font-medium">已标注实体</h4>
                            </div>
                            <el-button v-if="!readonly && localEntities.length > 0" type="danger" size="small"
                                @click="clearEntities">
                                <el-icon>
                                    <Delete />
                                </el-icon>清空
                            </el-button>
                        </div>

                        <div class="entity-list space-y-2 max-h-[300px] overflow-y-auto px-1">
                            <div v-for="entity in localEntities" :key="entity.id"
                                class="entity-item flex justify-between items-center p-2 bg-gray-50 hover:bg-gray-100 transition-colors rounded-md border border-gray-100">
                                <div class="flex items-center">
                                    <div class="w-2 h-full rounded-l-md mr-2"
                                        :style="{ backgroundColor: `var(--el-color-${getCategoryColor(entity.category)})` }">
                                    </div>
                                    <span class="mr-2 font-medium">{{ entity.name }}</span>
                                    <el-tag size="small" :type="getCategoryColor(entity.category)">{{ entity.category
                                        }}</el-tag>
                                </div>
                                <el-button v-if="!readonly" type="danger" size="small" circle
                                    @click="removeEntity(entity.id)">
                                    <el-icon>
                                        <Delete />
                                    </el-icon>
                                </el-button>
                            </div>

                            <div v-if="localEntities.length === 0" class="text-center text-gray-400 py-4">
                                暂无实体
                            </div>
                        </div>
                    </div>

                    <!-- 导出结果 -->
                    <div class="mt-4">
                        <div class="flex items-center mb-2">
                            <el-icon class="text-blue-500 mr-1">
                                <Edit />
                            </el-icon>
                            <h4 class="text-md font-medium">实体列表（逗号分隔）</h4>
                        </div>
                        <el-input type="textarea" v-model="exportAsText" readonly :rows="3" placeholder="暂无实体" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.entity-annotator {
    font-family: system-ui, -apple-system, sans-serif;
}

.content-container::selection,
.content-container *::selection {
    background-color: rgba(59, 130, 246, 0.3);
}

.entity-highlight {
    display: inline;
    position: relative;
    z-index: 1;
    cursor: pointer;
}

.popover-menu {
    position: absolute;
    transform: translateX(-50%);
    z-index: 9999;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
}

.content-display {
    line-height: 1.6;
    font-size: 1rem;
    position: relative;
    z-index: 1;
    transition: all 0.3s ease;
}

.content-display:hover {
    background-color: rgba(249, 250, 251, 1);
}

:deep(.entity-type-人物) {
    background-color: rgba(59, 130, 246, 0.3);
    padding: 0 2px;
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    z-index: 1;
}

:deep(.entity-type-组织) {
    background-color: rgba(245, 158, 11, 0.3);
    padding: 0 2px;
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    z-index: 1;
}

:deep(.entity-type-地点) {
    background-color: rgba(16, 185, 129, 0.3);
    padding: 0 2px;
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    z-index: 1;
}

:deep(.entity-type-时间) {
    background-color: rgba(168, 85, 247, 0.3);
    padding: 0 2px;
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    z-index: 1;
}

:deep(.entity-type-事件) {
    background-color: rgba(239, 68, 68, 0.3);
    padding: 0 2px;
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    z-index: 1;
}

:deep(.entity-type-产品) {
    background-color: rgba(6, 182, 212, 0.3);
    padding: 0 2px;
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    z-index: 1;
}

:deep(.entity-type-概念) {
    background-color: rgba(236, 72, 153, 0.3);
    padding: 0 2px;
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    z-index: 1;
}

:deep(.entity-type-其他) {
    background-color: rgba(156, 163, 175, 0.3);
    padding: 0 2px;
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    z-index: 1;
}

.entity-form-card {
    border-radius: 8px;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.entity-form-card:hover {
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
}

.entity-item {
    transition: all 0.2s ease;
}

.entity-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

:deep(.el-button) {
    transition: all 0.3s;
}

:deep(.el-button:hover) {
    transform: translateY(-1px);
}

:deep(.el-tag) {
    transition: all 0.3s;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
    box-shadow: 0 0 0 1px rgba(209, 213, 219, 0.5);
    transition: all 0.3s;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.5);
}

:deep(.el-input__wrapper:focus-within),
:deep(.el-textarea__inner:focus-within) {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}
</style>