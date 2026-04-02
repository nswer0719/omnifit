// js/training.js
let dailyTraining = [];
let plannedTraining = { day1: [], day2: [], day3: [], day4: [], day5: [], day6: [], day7: [] };
let trainingHistoryDB = {}; 
let currentTrainingContext = 'today';
let timerInterval;

// 取得今天日期字串 (YYYY-MM-DD)
function getTodayString() {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('training-history-date').value = getTodayString();
    updateTrainingUI();
});

function switchTrainingContext(context, element) {
    currentTrainingContext = context;
    document.querySelectorAll('#tab-training .sub-tab-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    if (context === 'history') {
        document.getElementById('training-tracker-view').style.display = 'none';
        document.getElementById('training-history-view').style.display = 'block';
        updateHistoryUI();
    } else {
        document.getElementById('training-tracker-view').style.display = 'block';
        document.getElementById('training-history-view').style.display = 'none';
        
        if (context === 'plan') {
            document.getElementById('training-plan-selector').style.display = 'block';
            document.getElementById('training-list-subtitle').innerText = '規劃訓練清單';
            document.getElementById('training-form-subtitle').innerText = '新增至課表';
        } else {
            document.getElementById('training-plan-selector').style.display = 'none';
            document.getElementById('training-list-subtitle').innerText = '今日訓練清單';
            document.getElementById('training-form-subtitle').innerText = '新增訓練紀錄';
        }
        updateTrainingUI();
    }
}

function toggleTrainingFields() {
    const type = document.getElementById('training-type').value;
    if (type === 'anaerobic') {
        document.getElementById('training-anaerobic-fields').style.display = 'grid';
        document.getElementById('training-aerobic-fields').style.display = 'none';
    } else {
        document.getElementById('training-anaerobic-fields').style.display = 'none';
        document.getElementById('training-aerobic-fields').style.display = 'grid';
    }
}

function addTrainingRecord() {
    const type = document.getElementById('training-type').value;
    const name = document.getElementById('training-name').value.trim();
    if (!name) { alert("請輸入動作名稱！"); return; }

    let record = { id: Date.now(), name: name, type: type, timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }), isDeleted: false };

    if (type === 'anaerobic') {
        record.weight = document.getElementById('training-weight').value || 0;
        record.sets = document.getElementById('training-sets').value || 0;
        record.reps = document.getElementById('training-reps').value || 0;
    } else {
        record.time = document.getElementById('training-time').value || 0;
        record.distance = document.getElementById('training-distance').value || 0;
    }

    if (currentTrainingContext === 'today') {
        dailyTraining.push(record);
        // 同步寫入歷史紀錄
        const todayStr = getTodayString();
        if(!trainingHistoryDB[todayStr]) trainingHistoryDB[todayStr] = [];
        trainingHistoryDB[todayStr].push(record);
    } else {
        plannedTraining[document.getElementById('training-plan-day').value].push(record);
    }

    document.getElementById('training-name').value = '';
    document.querySelectorAll('#training-tracker-view input[type="number"]').forEach(input => {
        if(input.id !== 'timer-seconds') input.value = '';
    });
    updateTrainingUI();
}

function deleteTrainingRecord(id, type) {
    let targetArray = type === 'today' ? dailyTraining : plannedTraining[type];
    const item = targetArray.find(f => f.id === id);
    if(item) item.isDeleted = true;
    updateTrainingUI();
}

function updateTrainingUI() {
    const list = document.getElementById('training-list-container');
    list.innerHTML = '';
    let activeDay = document.getElementById('training-plan-day').value;
    let dataSource = currentTrainingContext === 'today' ? dailyTraining : plannedTraining[activeDay];
    let displaySource = dataSource.filter(r => !r.isDeleted);

    if (displaySource.length === 0) {
        list.innerHTML = '<div class="empty-state">目前還沒有訓練紀錄。</div>';
    } else {
        [...displaySource].reverse().forEach(record => {
            const detailStr = record.type === 'anaerobic' 
                ? `${record.weight}kg | ${record.sets}組 x ${record.reps}下` 
                : `${record.time}分鐘 | ${record.distance}km`;
            const typeStr = record.type === 'anaerobic' ? '無氧' : '有氧';

            const el = document.createElement('div');
            el.className = 'food-item';
            el.innerHTML = `
                <div class="food-header">
                    <div class="food-title">${record.name} <span class="food-tag">${typeStr}</span></div>
                    <button class="btn-danger" onclick="deleteTrainingRecord(${record.id}, '${currentTrainingContext === 'today' ? 'today' : activeDay}')">刪除</button>
                </div>
                <div class="food-macros">
                    <div style="font-size: 14px; color: #fff;">${detailStr}</div>
                    <div>${record.timestamp}</div>
                </div>
            `;
            list.appendChild(el);
        });
    }
}

// --- 歷史紀錄 ---
function updateHistoryUI() {
    const dateStr = document.getElementById('training-history-date').value;
    const list = document.getElementById('training-history-list-container');
    list.innerHTML = '';

    const records = trainingHistoryDB[dateStr] || [];
    const displayRecords = records.filter(r => !r.isDeleted);

    if (displayRecords.length === 0) {
        list.innerHTML = '<div class="empty-state">該日無任何訓練紀錄。</div>';
    } else {
        [...displayRecords].reverse().forEach(record => {
            const detailStr = record.type === 'anaerobic' ? `${record.weight}kg | ${record.sets}組 x ${record.reps}下` : `${record.time}分鐘 | ${record.distance}km`;
            const el = document.createElement('div');
            el.className = 'food-item';
            el.innerHTML = `
                <div class="food-header">
                    <div class="food-title">${record.name}</div>
                </div>
                <div class="food-macros">
                    <div style="color: #fff;">${detailStr}</div>
                    <div>${record.timestamp}</div>
                </div>
            `;
            list.appendChild(el);
        });
    }
}

// --- 休息計時器 ---
function startTimer() {
    clearInterval(timerInterval);
    let secs = parseInt(document.getElementById('timer-seconds').value);
    if (isNaN(secs) || secs <= 0) return;
    
    updateTimerDisplay(secs);
    timerInterval = setInterval(() => {
        secs--;
        updateTimerDisplay(secs);
        if (secs <= 0) {
            clearInterval(timerInterval);
            alert("休息時間結束，準備下一組！");
        }
    }, 1000);
}

function updateTimerDisplay(s) {
    let m = Math.floor(s / 60).toString().padStart(2, '0');
    let rs = (s % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `${m}:${rs}`;
}