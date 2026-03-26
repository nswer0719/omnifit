// js/main.js
import { Storage } from './storage.js';
import { DietModule } from './modules/diet.js';

const App = {
    // 緩存常用的 DOM 元素
    ui: {
        age: document.getElementById('age'),
        gender: document.getElementById('gender'),
        height: document.getElementById('height'),
        weight: document.getElementById('weight'),
        activity: document.getElementById('activity'),
        saveBtn: document.getElementById('saveBtn'),
        tdeeVal: document.getElementById('tdeeVal'),
        bmrVal: document.getElementById('bmrVal'),
        resultArea: document.getElementById('resultArea'),
        themeBtn: document.getElementById('themeToggle')
    },

    init() {
        console.log("OmniFit 系統啟動...");
        this.loadUserStats();
        this.bindEvents();
        this.applyTheme();
    },

    bindEvents() {
        // 計算按鈕
        this.ui.saveBtn.addEventListener('click', () => this.updateStats());
        
        // 主題切換
        this.ui.themeBtn.addEventListener('click', () => this.toggleTheme());
    },

    updateStats() {
        const stats = {
            age: parseFloat(this.ui.age.value),
            gender: this.ui.gender.value,
            height: parseFloat(this.ui.height.value),
            weight: parseFloat(this.ui.weight.value),
            activity: parseFloat(this.ui.activity.value)
        };

        // 驗證
        if (Object.values(stats).some(val => !val && typeof val !== 'string')) {
            alert("請完整填寫身體數據數據！");
            return;
        }

        // 邏輯處理
        const results = DietModule.calculate(stats);
        
        // 儲存數據
        Storage.save('user_stats', stats);
        
        // 渲染 UI
        this.renderResults(results);
        
        // 觸覺反饋
        if (navigator.vibrate) navigator.vibrate(20);
    },

    renderResults(results) {
        this.ui.tdeeVal.innerText = results.tdee.toLocaleString();
        this.ui.bmrVal.innerText = results.bmr.toLocaleString();
        this.ui.resultArea.classList.remove('hidden');
    },

    loadUserStats() {
        const saved = Storage.load('user_stats');
        if (saved) {
            this.ui.age.value = saved.age;
            this.ui.gender.value = saved.gender;
            this.ui.height.value = saved.height;
            this.ui.weight.value = saved.weight;
            this.ui.activity.value = saved.activity;
            
            const results = DietModule.calculate(saved);
            this.renderResults(results);
        }
    },

    applyTheme() {
        const theme = Storage.load('theme') || 'light';
        if (theme === 'dark') document.documentElement.classList.add('dark');
    },

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        Storage.save('theme', isDark ? 'dark' : 'light');
    }
};

// 啟動 App
document.addEventListener('DOMContentLoaded', () => App.init());
