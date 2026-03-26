// ==========================================
// 1. 網路層與全域狀態 (Storage & State)
// ==========================================
const NetAPI = {
    save: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    load: (key) => JSON.parse(localStorage.getItem(key))
};

const KEYS = { logs: 'logs_vDual', recipes: 'recipes_vDual', plans: 'plans_vDual', user: 'user_vDual', gym: 'gym_vDual', theme: 'theme_vDual', gymPlans: 'gymPlans_vDual', posts: 'posts_vDual' };

let logs = NetAPI.load(KEYS.logs) || {};
let recipes = NetAPI.load(KEYS.recipes) || [];
let planner = NetAPI.load(KEYS.plans) || {};
let user = NetAPI.load(KEYS.user) || { gender:'male', h:175, w:75, targetW:70, a:25, act:1.2, weights:[], water:{} };
let gym = NetAPI.load(KEYS.gym) || {};
let communityPosts = NetAPI.load(KEYS.posts) || [];

let currentGymPlanDay = '週一';
let today = new Date().toLocaleDateString();
let currentPlanDate = today;
let todayMacroChart, planMacroChart, trendChart, weightChart, gymChartInstance;
let tempRecipeIngs = []; 
let restTimer; 
let currentGymType = 'strength'; 
let currentWeightRange = 7;
let currentCalMonth = new Date();

let activeFood = { today: {p:0, c:0, f:0}, plan: {p:0, c:0, f:0} };

let currentLang = NetAPI.load('lang_vDual') || 'zh';

// ==========================================
// 2. 多國語言與切換 (i18n)
// ==========================================
window.setLang = function(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if(i18nDict[lang] && i18nDict[lang][key]) {
            if(el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
                el.placeholder = i18nDict[lang][key];
            } else {
                el.innerText = i18nDict[lang][key];
            }
        }
    });
    NetAPI.save('lang_vDual', lang);
    const langSelect = document.getElementById('langSelect');
    if(langSelect) langSelect.value = lang;
    
    renderUserStats();
    renderLogs();
    initCharts();
    renderHistoryCalendar();
    
    const plannerElement = document.getElementById('gsubContent-planner');
    if(plannerElement && !plannerElement.classList.contains('hidden')) {
        initGymPlannerDays();
    }
};

// ==========================================
// 3. 導航切換 (Navigation)
// ==========================================
window.showTab = function(t) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(t + 'Tab').classList.add('active');
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('nav-active'));
    document.getElementById('n-' + t).classList.add('nav-active');
    window.scrollTo({top: 0, behavior: 'smooth'});
    
    if(t === 'user') { renderUserStats(); setTimeout(initCharts, 100); }
    if(t === 'gym') { renderGym(); setTimeout(initGymChart, 100); renderHistoryCalendar(); }
    if(t === 'mealHub') renderLogs();
    if(t === 'community') renderFeed();
};

