const { v4: uuidv4 } = require('uuid');
const { Model } = require('../database/models');

// 获取所有模型
exports.getAllModels = async (req, res, next) => {
  try {
    const models = await Model.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json(models);
  } catch (error) {
    next(error);
  }
};

// 获取单个模型
exports.getModelById = async (req, res, next) => {
  try {
    const model = await Model.findByPk(req.params.id);
    
    if (!model) {
      return res.status(404).json({ message: '模型不存在' });
    }
    
    res.status(200).json(model);
  } catch (error) {
    next(error);
  }
};

// 创建模型
exports.createModel = async (req, res, next) => {
  try {
    const { name, apiEndpoint } = req.body;
    
    if (!name || !apiEndpoint) {
      return res.status(400).json({ message: '缺少必要字段' });
    }
    
    const model = await Model.create({
      id: uuidv4(),
      name,
      apiEndpoint,
      createdAt: new Date()
    });
    
    res.status(201).json(model);
  } catch (error) {
    next(error);
  }
};

// 更新模型
exports.updateModel = async (req, res, next) => {
  try {
    const { name, apiEndpoint } = req.body;
    const model = await Model.findByPk(req.params.id);
    
    if (!model) {
      return res.status(404).json({ message: '模型不存在' });
    }
    
    await model.update({
      name: name || model.name,
      apiEndpoint: apiEndpoint || model.apiEndpoint
    });
    
    res.status(200).json(model);
  } catch (error) {
    next(error);
  }
};

// 删除模型
exports.deleteModel = async (req, res, next) => {
  try {
    const model = await Model.findByPk(req.params.id);
    
    if (!model) {
      return res.status(404).json({ message: '模型不存在' });
    }
    
    await model.destroy();
    
    res.status(200).json({ message: '模型已删除' });
  } catch (error) {
    next(error);
  }
}; 