// js/meals.js
let dailyFoods = []; let plannedFoods = { day1: [], day2: [], day3: [], day4: [], day5: [], day6: [], day7: [] };
let waterIntake = 0; let currentRecipeIngredients = []; let currentMealContext = 'today'; 
let selectedFoodBase = null; // 儲存目前搜尋到的食物基底營養

document.addEventListener('DOMContentLoaded', () => { updateFoodUI(); });

function switchMealContext(context, element) {
    currentMealContext = context;
    document.querySelectorAll('#tab-meals .sub-tab-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    if (context === 'recipe') {
        document.getElementById('tracker-view').style.display = 'none';
        document.getElementById('recipe-view').style.display = 'block';
    } else {
        document.getElementById('tracker-view').style.display = 'block';
        document.getElementById('recipe-view').style.display = 'none';
        if (context === 'plan') {
            document.getElementById('plan-day-selector').style.display = 'block';
            document.getElementById('water-tracker-card').style.display = 'none';
            document.getElementById('list-subtitle').innerText = '規劃紀錄清單';
        } else {
            document.getElementById('plan-day-selector').style.display = 'none';
            document.getElementById('water-tracker-card').style.display = 'block';
            document.getElementById('list-subtitle').innerText = '今日紀錄清單';
        }
        updateFoodUI();
    }
}

function updateWater(amount) { waterIntake = Math.max(0, waterIntake + amount); document.getElementById('water-current').innerText = waterIntake; }

function handleSearch(query) {
    const list = document.getElementById('autocomplete-list'); list.innerHTML = ''; selectedFoodBase = null;
    if (!query) { list.style.display = 'none'; return; }
    const matches = foodDatabase.filter(f => f.name.toLowerCase().includes(query.toLowerCase()) && !f.isDeleted);
    if (matches.length > 0) {
        list.style.display = 'block';
        matches.forEach(food => {
            const item = document.createElement('div'); item.className = 'autocomplete-item';
            item.innerHTML = `<span>${food.name}</span><span class="ac-nutrients">${food.calories}kcal</span>`;
            item.onclick = () => {
                document.getElementById('food-search').value = food.name;
                selectedFoodBase = food;
                document.getElementById('food-qty').value = 1;
                handleQuantityChange(); // 即時載入並計算
                list.style.display = 'none';
            };
            list.appendChild(item);
        });
    } else { list.style.display = 'none'; }
}

// 修復：修改份數時，會根據基底食物自動乘算營養素
function handleQuantityChange() {
    let qty = parseFloat(document.getElementById('food-qty').value) || 1;
    if (selectedFoodBase) {
        document.getElementById('food-calories').value = Math.round(selectedFoodBase.calories * qty);
        document.getElementById('food-protein').value = (selectedFoodBase.protein * qty).toFixed(1);
        document.getElementById('food-fat').value = (selectedFoodBase.fat * qty).toFixed(1);
        document.getElementById('food-carbs').value = (selectedFoodBase.carbs * qty).toFixed(1);
    }
}

function addFoodRecord() {
    const name = document.getElementById('food-search').value.trim() || '自訂食物';
    const qty = parseFloat(document.getElementById('food-qty').value) || 1;
    const cals = parseFloat(document.getElementById('food-calories').value) || 0;
    const pro = parseFloat(document.getElementById('food-protein').value) || 0;
    const fat = parseFloat(document.getElementById('food-fat').value) || 0;
    const carbs = parseFloat(document.getElementById('food-carbs').value) || 0;
    
    if(!cals && !pro && !fat && !carbs) { alert("請填寫至少一項營養素或正確搜尋食物！"); return; }

    const newFood = {
        id: Date.now(), name: qty !== 1 ? `${name} (x${qty})` : name, type: document.getElementById('meal-type').value,
        calories: cals, protein: pro, fat: fat, carbs: carbs, isDeleted: false
    };

    if (currentMealContext === 'today') dailyFoods.push(newFood);
    else plannedFoods[document.getElementById('plan-day').value].push(newFood);
    
    document.querySelectorAll('#manual-macros input, #food-search').forEach(i => i.value='');
    document.getElementById('food-qty').value = 1; selectedFoodBase = null;
    updateFoodUI();
}

function deleteRecord(id, type) {
    let arr = type === 'today' ? dailyFoods : plannedFoods[type];
    const item = arr.find(f => f.id === id); if(item) item.isDeleted = true;
    updateFoodUI();
}

