import { v4 as uuidv4 } from "uuid";
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

// 模拟后端数据
let tests: Record<string, Test> = {};
let models: Record<string, Model> = {};
let modelTests: Record<string, ModelTest> = {};
let annotations: Record<string, any> = {};

// 测试相关 API
export const getTests = async (): Promise<Test[]> => {
  const testList = Object.values(tests).sort(
    (a, b) => b.createdAt - a.createdAt
  );

  // 为每个测试计算最新的准确率和召回率
  return testList.map((test) => {
    // 查找该测试的所有模型测试
    const testModelTests = Object.values(modelTests).filter(
      (mt) => mt.testId === test.id && mt.status === "completed"
    );

    // 如果没有完成的模型测试，返回原始测试数据
    if (testModelTests.length === 0) {
      return {
        ...test,
        precision: null,
        recall: null,
        lastTestId: null,
      };
    }

    // 获取最新的模型测试
    const latestModelTest = testModelTests.sort(
      (a, b) => b.createdAt - a.createdAt
    )[0];

    // 计算准确率和召回率
    let precision = 0;
    let recall = 0;

    if (test.extractionType === "entity" && latestModelTest.result?.entities) {
      // 查找该测试的标注数据
      const annotation = Object.values(annotations).find(
        (a: any) => a.testId === test.id && a.data.entities
      );

      if (annotation) {
        const manualEntities = annotation.data.entities;
        const modelEntities = latestModelTest.result.entities;

        // 计算准确的实体数量
        const correctEntities = modelEntities.filter(
          (e: Entity) => e.evaluation === "correct"
        ).length;

        // 计算准确率：正确预测的实体 / 模型预测的所有实体
        precision =
          modelEntities.length > 0 ? correctEntities / modelEntities.length : 0;

        // 计算召回率：正确预测的实体 / 人工标注的所有实体
        recall =
          manualEntities.length > 0
            ? correctEntities / manualEntities.length
            : 0;
      }
    } else if (
      test.extractionType === "attribute" &&
      latestModelTest.result?.attributes
    ) {
      // 查找该测试的标注数据
      const annotation = Object.values(annotations).find(
        (a: any) => a.testId === test.id && a.data.attributes
      );

      if (annotation) {
        const manualAttributes = annotation.data.attributes;
        const modelAttributes = latestModelTest.result.attributes;

        // 计算准确的属性数量
        const correctAttributes = modelAttributes.filter(
          (a: Attribute) => a.evaluation === "correct"
        ).length;

        // 计算准确率和召回率
        precision =
          modelAttributes.length > 0
            ? correctAttributes / modelAttributes.length
            : 0;
        recall =
          manualAttributes.length > 0
            ? correctAttributes / manualAttributes.length
            : 0;
      }
    } else if (
      test.extractionType === "relationship" &&
      latestModelTest.result?.triples
    ) {
      // 查找该测试的标注数据
      const annotation = Object.values(annotations).find(
        (a: any) => a.testId === test.id && a.data.triples
      );

      if (annotation) {
        const manualTriples = annotation.data.triples;
        const modelTriples = latestModelTest.result.triples;

        // 计算准确的三元组数量
        const correctTriples = modelTriples.filter(
          (t: Triple) => t.evaluation === "correct"
        ).length;

        // 计算准确率和召回率
        precision =
          modelTriples.length > 0 ? correctTriples / modelTriples.length : 0;
        recall =
          manualTriples.length > 0 ? correctTriples / manualTriples.length : 0;
      }
    }

    // 返回带有指标的测试数据
    return {
      ...test,
      precision: precision !== null ? Math.round(precision * 100) / 100 : null,
      recall: recall !== null ? Math.round(recall * 100) / 100 : null,
      lastTestId: latestModelTest.id,
    };
  });
};

export const getTest = async (id: string): Promise<Test> => {
  const test = tests[id];
  if (!test) {
    throw new Error("Test not found");
  }
  return test;
};

export const createTest = async (data: CreateTestDto): Promise<Test> => {
  const id = uuidv4();
  const test: Test = {
    id,
    ...data,
    createdAt: Date.now(),
  };
  tests[id] = test;
  return test;
};

