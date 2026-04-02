// js/app.js
function switchTab(targetId, navElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');
    navElement.classList.add('active');
    if (targetId === 'tab-user' && typeof weightChart !== 'undefined') weightChart.resize();
}

function toggleSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function updateProfile() {
    document.getElementById('my-avatar-preview').innerText = document.getElementById('profile-avatar').value;
}

// 動態產生未來7日日期
function generateFutureDates() {
    const trainingSelect = document.getElementById('training-plan-day');
    const mealSelect = document.getElementById('plan-day');
    trainingSelect.innerHTML = ''; mealSelect.innerHTML = '';
    
    for(let i=1; i<=7; i++) {
        let d = new Date();
        d.setDate(d.getDate() + i);
        let dateStr = `${d.getMonth()+1}月${d.getDate()}日`;
        trainingSelect.innerHTML += `<option value="day${i}">${dateStr}</option>`;
        mealSelect.innerHTML += `<option value="day${i}">${dateStr}</option>`;
    }
}

function requestNotificationPerm() {
    if ("Notification" in window) {
        Notification.requestPermission().then(perm => {
            if (perm === "granted") alert("系統通知已開啟！");
        });
    }
}

function sendSysNotification(title, body) {
    if (document.getElementById('notify-timer').checked && "Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body: body });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    generateFutureDates();
});
