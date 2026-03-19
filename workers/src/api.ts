/**
 * API 路由定义
 * 处理题目获取、成绩上传、排行榜等接口
 */

import { Hono, Context } from 'hono';

// 创建 API 路由
export const apiRoutes = new Hono();

// ==================== 获取题目 ====================

/**
 * GET /api/questions
 * 获取随机题目
 * 
 * 查询参数:
 * - mode: 'practice' | 'mock' - 考试模式
 * - count: number - 题目数量，默认 30
 */
apiRoutes.get('/questions', async (c: Context) => {
  const mode = c.req.query('mode') || 'mock';
  const count = parseInt(c.req.query('count') || '30', 10);
  
  // 获取数据库连接
  const db = c.env?.DB;
  
  if (!db) {
    // 本地测试模式：返回模拟数据
    return c.json({
      success: true,
      data: getMockQuestions(count),
      count: count,
      mode: mode
    });
  }
  
  try {
    // 从 D1 数据库随机获取题目
    const query = `
      SELECT id, question_text, option_a, option_b, option_c, option_d, correct_answer, image_url
      FROM questions
      ORDER BY RANDOM()
      LIMIT ?
    `;
    
    const stmt = db.prepare(query).bind(count);
    const { results } = await stmt.all();
    
    return c.json({
      success: true,
      data: results,
      count: results.length,
      mode: mode
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('获取题目失败:', error);
    return c.json({
      success: false,
      error: '获取题目失败',
      data: getMockQuestions(count)  // 返回模拟数据作为降级
    });
  }
});

// ==================== 上传成绩 ====================

/**
 * POST /api/score
 * 上传成绩到排行榜
 * 
 * 请求体:
 * - user_id: string - 用户唯一标识
 * - user_name: string - 用户姓名
 * - registration_number: string - 报名号
 * - mode: 'practice' | 'mock' - 考试模式
 * - score: number - 分数
 * - total_questions: number - 题目总数
 */
apiRoutes.post('/score', async (c: Context) => {
  const body = await c.req.json();
  const {
    user_id,
    user_name,
    registration_number,
    mode,
    score,
    total_questions = 30
  } = body;
  
  // 验证必填字段
  if (!user_id || !registration_number || mode === undefined || score === undefined) {
    return c.json({
      success: false,
      error: '缺少必填字段'
    }, 400);
  }
  
  // 获取数据库连接
  const db = (c as any).env?.DB;
  
  if (!db) {
    // 本地测试模式
    // eslint-disable-next-line no-console
    console.log('[模拟] 上传成绩:', { user_name, score, mode });
    return c.json({
      success: true,
      data: {
        score_id: Date.now(),
        rank: Math.floor(Math.random() * 100) + 1
      },
      message: '本地测试模式，未实际存储'
    });
  }
  
  try {
    // 插入成绩记录
    const query = `
      INSERT INTO scores (user_id, user_name, registration_number, mode, score, total_questions)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const stmt = db.prepare(query).bind(
      user_id,
      user_name || '匿名',
      registration_number,
      mode,
      score,
      total_questions
    );
    
    await stmt.run();
    
    // 获取当前排名
    const rankQuery = `
      SELECT COUNT(*) + 1 as rank
      FROM scores
      WHERE mode = ? AND score > ?
    `;
    
    const rankStmt = db.prepare(rankQuery).bind(mode, score);
    const rankResult: any = await rankStmt.first();
    
    return c.json({
      success: true,
      data: {
        score_id: Date.now(),
        rank: rankResult?.rank || 1
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('上传成绩失败:', error);
    return c.json({
      success: false,
      error: '上传成绩失败'
    }, 500);
  }
});

// ==================== 获取排行榜 ====================

/**
 * GET /api/leaderboard
 * 获取排行榜
 * 
 * 查询参数:
 * - mode: 'practice' | 'mock' - 考试模式
 * - limit: number - 返回数量，默认 10
 */
apiRoutes.get('/leaderboard', async (c: Context) => {
  const mode = c.req.query('mode') || 'mock';
  const limit = parseInt(c.req.query('limit') || '10', 10);
  
  // 获取数据库连接
  const db = (c as any).env?.DB;
  
  if (!db) {
    // 本地测试模式：返回模拟排行榜
    return c.json({
      success: true,
      data: getMockLeaderboard(mode, limit)
    });
  }
  
  try {
    // 从 D1 数据库获取排行榜
    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as rank,
        user_name,
        registration_number,
        score,
        total_questions,
        created_at
      FROM scores
      WHERE mode = ?
      ORDER BY score DESC, created_at ASC
      LIMIT ?
    `;
    
    const stmt = db.prepare(query).bind(mode, limit);
    const { results } = await stmt.all();
    
    return c.json({
      success: true,
      data: results
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('获取排行榜失败:', error);
    return c.json({
      success: false,
      error: '获取排行榜失败',
      data: getMockLeaderboard(mode, limit)  // 返回模拟数据作为降级
    });
  }
});

// ==================== 模拟数据函数 ====================

/**
 * 生成模拟题目数据
 */
function getMockQuestions(count: number) {
  const questions = [
    { id: 1, question_text: "下列哪种物质属于氧化物？", option_a: "H₂O", option_b: "NaCl", option_c: "O₂", option_d: "H₂SO₄", correct_answer: "A", image_url: null },
    { id: 2, question_text: "光合作用的主要产物是什么？", option_a: "二氧化碳和水", option_b: "葡萄糖和氧气", option_c: "淀粉和氮气", option_d: "蛋白质和水", correct_answer: "B", image_url: null },
    { id: 3, question_text: "下列哪个器官是人体的主要解毒器官？", option_a: "心脏", option_b: "肺", option_c: "肝脏", option_d: "肾脏", correct_answer: "C", image_url: null },
    { id: 4, question_text: "水的沸点是多少摄氏度（标准大气压下）？", option_a: "90°C", option_b: "100°C", option_c: "110°C", option_d: "120°C", correct_answer: "B", image_url: null },
    { id: 5, question_text: "下列哪种元素是金属元素？", option_a: "氧", option_b: "碳", option_c: "铁", option_d: "氮", correct_answer: "C", image_url: null },
  ];
  
  // 随机选择并打乱
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 生成模拟排行榜数据
 */
function getMockLeaderboard(mode: string, limit: number) {
  const mockData = [
    { rank: 1, user_name: "张三", registration_number: "100001", score: 30, total_questions: 30, created_at: "2024-01-01T10:00:00Z" },
    { rank: 2, user_name: "李四", registration_number: "100002", score: 29, total_questions: 30, created_at: "2024-01-02T10:00:00Z" },
    { rank: 3, user_name: "王五", registration_number: "100003", score: 28, total_questions: 30, created_at: "2024-01-03T10:00:00Z" },
    { rank: 4, user_name: "赵六", registration_number: "100004", score: 27, total_questions: 30, created_at: "2024-01-04T10:00:00Z" },
    { rank: 5, user_name: "钱七", registration_number: "100005", score: 26, total_questions: 30, created_at: "2024-01-05T10:00:00Z" },
  ];
  
  return mockData.slice(0, limit);
}