window.switchMealSub = function(st) {
    document.querySelectorAll('.meal-sub-content').forEach(c => c.classList.add('hidden'));
    document.getElementById('subContent-' + st).classList.remove('hidden');
    document.querySelectorAll('#mealHubTab .sub-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('sub-' + st).classList.add('active');
    if(st === 'planner') initPlannerDates();
    if(st === 'library') renderSavedRecipes();
};

window.switchGymSub = function(st) {
    document.querySelectorAll('.gym-sub-content').forEach(c => c.classList.add('hidden'));
    document.getElementById('gsubContent-' + st).classList.remove('hidden');
    document.querySelectorAll('#gymTab .sub-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('gsub-' + st).classList.add('active');
    if(st === 'history') renderHistoryCalendar();
    if(st === 'planner') initGymPlannerDays();
    if(st === 'today') { renderGym(); setTimeout(initGymChart, 100); }
};

window.switchCommSub = function(st) {
    document.querySelectorAll('.comm-sub-content').forEach(c => c.classList.add('hidden'));
    document.getElementById('csubContent-' + st).classList.remove('hidden');
    document.querySelectorAll('#communityTab .sub-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('csub-' + st).classList.add('active');
    if(st === 'feed') renderFeed();
};

window.setGymType = function(type) {
    currentGymType = type;
    if(type === 'strength') {
        document.getElementById('btnStrength').classList.add('active');
        document.getElementById('btnCardio').classList.remove('active-cardio');
        document.getElementById('strengthInputs').classList.remove('hidden');
        document.getElementById('cardioInputs').classList.add('hidden');
        document.getElementById('gName').placeholder = currentLang==='en'?"🔍 Search Strength...":"🔍 搜尋重量訓練...";
    } else {
        document.getElementById('btnCardio').classList.add('active-cardio');
        document.getElementById('btnStrength').classList.remove('active');
        document.getElementById('cardioInputs').classList.remove('hidden');
        document.getElementById('strengthInputs').classList.add('hidden');
        document.getElementById('gName').placeholder = currentLang==='en'?"🔍 Search Cardio...":"🔍 搜尋有氧運動...";
    }
    document.getElementById('gymSearchRes').classList.add('hidden');
    document.getElementById('gName').value = '';
};

// ==========================================
// 4. 飲食與規劃核心邏輯 (Diet & Planner)
// ==========================================
window.searchFood = function(q, mode) {
    const boxes = { 'today':'searchRes', 'recipe':'recipeSearchRes', 'plan':'planSearchRes' };
    const box = document.getElementById(boxes[mode]);
    if(!q) { box.classList.add('hidden'); return; }
    let pool = (mode === 'today' || mode === 'plan') ? [...recipes, ...baseDB] : [...baseDB];
    
    const matches = pool.filter(f => f.name.toLowerCase().includes(q.toLowerCase())).slice(0, 10);
    
    box.innerHTML = matches.map(f => {
        let kcal = Math.round(f.p*4 + f.c*4 + f.f*9);
        return `<div class="p-5 border-b border-gray-200 dark:border-gray-700 cursor-pointer font-black text-sm hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors text-slate-800 dark:text-white" onclick="selectFood('${f.name.replace(/'/g, "\\'")}', ${f.p}, ${f.c}, ${f.f}, '${mode}')">
            <span class="opacity-50 mr-2 text-lg">${f.isRecipe ? '🍱' : '🥦'}</span>${f.name} 
            <span class="text-blue-500 float-right bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg text-xs">${kcal} kcal</span>
        </div>`;
    }).join('');
    box.classList.remove('hidden');
};

window.selectFood = function(n, p, c, f, mode) {
    let pEl = mode==='today' ? 'pIn' : 'planPIn';
    let cEl = mode==='today' ? 'cIn' : 'planCIn';
    let fEl = mode==='today' ? 'fIn' : 'planFIn';
    let searchEl = mode==='today' ? 'foodSearch' : 'planSearch';
    let qtyEl = mode==='today' ? 'foodQty' : 'planQty';
    
    if(mode === 'recipe') {
        tempRecipeIngs.push({ name: n, p, c, f }); renderTempRecipe(); document.getElementById('recipeIngSearch').value = '';
    } else {
        document.getElementById(searchEl).value = n;
        activeFood[mode] = { p:p, c:c, f:f };
        if(document.getElementById(qtyEl)) document.getElementById(qtyEl).value = 1;
        
        document.getElementById(pEl).value = p;
        document.getElementById(cEl).value = c;
        document.getElementById(fEl).value = f;
    }
    document.querySelectorAll('.suggestion-box').forEach(b => b.classList.add('hidden'));
};

window.changeFoodQty = function(delta, mode) {
    let qtyEl = document.getElementById(mode==='today' ? 'foodQty' : 'planQty');
    if(!qtyEl) return;
    let newQty = parseFloat(qtyEl.value) + delta;
    if(newQty < 0.1) newQty = 0.1;
    qtyEl.value = Number.isInteger(newQty) ? newQty : newQty.toFixed(1);
    updateFoodMacros(mode);
};

window.updateFoodMacros = function(mode) {
    let qty = parseFloat(document.getElementById(mode==='today' ? 'foodQty' : 'planQty').value) || 1;
    let base = activeFood[mode];
    document.getElementById(mode==='today' ? 'pIn' : 'planPIn').value = parseFloat((base.p * qty).toFixed(1));
    document.getElementById(mode==='today' ? 'cIn' : 'planCIn').value = parseFloat((base.c * qty).toFixed(1));
    document.getElementById(mode==='today' ? 'fIn' : 'planFIn').value = parseFloat((base.f * qty).toFixed(1));
};

window.searchGym = function(q, mode) {
    const box = mode === 'today' ? document.getElementById('gymSearchRes') : document.getElementById('gymPlanSearchRes');
    if(!q) { box.classList.add('hidden'); return; }
    const pool = currentGymType === 'cardio' ? cardioDB : gymDB;
    const matches = pool.filter(n => n.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
    box.innerHTML = matches.map(n => `<div class="p-5 border-b border-gray-200 dark:border-gray-700 cursor-pointer font-black text-sm hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors text-slate-800 dark:text-white" onclick="selectGym('${n.replace(/'/g, "\\'")}', '${mode}')">${currentGymType==='cardio'?'🏃':'🏋️'} ${n}</div>`).join('');
    if(matches.length > 0) box.classList.remove('hidden'); else box.classList.add('hidden');
};

window.selectGym = function(n, mode) { 
    if(mode === 'today') {
        document.getElementById('gName').value = n; document.getElementById('gymSearchRes').classList.add('hidden'); 
    } else {
        document.getElementById('gPlanName').value = n; document.getElementById('gymPlanSearchRes').classList.add('hidden');
    }
};

window.addLog = function() {
    let baseName = document.getElementById('foodSearch').value; if(!baseName) return;
    let qty = parseFloat(document.getElementById('foodQty').value) || 1;
    let finalName = qty !== 1 ? `${baseName} x${qty}` : baseName;
    
    if(!logs[today]) logs[today] = [];
    logs[today].push({ name: finalName, p: parseFloat(document.getElementById('pIn').value)||0, c: parseFloat(document.getElementById('cIn').value)||0, f: parseFloat(document.getElementById('fIn').value)||0, time: document.getElementById('mealTime').value });
    NetAPI.save(KEYS.logs, logs);
    
    document.getElementById('foodSearch').value = ''; document.getElementById('pIn').value=''; document.getElementById('cIn').value=''; document.getElementById('fIn').value=''; 
    document.getElementById('foodQty').value = 1;
    activeFood.today = {p:0, c:0, f:0};
    renderLogs();
};

window.renderLogs = function() {
    const container = document.getElementById('todayMealDisplay'); container.innerHTML = '';
    let sp=0, sc=0, sf=0;
    const labels = currentLang === 'en' ? 
        { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner', snack: '🍏 Snack' } : 
        { breakfast: '🌅 早餐時段', lunch: '☀️ 午餐時段', dinner: '🌙 晚餐時段', snack: '🍏 點心與其他' };

    Object.keys(labels).forEach(tk => {
        const sl = (logs[today]||[]).filter(l => l.time === tk || (!l.time && tk === 'snack'));
        if(sl.length > 0) {
            let html = `<div class="meal-section"><h4 class="meal-section-title">${labels[tk]}</h4>`;
            sl.forEach((l, idx) => {
                sp+=l.p; sc+=l.c; sf+=l.f;
                let kcal = Math.round(l.p*4 + l.c*4 + l.f*9);
                html += `<div class="card p-6 mb-3 flex justify-between items-center border-l-4 border-blue-500 shadow-sm relative overflow-hidden group">
                    <div class="relative z-10 w-full pr-12">
                        <p class="font-black text-base mb-1 truncate">${l.name}</p>
                        <div class="flex gap-2">
                            <span class="bg-gray-100 dark:bg-gray-800 text-[9px] font-black px-2 py-1 rounded text-slate-500 dark:text-gray-400 uppercase tracking-wider">P:${l.p} C:${l.c} F:${l.f}</span>
                            <span class="bg-blue-50 dark:bg-blue-900/30 text-[9px] font-black px-2 py-1 rounded text-blue-600 dark:text-blue-400 uppercase">${kcal} kcal</span>
                        </div>
                    </div>
                    <button onclick="removeLog('${tk}', ${idx})" class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 font-black flex items-center justify-center btn-press z-10">✕</button>
                </div>`;
            });
            container.innerHTML += html + `</div>`;
        }
    });
    let total = Math.round(sp*4 + sc*4 + sf*9);
    let pPct = total > 0 ? Math.round((sp*4/total)*100) : 0;
    let cPct = total > 0 ? Math.round((sc*4/total)*100) : 0;
    let fPct = total > 0 ? Math.round((sf*9/total)*100) : 0;

    document.getElementById('sumP').innerHTML = `${sp.toFixed(1)}g <br><span class="text-[10px] font-bold opacity-60">(${pPct}%)</span>`; 
    document.getElementById('sumC').innerHTML = `${sc.toFixed(1)}g <br><span class="text-[10px] font-bold opacity-60">(${cPct}%)</span>`;
    document.getElementById('sumF').innerHTML = `${sf.toFixed(1)}g <br><span class="text-[10px] font-bold opacity-60">(${fPct}%)</span>`; 
    document.getElementById('sumKcal').innerText = total;
    
    let bmr = (10*user.w)+(6.25*user.h)-(5*user.a);
    bmr = user.gender === 'male' ? bmr+5 : bmr-161;
    let tdee = Math.round(bmr*user.act);
    let goal = user.targetW < user.w ? tdee - 300 : (user.targetW > user.w ? tdee + 300 : tdee);
    document.getElementById('todayGoalKcal').innerText = goal || 0;
    
    updateMacroChart(sp, sc, sf);
};

window.removeLog = function(tk, idx) { logs[today].splice(logs[today].indexOf(logs[today].filter(l => l.time === tk || (!l.time && tk === 'snack'))[idx]), 1); NetAPI.save(KEYS.logs, logs); renderLogs(); };
window.addWater = function(amt) { user.water[today] = Math.max(0, (user.water[today] || 0) + amt); NetAPI.save(KEYS.user, user); renderWater(); };
window.renderWater = function() { document.getElementById('waterCurrent').innerText = (user.water[today] || 0) + ' ml'; };

window.initPlannerDates = function() {
    const bar = document.getElementById('plannerDateBar'); bar.innerHTML = '';
    for(let i=0; i<7; i++) {
        let d = new Date(); d.setDate(d.getDate()+i); let ds = d.toLocaleDateString();
        bar.innerHTML += `<div class="date-chip ${ds === currentPlanDate ? 'active' : ''}" onclick="selectPlanDate('${ds}')">${i===0?(currentLang==='en'?'Today':'今天'):(d.getMonth()+1)+'/'+d.getDate()}</div>`;
    }
    document.getElementById('selectedPlanDateText').innerText = currentPlanDate; renderPlannerDetail(currentPlanDate);
};

window.selectPlanDate = function(ds) { currentPlanDate = ds; initPlannerDates(); };

window.addPlan = function() {
    let baseName = document.getElementById('planSearch').value; if(!baseName) return;
    let qty = parseFloat(document.getElementById('planQty').value) || 1;
    let finalName = qty !== 1 ? `${baseName} x${qty}` : baseName;
    
    if(!planner[currentPlanDate]) planner[currentPlanDate] = [];
    planner[currentPlanDate].push({ name: finalName, p: parseFloat(document.getElementById('planPIn').value)||0, c: parseFloat(document.getElementById('planCIn').value)||0, f: parseFloat(document.getElementById('planFIn').value)||0, time: document.getElementById('planMealTime').value });
    NetAPI.save(KEYS.plans, planner);
    
    document.getElementById('planSearch').value = ''; document.getElementById('planPIn').value=''; document.getElementById('planCIn').value=''; document.getElementById('planFIn').value='';
    document.getElementById('planQty').value = 1;
    activeFood.plan = {p:0, c:0, f:0};
    renderPlannerDetail(currentPlanDate);
};

window.renderPlannerDetail = function(ds) {
    const container = document.getElementById('planDetailList'); container.innerHTML = '';
    let pp=0, pc=0, pf=0;
    const labels = currentLang === 'en' ? 
        { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner', snack: '🍏 Snack' } : 
        { breakfast: '🌅 早餐時段', lunch: '☀️ 午餐時段', dinner: '🌙 晚餐時段', snack: '🍏 點心與其他' };
        
    Object.keys(labels).forEach(tk => {
        const sp = (planner[ds]||[]).filter(p => p.time === tk);
        if(sp.length > 0) {
            let html = `<div class="meal-section"><h4 class="meal-section-title">${labels[tk]}</h4>`;
            sp.forEach((p, idx) => {
                pp+=p.p; pc+=p.c; pf+=p.f;
                let kcal = Math.round(p.p*4 + p.c*4 + p.f*9);
                html += `<div class="card p-5 mb-3 flex justify-between items-center border-l-4 border-orange-400"><div><p class="font-black text-sm truncate max-w-[200px]">${p.name}</p><p class="text-[10px] font-black opacity-40 uppercase">P:${p.p} C:${p.c} F:${p.f} <span class="text-orange-500 ml-1">${kcal}kcal</span></p></div><button onclick="removePlan('${ds}', '${tk}', ${idx})" class="text-red-400 font-black px-2">✕</button></div>`;
            });
            container.innerHTML += html + `</div>`;
        }
    });
    
    let planTotal = Math.round(pp*4 + pc*4 + pf*9);
    let ppPct = planTotal > 0 ? Math.round(((pp*4)/planTotal)*100) : 0;
    let cpPct = planTotal > 0 ? Math.round(((pc*4)/planTotal)*100) : 0;
    let fpPct = planTotal > 0 ? Math.round(((pf*9)/planTotal)*100) : 0;
    
    document.getElementById('planP').innerHTML = `${pp.toFixed(1)}g <span class="opacity-60 font-bold ml-1 text-blue-200">(${ppPct}%)</span>`;
    document.getElementById('planC').innerHTML = `${pc.toFixed(1)}g <span class="opacity-60 font-bold ml-1 text-green-200">(${cpPct}%)</span>`;
    document.getElementById('planF').innerHTML = `${pf.toFixed(1)}g <span class="opacity-60 font-bold ml-1 text-yellow-200">(${fpPct}%)</span>`;
    document.getElementById('planTotalKcal').innerText = planTotal + " kcal";
    updatePlanChart(pp, pc, pf);
};

window.updatePlanChart = function(p, c, f) {
    const ctx = document.getElementById('planMacroChart').getContext('2d');
    if(planMacroChart) planMacroChart.destroy();
    planMacroChart = new Chart(ctx, { type:'doughnut', data:{ datasets:[{data:[p*4||0.1, c*4||0.1, f*9||0.1], backgroundColor:['#bfdbfe','#bbf7d0','#fef08a'], borderWidth:0}]}, options:{cutout:'70%', layout:{padding:0}, plugins:{legend:{display:false}, tooltip:{enabled:false}}} });
};

window.removePlan = function(ds, tk, idx) { planner[ds].splice(planner[ds].indexOf(planner[ds].filter(p => p.time === tk)[idx]), 1); NetAPI.save(KEYS.plans, planner); renderPlannerDetail(ds); };
window.renderTempRecipe = function() { document.getElementById('tempIngList').innerHTML = tempRecipeIngs.map((ing, i) => `<li class="flex justify-between items-center p-4 bg-white dark:bg-gray-900 rounded-2xl text-sm font-black shadow-sm border border-gray-100 dark:border-gray-800"><span>${ing.name} <span class="text-[10px] opacity-40 ml-2">P:${ing.p} C:${ing.c} F:${ing.f}</span></span><button onclick="tempRecipeIngs.splice(${i},1);renderTempRecipe()" class="w-8 h-8 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center text-xs">✕</button></li>`).join(''); };
window.saveRecipe = function() { const name = document.getElementById('newRecipeName').value; if(!name || tempRecipeIngs.length === 0) return; let tp=0, tc=0, tf=0; tempRecipeIngs.forEach(i => { tp += i.p; tc += i.c; tf += i.f; }); recipes.push({ name, p: parseFloat(tp.toFixed(1)), c: parseFloat(tc.toFixed(1)), f: parseFloat(tf.toFixed(1)), isRecipe: true }); NetAPI.save(KEYS.recipes, recipes); tempRecipeIngs = []; document.getElementById('newRecipeName').value = ''; renderTempRecipe(); renderSavedRecipes(); };
window.renderSavedRecipes = function() { document.getElementById('savedRecipesList').innerHTML = recipes.map((r, i) => `<div class="card p-6 mb-3 flex justify-between items-center border-l-4 border-emerald-500"><div><p class="font-black text-base mb-1">🍱 ${r.name}</p><p class="text-[10px] opacity-50 font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded inline-block">P:${r.p} C:${r.c} F:${r.f}</p></div><button onclick="recipes.splice(${i},1);NetAPI.save(KEYS.recipes,recipes);renderSavedRecipes()" class="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 font-black flex items-center justify-center">✕</button></div>`).join(''); };
window.updateMacroChart = function(p,c,f) { const ctx = document.getElementById('todayMacroChart').getContext('2d'); if(todayMacroChart) todayMacroChart.destroy(); todayMacroChart = new Chart(ctx, { type:'doughnut', data:{ datasets:[{data:[p*4||0.1, c*4||0.1, f*9||0.1], backgroundColor:['#3b82f6','#22c55e','#eab308'], borderWidth:0, hoverOffset: 4}]}, options:{cutout:'75%', layout:{padding:0}, plugins:{legend:{display:false}, tooltip:{enabled:false}}} }); };

// ==========================================
// 5. 用戶數據與圖表 (User & Charts)
// ==========================================
window.updateUser = function() {
    user.w = parseFloat(document.getElementById('uW').value); user.targetW = parseFloat(document.getElementById('uTargetW').value);
    user.h = parseFloat(document.getElementById('uH').value); user.a = parseInt(document.getElementById('uA').value);
    user.act = parseFloat(document.getElementById('uAct').value); user.gender = document.getElementById('uGender').value;
    
    if(!user.weights) user.weights = [];
    let existingWeight = user.weights.find(w => w.d === today);
    if(existingWeight) { existingWeight.v = user.w; } 
    else { user.weights.push({d:today, v:user.w}); }
    
    user.weights.sort((a,b) => new Date(a.d) - new Date(b.d));
    NetAPI.save(KEYS.user, user); 
    renderUserStats(); 
    initCharts();
    renderLogs();
};

window.renderUserStats = function() {
    let bmr = (10*user.w)+(6.25*user.h)-(5*user.a);
    bmr = user.gender === 'male' ? bmr+5 : bmr-161;
    let tdee = Math.round(bmr*user.act);
    let goal = user.targetW < user.w ? tdee - 300 : (user.targetW > user.w ? tdee + 300 : tdee);
    
    if(document.getElementById('dispTdee')) document.getElementById('dispTdee').innerText = tdee || '--';
    if(document.getElementById('dispBmi')) document.getElementById('dispBmi').innerText = (user.w / ((user.h/100)**2)).toFixed(1) || '--';
    if(document.getElementById('dispToTarget')) document.getElementById('dispToTarget').innerText = Math.abs(user.w - user.targetW).toFixed(1) + "kg";
    if(document.getElementById('statGoalKcal')) document.getElementById('statGoalKcal').innerText = goal || 0;
    if(document.getElementById('todayGoalKcal')) document.getElementById('todayGoalKcal').innerText = goal || 0;

    let labelZh = user.targetW < user.w ? '減脂期目標' : (user.targetW > user.w ? '增肌期目標' : '維持現狀');
    let labelEn = user.targetW < user.w ? 'Fat Loss Goal' : (user.targetW > user.w ? 'Muscle Gain Goal' : 'Maintenance');
    let logicZh = `🎯 系統判定：${labelZh}`;
    let logicEn = `🎯 AI Logic: ${labelEn}`;

    if(document.getElementById('todayGoalLabel')) document.getElementById('todayGoalLabel').innerText = currentLang === 'en' ? labelEn : labelZh;
    if(document.getElementById('statGoalLogic')) document.getElementById('statGoalLogic').innerText = currentLang === 'en' ? logicEn : logicZh;
};

window.setWeightRange = function(range) { currentWeightRange = range; initCharts(); };

window.initCharts = function() {
    if(trendChart) trendChart.destroy();
    if(weightChart) weightChart.destroy();
    
    const last7 = [...Array(7)].map((_, i) => { let d = new Date(); d.setDate(d.getDate()-(6-i)); return d.toLocaleDateString(); });
    const calData = last7.map(d => (logs[d]||[]).reduce((sum, item) => sum + (item.p*4+item.c*4+item.f*9), 0));
    const calLabels = last7.map(d => { let p = d.split('/'); return p.length === 3 ? `${p[1]}/${p[2]}` : d; });
    
    if(document.getElementById('trendChart')) {
        trendChart = new Chart(document.getElementById('trendChart'), { 
            type:'bar', 
            data:{ labels: calLabels, datasets:[{ label: currentLang==='en'?'Calories':'熱量', data: calData, backgroundColor:'#3b82f6', borderRadius:12, barThickness: 16}]}, 
            options:{ maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{display:true, beginAtZero:true, grid:{display:false}, border:{display:false}}, x:{grid:{display:false}, border:{display:false}}}}
        });
    }

    let wtData = user.weights || [];
    if(currentWeightRange !== 'all') wtData = wtData.slice(-currentWeightRange);
    const labels = wtData.map(w => { let parts = w.d.split('/'); return parts.length === 3 ? `${parts[1]}/${parts[2]}` : w.d; });
    const values = wtData.map(w => w.v);

    if(document.getElementById('weightChart')) {
        weightChart = new Chart(document.getElementById('weightChart'), { 
            type:'line', 
            data:{ labels: labels, datasets:[{ label: currentLang==='en'?'Weight':'體重', data: values, borderColor:'#8b5cf6', borderWidth:4, pointBackgroundColor:'#fff', pointBorderColor:'#8b5cf6', pointBorderWidth:3, pointRadius:5, fill:true, backgroundColor:'rgba(139,92,246,0.1)', tension:0.4 }]}, 
            options:{ maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{display:true, grid:{display:false}, border:{display:false}}, x:{display:true, grid:{display:false}, border:{display:false}} } }
        });
    }
};

// ==========================================
// 6. 健身與計時器 (Gym & Calendar)
// ==========================================
window.startRestTimer = function(seconds) {
    clearInterval(restTimer);
    let t = parseInt(seconds) || 90;
    const display = document.getElementById('restTimerDisplay');
    const text = document.getElementById('restTimerText');
    display.classList.remove('hidden');
    
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
    
    restTimer = setInterval(() => {
        t--;
        let m = Math.floor(t/60).toString().padStart(2,'0');
        let s = (t%60).toString().padStart(2,'0');
        text.innerText = (currentLang==='en'?'Rest: ':'休息: ') + `${m}:${s}`;
        if(t <= 0) {
            clearInterval(restTimer);
            text.innerText = "🔥";
            
            if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 800]);
            
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("OmniFit", {
                    body: currentLang === 'en' ? "Rest is over! Get back to work! 💪" : "休息結束，準備下一組訓練！💪",
                    icon: "https://cdn-icons-png.flaticon.com/512/2964/2964514.png"
                });
            }
            
            setTimeout(() => display.classList.add('hidden'), 3000);
        }
    }, 1000);
};
window.stopRestTimer = function() { clearInterval(restTimer); document.getElementById('restTimerDisplay').classList.add('hidden'); };

window.copyGym = function(idx) {
    let g = gym[today][idx];
    setGymType(g.type || 'strength');
    document.getElementById('gName').value = g.n;
    if(g.type === 'cardio') { document.getElementById('gMins').value = g.mins; document.getElementById('gKm').value = g.km; } 
    else { document.getElementById('gW').value = g.w; document.getElementById('gS').value = g.s; document.getElementById('gR').value = g.r; }
    window.scrollTo({ top: document.getElementById('gymTab').offsetTop, behavior: 'smooth' });
};

window.addGym = function() {
    let name = document.getElementById('gName').value; if(!name) return;
    if(!gym[today]) gym[today] = [];
    
    if(currentGymType === 'strength') {
        let w = parseFloat(document.getElementById('gW').value)||0, s = parseInt(document.getElementById('gS').value)||0, r = parseInt(document.getElementById('gR').value)||0;
        gym[today].push({ type: 'strength', n: name, w: w, s: s, r: r, v: w*s*r });
        document.getElementById('gW').value = ''; document.getElementById('gS').value = ''; document.getElementById('gR').value = '';
    } else {
        let mins = parseFloat(document.getElementById('gMins').value)||0, km = parseFloat(document.getElementById('gKm').value)||0;
        gym[today].push({ type: 'cardio', n: name, mins: mins, km: km, v: mins * 10 }); 
        document.getElementById('gMins').value = ''; document.getElementById('gKm').value = '';
    }
    
    NetAPI.save(KEYS.gym, gym);
    document.getElementById('gName').value = '';
    renderGym(); setTimeout(initGymChart, 100);
};

window.renderGym = function() {
    let dailyVol = 0;
    let maxWeights = {};
    for(let d in gym) { gym[d].forEach(g => { if(g.type !== 'cardio' && (!maxWeights[g.n] || g.w > maxWeights[g.n])) maxWeights[g.n] = g.w; }); }

    document.getElementById('gymLogs').innerHTML = (gym[today]||[]).map((g, idx) => {
        dailyVol += g.v;
        let detailsHTML = '';
        if(g.type === 'cardio') {
            detailsHTML = `<div class="flex items-baseline gap-2 mt-1 text-emerald-600 dark:text-emerald-400"><span class="text-xl font-black">${g.mins}</span><span class="text-[10px] font-bold opacity-40">Mins</span><span class="text-[10px] font-bold opacity-20 mx-1">|</span><span class="text-xl font-black">${g.km}</span><span class="text-[10px] font-bold opacity-40">KM</span></div>`;
        } else {
            let prBadge = (g.w > 0 && g.w >= maxWeights[g.n]) ? '<span class="pr-badge px-2 py-0.5 rounded-full text-[9px] font-black ml-2 shadow-lg tracking-widest inline-block">👑 PR</span>' : '';
            detailsHTML = `<div class="flex items-center mb-2 flex-wrap gap-y-2"><p class="font-black text-lg leading-none">${g.n}</p>${prBadge}</div><div class="flex items-baseline gap-2 mt-1 text-indigo-600 dark:text-indigo-400"><span class="text-xl font-black">${g.w}</span><span class="text-[10px] font-bold opacity-40">KG</span><span class="text-[10px] font-bold opacity-20 mx-1">×</span><span class="text-xl font-black">${g.s}</span><span class="text-[10px] font-bold opacity-40">Sets</span><span class="text-[10px] font-bold opacity-20 mx-1">×</span><span class="text-xl font-black">${g.r}</span><span class="text-[10px] font-bold opacity-40">Reps</span></div>`;
        }
        let borderColor = g.type === 'cardio' ? 'border-emerald-500' : 'border-indigo-500';

        return `<div class="card p-6 mb-4 border-l-[6px] ${borderColor} shadow-md relative overflow-hidden group"><div class="flex justify-between items-center relative z-10"><div class="flex-1">${g.type === 'cardio' ? `<p class="font-black text-lg leading-none mb-2">${g.n}</p>` : ''}${detailsHTML}</div><div class="flex flex-col gap-3"><button onclick="copyGym(${idx})" class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-black flex items-center justify-center btn-press shadow-sm">➕</button><button onclick="removeGym(${idx})" class="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 font-black flex items-center justify-center btn-press shadow-sm">✕</button></div></div></div>`;
    }).join('');
    document.getElementById('dailyVolume').innerText = dailyVol;
};

window.removeGym = function(idx) { gym[today].splice(idx, 1); NetAPI.save(KEYS.gym, gym); renderGym(); setTimeout(initGymChart, 100); };

window.initGymChart = function() {
    if(gymChartInstance) gymChartInstance.destroy();
    const last7 = [...Array(7)].map((_, i) => { let d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toLocaleDateString(); });
    const volData = last7.map(d => (gym[d] || []).reduce((sum, item) => sum + item.v, 0));
    gymChartInstance = new Chart(document.getElementById('gymVolumeChart'), {
        type: 'line',
        data: { labels: last7.map(d=> { let p=d.split('/'); return p.length===3?`${p[1]}/${p[2]}`:d; }), datasets: [{ data: volData, borderColor: '#6366f1', borderWidth: 3, backgroundColor: 'rgba(99, 102, 241, 0.15)', fill: true, tension: 0.5, pointRadius:0, pointHitRadius: 10 }] },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: {enabled:false} }, scales: { x: { display: false }, y: { display: false, min: 0 } }, layout: {padding: 0} }
    });
};

