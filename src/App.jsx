import React, { useState, useEffect, useMemo } from 'react';
import { 
  Brain, 
  Target, 
  Award, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  XCircle,
  Activity,
  Utensils,
  Zap,
  BookOpen,
  ArrowUpCircle,
  RefreshCcw,
  HelpCircle,
  Lightbulb,
  GraduationCap,
  Book,
  Search,
  Clock,
  AlertTriangle,
  Star,
  Info,
  Tag,
  ShoppingBag,
  Save,
  Cloud,
  Trophy,
  Play
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

// --- Firebase Initialization ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'nutrition-iq-default';

let auth = null;
let db = null;

if (firebaseConfig) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

// --- Configuration: Category Definitions ---
const CATEGORY_CONFIG = {
  'Awareness': { name: '基礎認知', icon: BookOpen, desc: '辨識食物種類、真假蔬菜與隱形地雷' },
  'Quantification': { name: '份量估算', icon: Utensils, desc: '掌握手掌法則、熱量密度與食物重量' },
  'Scenario': { name: '外食實戰', icon: Zap, desc: '便利商店、火鍋、自助餐的最佳選擇攻略' },
  'Physiology': { name: '生理機制', icon: Activity, desc: '了解代謝、荷爾蒙與運動營養' },
  'Myth': { name: '迷思破解', icon: Brain, desc: '破解常見的減肥偽科學與網路謠言' },
  'Label': { name: '標籤解碼', icon: Target, desc: '看懂營養標示，計算糖分與實際熱量' }
};

// --- Data: Glossary Items ---
const GLOSSARY_ITEMS = [
  // 1. 宏量營養素
  {
    term: '蛋白質', english: 'Protein', category: '宏量營養素',
    oneLine: '身體的磚塊，修補組織與長肌肉的主要材料。',
    whyItMatters: '吃不夠容易掉肌肉、免疫力變差、頭髮指甲脆弱；減脂期足夠蛋白質能維持代謝。',
    typicalSources: '雞胸肉、魚、雞蛋、豆腐、豆漿、優格、牛肉'
  },
  {
    term: '碳水化合物', english: 'Carbohydrate', category: '宏量營養素',
    oneLine: '身體的首選燃料，大腦和肌肉最愛用的能量。',
    whyItMatters: '完全不吃容易沒力氣、訓練表現差、情緒暴躁；但吃太多精緻碳水容易囤積脂肪。',
    typicalSources: '米飯、麵條、地瓜、馬鈴薯、水果、燕麥'
  },
  {
    term: '脂肪', english: 'Fat', category: '宏量營養素',
    oneLine: '高效率能量庫，也是製造荷爾蒙的原料。',
    whyItMatters: '不能完全不吃！過低脂肪會導致荷爾蒙失調（如停經）、皮膚乾燥、維生素吸收不良。',
    typicalSources: '酪梨、堅果、橄欖油、魚油、肥肉、蛋黃'
  },
  {
    term: '乳清蛋白', english: 'Whey Protein', category: '宏量營養素',
    oneLine: '從牛奶提煉，吸收速度超快的蛋白質補給。',
    whyItMatters: '運動後喝吸收最快，能迅速啟動肌肉修復；方便攜帶，是補充蛋白質的CP值之選。',
    typicalSources: '乳清蛋白粉（濃縮、分離、水解）'
  },
  {
    term: '酪蛋白', english: 'Casein', category: '宏量營養素',
    oneLine: '吸收緩慢的蛋白質，適合睡前喝。',
    whyItMatters: '能在睡眠期間持續緩慢釋放胺基酸，防止肌肉流失。',
    typicalSources: '牛奶、起司、酪蛋白粉'
  },
  {
    term: 'BCAA', english: 'Branched-Chain Amino Acids', category: '宏量營養素',
    oneLine: '支鏈胺基酸，肌肉最愛直接利用的三種胺基酸。',
    whyItMatters: '主要用於「防止肌肉流失」與「減緩運動疲勞」，對於長時間空腹訓練者較有幫助。',
    typicalSources: '雞肉、牛肉、乳清蛋白、BCAA補給品'
  },
  {
    term: '膳食纖維', english: 'Dietary Fiber', category: '宏量營養素',
    oneLine: '腸道的掃把，不會被吸收但對健康超重要。',
    whyItMatters: '增加飽足感、穩定血糖、幫助排便。吃夠纖維是減脂不挨餓的關鍵。',
    typicalSources: '蔬菜、水果、燕麥、糙米、奇亞籽'
  },
  {
    term: '反式脂肪', english: 'Trans Fat', category: '宏量營養素',
    oneLine: '人造壞油，對心血管危害最大的脂肪。',
    whyItMatters: '會增加壞膽固醇、塞血管，法規已嚴格限制，但仍需注意加工食品標示。',
    typicalSources: '部分氫化植物油、老式奶精、廉價糕點、炸物'
  },
  {
    term: 'Omega-3', english: 'Omega-3 Fatty Acids', category: '宏量營養素',
    oneLine: '能抗發炎的「好脂肪酸」。',
    whyItMatters: '現代人飲食容易發炎（Omega-6太多），Omega-3 能保護心血管、大腦與眼睛。',
    typicalSources: '鮭魚、鯖魚、亞麻仁油、核桃、魚油'
  },
  {
    term: 'MCT 油', english: 'Medium-Chain Triglyceride', category: '宏量營養素',
    oneLine: '中鏈脂肪酸，能快速轉換成能量的好油。',
    whyItMatters: '常被用於生酮飲食或防彈咖啡，因為它能快速產能且較不易囤積成體脂。',
    typicalSources: '椰子油、MCT油'
  },

  // 2. 維生素
  {
    term: '維生素 B群', english: 'Vitamin B Complex', category: '維生素',
    oneLine: '能量代謝的輔助大隊，幫你把食物轉成能量。',
    whyItMatters: '覺得累、代謝差、常嘴破可能就是缺B群。運動量大的人消耗快，更需補充。',
    typicalSources: '全穀類、瘦肉、深綠色蔬菜、酵母'
  },
  {
    term: '維生素 C', english: 'Vitamin C', category: '維生素',
    oneLine: '抗氧化小尖兵，還能幫助膠原蛋白合成。',
    whyItMatters: '壓力大或高強度運動會消耗大量 Vit C，補充足夠能降低感冒風險。',
    typicalSources: '芭樂、奇異果、柑橘類、甜椒'
  },
  {
    term: '維生素 D', english: 'Vitamin D', category: '維生素',
    oneLine: '其實是種類荷爾蒙，管骨頭也管免疫力。',
    whyItMatters: '現代人少曬太陽普遍缺乏。缺D會影響鈣吸收、骨質疏鬆、甚至影響心情與睪固酮。',
    typicalSources: '曬太陽、鮭魚、蛋黃、強化牛奶、補給品'
  },

  // 3. 礦物質
  {
    term: '鈣', english: 'Calcium', category: '礦物質',
    oneLine: '不只補骨頭，肌肉收縮和神經傳導也靠它。',
    whyItMatters: '長期缺鈣會骨質疏鬆，且容易抽筋、情緒焦慮。',
    typicalSources: '牛奶、優格、板豆腐、小魚乾、黑芝麻'
  },
  {
    term: '鐵', english: 'Iron', category: '礦物質',
    oneLine: '造血關鍵，幫你把氧氣送到全身。',
    whyItMatters: '缺鐵會容易累、頭暈、臉色蒼白、運動喘不過氣。女生因生理期更需注意。',
    typicalSources: '紅肉、豬血、蛤蜊、深綠色蔬菜（吸收率較差）'
  },
  {
    term: '鎂', english: 'Magnesium', category: '礦物質',
    oneLine: '放鬆礦物質，助眠又防抽筋。',
    whyItMatters: '壓力大會流失鎂。補鎂能幫助肌肉放鬆、改善睡眠品質、穩定神經。',
    typicalSources: '深綠色蔬菜、堅果、香蕉、黑巧克力'
  },
  {
    term: '鈉', english: 'Sodium', category: '礦物質',
    oneLine: '水分平衡的關鍵，吃太鹹會水腫。',
    whyItMatters: '運動流汗需要補鈉防抽筋，但平時外食族容易攝取過量導致高血壓與水腫。',
    typicalSources: '鹽、醬油、加工食品、運動飲料'
  },
  {
    term: '鉀', english: 'Potassium', category: '礦物質',
    oneLine: '鈉的死對頭，幫你排鈉消水腫。',
    whyItMatters: '多吃高鉀食物可以平衡鹽分攝取，預防高血壓與水腫。',
    typicalSources: '香蕉、馬鈴薯、奇異果、深色蔬菜'
  },
  {
    term: '鋅', english: 'Zinc', category: '礦物質',
    oneLine: '傷口癒合與男性荷爾蒙的守護者。',
    whyItMatters: '對免疫系統、皮膚修復、睪固酮合成非常重要。',
    typicalSources: '牡蠣、海鮮、牛肉、南瓜籽'
  },
  {
    term: '電解質', english: 'Electrolytes', category: '礦物質',
    oneLine: '帶電的礦物質戰隊（鈉、鉀、鈣、鎂）。',
    whyItMatters: '負責神經傳導與肌肉收縮。大量流汗後只喝水不補電解質，容易導致抽筋或水中毒。',
    typicalSources: '運動飲料、椰子水、鹽巴'
  },

  // 4. 運動補給
  {
    term: '肌酸', english: 'Creatine', category: '運動補給',
    oneLine: '肌肉的備用電池，提升爆發力與力量。',
    whyItMatters: '目前研究最透徹、最安全的補給品之一。能增加肌肉含水量與力量表現。',
    typicalSources: '紅肉（量少）、肌酸粉'
  },
  {
    term: 'Beta-丙氨酸', english: 'Beta-Alanine', category: '運動補給',
    oneLine: '抗酸劑，幫你多做幾下的一種胺基酸。',
    whyItMatters: '能中和肌肉酸性，延緩疲勞。副作用是皮膚會有刺刺癢癢的感覺（無害）。',
    typicalSources: '紅肉、補給品'
  },
  {
    term: '預鍛鍊飲品', english: 'Pre-workout', category: '運動補給',
    oneLine: '喝了會High的綜合提神粉。',
    whyItMatters: '通常含大量咖啡因、B群、丙氨酸等，用來提升訓練專注度與興奮感。',
    typicalSources: '市售 Pre-workout 產品'
  },
  {
    term: '咖啡因', english: 'Caffeine', category: '運動補給',
    oneLine: '天然且有效的興奮劑，提升專注與代謝。',
    whyItMatters: '運動前攝取能降低疲勞感、提升燃脂效率。但太晚喝會影響睡眠。',
    typicalSources: '咖啡、茶、能量飲'
  },

  // 5. 食品標示
  {
    term: '熱量 / 大卡', english: 'Calories / kcal', category: '常見標示',
    oneLine: '能量單位，體重增減的基礎算術。',
    whyItMatters: '吃進去 > 消耗掉 = 變胖。不管食物多健康，熱量超標一樣會胖。',
    onLabel: '大卡、Kcal'
  },
  {
    term: '份量', english: 'Serving Size', category: '常見標示',
    oneLine: '包裝上「一份」是多少，陷阱都在這。',
    whyItMatters: '一包餅乾可能含「5份」，只看「每份熱量」會低估攝取量，要乘上份數才是總熱量。',
    onLabel: '本包裝含 X 份'
  },
  {
    term: '每日參考值百分比', english: '%DV', category: '常見標示',
    oneLine: '這份食物佔了你一天所需的百分之幾。',
    whyItMatters: '快速判斷營養素高低的指標。例如鈉含量 %DV 超過 20% 通常算高鈉食物。',
    onLabel: '每日參考值百分比'
  },
  {
    term: '升糖指數', english: 'GI (Glycemic Index)', category: '常見標示',
    oneLine: '食物讓血糖上升速度的指標。',
    whyItMatters: '低 GI (糙米) 血糖穩、耐餓；高 GI (糖果) 血糖衝高、易囤脂且餓得快。',
    onLabel: '低GI'
  },
  {
    term: '代糖 / 甜味劑', english: 'Sweeteners', category: '常見標示',
    oneLine: '有甜味但沒熱量（或極低）的魔法粉。',
    whyItMatters: '如赤藻糖醇、阿斯巴甜。減脂期解饞好幫手，但部分人吃多會脹氣或腹瀉。',
    onLabel: '赤藻糖醇、阿斯巴甜、蔗糖素'
  },

  // 6. 保健與其他
  {
    term: '益生菌', english: 'Probiotic', category: '保健機能',
    oneLine: '腸道的好朋友軍團。',
    whyItMatters: '維持腸道菌相平衡，改善便秘、腹瀉與免疫調節。',
    typicalSources: '優格、泡菜、益生菌粉'
  },
  {
    term: '益生元', english: 'Prebiotic', category: '保健機能',
    oneLine: '益生菌的食物，幫好菌長大的肥料。',
    whyItMatters: '光吃菌不給食物沒用。多吃膳食纖維就是最好的益生元。',
    typicalSources: '膳食纖維、果寡糖'
  },
  {
    term: '膠原蛋白', english: 'Collagen', category: '保健機能',
    oneLine: '皮膚與關節的鋼筋支架。',
    whyItMatters: '雖然吃進去會被分解成胺基酸，但補充特定胜肽可能有助皮膚彈性與關節潤滑。需搭配維生素C。',
    typicalSources: '豬腳（脂肪高）、膠原蛋白粉'
  },
  {
    term: '輔酶 Q10', english: 'CoQ10', category: '保健機能',
    oneLine: '細胞發電廠的火星塞。',
    whyItMatters: '隨著年紀減少，補充有助心臟無力改善與抗氧化。',
    typicalSources: '心臟、牛肉、沙丁魚'
  },
  {
    term: '葉黃素', english: 'Lutein', category: '保健機能',
    oneLine: '眼睛的太陽眼鏡，過濾藍光。',
    whyItMatters: '人體無法自行合成，現代人3C用眼過度必備。它是脂溶性，要飯後吃才好吸收。',
    typicalSources: '菠菜、羽衣甘藍、蛋黃'
  }
];

// --- Data: Knowledge Library ---
const KNOWLEDGE_LIBRARY = [
  // ... LV1 existing chapters ...
  {
    id: 'lv1-starch-basics',
    level: 1,
    categoryKey: 'Awareness',
    title: '澱粉與主食：假蔬菜真澱粉',
    subtitle: '看起來很清爽，其實是澱粉炸彈',
    summary: '許多人以為只有米飯麵條是澱粉，其實很多「根莖類」植物在營養學上都是主食。如果把這類食材當成蔬菜吃到飽，熱量很容易爆表。',
    keyPoints: [
      '分辨原則：吃起來粉粉的、有飽足感的植物根莖，通常是澱粉。',
      '常見偽裝：玉米、南瓜、地瓜、芋頭、山藥、蓮藕、菱角、紅豆綠豆。',
      '加工陷阱：冬粉、米粉、蘿蔔糕、湯圓、豬血糕，這些都是高密度澱粉。',
      '交換法則：如果有吃上述食材，當餐的「白飯」就要減少或不吃。'
    ],
    examples: [
      '自助餐夾了「三色豆」當配菜？那其實是兩份澱粉（玉米+豌豆）配一點點蔬菜（紅蘿蔔）。',
      '火鍋裡的「冬粉」吸滿湯汁後，熱量比一碗飯還高，絕對不是清爽的蔬菜替代品。'
    ],
    commonMistakes: [
      '以為南瓜湯很健康可以一直喝，結果攝取過多醣類。',
      '以為綠豆湯是「喝湯」，其實是在「喝飯」。'
    ],
    tinyActions: [
      '下次吃自助餐時，先掃描一輪菜色，指出哪幾道其實是「隱藏版澱粉」。',
      '點火鍋時，副餐選了冬粉，記得當天晚餐的飯量減半。'
    ],
    estimatedReadingMinutes: 2
  },
  {
    id: 'lv1-protein-traps',
    level: 1,
    categoryKey: 'Awareness',
    title: '蛋白質與加工品：隱形熱量地雷',
    subtitle: '不是所有豆製品和肉類都是好隊友',
    summary: '蛋白質是增肌減脂的關鍵，但「加工過程」往往會加入大量油脂與澱粉，讓你以為在補蛋白，其實在喝油。',
    keyPoints: [
      '優質蛋白原則：優先選擇「原型食物」，如雞蛋、雞胸、鮮魚、毛豆、嫩豆腐。',
      '高脂加工肉：香腸、熱狗、培根、貢丸，這些通常脂肪含量高於蛋白質。',
      '豆類陷阱：百頁豆腐（油豆腐）、炸豆皮、花干，這些都是「吸油海綿」。',
      '假肉真澱粉：蟹肉棒、魚板、黑輪，主要成分其實是魚漿加大量澱粉。'
    ],
    examples: [
      '滷味攤的「百頁豆腐」一條熱量可能超過 500 卡，比一碗飯還高。',
      '早餐店的「培根蛋餅」，培根其實算油脂類，不是優質肉類。'
    ],
    commonMistakes: [
      '吃火鍋為了健康點了很多「蟹肉棒」，結果吃進一堆澱粉。',
      '素食者常吃「素肉、麵筋、烤麩」，這些通常都是高油高鈉加工品。'
    ],
    tinyActions: [
      '去便利商店看營養標示，比較一下「熱狗」與「雞胸肉」的脂肪含量差異。',
      '下次吃火鍋，把所有的加工火鍋料換成嫩豆腐或鮮魚片。'
    ],
    estimatedReadingMinutes: 3
  },
  {
    id: 'lv1-fats-nuts',
    level: 1,
    categoryKey: 'Awareness',
    title: '油脂與堅果種子：好油壞油分清楚',
    subtitle: '酪梨不是水果，它是油！',
    summary: '油脂是人體必需營養素，但熱量密度最高（1g = 9kcal）。重點在於辨識「好油」並控制份量，而不是完全不吃。',
    keyPoints: [
      '分類誤區：酪梨、芝麻、花生、椰奶、鮮奶油，這些全是「油脂類」。',
      '堅果適量：堅果雖好，但熱量極高，一天建議量約「大拇指第一指節」大小。',
      '隱形油脂：沙拉醬（凱薩醬、千島醬）、麵包抹醬、酥皮濃湯。',
      '好油來源：橄欖油、酪梨、魚油、無調味堅果。'
    ],
    examples: [
      '喝泰式酸辣湯裡的「椰奶」，其實等於在喝油。',
      '以為吃生菜沙拉很健康，結果淋了兩大匙凱薩醬，熱量直接爆表。'
    ],
    commonMistakes: [
      '把酪梨當成飯後水果吃，結果整天油脂攝取超標。',
      '以為堅果很健康就抱著桶子一直吃。'
    ],
    tinyActions: [
      '吃沙拉時，試著把醬料改為「和風醬」或「油醋醬」，並且沾著吃而非淋上去。',
      '檢查一下今天的早餐，是不是吃下了過多的抹醬或鮮奶油？'
    ],
    estimatedReadingMinutes: 2
  },
  {
    id: 'lv1-veg-fruit',
    level: 1,
    categoryKey: 'Awareness',
    title: '蔬菜與水果：不要傻傻分不清楚',
    subtitle: '水果不能取代蔬菜，玉米筍是蔬菜',
    summary: '蔬菜和水果雖然都富含纖維，但水果含有較高的果糖，不能因為懶得煮菜就只吃水果。',
    keyPoints: [
      '大小番茄大不同：大番茄是「蔬菜」（低糖），小番茄是「水果」（高糖）。',
      '蔬菜定義：熱量低、纖維高，如葉菜類、玉米筍、大番茄、小黃瓜、海帶、木耳。',
      '水果限制：台灣水果通常很甜，減脂期建議一天 2 份（約 2 個拳頭大）。',
      '低 GI 水果推薦：芭樂、奇異果、蘋果（帶皮）、莓果類。'
    ],
    examples: [
      '木耳飲如果微糖，可以當作補充膳食纖維的好來源（木耳是蔬菜）。',
      '玉米筍看起來像澱粉，其實它是未成熟的玉米，屬於蔬菜類，可以多吃！'
    ],
    commonMistakes: [
      '覺得今天沒吃菜，晚上怒吃兩顆大芒果補償（糖分爆炸）。',
      '把酸菜、醬瓜當成蔬菜來源（鈉含量過高，營養流失）。'
    ],
    tinyActions: [
      '下一餐試著把水果量控制在一個拳頭大小。',
      '去超市找找看「玉米筍」和「大番茄」，把它們加入你的購物籃。'
    ],
    estimatedReadingMinutes: 2
  },
  {
    id: 'lv1-dairy-alternatives',
    level: 1,
    categoryKey: 'Awareness',
    title: '乳品與替代品：喝錯補不到鈣',
    subtitle: '燕麥奶不是奶，是澱粉水',
    summary: '植物奶很流行，但它們的營養價值跟牛奶完全不同。選擇飲品時，要清楚自己是想補鈣、補蛋白，還是單純好喝。',
    keyPoints: [
      '鮮奶/奶粉：主要提供鈣質與蛋白質，屬於乳品類。',
      '豆漿：提供蛋白質，但鈣質極低（除非喝高鈣豆漿），屬於豆魚蛋肉類。',
      '燕麥奶/米漿：主要成分是碳水化合物，屬於全穀雜糧類（澱粉），蛋白質與鈣都很低。',
      '杏仁奶：市售多為水+杏仁油+糖，熱量低但營養密度也低。'
    ],
    examples: [
      '拿鐵（牛奶）換成燕麥奶，其實是把蛋白質換成了澱粉，熱量可能更高。',
      '早餐喝米漿配飯糰，等於是「澱粉配澱粉」，升糖指數爆表。'
    ],
    commonMistakes: [
      '以為喝燕麥奶可以補鈣長高。',
      '以為乳酸飲料（如養樂多）等於喝牛奶，其實那是糖水。'
    ],
    tinyActions: [
      '如果你有乳糖不耐症，改喝「無糖豆漿」補蛋白，並透過深綠色蔬菜或黑芝麻補鈣。',
      '買咖啡時，意識到「換燕麥奶」等於增加碳水攝取。'
    ],
    estimatedReadingMinutes: 3
  },
  {
    id: 'lv1-beverage-snacks',
    level: 1,
    categoryKey: 'Awareness',
    title: '飲料與零食陷阱：甜蜜的陷阱',
    subtitle: '果汁其實是含糖飲料',
    summary: '除了正餐，我們攝取的「流質熱量」與「無意識零食」往往是發胖主因。許多聽起來健康的食物，其實加工後營養全失。',
    keyPoints: [
      '果汁 vs 水果：果汁濾掉纖維，血糖上升速度快，且容易喝過量（一杯柳橙汁=5顆柳橙的糖）。',
      '蔬果乾陷阱：經過脫水與油炸，體積縮小但熱量濃縮，且常添加糖鹽。',
      '勾芡湯品：酸辣湯、玉米濃湯、麵線糊，這些湯底都是澱粉勾芡，熱量高且易囤積。',
      '手搖飲配料：珍珠、芋圓、粉條全部都是澱粉，一杯全糖珍奶熱量直逼便當。'
    ],
    examples: [
      '覺得吃水果麻煩所以喝「每日C」，其實喝進了大量游離糖。',
      '下午茶吃「乾燥蔬菜脆片」，以為很健康，其實吃進大量油脂。'
    ],
    commonMistakes: [
      '以為「微糖」飲料熱量很低，其實含糖量依然驚人。',
      '吃飯習慣配一碗勾芡的羹湯，讓整餐GI值飆高。'
    ],
    tinyActions: [
      '下次想喝果汁時，直接去買一顆水果來咬。',
      '點手搖飲時，嘗試「無糖」或「一分糖」，並拒絕加料。'
    ],
    estimatedReadingMinutes: 3
  },
  {
    id: 'lv1-glossary-basics',
    level: 1,
    categoryKey: 'Awareness', 
    title: '營養名詞小字典：一看就懂版',
    subtitle: '蛋白質、碳水、脂肪、電解質到底是什麼？',
    summary: '這一章是把最常聽到、卻常搞不懂的營養名詞整理成小字典。你可以當作「快速查表」，知道這個名詞是什麼、主要功用是什麼、平常從哪裡吃到。',
    keyPoints: [
      '三大宏量營養素（碳水、蛋白、脂肪）是身體運作的基石，缺一不可。',
      '微量營養素（維生素、礦物質）雖然需求量少，卻是維持免疫力、代謝功能的關鍵。',
      '運動補給品（如肌酸、BCAA）是錦上添花，基礎飲食沒顧好，吃補給品效果有限。'
    ],
    examples: [
      '重訓完覺得肌肉痠痛，這時候身體最需要的是「蛋白質」來修補。',
      '長跑或大量流汗後，只喝水不夠，需要補充「電解質」防止抽筋。',
      '減脂期雖然要少吃油，但完全不吃「脂肪」會導致皮膚乾燥、甚至停經，重點是選好油（如魚油 Omega-3）。'
    ],
    commonMistakes: [
      '以為「電解質」只是鹽巴，其實還包含鉀、鎂、鈣等礦物質。',
      '以為「肌酸」是藥物會傷腎，其實它是研究最透徹的安全補給品（針對健康成人）。',
      '以為「低 GI」等於低熱量，其實油炸食品 GI 值低但熱量超高。'
    ],
    tinyActions: [
      '點擊右上角的「📖 名詞字典」按鈕，試著搜尋一個你常聽到的營養名詞。',
      '今天吃飯時，看著盤子裡的食物，在心裡默念這是碳水、蛋白還是脂肪。'
    ],
    estimatedReadingMinutes: 2
  },

  // ==========================================
  // Level 2: Quantification (新增章節)
  // ==========================================
  
  {
    id: 'lv2-hand-method',
    level: 2,
    categoryKey: 'Quantification',
    title: '手掌法則：隨身攜帶的測量神器',
    subtitle: '不用秤也能算熱量？你的手就是最佳工具',
    summary: '在外吃飯不可能隨身帶電子秤，學會用「手掌」來估算份量，是你控制飲食最實用的技能。這套方法能讓你一眼看出這餐有沒有超標。',
    keyPoints: [
      '蛋白質（豆魚蛋肉）：看「手掌心」大小與厚度，女生一餐一份，男生一餐兩份。',
      '蔬菜（纖維）：看「拳頭」大小，每餐至少要大於一個拳頭。',
      '碳水化合物（澱粉）：看「拳頭」或「碗」，減脂期建議每餐控制在一個拳頭內。',
      '油脂與堅果：看「大拇指」，一節大拇指約為一茶匙的油。'
    ],
    examples: [
      '自助餐夾肉時，那塊排骨如果比你的手掌大很多，那可能就是 2 份蛋白質（與油脂）。',
      '便利商店的御飯糰，大約就是一個女生拳頭大的澱粉量。'
    ],
    commonMistakes: [
      '只看面積不看厚度：一片薄薄的肉片跟厚切牛排，蛋白質含量差很多。',
      '忽略烹調用油：雖然只吃了一掌心的肉，但如果是炸的，熱量要加倍算。'
    ],
    tinyActions: [
      '現在伸出你的手，看看你的「掌心」有多大，這就是你下一餐肉類的建議份量。',
      '下一餐吃飯時，試著用拳頭比對一下碗裡的飯，是多於一個拳頭還是少於？'
    ],
    estimatedReadingMinutes: 3
  },
  {
    id: 'lv2-calorie-density',
    level: 2,
    categoryKey: 'Quantification',
    title: '熱量密度：為什麼吃得少卻變胖？',
    subtitle: '體積大不代表熱量高，吃對食物能越吃越瘦',
    summary: '「熱量密度」是指每公克食物含有的熱量。掌握這個概念，你就能在減脂期吃得飽又不爆卡。重點是選擇「低密度、高體積」的食物。',
    keyPoints: [
      '高密度地雷（紅燈）：油脂、堅果、餅乾、蛋糕、炸物。一小口就破百卡。',
      '中密度（黃燈）：米飯、麵條、肉類、麵包。適量食用。',
      '低密度救星（綠燈）：蔬菜、水果、湯（清湯）、豆腐、蒟蒻。吃一大盆熱量都很低。',
      '飽足感關鍵：胃的飽脹感主要來自「體積」而非熱量。多吃綠燈食物能撐大胃壁產生飽足感。'
    ],
    examples: [
      '100g 的花椰菜只有 25 大卡，但 100g 的洋芋片有 540 大卡，熱量差了 20 倍！',
      '喝一杯珍奶的熱量（700卡），相當於吃 3 碗白飯，但飽足感卻差很多。'
    ],
    commonMistakes: [
      '以為堅果很健康就一直吃，殊不知它是超高熱量密度食物。',
      '為了減肥吃得很少（體積小），結果選的都是高密度食物（如一小塊蛋糕），反而更餓。'
    ],
    tinyActions: [
      '比較一下便利商店裡「一包堅果」和「一盒生菜沙拉」的熱量與體積。',
      '試著在正餐前先喝一大杯水或吃一碗燙青菜，感受一下飽足感的變化。'
    ],
    estimatedReadingMinutes: 3
  },
  {
    id: 'lv2-serving-concept',
    level: 2,
    categoryKey: 'Quantification',
    title: '「一份」是多少？建立份量絕對音感',
    subtitle: '1份醣 = 1/4碗飯，1份肉 = 1顆蛋',
    summary: '營養師常說的「一份」到底是多少？建立這個概念後，你就能快速換算不同食物。例如吃了半碗飯，就知道攝取了2份主食。',
    keyPoints: [
      '一份全穀雜糧（澱粉）：約 15g 碳水 = 1/4 碗飯 = 1/2 碗稀飯 = 1/2 片吐司 = 1/2 顆中型地瓜。',
      '一份豆魚蛋肉（蛋白質）：約 7g 蛋白質 = 1 顆蛋 = 1 杯無糖豆漿(190ml) = 3 指寬的肉。',
      '一份油脂：約 5g 油 = 1 茶匙油 = 2 粒核桃。',
      '一份水果：約 拳頭大 = 切塊後約 8 分滿碗。'
    ],
    examples: [
      '早餐吃了一個蛋餅（相當於半碗飯澱粉+1份油）加一顆蛋（1份蛋白），這樣你就知道這餐吃了什麼。',
      '喝了一瓶 400ml 的含糖飲料（含40g糖），大約等於吃了快 3 份主食（接近3/4碗飯）的熱量。'
    ],
    commonMistakes: [
      '以為水餃皮很薄不算澱粉，其實 3-4 顆水餃皮就等於 1/4 碗飯。',
      '以為香蕉一根就是一份，其實大根香蕉可能高達 2 份水果。'
    ],
    tinyActions: [
      '下次吃吐司時，記得一片就是「2份」主食（約半碗飯熱量）。',
      '去超商買豆漿，看背後的蛋白質含量，換算一下這瓶等於幾顆蛋。'
    ],
    estimatedReadingMinutes: 4
  },
  {
    id: 'lv2-eating-out',
    level: 2,
    categoryKey: 'Quantification',
    title: '外食份量直覺：便當與火鍋的真相',
    subtitle: '便當飯量通常超標，火鍋湯底是陷阱',
    summary: '台灣外食方便，但也充滿份量陷阱。便當店的飯量通常是建議量的 1.5 倍，火鍋的湯與醬料更是熱量黑洞。',
    keyPoints: [
      '便當法則：市售便當飯量約 1.5~2 碗，建議「飯吃一半」。主菜盡量選滷雞腿、蒸魚，避開炸排骨（吸油多）。',
      '火鍋攻略：湯底選昆布/蔬菜（清湯），避開麻辣/牛奶/沙茶（高油）。火鍋料全換蔬菜或嫩豆腐。',
      '便利商店：是練習看標示的最好地方。選擇「圓形食物」（地瓜、茶葉蛋、雞胸肉）最安全。',
      '自助餐：順序很重要，先夾滿半盤蔬菜，再夾掌心大蛋白質，最後補一點飯。'
    ],
    examples: [
      '一個炸雞腿便當熱量常突破 900 大卡，主要來自炸皮的油與過量的飯。',
      '吃火鍋沾沙茶醬，一碟熱量就超過 200 卡（等於一碗飯），改用醬油+蔥蒜辣椒最穩。'
    ],
    commonMistakes: [
      '覺得便當太油所以把菜過水，結果把飯全部吃光（澱粉過量）。',
      '吃火鍋時狂喝湯，結果鈉含量爆表導致隔天大水腫。'
    ],
    tinyActions: [
      '下次買便當，直接跟老闆說「飯一半」。',
      '去吃火鍋時，忍住不喝湯，並且醬料區只拿蔥、蒜、辣椒、醬油、醋。'
    ],
    estimatedReadingMinutes: 3
  },
  {
    id: 'lv2-portion-illusions',
    level: 2,
    categoryKey: 'Quantification',
    title: '常見份量錯覺：堅果與飲料的陷阱',
    subtitle: '拿鐵也是液體麵包，義大利麵是吸油怪',
    summary: '有些食物看起來無害，或者份量看起來不多，但熱量卻驚人。這些「視覺詐欺」是減重失敗的主因。',
    keyPoints: [
      '拿鐵效應：牛奶是液體熱量，一杯大杯拿鐵的牛奶熱量可能接近 200 卡。',
      '義大利麵：尤其是青醬和白醬，製作過程加入大量奶油與油，麵體又吸附醬汁，熱量遠高於同份量的湯麵。',
      '健康堅果：堅果很健康但熱量極高，一把抓下去可能就吃進半個便當的熱量。',
      '酒精陷阱：酒精 1g = 7kcal，且身體會優先代謝酒精而囤積脂肪，喝酒等於喝油。'
    ],
    examples: [
      '以為吃義大利麵比吃便當優雅輕盈，結果一盤白醬培根麵熱量破千。',
      '週末晚上喝了兩罐啤酒配一點堅果，熱量直接超過一頓晚餐。'
    ],
    commonMistakes: [
      '把拿鐵當水喝，忽略了裡面牛奶的熱量。',
      '以為青醬是蔬菜做的很健康，其實它是油+羅勒打出來的。'
    ],
    tinyActions: [
      '想喝咖啡時，試著改喝美式，或者把拿鐵換成「小杯」。',
      '吃義大利麵時，優先選擇清炒（蒜香）或紅醬，避開白醬與青醬。'
    ],
    estimatedReadingMinutes: 3
  }
];

// --- Data: Central Question Bank ---
const QUESTION_BANK = [
  // ... LV1 questions ...
  { id: 'l1-c1', level: 1, category: 'Awareness', type: 'choice', question: '下列哪一項食材在營養分類上屬於「全穀雜糧類」(澱粉)，而非蔬菜？', options: ['玉米筍', '玉米', '綠豆芽', '金針菇'], correct: 1, explanation: '玉米成熟後澱粉含量高，屬於全穀雜糧類；玉米筍則是蔬菜。' },
  { id: 'l1-c8', level: 1, category: 'Awareness', type: 'choice', question: '下列哪種「根莖類」食材其實是澱粉，熱量比一般蔬菜高出許多？', options: ['白蘿蔔', '紅蘿蔔', '牛蒡', '山藥'], correct: 3, explanation: '山藥、馬鈴薯、地瓜、芋頭都是澱粉來源。白蘿蔔與紅蘿蔔是蔬菜。' },
  { id: 'l1-c10', level: 1, category: 'Awareness', type: 'choice', question: '自助餐常見的「三色豆」，裡面的玉米和豌豆仁主要屬於什麼類別？', options: ['蔬菜類', '全穀雜糧類', '蛋白質類', '水果類'], correct: 1, explanation: '三色豆中有兩樣(玉米、豌豆仁)是澱粉，只有紅蘿蔔是蔬菜。' },
  { id: 'l1-c14', level: 1, category: 'Awareness', type: 'choice', question: '「蓮藕」在營養學分類上，主要屬於哪一類？', options: ['蔬菜類', '水果類', '全穀雜糧類', '蛋白質類'], correct: 2, explanation: '蓮藕富含澱粉，屬於全穀雜糧類，食用時需替代飯量。' },
  { id: 'l1-c15', level: 1, category: 'Awareness', type: 'choice', question: '口感清脆的「荸薺」常出現在肉丸中，它屬於哪一類？', options: ['蔬菜類', '全穀雜糧類', '水果類', '油脂類'], correct: 1, explanation: '荸薺雖然口感像蔬菜，但碳水化合物含量高，歸類為全穀雜糧類。' },
  { id: 'l1-c16', level: 1, category: 'Awareness', type: 'choice', question: '下列哪一種豆子，其實是「澱粉」而非蛋白質？', options: ['黃豆', '黑豆', '毛豆', '紅豆'], correct: 3, explanation: '紅豆、綠豆、花豆都是澱粉；「黃豆、黑豆、毛豆」才是豆類蛋白質三兄弟。' },
  { id: 'l1-c2', level: 1, category: 'Awareness', type: 'choice', question: '百頁豆腐的主要成分除了黃豆，還添加了大量的什麼？', options: ['水', '油脂', '纖維', '鈣質'], correct: 1, explanation: '百頁豆腐約有 50% 熱量來自油脂，屬於高脂加工食品。' },
  { id: 'l1-c7', level: 1, category: 'Awareness', type: 'choice', question: '火鍋料中的「蟹肉棒」主要成分是什麼？', options: ['螃蟹肉', '魚漿與澱粉', '雞肉', '豆腐'], correct: 1, explanation: '蟹肉棒是加工食品，主要成分是魚漿、澱粉、色素，碳水含量不低。' },
  { id: 'l1-c9', level: 1, category: 'Awareness', type: 'choice', question: '早餐店常見的「培根」屬於哪一類？', options: ['豆魚蛋肉類', '蔬菜類', '油脂類', '乳品類'], correct: 2, explanation: '培根脂肪比例極高，在營養分類上歸類為高脂肉類或油脂類，非優質蛋白。' },
  { id: 'l1-c12', level: 1, category: 'Awareness', type: 'choice', question: '壽司店的「豆皮壽司」，那片豆皮是怎麼處理的？', options: ['水煮', '油炸後糖漬', '烘烤', '發酵'], correct: 1, explanation: '豆皮本身是炸過的，再用糖水滷製，熱量與含糖量皆高。' },
  { id: 'l1-c17', level: 1, category: 'Awareness', type: 'choice', question: '下列哪種素食材料，其實是「蛋白質」來源？', options: ['麵筋', '冬粉', '蒟蒻', '寒天'], correct: 0, explanation: '麵筋是麵粉洗去澱粉後剩下的「小麥蛋白」，屬於蛋白質；冬粉是澱粉。' },
  { id: 'l1-c18', level: 1, category: 'Awareness', type: 'choice', question: '關於「毛豆」的分類，下列何者正確？', options: ['它是蔬菜', '它是澱粉', '它是優質蛋白質', '它是油脂'], correct: 2, explanation: '毛豆是未成熟的黃豆，屬於優質蛋白質來源。' },
  { id: 'l1-c3', level: 1, category: 'Awareness', type: 'choice', question: '酪梨(Avocado)在營養學分類中，主要屬於哪一類？', options: ['水果類', '蔬菜類', '油脂與堅果種子類', '蛋白質類'], correct: 2, explanation: '酪梨脂肪含量高，被歸類為油脂類，不應當作一般水果大量食用。' },
  { id: 'l1-c6', level: 1, category: 'Awareness', type: 'choice', question: '下列哪一個選項其實是「油脂」而非堅果或豆類？', options: ['杏仁果', '腰果', '芝麻', '紅豆'], correct: 2, explanation: '芝麻、花生、瓜子都屬於「油脂與堅果種子類」。' },
  { id: 'l1-c19', level: 1, category: 'Awareness', type: 'choice', question: '泰式料理常見的「椰奶 (Coconut Milk)」，主要營養素是？', options: ['蛋白質', '碳水化合物', '油脂', '膳食纖維'], correct: 2, explanation: '椰奶是椰肉榨出的汁，飽和脂肪含量極高，屬於油脂類，非乳製品。' },
  { id: 'l1-c20', level: 1, category: 'Awareness', type: 'choice', question: '蛋糕上的「鮮奶油 (Cream)」是由牛奶提煉，但它屬於哪一類？', options: ['乳品類', '油脂類', '蛋白質類', '糖類'], correct: 1, explanation: '鮮奶油是從牛奶中提煉出的脂肪，熱量幾乎全來自油脂。' },
  { id: 'l1-c5', level: 1, category: 'Awareness', type: 'choice', question: '減脂期間想吃番茄，應該選哪一種熱量較低且屬於蔬菜類？', options: ['聖女小番茄', '大番茄', '番茄果乾', '梅漬番茄'], correct: 1, explanation: '大番茄是蔬菜，含糖低；小番茄是水果，含糖較高。' },
  { id: 'l1-c11', level: 1, category: 'Awareness', type: 'choice', question: '下列哪一種飲料其實屬於「乳製品」，可以補充鈣質？', options: ['燕麥奶', '豆漿', '鮮奶', '杏仁奶'], correct: 2, explanation: '鮮奶是乳品類。燕麥奶是澱粉水，豆漿是蛋白質，市售杏仁奶通常油脂為主。' },
  { id: 'l1-c13', level: 1, category: 'Awareness', type: 'choice', question: '「檸檬」雖然吃起來很酸，但在分類上屬於？', options: ['蔬菜類', '水果類', '調味料', '無熱量食材'], correct: 1, explanation: '檸檬屬於水果類，依然含有果糖，不能因為酸就誤以為沒有熱量。' },
  { id: 'l1-c21', level: 1, category: 'Awareness', type: 'choice', question: '「海帶」與「紫菜」在營養分類上屬於？', options: ['蔬菜類', '海鮮類', '澱粉類', '油脂類'], correct: 0, explanation: '藻類富含纖維與礦物質，歸類為蔬菜類。' },
  { id: 'l1-c22', level: 1, category: 'Awareness', type: 'choice', question: '下列哪種飲料通常含糖量極高，且乳含量低，不建議當作補充奶類？', options: ['全脂鮮奶', '無糖優酪乳', '乳酸飲料(如養樂多)', '保久乳'], correct: 2, explanation: '乳酸飲料通常添加大量糖分來平衡酸味，且蛋白質與鈣質含量遠低於鮮奶。' },
  { id: 'l1-b1', level: 1, category: 'Awareness', type: 'boolean', question: 'Q. (是非題) 「冬粉」看起來透明清爽，所以熱量很低，可以當作蔬菜吃到飽？', options: ['正確', '錯誤'], correct: 1, explanation: '錯誤。冬粉是綠豆澱粉做的，吸水率高，本質是主食（澱粉），且極易吸附湯汁油脂。' },
  { id: 'l1-b2', level: 1, category: 'Awareness', type: 'boolean', question: 'Q. (是非題) 菱角、栗子吃起來粉粉的，因為它們是「全穀雜糧類」(澱粉)？', options: ['正確', '錯誤'], correct: 0, explanation: '正確。菱角、栗子都是澱粉來源，吃多需要減少米飯攝取。' },
  { id: 'l1-b3', level: 1, category: 'Awareness', type: 'boolean', question: 'Q. (是非題) 南瓜、山藥、地瓜都是蔬菜，減肥時可以多吃來取代正餐？', options: ['正確', '錯誤'], correct: 1, explanation: '錯誤。它們是澱粉，雖然比白飯營養，但仍需控制份量，不能當作「蔬菜」吃到飽。' },
  { id: 'l1-b4', level: 1, category: 'Awareness', type: 'boolean', question: 'Q. (是非題) 鴨血和豬血糕看起來很像，所以它們都是蛋白質來源？', options: ['正確', '錯誤'], correct: 1, explanation: '錯誤。鴨血是純蛋白質；豬血糕混入了大量糯米，屬於「澱粉類」。' },
  { id: 'l1-b5', level: 1, category: 'Awareness', type: 'boolean', question: 'Q. (是非題) 香腸、熱狗雖然是肉做的，但屬於「高脂肉類」，不建議常吃？', options: ['正確', '錯誤'], correct: 0, explanation: '正確。加工肉品通常脂肪含量高，且含有亞硝酸鹽等添加物。' },
  { id: 'l1-b6', level: 1, category: 'Awareness', type: 'boolean', question: 'Q. (是非題) 希臘優格(Greek Yogurt)屬於乳製品，且蛋白質含量通常比一般優格高？', options: ['正確', '錯誤'], correct: 0, explanation: '正確。希臘優格過濾了乳清，質地濃稠，蛋白質含量是普通優格的 2 倍以上。' },
  { id: 'l1-b7', level: 1, category: 'Awareness', type: 'boolean', question: 'Q. (是非題) 豆輪、烤麩這些素料，經過油炸處理，熱量通常比一般豆腐高很多？', options: ['正確', '錯誤'], correct: 0, explanation: '正確。這些加工豆製品吸油量極高，是素食者的熱量陷阱。' },
  { id: 'l1-b8', level: 1, category: 'Awareness', type: 'boolean', question: 'Q. (是非題) 橄欖油因為很健康，所以多吃不會變胖，可以盡量喝？', options: ['正確', '錯誤'], correct: 1, explanation: '錯誤。橄欖油雖然是好油，但它依然是脂肪，1公克9大卡，過量一樣會囤積脂肪。' },
  { id: 'l1-b9', level: 1, category: 'Awareness', type: 'boolean', question: 'Q. (是非題) 花生醬是植物性的，所以屬於健康的蛋白質來源？', options: ['正確', '錯誤'], correct: 1, explanation: '錯誤。花生屬於油脂類，花生醬雖含部分蛋白，但絕大多數熱量來自脂肪與添加糖。' },
  { id: 'l1-b10', level: 1, category: 'Awareness', type: 'boolean', question: 'Q. (是非題) 「奶油 (Butter)」是牛奶做的，所以算是乳製品，可以補鈣？', options: ['正確', '錯誤'], correct: 1, explanation: '錯誤。奶油是從牛奶提煉出的脂肪，屬於「油脂類」，鈣質含量極低。' },
  { id: 'l1-b11', level: 1, category: 'Awareness', type: 'boolean', question: 'Q. (是非題) 為了方便，我可以喝「100% 果汁」來完全取代吃水果？', options: ['正確', '錯誤'], correct: 1, explanation: '錯誤。果汁濾掉了最重要的膳食纖維，且容易攝取過量糖分，血糖波動大。' },
  { id: 'l1-b12', level: 1, category: 'Awareness', type: 'boolean', question: 'Q. (是非題) 蔬果乾(如乾燥秋葵、香蕉片)是健康的零食，熱量很低？', options: ['正確', '錯誤'], correct: 1, explanation: '錯誤。蔬果乾經過脫水體積變小，容易吃過量，且市售品常經油炸或加糖，熱量驚人。' },
  { id: 'l1-b13', level: 1, category: 'Awareness', type: 'boolean', question: 'Q. (是非題) 木耳(黑木耳/白木耳)富含膠質，在分類上屬於蔬菜類？', options: ['正確', '錯誤'], correct: 0, explanation: '正確。木耳屬於菇類（蔬菜），富含水溶性膳食纖維，熱量低。' },
  { id: 'l1-b14', level: 1, category: 'Awareness', type: 'boolean', question: 'Q. (是非題) 酸辣湯、玉米濃湯因為有勾芡，所以熱量會比清湯高很多？', options: ['正確', '錯誤'], correct: 0, explanation: '正確。勾芡使用的是太白粉（澱粉），會大幅增加湯品的熱量與GI值。' },
  { id: 'l1-b15', level: 1, category: 'Awareness', type: 'boolean', question: 'Q. (是非題) 奇異果、芭樂雖然甜，但屬於低 GI 水果，適合減脂期食用？', options: ['正確', '錯誤'], correct: 0, explanation: '正確。它們富含纖維與維生素C，對血糖影響相對較小，但仍需控制份量。' },

  // ==========================================
  // Level 2: Choice (選擇題 - 份量估算)
  // ==========================================

  {
    id: 'l2-c01', level: 2, category: 'Quantification', type: 'choice',
    question: '一個市售常見的炸排骨便當，總熱量大約落在哪個區間？',
    options: ['400-500卡', '500-600卡', '800-900卡', '1200卡以上'],
    correct: 2, explanation: '飯量約 1.5 碗(420卡) + 炸排骨(300卡) + 配菜(油炒)，輕易突破 800 卡。'
  },
  {
    id: 'l2-c02', level: 2, category: 'Quantification', type: 'choice',
    question: '根據「手掌法則」，一般女性一餐建議攝取多少份量的豆魚蛋肉類？',
    options: ['一個指節', '一個掌心(不含手指)', '一個拳頭', '兩隻手掌'],
    correct: 1, explanation: '女性一餐建議約一掌心大小與厚度的蛋白質，男性則建議一掌心至一整手掌。'
  },
  {
    id: 'l2-c03', level: 2, category: 'Quantification', type: 'choice',
    question: '一碗尖尖的白飯(約200g)，熱量大約是多少？',
    options: ['140卡 (半碗)', '280卡 (一碗)', '420卡 (一碗半)', '560卡 (兩碗)'],
    correct: 1, explanation: '標準一碗飯 (160g) 約 280 大卡，尖尖的飯可能會超過，但最接近 280 卡。'
  },
  {
    id: 'l2-c04', level: 2, category: 'Quantification', type: 'choice',
    question: '1公克的脂肪可以產生約多少大卡的熱量？',
    options: ['4大卡', '7大卡', '9大卡', '12大卡'],
    correct: 2, explanation: '脂肪是熱量密度最高的營養素，1g 提供 9kcal；碳水與蛋白質則為 4kcal。'
  },
  {
    id: 'l2-c05', level: 2, category: 'Quantification', type: 'choice',
    question: '一份水果（約60大卡）的份量大約是多少？',
    options: ['一顆大蘋果', '一個拳頭大', '兩根香蕉', '半顆小番茄'],
    correct: 1, explanation: '一份水果約為一個女生的拳頭大小，或切塊後裝在碗裡約 8 分滿。'
  },
  {
    id: 'l2-c06', level: 2, category: 'Quantification', type: 'choice',
    question: '下列哪種早餐組合的熱量密度最高（體積小但熱量高）？',
    options: ['地瓜 + 無糖豆漿', '生菜沙拉 + 茶葉蛋', '燒餅油條', '饅頭夾蛋'],
    correct: 2, explanation: '燒餅油條是「油包油」的組合，麵糰吸滿油脂，體積雖不大但熱量極高。'
  },
  {
    id: 'l2-c07', level: 2, category: 'Quantification', type: 'choice',
    question: '去便利商店買「雞胸肉」，一塊（約100g-110g）通常含有多少蛋白質？',
    options: ['10g', '20-24g', '40g', '5g'],
    correct: 1, explanation: '市售即食雞胸肉一份約含 20-24g 蛋白質，約等於 3 份豆魚蛋肉類。'
  },
  {
    id: 'l2-c08', level: 2, category: 'Quantification', type: 'choice',
    question: '堅果雖然健康，但熱量很高。每日建議攝取量約為多少？',
    options: ['一碗公', '一整包', '大拇指第一指節大小 (約1份油脂)', '隨意吃到飽'],
    correct: 2, explanation: '堅果屬於油脂類，每日建議一茶匙或大拇指指節大小（約 5 顆腰果）。'
  },
  {
    id: 'l2-c09', level: 2, category: 'Quantification', type: 'choice',
    question: '吃水餃時，一顆標準水餃的熱量大約落在哪裡？',
    options: ['10-20卡', '50-60卡', '100卡', '5卡'],
    correct: 1, explanation: '水餃皮是澱粉，內餡是絞肉（高脂），一顆約 50-60 卡，吃 10 顆就 500-600 卡。'
  },
  {
    id: 'l2-c10', level: 2, category: 'Quantification', type: 'choice',
    question: '大杯拿鐵（無糖，使用全脂奶）的熱量來源主要是什麼？',
    options: ['咖啡豆油脂', '牛奶', '水', '奶精'],
    correct: 1, explanation: '拿鐵中含有大量牛奶，一杯大杯拿鐵可能有 200-300ml 牛奶，熱量約 150-200 卡。'
  },
  {
    id: 'l2-c11', level: 2, category: 'Quantification', type: 'choice',
    question: '在火鍋店用餐，哪種主食的「吸油率」最高，熱量最容易爆表？',
    options: ['白飯', '烏龍麵', '冬粉', '雞蛋麵'],
    correct: 2, explanation: '冬粉極易吸附湯汁表面的浮油，煮在麻辣鍋或高湯中，熱量會翻倍。'
  },
  {
    id: 'l2-c12', level: 2, category: 'Quantification', type: 'choice',
    question: '一份「全穀雜糧類」（主食）含有 15g 碳水化合物，大約等於多少飯？',
    options: ['一碗飯', '半碗飯', '1/4 碗飯', '一口飯'],
    correct: 2, explanation: '1/4 碗飯（約40g熟飯）= 1 份主食 = 15g 碳水 = 70 大卡。'
  },
  {
    id: 'l2-c13', level: 2, category: 'Quantification', type: 'choice',
    question: '便利商店的「三角飯糰」，一個熱量大約是多少？',
    options: ['100卡', '200卡左右', '400卡', '600卡'],
    correct: 1, explanation: '一般三角飯糰熱量約在 180-220 卡之間，相當於 0.7 碗飯。'
  },
  {
    id: 'l2-c14', level: 2, category: 'Quantification', type: 'choice',
    question: '下列哪種醬料的「熱量密度」最高？',
    options: ['醬油', '烏醋', '沙茶醬', '番茄醬'],
    correct: 2, explanation: '沙茶醬主要成分是油、花生粉、魚乾，一湯匙熱量就破百卡，密度極高。'
  },
  {
    id: 'l2-c15', level: 2, category: 'Quantification', type: 'choice',
    question: '想減脂，在義大利麵餐廳點哪種口味通常熱量相對較低？',
    options: ['白醬培根', '青醬雞肉', '清炒蒜香蛤蜊', '肉醬焗烤'],
    correct: 2, explanation: '清炒用油量相對可控且無額外鮮奶油。白醬、青醬含大量油脂與奶油，焗烤更不用說。'
  },

  // ==========================================
  // Level 2: True/False (是非題 - 份量估算)
  // ==========================================

  {
    id: 'l2-b01', level: 2, category: 'Quantification', type: 'boolean',
    question: 'Q. (是非題) 水果很健康，所以減肥期間可以無限量吃到飽，不用計算份量？',
    options: ['正確', '錯誤'], correct: 1, 
    explanation: '錯誤。水果含果糖，熱量不低。一般建議每餐一份（拳頭大），過量一樣會胖。'
  },
  {
    id: 'l2-b02', level: 2, category: 'Quantification', type: 'boolean',
    question: 'Q. (是非題) 100g 的洋芋片和 100g 的花椰菜，熱量是一樣的？',
    options: ['正確', '錯誤'], correct: 1, 
    explanation: '錯誤。洋芋片是高熱量密度食物（約540卡），花椰菜是低密度（約25卡），差了20倍。'
  },
  {
    id: 'l2-b03', level: 2, category: 'Quantification', type: 'boolean',
    question: 'Q. (是非題) 喝湯時，清湯通常比濃湯（勾芡、加奶油）熱量低很多？',
    options: ['正確', '錯誤'], correct: 0, 
    explanation: '正確。濃湯常加入澱粉勾芡或鮮奶油，熱量遠高於清湯。'
  },
  {
    id: 'l2-b04', level: 2, category: 'Quantification', type: 'boolean',
    question: 'Q. (是非題) 一個拳頭大的饅頭，熱量跟一個拳頭大的地瓜差不多？',
    options: ['正確', '錯誤'], correct: 1, 
    explanation: '錯誤。饅頭紮實且精緻，熱量密度高（約280卡）；地瓜水分多纖維多（約140卡），饅頭熱量約是地瓜兩倍。'
  },
  {
    id: 'l2-b05', level: 2, category: 'Quantification', type: 'boolean',
    question: 'Q. (是非題) 酒精的熱量很高，1g 酒精約有 7 大卡，接近脂肪的熱量？',
    options: ['正確', '錯誤'], correct: 0, 
    explanation: '正確。酒精熱量僅次於脂肪(9kcal)，且代謝時會優先堆積脂肪，是液體熱量炸彈。'
  },
  {
    id: 'l2-b06', level: 2, category: 'Quantification', type: 'boolean',
    question: 'Q. (是非題) 為了精準控制飲食，每一餐都一定要用電子秤秤重才行？',
    options: ['正確', '錯誤'], correct: 1, 
    explanation: '錯誤。長期來說「手掌法則」更實用且容易執行，能幫助養成直覺，減少心理壓力。'
  },
  {
    id: 'l2-b07', level: 2, category: 'Quantification', type: 'boolean',
    question: 'Q. (是非題) 蔬菜（如葉菜類）熱量極低，基本上可以視為「吃到飽」不限量？',
    options: ['正確', '錯誤'], correct: 0, 
    explanation: '正確。葉菜類體積大熱量低，多吃能增加飽足感，只要注意烹調不要加太多油即可。'
  },
  {
    id: 'l2-b08', level: 2, category: 'Quantification', type: 'boolean',
    question: 'Q. (是非題) 兩顆核桃就大約等於一茶匙的油（一份油脂）？',
    options: ['正確', '錯誤'], correct: 0, 
    explanation: '正確。堅果種子類是油脂來源，份量稍微抓一點點就足夠了。'
  },
  {
    id: 'l2-b09', level: 2, category: 'Quantification', type: 'boolean',
    question: 'Q. (是非題) 如果今天喝了一杯含糖飲料，它的熱量可能相當於多吃了一碗飯？',
    options: ['正確', '錯誤'], correct: 0, 
    explanation: '正確。一杯全糖珍奶熱量可達 700 卡，超過兩碗白飯的熱量。'
  },
  {
    id: 'l2-b10', level: 2, category: 'Quantification', type: 'boolean',
    question: 'Q. (是非題) 雞胸肉是低脂肉，所以不管用炸的還是煎的，熱量都一樣低？',
    options: ['正確', '錯誤'], correct: 1, 
    explanation: '錯誤。裹粉油炸會讓表皮吸附大量油脂，熱量可能比水煮高出一倍以上。'
  }
];

// --- Helper Functions ---

const getRandomQuestions = (level, countChoice = 10, countBool = 10) => {
  const levelQuestions = QUESTION_BANK.filter(q => q.level === level);
  const choiceQs = levelQuestions.filter(q => q.type === 'choice');
  const boolQs = levelQuestions.filter(q => q.type === 'boolean');

  const shuffle = (array) => {
    let newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const selectedChoice = shuffle(choiceQs).slice(0, countChoice);
  const selectedBool = shuffle(boolQs).slice(0, countBool);
  return [...selectedChoice, ...selectedBool];
};

// --- Components ---

const ProgressBar = ({ current, total }) => (
  <div className="w-full bg-white/20 rounded-full h-3 mb-8 overflow-hidden backdrop-blur-sm">
    <div 
      className="bg-emerald-400 h-3 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(52,211,153,0.5)]" 
      style={{ width: `${(current / total) * 100}%` }}
    ></div>
  </div>
);

const LevelBadge = ({ level, animate }) => (
  <div className={`flex items-center space-x-1.5 bg-[#F5F5F4] border border-[#E7E5E4] text-[#1C1917] px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-transform ${animate ? 'scale-110 ring-2 ring-orange-400' : ''}`}>
    <Award className={`w-3.5 h-3.5 text-orange-500 ${animate ? 'animate-bounce' : ''}`} />
    <span className="font-serif">LV.{level}</span>
  </div>
);

const AnalysisCard = ({ title, score, suggestion, icon: Icon }) => (
  <div className="bg-[#1C1917] p-5 rounded-[2rem] shadow-xl shadow-black/5 mb-3 border border-[#292524] text-stone-100">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className={`p-2.5 rounded-2xl ${score < 60 ? 'bg-red-900/50 text-red-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
          <Icon size={20} />
        </div>
        <h4 className="font-bold text-base font-serif tracking-wide">{title}</h4>
      </div>
      <span className={`text-xl font-black font-serif ${score < 60 ? 'text-red-400' : 'text-emerald-400'}`}>
        {score}%
      </span>
    </div>
    <div className="w-full bg-stone-800 h-2 rounded-full mb-3 overflow-hidden">
      <div 
        className={`h-2 rounded-full ${score < 60 ? 'bg-red-500' : 'bg-emerald-500'}`} 
        style={{ width: `${score}%` }}
      ></div>
    </div>
    <p className="text-xs text-stone-400 leading-relaxed font-light">
      {suggestion}
    </p>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [view, setView] = useState('home'); 
  const [currentLevel, setCurrentLevel] = useState(1); 
  const [selectedLevel, setSelectedLevel] = useState(1); 
  const [quizLevel, setQuizLevel] = useState(1); 
  
  const [activeQuestions, setActiveQuestions] = useState([]); 
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [answers, setAnswers] = useState([]); 
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLevelUp, setIsLevelUp] = useState(false);
  
  const [activeChapter, setActiveChapter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGlossaryItem, setActiveGlossaryItem] = useState(null);

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState({ totalPlayed: 0, highestScore: 0 });

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats');
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentLevel(data.currentLevel || 1);
        setSelectedLevel(data.currentLevel || 1);
        setUserStats({
          totalPlayed: data.totalPlayed || 0,
          highestScore: data.highestScore || 0
        });
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching user data:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const saveProgress = async (newLevel, newScore) => {
    if (!user || !db) return;
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats');
    const newStats = {
      currentLevel: Math.max(newLevel, currentLevel), 
      totalPlayed: userStats.totalPlayed + 1,
      highestScore: Math.max(newScore, userStats.highestScore)
    };
    try {
      await setDoc(userDocRef, newStats, { merge: true });
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  const currentQuestion = activeQuestions[currentQuestionIndex];
  const isLastQuestion = activeQuestions.length > 0 && currentQuestionIndex === activeQuestions.length - 1;
  const PASS_THRESHOLD = 90;
  const MIN_QUESTIONS_PER_LEVEL = 10; 

  const handleStartQuiz = () => {
    let targetLevel = Math.min(selectedLevel, currentLevel);
    let newQuiz = getRandomQuestions(targetLevel);
    if (newQuiz.length < MIN_QUESTIONS_PER_LEVEL && targetLevel > 1) {
      alert(`LV.${targetLevel} 題庫建置中，暫時用 LV.1 題目練習！`);
      targetLevel = 1;
      newQuiz = getRandomQuestions(1);
    } 
    if (newQuiz.length === 0) {
       alert("題庫載入異常，請重新整理");
       return;
    }
    setQuizLevel(targetLevel); 
    setActiveQuestions(newQuiz);
    setView('quiz');
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers([]);
    setShowExplanation(false);
    setSelectedOption(null);
    setIsLevelUp(false);
  };

  const handleAnswer = (optionIndex) => {
    if (showExplanation) return;
    const correct = optionIndex === currentQuestion.correct;
    setSelectedOption(optionIndex);
    setIsCorrect(correct);
    setShowExplanation(true);
    setAnswers(prev => [...prev, { category: currentQuestion.category, correct }]);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      finishQuiz();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  };

  const finishQuiz = () => {
    const totalQuestions = activeQuestions.length;
    const correctCount = answers.filter(a => a.correct).length;
    const finalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    setScore(finalScore);
    let nextLevel = currentLevel;
    if (finalScore >= PASS_THRESHOLD && quizLevel === currentLevel) {
      nextLevel = currentLevel + 1;
      setIsLevelUp(true);
      setCurrentLevel(nextLevel);
      setSelectedLevel(nextLevel); 
    }
    saveProgress(nextLevel, finalScore);
    setView('analysis');
  };

  const getWeaknessAnalysis = () => {
    const stats = {};
    answers.forEach(a => {
      if (!stats[a.category]) stats[a.category] = { total: 0, correct: 0 };
      stats[a.category].total++;
      if (a.correct) stats[a.category].correct++;
    });
    return Object.keys(CATEGORY_CONFIG).map(key => {
      const config = CATEGORY_CONFIG[key];
      const data = stats[key];
      const percent = data ? Math.round((data.correct / data.total) * 100) : 0;
      return { 
        id: key, 
        name: config.name, 
        icon: config.icon, 
        advice: config.desc, 
        score: percent, 
        hasData: !!data 
      };
    }).filter(c => c.hasData);
  };

  const weaknessAnalysis = useMemo(() => getWeaknessAnalysis(), [answers]);
  
  const getWeakestCategory = () => {
    if (weaknessAnalysis.length === 0) return null;
    return [...weaknessAnalysis].sort((a, b) => a.score - b.score)[0];
  };

  const weakestCategory = getWeakestCategory();

  const getSummaryText = () => {
    if (score >= 90) return '太強了！你對「隱形澱粉」與「假健康食物」超敏銳，已經有易瘦大腦的雛形。';
    if (score >= 70) return '表現不錯！你有基本的營養雷達，但還是有幾個常見陷阱會中招，再練幾次就很強。';
    return '目前多半是靠感覺吃東西，很適合把 LV1 多刷幾次，把基本觀念變成直覺反應。';
  };

  const handleOpenChapter = (chapter) => {
    setActiveChapter(chapter);
    setView('learning_detail');
  };

  const handleOpenGlossaryItem = (item) => {
    setActiveGlossaryItem(item);
    setView('glossary_detail');
  };

  const filteredGlossaryItems = GLOSSARY_ITEMS.filter(item => 
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const glossaryByCategory = filteredGlossaryItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCcw className="w-10 h-10 text-green-800 animate-spin mb-4 opacity-50" />
          <p className="text-stone-500 font-bold font-serif tracking-widest text-sm">載入雲端紀錄中...</p>
        </div>
      </div>
    );
  }

  // --- Render Helpers ---
  const isQuizMode = view === 'quiz';

  return (
    <div className={`min-h-screen font-sans flex justify-center selection:bg-orange-200 selection:text-orange-900 ${isQuizMode ? 'bg-[#0F172A]' : 'bg-[#E7E5E4]'}`}>
      <div className={`w-full max-w-md min-h-screen flex flex-col relative shadow-2xl transition-colors duration-500 ${isQuizMode ? 'bg-[#0F172A]' : 'bg-[#F5F5F4]'}`}>
        
        {/* Header */}
        <header className={`px-6 py-5 flex justify-between items-center sticky top-0 z-30 backdrop-blur-md transition-all duration-300 ${isQuizMode ? 'bg-[#0F172A]/80 border-b border-white/5' : 'bg-[#F5F5F4]/80'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl shadow-sm ${isQuizMode ? 'bg-white/10' : 'bg-green-900'}`}>
              <Brain size={20} className={isQuizMode ? 'text-emerald-400' : 'text-[#F5F5F4]'} />
            </div>
            {!isQuizMode && <h1 className="font-bold text-lg tracking-tight text-[#1C1917] font-serif">Nutrition IQ</h1>}
          </div>
          <div className="flex items-center space-x-2">
            {!isQuizMode && view !== 'quiz' && (
              <button 
                onClick={() => setView('glossary_hub')}
                className="flex items-center px-3 py-1.5 bg-white border border-[#E7E5E4] rounded-full shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all group"
              >
                <Book size={14} className="text-stone-400 mr-2 group-hover:text-green-800 transition-colors" />
                <span className="text-xs font-bold text-stone-600 group-hover:text-green-900">字典</span>
              </button>
            )}
            {view === 'quiz' ? (
               <LevelBadge level={quizLevel} animate={false} />
            ) : (
               view !== 'learning_hub' && view !== 'learning_detail' && view !== 'glossary_hub' && view !== 'glossary_detail' && (
                 <LevelBadge level={currentLevel} animate={view === 'analysis' && isLevelUp} />
               )
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          
          {/* VIEW: HOME */}
          {view === 'home' && (
            <div className="p-6 flex flex-col min-h-full">
              {/* Hero Section */}
              <div className="mt-6 mb-10">
                <h2 className="text-[2.75rem] font-black text-[#1C1917] mb-4 leading-[0.95] tracking-tighter font-serif">
                  Eat Smart,<br/>
                  <span className="text-green-800 italic">Live Better.</span>
                </h2>
                <p className="text-stone-500 text-sm leading-relaxed font-medium max-w-[80%]">
                  飲食不是靠感覺，是靠「能力」。<br/>透過測驗與學習，打造你的易瘦大腦。
                </p>
                
                {/* Stats */}
                <div className="flex mt-8 space-x-4">
                  <div className="flex-1 bg-white p-4 rounded-[2rem] shadow-sm border border-[#E7E5E4] flex flex-col items-center justify-center">
                    <Trophy className="w-5 h-5 mb-2 text-orange-500" />
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">最高分</span>
                    <span className="text-xl font-black text-stone-800 font-serif">{userStats.highestScore}</span>
                  </div>
                  <div className="flex-1 bg-white p-4 rounded-[2rem] shadow-sm border border-[#E7E5E4] flex flex-col items-center justify-center">
                    <Activity className="w-5 h-5 mb-2 text-green-700" />
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">練習</span>
                    <span className="text-xl font-black text-stone-800 font-serif">{userStats.totalPlayed}</span>
                  </div>
                </div>
              </div>

              {/* Level Tabs */}
              <div className="mb-6 flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
                {[1, 2, 3].map((lv) => {
                  const unlocked = lv <= currentLevel;
                  const isActive = lv === selectedLevel;
                  return (
                    <button
                      key={lv}
                      onClick={() => unlocked && setSelectedLevel(lv)}
                      disabled={!unlocked}
                      className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                        unlocked 
                          ? isActive 
                            ? 'bg-[#1C1917] text-[#F5F5F4] shadow-lg shadow-black/20 transform scale-105' 
                            : 'bg-white text-stone-400 hover:text-stone-600 shadow-sm'
                          : 'bg-[#E7E5E4] text-stone-300 cursor-not-allowed'
                      }`}
                    >
                      {unlocked ? `LV.${lv}` : `LV.${lv} 🔒`}
                    </button>
                  );
                })}
              </div>

              {/* Main Actions Grid */}
              <div className="grid grid-cols-2 gap-4 pb-8">
                {/* Quiz Button (Big) */}
                <button 
                  onClick={handleStartQuiz}
                  className="col-span-2 bg-green-900 text-[#F5F5F4] p-6 rounded-[2.5rem] shadow-xl shadow-green-900/20 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Zap size={120} />
                  </div>
                  <div className="relative z-10 flex flex-col items-start h-full justify-between">
                    <div className="bg-white/10 p-3 rounded-2xl mb-4 backdrop-blur-sm">
                      <Play className="text-emerald-300 w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-200/80 font-bold uppercase tracking-wider mb-1">
                        Start Quiz • LV.{selectedLevel}
                      </div>
                      <div className="text-2xl font-bold font-serif">開始能力測驗</div>
                    </div>
                  </div>
                </button>

                {/* Learning Button */}
                <button 
                  onClick={() => setView('learning_hub')}
                  className="bg-white text-[#1C1917] p-5 rounded-[2rem] shadow-lg shadow-stone-200/50 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex flex-col justify-between h-40 group"
                >
                  <div className="bg-[#F5F5F4] p-3 rounded-2xl w-fit group-hover:bg-green-50 transition-colors">
                    <GraduationCap className="text-stone-600 w-6 h-6 group-hover:text-green-700 transition-colors" />
                  </div>
                  <div>
                    <div className="text-lg font-bold font-serif leading-tight">知識<br/>圖書館</div>
                  </div>
                </button>

                {/* Glossary Button */}
                <button 
                  onClick={() => setView('glossary_hub')}
                  className="bg-[#D66D29] text-white p-5 rounded-[2rem] shadow-lg shadow-orange-500/20 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex flex-col justify-between h-40 group relative overflow-hidden"
                >
                  <div className="absolute -bottom-4 -right-4 text-white/10 rotate-12">
                    <Book size={80} />
                  </div>
                  <div className="bg-white/20 p-3 rounded-2xl w-fit backdrop-blur-sm">
                    <Search className="text-white w-6 h-6" />
                  </div>
                  <div className="relative z-10">
                    <div className="text-lg font-bold font-serif leading-tight">名詞<br/>小字典</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* VIEW: LEARNING HUB */}
          {view === 'learning_hub' && (
            <div className="p-6">
              <div className="flex items-center mb-8">
                <button 
                  onClick={() => setView('home')} 
                  className="mr-4 p-3 bg-white shadow-sm rounded-full hover:bg-stone-100 text-stone-600 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-2xl font-black text-[#1C1917] font-serif">知識圖書館</h2>
              </div>

              <div className="space-y-5 pb-10">
                {KNOWLEDGE_LIBRARY.map((chapter, idx) => {
                  const config = CATEGORY_CONFIG[chapter.categoryKey] || { name: chapter.categoryKey, icon: Book, desc: '' };
                  const Icon = config.icon;
                  return (
                    <button 
                      key={chapter.id}
                      onClick={() => handleOpenChapter(chapter)}
                      className="w-full bg-white p-6 rounded-[2rem] shadow-lg shadow-stone-200/50 hover:shadow-xl transition-all text-left group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#F5F5F4] rounded-bl-[2rem] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                      <Icon className="absolute top-4 right-4 w-10 h-10 text-stone-300 group-hover:text-green-700 transition-colors z-10" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center space-x-2 mb-3">
                           <span className="bg-[#1C1917] text-white text-[10px] font-bold px-2 py-1 rounded-md">LV.{chapter.level}</span>
                           <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{config.name}</span>
                        </div>
                        <h3 className="font-bold text-xl text-[#1C1917] leading-tight mb-2 font-serif pr-12">{chapter.title}</h3>
                        <p className="text-sm font-medium text-stone-500 mb-4 line-clamp-2">
                          {chapter.subtitle}
                        </p>
                        <div className="flex items-center text-xs text-green-700 font-bold bg-green-50 w-fit px-3 py-1.5 rounded-full">
                          <Clock size={12} className="mr-1.5" />
                          {chapter.estimatedReadingMinutes} min read
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: LEARNING DETAIL */}
          {view === 'learning_detail' && activeChapter && (
            <div className="min-h-full bg-white">
              <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 border-b border-[#F5F5F4] px-6 py-4 flex items-center justify-between">
                <button 
                  onClick={() => setView('learning_hub')} 
                  className="p-2 -ml-2 hover:bg-stone-50 rounded-full text-stone-500 transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">Article</div>
                <div className="w-8"></div>
              </div>

              <div className="p-6 pb-24 max-w-xl mx-auto">
                <div className="mb-8">
                  <span className="text-green-700 font-bold text-xs tracking-wider mb-2 block uppercase">{CATEGORY_CONFIG[activeChapter.categoryKey]?.name}</span>
                  <h1 className="text-3xl font-black text-[#1C1917] font-serif leading-tight mb-4">{activeChapter.title}</h1>
                  <p className="text-lg text-stone-500 leading-relaxed font-medium">{activeChapter.summary}</p>
                </div>

                <div className="space-y-10">
                  <section>
                    <h3 className="flex items-center text-lg font-bold text-[#1C1917] mb-4 border-l-4 border-green-600 pl-3">
                      重點觀念
                    </h3>
                    <div className="space-y-4">
                      {activeChapter.keyPoints.map((point, idx) => (
                        <div key={idx} className="bg-[#F5F5F4] p-5 rounded-2xl text-stone-700 text-sm leading-relaxed font-medium">
                          {point}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="flex items-center text-lg font-bold text-[#1C1917] mb-4 border-l-4 border-orange-500 pl-3">
                      常見誤區
                    </h3>
                    <div className="space-y-3">
                      {activeChapter.commonMistakes.map((mistake, idx) => (
                        <div key={idx} className="flex gap-4 items-start">
                          <div className="mt-1 bg-red-100 p-1 rounded-full text-red-500 flex-shrink-0">
                            <XCircle size={16} />
                          </div>
                          <p className="text-stone-600 text-sm leading-relaxed border-b border-[#F5F5F4] pb-3 w-full">{mistake}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="bg-stone-900 rounded-[2rem] p-8 text-stone-200 shadow-2xl shadow-stone-900/20">
                    <h3 className="flex items-center text-lg font-bold text-white mb-6">
                      <Star className="w-5 h-5 mr-2 text-yellow-400 fill-current" />
                      今日小任務
                    </h3>
                    <ul className="space-y-6">
                      {activeChapter.tinyActions.map((action, idx) => (
                        <li key={idx} className="flex gap-4">
                           <span className="flex-shrink-0 w-6 h-6 rounded-full border border-stone-600 flex items-center justify-center text-xs font-mono text-stone-400">{idx + 1}</span>
                           <p className="text-sm leading-relaxed">{action}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: GLOSSARY HUB */}
          {view === 'glossary_hub' && (
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => setView('home')} 
                  className="p-3 bg-white shadow-sm rounded-full hover:bg-stone-100 text-stone-600 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">DICTIONARY</span>
                <div className="w-10"></div>
              </div>

              <h2 className="text-3xl font-black text-[#1C1917] font-serif mb-6">營養名詞<br/>小字典</h2>

              <div className="relative mb-8 group z-20">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-stone-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="搜尋..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-5 pl-14 pr-6 rounded-[2rem] bg-white shadow-xl shadow-stone-200/50 border-none text-stone-800 placeholder:text-stone-300 focus:ring-4 focus:ring-orange-100 transition-all text-lg font-medium"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-10 pb-12 -mx-6 px-6 no-scrollbar">
                {Object.keys(glossaryByCategory).length > 0 ? (
                  Object.keys(glossaryByCategory).map((category) => (
                    <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="sticky top-0 bg-[#F5F5F4]/95 backdrop-blur-sm py-2 mb-2 z-10 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                        <h3 className="font-bold text-stone-800 text-sm uppercase tracking-widest">
                          {category}
                        </h3>
                      </div>
                      <div className="grid gap-3">
                        {glossaryByCategory[category].map((item, idx) => (
                          <button 
                            key={idx}
                            onClick={() => handleOpenGlossaryItem(item)}
                            className="bg-white p-5 rounded-[1.5rem] shadow-sm text-left hover:shadow-lg transition-all group w-full"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-[#1C1917] text-lg group-hover:text-orange-600 transition-colors font-serif">
                                {item.term}
                              </span>
                              <ChevronRight size={16} className="text-stone-300 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">{item.english}</p>
                            <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed">
                              {item.oneLine}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 opacity-30">
                    <Book size={64} className="mx-auto mb-4" />
                    <p>沒有找到相關結果</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: GLOSSARY DETAIL */}
          {view === 'glossary_detail' && activeGlossaryItem && (
            <div className="min-h-full bg-[#1C1917] text-[#F5F5F4]">
              <div className="sticky top-0 bg-[#1C1917]/80 backdrop-blur-md z-20 px-6 py-4 flex items-center">
                <button 
                  onClick={() => setView('glossary_hub')} 
                  className="mr-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"
                >
                  <ChevronLeft size={20} className="text-white" />
                </button>
                <div className="text-xs font-bold text-stone-500 uppercase tracking-widest">Detail</div>
              </div>

              <div className="p-8 pb-20">
                <div className="mb-10 text-center">
                  <span className="inline-block border border-stone-700 text-stone-400 text-[10px] font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-wider">
                    {activeGlossaryItem.category}
                  </span>
                  <h2 className="text-4xl font-black text-white mb-2 font-serif tracking-tight">{activeGlossaryItem.term}</h2>
                  <p className="text-orange-500 font-bold text-sm uppercase tracking-widest">{activeGlossaryItem.english}</p>
                </div>

                <div className="bg-stone-800/50 p-6 rounded-[2rem] mb-8 border border-stone-700/50">
                  <p className="text-lg leading-relaxed font-medium text-stone-200 text-center">
                    "{activeGlossaryItem.oneLine}"
                  </p>
                </div>

                <div className="space-y-8">
                  <div>
                    <h4 className="flex items-center text-stone-500 font-bold text-xs uppercase tracking-widest mb-4">
                      <Info size={14} className="mr-2" />
                      為什麼重要
                    </h4>
                    <p className="text-stone-300 leading-relaxed border-l-2 border-green-700 pl-4">
                      {activeGlossaryItem.whyItMatters}
                    </p>
                  </div>

                  {activeGlossaryItem.typicalSources && (
                    <div>
                      <h4 className="flex items-center text-stone-500 font-bold text-xs uppercase tracking-widest mb-4">
                        <ShoppingBag size={14} className="mr-2" />
                        常見來源
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {activeGlossaryItem.typicalSources.split('、').map((source, i) => (
                          <span key={i} className="bg-stone-800 px-3 py-1.5 rounded-lg text-sm text-stone-300">
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeGlossaryItem.onLabel && (
                    <div>
                      <h4 className="flex items-center text-stone-500 font-bold text-xs uppercase tracking-widest mb-4">
                        <Tag size={14} className="mr-2" />
                        包裝標示
                      </h4>
                      <div className="bg-white/5 p-4 rounded-xl font-mono text-sm text-green-400">
                        {activeGlossaryItem.onLabel}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: QUIZ (Immersive Dark Mode) */}
          {view === 'quiz' && currentQuestion && (
            <div className="p-6 flex flex-col h-full bg-[#0F172A] text-white">
              {/* Progress */}
              <div className="mb-8 pt-2">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-4xl font-black text-white/20 font-serif">
                    {String(currentQuestionIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">
                    of {activeQuestions.length} Questions
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(52,211,153,0.8)]" 
                    style={{ width: `${((currentQuestionIndex + 1) / activeQuestions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Question Card */}
              <div className="flex-1 flex flex-col justify-center mb-8 relative z-10">
                <div className="inline-flex self-start items-center bg-white/10 px-3 py-1 rounded-full mb-6 backdrop-blur-md">
                  <span className={`w-2 h-2 rounded-full mr-2 ${currentQuestion.type === 'boolean' ? 'bg-blue-400' : 'bg-emerald-400'}`}></span>
                  <span className="text-[10px] font-bold text-white tracking-widest uppercase">
                    {currentQuestion.type === 'boolean' ? 'True / False' : 'Multiple Choice'}
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold leading-snug font-serif tracking-wide text-white">
                  {currentQuestion.question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3 relative z-20 pb-6">
                <div className={currentQuestion.type === 'boolean' ? "grid grid-cols-2 gap-4" : "space-y-3"}>
                  {currentQuestion.options.map((option, idx) => {
                    let btnClass = "relative overflow-hidden p-5 rounded-2xl border-2 text-left transition-all duration-200 font-medium flex items-center group ";
                    if (currentQuestion.type === 'boolean') {
                        btnClass += "h-32 justify-center text-center text-xl flex-col ";
                    } else {
                        btnClass += "w-full justify-between ";
                    }

                    if (showExplanation) {
                      if (idx === currentQuestion.correct) btnClass += "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.3)]";
                      else if (idx === selectedOption) btnClass += "bg-red-500/20 border-red-500 text-red-300";
                      else btnClass += "border-white/5 text-white/30";
                    } else {
                      btnClass += "border-white/10 bg-white/5 text-stone-200 hover:bg-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-95";
                    }

                    return (
                      <button key={idx} onClick={() => handleAnswer(idx)} disabled={showExplanation} className={btnClass}>
                        <span className="relative z-10">{option}</span>
                        {showExplanation && idx === currentQuestion.correct && <CheckCircle2 className="text-emerald-400 ml-3 relative z-10" />}
                        {showExplanation && idx === selectedOption && idx !== currentQuestion.correct && <XCircle className="text-red-400 ml-3 relative z-10" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Feedback Overlay - Bottom Sheet Style */}
              {showExplanation && (
                <div className="fixed inset-x-0 bottom-0 p-6 bg-white rounded-t-[2.5rem] z-50 animate-in slide-in-from-bottom duration-500 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-w-md mx-auto">
                  <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mb-6"></div>
                  <div className={`flex items-center mb-4 ${isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isCorrect ? <CheckCircle2 size={24} className="mr-3" /> : <AlertTriangle size={24} className="mr-3" />}
                    <span className="font-bold text-lg font-serif">{isCorrect ? 'Correct!' : 'Incorrect'}</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed mb-8 font-medium">
                    {currentQuestion.explanation}
                  </p>
                  <button 
                    onClick={handleNext} 
                    className="w-full bg-[#1C1917] text-white py-4 rounded-2xl font-bold text-lg hover:bg-black transition-all active:scale-95 shadow-xl"
                  >
                    {isLastQuestion ? '查看成績' : '下一題'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW: ANALYSIS */}
          {view === 'analysis' && (
            <div className="p-6 bg-[#1C1917] min-h-full text-white">
              
              <div className="mt-8 mb-12 text-center relative">
                {isLevelUp && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full animate-bounce">
                    LEVEL UP!
                  </div>
                )}
                <div className="relative inline-flex justify-center items-center w-48 h-48">
                   {/* Decorative Circles */}
                   <div className="absolute inset-0 border-[1rem] border-white/5 rounded-full"></div>
                   <div className="absolute inset-0 border-[1rem] border-emerald-500 rounded-full transition-all duration-1000 ease-out" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${score}%, 0 ${score}%)` }}></div> {/* Simple CSS hack, ideally use SVG */}
                   
                   <div className="flex flex-col items-center">
                     <span className="text-7xl font-black font-serif tracking-tighter bg-gradient-to-br from-white to-stone-400 bg-clip-text text-transparent">
                       {score}
                     </span>
                     <span className="text-stone-500 text-sm font-bold uppercase tracking-widest mt-1">Score</span>
                   </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md mb-6 border border-white/5">
                 <h4 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center">
                   <Brain size={14} className="mr-2" />
                   AI Feedback
                 </h4>
                 <p className="text-stone-200 leading-relaxed font-medium">
                   {getSummaryText()}
                 </p>
              </div>

              {/* Action Buttons Fixed Bottom */}
              <div className="fixed bottom-8 left-6 right-6 flex gap-4 max-w-md mx-auto">
                 <button 
                  onClick={handleStartQuiz} 
                  className="flex-1 bg-white text-[#1C1917] py-4 rounded-2xl font-bold shadow-xl hover:bg-stone-200 transition-all flex items-center justify-center"
                 >
                  <RefreshCcw className="mr-2 w-5 h-5" />
                  Retry
                </button>
                <button 
                  onClick={() => setView('home')} 
                  className="flex-1 bg-stone-800 text-stone-300 py-4 rounded-2xl font-bold hover:bg-stone-700 transition-all"
                >
                  Home
                </button>
              </div>

              {/* Weakness Grid */}
              <div className="pb-32">
                <h3 className="font-bold text-stone-500 text-xs uppercase tracking-widest mb-4 px-1">
                  Performance Breakdown
                </h3>
                <div className="grid gap-3">
                  {weaknessAnalysis.map((stat, idx) => (
                    <AnalysisCard key={idx} title={stat.name} score={stat.score} suggestion={stat.advice} icon={stat.icon} />
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}