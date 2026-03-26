// js/storage.js
const PREFIX = 'omnifit_';

export const Storage = {
    save(key, data) {
        localStorage.setItem(PREFIX + key, JSON.stringify(data));
    },
    load(key) {
        const data = localStorage.getItem(PREFIX + key);
        return data ? JSON.parse(data) : null;
    }
};
