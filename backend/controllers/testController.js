const { v4: uuidv4 } = require('uuid');
const { Test } = require('../database/models');

// 获取所有测试
exports.getAllTests = async (req, res, next) => {
  try {
    const tests = await Test.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json(tests);
  } catch (error) {
    next(error);
  }
};

// 获取单个测试
exports.getTestById = async (req, res, next) => {
  try {
    const test = await Test.findByPk(req.params.id);
    
    if (!test) {
      return res.status(404).json({ message: '测试不存在' });
    }
    
    res.status(200).json(test);
  } catch (error) {
    next(error);
  }
};

// 创建测试
exports.createTest = async (req, res, next) => {
  try {
    const { name, text, extractionType } = req.body;
    
    if (!name || !text || !extractionType) {
      return res.status(400).json({ message: '缺少必要字段' });
    }
    
    const test = await Test.create({
      id: uuidv4(),
      name,
      text,
      extractionType,
      createdAt: new Date()
    });
    
    res.status(201).json(test);
  } catch (error) {
    next(error);
  }
};

// 更新测试
exports.updateTest = async (req, res, next) => {
  try {
    const { name, text, extractionType } = req.body;
    const test = await Test.findByPk(req.params.id);
    
    if (!test) {
      return res.status(404).json({ message: '测试不存在' });
    }
    
    await test.update({
      name: name || test.name,
      text: text || test.text,
      extractionType: extractionType || test.extractionType
    });
    
    res.status(200).json(test);
  } catch (error) {
    next(error);
  }
};

// 删除测试
exports.deleteTest = async (req, res, next) => {
  try {
    const test = await Test.findByPk(req.params.id);
    
    if (!test) {
      return res.status(404).json({ message: '测试不存在' });
    }
    
    await test.destroy();
    
    res.status(200).json({ message: '测试已删除' });
  } catch (error) {
    next(error);
  }
}; 