# 本地测试指南

本文档说明如何在本地环境中测试模拟考试抽题系统。

## 前端本地测试

### 方式 1：使用 live-server（推荐）

```bash
# 在项目根目录执行
npx live-server public
```

浏览器访问：`http://localhost:8080`

### 方式 2：使用 Python 内置服务器

```bash
# Python 3
python -m http.server 8080 -d public

# Python 2
python -m SimpleHTTPServer 8080
```

浏览器访问：`http://localhost:8080`

### 方式 3：使用 VS Code Live Server 扩展

1. 安装 VS Code 的 "Live Server" 扩展
2. 右键点击 `public/index.html`
3. 选择 "Open with Live Server"

## 后端本地测试

### 前置准备

```bash
cd workers
npm install
```

### 启动本地 Workers

```bash
cd workers
npx wrangler dev
```

API 将在 `http://localhost:8787` 运行

### 本地 D1 数据库

```bash
# 创建本地 D1 数据库
wrangler d1 create phychembio-sim --local

# 初始化数据库结构
wrangler d1 execute phychembio-sim --local --file=../data/init-db.sql

# 查询数据库
wrangler d1 execute phychembio-sim --local --command="SELECT * FROM questions LIMIT 5"
```

## 完整开发流程

### 终端 1：启动前端

```bash
npx live-server public --port=8080
```

### 终端 2：启动后端

```bash
cd workers
npx wrangler dev
```

### 配置前端 API URL

编辑 `public/static/exam.js` 和 `public/static/result.js`：

```javascript
const CONFIG = {
  API_BASE_URL: "http://localhost:8787", // 本地测试
  // API_BASE_URL: ''  // 使用模拟数据（默认）
};
```

## 测试流程

1. **登录页测试**
   - 访问 `http://localhost:8080`
   - 输入报名号（纯数字）
   - 点击"开始考试"
   - 选择"训练"或"模拟考试"

2. **答题页测试**
   - 检查用户信息显示
   - 检查倒计时（模拟考试模式）
   - 选择题答案
   - 使用题号导航跳转
   - 测试交卷按钮（模拟考试需等待 5 分钟后）

3. **结果页测试**
   - 训练模式：查看错题和总分
   - 模拟考试：查看总分和上传选项

## 常见问题

### Q: 前端页面空白

A: 检查控制台是否有错误，确保服务器正确启动

### Q: 题目加载失败

A: 检查 `exam.js` 中的 `fetchQuestionsMock()` 函数

### Q: Workers 启动失败

A: 确保已安装 Node.js >= 18，并运行 `npm install`

### Q: D1 数据库错误

A: 确保 wrangler.toml 中配置了正确的 database_id

## 部署前检查清单

- [ ] 前端页面在本地正常运行
- [ ] 所有题目能正常显示
- [ ] 倒计时功能正常
- [ ] 交卷功能正常
- [ ] 结果页显示正确
- [ ] Workers API 本地测试通过
- [ ] D1 数据库初始化成功