function updateFoodUI() {
    let tc = 0, tp = 0, tf = 0, tcbs = 0;
    const list = document.getElementById('food-list-container'); list.innerHTML = '';
    let day = document.getElementById('plan-day').value;
    let source = (currentMealContext === 'today' ? dailyFoods : plannedFoods[day]).filter(f => !f.isDeleted);

    if (source.length === 0) { list.innerHTML = '<div class="empty-state">無紀錄。</div>'; }
    else {
        [...source].reverse().forEach(f => {
            tc += f.calories; tp += f.protein; tf += f.fat; tcbs += f.carbs;
            list.innerHTML += `<div class="food-item"><div class="food-header"><div class="food-title">${f.name} <span style="font-size:10px; color:#a0a0a0;">${f.type}</span></div><button class="btn-danger" onclick="deleteRecord(${f.id}, '${currentMealContext === 'today' ? 'today' : day}')">刪除</button></div><div class="food-macros"><div><span>${Math.round(f.calories)}</span> kcal</div><div>P:${f.protein.toFixed(1)}g F:${f.fat.toFixed(1)}g C:${f.carbs.toFixed(1)}g</div></div></div>`;
        });
    }
    
    document.getElementById('total-calories').innerText = Math.round(tc);
    document.getElementById('total-protein').innerText = tp.toFixed(1);
    document.getElementById('total-fat').innerText = tf.toFixed(1);
    document.getElementById('total-carbs').innerText = tcbs.toFixed(1);

    // 計算百分比顯示
    let pCals = tp * 4; let fCals = tf * 9; let cCals = tcbs * 4;
    let calcTotal = pCals + fCals + cCals;
    document.getElementById('pct-protein').innerText = calcTotal > 0 ? Math.round((pCals/calcTotal)*100) + '%' : '0%';
    document.getElementById('pct-fat').innerText = calcTotal > 0 ? Math.round((fCals/calcTotal)*100) + '%' : '0%';
    document.getElementById('pct-carbs').innerText = calcTotal > 0 ? Math.round((cCals/calcTotal)*100) + '%' : '0%';
}

// 食譜區段邏輯
let selectedRecipeBase = null;
function handleRecipeSearch(query) {
    const list = document.getElementById('recipe-autocomplete-list'); list.innerHTML = ''; selectedRecipeBase = null;
    if (!query) { list.style.display = 'none'; return; }
    const matches = foodDatabase.filter(f => f.name.toLowerCase().includes(query.toLowerCase()) && !f.isDeleted);
    if (matches.length > 0) {
        list.style.display = 'block';
        matches.forEach(food => {
            const item = document.createElement('div'); item.className = 'autocomplete-item'; item.innerHTML = `<span>${food.name}</span>`;
            item.onclick = () => {
                document.getElementById('recipe-food-search').value = food.name;
                selectedRecipeBase = food; document.getElementById('recipe-food-qty').value = 1;
                handleRecipeQuantityChange(); list.style.display = 'none';
            };
            list.appendChild(item);
        });
    } else { list.style.display = 'none'; }
}

function handleRecipeQuantityChange() {
    let qty = parseFloat(document.getElementById('recipe-food-qty').value) || 1;
    if (selectedRecipeBase) {
        document.getElementById('recipe-food-calories').value = Math.round(selectedRecipeBase.calories * qty);
        document.getElementById('recipe-food-protein').value = (selectedRecipeBase.protein * qty).toFixed(1);
        document.getElementById('recipe-food-fat').value = (selectedRecipeBase.fat * qty).toFixed(1);
        document.getElementById('recipe-food-carbs').value = (selectedRecipeBase.carbs * qty).toFixed(1);
    }
}

function addRecipeIngredient() {
    const name = document.getElementById('recipe-food-search').value.trim();
    if(!name) return;
    const cals = parseFloat(document.getElementById('recipe-food-calories').value)||0; const pro = parseFloat(document.getElementById('recipe-food-protein').value)||0;
    const fat = parseFloat(document.getElementById('recipe-food-fat').value)||0; const carbs = parseFloat(document.getElementById('recipe-food-carbs').value)||0;
    
    currentRecipeIngredients.push({ id: Date.now(), name: name, calories: cals, protein: pro, fat: fat, carbs: carbs });
    document.querySelectorAll('#recipe-manual-macros input, #recipe-food-search').forEach(i => i.value='');
    document.getElementById('recipe-food-qty').value = 1; selectedRecipeBase = null; updateRecipeUI();
}

function updateRecipeUI() {
    let tc=0, tp=0, tf=0, tcbs=0; const list = document.getElementById('recipe-ingredients-list'); list.innerHTML = '';
    currentRecipeIngredients.forEach(i => { tc+=i.calories; tp+=i.protein; tf+=i.fat; tcbs+=i.carbs;
        list.innerHTML += `<div class="food-item"><div class="food-header"><div class="food-title">${i.name}</div></div><div class="food-macros"><div>${Math.round(i.calories)} kcal</div><div>P:${i.protein.toFixed(1)} F:${i.fat.toFixed(1)} C:${i.carbs.toFixed(1)}</div></div></div>`;
    });
    document.getElementById('recipe-total-calories').innerText = Math.round(tc);
    document.getElementById('recipe-total-protein').innerText = tp.toFixed(1);
    document.getElementById('recipe-total-fat').innerText = tf.toFixed(1);
    document.getElementById('recipe-total-carbs').innerText = tcbs.toFixed(1);
}

function saveRecipe() {
    const name = document.getElementById('recipe-name').value.trim();
    if (!name || currentRecipeIngredients.length === 0) { alert("請填寫名稱並加入食材！"); return; }
    let tc=0, tp=0, tf=0, tcbs=0; currentRecipeIngredients.forEach(i => { tc+=i.calories; tp+=i.protein; tf+=i.fat; tcbs+=i.carbs; });
    foodDatabase.push({ name: `${name} (自訂食譜)`, calories: Math.round(tc), protein: parseFloat(tp.toFixed(1)), fat: parseFloat(tf.toFixed(1)), carbs: parseFloat(tcbs.toFixed(1)), isDeleted: false });
    alert("儲存成功，以後可以直接搜尋了！"); currentRecipeIngredients = []; document.getElementById('recipe-name').value = ''; updateRecipeUI();
}
