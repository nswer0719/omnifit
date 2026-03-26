// js/main.js
import { Storage } from './storage.js';
import { DietModule } from './modules/diet.js';

const App = {
    elements: {
        inputs: ['age', 'gender', 'height', 'weight', 'activity'],
        saveBtn: document.getElementById('saveBtn'),
        tdeeVal: document.getElementById('tdeeVal'),
        bmrVal: document.getElementById('bmrVal'),
        resultArea: document.getElementById('resultArea'),
        themeToggle: document.getElementById('themeToggle')
    },

    init() {
        this.loadSavedData();
        this.bindEvents();
        this.initTheme();
    },

    bindEvents() {
        this.elements.saveBtn.addEventListener('click', () => this.handleUpdate());
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
    },

    handleUpdate() {
        const stats = {};
        let isValid = true;

        this.elements.inputs.forEach(id => {
            const el = document.getElementById(id);
            if (!el.value) isValid = false;
            stats[id] = (id === 'gender') ? el.value : parseFloat(el.value);
        });

        if (!isValid) {
            alert("請填寫所有欄位");
            return;
        }

        // 計算
        const results = DietModule.calculate(stats);

        // 儲存
        Storage.save('user_stats', stats);

        // UI 更新
        this.displayResults(results);
    },

    displayResults(results) {
        this.elements.tdeeVal.innerText = results.tdee.toLocaleString();
        this.elements.bmrVal.innerText = results.bmr.toLocaleString();
        this.elements.resultArea.classList.remove('hidden');
    },

    loadSavedData() {
        const saved = Storage.load('user_stats');
        if (saved) {
            this.elements.inputs.forEach(id => {
                document.getElementById(id).value = saved[id];
            });
            const results = DietModule.calculate(saved);
            this.displayResults(results);
        }
    },

    initTheme() {
        const theme = Storage.load('theme') || 'light';
        if (theme === 'dark') document.documentElement.classList.add('dark');
    },

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        Storage.save('theme', isDark ? 'dark' : 'light');
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