window.changeCalMonth = function(delta) {
    currentCalMonth.setMonth(currentCalMonth.getMonth() + delta);
    renderHistoryCalendar();
};

window.renderHistoryCalendar = function() {
    const y = currentCalMonth.getFullYear();
    const m = currentCalMonth.getMonth();
    document.getElementById('calMonthYear').innerText = `${y} / ${(m+1).toString().padStart(2, '0')}`;
    
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    
    let gridHTML = '';
    for(let i=0; i<firstDay; i++) { gridHTML += `<div class="cal-day empty"></div>`; }
    
    let todayObj = new Date();
    let isCurrentMonth = (todayObj.getFullYear() === y && todayObj.getMonth() === m);
    let todayDate = todayObj.getDate();

    for(let i=1; i<=daysInMonth; i++) {
        let dateStr = new Date(y, m, i).toLocaleDateString();
        let hasGym = gym[dateStr] && gym[dateStr].length > 0;
        let dotHTML = hasGym ? `<div class="cal-dot"></div>` : '';
        let isTodayClass = (isCurrentMonth && i === todayDate) ? 'border border-indigo-500 text-indigo-500' : '';
        
        gridHTML += `<div class="cal-day ${isTodayClass}" onclick="selectCalDate('${dateStr}', this)">${i}${dotHTML}</div>`;
    }
    document.getElementById('calGrid').innerHTML = gridHTML;
};

