<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useElementBounding } from '@vueuse/core'
import { ElMessage, ElPopover } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import type { Triple, RelationLabelFormat } from '../types'

// 导入Element Plus图标
import { Delete, Edit, Check, Close, Collection, Connection, DataLine, User, Cpu, Plus } from '@element-plus/icons-vue'

// 组件属性
const props = defineProps<{
    content: string // 待标注的文本内容
    triples: Triple[] // 已标注的三元组
    labelConfig?: string // 关系标签配置，JSON字符串格式
    readonly?: boolean // 是否只读模式
}>()

// 解析标签配置
const relationConfig = computed<RelationLabelFormat>(() => {
    try {
        if (props.labelConfig) {
            return JSON.parse(props.labelConfig || '{}')
        }
        return {}
    } catch (e) {
        console.error('解析关系标签配置失败', e)
        return {}
    }
})

// 获取所有实体类型
const entityTypes = computed(() => {
    return Object.keys(relationConfig.value)
})

// 获取所有关系类型
const relationTypes = computed(() => {
    const result: string[] = []
    Object.values(relationConfig.value).forEach(relations => {
        relations.forEach(relation => {
            if (!result.includes(relation)) {
                result.push(relation)
            }
        })
    })
    return result
})

// 事件
const emit = defineEmits<{
    'update:triples': [triples: Triple[]]
}>()

// 当前选中文本状态
const selection = reactive({
    text: '',
    start: 0,
    end: 0,
    active: false
})

// 标注容器和弹出菜单位置
const container = ref<HTMLElement | null>(null)
const popoverVisible = ref(false)
const popoverPos = reactive({
    x: 0,
    y: 0
})

// 当前编辑的三元组
const currentTriple = ref<{
    id: string;
    subject: string;
    predicate: string;
    object: string;
    completed?: boolean;
}>({
    id: '',
    subject: '',
    predicate: '',
    object: '',
    completed: false
})

// 编辑模式标志
const isEditMode = ref(false)
const editIndex = ref(-1)

// 获取容器元素的边界
const { x: containerX, y: containerY } = useElementBounding(container)

// 本地状态
const localTriples = ref<Triple[]>([])
const selectedText = ref('')
const highlightedText = ref<HTMLElement | null>(null)

// 初始化本地状态
watch(() => props.triples, (newTriples) => {
    if (JSON.stringify(localTriples.value) !== JSON.stringify(newTriples)) {
        localTriples.value = JSON.parse(JSON.stringify(newTriples))
    }
}, { immediate: true })

// 用于展示的文本（带有高亮标记）
const highlightedContent = computed(() => {
    let content = props.content

    // 创建带高亮的HTML
    localTriples.value.forEach(triple => {
        // 高亮主语
        const subjectToHighlight = triple.subject
        content = content.replace(
            new RegExp(`(\\b|\\s)${escapeRegExp(subjectToHighlight)}(\\b|\\s)`, 'g'),
            `$1<span class="subject-highlight" data-triple-id="${triple.id}">${subjectToHighlight}</span>$2`
        )

        // 高亮谓语
        const predicateToHighlight = triple.predicate
        content = content.replace(
            new RegExp(`(\\b|\\s)${escapeRegExp(predicateToHighlight)}(\\b|\\s)`, 'g'),
            `$1<span class="predicate-highlight" data-triple-id="${triple.id}">${predicateToHighlight}</span>$2`
        )

        // 高亮客体
        const objectToHighlight = triple.object
        content = content.replace(
            new RegExp(`(\\b|\\s)${escapeRegExp(objectToHighlight)}(\\b|\\s)`, 'g'),
            `$1<span class="object-highlight" data-triple-id="${triple.id}">${objectToHighlight}</span>$2`
        )
    })

    // 高亮当前正在标注的三元组
    if (!currentTriple.value.completed) {
        if (currentTriple.value.subject) {
            content = content.replace(
                new RegExp(`(\\b|\\s)${escapeRegExp(currentTriple.value.subject)}(\\b|\\s)`, 'g'),
                `$1<span class="current-subject-highlight">${currentTriple.value.subject}</span>$2`
            )
        }

        if (currentTriple.value.predicate) {
            content = content.replace(
                new RegExp(`(\\b|\\s)${escapeRegExp(currentTriple.value.predicate)}(\\b|\\s)`, 'g'),
                `$1<span class="current-predicate-highlight">${currentTriple.value.predicate}</span>$2`
            )
        }

        if (currentTriple.value.object) {
            content = content.replace(
                new RegExp(`(\\b|\\s)${escapeRegExp(currentTriple.value.object)}(\\b|\\s)`, 'g'),
                `$1<span class="current-object-highlight">${currentTriple.value.object}</span>$2`
            )
        }
    }

    return content
})

