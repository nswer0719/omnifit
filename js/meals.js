// js/meals.js (請直接覆寫)
let dailyFoods = [];
let plannedFoods = { day1: [], day2: [], day3: [], day4: [], day5: [], day6: [], day7: [] };
let waterIntake = 0; 
let currentRecipeIngredients = [];
let currentMealContext = 'today'; 

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
    const list = document.getElementById('autocomplete-list');
    list.innerHTML = '';
    if (!query) { list.style.display = 'none'; return; }
    const matches = foodDatabase.filter(f => f.name.toLowerCase().includes(query.toLowerCase()) && !f.isDeleted);
    if (matches.length > 0) {
        list.style.display = 'block';
        matches.forEach(food => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.innerHTML = `<span class="ac-name">${food.name}</span><span class="ac-nutrients">${food.calories}kcal</span>`;
            item.onclick = () => {
                document.getElementById('food-search').value = food.name;
                document.getElementById('food-calories').value = food.calories;
                document.getElementById('food-protein').value = food.protein;
                document.getElementById('food-fat').value = food.fat;
                document.getElementById('food-carbs').value = food.carbs;
                document.getElementById('food-qty').value = 1;
                list.style.display = 'none';
            };
            list.appendChild(item);
        });
    } else { list.style.display = 'none'; }
}

function handleQuantityChange() {
    // 讓份數改變時簡單乘以上面基礎數值 (若用戶輸入了自訂數值亦可乘)
}

function addFoodRecord() {
    const name = document.getElementById('food-search').value.trim() || '自訂食物';
    const qty = parseFloat(document.getElementById('food-qty').value) || 1;
    const cals = parseFloat(document.getElementById('food-calories').value) || 0;
    const pro = parseFloat(document.getElementById('food-protein').value) || 0;
    const fat = parseFloat(document.getElementById('food-fat').value) || 0;
    const carbs = parseFloat(document.getElementById('food-carbs').value) || 0;
    
    const newFood = {
        id: Date.now(), name: qty !== 1 ? `${name} (x${qty})` : name, type: document.getElementById('meal-type').value,
        calories: cals * qty, protein: pro * qty, fat: fat * qty, carbs: carbs * qty,
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit' }), isDeleted: false
    };

    if (currentMealContext === 'today') dailyFoods.push(newFood);
    else plannedFoods[document.getElementById('plan-day').value].push(newFood);
    
    document.querySelectorAll('#tab-meals input[type="number"], #food-search').forEach(i => i.value='');
    document.getElementById('food-qty').value = 1;
    updateFoodUI();
}

function deleteRecord(id, type) {
    let arr = type === 'today' ? dailyFoods : plannedFoods[type];
    const item = arr.find(f => f.id === id);
    if(item) item.isDeleted = true;
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
            list.innerHTML += `<div class="food-item"><div class="food-header"><div class="food-title">${f.name} <span class="food-tag">${f.type}</span></div><button class="btn-danger" onclick="deleteRecord(${f.id}, '${currentMealContext === 'today' ? 'today' : day}')">刪除</button></div><div class="food-macros"><div>卡路里: <span>${Math.round(f.calories)}</span> kcal</div><div>P:<span>${f.protein.toFixed(1)}</span>g F:<span>${f.fat.toFixed(1)}</span>g C:<span>${f.carbs.toFixed(1)}</span>g</div></div></div>`;
        });
    }
    document.getElementById('total-calories').innerText = Math.round(tc);
    document.getElementById('total-protein').innerText = tp.toFixed(1);
    document.getElementById('total-fat').innerText = tf.toFixed(1);
    document.getElementById('total-carbs').innerText = tcbs.toFixed(1);
}

// 食譜邏輯
function handleRecipeSearch(q) {
    const list = document.getElementById('recipe-autocomplete-list'); list.innerHTML = '';
    if (!q) { list.style.display = 'none'; return; }
    const matches = foodDatabase.filter(f => f.name.toLowerCase().includes(q.toLowerCase()) && !f.isDeleted);
    if (matches.length > 0) {
        list.style.display = 'block';
        matches.forEach(food => {
            const item = document.createElement('div'); item.className = 'autocomplete-item'; item.innerHTML = `<span class="ac-name">${food.name}</span>`;
            item.onclick = () => {
                document.getElementById('recipe-food-search').value = food.name;
                document.getElementById('recipe-food-calories').value = food.calories;
                document.getElementById('recipe-food-protein').value = food.protein;
                document.getElementById('recipe-food-fat').value = food.fat;
                document.getElementById('recipe-food-carbs').value = food.carbs;
                list.style.display = 'none';
            };
            list.appendChild(item);
        });
    } else { list.style.display = 'none'; }
}

