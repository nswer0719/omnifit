// js/meals.js
// 儲存今日所有食物紀錄的陣列 (前端暫存)
let dailyFoods = [];

// 初始化介面
document.addEventListener('DOMContentLoaded', () => {
    updateFoodUI();
});

function addFoodRecord() {
    const name = document.getElementById('food-name').value.trim();
    const type = document.getElementById('meal-type').value;
    const calories = parseFloat(document.getElementById('food-calories').value) || 0;
    const protein = parseFloat(document.getElementById('food-protein').value) || 0;
    const fat = parseFloat(document.getElementById('food-fat').value) || 0;
    const carbs = parseFloat(document.getElementById('food-carbs').value) || 0;

    if (!name) {
        alert("請至少輸入食物名稱！");
        return;
    }

    // 建立新紀錄物件
    const newFood = {
        id: Date.now(),
        name: name,
        type: type,
        calories: calories,
        protein: protein,
        fat: fat,
        carbs: carbs,
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    };

    // 新增至陣列中
    dailyFoods.push(newFood);
    
    // 清空輸入框準備下一次輸入
    document.getElementById('food-name').value = '';
    document.getElementById('food-calories').value = '';
    document.getElementById('food-protein').value = '';
    document.getElementById('food-fat').value = '';
    document.getElementById('food-carbs').value = '';

    // 重新渲染畫面
    updateFoodUI();
}

function updateFoodUI() {
    let totalCals = 0, totalPro = 0, totalFat = 0, totalCarbs = 0;
    const listContainer = document.getElementById('food-list-container');
    listContainer.innerHTML = '';

    if (dailyFoods.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">目前還沒有任何紀錄，趕快新增你的第一餐吧！</div>';
    } else {
        // 反轉陣列，讓最新紀錄在最上面
        const reversedFoods = [...dailyFoods].reverse();
        
        reversedFoods.forEach(food => {
            // 計算總和
            totalCals += food.calories;
            totalPro += food.protein;
            totalFat += food.fat;
            totalCarbs += food.carbs;

            // 產生物理紀錄的 DOM，無刪除按鈕
            const foodElement = document.createElement('div');
            foodElement.className = 'food-item';
            foodElement.innerHTML = `
                <div class="food-header">
                    <div class="food-title">${food.name} <span style="font-size: 12px; color: #a0a0a0; font-weight: normal; margin-left: 5px;">${food.timestamp}</span></div>
                    <div class="food-tag">${food.type}</div>
                </div>
                <div class="food-macros">
                    <div>卡路里: <span>${food.calories}</span> kcal</div>
                    <div>C: <span>${food.carbs}</span>g | P: <span>${food.protein}</span>g | F: <span>${food.fat}</span>g</div>
                </div>
            `;
            listContainer.appendChild(foodElement);
        });
    }

    // 更新卡路里儀表板
    document.getElementById('today-total-calories').innerText = totalCals.toLocaleString();
    document.getElementById('total-protein').innerText = totalPro;
    document.getElementById('total-fat').innerText = totalFat;
    document.getElementById('total-carbs').innerText = totalCarbs;
}