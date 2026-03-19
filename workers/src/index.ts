/**
 * 模拟考试抽题系统 - Cloudflare Workers API
 * 
 * 使用 Hono 框架处理路由和中间件
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { apiRoutes } from './api';

// 创建 Hono 应用
const app = new Hono();

// 全局 CORS 中间件
app.use('/*', cors({
  origin: '*',  // 生产环境应限制为具体域名
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// API 路由
app.route('/api', apiRoutes);

// 健康检查端点
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 404 处理
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: '请求的接口不存在'
  }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message || '服务器内部错误'
  }, 500);
});

// 导出 Worker
export default app;
