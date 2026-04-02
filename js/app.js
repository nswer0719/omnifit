// js/app.js
function switchTab(targetId, navElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');
    navElement.classList.add('active');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open'); overlay.classList.remove('open');
    } else {
        sidebar.classList.add('open'); overlay.classList.add('open');
    }
}

// BMI & TDEE 自動計算 (無需按鈕或通知)
function calculateStats() {
    let w = parseFloat(document.getElementById('current-weight').value);
    let h = parseFloat(document.getElementById('height').value) / 100;
    let a = parseFloat(document.getElementById('age').value);
    let t = parseFloat(document.getElementById('target-weight').value);
    let g = document.getElementById('gender').value;
    let act = parseFloat(document.getElementById('activity-level').value);

    // 計算 BMI
    if (w && h) {
        let bmi = (w / (h * h)).toFixed(1);
        document.getElementById('bmi-display').innerText = bmi;
    } else {
        document.getElementById('bmi-display').innerText = "--";
    }

    // 計算 TDEE
    if (w && h && a) {
        let bmr = g === 'male' ? (10 * w) + (6.25 * h * 100) - (5 * a) + 5 : (10 * w) + (6.25 * h * 100) - (5 * a) - 161;
        let tdee = Math.round(bmr * act);
        document.getElementById('tdee-current').innerText = tdee;
        document.getElementById('dashboard-target-tdee').innerText = tdee;
        
        if (t) {
            let targetBmr = g === 'male' ? (10 * t) + (6.25 * h * 100) - (5 * a) + 5 : (10 * t) + (6.25 * h * 100) - (5 * a) - 161;
            document.getElementById('tdee-target').innerText = Math.round(targetBmr * act);
        } else { document.getElementById('tdee-target').innerText = "--"; }
    } else {
        document.getElementById('tdee-current').innerText = "--";
        document.getElementById('tdee-target').innerText = "--";
    }
}

// 健康數據同步模擬
function syncHealthApp() {
    const btn = document.getElementById('sync-btn');
    btn.innerText = "同步中...";
    btn.style.background = "#555";
    setTimeout(() => {
        btn.innerText = "已同步";
        btn.style.background = "var(--accent-color)";
        setTimeout(() => { btn.innerText = "點擊同步"; }, 3000);
    }, 1500);
}

function generateFutureDates() {
    const trainingSelect = document.getElementById('training-plan-day');
    const mealSelect = document.getElementById('plan-day');
    trainingSelect.innerHTML = ''; mealSelect.innerHTML = '';
    
    for(let i=1; i<=7; i++) {
        let d = new Date(); d.setDate(d.getDate() + i);
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

document.addEventListener('DOMContentLoaded', () => {
    generateFutureDates();
});
