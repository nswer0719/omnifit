// ====== 網路層模擬與快取 (Storage Layer) ======
const NetAPI = {
    save: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    load: (key) => JSON.parse(localStorage.getItem(key))
};

const KEYS = { logs: 'logs_vDual', recipes: 'recipes_vDual', plans: 'plans_vDual', user: 'user_vDual', gym: 'gym_vDual', theme: 'theme_vDual', gymPlans: 'gymPlans_vDual', posts: 'posts_vDual', profile: 'profile_vDual' };

// ====== 狀態初始化 (State Init) ======
let logs = NetAPI.load(KEYS.logs) || {};
let recipes = NetAPI.load(KEYS.recipes) || [];
let planner = NetAPI.load(KEYS.plans) || {};
let user = NetAPI.load(KEYS.user) || { gender:'male', h:175, w:75, targetW:70, a:25, act:1.2, weights:[], water:{} };
let gym = NetAPI.load(KEYS.gym) || {};
let communityPosts = NetAPI.load(KEYS.posts) || [];
let socialProfile = NetAPI.load(KEYS.profile) || { name: 'Omni User', bio: '每天都要比昨天更強！', avatar: '', followers: 128, following: 45, likedPosts: [] };
if(!socialProfile.likedPosts) socialProfile.likedPosts = [];

const WEEK_DAYS = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
let gymPlanner = NetAPI.load(KEYS.gymPlans) || { '週一':[], '週二':[], '週三':[], '週四':[], '週五':[], '週六':[], '週日':[] };
let currentGymPlanDay = '週一';
let currentGymPlanType = 'strength'; 

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
let tempMediaData = null;
let tempMediaType = null;

// ====== 導航切換邏輯 ======
function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(t + 'Tab').classList.add('active');
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('nav-active'));
    document.getElementById('n-' + t).classList.add('nav-active');
    window.scrollTo({top: 0, behavior: 'smooth'});
    
    if(t === 'user') { renderUserStats(); setTimeout(initCharts, 100); }
    if(t === 'gym') { renderGym(); setTimeout(initGymChart, 100); renderHistoryCalendar(); }
    if(t === 'mealHub') renderLogs();
    if(t === 'community') { renderProfile(); renderFeed(); }
}

