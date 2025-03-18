const express = require('express');
const router = express.Router();
const annotationController = require('../controllers/annotationController');

// 获取所有标注
router.get('/', annotationController.getAllAnnotations);

// 获取指定测试的标注
router.get('/:testId', annotationController.getAnnotationByTestId);

// 创建或更新标注
router.post('/:testId', annotationController.createOrUpdateAnnotation);

// 删除标注
router.delete('/:testId', annotationController.deleteAnnotation);

module.exports = router; 