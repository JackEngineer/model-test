const { v4: uuidv4 } = require('uuid');
const { ModelTest, Test, Model, Annotation } = require('../database/models');

// 获取所有模型测试
exports.getAllModelTests = async (req, res, next) => {
  try {
    const modelTests = await ModelTest.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        { model: Test, as: 'test' },
        { model: Model, as: 'model' }
      ]
    });
    
    res.status(200).json(modelTests);
  } catch (error) {
    next(error);
  }
};

// 获取单个模型测试
exports.getModelTestById = async (req, res, next) => {
  try {
    const modelTest = await ModelTest.findByPk(req.params.id, {
      include: [
        { model: Test, as: 'test' },
        { model: Model, as: 'model' }
      ]
    });
    
    if (!modelTest) {
      return res.status(404).json({ message: '模型测试不存在' });
    }
    
    res.status(200).json(modelTest);
  } catch (error) {
    next(error);
  }
};

// 创建模型测试
exports.createModelTest = async (req, res, next) => {
  try {
    const { testId, modelId } = req.body;
    
    if (!testId || !modelId) {
      return res.status(400).json({ message: '缺少必要字段' });
    }
    
    // 检查测试和模型是否存在
    const test = await Test.findByPk(testId);
    if (!test) {
      return res.status(404).json({ message: '测试不存在' });
    }
    
    const model = await Model.findByPk(modelId);
    if (!model) {
      return res.status(404).json({ message: '模型不存在' });
    }
    
    // 创建模型测试
    const modelTest = await ModelTest.create({
      id: uuidv4(),
      testId,
      modelId,
      status: 'pending',
      createdAt: new Date()
    });
    
    // 关联测试和模型
    modelTest.test = test;
    modelTest.model = model;
    
    // 启动异步处理（后续实现）
    // processModelTest(modelTest.id);
    
    res.status(201).json(modelTest);
  } catch (error) {
    next(error);
  }
};

// 更新模型测试结果
exports.updateModelTestResult = async (req, res, next) => {
  try {
    const { result, status } = req.body;
    const modelTest = await ModelTest.findByPk(req.params.id);
    
    if (!modelTest) {
      return res.status(404).json({ message: '模型测试不存在' });
    }
    
    await modelTest.update({
      result: result || modelTest.result,
      status: status || modelTest.status
    });
    
    res.status(200).json(modelTest);
  } catch (error) {
    next(error);
  }
}; 