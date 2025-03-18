import { v4 as uuidv4 } from "uuid";
import apiClient from "./apiClient";
import type {
  Test,
  Model,
  ModelTest,
  CreateTestDto,
  CreateModelDto,
  Triple,
  Entity,
  Attribute,
  Relationship,
} from "../types";
import {
  extractEntities,
  extractAttributes,
  extractRelationships,
  setBaiLianApiConfig,
  getBaiLianApiConfig,
  getBaiLianModels,
} from "./baiLianApi";

// 模拟后端数据缓存（作为后备）
let testsCache: Record<string, Test> = {};
let modelsCache: Record<string, Model> = {};
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

// 模型相关 API
export const getModels = async (): Promise<Model[]> => {
  // 首先获取来自阿里云百炼API的模型
  try {
    const baiLianModels = await getBaiLianModels();

    // 如果有API配置的模型，则优先使用
    if (baiLianModels.length > 0) {
      return baiLianModels;
    }
  } catch (error) {
    console.error("获取百炼模型失败:", error);
  }

  if (useRealBackend) {
    try {
      const response = await apiClient.get<Model[]>("/models");
      return response.data;
    } catch (error) {
      console.error("获取模型列表失败，使用缓存数据:", error);
      return Object.values(modelsCache).sort(
        (a, b) => b.createdAt - a.createdAt
      );
    }
  }

  // 使用模拟数据
  return Object.values(modelsCache).sort((a, b) => b.createdAt - a.createdAt);
};

export const getModel = async (id: string): Promise<Model> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.get<Model>(`/models/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取模型 ${id} 失败，使用缓存数据:`, error);
      const model = modelsCache[id];
      if (!model) {
        throw new Error("Model not found");
      }
      return model;
    }
  }

  // 使用模拟数据
  const model = modelsCache[id];
  if (!model) {
    throw new Error("Model not found");
  }
  return model;
};

export const createModel = async (data: CreateModelDto): Promise<Model> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.post<Model>("/models", data);
      const model = response.data;
      // 更新缓存
      modelsCache[model.id] = model;
      return model;
    } catch (error) {
      console.error("创建模型失败:", error);
      throw error;
    }
  }

  // 使用模拟数据
  const id = uuidv4();
  const model: Model = {
    id,
    ...data,
    createdAt: Date.now(),
  };
  modelsCache[id] = model;
  return model;
};

export const updateModel = async (
  id: string,
  data: Partial<Model>
): Promise<Model> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.put<Model>(`/models/${id}`, data);
      const model = response.data;
      // 更新缓存
      modelsCache[id] = model;
      return model;
    } catch (error) {
      console.error(`更新模型 ${id} 失败:`, error);
      throw error;
    }
  }

  // 使用模拟数据
  const model = modelsCache[id];
  if (!model) {
    throw new Error("Model not found");
  }
  const updatedModel = { ...model, ...data };
  modelsCache[id] = updatedModel;
  return updatedModel;
};

export const deleteModel = async (id: string): Promise<void> => {
  if (useRealBackend) {
    try {
      await apiClient.delete(`/models/${id}`);
      // 更新缓存
      delete modelsCache[id];
    } catch (error) {
      console.error(`删除模型 ${id} 失败:`, error);
      throw error;
    }
  } else {
    // 使用模拟数据
    delete modelsCache[id];
  }
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
        // 标注不存在，属于正常情况
        return null;
      }
      console.error(`获取测试标注 ${testId} 失败，使用缓存数据:`, error);
      // 在缓存中查找
      const annotation = Object.values(annotationsCache).find(
        (a: any) => a.testId === testId
      );
      if (!annotation) {
        return null;
      }
      return annotation;
    }
  }

  // 使用模拟数据
  const annotation = Object.values(annotationsCache).find(
    (a: any) => a.testId === testId
  );
  if (!annotation) {
    return null;
  }
  return annotation;
};

