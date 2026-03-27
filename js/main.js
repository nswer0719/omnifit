import { FoodDatabase } from './database.js';

const Storage = {
    save(k, d) { localStorage.setItem('OmniV3_' + k, JSON.stringify(d)); },
    load(k) { const d = localStorage.getItem('OmniV3_' + k); return d ? JSON.parse(d) : null; }
};

const i18n = {
    en: { goal: 'Goal Kcal', current: 'Current', searchFood: 'Search food...', add: 'Add', water: 'Water', dietList: 'Diet Log', workoutList: 'Workout Plan', customFood: 'Custom Recipe', save: 'Save Data', settings: 'Settings', language: 'Language', theme: 'Dark Mode', healthSync: 'Sync Health App', navDiet: 'Diet', navWorkout: 'Workout', navCustom: 'Recipe', navUser: 'User', stop: 'Stop', cardio: 'Cardio', strength: 'Strength' },
    zh: { goal: '目標熱量', current: '目前攝取', searchFood: '搜尋食物或食譜...', add: '新增', water: '今日飲水', dietList: '餐單紀錄', workoutList: '訓練課表', customFood: '自訂食譜庫', save: '更新身體數據', settings: '系統偏好', language: '介面語言', theme: '深色模式', healthSync: '連接健康 App', navDiet: '飲食', navWorkout: '訓練', navCustom: '食譜', navUser: '設定', stop: '停止', cardio: '有氧運動', strength: '無氧運動' }
};