function switchMealSub(st) {
    document.querySelectorAll('.meal-sub-content').forEach(c => c.classList.add('hidden'));
    document.getElementById('subContent-' + st).classList.remove('hidden');
    document.querySelectorAll('#mealHubTab .sub-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('sub-' + st).classList.add('active');
    if(st === 'planner') initPlannerDates();
    if(st === 'library') renderSavedRecipes();
}

function switchGymSub(st) {
    document.querySelectorAll('.gym-sub-content').forEach(c => c.classList.add('hidden'));
    document.getElementById('gsubContent-' + st).classList.remove('hidden');
    document.querySelectorAll('#gymTab .sub-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('gsub-' + st).classList.add('active');
    if(st === 'history') renderHistoryCalendar();
    if(st === 'planner') initGymPlannerDays();
    if(st === 'today') { renderGym(); setTimeout(initGymChart, 100); }
}

function switchCommSub(st) {
    document.querySelectorAll('.comm-sub-content').forEach(c => c.classList.add('hidden'));
    document.getElementById('csubContent-' + st).classList.remove('hidden');
    document.querySelectorAll('#communityTab .sub-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('csub-' + st).classList.add('active');
    if(st === 'feed') renderFeed();
    if(st === 'profile') renderProfile();
}

function setGymType(type) {
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
}

function setGymPlanType(type) {
    currentGymPlanType = type;
    if(type === 'strength') {
        document.getElementById('btnPlanStrength').classList.add('active');
        document.getElementById('btnPlanCardio').classList.remove('active-cardio');
        document.getElementById('strengthPlanInputs').classList.remove('hidden');
        document.getElementById('cardioPlanInputs').classList.add('hidden');
        document.getElementById('gPlanName').placeholder = currentLang==='en'?"🔍 Search Strength...":"🔍 搜尋重量訓練...";
    } else {
        document.getElementById('btnPlanCardio').classList.add('active-cardio');
        document.getElementById('btnPlanStrength').classList.remove('active');
        document.getElementById('cardioPlanInputs').classList.remove('hidden');
        document.getElementById('strengthPlanInputs').classList.add('hidden');
        document.getElementById('gPlanName').placeholder = currentLang==='en'?"🔍 Search Cardio...":"🔍 搜尋有氧運動...";
    }
    document.getElementById('gymPlanSearchRes').classList.add('hidden');
    document.getElementById('gPlanName').value = '';
}

// ====== 搜尋與份量修改 ======
function searchFood(q, mode) {
    const boxes = { 'today':'searchRes', 'recipe':'recipeSearchRes', 'plan':'planSearchRes' };
    const box = document.getElementById(boxes[mode]);
    if(!q) { box.classList.add('hidden'); return; }
    let pool = (mode === 'today' || mode === 'plan') ? [...recipes, ...baseDB] : [...baseDB];
    const matches = pool.filter(f => f.name.toLowerCase().includes(q.toLowerCase())).slice(0, 10);
    box.innerHTML = matches.map(f => {
        let kcal = Math.round(f.p*4 + f.c*4 + f.f*9);
        return `<div class="p-5 border-b border-slate-100 dark:border-slate-800 cursor-pointer font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-slate-800 dark:text-slate-200" onclick="selectFood('${f.name.replace(/'/g, "\\'")}', ${f.p}, ${f.c}, ${f.f}, '${mode}')">
            <span class="opacity-60 mr-2 text-lg">${f.isRecipe ? '🍱' : '🥦'}</span>${f.name} 
            <span class="text-blue-600 dark:text-blue-400 float-right bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg text-[11px] font-black">${kcal} kcal</span>
        </div>`;
    }).join('');
    box.classList.remove('hidden');
}

function selectFood(n, p, c, f, mode) {
    let pEl = mode==='today' ? 'pIn' : 'planPIn'; let cEl = mode==='today' ? 'cIn' : 'planCIn'; let fEl = mode==='today' ? 'fIn' : 'planFIn';
    let searchEl = mode==='today' ? 'foodSearch' : 'planSearch'; let qtyEl = mode==='today' ? 'foodQty' : 'planQty';
    
    if(mode === 'recipe') {
        tempRecipeIngs.push({ name: n, p, c, f }); renderTempRecipe(); document.getElementById('recipeIngSearch').value = '';
    } else {
        document.getElementById(searchEl).value = n;
        activeFood[mode] = { p:p, c:c, f:f };
        if(document.getElementById(qtyEl)) document.getElementById(qtyEl).value = 1;
        document.getElementById(pEl).value = p; document.getElementById(cEl).value = c; document.getElementById(fEl).value = f;
    }
    document.querySelectorAll('.suggestion-box').forEach(b => b.classList.add('hidden'));
}

function changeFoodQty(delta, mode) {
    let qtyEl = document.getElementById(mode==='today' ? 'foodQty' : 'planQty');
    if(!qtyEl) return;
    let newQty = parseFloat(qtyEl.value) + delta;
    if(newQty < 0.1) newQty = 0.1;
    qtyEl.value = Number.isInteger(newQty) ? newQty : newQty.toFixed(1);
    updateFoodMacros(mode);
}

function updateFoodMacros(mode) {
    let qty = parseFloat(document.getElementById(mode==='today' ? 'foodQty' : 'planQty').value) || 1;
    let base = activeFood[mode];
    document.getElementById(mode==='today' ? 'pIn' : 'planPIn').value = parseFloat((base.p * qty).toFixed(1));
    document.getElementById(mode==='today' ? 'cIn' : 'planCIn').value = parseFloat((base.c * qty).toFixed(1));
    document.getElementById(mode==='today' ? 'fIn' : 'planFIn').value = parseFloat((base.f * qty).toFixed(1));
}

function searchGym(q, mode) {
    const box = mode === 'today' ? document.getElementById('gymSearchRes') : document.getElementById('gymPlanSearchRes');
    if(!q) { box.classList.add('hidden'); return; }
    let gymType = mode === 'today' ? currentGymType : currentGymPlanType;
    const pool = gymType === 'cardio' ? cardioDB : gymDB;
    const matches = pool.filter(n => n.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
    box.innerHTML = matches.map(n => `<div class="p-5 border-b border-slate-100 dark:border-slate-800 cursor-pointer font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-slate-800 dark:text-slate-200" onclick="selectGym('${n.replace(/'/g, "\\'")}', '${mode}')">${gymType==='cardio'?'🏃':'🏋️'} ${n}</div>`).join('');
    if(matches.length > 0) box.classList.remove('hidden'); else box.classList.add('hidden');
}
function selectGym(n, mode) { 
    if(mode === 'today') { document.getElementById('gName').value = n; document.getElementById('gymSearchRes').classList.add('hidden'); } 
    else { document.getElementById('gPlanName').value = n; document.getElementById('gymPlanSearchRes').classList.add('hidden'); }
}

// ====== 飲食記錄渲染 ======
function addLog() {
    let baseName = document.getElementById('foodSearch').value; if(!baseName) return;
    let qty = parseFloat(document.getElementById('foodQty').value) || 1;
    let finalName = qty !== 1 ? `${baseName} x${qty}` : baseName;
    if(!logs[today]) logs[today] = [];
    logs[today].push({ name: finalName, p: parseFloat(document.getElementById('pIn').value)||0, c: parseFloat(document.getElementById('cIn').value)||0, f: parseFloat(document.getElementById('fIn').value)||0, time: document.getElementById('mealTime').value });
    NetAPI.save(KEYS.logs, logs);
    document.getElementById('foodSearch').value = ''; document.getElementById('pIn').value=''; document.getElementById('cIn').value=''; document.getElementById('fIn').value=''; 
    document.getElementById('foodQty').value = 1; activeFood.today = {p:0, c:0, f:0}; renderLogs();
}

function renderLogs() {
    const container = document.getElementById('todayMealDisplay'); container.innerHTML = '';
    let sp=0, sc=0, sf=0;
    const labels = currentLang === 'en' ? { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner', snack: '🍏 Snack' } : { breakfast: '🌅 早餐', lunch: '☀️ 午餐', dinner: '🌙 晚餐', snack: '🍏 點心' };

    Object.keys(labels).forEach(tk => {
        const sl = (logs[today]||[]).filter(l => l.time === tk || (!l.time && tk === 'snack'));
        if(sl.length > 0) {
            let html = `<div class="meal-section"><h4 class="meal-section-title">${labels[tk]}</h4>`;
            sl.forEach((l, idx) => {
                sp+=l.p; sc+=l.c; sf+=l.f; let kcal = Math.round(l.p*4 + l.c*4 + l.f*9);
                html += `<div class="card p-5 mb-3 flex justify-between items-center border-l-[4px] border-blue-500 shadow-sm relative overflow-hidden group hover:border-l-8 transition-all">
                    <div class="relative z-10 w-full pr-10">
                        <p class="font-black text-sm mb-1.5 truncate text-slate-800 dark:text-white tracking-tight">${l.name}</p>
                        <div class="flex gap-2">
                            <span class="bg-slate-100 dark:bg-slate-800 text-[9px] font-black px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 uppercase tracking-wider">P:${l.p} C:${l.c} F:${l.f}</span>
                            <span class="bg-blue-50 dark:bg-blue-900/30 text-[9px] font-black px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 uppercase">${kcal} kcal</span>
                        </div>
                    </div>
                    <button onclick="removeLog('${tk}', ${idx})" class="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-500 font-black flex items-center justify-center btn-press z-10 transition-colors">✕</button>
                </div>`;
            });
            container.innerHTML += html + `</div>`;
        }
    });
    let total = Math.round(sp*4 + sc*4 + sf*9);
    let pPct = total > 0 ? Math.round((sp*4/total)*100) : 0; let cPct = total > 0 ? Math.round((sc*4/total)*100) : 0; let fPct = total > 0 ? Math.round((sf*9/total)*100) : 0;
    document.getElementById('sumP').innerHTML = `${sp.toFixed(1)}g <br><span class="text-[10px] font-bold opacity-60 text-blue-500">(${pPct}%)</span>`; 
    document.getElementById('sumC').innerHTML = `${sc.toFixed(1)}g <br><span class="text-[10px] font-bold opacity-60 text-emerald-500">(${cPct}%)</span>`;
    document.getElementById('sumF').innerHTML = `${sf.toFixed(1)}g <br><span class="text-[10px] font-bold opacity-60 text-amber-500">(${fPct}%)</span>`; 
    document.getElementById('sumKcal').innerText = total;
    
    let bmr = (10*user.w)+(6.25*user.h)-(5*user.a); bmr = user.gender === 'male' ? bmr+5 : bmr-161;
    let tdee = Math.round(bmr*user.act); let goal = user.targetW < user.w ? tdee - 300 : (user.targetW > user.w ? tdee + 300 : tdee);
    document.getElementById('todayGoalKcal').innerText = goal || 0;
    updateMacroChart(sp, sc, sf);
}
function removeLog(tk, idx) { logs[today].splice(logs[today].indexOf(logs[today].filter(l => l.time === tk || (!l.time && tk === 'snack'))[idx]), 1); NetAPI.save(KEYS.logs, logs); renderLogs(); }
function addWater(amt) { user.water[today] = Math.max(0, (user.water[today] || 0) + amt); NetAPI.save(KEYS.user, user); renderWater(); }
function renderWater() { document.getElementById('waterCurrent').innerText = (user.water[today] || 0) + ' ml'; }

// ====== Planner 7日規劃 ======
function initPlannerDates() {
    const bar = document.getElementById('plannerDateBar'); bar.innerHTML = '';
    for(let i=0; i<7; i++) {
        let d = new Date(); d.setDate(d.getDate()+i); let ds = d.toLocaleDateString();
        bar.innerHTML += `<div class="date-chip ${ds === currentPlanDate ? 'active' : ''}" onclick="selectPlanDate('${ds}')">${i===0?(currentLang==='en'?'Today':'今天'):(d.getMonth()+1)+'/'+d.getDate()}</div>`;
    }
    document.getElementById('selectedPlanDateText').innerText = currentPlanDate; renderPlannerDetail(currentPlanDate);
}
function selectPlanDate(ds) { currentPlanDate = ds; initPlannerDates(); }

function addPlan() {
    let baseName = document.getElementById('planSearch').value; if(!baseName) return;
    let qty = parseFloat(document.getElementById('planQty').value) || 1; let finalName = qty !== 1 ? `${baseName} x${qty}` : baseName;
    if(!planner[currentPlanDate]) planner[currentPlanDate] = [];
    planner[currentPlanDate].push({ name: finalName, p: parseFloat(document.getElementById('planPIn').value)||0, c: parseFloat(document.getElementById('planCIn').value)||0, f: parseFloat(document.getElementById('planFIn').value)||0, time: document.getElementById('planMealTime').value });
    NetAPI.save(KEYS.plans, planner);
    document.getElementById('planSearch').value = ''; document.getElementById('planPIn').value=''; document.getElementById('planCIn').value=''; document.getElementById('planFIn').value=''; document.getElementById('planQty').value = 1; activeFood.plan = {p:0, c:0, f:0}; renderPlannerDetail(currentPlanDate);
}

function renderPlannerDetail(ds) {
    const container = document.getElementById('planDetailList'); container.innerHTML = ''; let pp=0, pc=0, pf=0;
    const labels = currentLang === 'en' ? { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner', snack: '🍏 Snack' } : { breakfast: '🌅 早餐', lunch: '☀️ 午餐', dinner: '🌙 晚餐', snack: '🍏 點心' };
    Object.keys(labels).forEach(tk => {
        const sp = (planner[ds]||[]).filter(p => p.time === tk);
        if(sp.length > 0) {
            let html = `<div class="meal-section"><h4 class="meal-section-title">${labels[tk]}</h4>`;
            sp.forEach((p, idx) => {
                pp+=p.p; pc+=p.c; pf+=p.f; let kcal = Math.round(p.p*4 + p.c*4 + p.f*9);
                html += `<div class="card p-5 mb-3 flex justify-between items-center border-l-[4px] border-amber-500 hover:border-l-8 transition-all"><div><p class="font-black text-sm truncate max-w-[200px] text-slate-800 dark:text-white tracking-tight">${p.name}</p><p class="text-[10px] font-black opacity-60 uppercase mt-1">P:${p.p} C:${p.c} F:${p.f} <span class="text-amber-500 dark:text-amber-400 ml-2">${kcal}kcal</span></p></div><button onclick="removePlan('${ds}', '${tk}', ${idx})" class="text-red-400 font-black px-2 btn-press">✕</button></div>`;
            });
            container.innerHTML += html + `</div>`;
        }
    });
    let planTotal = Math.round(pp*4 + pc*4 + pf*9); let ppPct = planTotal > 0 ? Math.round(((pp*4)/planTotal)*100) : 0; let cpPct = planTotal > 0 ? Math.round(((pc*4)/planTotal)*100) : 0; let fpPct = planTotal > 0 ? Math.round(((pf*9)/planTotal)*100) : 0;
    document.getElementById('planP').innerHTML = `${pp.toFixed(1)}g <span class="opacity-80 font-black ml-1 text-amber-100">(${ppPct}%)</span>`;
    document.getElementById('planC').innerHTML = `${pc.toFixed(1)}g <span class="opacity-80 font-black ml-1 text-orange-100">(${cpPct}%)</span>`;
    document.getElementById('planF').innerHTML = `${pf.toFixed(1)}g <span class="opacity-80 font-black ml-1 text-yellow-100">(${fpPct}%)</span>`;
    document.getElementById('planTotalKcal').innerText = planTotal + " kcal"; updatePlanChart(pp, pc, pf);
}
function updatePlanChart(p, c, f) { const ctx = document.getElementById('planMacroChart').getContext('2d'); if(planMacroChart) planMacroChart.destroy(); planMacroChart = new Chart(ctx, { type:'doughnut', data:{ datasets:[{data:[p*4||0.1, c*4||0.1, f*9||0.1], backgroundColor:['#fbbf24','#f97316','#fef08a'], borderWidth:0}]}, options:{cutout:'75%', layout:{padding:0}, plugins:{legend:{display:false}, tooltip:{enabled:false}}} }); }
function removePlan(ds, tk, idx) { planner[ds].splice(planner[ds].indexOf(planner[ds].filter(p => p.time === tk)[idx]), 1); NetAPI.save(KEYS.plans, planner); renderPlannerDetail(ds); }

function renderTempRecipe() { document.getElementById('tempIngList').innerHTML = tempRecipeIngs.map((ing, i) => `<li class="flex justify-between items-center p-4 bg-white dark:bg-slate-900 rounded-2xl text-sm font-black shadow-sm border border-slate-100 dark:border-slate-800"><span>${ing.name} <span class="text-[10px] opacity-50 ml-2">P:${ing.p} C:${ing.c} F:${ing.f}</span></span><button onclick="tempRecipeIngs.splice(${i},1);renderTempRecipe()" class="w-8 h-8 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center text-xs btn-press">✕</button></li>`).join(''); }
function saveRecipe() { const name = document.getElementById('newRecipeName').value; if(!name || tempRecipeIngs.length === 0) return; let tp=0, tc=0, tf=0; tempRecipeIngs.forEach(i => { tp += i.p; tc += i.c; tf += i.f; }); recipes.push({ name, p: parseFloat(tp.toFixed(1)), c: parseFloat(tc.toFixed(1)), f: parseFloat(tf.toFixed(1)), isRecipe: true }); NetAPI.save(KEYS.recipes, recipes); tempRecipeIngs = []; document.getElementById('newRecipeName').value = ''; renderTempRecipe(); renderSavedRecipes(); }
function renderSavedRecipes() { document.getElementById('savedRecipesList').innerHTML = recipes.map((r, i) => `<div class="card p-5 mb-3 flex justify-between items-center border-l-[4px] border-emerald-500 hover:border-l-8 transition-all"><div><p class="font-black text-sm mb-1 text-slate-800 dark:text-white tracking-tight">🍱 ${r.name}</p><p class="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded inline-block text-slate-500 dark:text-slate-400">P:${r.p} C:${r.c} F:${r.f}</p></div><button onclick="recipes.splice(${i},1);NetAPI.save(KEYS.recipes,recipes);renderSavedRecipes()" class="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 font-black flex items-center justify-center btn-press">✕</button></div>`).join(''); }
function updateMacroChart(p,c,f) { const ctx = document.getElementById('todayMacroChart').getContext('2d'); if(todayMacroChart) todayMacroChart.destroy(); todayMacroChart = new Chart(ctx, { type:'doughnut', data:{ datasets:[{data:[p*4||0.1, c*4||0.1, f*9||0.1], backgroundColor:['#2563eb','#10b981','#f59e0b'], borderWidth:0, hoverOffset: 4}]}, options:{cutout:'75%', layout:{padding:0}, plugins:{legend:{display:false}, tooltip:{enabled:false}}} }); }

// ====== 用戶數據與圖表 ======
function updateUser() {
    user.w = parseFloat(document.getElementById('uW').value); user.targetW = parseFloat(document.getElementById('uTargetW').value); user.h = parseFloat(document.getElementById('uH').value); user.a = parseInt(document.getElementById('uA').value); user.act = parseFloat(document.getElementById('uAct').value); user.gender = document.getElementById('uGender').value;
    if(!user.weights) user.weights = []; let existingWeight = user.weights.find(w => w.d === today); if(existingWeight) { existingWeight.v = user.w; } else { user.weights.push({d:today, v:user.w}); } user.weights.sort((a,b) => new Date(a.d) - new Date(b.d));
    NetAPI.save(KEYS.user, user); renderUserStats(); initCharts(); renderLogs();
}

function renderUserStats() {
    let bmr = (10*user.w)+(6.25*user.h)-(5*user.a); bmr = user.gender === 'male' ? bmr+5 : bmr-161; let tdee = Math.round(bmr*user.act); let goal = user.targetW < user.w ? tdee - 300 : (user.targetW > user.w ? tdee + 300 : tdee);
    if(document.getElementById('dispTdee')) document.getElementById('dispTdee').innerText = tdee || '--'; if(document.getElementById('dispBmi')) document.getElementById('dispBmi').innerText = (user.w / ((user.h/100)**2)).toFixed(1) || '--'; if(document.getElementById('dispToTarget')) document.getElementById('dispToTarget').innerText = Math.abs(user.w - user.targetW).toFixed(1) + "kg"; if(document.getElementById('statGoalKcal')) document.getElementById('statGoalKcal').innerText = goal || 0; if(document.getElementById('todayGoalKcal')) document.getElementById('todayGoalKcal').innerText = goal || 0;
    let labelZh = user.targetW < user.w ? '減脂期目標' : (user.targetW > user.w ? '增肌期目標' : '維持現狀'); let labelEn = user.targetW < user.w ? 'Fat Loss Goal' : (user.targetW > user.w ? 'Muscle Gain Goal' : 'Maintenance');
    if(document.getElementById('todayGoalLabel')) document.getElementById('todayGoalLabel').innerText = currentLang === 'en' ? labelEn : labelZh; if(document.getElementById('statGoalLogic')) document.getElementById('statGoalLogic').innerText = currentLang === 'en' ? `🎯 Logic: ${labelEn}` : `🎯 判定：${labelZh}`;
}

function setWeightRange(range) { currentWeightRange = range; initCharts(); }

function initCharts() {
    if(trendChart) trendChart.destroy(); if(weightChart) weightChart.destroy();
    const last7 = [...Array(7)].map((_, i) => { let d = new Date(); d.setDate(d.getDate()-(6-i)); return d.toLocaleDateString(); });
    const calData = last7.map(d => (logs[d]||[]).reduce((sum, item) => sum + (item.p*4+item.c*4+item.f*9), 0)); const calLabels = last7.map(d => { let p = d.split('/'); return p.length === 3 ? `${p[1]}/${p[2]}` : d; });
    if(document.getElementById('trendChart')) {
        trendChart = new Chart(document.getElementById('trendChart'), { type:'bar', data:{ labels: calLabels, datasets:[{ label: currentLang==='en'?'Calories':'熱量', data: calData, backgroundColor:'#3b82f6', borderRadius:12, barThickness: 16}]}, options:{ maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{display:false, grid:{display:false}}, x:{grid:{display:false}, border:{display:false}}}} });
    }
    let wtData = user.weights || []; if(currentWeightRange !== 'all') wtData = wtData.slice(-currentWeightRange);
    const labels = wtData.map(w => { let parts = w.d.split('/'); return parts.length === 3 ? `${parts[1]}/${parts[2]}` : w.d; }); const values = wtData.map(w => w.v);
    if(document.getElementById('weightChart')) {
        weightChart = new Chart(document.getElementById('weightChart'), { type:'line', data:{ labels: labels, datasets:[{ label: currentLang==='en'?'Weight':'體重', data: values, borderColor:'#8b5cf6', borderWidth:4, pointBackgroundColor:'#fff', pointBorderColor:'#8b5cf6', pointBorderWidth:3, pointRadius:5, fill:true, backgroundColor:'rgba(139,92,246,0.1)', tension:0.4 }]}, options:{ maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{display:false, grid:{display:false}}, x:{display:true, grid:{display:false}, border:{display:false}} } } });
    }
}

// ====== GYM 與直覺日曆 ======
function startRestTimer(seconds) {
    clearInterval(restTimer); let t = parseInt(seconds) || 90;
    const display = document.getElementById('restTimerDisplay'); const text = document.getElementById('restTimerText'); display.classList.remove('hidden');
    if ("Notification" in window && Notification.permission !== "granted") { Notification.requestPermission(); }
    restTimer = setInterval(() => {
        t--; let m = Math.floor(t/60).toString().padStart(2,'0'); let s = (t%60).toString().padStart(2,'0'); text.innerText = (currentLang==='en'?'Rest: ':'休息: ') + `${m}:${s}`;
        if(t <= 0) {
            clearInterval(restTimer); text.innerText = "🔥";
            if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 800]);
            if ("Notification" in window && Notification.permission === "granted") { new Notification("OmniFit", { body: currentLang === 'en' ? "Rest is over! 💪" : "休息結束，下一組！💪", icon: "https://cdn-icons-png.flaticon.com/512/2964/2964514.png" }); }
            setTimeout(() => display.classList.add('hidden'), 3000);
        }
    }, 1000);
}
function stopRestTimer() { clearInterval(restTimer); document.getElementById('restTimerDisplay').classList.add('hidden'); }

function copyGym(idx) {
    let g = gym[today][idx]; setGymType(g.type || 'strength'); document.getElementById('gName').value = g.n;
    if(g.type === 'cardio') { document.getElementById('gMins').value = g.mins; document.getElementById('gKm').value = g.km; } 
    else { document.getElementById('gW').value = g.w; document.getElementById('gS').value = g.s; document.getElementById('gR').value = g.r; }
    window.scrollTo({ top: document.getElementById('gymTab').offsetTop, behavior: 'smooth' });
}

function addGym() {
    let name = document.getElementById('gName').value; if(!name) return;
    if(!gym[today]) gym[today] = [];
    if(currentGymType === 'strength') {
        let w = parseFloat(document.getElementById('gW').value)||0, s = parseInt(document.getElementById('gS').value)||0, r = parseInt(document.getElementById('gR').value)||0;
        gym[today].push({ type: 'strength', n: name, w: w, s: s, r: r, v: w*s*r }); document.getElementById('gW').value = ''; document.getElementById('gS').value = ''; document.getElementById('gR').value = '';
    } else {
        let mins = parseFloat(document.getElementById('gMins').value)||0, km = parseFloat(document.getElementById('gKm').value)||0;
        gym[today].push({ type: 'cardio', n: name, mins: mins, km: km, v: mins * 10 }); document.getElementById('gMins').value = ''; document.getElementById('gKm').value = '';
    }
    NetAPI.save(KEYS.gym, gym); document.getElementById('gName').value = ''; renderGym(); setTimeout(initGymChart, 100); renderHistoryCalendar();
}

function renderGym() {
    let dailyVol = 0; let maxWeights = {};
    for(let d in gym) { gym[d].forEach(g => { if(g.type !== 'cardio' && (!maxWeights[g.n] || g.w > maxWeights[g.n])) maxWeights[g.n] = g.w; }); }
    document.getElementById('gymLogs').innerHTML = (gym[today]||[]).map((g, idx) => {
        dailyVol += g.v; let detailsHTML = '';
        if(g.type === 'cardio') {
            detailsHTML = `<div class="flex items-baseline gap-2 mt-1 text-emerald-600 dark:text-emerald-400"><span class="text-xl font-black tracking-tighter">${g.mins}</span><span class="text-[10px] font-bold opacity-60">Mins</span><span class="text-[10px] font-bold opacity-20 mx-1">|</span><span class="text-xl font-black tracking-tighter">${g.km}</span><span class="text-[10px] font-bold opacity-60">KM</span></div>`;
        } else {
            let prBadge = (g.w > 0 && g.w >= maxWeights[g.n]) ? '<span class="pr-badge px-2 py-0.5 rounded-full text-[9px] font-black ml-2 shadow-lg tracking-widest inline-block">👑 PR</span>' : '';
            detailsHTML = `<div class="flex items-center mb-1.5 flex-wrap gap-y-2"><p class="font-black text-base leading-none text-slate-800 dark:text-white tracking-tight">${g.n}</p>${prBadge}</div><div class="flex items-baseline gap-2 mt-1 text-indigo-600 dark:text-indigo-400"><span class="text-xl font-black tracking-tighter">${g.w}</span><span class="text-[10px] font-bold opacity-60">KG</span><span class="text-[10px] font-bold opacity-30 mx-1">×</span><span class="text-xl font-black tracking-tighter">${g.s}</span><span class="text-[10px] font-bold opacity-60">Sets</span><span class="text-[10px] font-bold opacity-30 mx-1">×</span><span class="text-xl font-black tracking-tighter">${g.r}</span><span class="text-[10px] font-bold opacity-60">Reps</span></div>`;
        }
        let borderColor = g.type === 'cardio' ? 'border-emerald-500' : 'border-indigo-500';
        return `<div class="card p-5 mb-4 border-l-[4px] ${borderColor} shadow-sm relative overflow-hidden group hover:border-l-8 transition-all"><div class="flex justify-between items-center relative z-10"><div class="flex-1">${g.type === 'cardio' ? `<p class="font-black text-base leading-none mb-2 text-slate-800 dark:text-white tracking-tight">${g.n}</p>` : ''}${detailsHTML}</div><div class="flex flex-col gap-2.5"><button onclick="copyGym(${idx})" class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-blue-600 font-black flex items-center justify-center btn-press shadow-sm transition-colors">➕</button><button onclick="removeGym(${idx})" class="w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-500 font-black flex items-center justify-center btn-press shadow-sm transition-colors">✕</button></div></div></div>`;
    }).join('');
    document.getElementById('dailyVolume').innerText = dailyVol;
}

function removeGym(idx) { gym[today].splice(idx, 1); NetAPI.save(KEYS.gym, gym); renderGym(); setTimeout(initGymChart, 100); renderHistoryCalendar(); }

function initGymChart() {
    if(gymChartInstance) gymChartInstance.destroy();
    const last7 = [...Array(7)].map((_, i) => { let d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toLocaleDateString(); });
    const volData = last7.map(d => (gym[d] || []).reduce((sum, item) => sum + item.v, 0));
    gymChartInstance = new Chart(document.getElementById('gymVolumeChart'), {
        type: 'line', data: { labels: last7.map(d=> { let p=d.split('/'); return p.length===3?`${p[1]}/${p[2]}`:d; }), datasets: [{ data: volData, borderColor: '#6366f1', borderWidth: 4, backgroundColor: 'rgba(99, 102, 241, 0.15)', fill: true, tension: 0.4, pointRadius:0, pointHitRadius: 10 }] },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: {enabled:false} }, scales: { x: { display: false, grid: {display:false} }, y: { display: false, min: 0, grid:{display:false} } }, layout: {padding: 0} }
    });
}

