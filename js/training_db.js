// js/training_db.js
const trainingDatabase = [
    // 胸部 (Chest)
    "槓鈴臥推 (Barbell Bench Press)", "上斜槓鈴臥推 (Incline Barbell Bench Press)", "下斜槓鈴臥推 (Decline Bench Press)", "啞鈴臥推 (Dumbbell Bench Press)", "上斜啞鈴臥推 (Incline Dumbbell Press)", "下斜啞鈴臥推 (Decline Dumbbell Press)", "啞鈴飛鳥 (Dumbbell Flyes)", "上斜啞鈴飛鳥 (Incline Dumbbell Flyes)", "機械胸推 (Machine Chest Press)", "上斜機械胸推 (Incline Machine Press)", "蝴蝶機飛鳥 (Pec Deck Fly)", "滑輪飛鳥 (Cable Crossover)", "低位滑輪飛鳥 (Low Cable Crossover)", "高位滑輪飛鳥 (High Cable Crossover)", "雙槓臂屈伸 (Dips - Chest Focus)", "伏地挺身 (Push-ups)", "寬距伏地挺身 (Wide Push-ups)", "窄距/鑽石伏地挺身 (Diamond Push-ups)", "史密斯臥推 (Smith Machine Bench Press)", "史密斯上斜臥推 (Smith Incline Press)",
    // 背部 (Back)
    "引體向上 (Pull-ups)", "反手引體向上 (Chin-ups)", "滑輪下拉 (Lat Pulldown)", "窄距滑輪下拉 (Close-Grip Lat Pulldown)", "直臂下拉 (Straight Arm Pulldown)", "槓鈴划船 (Barbell Row)", "反手槓鈴划船 (Underhand Barbell Row)", "啞鈴單臂划船 (Single Arm Dumbbell Row)", "坐姿划船 (Seated Cable Row)", "T字槓划船 (T-Bar Row)", "胸托啞鈴划船 (Chest Supported Row)", "滑輪面拉 (Face Pull)", "羅馬椅挺身 (Back Extension)", "早安運動 (Good Mornings)", "單臂滑輪下拉 (Single Arm Cable Pulldown)", "機械划船 (Machine Row)", "高位機械划船 (High Row Machine)",
    // 腿部與臀部 (Legs & Glutes)
    "槓鈴深蹲 (Barbell Squat)", "頸前深蹲 (Front Squat)", "高腳杯深蹲 (Goblet Squat)", "保加利亞分腿蹲 (Bulgarian Split Squat)", "啞鈴弓箭步 (Dumbbell Lunges)", "槓鈴弓箭步 (Barbell Lunges)", "腿推機 (Leg Press)", "哈克深蹲機 (Hack Squat)", "史密斯深蹲 (Smith Machine Squat)", "羅馬尼亞硬舉 (Romanian Deadlift, RDL)", "傳統硬舉 (Conventional Deadlift)", "相撲硬舉 (Sumo Deadlift)", "直腿硬舉 (Stiff-Leg Deadlift)", "坐姿腿伸屈 (Leg Extension)", "俯臥腿彎舉 (Lying Leg Curl)", "坐姿腿彎舉 (Seated Leg Curl)", "站姿小腿提踵 (Standing Calf Raise)", "坐姿小腿提踵 (Seated Calf Raise)", "驢式小腿提踵 (Donkey Calf Raise)", "臀推 (Barbell Hip Thrust)", "機械臀推 (Machine Hip Thrust)", "滑輪後踢 (Cable Kickback)", "機械外展 (Hip Abductor)", "機械內收 (Hip Adductor)", "壺鈴深蹲 (Kettlebell Squat)",
    // 肩部 (Shoulders)
    "槓鈴肩推 (Overhead Press)", "坐姿啞鈴肩推 (Seated Dumbbell Press)", "史密斯肩推 (Smith Machine Shoulder Press)", "阿諾推舉 (Arnold Press)", "啞鈴側平舉 (Lateral Raise)", "滑輪側平舉 (Cable Lateral Raise)", "機械側平舉 (Machine Lateral Raise)", "啞鈴前平舉 (Front Raise)", "槓鈴前平舉 (Barbell Front Raise)", "滑輪前平舉 (Cable Front Raise)", "俯身側平舉 (Rear Delt Fly)", "蝴蝶機反向飛鳥 (Reverse Pec Deck)", "滑輪反向飛鳥 (Cable Rear Delt Fly)", "槓鈴聳肩 (Barbell Shrug)", "啞鈴聳肩 (Dumbbell Shrug)", "地雷管肩推 (Landmine Press)", "直立划船 (Upright Row)",
    // 手臂 (Arms)
    "槓鈴二頭彎舉 (Barbell Bicep Curl)", "EZ槓二頭彎舉 (EZ-Bar Curl)", "啞鈴交替彎舉 (Alternate Dumbbell Curl)", "錘式彎舉 (Hammer Curl)", "滑輪錘式彎舉 (Cable Hammer Curl)", "牧師椅彎舉 (Preacher Curl)", "滑輪二頭彎舉 (Cable Bicep Curl)", "集中彎舉 (Concentration Curl)", "窄距臥推 (Close-Grip Bench Press)", "法式彎舉/碎顱者 (Skull Crusher)", "啞鈴頸後臂屈伸 (Overhead Triceps Extension)", "滑輪三頭下壓 (Triceps Pushdown)", "繩索三頭下壓 (Rope Pushdown)", "滑輪三頭過頭伸展 (Overhead Cable Extension)", "啞鈴單臂後踢 (Triceps Kickback)", "雙槓臂屈伸/三頭 (Dips - Triceps Focus)", "腕彎舉 (Wrist Curl)", "反向腕彎舉 (Reverse Wrist Curl)",
    // 核心與其他 (Core)
    "仰臥起坐 (Sit-ups)", "捲腹 (Crunches)", "滑輪捲腹 (Cable Crunch)", "反向捲腹 (Reverse Crunch)", "俄羅斯轉體 (Russian Twist)", "平板支撐 (Plank)", "側平板支撐 (Side Plank)", "懸垂舉腿 (Hanging Leg Raise)", "羅馬椅舉腿 (Captain's Chair Leg Raise)", "健腹輪 (Ab Roller)", "伐木轉體 (Woodchopper)", "死蟲式 (Dead Bug)", "鳥狗式 (Bird Dog)", "V字起身 (V-Ups)",
    // 有氧 (Cardio)
    "跑步機 (Treadmill)", "橢圓機 (Elliptical)", "飛輪車 (Spin Bike)", "室內腳踏車 (Stationary Bike)", "划船機 (Rowing Machine)", "登階機 (Stairmaster)", "跳繩 (Jump Rope)", "開合跳 (Jumping Jacks)", "波比跳 (Burpees)", "登山者 (Mountain Climbers)",
    // CrossFit & 體操 (CrossFit & Gymnastics)
    "暴力上槓 (Muscle Up)", "雙力臂 (Ring Muscle Up)", "抓舉 (Snatch)", "挺舉 (Clean & Jerk)", "懸垂翻 (Hang Clean)", "藥球砸牆 (Wall Balls)", "跳箱 (Box Jumps)", "壺鈴擺盪 (Kettlebell Swing)", "單臂壺鈴抓舉 (Kettlebell Snatch)", "土耳其起立 (Turkish Get-Up)", "手倒立伏地挺身 (Handstand Push-ups)", "手倒立行走 (Handstand Walk)", "腳踏車雙力臂 (Kipping Muscle Up)", "蝶式引體向上 (Butterfly Pull-ups)", "腳趾觸槓 (Toes to Bar)",
    // 大力士項目 (Strongman)
    "阿特拉斯石/搬巨石 (Atlas Stones)", "農夫走 (Farmer's Walk)", "軛槓行走 (Yoke Walk)", "圓木推舉 (Log Press)", "翻輪胎 (Tire Flip)", "雪橇推 (Sled Push)", "雪橇拉 (Sled Pull)", "阿波羅軸推舉 (Axle Press)", "沙袋搬運 (Sandbag Carry)", "單手啞鈴過頭推 (Circus Dumbbell Press)"
];
