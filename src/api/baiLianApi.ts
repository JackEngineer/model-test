import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import type { Entity, Attribute, Triple, Model } from "../types";

// 阿里云百炼API接口参数
interface BaiLianApiConfig {
  accessKeyId: string; // 阿里云AccessKey ID
  accessKeySecret: string; // 阿里云AccessKey Secret
  endpoint: string; // API端点，默认为 'https://bailian.aliyuncs.com'
  modelId: string; // 模型ID，例如 'qwen2.5-72b-instruct'
}

// 全局API配置
let apiConfig: BaiLianApiConfig | null = null;
// 缓存的模型列表
let modelCache: Model[] = [];

// 设置API配置
export function setBaiLianApiConfig(config: BaiLianApiConfig): void {
  apiConfig = config;
  // 配置更改时，清空模型缓存
  modelCache = [];
}

// 获取当前API配置
export function getBaiLianApiConfig(): BaiLianApiConfig | null {
  return apiConfig;
}

// 生成签名（简化版，实际使用需根据阿里云API要求实现完整签名）
function generateSignature(params: any, accessKeySecret: string): string {
  // 实际实现应该参照阿里云API文档进行完整的签名过程
  // 这里是简化示例
  const timestamp = new Date().toISOString();
  const nonce = Math.random().toString(36).substring(2, 15);

  // 实际应用中，这里应该按照阿里云的签名算法生成签名
  return `${timestamp}.${nonce}`;
}

