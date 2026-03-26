import { Storage } from './storage.js';
import { DietModule } from './modules/diet.js';
import { FoodDatabase } from './database.js';

const App = {
    state: {
        meal: [],
        user: {}
    },

    init() {
        this.bindEvents();
        this.loadUserStats();
        this.renderMeal();
    },

    bindEvents() {
        document.getElementById('saveBtn').addEventListener('click', () => this.handleUpdateStats());
        
        const searchInput = document.getElementById('foodSearch');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        document.addEventListener('click', (e) => {
            if (e.target.id !== 'foodSearch') document.getElementById('searchDropdown').classList.add('hidden');
        });
    },

    handleUpdateStats() {
        const stats = {
            age: parseFloat(document.getElementById('age').value),
            gender: document.getElementById('gender').value,
            height: parseFloat(document.getElementById('height').value),
            weight: parseFloat(document.getElementById('weight').value),
            targetW: parseFloat(document.getElementById('targetW').value),
            activity: parseFloat(document.getElementById('activity').value)
        };

        if (Object.values(stats).some(v => isNaN(v) && typeof v !== 'string')) {
            alert("Missing Data");
            return;
        }

        const res = DietModule.calculate(stats);
        Storage.save('user_stats', stats);
        this.state.user = stats;
        this.displayStats(res.tdee, stats.targetW);
        
        if (navigator.vibrate) navigator.vibrate(50);
    },

    displayStats(tdee, targetW) {
        document.getElementById('tdeeVal').innerText = tdee.toLocaleString();
        document.getElementById('targetWVal').innerText = targetW;
        document.getElementById('resultArea').classList.remove('hidden');
    },

    loadUserStats() {
        const saved = Storage.load('user_stats');
        if (saved) {
            this.state.user = saved;
            document.getElementById('age').value = saved.age;
            document.getElementById('gender').value = saved.gender;
            document.getElementById('height').value = saved.height;
            document.getElementById('weight').value = saved.weight;
            document.getElementById('targetW').value = saved.targetW;
            document.getElementById('activity').value = saved.activity;
            
            const res = DietModule.calculate(saved);
            this.displayStats(res.tdee, saved.targetW);
        }
    },

    handleSearch(query) {
        const dropdown = document.getElementById('searchDropdown');
        if (!query) { dropdown.classList.add('hidden'); return; }

        const results = FoodDatabase.filter(f => f.name.includes(query));
        dropdown.innerHTML = results.map(f => `
            <div class="p-4 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center border-b dark:border-slate-700 last:border-0" 
                 onclick="window.addFoodToMeal('${f.id}', '${f.name}', ${f.kcal}, '${f.unit}')">
                <span class="font-bold">${f.name}</span>
                <span class="text-[10px] opacity-40 px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg">${f.kcal} kcal / ${f.unit}</span>
            </div>
        `).join('');
        dropdown.classList.remove('hidden');
    },

    addFood(id, name, kcal, unit) {
        const amount = prompt(`Amount (${unit})?`, "1");
        if (amount === null || isNaN(amount)) return;

        const foodInfo = FoodDatabase.find(f => f.id === id);
        this.state.meal.push({
            ...foodInfo,
            amount: parseFloat(amount),
            ts: Date.now()
        });
        
        this.renderMeal();
        document.getElementById('foodSearch').value = '';
    },

    renderMeal() {
        const list = document.getElementById('mealList');
        const totalKcalEl = document.getElementById('mealTotalKcal');
        
        let total = { kcal: 0, pro: 0, fat: 0, carb: 0 };

        list.innerHTML = this.state.meal.map((item, index) => {
            const kcal = Math.round(item.kcal * item.amount);
            total.kcal += kcal;
            total.pro += (item.protein || 0) * item.amount;
            total.fat += (item.fat || 0) * item.amount;
            total.carb += (item.carbs || 0) * item.amount;

            return `
                <div class="flex justify-between items-center bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl">
                    <div class="flex flex-col">
                        <span class="font-bold text-sm">${item.name}</span>
                        <span class="text-[10px] opacity-40">${item.amount} ${item.unit}</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="font-black text-indigo-600">${kcal}</span>
                        <button onclick="window.removeFood(${index})" class="w-6 h-6 flex items-center justify-center bg-red-50 text-red-500 rounded-full text-[10px]">✕</button>
                    </div>
                </div>
            `;
        }).join('');

        totalKcalEl.innerText = `${total.kcal.toLocaleString()} kcal`;
        document.getElementById('totalPro').innerText = Math.round(total.pro);
        document.getElementById('totalFat').innerText = Math.round(total.fat);
        document.getElementById('totalCarb').innerText = Math.round(total.carb);
    },

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        Storage.save('theme', isDark ? 'dark' : 'light');
        document.getElementById('themeToggle').innerText = isDark ? '☀️' : '🌙';
    }
};

window.addFoodToMeal = (id, name, kcal, unit) => App.addFood(id, name, kcal, unit);
window.removeFood = (index) => { App.state.meal.splice(index, 1); App.renderMeal(); };

document.addEventListener('DOMContentLoaded', () => App.init());