// 处理文本选择
const handleTextSelect = () => {
    const sel = window.getSelection()

    if (!sel || sel.rangeCount === 0 || !container.value) {
        popoverVisible.value = false
        return
    }

    const range = sel.getRangeAt(0)

    // 确保选择在容器内
    if (!container.value.contains(range.commonAncestorContainer)) {
        popoverVisible.value = false
        return
    }

    // 获取选择文本
    const text = range.toString().trim()

    if (text.length === 0) {
        popoverVisible.value = false
        return
    }

    // 计算选择的位置
    const bounds = range.getBoundingClientRect()
    popoverPos.x = bounds.left + bounds.width / 2 - containerX.value
    popoverPos.y = bounds.bottom - containerY.value + 5

    // 更新选择状态
    selection.text = text
    selection.active = true

    // 显示弹出菜单
    popoverVisible.value = true
}

// 转义正则表达式特殊字符
function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 添加选中文本为实体
const addEntity = (field: 'subject' | 'predicate' | 'object') => {
    if (!selection.text) return

    // 复制当前三元组数据，避免直接修改响应式对象导致数据丢失
    const updatedTriple = { ...currentTriple.value }
    updatedTriple[field] = selection.text

    // 更新当前三元组
    currentTriple.value = updatedTriple

    // 重置选择状态
    selection.text = ''
    popoverVisible.value = false

    // 自动聚焦下一个空字段的输入框
    nextTick(() => {
        const emptyFields = ['subject', 'predicate', 'object'].filter(
            f => !currentTriple.value[f as 'subject' | 'predicate' | 'object']
        ) as ('subject' | 'predicate' | 'object')[]

        if (emptyFields.length > 0) {
            const nextField = emptyFields[0]
            const inputEl = document.getElementById(`triple-${nextField}`)
            if (inputEl) {
                inputEl.focus()
            }
        }
    })
}

// 添加三元组到列表
const addTriple = () => {
    console.log('当前三元组数据:', currentTriple.value);

    // 检查所有字段是否填写
    if (!currentTriple.value.subject || currentTriple.value.subject.trim() === '') {
        ElMessage.warning('请填写主体字段');
        return;
    }

    if (!currentTriple.value.predicate || currentTriple.value.predicate.trim() === '') {
        ElMessage.warning('请填写谓语字段');
        return;
    }

    if (!currentTriple.value.object || currentTriple.value.object.trim() === '') {
        ElMessage.warning('请填写客体字段');
        return;
    }

    // 复制一个新的三元组对象
    const triple: Triple = {
        id: uuidv4(),
        subject: currentTriple.value.subject.trim(),
        predicate: currentTriple.value.predicate.trim(),
        object: currentTriple.value.object.trim(),
        isPositive: true
    }

    // 添加到三元组列表
    const updatedTriples = [...localTriples.value, triple]
    localTriples.value = updatedTriples
    emit('update:triples', updatedTriples)

    // 重置当前三元组
    resetTripleForm()
    ElMessage.success('三元组添加成功')
}

// 编辑已有三元组
const editTriple = (index: number) => {
    // 设置编辑模式
    isEditMode.value = true
    editIndex.value = index

    // 设置当前三元组为选中的三元组数据
    const triple = localTriples.value[index]
    currentTriple.value = {
        id: triple.id,
        subject: triple.subject,
        predicate: triple.predicate,
        object: triple.object
    }
}

