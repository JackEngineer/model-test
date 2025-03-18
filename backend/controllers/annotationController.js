const { v4: uuidv4 } = require('uuid');
const { models } = require('../database/db');

// 获取所有标注
exports.getAllAnnotations = async (req, res, next) => {
  try {
    const annotations = await models.Annotation.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json(annotations);
  } catch (error) {
    next(error);
  }
};

// 根据测试ID获取标注
exports.getAnnotationByTestId = async (req, res, next) => {
  try {
    const testId = req.params.testId;
    const annotation = await models.Annotation.findOne({
      where: { testId }
    });
    
    if (!annotation) {
      return res.status(404).json({ message: '未找到标注数据' });
    }
    
    res.status(200).json(annotation);
  } catch (error) {
    next(error);
  }
};

// 创建或更新测试标注
exports.createOrUpdateAnnotation = async (req, res, next) => {
  try {
    const testId = req.params.testId;
    const annotationData = req.body;
    
    if (!annotationData) {
      return res.status(400).json({ message: '缺少标注数据' });
    }
    
    // 查找是否已存在
    let annotation = await models.Annotation.findOne({
      where: { testId }
    });
    
    if (annotation) {
      // 更新现有标注
      await annotation.update({
        data: annotationData
      });
    } else {
      // 创建新标注
      annotation = await models.Annotation.create({
        id: uuidv4(),
        testId,
        data: annotationData,
        createdAt: new Date()
      });
    }
    
    res.status(200).json(annotation);
  } catch (error) {
    next(error);
  }
};

// 删除标注
exports.deleteAnnotation = async (req, res, next) => {
  try {
    const testId = req.params.testId;
    const annotation = await models.Annotation.findOne({
      where: { testId }
    });
    
    if (!annotation) {
      return res.status(404).json({ message: '未找到标注数据' });
    }
    
    await annotation.destroy();
    
    res.status(200).json({ message: '标注数据已删除' });
  } catch (error) {
    next(error);
  }
}; 