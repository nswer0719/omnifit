// js/modules/diet.js
export const DietModule = {
    /**
     * 使用 Mifflin-St Jeor 公式計算
     * 男: BMR = 10w + 6.25h - 5a + 5
     * 女: BMR = 10w + 6.25h - 5a - 161
     */
    calculate(stats) {
        const { age, gender, height, weight, activity } = stats;
        
        let bmr = (10 * weight) + (6.25 * height) - (5 * age);
        bmr = (gender === 'male') ? bmr + 5 : bmr - 161;
        
        const tdee = bmr * activity;
        
        return {
            bmr: Math.round(bmr),
            tdee: Math.round(tdee)
        };
    },

    // 未來可以在這裡新增：建議蛋白質攝取、水分計算等
    getMacroAdvice(tdee) {
        return {
            protein: Math.round(tdee * 0.3 / 4), // 30% 蛋白質
            carbs: Math.round(tdee * 0.4 / 4),   // 40% 碳水
            fat: Math.round(tdee * 0.3 / 9)      // 30% 脂肪
        };
    }
};
