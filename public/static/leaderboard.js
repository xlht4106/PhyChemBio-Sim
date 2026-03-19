/**
 * 排行榜页面逻辑
 * 处理排行榜数据获取、模式切换等功能
 */

// 当前选中的模式
let currentMode = 'mock';

// API 基础路径
const API_BASE = '/api';

// DOM 元素
const modeBtns = document.querySelectorAll('.mode-btn');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const leaderboardContent = document.getElementById('leaderboardContent');
const emptyState = document.getElementById('emptyState');
const leaderboardItems = document.getElementById('leaderboardItems');
const backBtn = document.getElementById('backBtn');
const retryBtn = document.getElementById('retryBtn');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initModeSelector();
    loadLeaderboard();
});

// 初始化模式选择器
function initModeSelector() {
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有按钮的 active 类
            modeBtns.forEach(b => b.classList.remove('active'));
            // 添加当前按钮的 active 类
            btn.classList.add('active');
            // 更新模式
            currentMode = btn.dataset.mode;
            // 重新加载排行榜
            loadLeaderboard();
        });
    });
}

// 加载排行榜数据
async function loadLeaderboard() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/leaderboard?mode=${currentMode}&limit=20`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
            renderLeaderboard(data.data);
            showContent();
        } else {
            showEmpty();
        }
    } catch (error) {
        console.error('加载排行榜失败:', error);
        showError();
    }
}

// 渲染排行榜
function renderLeaderboard(data) {
    // 渲染前三名
    renderTopThree(data.slice(0, 3));
    
    // 渲染列表
    renderList(data.slice(3));
}

// 渲染前三名
function renderTopThree(topThree) {
    const topThreeContainer = document.querySelector('.top-three');
    topThreeContainer.innerHTML = '';
    
    topThree.forEach((item, index) => {
        const rank = index + 1;
        const rankClass = `top-rank-${rank}`;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
        
        const html = `
            <div class="top-rank ${rankClass}">
                <div class="top-avatar">
                    <span class="top-rank-number">${medal}</span>
                </div>
                <div class="top-info">
                    <p class="top-name">${escapeHtml(item.user_name)}</p>
                    <p class="top-score">${item.score}分</p>
                </div>
            </div>
        `;
        topThreeContainer.innerHTML += html;
    });
}

// 渲染列表
function renderList(items) {
    leaderboardItems.innerHTML = '';
    
    items.forEach((item, index) => {
        const rank = index + 4;
        const rankClass = getRankClass(rank);
        
        const html = `
            <div class="leaderboard-item ${rankClass}">
                <span class="list-rank">${rank}</span>
                <span class="list-name">${escapeHtml(item.user_name)}</span>
                <span class="list-score">${item.score}分</span>
                <span class="list-time">${formatTime(item.created_at)}</span>
            </div>
        `;
        leaderboardItems.innerHTML += html;
    });
}

// 获取排名样式类
function getRankClass(rank) {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return '';
}

// 格式化时间
function formatTime(isoString) {
    if (!isoString) return '-';
    
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    // 如果是今天
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 如果是今年
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
    
    // 其他情况显示完整日期
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 显示加载状态
function showLoading() {
    loadingState.style.display = 'block';
    errorState.style.display = 'none';
    leaderboardContent.style.display = 'none';
    emptyState.style.display = 'none';
}

// 显示内容
function showContent() {
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    leaderboardContent.style.display = 'block';
    emptyState.style.display = 'none';
}

// 显示错误
function showError() {
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
    leaderboardContent.style.display = 'none';
    emptyState.style.display = 'none';
}

// 显示空状态
function showEmpty() {
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    leaderboardContent.style.display = 'none';
    emptyState.style.display = 'block';
}

// 返回首页
backBtn.addEventListener('click', () => {
    window.location.href = '/';
});

// 重试按钮
retryBtn.addEventListener('click', () => {
    loadLeaderboard();
});
