# Cloudflare 部署指南

本文档说明如何将模拟考试抽题系统部署到 Cloudflare Pages 和 Workers。

## 前置准备

### 1. 注册 Cloudflare 账号

访问 [Cloudflare 官网](https://dash.cloudflare.com/sign-up) 注册免费账号。

### 2. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 3. 登录 Cloudflare

```bash
wrangler login
```

浏览器会打开授权页面，点击授权即可。

---

## 部署 D1 数据库

### 步骤 1：创建数据库

```bash
wrangler d1 create phychembio-sim
```

输出示例：

```
✅ Successfully created DB 'phychembio-sim' in region UNKNOWN
database_id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**重要**：复制 `database_id`，后续需要用到。

### 步骤 2：更新 wrangler.toml

编辑 `workers/wrangler.toml`，填入 `database_id`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "phychembio-sim"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # 填入实际的 database_id
```

### 步骤 3：初始化数据库

```bash
cd workers
wrangler d1 execute phychembio-sim --file=../data/init-db.sql
```

### 步骤 4：验证数据

```bash
wrangler d1 execute phychembio-sim --command="SELECT COUNT(*) FROM questions"
```

---

## 部署 Workers API

### 步骤 1：更新配置

编辑 `workers/wrangler.toml`：

```toml
name = "phychembio-sim-api"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "phychembio-sim"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

[vars]
CORS_ORIGIN = "https://your-pages-url.pages.dev"  # 填入 Pages 部署后的域名
ENVIRONMENT = "production"
```

### 步骤 2：安装依赖

```bash
cd workers
npm install
```

### 步骤 3：部署 Workers

```bash
wrangler deploy
```

输出示例：

```
Deployed phychembio-sim-api triggers:
https://phychembio-sim-api.your-subdomain.workers.dev
```

**重要**：复制 Workers URL，后续需要用到。

### 步骤 4：测试 API

```bash
# 测试获取题目
curl https://phychembio-sim-api.your-subdomain.workers.dev/api/questions

# 测试健康检查
curl https://phychembio-sim-api.your-subdomain.workers.dev/health
```

---

## 部署 Pages 前端

### 方式 1：使用 Wrangler CLI 部署

```bash
# 更新前端 API URL
# 编辑 public/static/exam.js 和 public/static/result.js
const CONFIG = {
    API_BASE_URL: 'https://phychembio-sim-api.your-subdomain.workers.dev'
};

# 部署
cd public
wrangler pages deploy . --project-name=phychembio-sim
```

### 方式 2：使用 GitHub 自动部署（推荐）

1. **创建 GitHub 仓库**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/phychembio-sim.git
git push -u origin main
```

2. **在 Cloudflare Dashboard 配置**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 进入 **Workers & Pages** → **Create application** → **Pages**
   - 选择 **Connect to Git**
   - 选择你的仓库
   - 配置构建设置：
     - **Production branch**: `main`
     - **Build command**: (留空，纯静态)
     - **Build output directory**: `public`
   - 点击 **Save and Deploy**

3. **配置环境变量**
   - 进入 Pages 项目设置
   - 添加环境变量：
     - `VITE_API_URL`: `https://phychembio-sim-api.your-subdomain.workers.dev`

---

## 自定义域名（可选）

### Pages 自定义域名

1. 进入 Pages 项目设置
2. 选择 **Custom domains**
3. 添加你的域名

### Workers 自定义域名

1. 进入 Workers 项目设置
2. 选择 **Triggers** → **Custom domains**
3. 添加你的域名

---

## 验证部署

### 检查清单

- [ ] Pages 网站可以正常访问
- [ ] 登录页显示正常
- [ ] 可以输入报名号并选择考试类型
- [ ] 答题页题目加载正常
- [ ] 倒计时功能正常（模拟考试）
- [ ] 交卷功能正常
- [ ] 结果页显示正常
- [ ] Workers API 可以正常访问
- [ ] 成绩可以上传到 D1 数据库
- [ ] 排行榜可以正常显示

### 测试 API

```bash
# 获取题目
curl "https://phychembio-sim-api.your-subdomain.workers.dev/api/questions?mode=mock&count=5"

# 上传成绩
curl -X POST "https://phychembio-sim-api.your-subdomain.workers.dev/api/score" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test123",
    "user_name": "测试用户",
    "registration_number": "123456",
    "mode": "mock",
    "score": 28,
    "total_questions": 30
  }'

# 获取排行榜
curl "https://phychembio-sim-api.your-subdomain.workers.dev/api/leaderboard?mode=mock&limit=10"
```

---

## 免费版限额说明

| 服务    | 免费额度        | 说明                    |
| ------- | --------------- | ----------------------- |
| Pages   | 无限            | 包含无限请求和带宽      |
| Workers | 10 万次请求/天  | 包含 10ms CPU 时间/请求 |
| D1      | 100 万行读取/天 | 5 万次写入/天，1GB 存储 |

对于中小型考试应用，免费额度通常足够使用。

---

## 故障排查

### Workers 部署失败

```bash
# 查看详细日志
wrangler deploy --dry-run
wrangler tail
```

### D1 数据库错误

```bash
# 检查数据库状态
wrangler d1 info phychembio-sim

# 重新执行 SQL
wrangler d1 execute phychembio-sim --file=../data/init-db.sql
```

### Pages 部署失败

```bash
# 查看部署日志
wrangler pages deployment list
wrangler pages deployment tail <deployment-id>
```

---

## 后续优化

1. **启用缓存**：使用 Cloudflare Cache API 缓存题目数据
2. **添加认证**：使用 Cloudflare Access 保护 API
3. **监控告警**：配置 Cloudflare Analytics 和告警规则
4. **A/B 测试**：使用 Cloudflare Pages 的预览部署功能
