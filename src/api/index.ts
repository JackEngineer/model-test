import { v4 as uuidv4 } from "uuid";
import apiClient from "./apiClient";
import type {
  Test,
  CreateTestDto,
  CreateModelDto,
  ModelTest,
  Triple,
  Entity,
  Attribute,
  Relationship,
} from "../types";

// 模拟后端数据缓存（作为后备）
let testsCache: Record<string, Test> = {};
let modelsCache: Record<string, any> = {};
let modelTestsCache: Record<string, ModelTest> = {};
let annotationsCache: Record<string, any> = {};

// 使用标志控制是否使用真实后端
let useRealBackend = true;

// 切换后端模式
export const toggleBackendMode = (useReal?: boolean) => {
  if (useReal !== undefined) {
    useRealBackend = useReal;
  } else {
    useRealBackend = !useRealBackend;
  }
  console.log(`已切换到${useRealBackend ? "真实后端" : "模拟数据"}模式`);
};

// 测试后端连接
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    await apiClient.get("/health");
    useRealBackend = true;
    return true;
  } catch (error: any) {
    console.error("后端连接失败，将使用模拟数据:", error);
    useRealBackend = false;
    return false;
  }
};

// 测试相关 API
export const getTests = async (): Promise<Test[]> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.get<Test[]>("/tests");
      return response.data;
    } catch (error) {
      console.error("获取测试列表失败，使用缓存数据:", error);
      return Object.values(testsCache).sort(
        (a, b) => b.createdAt - a.createdAt
      );
    }
  }

  // 使用模拟数据
  return Object.values(testsCache).sort((a, b) => b.createdAt - a.createdAt);
};

export const getTest = async (id: string): Promise<Test> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.get<Test>(`/tests/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取测试 ${id} 失败，使用缓存数据:`, error);
      const test = testsCache[id];
      if (!test) {
        throw new Error("Test not found");
      }
      return test;
    }
  }

  // 使用模拟数据
  const test = testsCache[id];
  if (!test) {
    throw new Error("Test not found");
  }
  return test;
};

export const createTest = async (data: CreateTestDto): Promise<Test> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.post<Test>("/tests", data);
      const test = response.data;
      // 更新缓存
      testsCache[test.id] = test;
      return test;
    } catch (error) {
      console.error("创建测试失败:", error);
      throw error;
    }
  }

  // 使用模拟数据
  const id = uuidv4();
  const test: Test = {
    id,
    ...data,
    createdAt: Date.now(),
  };
  testsCache[id] = test;
  return test;
};

export const updateTest = async (
  id: string,
  data: Partial<Test>
): Promise<Test> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.put<Test>(`/tests/${id}`, data);
      const test = response.data;
      // 更新缓存
      testsCache[id] = test;
      return test;
    } catch (error) {
      console.error(`更新测试 ${id} 失败:`, error);
      throw error;
    }
  }

  // 使用模拟数据
  const test = testsCache[id];
  if (!test) {
    throw new Error("Test not found");
  }
  const updatedTest = { ...test, ...data };
  testsCache[id] = updatedTest;
  return updatedTest;
};

export const deleteTest = async (id: string): Promise<void> => {
  if (useRealBackend) {
    try {
      await apiClient.delete(`/tests/${id}`);
      // 更新缓存
      delete testsCache[id];
    } catch (error) {
      console.error(`删除测试 ${id} 失败:`, error);
      throw error;
    }
  } else {
    // 使用模拟数据
    delete testsCache[id];
  }
};

// 模型相关接口
export interface Model {
  id: string;
  name: string;
  apiEndpoint: string;
  description?: string;
}

// 获取模型列表
export const getModels = async (): Promise<Model[]> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.get("/models");
      return response.data;
    } catch (error) {
      console.error("获取模型列表失败:", error);
      // 从本地存储获取模型列表作为备选
      const localModels = localStorage.getItem("models");
      return localModels ? JSON.parse(localModels) : [];
    }
  } else {
    // 从本地存储获取模型列表
    const localModels = localStorage.getItem("models");
    return localModels ? JSON.parse(localModels) : [];
  }
};