function changeCalMonth(delta) { currentCalMonth.setMonth(currentCalMonth.getMonth() + delta); renderHistoryCalendar(); }
function renderHistoryCalendar() {
    const y = currentCalMonth.getFullYear(); const m = currentCalMonth.getMonth(); document.getElementById('calMonthYear').innerText = `${y} / ${(m+1).toString().padStart(2, '0')}`;
    const firstDay = new Date(y, m, 1).getDay(); const daysInMonth = new Date(y, m + 1, 0).getDate(); let gridHTML = '';
    for(let i=0; i<firstDay; i++) { gridHTML += `<div class="cal-day empty"></div>`; }
    let todayObj = new Date(); let isCurrentMonth = (todayObj.getFullYear() === y && todayObj.getMonth() === m); let todayDate = todayObj.getDate();
    for(let i=1; i<=daysInMonth; i++) {
        let dateStr = new Date(y, m, i).toLocaleDateString(); let hasGym = gym[dateStr] && gym[dateStr].length > 0; let dotHTML = hasGym ? `<div class="cal-dot"></div>` : '';
        let isTodayClass = (isCurrentMonth && i === todayDate) ? 'border border-indigo-500 text-indigo-500 font-black' : '';
        gridHTML += `<div class="cal-day ${isTodayClass}" onclick="selectCalDate('${dateStr}', this)">${i}${dotHTML}</div>`;
    }
    document.getElementById('calGrid').innerHTML = gridHTML;
}

