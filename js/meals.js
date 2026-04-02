// js/meals.js
let dailyFoods = [];
let plannedFoods = { day1: [], day2: [], day3: [], day4: [], day5: [], day6: [], day7: [] };
let waterIntake = 0; 
let currentRecipeIngredients = [];
let currentMealContext = 'today'; 
let currentSelectedBaseFood = null; 
let currentRecipeSelectedBaseFood = null;

document.addEventListener('DOMContentLoaded', () => { updateFoodUI(); });

function switchMealContext(context, element) {
    currentMealContext = context;
    document.querySelectorAll('#tab-meals .sub-tab-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    if (context === 'recipe') {
        document.getElementById('tracker-view').style.display = 'none';
        document.getElementById('recipe-view').style.display = 'block';
        updateRecipeUI(); 
    } else {
        document.getElementById('tracker-view').style.display = 'block';
        document.getElementById('recipe-view').style.display = 'none';
        
        if (context === 'plan') {
            document.getElementById('plan-day-selector').style.display = 'block';
            document.getElementById('water-tracker-card').style.display = 'none';
            document.getElementById('dashboard-total-label').innerText = '規劃總攝取';
            document.getElementById('list-subtitle').innerText = '規劃紀錄清單';
            document.getElementById('form-subtitle').innerText = '新增至規劃';
        } else {
            document.getElementById('plan-day-selector').style.display = 'none';
            document.getElementById('water-tracker-card').style.display = 'block';
            document.getElementById('dashboard-total-label').innerText = '今日已攝取';
            document.getElementById('list-subtitle').innerText = '今日紀錄清單';
            document.getElementById('form-subtitle').innerText = '記錄新食物';
        }
        updateFoodUI();
    }
}

// --- 飲水功能 ---
function updateWater(amount) {
    waterIntake += amount;
    if(waterIntake < 0) waterIntake = 0;
    document.getElementById('water-current').innerText = waterIntake;
}

// --- 飲食追蹤 ---
function handleSearch(query) {
    const list = document.getElementById('autocomplete-list');
    list.innerHTML = '';
    if (!query) { list.style.display = 'none'; currentSelectedBaseFood = null; return; }

    const matches = foodDatabase.filter(food => food.name.toLowerCase().includes(query.toLowerCase()) && !food.isDeleted);
    if (matches.length > 0) {
        list.style.display = 'block';
        matches.forEach(food => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.innerHTML = `<span class="ac-name">${food.name}</span><span class="ac-nutrients">${food.calories}kcal | P:${food.protein}g</span>`;
            item.onclick = () => selectFood(food);
            list.appendChild(item);
        });
    } else { list.style.display = 'none'; currentSelectedBaseFood = null; }
}

function selectFood(food) {
    document.getElementById('food-search').value = food.name;
    document.getElementById('autocomplete-list').style.display = 'none';
    currentSelectedBaseFood = { calories: food.calories, protein: food.protein, fat: food.fat, carbs: food.carbs };
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
    if (!name || !currentSelectedBaseFood) { alert("請從資料庫選取有效食物！"); return; }
    
    const qty = parseFloat(document.getElementById('food-qty').value) || 1;
    const newFood = {
        id: Date.now(),
        name: qty !== 1 ? `${name} (x${qty})` : name,
        type: document.getElementById('meal-type').value,
        calories: parseFloat(document.getElementById('food-calories').value),
        protein: parseFloat(document.getElementById('food-protein').value),
        fat: parseFloat(document.getElementById('food-fat').value),
        carbs: parseFloat(document.getElementById('food-carbs').value),
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
        isDeleted: false // 軟刪除標記
    };

    if (currentMealContext === 'today') dailyFoods.push(newFood);
    else plannedFoods[document.getElementById('plan-day').value].push(newFood);
    
    document.getElementById('food-search').value = '';
    document.getElementById('food-qty').value = '1';
    currentSelectedBaseFood = null;
    updateFoodUI();
}

function deleteRecord(id, type) {
    let targetArray = type === 'today' ? dailyFoods : plannedFoods[type];
    const item = targetArray.find(f => f.id === id);
    if(item) item.isDeleted = true; // 隱藏標記，不實際刪除資料
    updateFoodUI();
}

