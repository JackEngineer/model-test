# 大模型抽取能力测试系统

这是一个用于测试大模型知识抽取能力的系统，支持用户手动标注数据，并与模型抽取结果进行对比评估。

## 功能特点

- 支持创建多个测试任务
- 提供友好的三元组标注界面
- 自动计算准确率、召回率和 F1 分数
- 支持手动调整评估结果
- 结果可视化展示

## 技术栈

- 前端：Vue 3 + TypeScript + Composition API
- UI 组件：Element Plus
- 状态管理：Pinia
- 样式：Tailwind CSS
- 工具库：VueUse

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 使用流程

1. 首页查看测试列表，点击"添加测试"创建新测试
2. 填写测试信息，包括测试名称、抽取类型、抽取内容、抽取标签和选择模型
3. 在标注页面，从文本中选择内容标注三元组
4. 完成标注后，点击"完成标注"调用模型进行抽取
5. 在结果页面查看对比结果，可手动调整评估
6. 点击"完成测试"保存评估结果

## 项目结构

```
├── src/
│   ├── assets/        # 静态资源
│   ├── components/    # 组件
│   ├── router/        # 路由配置
│   ├── stores/        # Pinia状态管理
│   ├── types/         # TypeScript类型定义
│   ├── views/         # 页面视图
│   ├── App.vue        # 根组件
│   └── main.ts        # 入口文件
├── public/            # 公共资源
├── index.html         # HTML模板
└── package.json       # 项目配置
```