function selectCalDate(dateStr, el) { document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('active')); el.classList.add('active'); renderGymHistory(dateStr); }
function renderGymHistory(dateStr) {
    const container = document.getElementById('gymHistoryList'); let dayGym = gym[dateStr] || [];
    if(dayGym.length === 0) { container.innerHTML = `<p class="text-center opacity-40 font-bold py-10 text-sm" data-i18n="select_date_cal">${currentLang==='en'?'No Records':'請選擇日曆上的日期'}</p>`; return; }
    let dailyVol = dayGym.reduce((sum, g) => sum + g.v, 0);
    let html = `<div class="flex justify-between items-end px-2 mb-6 mt-4"><h4 class="text-sm font-black text-slate-800 dark:text-white">${dateStr}</h4><span class="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">Vol: ${dailyVol}</span></div>`;
    dayGym.forEach(g => {
        html += `<div class="card p-5 mb-3 flex justify-between items-center border-l-[3px] border-indigo-400 dark:border-indigo-600 shadow-sm"><div><p class="font-black text-base mb-1 text-slate-800 dark:text-white tracking-tight">${g.n}</p><p class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">${g.type==='cardio' ? `${g.mins}mins × ${g.km}km` : `${g.w}kg × ${g.s}sets × ${g.r}reps`}</p></div></div>`;
    }); container.innerHTML = html;
}

