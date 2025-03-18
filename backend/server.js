const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { testConnection, syncModels } = require('./database/db');
const net = require('net');

// 导入路由
const testRoutes = require('./routes/tests');
const modelRoutes = require('./routes/models');
const annotationRoutes = require('./routes/annotations');
const modelTestRoutes = require('./routes/modelTests');
const apiConfigRoutes = require('./routes/apiConfigs');

// 导入错误处理中间件
const errorHandler = require('./middleware/errorHandler');

// 创建Express应用
const app = express();
const DEFAULT_PORT = process.env.PORT || 3000;

// 检查端口是否被占用
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      // 端口已被占用
      resolve(true);
    });
    server.once('listening', () => {
      // 端口可用
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
};

// 查找可用端口
const findAvailablePort = async (startPort, maxAttempts = 10) => {
  let port = startPort;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (!(await isPortInUse(port))) {
      return port;
    }
    port = startPort + attempt + 1;
  }
  throw new Error(`无法找到可用端口，尝试了${maxAttempts}次`);
};

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 路由
app.use('/api/tests', testRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/annotations', annotationRoutes);
app.use('/api/model-tests', modelTestRoutes);
app.use('/api/api-configs', apiConfigRoutes);

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    
    if (dbConnected) {
      // 同步模型到数据库
      const modelsSynced = await syncModels();
      if (!modelsSynced) {
        console.warn('数据库模型同步失败，服务器将继续启动，但某些功能可能不可用');
      }
    } else {
      console.warn('数据库连接失败，服务器将以有限功能模式启动');
    }
    
    // 查找可用端口
    let port;
    try {
      port = await findAvailablePort(DEFAULT_PORT);
    } catch (error) {
      console.warn('无法找到可用端口，将使用随机端口');
      port = 0; // 使用随机端口
    }
    
    // 启动服务器，无论数据库操作是否成功
    const server = app.listen(port, () => {
      const actualPort = server.address().port;
      console.log(`服务器运行在端口 ${actualPort}`);
      console.log(`API可通过 http://localhost:${actualPort}/api 访问`);
      
      // 显示重要的API端点
      console.log('可用API端点:');
      console.log(`- 健康检查: http://localhost:${actualPort}/api/health`);
      console.log(`- 测试列表: http://localhost:${actualPort}/api/tests`);
      console.log(`- API配置: http://localhost:${actualPort}/api/api-configs/default`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer(); 