export const updateTest = async (
  id: string,
  data: Partial<Test>
): Promise<Test> => {
  const test = tests[id];
  if (!test) {
    throw new Error("Test not found");
  }
  const updatedTest = { ...test, ...data };
  tests[id] = updatedTest;
  return updatedTest;
};

export const deleteTest = async (id: string): Promise<void> => {
  delete tests[id];
};

// 模型相关 API
export const getModels = async (): Promise<Model[]> => {
  return Object.values(models).sort((a, b) => b.createdAt - a.createdAt);
};

export const getModel = async (id: string): Promise<Model> => {
  const model = models[id];
  if (!model) {
    throw new Error("Model not found");
  }
  return model;
};

export const createModel = async (data: CreateModelDto): Promise<Model> => {
  const id = uuidv4();
  const model: Model = {
    id,
    ...data,
    createdAt: Date.now(),
  };
  models[id] = model;
  return model;
};

export const updateModel = async (
  id: string,
  data: Partial<Model>
): Promise<Model> => {
  const model = models[id];
  if (!model) {
    throw new Error("Model not found");
  }
  const updatedModel = { ...model, ...data };
  models[id] = updatedModel;
  return updatedModel;
};

export const deleteModel = async (id: string): Promise<void> => {
  delete models[id];
};

// 模型测试相关 API
export const getModelTests = async (): Promise<ModelTest[]> => {
  return Object.values(modelTests).sort((a, b) => b.createdAt - a.createdAt);
};

export const getModelTest = async (id: string): Promise<ModelTest> => {
  const modelTest = modelTests[id];
  if (!modelTest) {
    throw new Error("Model test not found");
  }

  // 获取关联的测试和模型
  modelTest.test = tests[modelTest.testId];
  modelTest.model = models[modelTest.modelId];

  return modelTest;
};

export const createModelTest = async (data: {
  testId: string;
  modelId: string;
}): Promise<ModelTest> => {
  // 验证测试和模型存在
  if (!tests[data.testId]) {
    throw new Error("Test not found");
  }
  if (!models[data.modelId]) {
    throw new Error("Model not found");
  }

  const id = uuidv4();
  const modelTest: ModelTest = {
    id,
    testId: data.testId,
    modelId: data.modelId,
    test: tests[data.testId],
    model: models[data.modelId],
    createdAt: Date.now(),
    result: null,
    status: "pending",
  };
  modelTests[id] = modelTest;

  // 模拟异步处理
  setTimeout(() => {
    processModelTest(id);
  }, 2000);

  return modelTest;
};

export const updateModelTest = async (
  id: string,
  data: Partial<ModelTest>
): Promise<ModelTest> => {
  const modelTest = modelTests[id];
  if (!modelTest) {
    throw new Error("Model test not found");
  }
  const updatedModelTest = { ...modelTest, ...data };
  modelTests[id] = updatedModelTest;
  return updatedModelTest;
};

export const deleteModelTest = async (id: string): Promise<void> => {
  delete modelTests[id];
};

// 获取模型测试结果
export const getModelTestResult = async (id: string): Promise<ModelTest> => {
  const modelTest = modelTests[id];
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
  const modelTest = modelTests[id];
  if (!modelTest) {
    throw new Error("Model test not found");
  }
  const updatedModelTest = { ...modelTest, result: data.result };
  modelTests[id] = updatedModelTest;
  return updatedModelTest;
};

// 测试标注相关 API
export const getTestAnnotation = async (testId: string): Promise<any> => {
  const annotation = Object.values(annotations).find(
    (a: any) => a.testId === testId
  );
  if (!annotation) {
    throw new Error("Annotation not found");
  }
  return annotation;
};

export const createTestAnnotation = async (data: any): Promise<any> => {
  const id = uuidv4();
  const annotation = {
    id,
    ...data,
    createdAt: Date.now(),
  };
  annotations[id] = annotation;
  return annotation;
};

export const updateTestAnnotation = async (
  id: string,
  data: any
): Promise<any> => {
  const annotation = annotations[id];
  if (!annotation) {
    throw new Error("Annotation not found");
  }
  const updatedAnnotation = { ...annotation, ...data };
  annotations[id] = updatedAnnotation;
  return updatedAnnotation;
};

