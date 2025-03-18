<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getModels, addModel, updateModel, deleteModel } from '../api'
import type { Model } from '../api'

interface Props {
    visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['update:visible', 'save'])

// 表单数据
const formData = reactive({
    id: '',
    name: '',
    apiEndpoint: '',
    description: ''
})

// 表单校验规则
const rules = {
    name: [
        { required: true, message: '请输入模型名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    apiEndpoint: [
        { required: true, message: '请输入API端点', trigger: 'blur' },
        { pattern: /^https?:\/\/.+/, message: '请输入有效的URL', trigger: 'blur' }
    ]
}

const formRef = ref(null)
const loading = ref(false)
const models = ref<Model[]>([])
const editMode = ref(false)
const showManageMode = ref(false)

// 加载已有模型列表
const loadModels = async () => {
    try {
        models.value = await getModels()
    } catch (error) {
        console.error('加载模型列表失败:', error)
        ElMessage.error('加载模型列表失败')
    }
}

// 初始化
onMounted(() => {
    loadModels()
})

// 重置表单
const resetForm = () => {
    if (formRef.value) {
        // @ts-ignore
        formRef.value.resetFields()
    }
    formData.id = ''
    formData.name = ''
    formData.apiEndpoint = ''
    formData.description = ''
    editMode.value = false
}

// 切换到管理模式
const toggleManageMode = () => {
    showManageMode.value = !showManageMode.value
}

// 对话框标题
const dialogTitle = computed(() => {
    if (showManageMode.value) return '管理模型'
    return editMode.value ? '编辑模型' : '添加模型'
})

// 关闭对话框
const handleClose = () => {
    resetForm()
    showManageMode.value = false
    emit('update:visible', false)
}

// 编辑模型
const handleEdit = (model: Model) => {
    formData.id = model.id
    formData.name = model.name
    formData.apiEndpoint = model.apiEndpoint
    formData.description = model.description || ''
    editMode.value = true
    showManageMode.value = false
}

// 删除模型
const handleDelete = (model: Model) => {
    ElMessageBox.confirm(
        `确定要删除模型 "${model.name}" 吗？`,
        '删除确认',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(async () => {
        try {
            await deleteModel(model.id)
            ElMessage.success('模型删除成功')
            loadModels()
        } catch (error) {
            console.error('删除模型失败:', error)
            ElMessage.error('删除模型失败')
        }
    }).catch(() => {
        // 用户取消操作
    })
}

// 保存模型
const handleSave = async () => {
    if (!formRef.value) return

    // @ts-ignore
    await formRef.value.validate(async (valid: boolean) => {
        if (!valid) {
            ElMessage.warning('请完成表单必填项')
            return
        }

        loading.value = true
        try {
            if (editMode.value) {
                // 编辑现有模型
                await updateModel(formData.id, {
                    name: formData.name,
                    apiEndpoint: formData.apiEndpoint,
                    description: formData.description
                })
                ElMessage.success('模型更新成功')
            } else {
                // 创建新模型
                // 如果没有ID，生成一个唯一ID
                const modelData = {
                    id: formData.id || `model-${Date.now()}`,
                    name: formData.name,
                    apiEndpoint: formData.apiEndpoint,
                    description: formData.description
                }

                await addModel(modelData)
                ElMessage.success('模型添加成功')
            }

            // 重新加载模型列表
            await loadModels()
            emit('save')
            resetForm()
        } catch (error) {
            console.error('保存模型失败:', error)
            ElMessage.error('保存模型失败')
        } finally {
            loading.value = false
        }
    })
}
</script>

<template>
    <el-dialog :title="dialogTitle" v-model="props.visible" width="650px" @close="handleClose">
        <div v-if="!showManageMode">
            <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="left">
                <el-form-item label="模型名称" prop="name">
                    <el-input v-model="formData.name" placeholder="请输入模型名称，例如：GPT-4" />
                </el-form-item>

                <el-form-item label="API端点" prop="apiEndpoint">
                    <el-input v-model="formData.apiEndpoint"
                        placeholder="请输入API完整URL，例如：https://api.openai.com/v1/chat/completions" />
                </el-form-item>

                <el-form-item label="描述" prop="description">
                    <el-input v-model="formData.description" type="textarea" rows="3" placeholder="请输入模型描述信息" />
                </el-form-item>
            </el-form>

            <div class="mt-4 flex justify-between">
                <el-button @click="toggleManageMode">管理模型</el-button>
                <div>
                    <el-button @click="handleClose">取消</el-button>
                    <el-button type="primary" @click="handleSave" :loading="loading">
                        {{ editMode ? '更新模型' : '添加模型' }}
                    </el-button>
                </div>
            </div>
        </div>

        <div v-else class="manage-models">
            <el-table :data="models" style="width: 100%" border>
                <el-table-column prop="name" label="模型名称" min-width="120" />
                <el-table-column prop="apiEndpoint" label="API端点" min-width="200" show-overflow-tooltip />
                <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
                <el-table-column label="操作" width="150">
                    <template #default="scope">
                        <el-button type="primary" size="small" @click="handleEdit(scope.row)" plain>
                            编辑
                        </el-button>
                        <el-button type="danger" size="small" @click="handleDelete(scope.row)" plain>
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div v-if="models.length === 0" class="no-models">
                <el-empty description="暂无模型" />
            </div>

            <div class="mt-4 flex justify-between">
                <el-button type="primary" @click="toggleManageMode">
                    返回添加模型
                </el-button>
                <el-button @click="handleClose">关闭</el-button>
            </div>
        </div>
    </el-dialog>
</template>

<style scoped>
.manage-models {
    max-height: 500px;
    overflow-y: auto;
}

.no-models {
    padding: 30px 0;
    text-align: center;
}
</style>