window.selectCalDate = function(dateStr, el) {
    document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
    renderGymHistory(dateStr);
};

window.renderGymHistory = function(dateStr) {
    const container = document.getElementById('gymHistoryList');
    let dayGym = gym[dateStr] || [];

    if(dayGym.length === 0) {
        container.innerHTML = `<p class="text-center opacity-40 font-black py-10 text-sm">${currentLang==='en'?'No Records':'無紀錄'}</p>`; return;
    }
    
    let dailyVol = dayGym.reduce((sum, g) => sum + g.v, 0);
    let html = `<div class="flex justify-between items-end px-2 mb-6">
        <h4 class="text-sm font-black opacity-80 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">${dateStr}</h4>
        <span class="text-sm font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800">Vol: ${dailyVol}</span>
    </div>`;
    
    dayGym.forEach(g => {
        html += `<div class="card p-5 mb-4 flex justify-between items-center border-l-[4px] border-indigo-300 dark:border-indigo-700 bg-white/50 dark:bg-gray-800/50">
            <div>
                <p class="font-black text-lg mb-1 text-slate-800 dark:text-white">${g.n}</p>
                <p class="text-[11px] opacity-60 font-black uppercase tracking-wide text-slate-600 dark:text-gray-300">
                    ${g.type==='cardio' ? `${g.mins}mins × ${g.km}km` : `${g.w}kg × ${g.s}sets × ${g.r}reps`}
                </p>
            </div>
        </div>`;
    });
    container.innerHTML = html;
};

