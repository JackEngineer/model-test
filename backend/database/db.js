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

// 同步所有模型
const syncModels = async () => {
  try {
    // 如果数据库被重置或不存在，使用force:true创建所有表
    // 否则尝试使用alter:true更新表结构
    const syncOptions = databaseReset ? 
      { force: true } : 
      { force: false, alter: true };
    
    // 在同步前，避免外键约束问题
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    
    await sequelize.sync(syncOptions);
    
    // 同步后，重新启用外键约束
    await sequelize.query('PRAGMA foreign_keys = ON;');
    
    console.log('所有模型已同步到数据库');
    return true;
  } catch (error) {
    console.error('同步模型失败:', error);
    // 即使模型同步失败，也不应该阻止服务器启动
    // 先前的数据和表结构可能仍然可用
    return false;
  }
};

module.exports = { sequelize, testConnection, syncModels }; 