// 模拟模型处理测试
const processModelTest = (id: string) => {
  const modelTest = modelTests[id];
  if (!modelTest) return;

  try {
    // 获取测试和标注数据
    const test = tests[modelTest.testId];
    const annotation = Object.values(annotations).find(
      (a: any) => a.testId === modelTest.testId
    );

    // 根据抽取类型生成不同的模拟结果
    let result: any = {};

    if (test.extractionType === "entity") {
      // 模拟实体抽取结果
      result = generateEntityExtractionResult(test, annotation);
    } else if (test.extractionType === "attribute") {
      // 模拟属性抽取结果
      result = generateAttributeExtractionResult(test, annotation);
    } else {
      // 模拟关系抽取结果
      result = generateRelationshipExtractionResult(test, annotation);
    }

    // 更新测试结果
    modelTests[id] = {
      ...modelTest,
      result,
      status: "completed",
    };
  } catch (error) {
    // 处理失败
    modelTests[id] = {
      ...modelTest,
      status: "failed",
    };
  }
};

// 生成实体抽取结果
const generateEntityExtractionResult = (test: Test, annotation: any) => {
  // 如果有标注数据，基于标注生成模拟结果
  if (annotation && annotation.data.entities) {
    const manualEntities = annotation.data.entities;

    // 生成一些模拟的实体识别结果
    const entities: Entity[] = [];

    // 模拟部分标注实体被正确识别
    manualEntities.forEach((entity: Entity, index: number) => {
      if (Math.random() > 0.3) {
        // 70% 的概率正确识别
        entities.push({
          id: uuidv4(),
          name: entity.name,
          category: entity.category,
          confidence: 0.7 + Math.random() * 0.3,
          isPositive: true,
          evaluation: "correct",
        });
      }
    });

    // 模拟一些额外识别的实体
    const extraEntityCount = Math.floor(Math.random() * 3);
    const extraEntities = [
      "苹果",
      "华为",
      "三星",
      "小米",
      "荣耀",
      "OPPO",
      "vivo",
      "中国",
      "美国",
      "日本",
      "韩国",
      "德国",
      "北京",
      "上海",
      "深圳",
      "广州",
      "杭州",
    ];

    for (let i = 0; i < extraEntityCount; i++) {
      const randomIndex = Math.floor(Math.random() * extraEntities.length);
      const randomCategory = ["人物", "组织", "地点", "时间", "产品"][
        Math.floor(Math.random() * 5)
      ];

      entities.push({
        id: uuidv4(),
        name: extraEntities[randomIndex],
        category: randomCategory,
        confidence: 0.5 + Math.random() * 0.4,
        isPositive: false,
        evaluation: "extra",
      });
    }

    return { entities };
  }

  // 如果没有标注数据，生成一些随机实体
  const randomEntities = [
    { name: "苹果", category: "组织" },
    { name: "iPhone", category: "产品" },
    { name: "华为", category: "组织" },
    { name: "小米", category: "组织" },
    { name: "中国", category: "地点" },
  ];

  const entities = randomEntities.map((entity) => ({
    id: uuidv4(),
    name: entity.name,
    category: entity.category,
    confidence: 0.7 + Math.random() * 0.3,
    isPositive: true,
  }));

  return { entities };
};

// 生成属性抽取结果
const generateAttributeExtractionResult = (test: Test, annotation: any) => {
  // 如果有标注数据，基于标注生成模拟结果
  if (annotation && annotation.data.attributes) {
    const manualAttributes = annotation.data.attributes;

    // 生成一些模拟的属性识别结果
    const attributes: Attribute[] = [];

    // 模拟部分标注属性被正确识别
    manualAttributes.forEach((attribute: Attribute, index: number) => {
      if (Math.random() > 0.3) {
        // 70% 的概率正确识别
        attributes.push({
          id: uuidv4(),
          name: attribute.name,
          category: attribute.category,
          confidence: 0.7 + Math.random() * 0.3,
          isPositive: true,
          evaluation: "correct",
        });
      }
    });

    // 模拟一些额外识别的属性
    const extraAttributeCount = Math.floor(Math.random() * 3);
    const extraAttributes = [
      "高通骁龙8",
      "A15",
      "麒麟990",
      "OLED",
      "LCD",
      "6.7英寸",
      "5.8英寸",
      "4000mAh",
      "128GB",
      "256GB",
      "黑色",
      "白色",
      "蓝色",
      "金色",
      "银色",
    ];

    for (let i = 0; i < extraAttributeCount; i++) {
      const randomIndex = Math.floor(Math.random() * extraAttributes.length);
      const randomCategory = [
        "品牌",
        "规格",
        "材质",
        "颜色",
        "尺寸",
        "价格",
        "特性",
      ][Math.floor(Math.random() * 7)];

      attributes.push({
        id: uuidv4(),
        name: extraAttributes[randomIndex],
        category: randomCategory,
        confidence: 0.5 + Math.random() * 0.4,
        isPositive: false,
        evaluation: "extra",
      });
    }

    return { attributes };
  }

  // 如果没有标注数据，生成一些随机属性
  const randomAttributes = [
    { name: "高通骁龙8", category: "规格" },
    { name: "OLED", category: "材质" },
    { name: "6.7英寸", category: "尺寸" },
    { name: "256GB", category: "规格" },
    { name: "蓝色", category: "颜色" },
  ];

  const attributes = randomAttributes.map((attribute) => ({
    id: uuidv4(),
    name: attribute.name,
    category: attribute.category,
    confidence: 0.7 + Math.random() * 0.3,
    isPositive: true,
  }));

  return { attributes };
};