// 更新三元组
const updateTriple = () => {
    console.log('更新三元组:', currentTriple.value);

    // 检查所有字段是否填写
    if (!currentTriple.value.subject || currentTriple.value.subject.trim() === '') {
        ElMessage.warning('请填写主体字段');
        return;
    }

    if (!currentTriple.value.predicate || currentTriple.value.predicate.trim() === '') {
        ElMessage.warning('请填写谓语字段');
        return;
    }

    if (!currentTriple.value.object || currentTriple.value.object.trim() === '') {
        ElMessage.warning('请填写客体字段');
        return;
    }

    if (isEditMode.value && editIndex.value !== -1) {
        // 创建更新后的三元组对象
        const updatedTriple: Triple = {
            id: currentTriple.value.id || uuidv4(),
            subject: currentTriple.value.subject.trim(),
            predicate: currentTriple.value.predicate.trim(),
            object: currentTriple.value.object.trim(),
            isPositive: localTriples.value[editIndex.value].isPositive
        }

        // 更新三元组列表
        const updatedTriples = [...localTriples.value]
        updatedTriples[editIndex.value] = updatedTriple
        localTriples.value = updatedTriples
        emit('update:triples', updatedTriples)

        // 重置状态
        resetTripleForm()
        isEditMode.value = false
        editIndex.value = -1
        ElMessage.success('三元组更新成功')
    } else {
        addTriple()
    }
}

// 取消编辑
const cancelEdit = () => {
    resetTripleForm()
    isEditMode.value = false
    editIndex.value = -1
}

// 重置三元组表单
const resetTripleForm = () => {
    currentTriple.value = {
        id: '',
        subject: '',
        predicate: '',
        object: '',
        completed: false
    }
}

// 获取当前可选的谓语列表
const availablePredicates = computed(() => {
    if (!currentTriple.value.subject || !relationConfig.value) return []

    // 在支持的实体类型中查找匹配的谓语
    for (const entityType in relationConfig.value) {
        if (entityType.toLowerCase() === currentTriple.value.subject.toLowerCase()) {
            return relationConfig.value[entityType] || []
        }
    }

    return []
})

// 标注状态统计
const stats = computed(() => {
    return {
        total: localTriples.value.length
    }
})

// 监听文档的mouseup事件以处理文本选择
onMounted(() => {
    document.addEventListener('mouseup', handleTextSelect)

    // 清理事件监听
    return () => {
        document.removeEventListener('mouseup', handleTextSelect)
    }
})

// 删除三元组
const deleteTriple = (index: number) => {
    const updatedTriples = [...localTriples.value]
    updatedTriples.splice(index, 1)
    localTriples.value = updatedTriples
    emit('update:triples', updatedTriples)
}

// 添加主体并设置关系
const addSubjectWithRelation = (predicate: string) => {
    if (!selection.text) return

    // 更新当前三元组
    currentTriple.value = {
        id: '',
        subject: selection.text,
        predicate: predicate,
        object: ''
    }

    // 重置选择状态
    selection.text = ''
    popoverVisible.value = false

    // 自动聚焦客体输入框
    nextTick(() => {
        const inputEl = document.getElementById('triple-object')
        if (inputEl) {
            inputEl.focus()
        }
    })
}

// 获取显示的三元组数量及关系类型统计
const tripleStats = computed(() => {
    if (localTriples.value.length === 0) return []

    const stats: Record<string, number> = {}
    localTriples.value.forEach(triple => {
        stats[triple.predicate] = (stats[triple.predicate] || 0) + 1
    })

    return Object.entries(stats).map(([name, count]) => ({
        name,
        count
    }))
})
</script>

