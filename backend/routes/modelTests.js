const express = require('express');
const router = express.Router();
const modelTestController = require('../controllers/modelTestController');

// 获取所有模型测试
router.get('/', modelTestController.getAllModelTests);

// 获取单个模型测试
router.get('/:id', modelTestController.getModelTestById);

// 获取特定测试ID的模型测试列表
router.get('/test/:testId', modelTestController.getModelTestsByTestId);

// 创建模型测试
router.post('/', modelTestController.createModelTest);

// 更新模型测试结果
router.put('/:id', modelTestController.updateModelTestResult);

// 删除模型测试
router.delete('/:id', modelTestController.deleteModelTest);

module.exports = router; 