// 生成关系抽取结果
const generateRelationshipExtractionResult = (test: Test, annotation: any) => {
  // 如果有标注数据，基于标注生成模拟结果
  if (annotation && annotation.data.triples) {
    const manualTriples = annotation.data.triples;

    // 生成一些模拟的三元组识别结果
    const triples: Triple[] = [];

    // 模拟部分标注三元组被正确识别
    manualTriples.forEach((triple: Triple, index: number) => {
      if (Math.random() > 0.3) {
        // 70% 的概率正确识别
        triples.push({
          id: uuidv4(),
          subject: triple.subject,
          predicate: triple.predicate,
          object: triple.object,
          confidence: 0.7 + Math.random() * 0.3,
          isPositive: true,
          evaluation: "correct",
        });
      }
    });

    // 模拟一些额外识别的三元组
    const extraTripleCount = Math.floor(Math.random() * 3);
    const extraTriples = [
      { subject: "华为", predicate: "使用", object: "麒麟芯片" },
      { subject: "iPhone", predicate: "生产", object: "苹果公司" },
      { subject: "小米", predicate: "销售", object: "手机" },
      { subject: "三星", predicate: "位于", object: "韩国" },
      { subject: "OPPO", predicate: "竞争", object: "vivo" },
    ];

    for (let i = 0; i < extraTripleCount; i++) {
      const randomIndex = Math.floor(Math.random() * extraTriples.length);
      const randomTriple = extraTriples[randomIndex];

      triples.push({
        id: uuidv4(),
        ...randomTriple,
        confidence: 0.5 + Math.random() * 0.4,
        isPositive: false,
        evaluation: "extra",
      });
    }

    return { triples };
  }

  // 如果没有标注数据，生成一些随机三元组
  const randomTriples = [
    { subject: "华为", predicate: "使用", object: "麒麟芯片" },
    { subject: "iPhone", predicate: "生产", object: "苹果公司" },
    { subject: "小米", predicate: "销售", object: "手机" },
    { subject: "三星", predicate: "位于", object: "韩国" },
  ];

  const triples = randomTriples.map((triple) => ({
    id: uuidv4(),
    ...triple,
    confidence: 0.7 + Math.random() * 0.3,
    isPositive: true,
  }));

  return { triples };
};