export const getModel = async (id: string): Promise<Model> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.get<Model>(`/models/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取模型 ${id} 失败:`, error);
      throw error;
    }
  }

  // 使用模拟数据
  const model = modelsCache[id];
  if (!model) {
    throw new Error("Model not found");
  }
  return model;
};

// 添加模型
export const addModel = async (model: Model): Promise<Model> => {
  // 确保模型有一个ID
  if (!model.id) {
    model.id = Date.now().toString();
  }

  if (useRealBackend) {
    try {
      const response = await apiClient.post("/models", model);
      return response.data;
    } catch (error) {
      console.error("添加模型失败:", error);
      // 保存到本地存储作为备选
      await saveModelToLocalStorage(model);
      return model;
    }
  } else {
    // 保存到本地存储
    await saveModelToLocalStorage(model);
    return model;
  }
};

// 更新模型
export const updateModel = async (
  id: string,
  model: Partial<Model>
): Promise<Model> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.put(`/models/${id}`, model);
      return response.data;
    } catch (error) {
      console.error("更新模型失败:", error);
      // 更新本地存储作为备选
      return updateModelInLocalStorage(id, model);
    }
  } else {
    // 更新本地存储
    return updateModelInLocalStorage(id, model);
  }
};

// 删除模型
export const deleteModel = async (id: string): Promise<boolean> => {
  if (useRealBackend) {
    try {
      await apiClient.delete(`/models/${id}`);
      return true;
    } catch (error) {
      console.error("删除模型失败:", error);
      // 从本地存储删除作为备选
      return deleteModelFromLocalStorage(id);
    }
  } else {
    // 从本地存储删除
    return deleteModelFromLocalStorage(id);
  }
};

// 辅助函数：保存模型到本地存储
const saveModelToLocalStorage = async (model: Model): Promise<Model> => {
  // 获取现有模型列表
  const models = await getModels();

  // 检查模型ID是否已存在
  const existingIndex = models.findIndex((m) => m.id === model.id);

  if (existingIndex >= 0) {
    // 更新现有模型
    models[existingIndex] = { ...models[existingIndex], ...model };
  } else {
    // 添加新模型
    models.push(model);
  }

  // 保存回本地存储
  localStorage.setItem("models", JSON.stringify(models));

  return model;
};

// 辅助函数：更新本地存储中的模型
const updateModelInLocalStorage = async (
  id: string,
  model: Partial<Model>
): Promise<Model> => {
  // 获取现有模型列表
  const models = await getModels();

  // 查找目标模型
  const existingIndex = models.findIndex((m) => m.id === id);

  if (existingIndex < 0) {
    throw new Error(`模型ID ${id} 不存在`);
  }

  // 更新模型
  models[existingIndex] = { ...models[existingIndex], ...model };

  // 保存回本地存储
  localStorage.setItem("models", JSON.stringify(models));

  return models[existingIndex];
};

// 辅助函数：从本地存储删除模型
const deleteModelFromLocalStorage = async (id: string): Promise<boolean> => {
  // 获取现有模型列表
  const models = await getModels();

  // 查找目标模型索引
  const existingIndex = models.findIndex((m) => m.id === id);

  if (existingIndex < 0) {
    return false; // 模型不存在
  }

  // 删除模型
  models.splice(existingIndex, 1);

  // 保存回本地存储
  localStorage.setItem("models", JSON.stringify(models));

  return true;
};

// 模型测试相关 API
export const getModelTests = async (): Promise<ModelTest[]> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.get<ModelTest[]>("/model-tests");
      return response.data;
    } catch (error) {
      console.error("获取模型测试列表失败，使用缓存数据:", error);
      return Object.values(modelTestsCache).sort(
        (a, b) => b.createdAt - a.createdAt
      );
    }
  }

  // 使用模拟数据
  return Object.values(modelTestsCache).sort(
    (a, b) => b.createdAt - a.createdAt
  );
};

