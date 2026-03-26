import { Storage } from './storage.js';
import { DietModule } from './modules/diet.js';
import { FoodDatabase } from './database.js';

const App = {
    state: {
        meal: [] // { id, name, amount, kcal }
    },

    init() {
        this.bindEvents();
        this.loadUserStats();
        this.renderMeal();
    },

    bindEvents() {
        // TDEE 更新
        document.getElementById('saveBtn').addEventListener('click', () => this.handleUpdateTDEE());
        
        // 食物搜尋
        const searchInput = document.getElementById('foodSearch');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // 點擊頁面其他地方關閉下拉選單
        document.addEventListener('click', (e) => {
            if (e.target.id !== 'foodSearch') document.getElementById('searchDropdown').classList.add('hidden');
        });
    },

    handleSearch(query) {
        const dropdown = document.getElementById('searchDropdown');
        if (!query) { dropdown.classList.add('hidden'); return; }

        const results = FoodDatabase.filter(f => f.name.includes(query));
        dropdown.innerHTML = results.map(f => `
            <div class="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex justify-between border-b dark:border-slate-700 last:border-0" 
                 onclick="window.addFoodToMeal('${f.id}', '${f.name}', ${f.kcal}, '${f.unit}')">
                <span>${f.name}</span>
                <span class="text-xs opacity-50">${f.kcal}kcal / ${f.unit}</span>
            </div>
        `).join('');
        
        dropdown.classList.remove('hidden');
    },

    addFood(id, name, kcal, unit) {
        const amount = prompt(`你要加入多少單位 (${unit})?`, "1");
        if (amount === null || isNaN(amount)) return;

        this.state.meal.push({
            id, name, amount: parseFloat(amount), kcal, unit, 
            ts: Date.now()
        });
        
        this.renderMeal();
        document.getElementById('foodSearch').value = '';
        document.getElementById('searchDropdown').classList.add('hidden');
    },

    renderMeal() {
        const list = document.getElementById('mealList');
        const totalEl = document.getElementById('mealTotalKcal');
        
        if (this.state.meal.length === 0) {
            list.innerHTML = `<p class="text-center text-xs opacity-40 py-4">餐單目前是空的</p>`;
            totalEl.innerText = "0 kcal";
            return;
        }

        let totalKcal = 0;
        list.innerHTML = this.state.meal.map((item, index) => {
            const itemTotal = Math.round(item.kcal * item.amount);
            totalKcal += itemTotal;
            return `
                <div class="flex justify-between items-center bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border dark:border-slate-700">
                    <div>
                        <div class="font-bold text-sm">${item.name}</div>
                        <div class="text-xs opacity-50">${item.amount} ${item.unit}</div>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="font-bold text-indigo-600">${itemTotal} kcal</span>
                        <button onclick="window.removeFood(${index})" class="text-red-400 text-xs">✕</button>
                    </div>
                </div>
            `;
        }).join('');

        totalEl.innerText = `${totalKcal.toLocaleString()} kcal`;
    },

    handleUpdateTDEE() {
        const stats = {
            age: parseFloat(document.getElementById('age').value),
            gender: document.getElementById('gender').value,
            height: parseFloat(document.getElementById('height').value),
            weight: parseFloat(document.getElementById('weight').value),
            activity: parseFloat(document.getElementById('activity').value)
        };
        const res = DietModule.calculate(stats);
        Storage.save('user_stats', stats);
        this.displayTDEE(res.tdee);
    },

    displayTDEE(val) {
        document.getElementById('tdeeVal').innerText = val.toLocaleString();
        document.getElementById('resultArea').classList.remove('hidden');
    },

    loadUserStats() {
        const saved = Storage.load('user_stats');
        if (saved) {
            const res = DietModule.calculate(saved);
            this.displayTDEE(res.tdee);
        }
    }
};

// 暴露給 HTML onclick 使用
window.addFoodToMeal = (id, name, kcal, unit) => App.addFood(id, name, kcal, unit);
window.removeFood = (index) => {
    App.state.meal.splice(index, 1);
    App.renderMeal();
};

document.addEventListener('DOMContentLoaded', () => App.init());
