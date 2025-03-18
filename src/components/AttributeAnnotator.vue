<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import type { Attribute } from '../types'

// 导入Element Plus图标
import { CollectionTag, Delete, Plus, Edit, Check, InfoFilled, Document, Tickets } from '@element-plus/icons-vue'

// 组件属性
const props = defineProps<{
    content: string // 文本内容
    attributes: Attribute[] // 属性列表
    readonly?: boolean // 是否只读模式
}>()

// 事件
const emit = defineEmits<{
    'update:attributes': [attributes: Attribute[]]
}>()

// 本地状态
const localAttributes = ref<Attribute[]>([])
const selectedText = ref('')
const highlightedText = ref<HTMLElement | null>(null)
const attributeCategory = ref('')

// 初始化本地状态
watch(() => props.attributes, (newAttributes) => {
    localAttributes.value = JSON.parse(JSON.stringify(newAttributes))
}, { immediate: true })

// 监听属性变化，触发更新事件
watch(localAttributes, (newAttributes) => {
    emit('update:attributes', newAttributes)
}, { deep: true })

// 用于展示的文本（带有高亮标记）
const highlightedContent = computed(() => {
    let content = props.content

    // 创建带高亮的HTML
    localAttributes.value.forEach(attribute => {
        const textToHighlight = attribute.name
        // 使用简单的替换，在实际应用中可能需要更复杂的逻辑来处理重叠
        content = content.replace(
            new RegExp(textToHighlight, 'g'),
            `<span class="attribute-highlight attribute-type-${attribute.category.toLowerCase()}" data-attribute-id="${attribute.id}">${textToHighlight}</span>`
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

// 添加属性
const addAttribute = () => {
    if (!selectedText.value) {
        ElMessage.warning('请先选择文本')
        return
    }

    if (!attributeCategory.value) {
        ElMessage.warning('请选择属性类别')
        return
    }

    // 检查是否已存在相同的属性
    const attributeExists = localAttributes.value.some(
        attribute => attribute.name === selectedText.value && attribute.category === attributeCategory.value
    )

    if (attributeExists) {
        ElMessage.warning('该属性已存在')
        return
    }

    // 创建新属性
    const newAttribute: Attribute = {
        id: uuidv4(),
        name: selectedText.value,
        category: attributeCategory.value,
        isPositive: true
    }

    // 添加到属性列表
    localAttributes.value = [...localAttributes.value, newAttribute]

    // 清空选择和类别
    selectedText.value = ''
    attributeCategory.value = ''

    ElMessage.success('属性添加成功')
}

// 删除属性
const removeAttribute = (attributeId: string) => {
    localAttributes.value = localAttributes.value.filter(attribute => attribute.id !== attributeId)
    ElMessage.success('属性已删除')
}

// 清空所有属性
const clearAttributes = () => {
    localAttributes.value = []
    ElMessage.success('已清空所有属性')
}

// 导出为逗号分隔的属性列表
const exportAsText = computed(() => {
    return localAttributes.value.map(attribute => attribute.name).join(',')
})

// 获取属性类别对应的颜色
const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
        '品牌': 'blue',
        '规格': 'orange',
        '材质': 'green',
        '颜色': 'purple',
        '尺寸': 'red',
        '价格': 'cyan',
        '特性': 'pink',
        '其他': 'gray'
    }

    return categoryColors[category] || 'blue'
}

// 属性分类计数
const categoryCounts = computed(() => {
    const counts: Record<string, number> = {}

    localAttributes.value.forEach(attribute => {
        counts[attribute.category] = (counts[attribute.category] || 0) + 1
    })

    return counts
})
</script>

<template>
    <div class="attribute-annotator">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- 左侧：文本内容 -->
            <div class="md:col-span-2">
                <div class="text-content bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                    <div class="flex items-center mb-3">
                        <el-icon class="text-orange-500 mr-2">
                            <Document />
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
                        <el-icon class="text-orange-500 mr-2">
                            <CollectionTag />
                        </el-icon>
                        <h3 class="text-lg font-bold">属性标注</h3>
                    </div>

                    <template v-if="!readonly">
                        <!-- 属性添加表单 -->
                        <el-card class="attribute-form-card mb-4" :body-style="{ padding: '16px' }">
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
                                <label class="block text-sm font-medium text-gray-700 mb-1">属性类别</label>
                                <el-select v-model="attributeCategory" placeholder="请选择属性类别" class="w-full">
                                    <template #prefix>
                                        <el-icon>
                                            <Tag />
                                        </el-icon>
                                    </template>
                                    <el-option label="品牌" value="品牌" />
                                    <el-option label="规格" value="规格" />
                                    <el-option label="材质" value="材质" />
                                    <el-option label="颜色" value="颜色" />
                                    <el-option label="尺寸" value="尺寸" />
                                    <el-option label="价格" value="价格" />
                                    <el-option label="特性" value="特性" />
                                    <el-option label="其他" value="其他" />
                                </el-select>
                            </div>

                            <div class="mt-3">
                                <el-button type="primary" @click="addAttribute" class="w-full">
                                    <el-icon class="mr-1">
                                        <Plus />
                                    </el-icon>添加属性
                                </el-button>
                            </div>
                        </el-card>
                    </template>

                    <!-- 属性分类统计 -->
                    <div class="mb-4 bg-orange-50 rounded-lg p-3 border border-orange-100"
                        v-if="localAttributes.length > 0">
                        <div class="flex items-center mb-2">
                            <el-icon class="text-orange-500 mr-1">
                                <InfoFilled />
                            </el-icon>
                            <span class="text-sm font-medium text-orange-800">属性统计</span>
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

                    <!-- 已标注属性列表 -->
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <div class="flex items-center">
                                <el-icon class="text-green-500 mr-1">
                                    <Check />
                                </el-icon>
                                <h4 class="text-md font-medium">已标注属性</h4>
                            </div>
                            <el-button v-if="!readonly && localAttributes.length > 0" type="danger" size="small"
                                @click="clearAttributes">
                                <el-icon>
                                    <Delete />
                                </el-icon>清空
                            </el-button>
                        </div>

                        <div class="attribute-list space-y-2 max-h-[300px] overflow-y-auto px-1">
                            <div v-for="attribute in localAttributes" :key="attribute.id"
                                class="attribute-item flex justify-between items-center p-2 bg-gray-50 hover:bg-gray-100 transition-colors rounded-md border border-gray-100">
                                <div class="flex items-center">
                                    <div class="w-2 h-full rounded-l-md mr-2"
                                        :style="{ backgroundColor: `var(--el-color-${getCategoryColor(attribute.category)})` }">
                                    </div>
                                    <span class="mr-2 font-medium">{{ attribute.name }}</span>
                                    <el-tag size="small" :type="getCategoryColor(attribute.category)">{{
                                        attribute.category }}</el-tag>
                                </div>
                                <el-button v-if="!readonly" type="danger" size="small" circle
                                    @click="removeAttribute(attribute.id)">
                                    <el-icon>
                                        <Delete />
                                    </el-icon>
                                </el-button>
                            </div>

                            <div v-if="localAttributes.length === 0" class="text-center text-gray-400 py-4">
                                暂无属性
                            </div>
                        </div>
                    </div>

                    <!-- 导出结果 -->
                    <div class="mt-4">
                        <div class="flex items-center mb-2">
                            <el-icon class="text-orange-500 mr-1">
                                <Edit />
                            </el-icon>
                            <h4 class="text-md font-medium">属性列表（逗号分隔）</h4>
                        </div>
                        <el-input type="textarea" v-model="exportAsText" readonly :rows="3" placeholder="暂无属性" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.attribute-annotator {
    font-family: system-ui, -apple-system, sans-serif;
}

.content-container::selection,
.content-container *::selection {
    background-color: rgba(245, 158, 11, 0.3);
}

.attribute-highlight {
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

:deep(.attribute-highlight) {
    background-color: rgba(255, 158, 0, 0.3);
    padding: 0 2px;
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    z-index: 1;
}

:deep(.attribute-type-品牌) {
    background-color: rgba(59, 130, 246, 0.3);
}

:deep(.attribute-type-规格) {
    background-color: rgba(245, 158, 11, 0.3);
}

:deep(.attribute-type-材质) {
    background-color: rgba(16, 185, 129, 0.3);
}

:deep(.attribute-type-颜色) {
    background-color: rgba(168, 85, 247, 0.3);
}

:deep(.attribute-type-尺寸) {
    background-color: rgba(239, 68, 68, 0.3);
}

:deep(.attribute-type-价格) {
    background-color: rgba(6, 182, 212, 0.3);
}

:deep(.attribute-type-特性) {
    background-color: rgba(236, 72, 153, 0.3);
}

:deep(.attribute-type-其他) {
    background-color: rgba(156, 163, 175, 0.3);
}

.attribute-form-card {
    border-radius: 8px;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.attribute-form-card:hover {
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
}

.attribute-item {
    transition: all 0.2s ease;
}

.attribute-item:hover {
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
    box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.5);
}

:deep(.el-input__wrapper:focus-within),
:deep(.el-textarea__inner:focus-within) {
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
}
</style>