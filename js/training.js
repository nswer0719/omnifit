// js/training.js
let dailyTraining = []; let plannedTraining = { day1: [], day2: [], day3: [], day4: [], day5: [], day6: [], day7: [] };
let currentTrainingContext = 'today'; let timerInterval; let targetEndTime;

function switchTrainingContext(context, element) {
    currentTrainingContext = context;
    document.querySelectorAll('#tab-training .sub-tab-item').forEach(el => el.classList.remove('active')); element.classList.add('active');
    
    if (context === 'plan') {
        document.getElementById('training-plan-selector').style.display = 'block';
        document.getElementById('today-timer-card').style.display = 'none';
        document.getElementById('training-list-subtitle').innerText = '規劃清單';
    } else {
        document.getElementById('training-plan-selector').style.display = 'none';
        document.getElementById('today-timer-card').style.display = 'block';
        document.getElementById('training-list-subtitle').innerText = '今日清單';
    }
    updateTrainingUI();
}

function handleTrainingSearch(query) {
    const list = document.getElementById('training-autocomplete-list'); list.innerHTML = '';
    if (!query) { list.style.display = 'none'; return; }
    const matches = trainingDatabase.filter(t => t.toLowerCase().includes(query.toLowerCase()));
    if (matches.length > 0) {
        list.style.display = 'block';
        matches.forEach(t => {
            const item = document.createElement('div'); item.className = 'autocomplete-item'; item.innerHTML = `<span>${t}</span>`;
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
    let rec = { id: Date.now(), name: name, type: type, isDeleted: false };
    if (type === 'anaerobic') { rec.weight = document.getElementById('training-weight').value || 0; rec.sets = document.getElementById('training-sets').value || 0; rec.reps = document.getElementById('training-reps').value || 0; }
    else { rec.time = document.getElementById('training-time').value || 0; rec.distance = document.getElementById('training-distance').value || 0; }
    
    if (currentTrainingContext === 'today') dailyTraining.push(rec);
    else plannedTraining[document.getElementById('training-plan-day').value].push(rec);
    
    document.getElementById('training-name').value = ''; document.querySelectorAll('#tab-training input[type="number"]').forEach(i => {if(i.id!=='timer-seconds') i.value='';}); updateTrainingUI();
}

function updateTrainingUI() {
    const list = document.getElementById('training-list-container'); list.innerHTML = '';
    let day = document.getElementById('training-plan-day').value;
    let source = (currentTrainingContext === 'today' ? dailyTraining : plannedTraining[day]).filter(r => !r.isDeleted);
    if (source.length === 0) list.innerHTML = '<div class="empty-state">無紀錄。</div>';
    else {
        [...source].reverse().forEach(r => {
            const det = r.type === 'anaerobic' ? `${r.weight}kg | ${r.sets}組 x ${r.reps}下` : `${r.time}分鐘 | ${r.distance}km`;
            list.innerHTML += `<div class="food-item"><div class="food-header"><div class="food-title">${r.name}</div><button class="btn-danger" onclick="deleteTrainingRecord(${r.id})">刪除</button></div><div class="food-macros"><div style="color: #fff;">${det}</div></div></div>`;
        });
    }
}
function deleteTrainingRecord(id) {
    let arr = currentTrainingContext === 'today' ? dailyTraining : plannedTraining[document.getElementById('training-plan-day').value];
    const item = arr.find(f => f.id === id); if(item) item.isDeleted = true; updateTrainingUI();
}

function startTimer() {
    clearInterval(timerInterval);
    let secs = parseInt(document.getElementById('timer-seconds').value);
    if (isNaN(secs) || secs <= 0) return;
    targetEndTime = Date.now() + (secs * 1000);
    
    timerInterval = setInterval(() => {
        let remaining = Math.round((targetEndTime - Date.now()) / 1000);
        if (remaining <= 0) {
            clearInterval(timerInterval); document.getElementById('timer-display').innerText = "00:00";
            if(document.getElementById('notify-timer').checked && "Notification" in window && Notification.permission === "granted") {
                new Notification("訓練提醒", { body: "休息結束！" });
            } else { alert("休息時間結束！"); }
        } else {
            document.getElementById('timer-display').innerText = `${Math.floor(remaining/60).toString().padStart(2,'0')}:${(remaining%60).toString().padStart(2,'0')}`;
        }
    }, 1000);
}