function initGymPlannerDays() {
    const bar = document.getElementById('gymPlannerDateBar'); bar.innerHTML = '';
    WEEK_DAYS.forEach(day => { let displayDay = dayLabels[currentLang][day]; bar.innerHTML += `<div class="date-chip ${day === currentGymPlanDay ? 'active' : ''}" onclick="selectGymPlanDay('${day}')">${displayDay}</div>`; });
    document.getElementById('selectedGymPlanDayText').innerText = dayLabels[currentLang][currentGymPlanDay]; renderGymPlanList();
}
function selectGymPlanDay(day) { currentGymPlanDay = day; initGymPlannerDays(); }
function addGymPlan() {
    let name = document.getElementById('gPlanName').value; if(!name) return; let entry = { type: currentGymPlanType, n: name };
    if(currentGymPlanType === 'strength') { entry.w = parseFloat(document.getElementById('gPlanW').value)||0; entry.s = parseInt(document.getElementById('gPlanS').value)||0; entry.r = parseInt(document.getElementById('gPlanR').value)||0; } else { entry.mins = parseFloat(document.getElementById('gPlanMins').value)||0; entry.km = parseFloat(document.getElementById('gPlanKm').value)||0; }
    gymPlanner[currentGymPlanDay].push(entry); NetAPI.save(KEYS.gymPlans, gymPlanner);
    document.getElementById('gPlanName').value = ''; 
    if(document.getElementById('gPlanW')) document.getElementById('gPlanW').value = ''; if(document.getElementById('gPlanS')) document.getElementById('gPlanS').value = ''; if(document.getElementById('gPlanR')) document.getElementById('gPlanR').value = '';
    if(document.getElementById('gPlanMins')) document.getElementById('gPlanMins').value = ''; if(document.getElementById('gPlanKm')) document.getElementById('gPlanKm').value = ''; renderGymPlanList();
}
function renderGymPlanList() {
    const container = document.getElementById('gymPlanList');
    container.innerHTML = (gymPlanner[currentGymPlanDay]||[]).map((g, idx) => {
        let desc = g.type === 'cardio' ? `${g.mins}mins × ${g.km}km` : `${g.w}kg × ${g.s}sets × ${g.r}reps`; let bColor = g.type === 'cardio' ? 'border-emerald-400' : 'border-indigo-400';
        return `<div class="card p-5 mb-3 flex justify-between items-center border-l-[3px] ${bColor} shadow-sm"><div><p class="font-black text-sm text-slate-800 dark:text-white tracking-tight">${g.n}</p><p class="text-[10px] font-bold opacity-60 uppercase text-slate-500 dark:text-slate-400 mt-0.5">${desc}</p></div><button onclick="removeGymPlan(${idx})" class="text-red-400 font-black px-2 btn-press">✕</button></div>`;
    }).join('');
}
function removeGymPlan(idx) { gymPlanner[currentGymPlanDay].splice(idx, 1); NetAPI.save(KEYS.gymPlans, gymPlanner); renderGymPlanList(); }