export const saveTestAnnotation = async (
  testId: string,
  data: any
): Promise<any> => {
  if (useRealBackend) {
    try {
      const response = await apiClient.post<any>("/annotations", {
        testId,
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
  // 与saveTestAnnotation函数功能相同，只是为了兼容现有代码
  return saveTestAnnotation(testId, data);
};

// 更新测试标注
export const updateTestAnnotation = async (
  testId: string,
  data: any
): Promise<any> => {
  if (useRealBackend) {
    try {
      // 先检查是否存在
      let annotation;
      try {
        const response = await apiClient.get<any>(`/annotations/${testId}`);
        annotation = response.data;
      } catch (e: any) {
        if (e.response && e.response.status === 404) {
          // 不存在，创建新的
          return createTestAnnotation(testId, data);
        }
        throw e;
      }

      // 存在则更新
      const response = await apiClient.put<any>(`/annotations/${testId}`, {
        data,
      });
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

// API配置相关
export const getApiConfig = async () => {
  try {
    if (useRealBackend) {
      try {
        console.log("尝试从后端获取API配置...");
        const response = await apiClient.get<any>("/api-configs/default");
        console.log("成功获取API配置:", response.data);
        const apiConfig = response.data;

        // 同步到百炼API配置
        if (apiConfig) {
          setBaiLianApiConfig({
            accessKeyId: apiConfig.accessKeyId || "",
            accessKeySecret: apiConfig.accessKeySecret || "",
            endpoint: apiConfig.endpoint || "",
            modelId: apiConfig.modelId || "",
          });
        }
        return apiConfig;
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          // 配置不存在，属于正常情况
          console.warn("后端API配置不存在，使用本地配置");
        } else {
          console.error("获取API配置失败，使用本地配置:", error);
        }

        // 回退到本地配置
        const localConfig = getBaiLianApiConfig();
        console.log("使用本地配置:", localConfig ? "有配置" : "无配置");
        return localConfig;
      }
    }

    // 使用百炼API配置
    return getBaiLianApiConfig();
  } catch (error) {
    console.error("获取API配置过程中发生未预期错误:", error);
    return null;
  }
};

export const saveApiConfig = async (config: any) => {
  try {
    console.log("开始保存API配置:", { ...config, accessKeySecret: "***" });

    // 同步到百炼API配置
    setBaiLianApiConfig({
      accessKeyId: config.accessKeyId || "",
      accessKeySecret: config.accessKeySecret || "",
      endpoint: config.endpoint || "",
      modelId: config.modelId || "",
    });

    // 清空本地缓存，确保使用新的配置获取数据
    if (typeof modelsCache === "object") {
      // 清空对象形式的缓存
      Object.keys(modelsCache).forEach((key) => {
        delete modelsCache[key];
      });
    }

    // 配置成功后切换到真实后端模式
    useRealBackend = true;

    // 立即更新模型列表缓存
    try {
      const models = await getBaiLianModels();
      console.log("已更新模型列表，获取到", models.length, "个模型");
    } catch (error) {
      console.error("获取模型列表失败:", error);
      // 如果获取失败，回退到mock数据
      useRealBackend = false;
    }

    // 保存到后端
    if (useRealBackend) {
      try {
        const response = await apiClient.post<any>("/api-configs", {
          ...config,
          isDefault: true,
        });
        console.log("API配置已成功保存到后端");
        return response.data;
      } catch (error) {
        console.error("保存API配置到后端失败:", error);
        // 不抛出错误，继续使用本地配置
      }
    }

    // 返回本地百炼API配置
    console.log("使用本地API配置");
    return getBaiLianApiConfig();
  } catch (error) {
    console.error("保存API配置过程中发生错误:", error);
    // 返回当前配置，避免完全失败
    return getBaiLianApiConfig();
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

    // 根据抽取类型使用百炼API进行处理
    let result: any = {};

    if (test.extractionType === "entity") {
      // 使用百炼API进行实体抽取
      const entities = await extractEntities(test.text);

      // 如果有标注数据，对结果进行评估
      if (annotation && annotation.data.entities) {
        const manualEntities = annotation.data.entities;

        // 评估每个抽取的实体
        entities.forEach((entity) => {
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
      // 使用百炼API进行属性抽取
      const attributes = await extractAttributes(test.text);

      // 如果有标注数据，对结果进行评估
      if (annotation && annotation.data.attributes) {
        const manualAttributes = annotation.data.attributes;

        // 评估每个抽取的属性
        attributes.forEach((attribute) => {
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
      // 使用百炼API进行关系抽取
      const triples = await extractRelationships(test.text);

      // 如果有标注数据，对结果进行评估
      if (annotation && annotation.data.triples) {
        const manualTriples = annotation.data.triples;

        // 评估每个抽取的三元组
        triples.forEach((triple) => {
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
  // 只有在没有现有配置的情况下才初始化百炼API配置
  const currentConfig = getBaiLianApiConfig();
  if (!currentConfig) {
    setBaiLianApiConfig({
      accessKeyId: "", // 这里需要填入你的阿里云AccessKey ID
      accessKeySecret: "", // 这里需要填入你的阿里云AccessKey Secret
      endpoint: "https://bailian.aliyuncs.com", // 默认API端点
      modelId: "qwen2.5-72b-instruct", // 默认使用通义千问2.5-72B模型
    });
  }

  // 在启动时测试后端连接
  testBackendConnection().then((isConnected) => {
    if (!isConnected) {
      console.log("后端未连接，将使用模拟数据初始化");
      // 以下是模拟数据初始化的代码，保留原来的实现
      // ... 原来的initDemoData实现 ...
    } else {
      console.log("后端已连接，将使用后端数据");
    }
  });
};
