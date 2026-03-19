/**
 * 答题页逻辑
 * 处理题目显示、答案记录、倒计时、交卷等功能
 */

(function() {
    'use strict';

    // ==================== 配置常量 ====================
    const CONFIG = {
        EXAM_DURATION: 20 * 60,      // 考试时长（秒）- 20 分钟
        SUBMIT_MIN_TIME: 5 * 60,     // 最早交卷时间（秒）- 5 分钟
        QUESTION_COUNT: 30,          // 题目数量
        WARNING_TIME: 5 * 60,        // 警告时间（秒）- 5 分钟
        DANGER_TIME: 1 * 60,         // 危险时间（秒）- 1 分钟
        API_BASE_URL: ''             // API 基础 URL（本地测试为空，使用模拟数据）
    };

    // ==================== 状态管理 ====================
    const state = {
        // 用户信息
        userInfo: null,
        
        // 考试信息
        mode: 'mock',                // 'practice' 或 'mock'
        questions: [],               // 题目数组
        currentQuestionIndex: 0,     // 当前题目索引 (0-based)
        answers: {},                 // 用户答案 {0: 'A', 1: 'C', ...}
        
        // 倒计时
        timeLeft: CONFIG.EXAM_DURATION,
        timerInterval: null,
        
        // UI 状态
        isSubmitting: false
    };

    // ==================== DOM 元素 ====================
    const elements = {
        // 倒计时
        timerDisplay: document.getElementById('timerDisplay'),
        timerText: document.getElementById('timerText'),
        
        // 用户信息
        userAvatar: document.getElementById('userAvatar'),
        avatarPlaceholder: document.getElementById('avatarPlaceholder'),
        avatarImage: document.getElementById('avatarImage'),
        avatarUpload: document.getElementById('avatarUpload'),
        userNameInput: document.getElementById('userNameInput'),
        userRegNumber: document.getElementById('userRegNumber'),
        
        // 题目导航
        questionGrid: document.getElementById('questionGrid'),
        questionIndex: document.getElementById('questionIndex'),
        questionText: document.getElementById('questionText'),
        questionImage: document.getElementById('questionImage'),
        optionsList: document.getElementById('optionsList'),
        
        // 底部按钮
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        submitBtn: document.getElementById('submitBtn'),
        currentQuestionNum: document.getElementById('currentQuestionNum'),
        totalQuestions: document.getElementById('totalQuestions'),
        
        // 对话框
        submitDialog: document.getElementById('submitDialog'),
        dialogCancel: document.getElementById('dialogCancel'),
        dialogConfirm: document.getElementById('dialogConfirm'),
        unansweredCount: document.getElementById('unansweredCount')
    };

    // ==================== 工具函数 ====================
    
    /**
     * 从 localStorage 获取用户信息
     */
    function getUserInfo() {
        const userInfoStr = localStorage.getItem('exam_user_info');
        if (userInfoStr) {
            return JSON.parse(userInfoStr);
        }
        // 默认用户信息
        return {
            registrationNumber: '000000',
            userId: 'default',
            userName: '考生',
            avatar: null
        };
    }

    /**
     * 保存用户信息到 localStorage
     */
    function saveUserInfo(userInfo) {
        localStorage.setItem('exam_user_info', JSON.stringify(userInfo));
    }

    /**
     * 格式化时间（秒 → MM:SS）
     */
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * 随机打乱数组（Fisher-Yates 洗牌算法）
     */
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // ==================== 模拟数据 ====================
    
    /**
     * 模拟获取题目（本地测试用）
     */
    async function fetchQuestionsMock() {
        // 模拟 API 延迟
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 加载本地题库
        const allQuestions = [
            { id: 1, question_text: "下列哪种物质属于氧化物？", option_a: "H₂O", option_b: "NaCl", option_c: "O₂", option_d: "H₂SO₄", correct_answer: "A" },
            { id: 2, question_text: "光合作用的主要产物是什么？", option_a: "二氧化碳和水", option_b: "葡萄糖和氧气", option_c: "淀粉和氮气", option_d: "蛋白质和水", correct_answer: "B" },
            { id: 3, question_text: "下列哪个器官是人体的主要解毒器官？", option_a: "心脏", option_b: "肺", option_c: "肝脏", option_d: "肾脏", correct_answer: "C" },
            { id: 4, question_text: "水的沸点是多少摄氏度（标准大气压下）？", option_a: "90°C", option_b: "100°C", option_c: "110°C", option_d: "120°C", correct_answer: "B" },
            { id: 5, question_text: "下列哪种元素是金属元素？", option_a: "氧", option_b: "碳", option_c: "铁", option_d: "氮", correct_answer: "C" },
            { id: 6, question_text: "人体有多少对染色体？", option_a: "21 对", option_b: "22 对", option_c: "23 对", option_d: "24 对", correct_answer: "C" },
            { id: 7, question_text: "下列哪种气体是温室气体？", option_a: "氧气", option_b: "氮气", option_c: "二氧化碳", option_d: "氢气", correct_answer: "C" },
            { id: 8, question_text: "DNA 的全称是什么？", option_a: "核糖核酸", option_b: "脱氧核糖核酸", option_c: "氨基酸", option_d: "蛋白质", correct_answer: "B" },
            { id: 9, question_text: "下列哪种力是接触力？", option_a: "重力", option_b: "磁力", option_c: "摩擦力", option_d: "静电力", correct_answer: "C" },
            { id: 10, question_text: "pH 值为 7 的溶液呈什么性？", option_a: "酸性", option_b: "碱性", option_c: "中性", option_d: "无法判断", correct_answer: "C" },
            { id: 11, question_text: "下列哪种细胞器是细胞的'动力工厂'？", option_a: "细胞核", option_b: "线粒体", option_c: "内质网", option_d: "高尔基体", correct_answer: "B" },
            { id: 12, question_text: "牛顿第一定律又称为？", option_a: "加速度定律", option_b: "作用与反作用定律", option_c: "惯性定律", option_d: "万有引力定律", correct_answer: "C" },
            { id: 13, question_text: "下列哪种物质是强酸？", option_a: "醋酸", option_b: "盐酸", option_c: "碳酸", option_d: "柠檬酸", correct_answer: "B" },
            { id: 14, question_text: "人体最大的器官是什么？", option_a: "肝脏", option_b: "大脑", option_c: "皮肤", option_d: "心脏", correct_answer: "C" },
            { id: 15, question_text: "下列哪种波是电磁波？", option_a: "声波", option_b: "水波", option_c: "光波", option_d: "地震波", correct_answer: "C" },
            { id: 16, question_text: "化学式 CO₂表示什么物质？", option_a: "一氧化碳", option_b: "二氧化碳", option_c: "碳酸", option_d: "氧气", correct_answer: "B" },
            { id: 17, question_text: "下列哪种维生素是水溶性的？", option_a: "维生素 A", option_b: "维生素 D", option_c: "维生素 C", option_d: "维生素 E", correct_answer: "C" },
            { id: 18, question_text: "声音在下列哪种介质中传播最快？", option_a: "空气", option_b: "水", option_c: "钢铁", option_d: "真空", correct_answer: "C" },
            { id: 19, question_text: "下列哪种反应是放热反应？", option_a: "冰融化", option_b: "水蒸发", option_c: "燃烧", option_d: "盐溶解", correct_answer: "C" },
            { id: 20, question_text: "人体血液的 pH 值约为？", option_a: "6.8", option_b: "7.0", option_c: "7.4", option_d: "8.0", correct_answer: "C" },
            { id: 21, question_text: "下列哪种动物是哺乳动物？", option_a: "青蛙", option_b: "鳄鱼", option_c: "蝙蝠", option_d: "企鹅", correct_answer: "C" },
            { id: 22, question_text: "电流的单位是什么？", option_a: "伏特", option_b: "安培", option_c: "欧姆", option_d: "瓦特", correct_answer: "B" },
            { id: 23, question_text: "下列哪种物质是有机物？", option_a: "水", option_b: "二氧化碳", option_c: "葡萄糖", option_d: "食盐", correct_answer: "C" },
            { id: 24, question_text: "植物进行光合作用的主要场所是？", option_a: "线粒体", option_b: "叶绿体", option_c: "细胞核", option_d: "液泡", correct_answer: "B" },
            { id: 25, question_text: "下列哪种现象属于物理变化？", option_a: "铁生锈", option_b: "木材燃烧", option_c: "水结冰", option_d: "食物腐烂", correct_answer: "C" },
            { id: 26, question_text: "人体中含量最多的元素是？", option_a: "碳", option_b: "氢", option_c: "氧", option_d: "氮", correct_answer: "C" },
            { id: 27, question_text: "下列哪种力是保守力？", option_a: "摩擦力", option_b: "空气阻力", option_c: "重力", option_d: "粘滞力", correct_answer: "C" },
            { id: 28, question_text: "原子核由什么组成？", option_a: "电子和质子", option_b: "质子和中子", option_c: "电子和中子", option_d: "只有质子", correct_answer: "B" },
            { id: 29, question_text: "下列哪种激素由胰岛分泌？", option_a: "甲状腺素", option_b: "肾上腺素", option_c: "胰岛素", option_d: "生长激素", correct_answer: "C" },
            { id: 30, question_text: "光的折射现象是由于光在不同介质中什么不同造成的？", option_a: "频率", option_b: "波长", option_c: "传播速度", option_d: "振幅", correct_answer: "C" },
            { id: 31, question_text: "下列哪种物质是电解质？", option_a: "蔗糖", option_b: "酒精", option_c: "氯化钠", option_d: "汽油", correct_answer: "C" },
            { id: 32, question_text: "人体呼吸系统的主要器官是？", option_a: "心脏", option_b: "肺", option_c: "肝脏", option_d: "胃", correct_answer: "B" },
            { id: 33, question_text: "下列哪种能源是可再生能源？", option_a: "煤炭", option_b: "石油", option_c: "太阳能", option_d: "天然气", correct_answer: "C" },
            { id: 34, question_text: "分子是保持物质什么性质的最小粒子？", option_a: "物理性质", option_b: "化学性质", option_c: "颜色", option_d: "状态", correct_answer: "B" },
            { id: 35, question_text: "下列哪种疾病是由病毒引起的？", option_a: "肺炎", option_b: "流感", option_c: "痢疾", option_d: "结核病", correct_answer: "B" },
            { id: 36, question_text: "电阻的单位是什么？", option_a: "伏特", option_b: "安培", option_c: "欧姆", option_d: "瓦特", correct_answer: "C" },
            { id: 37, question_text: "下列哪种物质遇碘会变蓝？", option_a: "葡萄糖", option_b: "淀粉", option_c: "蛋白质", option_d: "脂肪", correct_answer: "B" },
            { id: 38, question_text: "地球自转一周需要多长时间？", option_a: "12 小时", option_b: "24 小时", option_c: "365 天", option_d: "30 天", correct_answer: "B" },
            { id: 39, question_text: "下列哪种金属在常温下是液态？", option_a: "铁", option_b: "铜", option_c: "汞", option_d: "铝", correct_answer: "C" },
            { id: 40, question_text: "人体消化系统中主要的消化器官是？", option_a: "口腔", option_b: "胃", option_c: "小肠", option_d: "大肠", correct_answer: "C" }
        ];
        
        // 随机抽取 30 道题
        const shuffled = shuffleArray(allQuestions);
        return shuffled.slice(0, CONFIG.QUESTION_COUNT);
    }

    /**
     * 从 API 获取题目
     */
    async function fetchQuestionsAPI() {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/questions?mode=${state.mode}&count=${CONFIG.QUESTION_COUNT}`);
        const data = await response.json();
        return data.data || [];
    }

    /**
     * 获取题目（根据配置选择模拟或 API）
     */
    async function fetchQuestions() {
        if (CONFIG.API_BASE_URL) {
            return fetchQuestionsAPI();
        }
        return fetchQuestionsMock();
    }

    // ==================== 倒计时逻辑 ====================
    
    /**
     * 更新倒计时显示
     */
    function updateTimerDisplay() {
        elements.timerText.textContent = formatTime(state.timeLeft);
        
        // 更新样式
        elements.timerDisplay.classList.remove('warning', 'danger');
        if (state.timeLeft <= CONFIG.DANGER_TIME) {
            elements.timerDisplay.classList.add('danger');
        } else if (state.timeLeft <= CONFIG.WARNING_TIME) {
            elements.timerDisplay.classList.add('warning');
        }
        
        // 更新交卷按钮状态
        updateSubmitButton();
        
        // 时间到自动交卷
        if (state.timeLeft <= 0) {
            submitExam();
        }
    }

    /**
     * 启动倒计时
     */
    function startTimer() {
        if (state.mode === 'practice') {
            // 训练模式不显示倒计时
            elements.timerDisplay.style.display = 'none';
            return;
        }
        
        elements.timerDisplay.style.display = 'flex';
        state.timeLeft = CONFIG.EXAM_DURATION;
        updateTimerDisplay();
        
        state.timerInterval = setInterval(() => {
            state.timeLeft--;
            updateTimerDisplay();
        }, 1000);
    }

    /**
     * 停止倒计时
     */
    function stopTimer() {
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }
    }

    // ==================== UI 渲染 ====================
    
    /**
     * 渲染用户信息
     */
    function renderUserInfo() {
        const userInfo = state.userInfo;
        
        // 报名号
        elements.userRegNumber.textContent = `报名号：${userInfo.registrationNumber}`;
        
        // 姓名
        elements.userNameInput.value = userInfo.userName || '考生';
        
        // 头像
        if (userInfo.avatar) {
            elements.avatarImage.src = userInfo.avatar;
            elements.avatarImage.style.display = 'block';
            elements.avatarPlaceholder.style.display = 'none';
        } else {
            elements.avatarImage.style.display = 'none';
            elements.avatarPlaceholder.style.display = 'flex';
        }
    }

    /**
     * 渲染题号列表
     */
    function renderQuestionGrid() {
        elements.questionGrid.innerHTML = '';
        
        for (let i = 0; i < state.questions.length; i++) {
            const btn = document.createElement('button');
            btn.className = 'question-number';
            btn.textContent = i + 1;
            btn.dataset.index = i;
            
            // 已答题目标记
            if (state.answers[i]) {
                btn.classList.add('answered');
            }
            
            // 当前题目标记
            if (i === state.currentQuestionIndex) {
                btn.classList.add('active');
            }
            
            btn.addEventListener('click', () => {
                goToQuestion(i);
            });
            
            elements.questionGrid.appendChild(btn);
        }
    }

    /**
     * 更新题号列表状态
     */
    function updateQuestionGrid() {
        const buttons = elements.questionGrid.querySelectorAll('.question-number');
        buttons.forEach((btn, index) => {
            btn.classList.remove('active', 'answered');
            
            if (state.answers[index]) {
                btn.classList.add('answered');
            }
            
            if (index === state.currentQuestionIndex) {
                btn.classList.add('active');
            }
        });
    }

    /**
     * 渲染当前题目
     */
    function renderQuestion() {
        const question = state.questions[state.currentQuestionIndex];
        if (!question) return;
        
        // 题号
        elements.questionIndex.textContent = state.currentQuestionIndex + 1;
        
        // 题目文本
        elements.questionText.textContent = question.question_text;
        
        // 题目图片（如果有）
        if (question.image_url) {
            elements.questionImage.src = question.image_url;
            elements.questionImage.style.display = 'block';
        } else {
            elements.questionImage.src = '';
            elements.questionImage.style.display = 'none';
        }
        
        // 选项
        const options = [
            { label: 'A', text: question.option_a },
            { label: 'B', text: question.option_b },
            { label: 'C', text: question.option_c },
            { label: 'D', text: question.option_d }
        ];
        
        elements.optionsList.innerHTML = '';
        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'option-item';
            item.dataset.option = option.label;
            
            // 已选标记
            if (state.answers[state.currentQuestionIndex] === option.label) {
                item.classList.add('selected');
            }
            
            item.innerHTML = `
                <div class="option-label">${option.label}</div>
                <div class="option-text">${option.text}</div>
            `;
            
            item.addEventListener('click', () => {
                selectAnswer(option.label);
            });
            
            elements.optionsList.appendChild(item);
        });
        
        // 更新进度
        elements.currentQuestionNum.textContent = state.currentQuestionIndex + 1;
        elements.totalQuestions.textContent = state.questions.length;
        
        // 更新导航按钮
        elements.prevBtn.disabled = state.currentQuestionIndex === 0;
        elements.nextBtn.disabled = state.currentQuestionIndex === state.questions.length - 1;
    }

    /**
     * 更新交卷按钮状态
     */
    function updateSubmitButton() {
        if (state.mode === 'practice') {
            // 训练模式随时可以交卷
            elements.submitBtn.disabled = false;
            elements.submitBtn.textContent = '交卷';
            elements.submitBtn.classList.remove('danger');
        } else {
            // 模拟考试：剩余时间 < 5 分钟才可交卷
            if (state.timeLeft <= CONFIG.SUBMIT_MIN_TIME) {
                elements.submitBtn.disabled = false;
                elements.submitBtn.textContent = '交卷';
                elements.submitBtn.classList.add('danger');
            } else {
                elements.submitBtn.disabled = true;
                const minutes = Math.floor(CONFIG.SUBMIT_MIN_TIME / 60);
                elements.submitBtn.textContent = `${minutes}分钟后可交卷`;
                elements.submitBtn.classList.remove('danger');
            }
        }
    }

    // ==================== 交互逻辑 ====================
    
    /**
     * 选择答案
     */
    function selectAnswer(option) {
        state.answers[state.currentQuestionIndex] = option;
        renderQuestion();
        updateQuestionGrid();
    }

    /**
     * 跳转到指定题目
     */
    function goToQuestion(index) {
        if (index < 0 || index >= state.questions.length) return;
        state.currentQuestionIndex = index;
        renderQuestion();
        updateQuestionGrid();
    }

    /**
     * 上一题
     */
    function prevQuestion() {
        if (state.currentQuestionIndex > 0) {
            goToQuestion(state.currentQuestionIndex - 1);
        }
    }

    /**
     * 下一题
     */
    function nextQuestion() {
        if (state.currentQuestionIndex < state.questions.length - 1) {
            goToQuestion(state.currentQuestionIndex + 1);
        }
    }

    /**
     * 计算未答题数
     */
    function getUnansweredCount() {
        let count = 0;
        for (let i = 0; i < state.questions.length; i++) {
            if (!state.answers[i]) {
                count++;
            }
        }
        return count;
    }

    /**
     * 显示交卷确认对话框
     */
    function showSubmitDialog() {
        const unanswered = getUnansweredCount();
        elements.unansweredCount.textContent = unanswered;
        elements.submitDialog.showModal();
    }

    /**
     * 隐藏交卷确认对话框
     */
    function hideSubmitDialog() {
        elements.submitDialog.close();
    }

    /**
     * 计算分数
     */
    function calculateScore() {
        let correctCount = 0;
        const wrongQuestions = [];
        
        state.questions.forEach((q, index) => {
            const userAnswer = state.answers[index];
            if (userAnswer === q.correct_answer) {
                correctCount++;
            } else {
                wrongQuestions.push({
                    ...q,
                    userAnswer,
                    questionIndex: index + 1
                });
            }
        });
        
        return {
            score: correctCount,
            total: state.questions.length,
            wrongQuestions
        };
    }

    /**
     * 保存考试结果到 sessionStorage
     */
    function saveExamResult(result) {
        const examResult = {
            mode: state.mode,
            ...result,
            answers: state.answers,
            timestamp: Date.now()
        };
        sessionStorage.setItem('exam_result', JSON.stringify(examResult));
    }

    /**
     * 交卷
     */
    function submitExam() {
        if (state.isSubmitting) return;
        
        stopTimer();
        state.isSubmitting = true;
        
        // 计算分数
        const result = calculateScore();
        
        // 保存结果
        saveExamResult(result);
        
        // 跳转到结果页
        window.location.href = 'result.html';
    }

    // ==================== 头像上传 ====================
    
    /**
     * 处理头像上传
     */
    function handleAvatarUpload(file) {
        if (!file || !file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result;
            state.userInfo.avatar = base64;
            saveUserInfo(state.userInfo);
            renderUserInfo();
        };
        reader.readAsDataURL(file);
    }

    // ==================== 事件处理 ====================
    
    function bindEvents() {
        // 导航按钮
        elements.prevBtn.addEventListener('click', prevQuestion);
        elements.nextBtn.addEventListener('click', nextQuestion);
        
        // 交卷按钮
        elements.submitBtn.addEventListener('click', showSubmitDialog);
        
        // 对话框
        elements.dialogCancel.addEventListener('click', hideSubmitDialog);
        elements.dialogConfirm.addEventListener('click', submitExam);
        
        // 键盘导航
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') {
                prevQuestion();
            } else if (e.key === 'ArrowRight') {
                nextQuestion();
            }
        });
        
        // 头像上传
        elements.userAvatar.addEventListener('click', function() {
            elements.avatarUpload.click();
        });
        
        elements.avatarUpload.addEventListener('change', function(e) {
            handleAvatarUpload(e.target.files[0]);
        });
        
        // 姓名编辑
        elements.userNameInput.addEventListener('change', function() {
            state.userInfo.userName = this.value.trim() || '考生';
            saveUserInfo(state.userInfo);
        });
    }

    // ==================== 初始化 ====================
    
    async function init() {
        // 获取用户信息
        state.userInfo = getUserInfo();
        renderUserInfo();
        
        // 获取考试模式
        state.mode = sessionStorage.getItem('exam_mode') || 'mock';
        
        // 加载题目
        try {
            state.questions = await fetchQuestions();
            state.totalQuestions = state.questions.length;
            renderQuestionGrid();
            renderQuestion();
        } catch (error) {
            console.error('加载题目失败:', error);
            elements.questionText.textContent = '加载题目失败，请刷新页面重试';
        }
        
        // 启动倒计时
        startTimer();
        
        // 绑定事件
        bindEvents();
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
