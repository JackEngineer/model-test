const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

// 获取所有测试
router.get('/', testController.getAllTests);

// 获取单个测试
router.get('/:id', testController.getTestById);

// 创建测试
router.post('/', testController.createTest);

// 更新测试
router.put('/:id', testController.updateTest);

// 删除测试
router.delete('/:id', testController.deleteTest);

module.exports = router; 