// 基础API调用函数
async function callBaiLianApi(prompt: string, options?: any) {
  if (!apiConfig) {
    throw new Error("百炼API未配置，请先调用setBaiLianApiConfig设置API配置");
  }

  try {
    const { accessKeyId, accessKeySecret, endpoint, modelId } = apiConfig;

    // 构造请求参数
    const params = {
      model: modelId,
      input: {
        messages: [{ role: "user", content: prompt }],
      },
      parameters: {
        temperature: 0.7,
        top_p: 0.8,
        ...options,
      },
    };

    // 请求头信息
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessKeyId}:${generateSignature(
        params,
        accessKeySecret
      )}`,
    };

    // 发送请求
    const response = await axios.post(`${endpoint}/api/v1/generation`, params, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error("百炼API调用失败:", error);
    throw error;
  }
}

// 构建实体抽取提示模板
function buildEntityExtractionPrompt(text: string): string {
  return `
请从以下文本中抽取所有实体，并按照要求分类。

文本：${text}

要求：
1. 抽取所有实体，包括人物、组织、地点、时间、产品等
2. 对于每个实体，给出实体名称和实体类别
3. 以JSON格式返回，格式为：
{
  "entities": [
    {"name": "实体名称", "category": "实体类别"},
    ...
  ]
}
4. 仅返回JSON数据，不要有其他文字说明
`;
}

// 构建属性抽取提示模板
function buildAttributeExtractionPrompt(text: string): string {
  return `
请从以下文本中抽取所有属性，并按照要求分类。

文本：${text}

要求：
1. 抽取所有属性，包括品牌、规格、材质、颜色、尺寸、价格、特性等
2. 对于每个属性，给出属性名称和属性类别
3. 以JSON格式返回，格式为：
{
  "attributes": [
    {"name": "属性名称", "category": "属性类别"},
    ...
  ]
}
4. 仅返回JSON数据，不要有其他文字说明
`;
}

// 构建关系抽取提示模板
function buildRelationshipExtractionPrompt(text: string): string {
  return `
请从以下文本中抽取所有三元组关系，并按照要求返回。

文本：${text}

要求：
1. 抽取所有主体-关系-客体的三元组
2. 三元组中的主体和客体是实体，关系是连接它们的谓词
3. 以JSON格式返回，格式为：
{
  "triples": [
    {"subject": "主体", "predicate": "关系", "object": "客体"},
    ...
  ]
}
4. 仅返回JSON数据，不要有其他文字说明
`;
}

// 实体抽取函数
export async function extractEntities(text: string): Promise<Entity[]> {
  const prompt = buildEntityExtractionPrompt(text);
  const response = await callBaiLianApi(prompt);

  try {
    // 从响应中提取AI生成的内容
    const content = response.output.choices[0].message.content;

    // 尝试解析JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : "{}";
    const result = JSON.parse(jsonContent);

    // 处理并返回实体数据
    if (result.entities && Array.isArray(result.entities)) {
      return result.entities.map((entity: any) => ({
        id: uuidv4(),
        name: entity.name,
        category: entity.category,
        confidence: 0.95, // 百炼API可能没有提供置信度，使用默认值
        isPositive: true,
        evaluation: "pending", // 初始状态为待评估
      }));
    }

    return [];
  } catch (error) {
    console.error("解析实体抽取结果失败:", error);
    return [];
  }
}

// 属性抽取函数
export async function extractAttributes(text: string): Promise<Attribute[]> {
  const prompt = buildAttributeExtractionPrompt(text);
  const response = await callBaiLianApi(prompt);

  try {
    // 从响应中提取AI生成的内容
    const content = response.output.choices[0].message.content;

    // 尝试解析JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : "{}";
    const result = JSON.parse(jsonContent);

    // 处理并返回属性数据
    if (result.attributes && Array.isArray(result.attributes)) {
      return result.attributes.map((attribute: any) => ({
        id: uuidv4(),
        name: attribute.name,
        category: attribute.category,
        confidence: 0.95, // 百炼API可能没有提供置信度，使用默认值
        isPositive: true,
        evaluation: "pending", // 初始状态为待评估
      }));
    }

    return [];
  } catch (error) {
    console.error("解析属性抽取结果失败:", error);
    return [];
  }
}

// 关系抽取函数
export async function extractRelationships(text: string): Promise<Triple[]> {
  const prompt = buildRelationshipExtractionPrompt(text);
  const response = await callBaiLianApi(prompt);

  try {
    // 从响应中提取AI生成的内容
    const content = response.output.choices[0].message.content;

    // 尝试解析JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : "{}";
    const result = JSON.parse(jsonContent);

    // 处理并返回关系数据
    if (result.triples && Array.isArray(result.triples)) {
      return result.triples.map((triple: any) => ({
        id: uuidv4(),
        subject: triple.subject,
        predicate: triple.predicate,
        object: triple.object,
        confidence: 0.95, // 百炼API可能没有提供置信度，使用默认值
        isPositive: true,
        evaluation: "pending", // 初始状态为待评估
      }));
    }

    return [];
  } catch (error) {
    console.error("解析关系抽取结果失败:", error);
    return [];
  }
}

// 获取模型列表
export async function getBaiLianModels(): Promise<Model[]> {
  // 如果有缓存且API配置未变，直接返回缓存
  if (modelCache.length > 0) {
    return modelCache;
  }

  // 如果没有配置API，返回空数组
  if (!apiConfig || !apiConfig.accessKeyId || !apiConfig.accessKeySecret) {
    console.log("API未配置，无法获取模型列表");
    return [];
  }

  try {
    // 模拟API调用，获取模型列表
    // 在实际项目中，这里应该调用阿里云百炼API的模型列表接口

    // 创建一个等待短暂延迟的Promise，模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 预设一些常用模型作为示例，确保下拉列表有数据
    const defaultModels: Model[] = [
      {
        id: apiConfig.modelId || "qwen-2.5-72b-instruct",
        name: "通义千问2.5-72B",
        apiEndpoint: apiConfig.endpoint,
        createdAt: Date.now(),
      },
      {
        id: "qwen-2.0-32b-instruct",
        name: "通义千问2.0-32B",
        apiEndpoint: apiConfig.endpoint,
        createdAt: Date.now(),
      },
      {
        id: "qwen-2.0-7b-instruct",
        name: "通义千问2.0-7B",
        apiEndpoint: apiConfig.endpoint,
        createdAt: Date.now(),
      },
      {
        id: "llama-3-70b-instruct",
        name: "Llama-3-70B",
        apiEndpoint: apiConfig.endpoint,
        createdAt: Date.now(),
      },
      {
        id: "baichuan-3-192k",
        name: "百川3-192K",
        apiEndpoint: apiConfig.endpoint,
        createdAt: Date.now(),
      },
    ];

    console.log("成功获取模型列表:", defaultModels.length, "个模型");

    // 缓存结果
    modelCache = defaultModels;
    return defaultModels;
  } catch (error) {
    console.error("获取模型列表失败:", error);
    return [];
  }
}
