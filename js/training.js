// js/training.js
let dailyTraining = []; let plannedTraining = { day1: [], day2: [], day3: [], day4: [], day5: [], day6: [], day7: [] };
let trainingHistoryDB = {}; let currentTrainingContext = 'today';
let timerInterval; let targetEndTime;

function getTodayString() { const tz = (new Date()).getTimezoneOffset() * 60000; return (new Date(Date.now() - tz)).toISOString().split('T')[0]; }

document.addEventListener('DOMContentLoaded', () => { document.getElementById('training-history-date').value = getTodayString(); updateTrainingUI(); });

function switchTrainingContext(context, element) {
    currentTrainingContext = context;
    document.querySelectorAll('#tab-training .sub-tab-item').forEach(el => el.classList.remove('active')); element.classList.add('active');
    
    if (context === 'history') {
        document.getElementById('training-tracker-view').style.display = 'none'; document.getElementById('training-history-view').style.display = 'block'; updateHistoryUI();
    } else {
        document.getElementById('training-tracker-view').style.display = 'block'; document.getElementById('training-history-view').style.display = 'none';
        if (context === 'plan') {
            document.getElementById('training-plan-selector').style.display = 'block';
            document.getElementById('today-timer-card').style.display = 'none'; // 隱藏計時器
            document.getElementById('training-list-subtitle').innerText = '規劃訓練清單';
        } else {
            document.getElementById('training-plan-selector').style.display = 'none';
            document.getElementById('today-timer-card').style.display = 'block'; // 顯示計時器
            document.getElementById('training-list-subtitle').innerText = '今日訓練清單';
        }
        updateTrainingUI();
    }
}

function handleTrainingSearch(query) {
    const list = document.getElementById('training-autocomplete-list'); list.innerHTML = '';
    if (!query) { list.style.display = 'none'; return; }
    const matches = trainingDatabase.filter(t => t.toLowerCase().includes(query.toLowerCase()));
    if (matches.length > 0) {
        list.style.display = 'block';
        matches.forEach(t => {
            const item = document.createElement('div'); item.className = 'autocomplete-item'; item.innerHTML = `<span class="ac-name">${t}</span>`;
            item.onclick = () => { document.getElementById('training-name').value = t; list.style.display = 'none'; };
            list.appendChild(item);
        });
    } else { list.style.display = 'none'; }
}

function toggleTrainingFields() {
    const type = document.getElementById('training-type').value;
    document.getElementById('training-anaerobic-fields').style.display = type === 'anaerobic' ? 'grid' : 'none';
    document.getElementById('training-aerobic-fields').style.display = type === 'aerobic' ? 'grid' : 'none';
}

function addTrainingRecord() {
    const type = document.getElementById('training-type').value; const name = document.getElementById('training-name').value.trim();
    if (!name) { alert("請輸入動作名稱！"); return; }
    let rec = { id: Date.now(), name: name, type: type, timestamp: new Date().toLocaleTimeString('zh-TW', {hour:'2-digit', minute:'2-digit'}), isDeleted: false };
    if (type === 'anaerobic') { rec.weight = document.getElementById('training-weight').value || 0; rec.sets = document.getElementById('training-sets').value || 0; rec.reps = document.getElementById('training-reps').value || 0; }
    else { rec.time = document.getElementById('training-time').value || 0; rec.distance = document.getElementById('training-distance').value || 0; }
    
    if (currentTrainingContext === 'today') { dailyTraining.push(rec); const ts = getTodayString(); if(!trainingHistoryDB[ts]) trainingHistoryDB[ts]=[]; trainingHistoryDB[ts].push(rec); }
    else { plannedTraining[document.getElementById('training-plan-day').value].push(rec); }
    document.getElementById('training-name').value = ''; document.querySelectorAll('#training-tracker-view input[type="number"]').forEach(i => {if(i.id!=='timer-seconds') i.value='';}); updateTrainingUI();
}

function deleteTrainingRecord(id, type) { let arr = type === 'today' ? dailyTraining : plannedTraining[type]; const item = arr.find(f => f.id === id); if(item) item.isDeleted = true; updateTrainingUI(); }

function updateTrainingUI() {
    const list = document.getElementById('training-list-container'); list.innerHTML = '';
    let day = document.getElementById('training-plan-day').value;
    let source = (currentTrainingContext === 'today' ? dailyTraining : plannedTraining[day]).filter(r => !r.isDeleted);
    if (source.length === 0) list.innerHTML = '<div class="empty-state">無紀錄。</div>';
    else {
        [...source].reverse().forEach(r => {
            const det = r.type === 'anaerobic' ? `${r.weight}kg | ${r.sets}組 x ${r.reps}下` : `${r.time}分鐘 | ${r.distance}km`;
            list.innerHTML += `<div class="food-item"><div class="food-header"><div class="food-title">${r.name}</div><button class="btn-danger" onclick="deleteTrainingRecord(${r.id}, '${currentTrainingContext === 'today' ? 'today' : day}')">刪除</button></div><div class="food-macros"><div style="color: #fff;">${det}</div><div>${r.timestamp}</div></div></div>`;
        });
    }
}

function updateHistoryUI() {
    const dateStr = document.getElementById('training-history-date').value; const list = document.getElementById('training-history-list-container'); list.innerHTML = '';
    const records = (trainingHistoryDB[dateStr] || []).filter(r => !r.isDeleted);
    if (records.length === 0) list.innerHTML = '<div class="empty-state">無紀錄。</div>';
    else {
        [...records].reverse().forEach(r => {
            const det = r.type === 'anaerobic' ? `${r.weight}kg | ${r.sets}組 x ${r.reps}下` : `${r.time}分鐘 | ${r.distance}km`;
            list.innerHTML += `<div class="food-item"><div class="food-title">${r.name}</div><div class="food-macros"><div style="color: #fff;">${det}</div><div>${r.timestamp}</div></div></div>`;
        });
    }
}

// 高度穩定的背景計時器
function startTimer() {
    clearInterval(timerInterval);
    let secs = parseInt(document.getElementById('timer-seconds').value);
    if (isNaN(secs) || secs <= 0) return;
    
    targetEndTime = Date.now() + (secs * 1000);
    requestNotificationPerm(); // 確保要求權限
    
    timerInterval = setInterval(() => {
        let remaining = Math.round((targetEndTime - Date.now()) / 1000);
        if (remaining <= 0) {
            clearInterval(timerInterval); updateTimerDisplay(0);
            sendSysNotification("OmniFit 訓練提醒", "休息時間結束，準備下一組！");
            alert("休息時間結束，準備下一組！");
        } else {
            updateTimerDisplay(remaining);
        }
    }, 1000);
}

function updateTimerDisplay(s) { document.getElementById('timer-display').innerText = `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`; }