// 初始化一些示例数据
export const initDemoData = () => {
  // 创建示例测试
  const testId1 = uuidv4();
  tests[testId1] = {
    id: testId1,
    name: "手机品牌关系测试",
    text: "华为是中国领先的手机制造商，使用自研的麒麟芯片。苹果公司生产iPhone系列手机，采用A15芯片。小米、OPPO和vivo也是中国知名的手机品牌。三星是韩国的手机制造商，与苹果公司竞争全球市场。",
    createdAt: Date.now() - 86400000 * 3,
    extractionType: "relationship",
  };

  const testId2 = uuidv4();
  tests[testId2] = {
    id: testId2,
    name: "手机实体测试",
    text: "市场上主流的手机品牌包括华为、苹果、小米、OPPO、vivo和三星。其中华为是中国领先的科技公司，总部位于深圳。苹果公司来自美国加利福尼亚州，其iPhone系列在全球范围内都很受欢迎。",
    createdAt: Date.now() - 86400000 * 2,
    extractionType: "entity",
  };

  const testId3 = uuidv4();
  tests[testId3] = {
    id: testId3,
    name: "手机属性测试",
    text: "这款最新的旗舰手机采用了6.7英寸的OLED屏幕，搭载高通骁龙8处理器，内置4500mAh大容量电池。手机有256GB存储空间，支持5G网络，提供黑色、白色和蓝色三种颜色选择。",
    createdAt: Date.now() - 86400000,
    extractionType: "attribute",
  };

  // 创建示例模型
  const modelId1 = uuidv4();
  models[modelId1] = {
    id: modelId1,
    name: "GPT-3.5-Turbo",
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
    createdAt: Date.now() - 86400000 * 2,
  };

  const modelId2 = uuidv4();
  models[modelId2] = {
    id: modelId2,
    name: "GPT-4-32k",
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
    createdAt: Date.now() - 86400000,
  };

  // 创建示例标注
  const annotationId1 = uuidv4();
  annotations[annotationId1] = {
    id: annotationId1,
    testId: testId1,
    data: {
      triples: [
        {
          id: uuidv4(),
          subject: "华为",
          predicate: "使用",
          object: "麒麟芯片",
          isPositive: true,
        },
        {
          id: uuidv4(),
          subject: "苹果公司",
          predicate: "生产",
          object: "iPhone",
          isPositive: true,
        },
        {
          id: uuidv4(),
          subject: "iPhone",
          predicate: "采用",
          object: "A15芯片",
          isPositive: true,
        },
        {
          id: uuidv4(),
          subject: "三星",
          predicate: "竞争",
          object: "苹果公司",
          isPositive: true,
        },
      ],
    },
    createdAt: Date.now() - 86400000 * 2,
  };

  const annotationId2 = uuidv4();
  annotations[annotationId2] = {
    id: annotationId2,
    testId: testId2,
    data: {
      entities: [
        {
          id: uuidv4(),
          name: "华为",
          category: "组织",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "苹果",
          category: "组织",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "小米",
          category: "组织",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "OPPO",
          category: "组织",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "vivo",
          category: "组织",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "三星",
          category: "组织",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "深圳",
          category: "地点",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "美国",
          category: "地点",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "加利福尼亚州",
          category: "地点",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "iPhone",
          category: "产品",
          isPositive: true,
        },
      ],
    },
    createdAt: Date.now() - 86400000,
  };

  const annotationId3 = uuidv4();
  annotations[annotationId3] = {
    id: annotationId3,
    testId: testId3,
    data: {
      attributes: [
        {
          id: uuidv4(),
          name: "6.7英寸",
          category: "尺寸",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "OLED",
          category: "材质",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "高通骁龙8",
          category: "规格",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "4500mAh",
          category: "规格",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "256GB",
          category: "规格",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "5G",
          category: "特性",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "黑色",
          category: "颜色",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "白色",
          category: "颜色",
          isPositive: true,
        },
        {
          id: uuidv4(),
          name: "蓝色",
          category: "颜色",
          isPositive: true,
        },
      ],
    },
    createdAt: Date.now() - 43200000,
  };

  // 创建示例模型测试
  const modelTestId1 = uuidv4();
  modelTests[modelTestId1] = {
    id: modelTestId1,
    testId: testId1,
    modelId: modelId1,
    test: tests[testId1],
    model: models[modelId1],
    createdAt: Date.now() - 86400000 * 1.5,
    result: null,
    status: "pending",
  };

  const modelTestId2 = uuidv4();
  modelTests[modelTestId2] = {
    id: modelTestId2,
    testId: testId2,
    modelId: modelId1,
    test: tests[testId2],
    model: models[modelId1],
    createdAt: Date.now() - 86400000 * 0.8,
    result: null,
    status: "pending",
  };

  const modelTestId3 = uuidv4();
  modelTests[modelTestId3] = {
    id: modelTestId3,
    testId: testId3,
    modelId: modelId1,
    test: tests[testId3],
    model: models[modelId1],
    createdAt: Date.now() - 43200000,
    result: null,
    status: "pending",
  };

  // 处理测试
  processModelTest(modelTestId1);
  processModelTest(modelTestId2);
  processModelTest(modelTestId3);
};
