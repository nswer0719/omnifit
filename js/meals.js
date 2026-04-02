// js/meals.js
// 永久資料狀態 (絕不刪除)
let dailyFoods = [];
let plannedFoods = {
    day1: [], day2: [], day3: [], day4: [], day5: [], day6: [], day7: []
};

// 食譜建構器暫存狀態
let currentRecipeIngredients = [];

// 介面與選取狀態追蹤
let currentMealContext = 'today'; // 'today', 'plan', 或 'recipe'
let currentSelectedBaseFood = null; 
let currentRecipeSelectedBaseFood = null;

document.addEventListener('DOMContentLoaded', () => {
    updateFoodUI();
});

// 切換 三大子分頁
function switchMealContext(context, element) {
    currentMealContext = context;
    
    // UI 高亮切換
    document.querySelectorAll('.sub-tab-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    if (context === 'recipe') {
        document.getElementById('tracker-view').style.display = 'none';
        document.getElementById('recipe-view').style.display = 'block';
        updateRecipeUI(); // 切換時刷新食譜介面
    } else {
        document.getElementById('tracker-view').style.display = 'block';
        document.getElementById('recipe-view').style.display = 'none';
        
        if (context === 'plan') {
            document.getElementById('plan-day-selector').style.display = 'block';
            document.getElementById('dashboard-total-label').innerText = '規劃總攝取';
            document.getElementById('list-subtitle').innerText = '規劃紀錄清單';
            document.getElementById('form-subtitle').innerText = '新增至規劃';
        } else {
            document.getElementById('plan-day-selector').style.display = 'none';
            document.getElementById('dashboard-total-label').innerText = '今日已攝取';
            document.getElementById('list-subtitle').innerText = '今日紀錄清單';
            document.getElementById('form-subtitle').innerText = '記錄新食物';
        }
        updateFoodUI();
    }
}

/* ================= 飲食與規劃系統 (Tracker View) ================= */

function handleSearch(query) {
    const list = document.getElementById('autocomplete-list');
    list.innerHTML = '';
    
    if (!query) {
        list.style.display = 'none';
        currentSelectedBaseFood = null;
        return;
    }

    const matches = foodDatabase.filter(food => food.name.toLowerCase().includes(query.toLowerCase()));

    if (matches.length > 0) {
        list.style.display = 'block';
        matches.forEach(food => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.innerHTML = `
                <span class="ac-name">${food.name}</span>
                <span class="ac-nutrients">${food.calories}kcal | P:${food.protein}g F:${food.fat}g C:${food.carbs}g</span>
            `;
            item.onclick = () => selectFood(food);
            list.appendChild(item);
        });
    } else {
        list.style.display = 'none';
        currentSelectedBaseFood = null;
    }
}

function selectFood(food) {
    document.getElementById('food-search').value = food.name;
    document.getElementById('autocomplete-list').style.display = 'none';
    currentSelectedBaseFood = {
        calories: food.calories, protein: food.protein, fat: food.fat, carbs: food.carbs
    };
    handleQuantityChange();
}

function handleQuantityChange() {
    const qty = parseFloat(document.getElementById('food-qty').value) || 1;
    if (currentSelectedBaseFood) {
        document.getElementById('food-calories').value = Math.round(currentSelectedBaseFood.calories * qty);
        document.getElementById('food-protein').value = (currentSelectedBaseFood.protein * qty).toFixed(1);
        document.getElementById('food-fat').value = (currentSelectedBaseFood.fat * qty).toFixed(1);
        document.getElementById('food-carbs').value = (currentSelectedBaseFood.carbs * qty).toFixed(1);
    }
}

function addFoodRecord() {
    const name = document.getElementById('food-search').value.trim();
    const type = document.getElementById('meal-type').value;
    const qty = parseFloat(document.getElementById('food-qty').value) || 1;
    const calories = parseFloat(document.getElementById('food-calories').value) || 0;
    const protein = parseFloat(document.getElementById('food-protein').value) || 0;
    const fat = parseFloat(document.getElementById('food-fat').value) || 0;
    const carbs = parseFloat(document.getElementById('food-carbs').value) || 0;

    if (!name) {
        alert("請輸入食物名稱或透過資料庫搜尋！");
        return;
    }

    const displayName = qty !== 1 ? `${name} (x${qty})` : name;
    const newFood = {
        id: Date.now(),
        name: displayName,
        type: type,
        calories: Math.round(calories),
        protein: parseFloat(protein.toFixed(1)),
        fat: parseFloat(fat.toFixed(1)),
        carbs: parseFloat(carbs.toFixed(1)),
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    };

    if (currentMealContext === 'today') {
        dailyFoods.push(newFood);
    } else {
        const selectedDay = document.getElementById('plan-day').value;
        plannedFoods[selectedDay].push(newFood);
    }
    
    document.getElementById('food-search').value = '';
    document.getElementById('food-qty').value = '1';
    document.getElementById('food-calories').value = '';
    document.getElementById('food-protein').value = '';
    document.getElementById('food-fat').value = '';
    document.getElementById('food-carbs').value = '';
    currentSelectedBaseFood = null;

    updateFoodUI();
}

