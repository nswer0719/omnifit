// js/modules/diet.js
import { FoodDatabase } from '../database.js';

export const DietModule = {
    // 原有的 TDEE 計算
    calculate(stats) {
        const { age, gender, height, weight, activity } = stats;
        let bmr = (10 * weight) + (6.25 * height) - (5 * age);
        bmr = (gender === 'male') ? bmr + 5 : bmr - 161;
        return { bmr: Math.round(bmr), tdee: Math.round(bmr * activity) };
    },

    // 搜尋食物
    searchFood(query) {
        return FoodDatabase.filter(f => f.name.includes(query));
    },

    // 計算餐單總熱量
    calculateMeal(mealItems) {
        return mealItems.reduce((acc, item) => {
            const food = FoodDatabase.find(f => f.id === item.id);
            if (!food) return acc;
            
            // 計算比例：用戶輸入的量 / 1 (因為單位已經是 100g 或 1個)
            const ratio = item.amount; 
            return {
                kcal: acc.kcal + (food.kcal * ratio),
                protein: acc.protein + (food.protein * ratio),
                fat: acc.fat + (food.fat * ratio),
                carbs: acc.carbs + (food.carbs * ratio)
            };
        }, { kcal: 0, protein: 0, fat: 0, carbs: 0 });
    }
};