export const getModelTest = async (id: string): Promise<ModelTest> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.get<ModelTest>(`/model-tests/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取模型测试 ${id} 失败，使用缓存数据:`, error);
      const modelTest = modelTestsCache[id];
      if (!modelTest) {
        throw new Error("Model test not found");
      }
      // 获取关联的测试和模型
      modelTest.test = testsCache[modelTest.testId];
      modelTest.model = modelsCache[modelTest.modelId];
      return modelTest;
    }
  }

  // 使用模拟数据
  const modelTest = modelTestsCache[id];
  if (!modelTest) {
    throw new Error("Model test not found");
  }
  // 获取关联的测试和模型
  modelTest.test = testsCache[modelTest.testId];
  modelTest.model = modelsCache[modelTest.modelId];
  return modelTest;
};

export const createModelTest = async (data: {
  testId: string;
  modelId: string;
}): Promise<ModelTest> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.post<ModelTest>("/model-tests", data);
      const modelTest = response.data;
      // 更新缓存
      modelTestsCache[modelTest.id] = modelTest;
      return modelTest;
    } catch (error) {
      console.error("创建模型测试失败:", error);
      throw error;
    }
  }

  // 使用模拟数据
  // 验证测试和模型存在
  if (!testsCache[data.testId]) {
    throw new Error("Test not found");
  }
  if (!modelsCache[data.modelId]) {
    throw new Error("Model not found");
  }

  const id = uuidv4();
  const modelTest: ModelTest = {
    id,
    testId: data.testId,
    modelId: data.modelId,
    test: testsCache[data.testId],
    model: modelsCache[data.modelId],
    createdAt: Date.now(),
    result: null,
    status: "pending",
  };
  modelTestsCache[id] = modelTest;

  // 异步处理
  processModelTest(id);

  return modelTest;
};

// 获取模型测试结果
export const getModelTestResult = async (id: string): Promise<ModelTest> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.get<ModelTest>(`/model-tests/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取模型测试结果 ${id} 失败，使用缓存数据:`, error);
      const modelTest = modelTestsCache[id];
      if (!modelTest) {
        throw new Error("Model test not found");
      }
      return modelTest;
    }
  }

  // 使用模拟数据
  const modelTest = modelTestsCache[id];
  if (!modelTest) {
    throw new Error("Model test not found");
  }
  return modelTest;
};

// 更新模型测试结果
export const updateModelTestResult = async (
  id: string,
  data: { result: any }
): Promise<ModelTest> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.put<ModelTest>(
        `/model-tests/${id}`,
        data
      );
      const modelTest = response.data;
      // 更新缓存
      modelTestsCache[id] = modelTest;
      return modelTest;
    } catch (error) {
      console.error(`更新模型测试结果 ${id} 失败:`, error);
      throw error;
    }
  }

  // 使用模拟数据
  const modelTest = modelTestsCache[id];
  if (!modelTest) {
    throw new Error("Model test not found");
  }
  const updatedModelTest = { ...modelTest, result: data.result };
  modelTestsCache[id] = updatedModelTest;
  return updatedModelTest;
};

// 测试标注相关 API
export const getTestAnnotation = async (testId: string): Promise<any> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.get<any>(`/annotations/${testId}`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        // 标注不存在，属于正常情况，返回空对象而不是null
        console.log(`测试 ${testId} 没有标注数据`);
        return {
          data: {
            entities: [],
            attributes: [],
            relationships: [],
            triples: [],
          },
        };
      }
      console.error(`获取测试标注 ${testId} 失败，使用缓存数据:`, error);
      // 在缓存中查找
      const annotation = Object.values(annotationsCache).find(
        (a: any) => a.testId === testId
      );
      if (!annotation) {
        // 返回空对象而不是null，保持一致的数据结构
        return {
          data: {
            entities: [],
            attributes: [],
            relationships: [],
            triples: [],
          },
        };
      }
      return annotation;
    }
  }

  // 使用模拟数据
  const annotation = Object.values(annotationsCache).find(
    (a: any) => a.testId === testId
  );
  if (!annotation) {
    // 返回空对象而不是null，保持一致的数据结构
    return {
      data: { entities: [], attributes: [], relationships: [], triples: [] },
    };
  }
  return annotation;
};

