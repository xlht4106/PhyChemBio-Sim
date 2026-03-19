/**
 * 结果页逻辑
 * 显示考试结果、错题解析、上传排行榜等功能
 */

(function() {
    'use strict';

    // ==================== 配置常量 ====================
    const CONFIG = {
        API_BASE_URL: ''  // API 基础 URL（本地测试为空）
    };

    // ==================== 状态管理 ====================
    const state = {
        result: null,
        userInfo: null
    };

    // ==================== DOM 元素 ====================
    const elements = {
        resultTitle: document.getElementById('resultTitle'),
        scoreValue: document.getElementById('scoreValue'),
        scoreTotal: document.getElementById('scoreTotal'),
        resultMode: document.getElementById('resultMode'),
        
        uploadSection: document.getElementById('uploadSection'),
        uploadYesBtn: document.getElementById('uploadYesBtn'),
        uploadNoBtn: document.getElementById('uploadNoBtn'),
        
        wrongQuestionsSection: document.getElementById('wrongQuestionsSection'),
        wrongQuestionsList: document.getElementById('wrongQuestionsList'),
        
        reviewBtn: document.getElementById('reviewBtn'),
        restartBtn: document.getElementById('restartBtn'),
        homeBtn: document.getElementById('homeBtn')
    };

    // ==================== 工具函数 ====================
    
    /**
     * 从 sessionStorage 获取考试结果
     */
    function getExamResult() {
        const resultStr = sessionStorage.getItem('exam_result');
        if (resultStr) {
            return JSON.parse(resultStr);
        }
        return null;
    }

    /**
     * 从 localStorage 获取用户信息
     */
    function getUserInfo() {
        const userInfoStr = localStorage.getItem('exam_user_info');
        if (userInfoStr) {
            return JSON.parse(userInfoStr);
        }
        return null;
    }

    /**
     * 上传成绩到排行榜
     */
    async function uploadScore() {
        if (!CONFIG.API_BASE_URL) {
            // 本地测试模式，模拟上传
            alert('本地测试模式，模拟上传成功！\n成绩已保存到排行榜。');
            elements.uploadSection.style.display = 'none';
            return;
        }
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: state.userInfo.userId,
                    user_name: state.userInfo.userName,
                    registration_number: state.userInfo.registrationNumber,
                    mode: state.result.mode,
                    score: state.result.score,
                    total_questions: state.result.total
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert(`上传成功！\n您的排名：第 ${data.data.rank} 名`);
            } else {
                alert('上传失败，请稍后重试');
            }
        } catch (error) {
            console.error('上传成绩失败:', error);
            alert('上传失败，请检查网络连接');
        }
        
        elements.uploadSection.style.display = 'none';
    }

    // ==================== UI 渲染 ====================
    
    /**
     * 渲染考试结果
     */
    function renderResult() {
        const result = state.result;
        
        // 标题
        if (result.mode === 'practice') {
            elements.resultTitle.textContent = '训练完成';
        } else {
            elements.resultTitle.textContent = '模拟考试完成';
        }
        
        // 分数
        elements.scoreValue.textContent = result.score;
        elements.scoreTotal.textContent = `/ ${result.total}`;
        
        // 模式显示
        elements.resultMode.textContent = result.mode === 'practice' ? '训练模式' : '模拟考试';
        
        // 根据分数显示不同颜色
        const percentage = result.score / result.total;
        if (percentage >= 0.8) {
            elements.scoreValue.style.color = 'var(--success)';
        } else if (percentage >= 0.6) {
            elements.scoreValue.style.color = 'var(--warning)';
        } else {
            elements.scoreValue.style.color = 'var(--danger)';
        }
        
        // 训练模式：显示错题
        if (result.mode === 'practice') {
            elements.wrongQuestionsSection.style.display = 'block';
            renderWrongQuestions(result.wrongQuestions);
            elements.reviewBtn.style.display = 'block';
        } else {
            // 模拟考试：显示上传排行榜选项
            elements.uploadSection.style.display = 'block';
        }
    }

    /**
     * 渲染错题列表
     */
    function renderWrongQuestions(wrongQuestions) {
        if (!wrongQuestions || wrongQuestions.length === 0) {
            elements.wrongQuestionsList.innerHTML = '<p style="text-align: center; color: var(--success);">恭喜！全对！</p>';
            return;
        }
        
        elements.wrongQuestionsList.innerHTML = '';
        
        wrongQuestions.forEach(q => {
            const item = document.createElement('div');
            item.className = 'wrong-question-item';
            
            const optionLabels = {
                'A': q.option_a,
                'B': q.option_b,
                'C': q.option_c,
                'D': q.option_d
            };
            
            item.innerHTML = `
                <div class="wrong-question-header">
                    <span class="wrong-question-index">第${q.questionIndex}题</span>
                    <span class="wrong-question-text">${q.question_text}</span>
                </div>
                <div class="wrong-answer-row">
                    <span class="wrong-answer">你的答案：${q.userAnswer || '未作答'} (${optionLabels[q.userAnswer] || '-'})</span>
                    <span class="correct-answer">正确答案：${q.correct_answer} (${optionLabels[q.correct_answer]})</span>
                </div>
            `;
            
            elements.wrongQuestionsList.appendChild(item);
        });
    }

    // ==================== 事件处理 ====================
    
    function bindEvents() {
        // 上传排行榜
        elements.uploadYesBtn.addEventListener('click', uploadScore);
        elements.uploadNoBtn.addEventListener('click', function() {
            elements.uploadSection.style.display = 'none';
        });
        
        // 重新练习
        restartBtn.addEventListener('click', function() {
            // 清除考试结果
            sessionStorage.removeItem('exam_result');
            // 跳转到答题页
            window.location.href = 'exam.html';
        });
        
        // 返回首页
        homeBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
        
        // 查看答题情况（返回答题页回顾）
        reviewBtn.addEventListener('click', function() {
            // 可以在这里实现回顾模式
            alert('回顾功能开发中...');
        });
    }

    // ==================== 初始化 ====================
    
    function init() {
        // 获取考试结果
        state.result = getExamResult();
        
        if (!state.result) {
            // 没有考试结果，跳转到首页
            window.location.href = 'index.html';
            return;
        }
        
        // 获取用户信息
        state.userInfo = getUserInfo();
        
        // 渲染结果
        renderResult();
        
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