window.initGymPlannerDays = function() {
    const bar = document.getElementById('gymPlannerDateBar'); bar.innerHTML = '';
    WEEK_DAYS.forEach(day => {
        let displayDay = dayLabels[currentLang][day];
        bar.innerHTML += `<div class="date-chip ${day === currentGymPlanDay ? 'active' : ''}" onclick="selectGymPlanDay('${day}')">${displayDay}</div>`;
    });
    document.getElementById('selectedGymPlanDayText').innerText = dayLabels[currentLang][currentGymPlanDay];
    renderGymPlanList();
};

window.selectGymPlanDay = function(day) { currentGymPlanDay = day; initGymPlannerDays(); };

window.addGymPlan = function() {
    let name = document.getElementById('gPlanName').value; if(!name) return;
    let w = parseFloat(document.getElementById('gPlanW').value)||0; let s = parseInt(document.getElementById('gPlanS').value)||0; let r = parseInt(document.getElementById('gPlanR').value)||0;
    
    // Safety check for gymPlanner object structure
    if(!gymPlanner) gymPlanner = { '週一':[], '週二':[], '週三':[], '週四':[], '週五':[], '週六':[], '週日':[] };
    if(!gymPlanner[currentGymPlanDay]) gymPlanner[currentGymPlanDay] = [];
    
    gymPlanner[currentGymPlanDay].push({ n: name, w: w, s: s, r: r });
    NetAPI.save(KEYS.gymPlans, gymPlanner);
    
    document.getElementById('gPlanName').value = ''; document.getElementById('gPlanW').value = ''; document.getElementById('gPlanS').value = ''; document.getElementById('gPlanR').value = '';
    renderGymPlanList();
};

