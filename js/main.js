import { Storage } from './storage.js';
import { DietModule } from './modules/diet.js';

const App = {
    init() {
        this.bindEvents();
        this.initTheme();
        this.registerSW();
    },

    bindEvents() {
        const calcBtn = document.getElementById('calcBtn');
        if (calcBtn) {
            calcBtn.addEventListener('click', () => this.handleTDEE());
        }

        const themeBtn = document.getElementById('themeToggle');
        themeBtn.addEventListener('click', () => this.toggleTheme());
    },

    handleTDEE() {
        const data = {
            age: parseFloat(document.getElementById('age').value),
            gender: document.getElementById('gender').value,
            height: parseFloat(document.getElementById('height').value),
            weight: parseFloat(document.getElementById('weight').value),
            activity: parseFloat(document.getElementById('activity').value)
        };

        if (Object.values(data).some(v => isNaN(v) && typeof v !== 'string')) {
            alert("請填寫完整數值");
            return;
        }

        const result = DietModule.calculateTDEE(data);
        
        // UI 更新
        document.getElementById('tdeeVal').innerText = result.toLocaleString();
        document.getElementById('resultArea').classList.remove('hidden');
        
        // 儲存用戶數據
        Storage.save('user_stats', data);
    },

    initTheme() {
        const isDark = Storage.load('theme') === 'dark';
        if (isDark) document.documentElement.classList.add('dark');
    },

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        Storage.save('theme', isDark ? 'dark' : 'light');
    },

    registerSW() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch(console.error);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());