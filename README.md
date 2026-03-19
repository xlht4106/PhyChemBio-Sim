# 理化生实验考试 (PhyChemBio-Sim)

一个基于 Cloudflare 免费版部署的理化生实验考试系统，支持训练模式和模拟考试模式。

## 📋 功能特性

- **登录页面**：蓝色背景，输入报名号，选择考试类型
- **训练模式**：无时间限制，交卷后显示错题和总分
- **模拟考试**：20 分钟倒计时，剩余 5 分钟才可交卷，只显示总分
- **排行榜**：可选上传成绩到排行榜（Cloudflare Workers + D1）
- **响应式设计**：适配桌面和移动设备

## 🛠️ 技术栈

| 组件     | 技术                   |
| -------- | ---------------------- |
| 前端托管 | Cloudflare Pages       |
| 前端框架 | 原生 JavaScript (ES6+) |
| 后端 API | Cloudflare Workers     |
| 数据库   | Cloudflare D1 (SQLite) |
| 样式     | CSS3                   |

## 📁 项目结构

```
PhyChemBio-Sim/
├── public/
│   ├── index.html          # 登录页
│   ├── exam.html           # 答题页
│   ├── result.html         # 结果页
│   └── static/
│       ├── style.css       # 全局样式
│       ├── login.js        # 登录页逻辑
│       ├── exam.js         # 答题页逻辑
│       └── result.js       # 结果页逻辑
├── workers/
│   ├── src/
│   │   ├── index.ts        # Workers 入口
│   │   ├── api.ts          # API 路由
│   │   └── db.ts           # D1 数据库操作
│   ├── wrangler.toml       # Workers 配置
│   └── package.json
├── scripts/
│   └── parse_excel.py      # Excel 解析脚本（后续）
├── data/
│   ├── questions.json      # 题目数据
│   └── init-db.sql         # D1 初始化脚本
├── plans/
│   └── architecture.md     # 架构设计文档
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- Python >= 3.8（可选，用于 Excel 解析）
- Wrangler CLI（Cloudflare 部署工具）

### 本地开发

#### 前端本地测试

```bash
# 方式 1：使用 live-server（推荐）
npx live-server public

# 方式 2：使用 Python
python -m http.server 8080 -d public
```

然后访问 `http://localhost:8000` 或 `http://localhost:8080`

#### 后端本地测试

```bash
cd workers
npx wrangler dev
```

#### 完整开发流程

```bash
# 1. 克隆项目
git clone <repository-url>
cd PhyChemBio-Sim

# 2. 安装 Workers 依赖
cd workers
npm install

# 3. 启动前端（终端 1）
npx live-server public

# 4. 启动后端（终端 2）
cd workers
npx wrangler dev
```

## ☁️ 部署到 Cloudflare

### 前置准备

1. 注册 [Cloudflare 账号](https://dash.cloudflare.com/sign-up)
2. 安装 Wrangler CLI：
   ```bash
   npm install -g wrangler
   ```
3. 登录 Cloudflare：
   ```bash
   wrangler login
   ```

### 部署 D1 数据库

```bash
# 创建数据库
wrangler d1 create phychembio-sim

# 记录输出中的 database_id

# 初始化数据库结构
wrangler d1 execute phychembio-sim --file=data/init-db.sql
```

### 部署 Workers

1. 更新 `workers/wrangler.toml` 中的 `database_id`
2. 部署：
   ```bash
   cd workers
   wrangler deploy
   ```
3. 记录 Workers URL（如 `https://phychembio-sim-api.your-subdomain.workers.dev`）

### 部署 Pages

1. 更新 `public/static/exam.js` 中的 API URL
2. 部署：
   ```bash
   cd public
   wrangler pages deploy . --project-name=phychembio-sim
   ```

### 免费版限额

| 服务    | 免费额度                       |
| ------- | ------------------------------ |
| Pages   | 无限                           |
| Workers | 10 万次请求/天                 |
| D1      | 100 万行读取/天，5 万次写入/天 |

## 📊 数据库设计

### questions 表

```sql
CREATE TABLE questions (
    id INTEGER PRIMARY KEY,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### scores 表

```sql
CREATE TABLE scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    user_name TEXT,
    registration_number TEXT NOT NULL,
    mode TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL DEFAULT 30,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API 接口

### GET /api/questions

获取随机题目

```bash
GET /api/questions?mode=mock&count=30
```

### POST /api/score

上传成绩

```bash
POST /api/score
Content-Type: application/json

{
  "user_id": "...",
  "user_name": "张三",
  "registration_number": "123456",
  "mode": "mock",
  "score": 28
}
```

### GET /api/leaderboard

获取排行榜

```bash
GET /api/leaderboard?mode=mock&limit=10
```

## 📝 后续计划

- [ ] 区统一模拟考试
- [ ] 市统一考试
- [ ] Excel 题库解析脚本
- [ ] 用户自定义头像上传
- [ ] 错题本功能
- [ ] 答题记录历史
- [ ] 管理员后台（题库管理）

## 📄 许可证

GPLv3

## 👥 贡献

欢迎提交 Issue 和 Pull Request！