const App = {
    state: {
        user: Storage.load('user') || { weight: 70, targetW: 65, height: 175, age: 25, gender: 'male', activity: 1.55 },
        meals: Storage.load('meals') || {}, 
        customFoods: Storage.load('customFoods') || [],
        workouts: Storage.load('workouts') || {},
        water: Storage.load('water') || {},
        lang: Storage.load('lang') || 'zh',
        healthSync: Storage.load('healthSync') || false,
        currentDate: new Date().toISOString().split('T')[0], // 統一控制所有分頁的日期
        workoutMode: 'cardio',
        timerWorker: null,
        tempFoodId: null // 暫存準備新增的食物ID
    },

    init() {
        this.applyLang();
        this.bindEvents();
        this.renderDateSelector();
        this.updateUserStats();
        this.renderDataForDate(); // 根據選擇的日期渲染
        this.initTimer();
        this.updateHealthToggleUI();
        if (Storage.load('theme') === 'dark') document.documentElement.classList.add('dark');
    },

    bindEvents() {
        // 主導航切換
        window.switchTab = (id) => {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active', 'hidden'));
            document.querySelectorAll('.tab-content').forEach(el => el.id === `tab-${id}` ? el.classList.add('active') : el.classList.add('hidden'));
            document.querySelectorAll('.nav-btn').forEach(btn => {
                const isActive = btn.dataset.target === `tab-${id}`;
                btn.classList.toggle('text-indigo-600', isActive);
                btn.classList.toggle('dark:text-indigo-400', isActive);
                btn.classList.toggle('opacity-40', !isActive);
            });
        };

        // 用戶設定更新
        document.getElementById('saveUserBtn').addEventListener('click', () => {
            this.state.user = {
                weight: parseFloat(document.getElementById('setWeight').value) || 0,
                targetW: parseFloat(document.getElementById('setTargetW').value) || 0,
                height: parseFloat(document.getElementById('setHeight').value) || 0,
                age: parseFloat(document.getElementById('setAge').value) || 0,
                gender: document.getElementById('setGender').value,
                activity: parseFloat(document.getElementById('setActivity').value) || 1.2
            };
            Storage.save('user', this.state.user);
            this.updateUserStats();
            alert(this.state.lang === 'zh' ? "數據已更新！" : "Stats Updated!");
        });

        const u = this.state.user;
        ['Weight', 'TargetW', 'Height', 'Age'].forEach(k => document.getElementById(`set${k}`).value = u[k.toLowerCase()] || '');
        if(u.gender) document.getElementById('setGender').value = u.gender;
        if(u.activity) document.getElementById('setActivity').value = u.activity;

        // 設定切換
        document.getElementById('langSelect').value = this.state.lang;
        document.getElementById('langSelect').addEventListener('change', (e) => {
            this.state.lang = e.target.value; Storage.save('lang', this.state.lang); this.applyLang();
        });
        document.getElementById('toggleThemeBtn').addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            Storage.save('theme', isDark ? 'dark' : 'light');
        });
        document.getElementById('toggleHealthBtn').addEventListener('click', () => {
            this.state.healthSync = !this.state.healthSync; Storage.save('healthSync', this.state.healthSync); this.updateHealthToggleUI();
        });

        // 搜尋監聽
        document.getElementById('foodSearch').addEventListener('input', e => this.searchFood(e.target.value));
    },

    applyLang() {
        const dict = i18n[this.state.lang];
        document.querySelectorAll('[data-i18n]').forEach(el => el.innerText = dict[el.dataset.i18n]);
        document.querySelectorAll('[data-i18n-ph]').forEach(el => el.placeholder = dict[el.dataset.i18nPh]);
    },

    updateHealthToggleUI() {
        const btn = document.getElementById('toggleHealthBtn');
        const knob = document.getElementById('healthKnob');
        if(this.state.healthSync) { btn.classList.replace('bg-slate-200', 'bg-green-500'); knob.classList.add('translate-x-6'); } 
        else { btn.classList.replace('bg-green-500', 'bg-slate-200'); knob.classList.remove('translate-x-6'); }
    },

    updateUserStats() {
        const u = this.state.user;
        if(!u.weight || !u.height) return;
        const bmi = u.weight / Math.pow(u.height / 100, 2);
        let bmr = (10 * u.weight) + (6.25 * u.height) - (5 * u.age);
        bmr = (u.gender === 'male') ? bmr + 5 : bmr - 161;
        const tdee = Math.round(bmr * u.activity);
        
        let targetCal = tdee;
        let advice = this.state.lang === 'zh' ? "維持現狀" : "Maintain";
        if (u.targetW < u.weight) { targetCal = tdee - 300; advice = this.state.lang === 'zh' ? "熱量赤字 (減脂)" : "Deficit (Cut)"; }
        else if (u.targetW > u.weight) { targetCal = tdee + 300; advice = this.state.lang === 'zh' ? "熱量盈餘 (增肌)" : "Surplus (Bulk)"; }

        document.getElementById('userBmi').innerText = bmi.toFixed(1);
        document.getElementById('userTdee').innerText = tdee;
        document.getElementById('dietGoalKcal').innerText = targetCal + " kcal";
        document.getElementById('calorieAdvice').innerText = advice;
    },

    // ======== 統一日期選擇邏輯 (取代繁瑣的分頁) ========
    renderDateSelector() {
        const sel = document.getElementById('dateSelector');
        let html = '';
        for(let i=0; i<7; i++) {
            let d = new Date(); d.setDate(d.getDate() + i);
            const dStr = d.toISOString().split('T')[0];
            const isToday = i === 0;
            const display = isToday ? (this.state.lang==='zh'?'今日':'Today') : `${d.getMonth()+1}/${d.getDate()}`;
            const activeClass = dStr === this.state.currentDate ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500';
            html += `<button onclick="window.selectDate('${dStr}')" class="px-5 py-2.5 rounded-2xl text-sm font-extrabold whitespace-nowrap transition-all flex-shrink-0 ${activeClass}">${display}</button>`;
        }
        sel.innerHTML = html;
        document.getElementById('headerDateDisplay').innerText = this.state.currentDate;
    },

    renderDataForDate() {
        this.renderMeal();
        this.renderWorkout();
        this.updateWaterUI();
    },

    // ======== 飲食系統 (內嵌式新增) ========
    searchFood(q) {
        const drop = document.getElementById('searchDropdown');
        if(!q) { drop.classList.add('hidden'); return; }
        const allFood = [...FoodDatabase, ...this.state.customFoods];
        const res = allFood.filter(f => f.name.includes(q)).slice(0, 15);
        drop.innerHTML = res.map(f => `
            <div class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center border-b border-slate-100 dark:border-slate-700 last:border-0" onclick="window.prepareAddFood('${f.id}')">
                <span class="font-bold text-sm">${f.name}</span>
                <span class="text-xs font-bold bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">${f.kcal} kcal</span>
            </div>
        `).join('');
        drop.classList.remove('hidden');
    },

    renderMeal() {
        const list = this.state.meals[this.state.currentDate] || [];
        let total = 0;
        const html = list.map((item, idx) => {
            const k = Math.round(item.kcal * item.amount);
            const p = Math.round((item.protein||0) * item.amount);
            const f = Math.round((item.fat||0) * item.amount);
            const c = Math.round((item.carbs||0) * item.amount);
            total += k;
            return `
                <div class="glass-card p-4 rounded-2xl flex justify-between items-center">
                    <div>
                        <p class="font-bold text-sm">${item.name} <span class="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded ml-1">${item.amount}${item.unit}</span></p>
                        <div class="text-[10px] font-extrabold mt-1.5 flex gap-3">
                            <span class="text-blue-500">PRO ${p}g</span>
                            <span class="text-amber-500">FAT ${f}g</span>
                            <span class="text-emerald-500">CARB ${c}g</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="font-black text-indigo-600 dark:text-indigo-400 text-lg">${k}</span>
                        <button onclick="window.removeFood(${idx})" class="w-8 h-8 flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full text-xs font-bold">✕</button>
                    </div>
                </div>`;
        }).join('');
        
        document.getElementById('mealList').innerHTML = html || `<p class="text-sm opacity-50 text-center py-4 font-bold">尚無紀錄</p>`;
        document.getElementById('mealTotalKcal').innerText = total;
    },

    updateWaterUI() {
        const todayWater = this.state.water[this.state.currentDate] || 0;
        document.getElementById('waterTotal').innerText = todayWater;
    },

    // ======== 訓練系統 ========
    renderWorkout() {
        const list = this.state.workouts[this.state.currentDate] || [];
        const html = list.map((w, idx) => `
            <div class="glass-card p-4 rounded-2xl flex justify-between items-center">
                <div>
                    <p class="font-bold text-sm">${w.name} <span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 ml-2 uppercase font-black tracking-wider text-slate-500">${w.type}</span></p>
                    <p class="text-[11px] font-bold mt-1 text-slate-500">${w.type === 'cardio' ? `距離: ${w.dist}km / 時間: ${w.time}min` : `重量: ${w.weight}kg / ${w.sets}組 x ${w.reps}下`}</p>
                </div>
                <button onclick="window.removeWorkout(${idx})" class="w-8 h-8 flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full text-xs font-bold">✕</button>
            </div>
        `).join('');
        document.getElementById('workoutList').innerHTML = html || `<p class="text-sm opacity-50 text-center py-4 font-bold">尚無排定訓練</p>`;
    },

    initTimer() {
        if (window.Worker) {
            this.state.timerWorker = new Worker('js/worker.js');
            this.state.timerWorker.onmessage = (e) => {
                if (e.data.status === 'tick') {
                    const m = Math.floor(e.data.remaining / 60).toString().padStart(2, '0');
                    const s = (e.data.remaining % 60).toString().padStart(2, '0');
                    document.getElementById('timerDisplay').innerText = `${m}:${s}`;
                } else if (e.data.status === 'done') {
                    document.getElementById('timerDisplay').innerText = "00:00";
                    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
                }
            };
        }
    }
};

