const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = path.join(__dirname, '../database.sqlite');

// 检查数据库文件是否存在，如果存在且有同步错误，可以考虑备份并创建新的
const checkAndBackupDatabase = () => {
  if (fs.existsSync(dbPath)) {
    // 检查是否设置了环境变量来强制重置数据库
    if (process.env.RESET_DB === 'true') {
      console.log('根据环境变量设置，正在重置数据库...');
      const backupPath = `${dbPath}.backup.${Date.now()}`;
      fs.copyFileSync(dbPath, backupPath);
      console.log(`已将原数据库备份到 ${backupPath}`);
      fs.unlinkSync(dbPath);
      console.log('原数据库文件已删除，将创建新的数据库文件');
      return true;
    }
  }
  return false;
};

// 执行检查和备份
const databaseReset = checkAndBackupDatabase();

// 创建数据库连接
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, // 设为true可以在控制台看到SQL查询
  define: {
    // 在模型定义中添加默认选项，禁用外键约束检查，避免同步时的问题
    timestamps: false,
    freezeTableName: true
  }
});

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接已建立');
    return true;
  } catch (error) {
    console.error('无法连接到数据库:', error);
    return false;
  }
};

// 同步模型到数据库
const syncModels = async () => {
  try {
    // 强制创建表，这将删除现有表并重新创建
    await sequelize.sync({ force: true });
    console.log('数据库模型同步成功');
    return true;
  } catch (error) {
    console.error('数据库模型同步失败:', error);
    return false;
  }
};

// 初始化所有模型
const initModels = () => {
  // 注册模型
  const Test = require('./models/test')(sequelize);
  const Model = require('./models/model')(sequelize);
  const ModelTest = require('./models/modelTest')(sequelize);
  const Annotation = require('./models/annotation')(sequelize);
  const ApiConfig = require('./models/apiConfig')(sequelize);

  // 设置模型关联关系
  Test.hasMany(ModelTest, { foreignKey: 'test_id', as: 'modelTests' });
  ModelTest.belongsTo(Test, { foreignKey: 'test_id', as: 'test' });
  
  Model.hasMany(ModelTest, { foreignKey: 'model_id', as: 'modelTests' });
  ModelTest.belongsTo(Model, { foreignKey: 'model_id', as: 'model' });

  return {
    Test,
    Model,
    ModelTest,
    Annotation,
    ApiConfig
  };
};

// 执行模型初始化
const models = initModels();

// 导出模块
module.exports = { sequelize, testConnection, syncModels, models }; 