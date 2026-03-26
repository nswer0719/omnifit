export const DietModule = {
    calculateTDEE(data) {
        const { age, gender, height, weight, activity } = data;
        
        // Mifflin-St Jeor 公式
        let bmr = (10 * weight) + (6.25 * height) - (5 * age);
        bmr = (gender === 'male') ? bmr + 5 : bmr - 161;
        
        return Math.round(bmr * activity);
    }
};