// ================= 全局視窗函數 =================

// 日期切換 (核心)
window.selectDate = (d) => { 
    App.state.currentDate = d; 
    App.renderDateSelector(); 
    App.renderDataForDate(); 
};

// 內嵌式食物新增
window.prepareAddFood = (id) => {
    App.state.tempFoodId = id;
    const allFood = [...FoodDatabase, ...App.state.customFoods];
    const food = allFood.find(f => f.id === id);
    document.getElementById('foodSearch').value = '';
    document.getElementById('searchDropdown').classList.add('hidden');
    document.getElementById('inlineFoodAdder').classList.remove('hidden');
    document.getElementById('addFoodName').innerText = food.name;
    document.getElementById('addFoodUnit').innerText = food.unit;
    document.getElementById('addFoodAmount').value = '';
    document.getElementById('addFoodAmount').focus();
};

window.cancelAddFood = () => {
    App.state.tempFoodId = null;
    document.getElementById('inlineFoodAdder').classList.add('hidden');
};

window.confirmAddFood = () => {
    const amount = parseFloat(document.getElementById('addFoodAmount').value);
    if(!amount || isNaN(amount)) return;
    const allFood = [...FoodDatabase, ...App.state.customFoods];
    const food = allFood.find(f => f.id === App.state.tempFoodId);
    
    if(!App.state.meals[App.state.currentDate]) App.state.meals[App.state.currentDate] = [];
    App.state.meals[App.state.currentDate].push({ ...food, amount: amount });
    Storage.save('meals', App.state.meals);
    
    App.renderMeal();
    window.cancelAddFood();
};

