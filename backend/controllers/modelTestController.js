const { v4: uuidv4 } = require('uuid');
const { models } = require('../database/db');

// 获取所有模型测试
exports.getAllModelTests = async (req, res, next) => {
  try {
    const modelTests = await models.ModelTest.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json(modelTests);
  } catch (error) {
    next(error);
  }
};

// 获取单个模型测试
exports.getModelTestById = async (req, res, next) => {
  try {
    const modelTest = await models.ModelTest.findByPk(req.params.id);
    
    if (!modelTest) {
      return res.status(404).json({ message: '模型测试不存在' });
    }
    
    res.status(200).json(modelTest);
  } catch (error) {
    next(error);
  }
};

// 根据测试ID获取模型测试
exports.getModelTestsByTestId = async (req, res, next) => {
  try {
    const testId = req.params.testId;
    const modelTests = await models.ModelTest.findAll({
      where: { testId },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json(modelTests);
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
    
    // 验证测试和模型是否存在
    const test = await models.Test.findByPk(testId);
    const model = await models.Model.findByPk(modelId);
    
    if (!test) {
      return res.status(404).json({ message: '测试不存在' });
    }
    
    if (!model) {
      return res.status(404).json({ message: '模型不存在' });
    }
    
    const modelTest = await models.ModelTest.create({
      id: uuidv4(),
      testId,
      modelId,
      status: 'pending',
      createdAt: new Date()
    });
    
    res.status(201).json(modelTest);
    
    // 异步处理模型测试，不阻塞响应
    processModelTest(modelTest.id).catch(err => 
      console.error(`处理模型测试 ${modelTest.id} 时出错:`, err)
    );
  } catch (error) {
    next(error);
  }
};

// 更新模型测试结果
exports.updateModelTestResult = async (req, res, next) => {
  try {
    const { result, status } = req.body;
    const modelTest = await models.ModelTest.findByPk(req.params.id);
    
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

// 删除模型测试
exports.deleteModelTest = async (req, res, next) => {
  try {
    const modelTest = await models.ModelTest.findByPk(req.params.id);
    
    if (!modelTest) {
      return res.status(404).json({ message: '模型测试不存在' });
    }
    
    await modelTest.destroy();
    
    res.status(200).json({ message: '模型测试已删除' });
  } catch (error) {
    next(error);
  }
};

// 模拟处理模型测试
async function processModelTest(id) {
  try {
    // 获取模型测试
    const modelTest = await models.ModelTest.findByPk(id);
    if (!modelTest) {
      throw new Error(`找不到模型测试 ${id}`);
    }
    
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 更新为完成状态
    await modelTest.update({
      status: 'completed',
      result: { 
        message: '测试完成',
        timestamp: new Date().toISOString(),
        success: true
      }
    });
    
    console.log(`模型测试 ${id} 已处理完成`);
  } catch (error) {
    console.error(`处理模型测试 ${id} 失败:`, error);
    
    // 尝试更新为失败状态
    try {
      const modelTest = await models.ModelTest.findByPk(id);
      if (modelTest) {
        await modelTest.update({
          status: 'failed'
        });
      }
    } catch (innerError) {
      console.error(`更新模型测试 ${id} 状态失败:`, innerError);
    }
  }
} 