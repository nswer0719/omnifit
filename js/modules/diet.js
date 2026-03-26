// js/modules/diet.js
export const DietModule = {
    /**
     * 使用 Mifflin-St Jeor 公式計算 BMR 與 TDEE
     */
    calculate(stats) {
        const { age, gender, height, weight, activity } = stats;
        
        // 基礎代謝率 BMR
        let bmr = (10 * weight) + (6.25 * height) - (5 * age);
        bmr = (gender === 'male') ? bmr + 5 : bmr - 161;
        
        // 總消耗 TDEE
        const tdee = bmr * activity;
        
        return {
            bmr: Math.round(bmr),
            tdee: Math.round(tdee)
        };
    }
};
