const { v4: uuidv4 } = require('uuid');
const { Annotation, Test } = require('../database/models');

// 获取指定测试的标注
exports.getAnnotationByTestId = async (req, res, next) => {
  try {
    const { testId } = req.params;
    
    // 检查测试是否存在
    const test = await Test.findByPk(testId);
    if (!test) {
      return res.status(404).json({ message: '测试不存在' });
    }
    
    // 查找该测试的标注
    const annotation = await Annotation.findOne({
      where: { testId }
    });
    
    if (!annotation) {
      return res.status(404).json({ message: '标注不存在' });
    }
    
    res.status(200).json(annotation);
  } catch (error) {
    next(error);
  }
};

// 创建或更新标注
exports.createOrUpdateAnnotation = async (req, res, next) => {
  try {
    const { testId, data } = req.body;
    
    if (!testId || !data) {
      return res.status(400).json({ message: '缺少必要字段' });
    }
    
    // 检查测试是否存在
    const test = await Test.findByPk(testId);
    if (!test) {
      return res.status(404).json({ message: '测试不存在' });
    }
    
    // 查找是否已存在该测试的标注
    let annotation = await Annotation.findOne({
      where: { testId }
    });
    
    if (annotation) {
      // 更新现有标注
      await annotation.update({ data });
    } else {
      // 创建新标注
      annotation = await Annotation.create({
        id: uuidv4(),
        testId,
        data,
        createdAt: new Date()
      });
    }
    
    res.status(200).json(annotation);
  } catch (error) {
    next(error);
  }
};

// 通过testId更新标注
exports.updateAnnotationByTestId = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { data } = req.body;
    
    if (!testId || !data) {
      return res.status(400).json({ message: '缺少必要字段' });
    }
    
    // 检查测试是否存在
    const test = await Test.findByPk(testId);
    if (!test) {
      return res.status(404).json({ message: '测试不存在' });
    }
    
    // 查找是否已存在该测试的标注
    let annotation = await Annotation.findOne({
      where: { testId }
    });
    
    if (!annotation) {
      return res.status(404).json({ message: '标注不存在' });
    }
    
    // 更新标注
    await annotation.update({ data });
    
    res.status(200).json(annotation);
  } catch (error) {
    next(error);
  }
}; 