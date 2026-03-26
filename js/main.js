// js/main.js
import { FoodDatabase, WorkoutDatabase } from './database.js';

const Storage = {
    save(k, d) { localStorage.setItem('OmniV2_' + k, JSON.stringify(d)); },
    load(k) { const d = localStorage.getItem('OmniV2_' + k); return d ? JSON.parse(d) : null; }
};

const App = {
    state: {
        user: Storage.load('user') || { weight: 70, targetW: 65, height: 175, age: 25, gender: 'male', activity: 1.55 },
        meals: Storage.load('meals') || {}, // { 'YYYY-MM-DD': [] }
        currentDate: new Date().toISOString().split('T')[0],
        workoutType: 'cardio'
    },

    init() {
        this.bindTabs();
        this.bindEvents();
        this.renderDateSelector();
        this.updateUserStats();
        this.renderMeal();
    },

    bindTabs() {
        window.switchTab = (tabId) => {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active', 'hidden'));
            document.querySelectorAll('.tab-content').forEach(el => {
                if(el.id === 'tab-' + tabId) el.classList.add('active');
                else el.classList.add('hidden');
            });
            
            document.querySelectorAll('.nav-btn').forEach(btn => {
                if(btn.dataset.target === 'tab-' + tabId) {
                    btn.classList.add('text-indigo-600');
                    btn.classList.remove('opacity-40');
                } else {
                    btn.classList.remove('text-indigo-600');
                    btn.classList.add('opacity-40');
                }
            });
        };
    },

    bindEvents() {
        document.getElementById('themeToggle').addEventListener('click', () => document.documentElement.classList.toggle('dark'));
        
        // 設定保存
        document.getElementById('saveBtn').addEventListener('click', () => {
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
            alert("數據已更新！");
        });

        // 搜尋食物
        document.getElementById('foodSearch').addEventListener('input', e => this.searchFood(e.target.value));
        // 搜尋訓練
        document.getElementById('workoutSearch').addEventListener('input', e => this.searchWorkout(e.target.value));

        // 載入表單預設值
        document.getElementById('setWeight').value = this.state.user.weight || '';
        document.getElementById('setTargetW').value = this.state.user.targetW || '';
        document.getElementById('setHeight').value = this.state.user.height || '';
        document.getElementById('setAge').value = this.state.user.age || '';
        if(this.state.user.gender) document.getElementById('setGender').value = this.state.user.gender;
        if(this.state.user.activity) document.getElementById('setActivity').value = this.state.user.activity;
    },

    // ======== 核心演算法 (TDEE, BMI, Target Calorie) ========
    updateUserStats() {
        const u = this.state.user;
        if(!u.weight || !u.height) return;

        // BMI
        const bmi = u.weight / Math.pow(u.height / 100, 2);
        
        // BMR (Mifflin-St Jeor)
        let bmr = (10 * u.weight) + (6.25 * u.height) - (5 * u.age);
        bmr = (u.gender === 'male') ? bmr + 5 : bmr - 161;
        
        // TDEE
        const tdee = Math.round(bmr * u.activity);
        
        // Target Calorie (目標體重運算)
        let targetCal = tdee;
        let advice = "維持現狀";
        if (u.targetW < u.weight) { targetCal = tdee - 300; advice = "建議產生熱量赤字 (減脂)"; }
        else if (u.targetW > u.weight) { targetCal = tdee + 300; advice = "建議產生熱量盈餘 (增肌)"; }

        // 更新 UI
        document.getElementById('userBmi').innerText = bmi.toFixed(1);
        document.getElementById('userTdee').innerText = tdee;
        document.getElementById('userGoalCal').innerText = targetCal + " kcal";
        document.getElementById('dietGoalKcal').innerText = targetCal;
        document.getElementById('calorieAdvice').innerText = advice;

        // 虛擬 7 天體重柱狀圖 (UI 示意)
        const chart = document.getElementById('weightChart');
        chart.innerHTML = Array(7).fill(0).map((_, i) => {
            const h = 40 + Math.random() * 60;
            return `<div class="w-8 bg-indigo-200 dark:bg-indigo-900 rounded-t-md relative flex items-end justify-center group" style="height: ${h}%">
                <span class="absolute -top-6 text-[10px] opacity-0 group-hover:opacity-100">${u.weight}</span>
            </div>`;
        }).join('');
    },

    // ======== 飲食未來 7 天邏輯 ========
    renderDateSelector() {
        const sel = document.getElementById('dateSelector');
        let html = '';
        for(let i=0; i<7; i++) {
            let d = new Date();
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const display = i === 0 ? 'Today' : `${d.getMonth()+1}/${d.getDate()}`;
            html += `<button onclick="window.selectDate('${dateStr}')" class="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${i===0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}">${display}</button>`;
        }
        sel.innerHTML = html;
    },

    // ======== 食物乘法與儲存 ========
    searchFood(q) {
        const drop = document.getElementById('searchDropdown');
        if(!q) { drop.classList.add('hidden'); return; }
        const res = FoodDatabase.filter(f => f.name.includes(q)).slice(0, 50); // 最多顯示50筆
        drop.innerHTML = res.map(f => `
            <div class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex justify-between" onclick="window.addFood('${f.id}')">
                <span class="font-bold">${f.name}</span><span class="text-xs opacity-50">${f.kcal}kcal / ${f.unit}</span>
            </div>
        `).join('');
        drop.classList.remove('hidden');
    },

    addFood(id) {
        const food = FoodDatabase.find(f => f.id === id);
        const amount = prompt(`你要加入多少份 (${food.unit})？ (輸入數字，如 2.5 表示 2.5 倍)`, "1");
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
        document.getElementById('mealList').innerHTML = list.map((item, idx) => {
            const kcal = Math.round(item.kcal * item.amount);
            total += kcal;
            return `
                <div class="flex justify-between items-center bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border dark:border-slate-800">
                    <div><p class="font-bold text-sm">${item.name}</p><p class="text-[10px] opacity-50">${item.amount} x ${item.unit}</p></div>
                    <div class="flex items-center gap-3">
                        <span class="font-black text-indigo-600">${kcal}</span>
                        <button onclick="window.removeFood(${idx})" class="text-red-500 text-xs bg-red-50 p-1.5 rounded-full">✕</button>
                    </div>
                </div>`;
        }).join('');
        document.getElementById('mealTotalKcal').innerText = total;
    },

    // ======== 訓練邏輯 (有氧/無氧) ========
    searchWorkout(q) {
        const drop = document.getElementById('workoutDropdown');
        if(!q) { drop.classList.add('hidden'); return; }
        const res = WorkoutDatabase.filter(w => w.type === this.state.workoutType && w.name.includes(q));
        drop.innerHTML = res.map(w => `
            <div class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer" onclick="window.addWorkout('${w.name}')">
                <span class="font-bold">${w.name}</span>
            </div>
        `).join('');
        drop.classList.remove('hidden');
    }
};

window.selectDate = (date) => { App.state.currentDate = date; App.renderMeal(); alert(`已切換至 ${date} 的餐單`); };
window.addFood = (id) => App.addFood(id);
window.removeFood = (idx) => { App.state.meals[App.state.currentDate].splice(idx, 1); Storage.save('meals', App.state.meals); App.renderMeal(); };
window.setWorkoutType = (type) => { App.state.workoutType = type; document.getElementById('workoutSearch').placeholder = `Search ${type}...`; };
window.addWorkout = (name) => {
    const mins = prompt(`輸入訓練分鐘數或組數:`, "30");
    if(!mins) return;
    document.getElementById('workoutList').innerHTML += `<div class="p-4 bg-white/50 rounded-2xl font-bold flex justify-between"><span>${name}</span><span class="text-indigo-600">${mins} min/sets</span></div>`;
    document.getElementById('workoutSearch').value = '';
    document.getElementById('workoutDropdown').classList.add('hidden');
};

document.addEventListener('DOMContentLoaded', () => App.init());
