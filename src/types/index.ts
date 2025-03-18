// 三元组类型定义
export interface Triple {
  id: string;
  subject: string; // 主体
  predicate: string; // 谓语
  object: string; // 客体
  isPositive?: boolean; // 标记为正例或负例
  confidence?: number; // 模型置信度
  evaluation?: "correct" | "incorrect" | "missing" | "extra"; // 评估结果
}

// 实体类型定义
export interface Entity {
  id: string;
  name: string; // 实体名称
  category: string;
  isPositive?: boolean;
  confidence?: number;
  evaluation?: "correct" | "incorrect" | "missing" | "extra";
}

// 属性类型定义
export interface Attribute {
  id: string;
  name: string; // 属性名称
  category: string;
  isPositive?: boolean;
  confidence?: number;
  evaluation?: "correct" | "incorrect" | "missing" | "extra";
}

// 关系类型定义
export interface Relationship {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  isPositive?: boolean;
  confidence?: number;
  evaluation?: "correct" | "incorrect" | "missing" | "extra";
}

// 测试数据类型定义
export interface Test {
  id: string;
  name: string;
  text: string;
  createdAt: number;
  extractionType: "entity" | "attribute" | "relationship";
  precision?: number | null; // 准确率
  recall?: number | null; // 召回率
  lastTestId?: string | null; // 最近一次测试的ID
}

// 创建测试接口
export interface CreateTestDto {
  name: string;
  text: string;
  extractionType: "entity" | "attribute" | "relationship";
}

// 模型类型定义
export interface Model {
  id: string;
  name: string;
  apiEndpoint: string;
  createdAt: number;
}

// 创建模型接口
export interface CreateModelDto {
  name: string;
  apiEndpoint: string;
}

// 模型评测接口
export interface ModelTest {
  id: string;
  testId: string;
  modelId: string;
  test: Test;
  model: Model;
  createdAt: number;
  result: any;
  status: "pending" | "completed" | "failed";
}

// 测试标注接口
export interface TestAnnotation {
  id: string;
  testId: string;
  test: Test;
  data: {
    triples?: Triple[];
    entities?: Entity[];
    attributes?: Attribute[];
    relationships?: Relationship[];
  };
  createdAt: number;
}

// 模型选项
export interface ModelOption {
  id: string;
  name: string;
  description?: string;
}

// 抽取类型选项
export interface ExtractionTypeOption {
  id: string;
  name: string;
  description?: string;
}

// 不同抽取类型的标签格式
export interface EntityLabelFormat {
  entities: string[]; // ["人物","学校"]
}

export interface AttributeLabelFormat {
  [entityType: string]: string[]; // {"学校":["职位","军衔","学历"],"人物":["职位","军衔","学历"]}
}

export interface RelationLabelFormat {
  [entityType: string]: string[]; // {"学校":["毕业院校"],"人物":["毕业院校"]}
}
