const express = require('express');
const router = express.Router();
const modelController = require('../controllers/modelController');

// 获取所有模型
router.get('/', modelController.getAllModels);

// 获取单个模型
router.get('/:id', modelController.getModelById);

// 创建模型
router.post('/', modelController.createModel);

// 更新模型
router.put('/:id', modelController.updateModel);

// 删除模型
router.delete('/:id', modelController.deleteModel);

module.exports = router; 