window.renderGymPlanList = function() {
    const container = document.getElementById('gymPlanList');
    container.innerHTML = ((gymPlanner && gymPlanner[currentGymPlanDay])||[]).map((g, idx) => {
        return `<div class="card p-5 mb-3 flex justify-between items-center border-l-4 border-indigo-400 bg-white/50 dark:bg-gray-800/50">
            <div>
                <p class="font-black text-sm text-slate-800 dark:text-white">${g.n}</p>
                <p class="text-[10px] font-black opacity-40 uppercase text-slate-600 dark:text-gray-300">${g.w}kg × ${g.s}sets × ${g.r}reps</p>
            </div>
            <button onclick="removeGymPlan(${idx})" class="text-red-400 font-black px-2 btn-press">✕</button>
        </div>`;
    }).join('');
};

window.removeGymPlan = function(idx) { gymPlanner[currentGymPlanDay].splice(idx, 1); NetAPI.save(KEYS.gymPlans, gymPlanner); renderGymPlanList(); };

// ==========================================
// 7. 社群與動態牆 (Community & Feed)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const mediaUploadInput = document.getElementById('mediaUpload');
    if (mediaUploadInput) {
        mediaUploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if(file) {
                const mediaBox = document.getElementById('mediaBox');
                mediaBox.innerHTML = ''; 
                const fileURL = URL.createObjectURL(file);
                
                if (file.type.startsWith('video/')) {
                    const videoNode = document.createElement('video');
                    videoNode.src = fileURL; videoNode.controls = true; videoNode.className = "w-full max-h-96 object-contain";
                    mediaBox.appendChild(videoNode);
                    tempMediaType = 'video';
                } else if (file.type.startsWith('image/')) {
                    const imgNode = document.createElement('img');
                    imgNode.src = fileURL; imgNode.className = "w-full max-h-96 object-cover";
                    mediaBox.appendChild(imgNode);
                    tempMediaType = 'image';
                }
                
                const reader = new FileReader();
                reader.onloadend = () => { tempMediaData = reader.result; };
                reader.readAsDataURL(file);

                document.getElementById('mediaPreviewContainer').classList.remove('hidden');
                if (navigator.vibrate) navigator.vibrate(50);
            }
        });
    }
});