function updateFoodUI() {
    let totalCals = 0, totalPro = 0, totalFat = 0, totalCarbs = 0;
    const listContainer = document.getElementById('food-list-container');
    listContainer.innerHTML = '';

    let dataSource = currentMealContext === 'today' ? dailyFoods : plannedFoods[document.getElementById('plan-day').value];

    if (dataSource.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">目前還沒有任何紀錄，趕快新增吧！</div>';
    } else {
        const reversedFoods = [...dataSource].reverse();
        reversedFoods.forEach(food => {
            totalCals += food.calories; totalPro += food.protein; totalFat += food.fat; totalCarbs += food.carbs;
            const foodElement = document.createElement('div');
            foodElement.className = 'food-item';
            foodElement.innerHTML = `
                <div class="food-header">
                    <div class="food-title">${food.name} <span style="font-size: 12px; color: #a0a0a0; font-weight: normal; margin-left: 5px;">${food.timestamp}</span></div>
                    <div class="food-tag">${food.type}</div>
                </div>
                <div class="food-macros">
                    <div>卡路里: <span>${food.calories}</span> kcal</div>
                    <div>P: <span>${food.protein}</span>g | F: <span>${food.fat}</span>g | C: <span>${food.carbs}</span>g</div>
                </div>
            `;
            listContainer.appendChild(foodElement);
        });
    }

    totalPro = Math.round(totalPro); totalFat = Math.round(totalFat); totalCarbs = Math.round(totalCarbs);
    let pctPro = 0, pctFat = 0, pctCarbs = 0;
    const calculatedMacroCalories = (totalPro * 4) + (totalFat * 9) + (totalCarbs * 4);
    
    if (calculatedMacroCalories > 0) {
        pctPro = Math.round(((totalPro * 4) / calculatedMacroCalories) * 100);
        pctFat = Math.round(((totalFat * 9) / calculatedMacroCalories) * 100);
        pctCarbs = Math.round(((totalCarbs * 4) / calculatedMacroCalories) * 100);
    }

    document.getElementById('total-calories').innerText = totalCals.toLocaleString();
    document.getElementById('total-protein').innerText = totalPro;
    document.getElementById('total-fat').innerText = totalFat;
    document.getElementById('total-carbs').innerText = totalCarbs;
    document.getElementById('pct-protein').innerText = `(${pctPro}%)`;
    document.getElementById('pct-fat').innerText = `(${pctFat}%)`;
    document.getElementById('pct-carbs').innerText = `(${pctCarbs}%)`;
}

/* ================= 自訂食譜系統 (Recipe View) ================= */

function handleRecipeSearch(query) {
    const list = document.getElementById('recipe-autocomplete-list');
    list.innerHTML = '';
    
    if (!query) {
        list.style.display = 'none';
        currentRecipeSelectedBaseFood = null;
        return;
    }

    const matches = foodDatabase.filter(food => food.name.toLowerCase().includes(query.toLowerCase()));

    if (matches.length > 0) {
        list.style.display = 'block';
        matches.forEach(food => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.innerHTML = `
                <span class="ac-name">${food.name}</span>
                <span class="ac-nutrients">${food.calories}kcal | P:${food.protein}g F:${food.fat}g C:${food.carbs}g</span>
            `;
            item.onclick = () => selectRecipeFood(food);
            list.appendChild(item);
        });
    } else {
        list.style.display = 'none';
        currentRecipeSelectedBaseFood = null;
    }
}

function selectRecipeFood(food) {
    document.getElementById('recipe-food-search').value = food.name;
    document.getElementById('recipe-autocomplete-list').style.display = 'none';
    currentRecipeSelectedBaseFood = {
        name: food.name, calories: food.calories, protein: food.protein, fat: food.fat, carbs: food.carbs
    };
}