// ====== 社群功能 ======
function renderProfile() {
    document.getElementById('profileName').value = socialProfile.name; document.getElementById('profileBio').value = socialProfile.bio;
    document.getElementById('profileFollowers').innerText = socialProfile.followers; document.getElementById('profileFollowing').innerText = socialProfile.following;
    if(socialProfile.avatar) { document.getElementById('profileAvatarImg').src = socialProfile.avatar; document.getElementById('profileAvatarImg').classList.remove('hidden'); document.getElementById('profileAvatarText').classList.add('hidden'); document.getElementById('postAvatarPreview').src = socialProfile.avatar; document.getElementById('postAvatarPreview').classList.remove('hidden'); document.getElementById('postAvatarFallback').classList.add('hidden'); }
    let myPosts = communityPosts.filter(p => p.author === socialProfile.name); document.getElementById('profilePostsCount').innerText = myPosts.length;
    document.getElementById('myPostsGrid').innerHTML = myPosts.map(p => {
        if(p.media) {
            if(p.mediaType === 'video') return `<div class="aspect-square bg-slate-900 rounded-2xl overflow-hidden relative shadow-sm"><video src="${p.media}" class="w-full h-full object-cover opacity-80"></video><span class="absolute top-2 right-2 text-white drop-shadow-md text-xs">📹</span></div>`;
            return `<div class="aspect-square bg-slate-900 rounded-2xl overflow-hidden shadow-sm"><img src="${p.media}" class="w-full h-full object-cover"></div>`;
        } else { return `<div class="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-center text-center shadow-sm"><p class="text-xs font-bold text-slate-600 dark:text-slate-300 line-clamp-4 leading-relaxed">${p.text}</p></div>`; }
    }).join('');
}
function saveProfile() { socialProfile.name = document.getElementById('profileName').value || 'Omni User'; socialProfile.bio = document.getElementById('profileBio').value || ''; NetAPI.save(KEYS.profile, socialProfile); renderFeed(); }
function uploadAvatar(input) { if(input.files && input.files[0]) { const reader = new FileReader(); reader.onload = function(e) { socialProfile.avatar = e.target.result; NetAPI.save(KEYS.profile, socialProfile); renderProfile(); }; reader.readAsDataURL(input.files[0]); } }

