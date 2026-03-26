import { FoodDatabase } from './database.js';

const Storage = {
    save(k, d) { localStorage.setItem('OmniV3_' + k, JSON.stringify(d)); },
    load(k) { const d = localStorage.getItem('OmniV3_' + k); return d ? JSON.parse(d) : null; }
};

const i18n = {
    en: { today: 'Today', '7dayPlan': '7-Day Plan', customFood: 'Custom Food', history: 'History', water: 'Water', goal: 'Goal', current: 'Current', searchFood: 'Search food...', save: 'Save Data', bodyStats: 'Body Stats', settings: 'Settings', language: 'Language', theme: 'Dark Mode', healthSync: 'Sync Health App', navDiet: 'Diet', navWorkout: 'Workout', navSocial: 'Social', navUser: 'User', navSettings: 'Settings', stop: 'Stop', cardio: 'Cardio', strength: 'Strength', add: 'Add Record', act1: 'Sedentary', act2: 'Light Activity', act3: 'Moderate', act4: 'Active', act5: 'Extra Active' },
    zh: { today: '今日', '7dayPlan': '七日規劃', customFood: '自訂食譜', history: '歷史紀錄', water: '今日飲水', goal: '目標熱量', current: '目前攝取', searchFood: '搜尋食物...', save: '儲存數據', bodyStats: '身體數據', settings: '系統設定', language: '介面語言', theme: '深色模式', healthSync: '連接健康 App', navDiet: '飲食', navWorkout: '訓練', navSocial: '社群', navUser: '用戶', navSettings: '設定', stop: '停止', cardio: '有氧運動', strength: '無氧運動', add: '新增紀錄', act1: '久坐 (辦公室)', act2: '輕度活動', act3: '中度活動 (一週3-5次)', act4: '高度活動 (一週6-7次)', act5: '極度活動 (運動員)' }
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
        currentDate: new Date().toISOString().split('T')[0],
        workoutMode: 'cardio',
        timerWorker: null
    },

    init() {
        this.applyLang();
        this.bindEvents();
        this.renderDateSelector();
        this.updateUserStats();
        this.renderMeal();
        this.renderWorkout();
        this.initTimer();
        this.updateWaterUI();
        
        if (Storage.load('theme') === 'dark') document.documentElement.classList.add('dark');
        this.updateHealthToggleUI();
    },

    bindEvents() {
        // 分頁與小分頁
        window.switchTab = (id) => {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active', 'hidden'));
            document.querySelectorAll('.tab-content').forEach(el => el.id === `tab-${id}` ? el.classList.add('active') : el.classList.add('hidden'));
            document.querySelectorAll('.nav-btn').forEach(btn => {
                const isActive = btn.dataset.target === `tab-${id}`;
                btn.classList.toggle('text-indigo-600', isActive);
                btn.classList.toggle('opacity-40', !isActive);
            });
        };

        window.switchSubTab = (tab, sub) => {
            document.querySelectorAll(`#tab-${tab} .sub-tab-content`).forEach(el => el.classList.remove('block', 'hidden'));
            document.querySelectorAll(`#tab-${tab} .sub-tab-content`).forEach(el => el.id === `${tab}-${sub}` ? el.classList.add('block') : el.classList.add('hidden'));
            document.querySelectorAll(`#tab-${tab} .sub-tab-btn`).forEach(btn => {
                const isActive = btn.dataset.target === `${tab}-${sub}`;
                btn.classList.toggle('bg-white', isActive);
                btn.classList.toggle('dark:bg-slate-700', isActive);
                btn.classList.toggle('text-slate-500', !isActive);
                btn.classList.toggle('shadow-sm', isActive);
            });
        };

        // 用戶數據儲存
        document.getElementById('saveUserBtn').addEventListener('click', () => {
            this.state.user = {
                weight: parseFloat(document.getElementById('setWeight').value),
                targetW: parseFloat(document.getElementById('setTargetW').value),
                height: parseFloat(document.getElementById('setHeight').value),
                age: parseFloat(document.getElementById('setAge').value),
                gender: document.getElementById('setGender').value,
                activity: parseFloat(document.getElementById('setActivity').value)
            };
            Storage.save('user', this.state.user);
            this.updateUserStats();
            alert(this.state.lang === 'zh' ? "數據已更新！" : "Stats Updated!");
        });

        // 載入表單
        const u = this.state.user;
        ['Weight', 'TargetW', 'Height', 'Age'].forEach(k => document.getElementById(`set${k}`).value = u[k.toLowerCase()] || '');
        if(u.gender) document.getElementById('setGender').value = u.gender;
        if(u.activity) document.getElementById('setActivity').value = u.activity;

        // 設定：語言、主題、健康App
        document.getElementById('langSelect').value = this.state.lang;
        document.getElementById('langSelect').addEventListener('change', (e) => {
            this.state.lang = e.target.value;
            Storage.save('lang', this.state.lang);
            this.applyLang();
        });

        document.getElementById('toggleThemeBtn').addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            Storage.save('theme', isDark ? 'dark' : 'light');
        });

        document.getElementById('toggleHealthBtn').addEventListener('click', () => {
            this.state.healthSync = !this.state.healthSync;
            Storage.save('healthSync', this.state.healthSync);
            this.updateHealthToggleUI();
            if(this.state.healthSync) alert(this.state.lang === 'zh' ? "準備連接 Apple Health / Google Fit API..." : "Preparing API connection...");
        });

        // 食物搜尋
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
        if(this.state.healthSync) {
            btn.classList.replace('bg-slate-200', 'bg-green-500');
            knob.classList.add('translate-x-6');
        } else {
            btn.classList.replace('bg-green-500', 'bg-slate-200');
            knob.classList.remove('translate-x-6');
        }
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
        if (u.targetW < u.weight) { targetCal = tdee - 300; advice = this.state.lang === 'zh' ? "產生熱量赤字 (減脂)" : "Caloric Deficit (Cut)"; }
        else if (u.targetW > u.weight) { targetCal = tdee + 300; advice = this.state.lang === 'zh' ? "產生熱量盈餘 (增肌)" : "Caloric Surplus (Bulk)"; }

        document.getElementById('userBmi').innerText = bmi.toFixed(1);
        document.getElementById('userTdee').innerText = tdee;
        document.getElementById('userGoalCal').innerText = targetCal + " kcal";
        document.getElementById('dietGoalKcal').innerText = targetCal;
        document.getElementById('calorieAdvice').innerText = advice;
    },

    // ======== 飲食 & 飲水 ========
    renderDateSelector() {
        const sel = document.getElementById('dateSelector');
        let html = '';
        for(let i=0; i<7; i++) {
            let d = new Date(); d.setDate(d.getDate() + i);
            const dStr = d.toISOString().split('T')[0];
            const display = i === 0 ? (this.state.lang === 'zh'?'今日':'Today') : `${d.getMonth()+1}/${d.getDate()}`;
            html += `<button onclick="window.selectDate('${dStr}')" class="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${i===0 ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800'}">${display}</button>`;
        }
        sel.innerHTML = html;
    },

    searchFood(q) {
        const drop = document.getElementById('searchDropdown');
        if(!q) { drop.classList.add('hidden'); return; }
        const allFood = [...FoodDatabase, ...this.state.customFoods];
        const res = allFood.filter(f => f.name.includes(q)).slice(0, 30);
        drop.innerHTML = res.map(f => `
            <div class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex justify-between" onclick="window.addFood('${f.id}')">
                <span class="font-bold text-sm">${f.name}</span>
                <div class="text-[10px] font-bold flex gap-2">
                    <span class="text-indigo-500">${f.kcal}k</span>
                    <span class="text-blue-500">${f.protein||0}p</span>
                </div>
            </div>
        `).join('');
        drop.classList.remove('hidden');
    },

    addFood(id) {
        const allFood = [...FoodDatabase, ...this.state.customFoods];
        const food = allFood.find(f => f.id === id);
        const amount = prompt(this.state.lang === 'zh' ? `輸入份量 (${food.unit}):` : `Amount (${food.unit}):`, "1");
        if(!amount || isNaN(amount)) return;

        if(!this.state.meals[this.state.currentDate]) this.state.meals[this.state.currentDate] = [];
        this.state.meals[this.state.currentDate].push({ ...food, amount: parseFloat(amount) });
        Storage.save('meals', this.state.meals);
        this.renderMeal();
        document.getElementById('foodSearch').value = '';
        document.getElementById('searchDropdown').classList.add('hidden');
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
                <div class="bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <p class="font-bold text-sm">${item.name} <span class="text-[10px] opacity-50 ml-1">${item.amount}${item.unit}</span></p>
                        <div class="text-[10px] font-bold mt-1 flex gap-3">
                            <span class="text-blue-500">PRO ${p}g</span>
                            <span class="text-amber-500">FAT ${f}g</span>
                            <span class="text-emerald-500">CARB ${c}g</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="font-black text-indigo-600 text-lg">${k}</span>
                        <button onclick="window.removeFood(${idx})" class="w-6 h-6 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full text-xs">✕</button>
                    </div>
                </div>`;
        }).join('');
        
        document.getElementById('mealList').innerHTML = html;
        document.getElementById('planMealList').innerHTML = html; // 復用渲染
        document.getElementById('mealTotalKcal').innerText = total;
    },

    updateWaterUI() {
        const todayWater = this.state.water[this.state.currentDate] || 0;
        document.getElementById('waterTotal').innerText = todayWater;
    },

    // ======== 訓練 ========
    renderWorkout() {
        const list = this.state.workouts[this.state.currentDate] || [];
        const html = list.map((w, idx) => `
            <div class="bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border dark:border-slate-800 flex justify-between items-center">
                <div>
                    <p class="font-bold text-sm">${w.name} <span class="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 ml-2 uppercase">${w.type}</span></p>
                    <p class="text-[10px] font-bold mt-1 opacity-70">${w.type === 'cardio' ? `${w.dist}km / ${w.time}min` : `${w.weight}kg x ${w.sets}sets x ${w.reps}reps`}</p>
                </div>
                <button onclick="window.removeWorkout(${idx})" class="w-6 h-6 bg-red-50 text-red-500 rounded-full text-xs">✕</button>
            </div>
        `).join('');
        document.getElementById('todayWorkoutList').innerHTML = html;
        document.getElementById('historyWorkoutList').innerHTML = html;
    },

    // ======== 背景計時器 ========
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
                    alert(this.state.lang === 'zh' ? "訓練計時結束！" : "Timer Finished!");
                }
            };
        }
    }
};

// 全局暴露供 HTML 呼叫
window.selectDate = (d) => { App.state.currentDate = d; App.renderMeal(); App.renderWorkout(); alert(App.state.lang === 'zh' ? `已切換至 ${d}` : `Switched to ${d}`); };
window.addFood = (id) => App.addFood(id);
window.removeFood = (idx) => { App.state.meals[App.state.currentDate].splice(idx, 1); Storage.save('meals', App.state.meals); App.renderMeal(); };

// 自定義食物
window.saveCustomFood = () => {
    const cf = {
        id: 'c_' + Date.now(),
        name: document.getElementById('cFoodName').value,
        kcal: parseFloat(document.getElementById('cFoodKcal').value),
        protein: parseFloat(document.getElementById('cFoodPro').value),
        fat: parseFloat(document.getElementById('cFoodFat').value),
        carbs: parseFloat(document.getElementById('cFoodCarb').value),
        unit: '100g'
    };
    if(!cf.name || isNaN(cf.kcal)) return alert(App.state.lang === 'zh' ? '資料不全' : 'Missing Info');
    App.state.customFoods.push(cf);
    Storage.save('customFoods', App.state.customFoods);
    alert(App.state.lang === 'zh' ? '儲存成功！' : 'Saved!');
    ['cFoodName', 'cFoodKcal', 'cFoodPro', 'cFoodFat', 'cFoodCarb'].forEach(id => document.getElementById(id).value = '');
};

// 飲水功能
window.addWater = (amt) => {
    if(!App.state.water[App.state.currentDate]) App.state.water[App.state.currentDate] = 0;
    App.state.water[App.state.currentDate] += amt;
    Storage.save('water', App.state.water);
    App.updateWaterUI();
};

// 訓練新增邏輯
window.setWorkoutMode = (mode) => {
    App.state.workoutMode = mode;
    document.getElementById('btnCardio').classList.toggle('border-orange-200', mode === 'cardio');
    document.getElementById('btnStrength').classList.toggle('border-indigo-200', mode === 'strength');
    document.getElementById('cardioInputs').classList.toggle('hidden', mode !== 'cardio');
    document.getElementById('strengthInputs').classList.toggle('hidden', mode !== 'strength');
};

window.logWorkout = () => {
    const w = { id: 'w_' + Date.now(), name: document.getElementById('wName').value, type: App.state.workoutMode };
    if(!w.name) return;
    if(w.type === 'cardio') {
        w.dist = document.getElementById('wDist').value;
        w.time = document.getElementById('wTime').value;
    } else {
        w.weight = document.getElementById('wWeight').value;
        w.sets = document.getElementById('wSets').value;
        w.reps = document.getElementById('wReps').value;
    }
    if(!App.state.workouts[App.state.currentDate]) App.state.workouts[App.state.currentDate] = [];
    App.state.workouts[App.state.currentDate].push(w);
    Storage.save('workouts', App.state.workouts);
    App.renderWorkout();
    ['wName', 'wDist', 'wTime', 'wWeight', 'wSets', 'wReps'].forEach(id => document.getElementById(id).value = '');
};

window.removeWorkout = (idx) => { App.state.workouts[App.state.currentDate].splice(idx, 1); Storage.save('workouts', App.state.workouts); App.renderWorkout(); };

// 背景計時器控制
window.startTimer = (seconds) => {
    if (App.state.timerWorker) App.state.timerWorker.postMessage({ command: 'start', duration: seconds });
};
window.stopTimer = () => {
    if (App.state.timerWorker) App.state.timerWorker.postMessage({ command: 'stop' });
    document.getElementById('timerDisplay').innerText = "00:00";
};

document.addEventListener('DOMContentLoaded', () => App.init());