function addRecipeIngredient() {
    const searchInput = document.getElementById('recipe-food-search').value.trim();
    const qty = parseFloat(document.getElementById('recipe-food-qty').value) || 1;

    if (!searchInput || !currentRecipeSelectedBaseFood) {
        alert("請從資料庫中選取有效食材！(自訂食譜必須基於現有資料庫食材組合)");
        return;
    }

    const ingredient = {
        name: qty !== 1 ? `${currentRecipeSelectedBaseFood.name} (x${qty})` : currentRecipeSelectedBaseFood.name,
        calories: Math.round(currentRecipeSelectedBaseFood.calories * qty),
        protein: parseFloat((currentRecipeSelectedBaseFood.protein * qty).toFixed(1)),
        fat: parseFloat((currentRecipeSelectedBaseFood.fat * qty).toFixed(1)),
        carbs: parseFloat((currentRecipeSelectedBaseFood.carbs * qty).toFixed(1))
    };

    // 草稿疊加
    currentRecipeIngredients.push(ingredient);
    
    // 清空輸入
    document.getElementById('recipe-food-search').value = '';
    document.getElementById('recipe-food-qty').value = '1';
    currentRecipeSelectedBaseFood = null;

    updateRecipeUI();
}

function updateRecipeUI() {
    let recCals = 0, recPro = 0, recFat = 0, recCarbs = 0;
    const listContainer = document.getElementById('recipe-ingredients-list');
    listContainer.innerHTML = '';

    if (currentRecipeIngredients.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">尚未加入任何食材</div>';
    } else {
        currentRecipeIngredients.forEach(ing => {
            recCals += ing.calories; recPro += ing.protein; recFat += ing.fat; recCarbs += ing.carbs;
            
            const el = document.createElement('div');
            el.className = 'food-item';
            el.innerHTML = `
                <div class="food-header">
                    <div class="food-title">${ing.name}</div>
                </div>
                <div class="food-macros">
                    <div>卡路里: <span>${ing.calories}</span> kcal</div>
                    <div>P: <span>${ing.protein}</span>g | F: <span>${ing.fat}</span>g | C: <span>${ing.carbs}</span>g</div>
                </div>
            `;
            listContainer.appendChild(el);
        });
    }

    document.getElementById('recipe-total-calories').innerText = Math.round(recCals).toLocaleString();
    document.getElementById('recipe-total-protein').innerText = Math.round(recPro);
    document.getElementById('recipe-total-fat').innerText = Math.round(recFat);
    document.getElementById('recipe-total-carbs').innerText = Math.round(recCarbs);
}

function clearRecipeDraft() {
    currentRecipeIngredients = [];
    document.getElementById('recipe-name').value = '';
    document.getElementById('recipe-food-search').value = '';
    currentRecipeSelectedBaseFood = null;
    updateRecipeUI();
}

function saveRecipe() {
    const recipeName = document.getElementById('recipe-name').value.trim();
    
    if (!recipeName) {
        alert("請為你的食譜命名！");
        return;
    }
    
    if (currentRecipeIngredients.length === 0) {
        alert("食譜中尚未加入任何食材！");
        return;
    }

    // 計算總數
    let totalCals = 0, totalPro = 0, totalFat = 0, totalCarbs = 0;
    currentRecipeIngredients.forEach(ing => {
        totalCals += ing.calories;
        totalPro += ing.protein;
        totalFat += ing.fat;
        totalCarbs += ing.carbs;
    });

    // 建立新的資料庫紀錄 (加入後綴便於辨識)
    const finalRecipeObj = {
        name: `${recipeName} [自訂食譜]`,
        calories: Math.round(totalCals),
        protein: parseFloat(totalPro.toFixed(1)),
        fat: parseFloat(totalFat.toFixed(1)),
        carbs: parseFloat(totalCarbs.toFixed(1))
    };

    // 寫入全局食物資料庫 (永久保留，可在今日/7日選單中被搜尋到)
    foodDatabase.push(finalRecipeObj);

    alert(`食譜「${recipeName}」已成功儲存至食物資料庫！以後你可以直接搜尋它。`);
    
    // 清空草稿並回到今日餐單
    clearRecipeDraft();
    switchMealContext('today', document.querySelector('.sub-tab-item:nth-child(1)'));
}