document.getElementById('mediaUpload').addEventListener('change', function(e) {
    const file = e.target.files[0]; if(file) {
        const mediaBox = document.getElementById('mediaBox'); mediaBox.innerHTML = ''; const fileURL = URL.createObjectURL(file);
        if (file.type.startsWith('video/')) { const videoNode = document.createElement('video'); videoNode.src = fileURL; videoNode.controls = true; videoNode.className = "w-full max-h-[300px] object-contain rounded-xl"; mediaBox.appendChild(videoNode); tempMediaType = 'video'; } 
        else if (file.type.startsWith('image/')) { const imgNode = document.createElement('img'); imgNode.src = fileURL; imgNode.className = "w-full max-h-[300px] object-cover rounded-xl"; mediaBox.appendChild(imgNode); tempMediaType = 'image'; }
        const reader = new FileReader(); reader.onloadend = () => { tempMediaData = reader.result; }; reader.readAsDataURL(file);
        document.getElementById('mediaPreviewContainer').classList.remove('hidden'); if (navigator.vibrate) navigator.vibrate(50);
    }
});

function publishPost() {
    const text = document.getElementById('postText').value; const type = document.getElementById('postType').value;
    if(!text && !tempMediaData) { alert(currentLang==='en'?"Please write something or upload media.":"請輸入內容或上傳媒體！"); return; }
    const newPost = { id: Date.now(), author: socialProfile.name, avatarURL: socialProfile.avatar, text: text, type: type, media: tempMediaData, mediaType: tempMediaType, date: new Date().toLocaleDateString(), likes: 0, comments: [] };
    communityPosts.unshift(newPost); NetAPI.save(KEYS.posts, communityPosts);
    document.getElementById('postText').value = ''; document.getElementById('mediaUpload').value = ''; document.getElementById('mediaPreviewContainer').classList.add('hidden'); tempMediaData = null; tempMediaType = null; switchCommSub('feed');
}