export const saveTestAnnotation = async (
  testId: string,
  data: any
): Promise<any> => {
  if (useRealBackend) {
    try {
      // 使用正确的API路径格式 - /:testId
      const response = await apiClient.post<any>(`/annotations/${testId}`, {
        data,
      });
      return response.data;
    } catch (error) {
      console.error(`保存测试标注 ${testId} 失败:`, error);
      throw error;
    }
  }

  // 使用模拟数据
  const annotationId = uuidv4();
  const annotation = {
    id: annotationId,
    testId,
    data,
    createdAt: Date.now(),
  };
  annotationsCache[annotationId] = annotation;
  return annotation;
};

// 创建测试标注
export const createTestAnnotation = async (
  testId: string,
  data: any
): Promise<any> => {
  // 使用saveTestAnnotation函数，确保一致性
  return saveTestAnnotation(testId, data);
};

// 更新测试标注
export const updateTestAnnotation = async (
  testId: string,
  data: any
): Promise<any> => {
  if (useRealBackend) {
    try {
      // 直接使用POST请求，与后端API匹配
      // 后端接口使用createOrUpdateAnnotation函数，通过POST /:testId实现
      const response = await apiClient.post<any>(
        `/annotations/${testId}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error(`更新测试标注 ${testId} 失败:`, error);
      throw error;
    }
  }

  // 使用模拟数据
  // 查找是否存在
  const existingAnnotation = Object.values(annotationsCache).find(
    (a: any) => a.testId === testId
  ) as any;

  if (existingAnnotation) {
    // 更新现有标注
    existingAnnotation.data = data;
    existingAnnotation.updatedAt = Date.now();
    return existingAnnotation;
  } else {
    // 不存在则创建新的
    return createTestAnnotation(testId, data);
  }
};

// 模拟模型处理测试
const processModelTest = async (id: string) => {
  const modelTest = modelTestsCache[id];
  if (!modelTest) return;

  try {
    // 获取测试和标注数据
    const test = testsCache[modelTest.testId];
    const annotation = Object.values(annotationsCache).find(
      (a: any) => a.testId === modelTest.testId
    );

    // 根据抽取类型处理不同的结果
    let result: any = {};

    if (test.extractionType === "entity") {
      // 模拟实体抽取
      const entities: any[] = [];

      // 从测试文本中随机提取一些词作为实体
      const words = test.text.split(/\s+/);
      const entityTypes = ["人物", "组织", "地点", "时间", "产品"];

      for (let i = 0; i < Math.min(5, words.length); i++) {
        const randomIndex = Math.floor(Math.random() * words.length);
        const randomType =
          entityTypes[Math.floor(Math.random() * entityTypes.length)];

        entities.push({
          id: uuidv4(),
          name: words[randomIndex],
          category: randomType,
          confidence: Math.random() * 0.5 + 0.5, // 0.5 - 1.0
          isPositive: true,
          evaluation: "pending",
        });
      }

      // 如果有标注数据，对结果进行评估
      if (annotation && annotation.data.entities) {
        const manualEntities = annotation.data.entities;

        // 评估每个抽取的实体
        entities.forEach((entity: any) => {
          // 检查是否与人工标注匹配
          const matchedEntity = manualEntities.find(
            (e: Entity) =>
              e.name === entity.name && e.category === entity.category
          );

          if (matchedEntity) {
            entity.evaluation = "correct";
          } else {
            entity.evaluation = "extra";
            entity.isPositive = false;
          }
        });
      }

      result = { entities };
    } else if (test.extractionType === "attribute") {
      // 模拟属性抽取
      const attributes: any[] = [];

      // 生成随机属性
      const attributeNames = ["颜色", "重量", "尺寸", "材质", "价格"];
      const attributeValues = ["红色", "5kg", "大型", "金属", "¥199"];
      const attributeTypes = ["基本属性", "外观属性", "物理属性", "商业属性"];

      for (let i = 0; i < 5; i++) {
        const nameIndex = Math.floor(Math.random() * attributeNames.length);
        const valueIndex = Math.floor(Math.random() * attributeValues.length);
        const typeIndex = Math.floor(Math.random() * attributeTypes.length);

        attributes.push({
          id: uuidv4(),
          name: attributeNames[nameIndex],
          value: attributeValues[valueIndex],
          category: attributeTypes[typeIndex],
          confidence: Math.random() * 0.5 + 0.5, // 0.5 - 1.0
          isPositive: true,
          evaluation: "pending",
        });
      }

      // 如果有标注数据，对结果进行评估
      if (annotation && annotation.data.attributes) {
        const manualAttributes = annotation.data.attributes;

        // 评估每个抽取的属性
        attributes.forEach((attribute: any) => {
          // 检查是否与人工标注匹配
          const matchedAttribute = manualAttributes.find(
            (a: Attribute) =>
              a.name === attribute.name && a.category === attribute.category
          );

          if (matchedAttribute) {
            attribute.evaluation = "correct";
          } else {
            attribute.evaluation = "extra";
            attribute.isPositive = false;
          }
        });
      }

      result = { attributes };
    } else {
      // 模拟关系抽取
      const triples: any[] = [];

      // 从测试文本中提取信息生成三元组
      const words = test.text.split(/\s+/);
      const predicates = ["属于", "包含", "位于", "生产", "拥有"];

      for (let i = 0; i < Math.min(3, Math.floor(words.length / 3)); i++) {
        const subjectIndex = Math.floor(Math.random() * words.length);
        const objectIndex = Math.floor(Math.random() * words.length);
        const predicateIndex = Math.floor(Math.random() * predicates.length);

        if (subjectIndex !== objectIndex) {
          triples.push({
            id: uuidv4(),
            subject: words[subjectIndex],
            predicate: predicates[predicateIndex],
            object: words[objectIndex],
            confidence: Math.random() * 0.5 + 0.5, // 0.5 - 1.0
            isPositive: true,
            evaluation: "pending",
          });
        }
      }

      // 如果有标注数据，对结果进行评估
      if (annotation && annotation.data.triples) {
        const manualTriples = annotation.data.triples;

        // 评估每个抽取的三元组
        triples.forEach((triple: any) => {
          // 检查是否与人工标注匹配
          const matchedTriple = manualTriples.find(
            (t: Triple) =>
              t.subject === triple.subject &&
              t.predicate === triple.predicate &&
              t.object === triple.object
          );

          if (matchedTriple) {
            triple.evaluation = "correct";
          } else {
            triple.evaluation = "extra";
            triple.isPositive = false;
          }
        });
      }

      result = { triples };
    }

    // 更新测试结果
    if (useRealBackend) {
      try {
        // 更新到后端
        await apiClient.put(`/model-tests/${id}`, {
          result,
          status: "completed",
        });
      } catch (error) {
        console.error(`更新模型测试结果 ${id} 到后端失败:`, error);
      }
    }

    // 更新缓存
    modelTestsCache[id] = {
      ...modelTest,
      result,
      status: "completed",
    };
  } catch (error) {
    console.error("处理失败:", error);

    // 更新失败状态
    if (useRealBackend) {
      try {
        // 更新到后端
        await apiClient.put(`/model-tests/${id}`, {
          status: "failed",
        });
      } catch (innerError) {
        console.error(`更新模型测试状态 ${id} 到后端失败:`, innerError);
      }
    }

    // 更新缓存
    modelTestsCache[id] = {
      ...modelTest,
      status: "failed",
    };
  }
};

// 初始化一些示例数据
export const initDemoData = () => {
  // 在启动时测试后端连接
  testBackendConnection().then((isConnected) => {
    if (!isConnected) {
      console.log("后端未连接，将使用模拟数据初始化");
      // 加载一些示例模型
      const demoModels = [
        {
          id: "model-gpt4",
          name: "GPT-4",
          apiEndpoint: "https://api.openai.com/v1/chat/completions",
          description: "OpenAI 最强大的大语言模型",
        },
        {
          id: "model-claude3",
          name: "Claude 3 Opus",
          apiEndpoint: "https://api.anthropic.com/v1/messages",
          description: "Anthropic 的最新模型，擅长复杂推理任务",
        },
        {
          id: "model-gemini",
          name: "Gemini Pro",
          apiEndpoint:
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
          description: "Google 的多模态大模型",
        },
      ];

      // 保存示例模型到本地存储
      localStorage.setItem("models", JSON.stringify(demoModels));

      console.log("已初始化示例模型:", demoModels.length, "个模型");
    } else {
      console.log("后端已连接，将使用后端数据");
    }
  });
};
