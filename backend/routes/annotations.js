const express = require('express');
const router = express.Router();
const annotationController = require('../controllers/annotationController');

// 获取指定测试的标注
router.get('/:testId', annotationController.getAnnotationByTestId);

// 创建或更新标注
router.post('/', annotationController.createOrUpdateAnnotation);

// 通过testId更新标注
router.put('/:testId', annotationController.updateAnnotationByTestId);

module.exports = router; 