function updateRecipePreviewQty() {}

function addRecipeIngredient() {
    const name = document.getElementById('recipe-food-search').value.trim() || '自訂食材';
    const qty = parseFloat(document.getElementById('recipe-food-qty').value) || 1;
    const cals = parseFloat(document.getElementById('recipe-food-calories').value) || 0;
    const pro = parseFloat(document.getElementById('recipe-food-protein').value) || 0;
    const fat = parseFloat(document.getElementById('recipe-food-fat').value) || 0;
    const carbs = parseFloat(document.getElementById('recipe-food-carbs').value) || 0;
    
    currentRecipeIngredients.push({ id: Date.now(), name: qty!==1?`${name} (x${qty})`:name, calories: cals*qty, protein: pro*qty, fat: fat*qty, carbs: carbs*qty });
    document.querySelectorAll('#recipe-manual-macros input, #recipe-food-search').forEach(i => i.value='');
    document.getElementById('recipe-food-qty').value = 1;
    updateRecipeUI();
}

function deleteRecipeDraftItem(id) { currentRecipeIngredients = currentRecipeIngredients.filter(i => i.id !== id); updateRecipeUI(); }

function updateRecipeUI() {
    let tc=0, tp=0, tf=0, tcbs=0;
    const list = document.getElementById('recipe-ingredients-list'); list.innerHTML = '';
    if (currentRecipeIngredients.length === 0) list.innerHTML = '<div class="empty-state">尚未加入任何食材</div>';
    else {
        currentRecipeIngredients.forEach(i => {
            tc+=i.calories; tp+=i.protein; tf+=i.fat; tcbs+=i.carbs;
            list.innerHTML += `<div class="food-item"><div class="food-header"><div class="food-title">${i.name}</div><button class="btn-danger" onclick="deleteRecipeDraftItem(${i.id})">移除</button></div><div class="food-macros"><div><span>${Math.round(i.calories)}</span> kcal</div><div>P:${i.protein.toFixed(1)}g F:${i.fat.toFixed(1)}g C:${i.carbs.toFixed(1)}g</div></div></div>`;
        });
    }
    document.getElementById('recipe-total-calories').innerText = Math.round(tc);
    document.getElementById('recipe-total-protein').innerText = tp.toFixed(1);
    document.getElementById('recipe-total-fat').innerText = tf.toFixed(1);
    document.getElementById('recipe-total-carbs').innerText = tcbs.toFixed(1);
}

function saveRecipe() {
    const name = document.getElementById('recipe-name').value.trim();
    if (!name || currentRecipeIngredients.length === 0) { alert("請填寫食譜名稱並加入食材！"); return; }
    let tc=0, tp=0, tf=0, tcbs=0;
    currentRecipeIngredients.forEach(i => { tc+=i.calories; tp+=i.protein; tf+=i.fat; tcbs+=i.carbs; });
    foodDatabase.push({ name: `${name} [自訂食譜]`, calories: Math.round(tc), protein: parseFloat(tp.toFixed(1)), fat: parseFloat(tf.toFixed(1)), carbs: parseFloat(tcbs.toFixed(1)), isDeleted: false });
    alert("儲存成功！"); currentRecipeIngredients = []; document.getElementById('recipe-name').value = ''; updateRecipeUI();
}

function openRecipeModal() { document.getElementById('recipe-modal').style.display = 'flex'; renderMyRecipes(); }
function closeRecipeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
function deleteCustomRecipe(idx) { foodDatabase[idx].isDeleted = true; renderMyRecipes(); }
function renderMyRecipes() {
    const list = document.getElementById('my-recipes-list'); list.innerHTML = ''; let has = false;
    foodDatabase.forEach((f, i) => {
        if (f.name.includes('[自訂食譜]') && !f.isDeleted) {
            has = true; list.innerHTML += `<div class="food-item"><div class="food-header"><div class="food-title">${f.name.replace(' [自訂食譜]','')}</div><button class="btn-danger" onclick="deleteCustomRecipe(${i})">刪除</button></div><div class="food-macros"><div><span>${f.calories}</span> kcal | P:${f.protein}g F:${f.fat}g C:${f.carbs}g</div></div></div>`;
        }
    });
    if(!has) list.innerHTML = '<div class="empty-state">無自訂食譜。</div>';
}
