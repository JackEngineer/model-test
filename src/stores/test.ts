import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { v4 as uuidv4 } from "uuid";
import type { 
  Test, 
  Triple, 
  Entity, 
  Attribute, 
  ModelOption, 
  ExtractionTypeOption 
} from "../types";

// 模拟后端API调用
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useTestStore = defineStore("test", () => {
  // 状态
  const tests = ref<Test[]>([]);
  const currentTest = ref<Test | null>(null);
  const loading = ref(false);

  // 模拟数据 - 实际项目中应通过API获取
  const modelOptions = ref<ModelOption[]>([
    { id: "model1", name: "GPT-4" },
    { id: "model2", name: "Claude-3" },
    { id: "model3", name: "Qwen-2" },
  ]);

  const extractionTypes = ref<ExtractionTypeOption[]>([
    { id: "entity", name: "实体抽取" },
    { id: "attribute", name: "属性抽取" },
    { id: "relation", name: "关系抽取" },
  ]);

  // 获取所有测试
  const fetchTests = async () => {
    loading.value = true;
    try {
      // 模拟API请求延迟
      await delay(500);

      // 这里应该是实际的API调用
      // tests.value = await api.getTests()

      // 暂时使用本地存储
      const storedTests = localStorage.getItem("model-tests");
      if (storedTests) {
        tests.value = JSON.parse(storedTests);
      }
    } catch (error) {
      console.error("获取测试列表失败", error);
    } finally {
      loading.value = false;
    }
  };

  // 获取单个测试
  const fetchTestById = async (id: string) => {
    loading.value = true;
    try {
      await delay(300);
      // 实际项目中应通过API获取
      const test = tests.value.find((t) => t.id === id) || null;
      currentTest.value = test ? { ...test } : null;
      return currentTest.value;
    } catch (error) {
      console.error("获取测试详情失败", error);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // 创建新测试
  const createTest = async (testData: Partial<Test>) => {
    loading.value = true;
    try {
      await delay(500);

      const newTest: Test = {
        id: uuidv4(),
        name: testData.name || "未命名测试",
        type: testData.type || "",
        content: testData.content || "",
        label: testData.label || "",
        modelId: testData.modelId || "",
        manualTriples: [],
        modelTriples: [],
        manualEntities: [],
        modelEntities: [],
        manualAttributes: [],
        modelAttributes: [],
        evaluationResults: {
          precision: 0,
          recall: 0,
          f1Score: 0,
        },
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      tests.value.push(newTest);
      saveToLocalStorage();

      return newTest;
    } catch (error) {
      console.error("创建测试失败", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 更新测试
  const updateTest = async (id: string, updateData: Partial<Test>) => {
    loading.value = true;
    try {
      await delay(300);

      const index = tests.value.findIndex((t) => t.id === id);
      if (index === -1) throw new Error("测试不存在");

      tests.value[index] = {
        ...tests.value[index],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      if (currentTest.value?.id === id) {
        currentTest.value = { ...tests.value[index] };
      }

      saveToLocalStorage();
      return tests.value[index];
    } catch (error) {
      console.error("更新测试失败", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 保存用户标注的数据（通用方法）
  const saveAnnotation = async (testId: string, data: any, dataType: string) => {
    try {
      const test = tests.value.find((t) => t.id === testId);
      if (!test) throw new Error("测试不存在");

      const updateFields: Record<string, any> = {
        status: "annotated",
        updatedAt: new Date().toISOString()
      };

      // 根据数据类型更新不同的字段
      if (dataType === 'triples') {
        updateFields.manualTriples = data;
        if (currentTest.value?.id === testId) {
          currentTest.value.manualTriples = [...data];
        }
      } else if (dataType === 'entities') {
        updateFields.manualEntities = data;
        if (currentTest.value?.id === testId) {
          currentTest.value.manualEntities = [...data];
        }
      } else if (dataType === 'attributes') {
        updateFields.manualAttributes = data;
        if (currentTest.value?.id === testId) {
          currentTest.value.manualAttributes = [...data];
        }
      }

      // 更新测试数据
      const testIndex = tests.value.findIndex(t => t.id === testId);
      if (testIndex !== -1) {
        tests.value[testIndex] = {
          ...tests.value[testIndex],
          ...updateFields
        };

        if (currentTest.value?.id === testId) {
          currentTest.value.status = "annotated";
        }
      }

      saveToLocalStorage();
      return test;
    } catch (error) {
      console.error("保存标注失败", error);
      throw error;
    }
  };

  // 保存用户标注的三元组
  const saveAnnotatedTriples = async (testId: string, triples: Triple[]) => {
    return saveAnnotation(testId, triples, 'triples');
  };

  // 保存用户标注的实体
  const saveAnnotatedEntities = async (testId: string, entities: Entity[]) => {
    return saveAnnotation(testId, entities, 'entities');
  };

  // 保存用户标注的属性
  const saveAnnotatedAttributes = async (testId: string, attributes: Attribute[]) => {
    return saveAnnotation(testId, attributes, 'attributes');
  };

  // 调用模型抽取 (模拟)
  const callModelExtraction = async (testId: string) => {
    loading.value = true;
    try {
      await delay(1500); // 模拟API调用延迟

      const test = tests.value.find((t) => t.id === testId);
      if (!test) throw new Error("测试不存在");

      if (test.type === 'relation') {
        // 模拟模型抽取结果 - 关系抽取
        const modelTriples: Triple[] = [];

        // 随机复制一些已标注的三元组作为模型结果
        test.manualTriples.forEach((triple) => {
          if (Math.random() > 0.3) {
            // 70%的准确率
            modelTriples.push({
              ...triple,
              id: uuidv4(),
              confidence: Math.random() * 0.5 + 0.5, // 0.5 - 1.0之间的随机置信度
            });
          }
        });

        // 添加一些额外的三元组作为误识别
        for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
          modelTriples.push({
            id: uuidv4(),
            subject: `额外主体${i}`,
            predicate: `额外关系${i}`,
            object: `额外客体${i}`,
            confidence: Math.random() * 0.4 + 0.3, // 0.3 - 0.7之间的随机置信度
          });
        }

        test.modelTriples = modelTriples;
      } 
      else if (test.type === 'entity') {
        // 模拟模型抽取结果 - 实体抽取
        const modelEntities: Entity[] = [];

        // 随机复制一些已标注的实体作为模型结果
        test.manualEntities.forEach((entity) => {
          if (Math.random() > 0.3) {
            // 70%的准确率
            modelEntities.push({
              ...entity,
              id: uuidv4(),
              confidence: Math.random() * 0.5 + 0.5, // 0.5 - 1.0之间的随机置信度
            });
          }
        });

        // 添加一些额外的实体作为误识别
        for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
          modelEntities.push({
            id: uuidv4(),
            name: `额外实体${i}`,
            confidence: Math.random() * 0.4 + 0.3, // 0.3 - 0.7之间的随机置信度
          });
        }

        test.modelEntities = modelEntities;
      }
      else if (test.type === 'attribute') {
        // 模拟模型抽取结果 - 属性抽取
        const modelAttributes: Attribute[] = [];

        // 随机复制一些已标注的属性作为模型结果
        test.manualAttributes.forEach((attribute) => {
          if (Math.random() > 0.3) {
            // 70%的准确率
            modelAttributes.push({
              ...attribute,
              id: uuidv4(),
              confidence: Math.random() * 0.5 + 0.5, // 0.5 - 1.0之间的随机置信度
            });
          }
        });

        // 添加一些额外的属性作为误识别
        for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
          modelAttributes.push({
            id: uuidv4(),
            name: `额外属性${i}`,
            category: `额外类别${i % 2}`,
            confidence: Math.random() * 0.4 + 0.3, // 0.3 - 0.7之间的随机置信度
          });
        }

        test.modelAttributes = modelAttributes;
      }

      test.updatedAt = new Date().toISOString();

      if (currentTest.value?.id === testId) {
        if (test.type === 'relation') {
          currentTest.value.modelTriples = [...test.modelTriples];
        } else if (test.type === 'entity') {
          currentTest.value.modelEntities = [...test.modelEntities];
        } else if (test.type === 'attribute') {
          currentTest.value.modelAttributes = [...test.modelAttributes];
        }
      }

      saveToLocalStorage();
      
      // 返回适当的模型结果
      if (test.type === 'relation') return test.modelTriples;
      if (test.type === 'entity') return test.modelEntities;
      if (test.type === 'attribute') return test.modelAttributes;
      
      return [];
    } catch (error) {
      console.error("模型抽取失败", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 评估模型结果
  const evaluateResults = async (testId: string) => {
    try {
      const test = tests.value.find((t) => t.id === testId);
      if (!test) throw new Error("测试不存在");

      let truePositives = 0;
      let falsePositives = 0;
      let falseNegatives = 0;

      if (test.type === 'relation') {
        const manualTriples = test.manualTriples;
        const modelTriples = test.modelTriples;

        // 标记模型三元组的评估结果
        modelTriples.forEach((modelTriple) => {
          // 检查是否在用户标注中存在匹配项
          const match = manualTriples.find(
            (mt) =>
              mt.subject === modelTriple.subject &&
              mt.predicate === modelTriple.predicate &&
              mt.object === modelTriple.object
          );

          if (match) {
            modelTriple.isPositive = true;
            modelTriple.evaluation = "correct";
            truePositives++;
          } else {
            modelTriple.isPositive = false;
            modelTriple.evaluation = "extra";
            falsePositives++;
          }
        });

        // 查找模型未抽取到的三元组(漏报)
        manualTriples.forEach((manualTriple) => {
          const match = modelTriples.find(
            (mt) =>
              mt.subject === manualTriple.subject &&
              mt.predicate === manualTriple.predicate &&
              mt.object === manualTriple.object
          );

          if (!match) {
            falseNegatives++;
          }
        });
      } else if (test.type === 'entity') {
        const manualEntities = test.manualEntities;
        const modelEntities = test.modelEntities;

        // 标记模型实体的评估结果
        modelEntities.forEach((modelEntity) => {
          // 检查是否在用户标注中存在匹配项
          const match = manualEntities.find(
            (me) => me.name === modelEntity.name
          );

          if (match) {
            modelEntity.isPositive = true;
            modelEntity.evaluation = "correct";
            truePositives++;
          } else {
            modelEntity.isPositive = false;
            modelEntity.evaluation = "extra";
            falsePositives++;
          }
        });

        // 查找模型未抽取到的实体(漏报)
        manualEntities.forEach((manualEntity) => {
          const match = modelEntities.find(
            (me) => me.name === manualEntity.name
          );

          if (!match) {
            falseNegatives++;
          }
        });
      } else if (test.type === 'attribute') {
        const manualAttributes = test.manualAttributes;
        const modelAttributes = test.modelAttributes;

        // 标记模型属性的评估结果
        modelAttributes.forEach((modelAttribute) => {
          // 检查是否在用户标注中存在匹配项
          const match = manualAttributes.find(
            (ma) => ma.name === modelAttribute.name && 
                   ma.category === modelAttribute.category
          );

          if (match) {
            modelAttribute.isPositive = true;
            modelAttribute.evaluation = "correct";
            truePositives++;
          } else {
            modelAttribute.isPositive = false;
            modelAttribute.evaluation = "extra";
            falsePositives++;
          }
        });

        // 查找模型未抽取到的属性(漏报)
        manualAttributes.forEach((manualAttribute) => {
          const match = modelAttributes.find(
            (ma) => ma.name === manualAttribute.name &&
                   ma.category === manualAttribute.category
          );

          if (!match) {
            falseNegatives++;
          }
        });
      }

      const precision = truePositives / (truePositives + falsePositives) || 0;
      const recall = truePositives / (truePositives + falseNegatives) || 0;
      const f1Score = (2 * (precision * recall)) / (precision + recall) || 0;

      // 更新测试评估结果
      test.evaluationResults = {
        precision,
        recall,
        f1Score,
      };
      test.status = "completed";
      test.updatedAt = new Date().toISOString();

      if (currentTest.value?.id === testId) {
        currentTest.value.evaluationResults = { precision, recall, f1Score };
        currentTest.value.status = "completed";
        
        // 更新评估结果
        if (test.type === 'relation') {
          currentTest.value.modelTriples = [...test.modelTriples];
        } else if (test.type === 'entity') {
          currentTest.value.modelEntities = [...test.modelEntities];
        } else if (test.type === 'attribute') {
          currentTest.value.modelAttributes = [...test.modelAttributes];
        }
      }

      saveToLocalStorage();
      return test.evaluationResults;
    } catch (error) {
      console.error("评估结果失败", error);
      throw error;
    }
  };

  // 删除测试
  const deleteTest = async (id: string) => {
    try {
      const index = tests.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        tests.value.splice(index, 1);
        saveToLocalStorage();
      }
      if (currentTest.value?.id === id) {
        currentTest.value = null;
      }
    } catch (error) {
      console.error("删除测试失败", error);
      throw error;
    }
  };

  // 保存到本地存储
  const saveToLocalStorage = () => {
    localStorage.setItem("model-tests", JSON.stringify(tests.value));
  };

  return {
    tests,
    currentTest,
    loading,
    modelOptions,
    extractionTypes,
    fetchTests,
    fetchTestById,
    createTest,
    updateTest,
    saveAnnotatedTriples,
    saveAnnotatedEntities,
    saveAnnotatedAttributes,
    callModelExtraction,
    evaluateResults,
    deleteTest,
  };
});