function togglePostMenu(id) { let menu = document.getElementById('postMenu-' + id); if(menu) menu.classList.toggle('hidden'); }

function renderFeed() {
    const container = document.getElementById('feedList'); const q = document.getElementById('socialSearch').value.toLowerCase();
    if(communityPosts.length === 0) { communityPosts = [ { id: 1, author: 'Alex_Fitness', avatarURL: '', text: 'Just hit a new PR on Deadlift! 140kg x 5! 🔥💪', type: 'training', date: '2026/03/24', likes: 12, comments: [{author: 'GymBro', text: 'Beast mode!!'}] }, { id: 2, author: 'HealthyEats', avatarURL: '', text: '今天的增肌餐：烤鮭魚配藜麥與大量蔬菜。', type: 'diet', date: '2026/03/24', likes: 8, comments: [] } ]; }
    let filteredPosts = communityPosts.filter(p => p.text.toLowerCase().includes(q) || p.author.toLowerCase().includes(q));
    
    container.innerHTML = filteredPosts.map(p => {
        let badge = p.type === 'diet' ? '🍱 Diet' : (p.type === 'training' ? '💪 Training' : '👤 Physique'); let mediaHTML = '';
        if(p.media) { if(p.mediaType === 'video') { mediaHTML = `<video src="${p.media}" controls class="w-full rounded-2xl mt-4 shadow-sm"></video>`; } else { mediaHTML = `<img src="${p.media}" class="w-full rounded-2xl mt-4 object-cover max-h-80 shadow-sm">`; } }
        let avatarDOM = p.avatarURL ? `<img src="${p.avatarURL}" class="w-10 h-10 rounded-full object-cover shadow-sm">` : `<div class="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-black shadow-sm">${p.author.charAt(0)}</div>`;
        let commentsHTML = (p.comments || []).map(c => `<div class="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl mt-2 text-xs"><span class="font-black text-slate-800 dark:text-white">${c.author}:</span><span class="text-slate-600 dark:text-slate-300 font-medium ml-1">${c.text}</span></div>`).join('');
        
        let isLiked = socialProfile.likedPosts.includes(p.id); let heartIcon = isLiked ? '❤️' : '🤍'; let likeColor = isLiked ? 'text-pink-500' : 'text-slate-500 dark:text-slate-400';
        let reportTxt = currentLang === 'en' ? 'Report Post' : '檢舉貼文'; let blockTxt = currentLang === 'en' ? 'Block User' : '封鎖用戶';

        return `<div class="card p-6 border-t-0 shadow-md">
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">${avatarDOM}<div><p class="font-black text-sm text-slate-900 dark:text-white tracking-tight">${p.author}</p><p class="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wide mt-0.5">${p.date}</p></div></div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg tracking-wider">${badge}</span>
                    <div class="relative"><button onclick="togglePostMenu(${p.id})" class="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-lg px-2 btn-press transition-colors">⋮</button>
                        <div id="postMenu-${p.id}" class="hidden absolute right-0 top-8 bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-1 z-50 text-xs w-32 border border-slate-100 dark:border-slate-700">
                            <button onclick="alert('${currentLang==='en'?'Report Submitted':'已提交檢舉'}'); togglePostMenu(${p.id});" class="w-full text-left p-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">${reportTxt}</button>
                            <button onclick="alert('${currentLang==='en'?'User Blocked':'已封鎖此用戶'}'); togglePostMenu(${p.id});" class="w-full text-left p-3 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors mt-1">${blockTxt}</button>
                        </div>
                    </div>
                </div>
            </div>
            <p class="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">${p.text}</p>
            ${mediaHTML}
            <div class="mt-5 flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800"><button class="text-sm font-black ${likeColor} flex items-center gap-1.5 btn-press transition-colors" onclick="likePost(${p.id})">${heartIcon} ${p.likes}</button></div>
            <div class="mt-4">${commentsHTML}<div class="mt-3 flex gap-2"><input type="text" id="commentInput-${p.id}" class="comment-input w-full p-3 text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" placeholder="${currentLang==='en'?'Add a comment...':'留言...'}"><button onclick="addComment(${p.id})" class="btn-comment px-5 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-black btn-press shadow-sm">${currentLang==='en'?'Post':'發佈'}</button></div></div>
        </div>`;
    }).join('');
}

function likePost(id) {
    let post = communityPosts.find(p => p.id === id);
    if(post) { const index = socialProfile.likedPosts.indexOf(id); if(index > -1) { socialProfile.likedPosts.splice(index, 1); post.likes = Math.max(0, post.likes - 1); } else { socialProfile.likedPosts.push(id); post.likes++; } NetAPI.save(KEYS.posts, communityPosts); NetAPI.save(KEYS.profile, socialProfile); renderFeed(); }
}
function addComment(id) {
    let input = document.getElementById(`commentInput-${id}`); let text = input.value.trim(); if(!text) return;
    let post = communityPosts.find(p => p.id === id); if(post) { if(!post.comments) post.comments = []; post.comments.push({ author: socialProfile.name, text: text }); NetAPI.save(KEYS.posts, communityPosts); renderFeed(); }
}

// ====== 系統功能 ======
function toggleDarkMode() {
    document.documentElement.classList.toggle('dark'); const isDark = document.documentElement.classList.contains('dark');
    document.getElementById('themeBtn').innerText = isDark ? '☀️' : '🌙'; document.getElementById('darkModeToggle').checked = isDark; NetAPI.save(KEYS.theme, isDark ? 'dark' : 'light');
}

window.onload = () => {
    const savedTheme = NetAPI.load(KEYS.theme);
    if(savedTheme === 'dark') { document.documentElement.classList.add('dark'); document.getElementById('themeBtn').innerText = '☀️'; document.getElementById('darkModeToggle').checked = true; }
    document.getElementById('uW').value = user.w || ''; document.getElementById('uTargetW').value = user.targetW || ''; document.getElementById('uH').value = user.h || ''; document.getElementById('uA').value = user.a || ''; document.getElementById('uGender').value = user.gender || 'male'; document.getElementById('uAct').value = user.act || '1.2';
    setLang(currentLang); 
};