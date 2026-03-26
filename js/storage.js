// js/storage.js
const DB_NAME = 'OmniFit_V1_';

export const Storage = {
    save(key, data) {
        try {
            localStorage.setItem(DB_NAME + key, JSON.stringify(data));
        } catch (e) {
            console.error("儲存失敗", e);
        }
    },

    load(key) {
        const data = localStorage.getItem(DB_NAME + key);
        return data ? JSON.parse(data) : null;
    },

    clear(key) {
        localStorage.removeItem(DB_NAME + key);
    }
};
