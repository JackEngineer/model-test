/**
 * 错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  console.error('错误:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = errorHandler; 