function updateFoodUI() {
    let totalCals = 0, totalPro = 0, totalFat = 0, totalCarbs = 0;
    const listContainer = document.getElementById('food-list-container');
    listContainer.innerHTML = '';

    let activeDay = document.getElementById('plan-day').value;
    let dataSource = currentMealContext === 'today' ? dailyFoods : plannedFoods[activeDay];
    let displaySource = dataSource.filter(f => !f.isDeleted); // 過濾被刪除的項目

    if (displaySource.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">目前還沒有任何紀錄。</div>';
    } else {
        const reversedFoods = [...displaySource].reverse();
        reversedFoods.forEach(food => {
            totalCals += food.calories; totalPro += food.protein; totalFat += food.fat; totalCarbs += food.carbs;
            const el = document.createElement('div');
            el.className = 'food-item';
            el.innerHTML = `
                <div class="food-header">
                    <div class="food-title">${food.name} <span class="food-tag">${food.type}</span></div>
                    <button class="btn-danger" onclick="deleteRecord(${food.id}, '${currentMealContext === 'today' ? 'today' : activeDay}')">刪除</button>
                </div>
                <div class="food-macros">
                    <div>卡路里: <span>${Math.round(food.calories)}</span> kcal</div>
                    <div>P: <span>${food.protein.toFixed(1)}</span>g | F: <span>${food.fat.toFixed(1)}</span>g | C: <span>${food.carbs.toFixed(1)}</span>g</div>
                </div>
            `;
            listContainer.appendChild(el);
        });
    }

    document.getElementById('total-calories').innerText = Math.round(totalCals).toLocaleString();
    document.getElementById('total-protein').innerText = totalPro.toFixed(1);
    document.getElementById('total-fat').innerText = totalFat.toFixed(1);
    document.getElementById('total-carbs').innerText = totalCarbs.toFixed(1);
}

// --- 食譜建構器 ---
function handleRecipeSearch(query) {
    const list = document.getElementById('recipe-autocomplete-list');
    list.innerHTML = '';
    if (!query) { list.style.display = 'none'; currentRecipeSelectedBaseFood = null; document.getElementById('recipe-food-preview').style.display='none'; return; }

    const matches = foodDatabase.filter(food => food.name.toLowerCase().includes(query.toLowerCase()) && !food.isDeleted);
    if (matches.length > 0) {
        list.style.display = 'block';
        matches.forEach(food => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.innerHTML = `<span class="ac-name">${food.name}</span>`;
            item.onclick = () => selectRecipeFood(food);
            list.appendChild(item);
        });
    } else { list.style.display = 'none'; currentRecipeSelectedBaseFood = null; }
}

function selectRecipeFood(food) {
    document.getElementById('recipe-food-search').value = food.name;
    document.getElementById('recipe-autocomplete-list').style.display = 'none';
    currentRecipeSelectedBaseFood = { name: food.name, calories: food.calories, protein: food.protein, fat: food.fat, carbs: food.carbs };
    updateRecipePreviewQty();
}

function updateRecipePreviewQty() {
    const preview = document.getElementById('recipe-food-preview');
    const qty = parseFloat(document.getElementById('recipe-food-qty').value) || 1;
    if(currentRecipeSelectedBaseFood) {
        preview.style.display = 'block';
        preview.innerText = `選中: ${currentRecipeSelectedBaseFood.name} (x${qty}) ➔ ${Math.round(currentRecipeSelectedBaseFood.calories * qty)} kcal | P:${(currentRecipeSelectedBaseFood.protein * qty).toFixed(1)}g F:${(currentRecipeSelectedBaseFood.fat * qty).toFixed(1)}g C:${(currentRecipeSelectedBaseFood.carbs * qty).toFixed(1)}g`;
    } else {
        preview.style.display = 'none';
    }
}

