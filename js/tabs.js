// js/tabs.js
function switchTab(targetId, navElement) {
    // 隱藏所有分頁
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // 移除所有導航的高亮狀態
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    // 顯示目標分頁並高亮當前導航
    document.getElementById(targetId).classList.add('active');
    navElement.classList.add('active');
    
    // 如果切換回用戶分頁，確保圖表正確渲染 (解決 Chart.js 在隱藏容器中大小計算異常的問題)
    if (targetId === 'tab-user' && typeof weightChart !== 'undefined') {
        weightChart.resize();
    }
}