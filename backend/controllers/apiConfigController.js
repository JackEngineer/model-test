const { v4: uuidv4 } = require('uuid');
const { ApiConfig } = require('../database/models');

// 获取所有API配置
exports.getAllApiConfigs = async (req, res, next) => {
  try {
    const configs = await ApiConfig.findAll({
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
    const config = await ApiConfig.findOne({
      where: { isDefault: true }
    });
    
    if (!config) {
      // 返回一个空的配置对象而不是404错误
      return res.status(200).json({
        id: null,
        accessKeyId: "",
        accessKeySecret: "",
        endpoint: "https://bailian.aliyuncs.com",
        modelId: "qwen-2.5-72b-instruct",
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
    const { accessKeyId, accessKeySecret, endpoint, modelId, isDefault } = req.body;
    
    if (!accessKeyId) {
      return res.status(400).json({ message: '缺少必要字段' });
    }
    
    // 如果设置为默认配置，先将其他配置设为非默认
    if (isDefault) {
      await ApiConfig.update(
        { isDefault: false },
        { where: { isDefault: true } }
      );
    }
    
    // 查找是否已存在API配置（简单起见只保留一个配置）
    let config = await ApiConfig.findOne();
    
    if (config) {
      // 更新现有配置
      await config.update({
        accessKeyId,
        accessKeySecret: accessKeySecret || config.accessKeySecret,
        endpoint: endpoint || config.endpoint,
        modelId: modelId || config.modelId,
        isDefault: isDefault ?? config.isDefault
      });
    } else {
      // 创建新配置
      config = await ApiConfig.create({
        id: uuidv4(),
        accessKeyId,
        accessKeySecret: accessKeySecret || "",
        endpoint: endpoint || "https://bailian.aliyuncs.com",
        modelId: modelId || "qwen-2.5-72b-instruct",
        isDefault: isDefault ?? true, // 第一个配置默认为默认配置
        createdAt: new Date()
      });
    }
    
    res.status(200).json(config);
  } catch (error) {
    next(error);
  }
}; 