function addRecipeIngredient() {
    const qty = parseFloat(document.getElementById('recipe-food-qty').value) || 1;
    if (!currentRecipeSelectedBaseFood) { alert("請從資料庫中選取有效食材！"); return; }

    currentRecipeIngredients.push({
        id: Date.now(),
        name: qty !== 1 ? `${currentRecipeSelectedBaseFood.name} (x${qty})` : currentRecipeSelectedBaseFood.name,
        calories: currentRecipeSelectedBaseFood.calories * qty,
        protein: currentRecipeSelectedBaseFood.protein * qty,
        fat: currentRecipeSelectedBaseFood.fat * qty,
        carbs: currentRecipeSelectedBaseFood.carbs * qty
    });
    
    document.getElementById('recipe-food-search').value = '';
    document.getElementById('recipe-food-qty').value = '1';
    document.getElementById('recipe-food-preview').style.display = 'none';
    currentRecipeSelectedBaseFood = null;
    updateRecipeUI();
}

function deleteRecipeDraftItem(id) {
    currentRecipeIngredients = currentRecipeIngredients.filter(ing => ing.id !== id);
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
                    <button class="btn-danger" onclick="deleteRecipeDraftItem(${ing.id})">移除</button>
                </div>
                <div class="food-macros">
                    <div><span>${Math.round(ing.calories)}</span> kcal</div>
                    <div>P:<span>${ing.protein.toFixed(1)}</span>g F:<span>${ing.fat.toFixed(1)}</span>g C:<span>${ing.carbs.toFixed(1)}</span>g</div>
                </div>
            `;
            listContainer.appendChild(el);
        });
    }

    document.getElementById('recipe-total-calories').innerText = Math.round(recCals).toLocaleString();
    document.getElementById('recipe-total-protein').innerText = recPro.toFixed(1);
    document.getElementById('recipe-total-fat').innerText = recFat.toFixed(1);
    document.getElementById('recipe-total-carbs').innerText = recCarbs.toFixed(1);
}

function saveRecipe() {
    const name = document.getElementById('recipe-name').value.trim();
    if (!name || currentRecipeIngredients.length === 0) { alert("請填寫食譜名稱並加入食材！"); return; }

    let totalCals = 0, totalPro = 0, totalFat = 0, totalCarbs = 0;
    currentRecipeIngredients.forEach(ing => { totalCals+=ing.calories; totalPro+=ing.protein; totalFat+=ing.fat; totalCarbs+=ing.carbs; });

    foodDatabase.push({
        name: `${name} [自訂食譜]`,
        calories: Math.round(totalCals),
        protein: parseFloat(totalPro.toFixed(1)),
        fat: parseFloat(totalFat.toFixed(1)),
        carbs: parseFloat(totalCarbs.toFixed(1)),
        isDeleted: false
    });

    alert("食譜儲存成功！");
    currentRecipeIngredients = [];
    document.getElementById('recipe-name').value = '';
    updateRecipeUI();
}

// --- 我的食譜彈窗 ---
function openRecipeModal() {
    document.getElementById('recipe-modal').style.display = 'flex';
    renderMyRecipes();
}
function closeRecipeModal() {
    document.getElementById('recipe-modal').style.display = 'none';
}
function deleteCustomRecipe(index) {
    foodDatabase[index].isDeleted = true; // 軟刪除
    renderMyRecipes();
}
function renderMyRecipes() {
    const list = document.getElementById('my-recipes-list');
    list.innerHTML = '';
    let hasRecipe = false;
    
    foodDatabase.forEach((food, index) => {
        if (food.name.includes('[自訂食譜]') && !food.isDeleted) {
            hasRecipe = true;
            const el = document.createElement('div');
            el.className = 'food-item';
            el.innerHTML = `
                <div class="food-header">
                    <div class="food-title">${food.name.replace(' [自訂食譜]','')}</div>
                    <button class="btn-danger" onclick="deleteCustomRecipe(${index})">刪除</button>
                </div>
                <div class="food-macros">
                    <div><span>${food.calories}</span> kcal | P:${food.protein}g F:${food.fat}g C:${food.carbs}g</div>
                </div>
            `;
            list.appendChild(el);
        }
    });
    if(!hasRecipe) list.innerHTML = '<div class="empty-state">尚未建立任何自訂食譜。</div>';
}
