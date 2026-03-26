export const Storage = {
    save(key, value) {
        localStorage.setItem(`omnifit_${key}`, JSON.stringify(value));
    },
    load(key) {
        const data = localStorage.getItem(`omnifit_${key}`);
        return data ? JSON.parse(data) : null;
    }
};
