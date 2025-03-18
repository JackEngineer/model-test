const express = require('express');
const router = express.Router();
const apiConfigController = require('../controllers/apiConfigController');

// 获取所有API配置
router.get('/', apiConfigController.getAllApiConfigs);

// 获取默认API配置
router.get('/default', apiConfigController.getDefaultApiConfig);

// 创建或更新API配置
router.post('/', apiConfigController.createOrUpdateApiConfig);

module.exports = router; 