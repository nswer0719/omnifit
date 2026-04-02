// js/tabs.js
function switchTab(targetId, navElement) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    document.getElementById(targetId).classList.add('active');
    navElement.classList.add('active');
    
    if (targetId === 'tab-user' && typeof weightChart !== 'undefined') {
        weightChart.resize();
    }
}