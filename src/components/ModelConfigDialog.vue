<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getBaiLianApiConfig } from '../api/baiLianApi';
import { saveApiConfig, getApiConfig } from '../api';

// 定义配置类型
interface ApiConfig {
    accessKeyId: string;
    accessKeySecret: string;
    endpoint: string;
    modelId: string;
}

const props = defineProps<{
    visible: boolean
}>();

const emit = defineEmits(['update:visible', 'save']);

// 表单数据
const formData = ref<ApiConfig>({
    accessKeyId: '',
    accessKeySecret: '',
    endpoint: 'https://bailian.aliyuncs.com',
    modelId: 'qwen-2.5-72b-instruct'
});

// 表单校验规则
const rules = {
    accessKeyId: [{ required: true, message: '请输入AccessKey ID', trigger: 'blur' }],
    accessKeySecret: [{ required: false, message: '请输入AccessKey Secret', trigger: 'blur' }],
    endpoint: [{ required: true, message: '请输入API端点', trigger: 'blur' }],
    modelId: [{ required: true, message: '请输入模型ID', trigger: 'blur' }]
};

// 是否正在加载
const isLoading = ref(false);
const isSaving = ref(false);

// 表单引用
const formRef = ref();

// 加载函数
const loadConfig = async () => {
    isLoading.value = true;
    try {
        const config = await getApiConfig();
        if (config && typeof config === 'object' && 'accessKeyId' in config) {
            formData.value = {
                accessKeyId: config.accessKeyId || '',
                accessKeySecret: config.accessKeySecret || '',
                endpoint: config.endpoint || 'https://bailian.aliyuncs.com',
                modelId: config.modelId || 'qwen-2.5-72b-instruct'
            };
        }
    } catch (error) {
        console.error('加载配置失败', error);
        ElMessage.error('加载配置失败');
    } finally {
        isLoading.value = false;
    }
};

// 保存函数
const handleSave = async () => {
    // 表单验证
    if (!formData.value.accessKeyId) {
        ElMessage.warning('请输入 Access Key ID');
        return;
    }
    if (!formData.value.endpoint) {
        ElMessage.warning('请输入 Endpoint');
        return;
    }
    if (!formData.value.modelId) {
        ElMessage.warning('请选择默认模型');
        return;
    }

    isSaving.value = true;
    try {
        console.log('正在保存API配置...');
        const result = await saveApiConfig(formData.value);

        if (result) {
            console.log('API配置保存成功');
            ElMessage.success('API配置已保存');
            emit('save');
            emit('update:visible', false);
        } else {
            console.warn('API配置保存结果为空');
            ElMessage.warning('API配置可能未正确保存，请检查配置后重试');
        }
    } catch (error) {
        console.error('保存配置失败', error);
        ElMessage.error('保存配置失败，请检查参数是否正确');
    } finally {
        isSaving.value = false;
    }
};

// 取消函数
const handleCancel = () => {
    emit('update:visible', false);
};

// 弹窗打开时加载配置
watch(() => props.visible, (newVal) => {
    if (newVal) {
        loadConfig();
    }
});

// 组件挂载时
onMounted(() => {
    loadConfig();
});
</script>

<template>
    <el-dialog title="阿里云百炼API配置" :model-value="visible"
        @update:model-value="(val: boolean) => emit('update:visible', val)" width="500px">
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="140px" label-position="left">
            <el-form-item label="AccessKey ID" prop="accessKeyId">
                <el-input v-model="formData.accessKeyId" placeholder="请输入阿里云AccessKey ID" />
            </el-form-item>

            <el-form-item label="AccessKey Secret" prop="accessKeySecret">
                <el-input v-model="formData.accessKeySecret" placeholder="请输入阿里云AccessKey Secret（可选）" type="password"
                    show-password />
                <div class="text-xs text-gray-400 mt-1">此项为可选，可留空</div>
            </el-form-item>

            <el-form-item label="API端点" prop="endpoint">
                <el-input v-model="formData.endpoint" placeholder="请输入API端点URL" />
            </el-form-item>

            <el-form-item label="模型ID" prop="modelId">
                <el-select v-model="formData.modelId" placeholder="请选择模型" style="width: 100%">
                    <el-option label="通义千问2.5-72B (qwen-2.5-72b-instruct)" value="qwen-2.5-72b-instruct" />
                    <el-option label="通义千问2.0-32B (qwen-2.0-32b-instruct)" value="qwen-2.0-32b-instruct" />
                    <el-option label="通义千问2.0-7B (qwen-2.0-7b-instruct)" value="qwen-2.0-7b-instruct" />
                    <el-option label="Llama 3-70B (llama-3-70b-instruct)" value="llama-3-70b-instruct" />
                    <el-option label="百川3 (baichuan-3-192k)" value="baichuan-3-192k" />
                </el-select>
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleCancel">取消</el-button>
                <el-button type="primary" @click="handleSave" :loading="isSaving">保存</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<style scoped>
.dialog-footer {
    padding-top: 20px;
    text-align: right;
}
</style>