<template>
    <div class="triple-annotator">
        <div class="flex flex-col lg:flex-row gap-6">
            <!-- 文本内容显示区域 -->
            <div class="w-full lg:w-1/2">
                <div class="text-content-section bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                    <div class="flex items-center mb-3">
                        <el-icon class="text-blue-600 mr-2">
                            <Collection />
                        </el-icon>
                        <h3 class="text-lg font-bold">文本内容</h3>
                    </div>
                    <div ref="container"
                        class="content-container p-4 bg-gray-50 border border-gray-200 rounded-md shadow-sm overflow-auto"
                        style="min-height: 300px; max-height: 500px; position: relative;">
                        <div class="content-text whitespace-pre-wrap">{{ content }}</div>

                        <!-- 文本选择弹出菜单 -->
                        <el-popover v-model:visible="popoverVisible" :trigger="'manual' as any" placement="bottom"
                            :teleported="false" :width="140" :show-arrow="false" virtual-triggering>
                            <div class="popover-menu" style="position: absolute;"
                                :style="{ left: `${popoverPos.x}px`, top: `${popoverPos.y}px` }">
                                <div class="p-1 flex flex-col gap-1">
                                    <div class="mb-2 bg-gray-50 rounded-md p-2 text-center">
                                        <span class="text-sm font-medium text-gray-600">已选择: {{ selection.text.length >
                                            10 ? selection.text.substring(0, 10) + '...' : selection.text }}</span>
                                    </div>
                                    <p class="text-sm text-gray-500 mb-1 font-medium">添加选中文本为:</p>
                                    <el-button size="small" @click="addEntity('subject')" type="primary" plain>
                                        <el-icon class="mr-1">
                                            <User />
                                        </el-icon>添加为主体
                                    </el-button>
                                    <el-button size="small" @click="addEntity('predicate')" type="warning" plain>
                                        <el-icon class="mr-1">
                                            <Connection />
                                        </el-icon>添加为谓语
                                    </el-button>
                                    <el-button size="small" @click="addEntity('object')" type="success" plain>
                                        <el-icon class="mr-1">
                                            <Cpu />
                                        </el-icon>添加为客体
                                    </el-button>

                                    <!-- 关系标签菜单 -->
                                    <template v-if="relationTypes.length > 0">
                                        <div class="border-t border-gray-200 my-1 pt-1">
                                            <p class="text-sm text-gray-500 mb-1 font-medium">添加为主体并设置关系:</p>
                                            <div class="grid grid-cols-1 gap-1">
                                                <el-button v-for="relation in relationTypes" :key="relation"
                                                    size="small" @click="addSubjectWithRelation(relation)" type="info"
                                                    plain>
                                                    <el-icon class="mr-1">
                                                        <Connection />
                                                    </el-icon>{{ relation }}
                                                </el-button>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </el-popover>
                    </div>

                    <!-- 文本内容的说明 -->
                    <div class="flex flex-wrap gap-2 mt-3 justify-center">
                        <div class="flex items-center bg-white px-3 py-1.5 rounded-full border text-sm">
                            <span class="inline-block w-3 h-3 rounded-full bg-blue-400 mr-1.5"></span>
                            <span class="text-gray-600">主体</span>
                        </div>
                        <div class="flex items-center bg-white px-3 py-1.5 rounded-full border text-sm">
                            <span class="inline-block w-3 h-3 rounded-full bg-orange-400 mr-1.5"></span>
                            <span class="text-gray-600">谓语</span>
                        </div>
                        <div class="flex items-center bg-white px-3 py-1.5 rounded-full border text-sm">
                            <span class="inline-block w-3 h-3 rounded-full bg-green-400 mr-1.5"></span>
                            <span class="text-gray-600">客体</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 三元组标注区域 -->
            <div class="w-full lg:w-1/2">
                <div class="triple-section bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center">
                            <el-icon class="text-blue-600 mr-2">
                                <DataLine />
                            </el-icon>
                            <h3 class="text-lg font-bold">三元组标注</h3>
                        </div>
                        <div class="bg-blue-50 px-3 py-1 rounded-full text-blue-700 font-medium text-sm">
                            已标注: {{ stats.total }} 个三元组
                        </div>
                    </div>

                    <!-- 关系标注统计 -->
                    <div class="relation-stats mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200"
                        v-if="tripleStats.length > 0">
                        <div class="flex items-center mb-2">
                            <el-icon class="text-blue-600 mr-1">
                                <Connection />
                            </el-icon>
                            <span class="text-sm font-medium text-gray-700">关系分布</span>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <div v-for="stat in tripleStats" :key="stat.name"
                                class="flex items-center bg-white rounded-md p-2 shadow-sm">
                                <div class="w-2 h-full rounded-l-md mr-2 bg-orange-400"></div>
                                <span class="text-xs text-gray-600 truncate">{{ stat.name }}: {{ stat.count }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 三元组编辑表单 -->
                    <el-card class="triple-form-card mb-4" :body-style="{ padding: '16px' }">
                        <div class="triple-form">
                            <div class="mb-2 pb-2 border-b border-gray-100">
                                <span class="text-sm font-medium text-gray-700">{{ isEditMode ? '编辑三元组' : '新建三元组'
                                }}</span>
                            </div>
                            <el-form label-position="top">
                                <div class="grid grid-cols-3 gap-4">
                                    <el-form-item label="主体">
                                        <el-input id="triple-subject" v-model="currentTriple.subject" placeholder="主体">
                                            <template #prefix>
                                                <el-icon class="text-blue-600">
                                                    <User />
                                                </el-icon>
                                            </template>
                                        </el-input>
                                    </el-form-item>
                                    <el-form-item label="谓语">
                                        <el-select v-if="relationTypes.length > 0" id="triple-predicate"
                                            v-model="currentTriple.predicate" placeholder="选择谓语" class="w-full">
                                            <template #prefix>
                                                <el-icon class="text-orange-500">
                                                    <Connection />
                                                </el-icon>
                                            </template>
                                            <el-option v-for="relation in relationTypes" :key="relation"
                                                :label="relation" :value="relation" />
                                        </el-select>
                                        <el-input v-else id="triple-predicate" v-model="currentTriple.predicate"
                                            placeholder="谓语">
                                            <template #prefix>
                                                <el-icon class="text-orange-500">
                                                    <Connection />
                                                </el-icon>
                                            </template>
                                        </el-input>
                                    </el-form-item>
                                    <el-form-item label="客体">
                                        <el-input id="triple-object" v-model="currentTriple.object" placeholder="客体">
                                            <template #prefix>
                                                <el-icon class="text-green-600">
                                                    <Cpu />
                                                </el-icon>
                                            </template>
                                        </el-input>
                                    </el-form-item>
                                </div>

                                <div class="flex justify-end gap-2 mt-3">
                                    <el-button v-if="isEditMode" @click="cancelEdit" plain>
                                        <el-icon class="mr-1">
                                            <Close />
                                        </el-icon>取消
                                    </el-button>
                                    <el-button type="primary" @click="updateTriple">
                                        <el-icon class="mr-1">
                                            <component :is="isEditMode ? Check : Plus" />
                                        </el-icon>
                                        {{ isEditMode ? '更新' : '添加三元组' }}
                                    </el-button>
                                </div>
                            </el-form>
                        </div>
                    </el-card>

                    <!-- 已标注三元组列表 -->
                    <div class="triples-list">
                        <div class="flex items-center mb-3">
                            <el-icon class="text-blue-600 mr-1">
                                <Collection />
                            </el-icon>
                            <span class="text-sm font-medium">已标注三元组</span>
                        </div>

                        <div v-if="localTriples.length === 0"
                            class="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                            <el-icon class="text-gray-400 mb-2" :size="40">
                                <Collection />
                            </el-icon>
                            <div class="text-gray-500">暂无标注数据，请从文本中选择内容进行标注</div>
                        </div>

                        <el-table v-else :data="localTriples" border style="width: 100%" row-key="id"
                            :header-cell-style="{ backgroundColor: '#f5f7fa', color: '#606266', fontWeight: 'bold' }"
                            :row-class-name="() => 'triple-table-row'" class="triple-table">
                            <el-table-column label="主体" prop="subject" min-width="100" show-overflow-tooltip>
                                <template #default="{ row }">
                                    <div class="flex items-center">
                                        <div class="w-1 h-4 bg-blue-500 rounded-sm mr-2"></div>
                                        <span class="text-gray-800">{{ row.subject }}</span>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="谓语" prop="predicate" min-width="100" show-overflow-tooltip>
                                <template #default="{ row }">
                                    <div class="flex items-center">
                                        <div class="w-1 h-4 bg-orange-500 rounded-sm mr-2"></div>
                                        <span class="text-gray-800">{{ row.predicate }}</span>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="客体" prop="object" min-width="100" show-overflow-tooltip>
                                <template #default="{ row }">
                                    <div class="flex items-center">
                                        <div class="w-1 h-4 bg-green-500 rounded-sm mr-2"></div>
                                        <span class="text-gray-800">{{ row.object }}</span>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="120" fixed="right">
                                <template #default="{ row, $index }">
                                    <div class="flex gap-2 justify-center">
                                        <el-button size="small" type="primary" @click="editTriple($index)">
                                            <el-icon>
                                                <Edit />
                                            </el-icon>
                                        </el-button>
                                        <el-button size="small" type="danger" @click="deleteTriple($index)">
                                            <el-icon>
                                                <Delete />
                                            </el-icon>
                                        </el-button>
                                    </div>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.triple-annotator {
    font-family: system-ui, -apple-system, sans-serif;
}

.content-container::selection,
.content-container *::selection {
    background-color: rgba(59, 130, 246, 0.3);
}

.popover-menu {
    position: absolute;
    transform: translateX(-50%);
    z-index: 9999;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
}

.content-text {
    line-height: 1.6;
    font-size: 1rem;
    position: relative;
    z-index: 1;
    letter-spacing: 0.01em;
    color: #2c3e50;
}

:deep(.subject-highlight) {
    background-color: rgba(59, 130, 246, 0.3);
    padding: 0 2px;
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    z-index: 1;
    border-bottom: 1px solid rgba(59, 130, 246, 0.5);
}

:deep(.predicate-highlight) {
    background-color: rgba(245, 158, 11, 0.3);
    padding: 0 2px;
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    z-index: 1;
    border-bottom: 1px solid rgba(245, 158, 11, 0.5);
}

:deep(.object-highlight) {
    background-color: rgba(16, 185, 129, 0.3);
    padding: 0 2px;
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    z-index: 1;
    border-bottom: 1px solid rgba(16, 185, 129, 0.5);
}

:deep(.current-subject-highlight) {
    background-color: rgba(59, 130, 246, 0.5);
    padding: 0 2px;
    border-radius: 2px;
    cursor: pointer;
    font-weight: bold;
    position: relative;
    z-index: 1;
    border-bottom: 1px solid rgba(59, 130, 246, 0.8);
}

:deep(.current-predicate-highlight) {
    background-color: rgba(245, 158, 11, 0.5);
    padding: 0 2px;
    border-radius: 2px;
    cursor: pointer;
    font-weight: bold;
    position: relative;
    z-index: 1;
    border-bottom: 1px solid rgba(245, 158, 11, 0.8);
}

:deep(.current-object-highlight) {
    background-color: rgba(16, 185, 129, 0.5);
    padding: 0 2px;
    border-radius: 2px;
    cursor: pointer;
    font-weight: bold;
    position: relative;
    z-index: 1;
    border-bottom: 1px solid rgba(16, 185, 129, 0.8);
}

.triple-form-card {
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.triple-form-card:hover {
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.content-container {
    transition: all 0.3s ease;
}

.content-container:hover {
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.08);
}

.triple-table :deep(.el-table__row) {
    transition: all 0.2s;
}

.triple-table :deep(.el-table__row:hover) {
    background-color: #f0f9ff !important;
}

:deep(.el-button) {
    transition: all 0.3s;
}

:deep(.el-button:hover) {
    transform: translateY(-1px);
}

:deep(.el-button--text:hover) {
    background-color: rgba(236, 246, 255, 0.9);
}

:deep(.triple-table-row) {
    border-bottom: 1px solid #f0f0f0;
}

:deep(.triple-table-row:hover td) {
    background-color: #f0f9ff !important;
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

:deep(.el-form-item__label) {
    font-weight: 500;
    color: #374151;
}

:deep(.el-table .cell) {
    padding: 8px 12px;
}

:deep(.el-table th.el-table__cell) {
    padding: 10px 0;
    font-size: 14px;
}

:deep(.el-table__fixed-right) {
    height: 100% !important;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
}
</style>