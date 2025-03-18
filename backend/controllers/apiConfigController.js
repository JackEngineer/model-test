const { v4: uuidv4 } = require('uuid');
const { models } = require('../database/db');

// 获取所有API配置
exports.getAllApiConfigs = async (req, res, next) => {
  try {
    const configs = await models.ApiConfig.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json(configs);
  } catch (error) {
    next(error);
  }
};

// 获取默认API配置
exports.getDefaultApiConfig = async (req, res, next) => {
  try {
    const config = await models.ApiConfig.findOne({
      where: { isDefault: true }
    });
    
    if (!config) {
      // 返回一个空的配置对象而不是404错误
      return res.status(200).json({
        id: null,
        models: [],
        defaultModelId: null,
        isDefault: true
      });
    }
    
    res.status(200).json(config);
  } catch (error) {
    next(error);
  }
};

// 创建或更新API配置
exports.createOrUpdateApiConfig = async (req, res, next) => {
  try {
    const { models: modelsList, defaultModelId, isDefault } = req.body;
    
    // 如果设置为默认配置，先将其他配置设为非默认
    if (isDefault) {
      await models.ApiConfig.update(
        { isDefault: false },
        { where: { isDefault: true } }
      );
    }
    
    // 查找是否已存在API配置（简单起见只保留一个配置）
    let config = await models.ApiConfig.findOne({
      where: { isDefault: true }
    });
    
    if (config) {
      // 更新现有配置
      await config.update({
        models: modelsList || config.models || [],
        defaultModelId: defaultModelId || config.defaultModelId,
        isDefault: isDefault ?? config.isDefault
      });
    } else {
      // 创建新配置
      config = await models.ApiConfig.create({
        id: uuidv4(),
        models: modelsList || [],
        defaultModelId: defaultModelId || null,
        isDefault: isDefault ?? true, // 第一个配置默认为默认配置
        createdAt: new Date()
      });
    }
    
    res.status(200).json(config);
  } catch (error) {
    next(error);
  }
}; 