window.publishPost = function() {
    const text = document.getElementById('postText').value;
    const type = document.getElementById('postType').value;
    
    if(!text && !tempMediaData) {
        alert(currentLang==='en'?"Please write something or upload media.":"請輸入內容或上傳媒體！");
        return;
    }

    const newPost = {
        id: Date.now(),
        author: 'Me',
        avatar: 'M',
        text: text,
        type: type, // diet, training, physique
        media: tempMediaData,
        mediaType: tempMediaType,
        date: new Date().toLocaleString(),
        likes: 0
    };

    communityPosts.unshift(newPost);
    NetAPI.save(KEYS.posts, communityPosts);
    
    document.getElementById('postText').value = '';
    document.getElementById('mediaUpload').value = '';
    document.getElementById('mediaPreviewContainer').classList.add('hidden');
    tempMediaData = null; tempMediaType = null;

    switchCommSub('feed');
};

window.renderFeed = function() {
    const container = document.getElementById('feedList');
    const searchInput = document.getElementById('socialSearch');
    const q = searchInput ? searchInput.value.toLowerCase() : '';
    
    if(communityPosts.length === 0) {
        communityPosts = [
            { id: 1, author: 'Alex_Fitness', avatar: 'A', text: 'Just hit a new PR on Deadlift! 140kg x 5! 🔥💪', type: 'training', date: '2026/03/24', likes: 12 },
            { id: 2, author: 'HealthyEats', avatar: 'H', text: '今天的增肌餐：烤鮭魚配藜麥與大量蔬菜。', type: 'diet', date: '2026/03/24', likes: 8 }
        ];
    }

    let filteredPosts = communityPosts.filter(p => (p.text && p.text.toLowerCase().includes(q)) || p.author.toLowerCase().includes(q));

    container.innerHTML = filteredPosts.map(p => {
        let badge = p.type === 'diet' ? '🍱 Diet' : (p.type === 'training' ? '💪 Training' : '👤 Physique');
        let mediaHTML = '';
        if(p.media) {
            if(p.mediaType === 'video') {
                mediaHTML = `<video src="${p.media}" controls class="w-full rounded-2xl mt-3"></video>`;
            } else {
                mediaHTML = `<img src="${p.media}" class="w-full rounded-2xl mt-3 object-cover max-h-80">`;
            }
        }

        return `<div class="card p-5 border-t-4 border-pink-400 dark:border-pink-600">
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-400 rounded-full flex items-center justify-center text-white font-black shadow-md">${p.avatar}</div>
                    <div>
                        <p class="font-black text-sm text-slate-800 dark:text-white">${p.author}</p>
                        <p class="text-[10px] text-slate-500 dark:text-gray-400">${p.date}</p>
                    </div>
                </div>
                <span class="text-[10px] font-black bg-pink-100 dark:bg-pink-900/40 text-pink-600 px-2 py-1 rounded-lg">${badge}</span>
            </div>
            <p class="text-sm font-bold text-slate-700 dark:text-gray-300 leading-relaxed">${p.text}</p>
            ${mediaHTML}
            <div class="mt-4 flex gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button class="text-xs font-black text-slate-500 dark:text-gray-400 flex items-center gap-1 btn-press" onclick="likePost(${p.id})">❤️ ${p.likes} Likes</button>
                <button class="text-xs font-black text-slate-500 dark:text-gray-400 flex items-center gap-1 btn-press">💬 Comment</button>
            </div>
        </div>`;
    }).join('');
};

window.likePost = function(id) {
    let post = communityPosts.find(p => p.id === id);
    if(post) { post.likes++; NetAPI.save(KEYS.posts, communityPosts); renderFeed(); }
};

// ==========================================
// 8. 系統設定與初始化 (Settings & Init)
// ==========================================
window.toggleDarkMode = function() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    document.getElementById('themeBtn').innerText = isDark ? '☀️' : '🌙';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    NetAPI.save(KEYS.theme, isDark ? 'dark' : 'light');
};

window.onload = () => {
    const savedTheme = NetAPI.load(KEYS.theme);
    if(savedTheme === 'dark') { 
        document.documentElement.classList.add('dark'); 
        document.getElementById('themeBtn').innerText = '☀️'; 
        if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = true;
    }
    
    document.getElementById('uW').value = user.w || ''; 
    document.getElementById('uTargetW').value = user.targetW || '';
    document.getElementById('uH').value = user.h || ''; 
    document.getElementById('uA').value = user.a || '';
    document.getElementById('uGender').value = user.gender || 'male'; 
    document.getElementById('uAct').value = user.act || '1.2';
    
    setLang(currentLang);
    showTab('mealHub'); // 確保進入時初始化第一個畫面
};