window.removeFood = (idx) => { App.state.meals[App.state.currentDate].splice(idx, 1); Storage.save('meals', App.state.meals); App.renderMeal(); };

// 飲水
window.addWater = (amt) => {
    if(!App.state.water[App.state.currentDate]) App.state.water[App.state.currentDate] = 0;
    App.state.water[App.state.currentDate] += amt; Storage.save('water', App.state.water); App.updateWaterUI();
};

// 自訂食物
window.saveCustomFood = () => {
    const cf = {
        id: 'c_' + Date.now(),
        name: document.getElementById('cFoodName').value,
        kcal: parseFloat(document.getElementById('cFoodKcal').value) || 0,
        protein: parseFloat(document.getElementById('cFoodPro').value) || 0,
        fat: parseFloat(document.getElementById('cFoodFat').value) || 0,
        carbs: parseFloat(document.getElementById('cFoodCarb').value) || 0,
        unit: '100g'
    };
    if(!cf.name) return alert('請輸入食物名稱');
    App.state.customFoods.push(cf);
    Storage.save('customFoods', App.state.customFoods);
    ['cFoodName', 'cFoodKcal', 'cFoodPro', 'cFoodFat', 'cFoodCarb'].forEach(id => document.getElementById(id).value = '');
    alert('已新增至自訂食譜庫！你現在可以在搜尋列找到它。');
};

// 訓練系統
window.setWorkoutMode = (mode) => {
    App.state.workoutMode = mode;
    document.getElementById('btnCardio').classList.toggle('border-orange-200', mode === 'cardio');
    document.getElementById('btnStrength').classList.toggle('border-indigo-200', mode === 'strength');
    document.getElementById('cardioInputs').classList.toggle('hidden', mode !== 'cardio');
    document.getElementById('strengthInputs').classList.toggle('hidden', mode !== 'strength');
    // 深色模式邊框處理
    document.getElementById('btnCardio').classList.toggle('dark:border-orange-800', mode === 'cardio');
    document.getElementById('btnStrength').classList.toggle('dark:border-indigo-800', mode === 'strength');
};

window.logWorkout = () => {
    const w = { id: 'w_' + Date.now(), name: document.getElementById('wName').value, type: App.state.workoutMode };
    if(!w.name) return;
    if(w.type === 'cardio') {
        w.dist = document.getElementById('wDist').value || 0;
        w.time = document.getElementById('wTime').value || 0;
    } else {
        w.weight = document.getElementById('wWeight').value || 0;
        w.sets = document.getElementById('wSets').value || 0;
        w.reps = document.getElementById('wReps').value || 0;
    }
    if(!App.state.workouts[App.state.currentDate]) App.state.workouts[App.state.currentDate] = [];
    App.state.workouts[App.state.currentDate].push(w);
    Storage.save('workouts', App.state.workouts);
    App.renderWorkout();
    ['wName', 'wDist', 'wTime', 'wWeight', 'wSets', 'wReps'].forEach(id => document.getElementById(id).value = '');
};

window.removeWorkout = (idx) => { App.state.workouts[App.state.currentDate].splice(idx, 1); Storage.save('workouts', App.state.workouts); App.renderWorkout(); };

// 計時器
window.startTimer = (seconds) => { if (App.state.timerWorker) App.state.timerWorker.postMessage({ command: 'start', duration: seconds }); };
window.stopTimer = () => { if (App.state.timerWorker) App.state.timerWorker.postMessage({ command: 'stop' }); document.getElementById('timerDisplay').innerText = "00:00"; };

document.addEventListener('DOMContentLoaded', () => App.init());
