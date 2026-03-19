/**
 * 登录页逻辑
 * 处理报名号输入验证和考试类型选择
 */

(function() {
    'use strict';

    // DOM 元素
    const registrationInput = document.getElementById('registrationNumber');
    const registrationError = document.getElementById('registrationError');
    const startBtn = document.getElementById('startBtn');
    const leaderboardBtn = document.getElementById('leaderboardBtn');

    // 验证报名号（纯数字）
    function validateRegistrationNumber(number) {
        if (!number || number.trim() === '') {
            return { valid: false, message: '请输入报名号' };
        }
        if (!/^\d+$/.test(number)) {
            return { valid: false, message: '报名号必须是纯数字' };
        }
        if (number.length < 1) {
            return { valid: false, message: '报名号至少 1 位数字' };
        }
        return { valid: true, message: '' };
    }

    // 显示错误信息
    function showError(message) {
        registrationError.textContent = message;
        registrationInput.style.borderColor = 'var(--danger)';
    }

    // 清除错误信息
    function clearError() {
        registrationError.textContent = '';
        registrationInput.style.borderColor = 'var(--gray-200)';
    }

    // 生成用户唯一标识（SHA-256 哈希）
    async function generateUserId(registrationNumber) {
        const encoder = new TextEncoder();
        const data = encoder.encode(registrationNumber);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // 保存用户信息到 localStorage
    async function saveUserInfo(registrationNumber) {
        const userId = await generateUserId(registrationNumber);
        const userInfo = {
            registrationNumber: registrationNumber,
            userId: userId,
            userName: '考生' + registrationNumber.slice(-4), // 默认姓名
            avatar: null
        };
        localStorage.setItem('exam_user_info', JSON.stringify(userInfo));
        return userInfo;
    }

    // 处理开始按钮点击
    async function handleStart() {
        const registrationNumber = registrationInput.value.trim();
        const validation = validateRegistrationNumber(registrationNumber);

        if (!validation.valid) {
            showError(validation.message);
            return;
        }

        clearError();

        // 保存用户信息
        await saveUserInfo(registrationNumber);

        // 跳转到答题页
        window.location.href = 'exam.html';
    }

    // 处理考试类型选择
    function handleExamTypeSelect(type) {
        // 检查是否是可用的考试类型
        if (type === 'district' || type === 'city') {
            return; // 暂未开放
        }

        // 保存考试类型到 sessionStorage
        sessionStorage.setItem('exam_mode', type);

        // 跳转到答题页
        window.location.href = 'exam.html';
    }

    // 事件监听
    registrationInput.addEventListener('input', function() {
        // 只允许输入数字
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value) {
            clearError();
        }
    });

    registrationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleStart();
        }
    });

    startBtn.addEventListener('click', handleStart);

    // 处理排行榜按钮点击
    function handleLeaderboard() {
        window.location.href = 'leaderboard.html';
    }

    leaderboardBtn.addEventListener('click', handleLeaderboard);


    // 页面加载时检查是否已有用户信息
    function checkExistingUser() {
        const userInfo = localStorage.getItem('exam_user_info');
        if (userInfo) {
            const user = JSON.parse(userInfo);
            registrationInput.value = user.registrationNumber;
        }
    }

    // 初始化
    checkExistingUser();
})();
