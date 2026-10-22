#!/usr/bin/env node
/* 純邏輯測試：拼音／注音轉換、句子零件、穿衣規則、每一種題目都有解
   用法：node tests/logic_test.js            （在專案資料夾）  結束碼 0＝全部通過 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const grabScript = id => { const m = new RegExp('<script id="' + id + '">([\\s\\S]*?)</script>').exec(html); if(!m) throw new Error('找不到 script ' + id); return m[1]; };
const logic = grabScript('logic');
const uiSrc = grabScript('ui');
const uiDict = uiSrc.slice(uiSrc.indexOf('const UI = '), uiSrc.indexOf('const FMT_LABEL'));
const ctx = {};
vm.createContext(ctx);
const API = vm.runInContext(logic + '\n' + uiDict + '\n;({pyMarked,pyToZy,S2,S2_FROM,S2_TO,ITEMS,BY_SLOT,SLOTS,MSG,OKMSG,FRIEND_NAMES,FORMATS,BASE_TYPES,SWING_TYPES,genScenario,say,check,analyze,allSolutions,solve,numParts,UI,feelKey,PERIOD,AIR})', ctx);
let fails = 0, passes = 0;
const failKinds = {};
const ok = (cond, msg) => { if(cond) passes++; else { fails++; const k = msg.replace(/[：:（(].*$/, '').slice(0, 40); failKinds[k] = (failKinds[k] || 0) + 1; if(failKinds[k] <= 3) console.log('✗ ' + msg); } };
const eq = (a, b, msg) => ok(a === b, msg + '：得到 ' + a + '，應為 ' + b);

/* 1. 拼音 → 注音／聲調符號 已知答案 */
const ZY = {
  'qing2':'ㄑㄧㄥˊ','tian1':'ㄊㄧㄢ','xia4':'ㄒㄧㄚˋ','yu3':'ㄩˇ','shi4':'ㄕˋ','zi5':'˙ㄗ','lv4':'ㄌㄩˋ','jing4':'ㄐㄧㄥˋ','xie2':'ㄒㄧㄝˊ','xiu4':'ㄒㄧㄡˋ',
  'san3':'ㄙㄢˇ','shuang3':'ㄕㄨㄤˇ','huo2':'ㄏㄨㄛˊ','kou3':'ㄎㄡˇ','zhao4':'ㄓㄠˋ','wen1':'ㄨㄣ','chuan1':'ㄔㄨㄢ','jin1':'ㄐㄧㄣ','ji4':'ㄐㄧˋ','qun2':'ㄑㄩㄣˊ',
  'xin1':'ㄒㄧㄣ','zhi1':'ㄓ','ru3':'ㄖㄨˇ','ca1':'ㄘㄚ','huai4':'ㄏㄨㄞˋ','diao4':'ㄉㄧㄠˋ','ri4':'ㄖˋ','pin3':'ㄆㄧㄣˇ','zhi2':'ㄓˊ','ju4':'ㄐㄩˋ','ye3':'ㄧㄝˇ','bu2':'ㄅㄨˊ',
  'tai4':'ㄊㄞˋ','lai2':'ㄌㄞˊ','le5':'˙ㄌㄜ','de5':'˙ㄉㄜ','zao3':'ㄗㄠˇ','shang4':'ㄕㄤˋ','wu3':'ㄨˇ','wan3':'ㄨㄢˇ','yi1':'ㄧ','yin1':'ㄧㄣ','ying2':'ㄧㄥˊ','you3':'ㄧㄡˇ',
  'yue4':'ㄩㄝˋ','yuan2':'ㄩㄢˊ','yun2':'ㄩㄣˊ','yong4':'ㄩㄥˋ','yao4':'ㄧㄠˋ','yang2':'ㄧㄤˊ','yan3':'ㄧㄢˇ','wai4':'ㄨㄞˋ','wei2':'ㄨㄟˊ','weng1':'ㄨㄥ','wo3':'ㄨㄛˇ',
  'zhong1':'ㄓㄨㄥ','zhu4':'ㄓㄨˋ','shou3':'ㄕㄡˇ','hou4':'ㄏㄡˋ','jiu3':'ㄐㄧㄡˇ','liu4':'ㄌㄧㄡˋ','dui4':'ㄉㄨㄟˋ','gui4':'ㄍㄨㄟˋ','tuo1':'ㄊㄨㄛ','qiu2':'ㄑㄧㄡˊ',
  'xian4':'ㄒㄧㄢˋ','xue2':'ㄒㄩㄝˊ','quan2':'ㄑㄩㄢˊ','jun1':'ㄐㄩㄣ','xu1':'ㄒㄩ','er4':'ㄦˋ','a1':'ㄚ','o1':'ㄛ','e4':'ㄜˋ','ai4':'ㄞˋ','ou3':'ㄡˇ','en1':'ㄣ','ang1':'ㄤ',
  'zhuang1':'ㄓㄨㄤ','chong2':'ㄔㄨㄥˊ','si4':'ㄙˋ','ci2':'ㄘˊ','chi1':'ㄔ','nuan3':'ㄋㄨㄢˇ','nv3':'ㄋㄩˇ','lve4':'ㄌㄩㄝˋ'
};
Object.keys(ZY).forEach(k => eq(API.pyToZy(k), ZY[k], '注音 ' + k));
const MARK = {'qing2':'qíng','tian1':'tiān','xiu4':'xiù','lv4':'lǜ','shuang3':'shuǎng','zi5':'zi','hou4':'hòu','jiu3':'jiǔ','dui4':'duì','wai4':'wài','yu3':'yǔ','xie2':'xié','nuan3':'nuǎn','huo2':'huó','liang2':'liáng','mao2':'máo','kou3':'kǒu'};
Object.keys(MARK).forEach(k => eq(API.pyMarked(k), MARK[k], '拼音符號 ' + k));
ok(API.S2_FROM.length === API.S2_TO.length, '簡繁對照表長度要一樣');
eq(Array.from(API.S2_FROM).length, Array.from(API.S2_TO).length, '簡繁對照表（字數）');

/* 2. 數字 */
const num = n => API.numParts(n);
eq(num(10).zh, '十', '10'); eq(num(18).zh, '十八', '18'); eq(num(20).zh, '二十', '20'); eq(num(25).zh, '二十五', '25'); eq(num(31).py, 'san1 shi2 yi1', '31 拼音'); eq(num(70).zh, '七十', '70'); eq(num(7).py, 'qi1', '7');

/* 3. 衣物字詞：拼音字數＝字數、注音都能轉 */
const syls = new Set();
function checkSegs(segs, label){
  segs.forEach(s => {
    if(s.pun){ ok(s.py.length === 0, label + ' 標點不該有拼音'); return; }
    const n = Array.from(s.zh).length;
    ok(s.py.length === n, label + ' 「' + s.zh + '」字數 ' + n + ' 拼音 ' + s.py.length);
    s.py.forEach(p => { syls.add(p); ok(/^[a-z]+[1-5]$/.test(p), label + ' 拼音格式 ' + p); });
  });
}
Object.keys(API.ITEMS).forEach(k => { const it = API.ITEMS[k]; checkSegs([{zh: it.zh, py: it.py.split(' ')}], '衣物 ' + k); ok(it.es && it.en, '衣物 ' + k + ' 要有西英文'); });
const msgKeys = Object.keys(API.MSG);
msgKeys.forEach(k => { const m = API.MSG[k](); checkSegs(m.segs, '訊息 ' + k); ok(m.es.length > 3 && m.en.length > 3 && !/undefined/.test(m.es + m.en), '訊息翻譯 ' + k); });
API.OKMSG.forEach((f, i) => { const m = f(); checkSegs(m.segs, '成功訊息 ' + i); });
API.FRIEND_NAMES.forEach((n, i) => checkSegs(n.segs, '親友名 ' + i));

/* 4. 每一種題目：句子零件、有解、規則合理 */
const BIG = 1500;
const chars = new Set();
let noSol = 0, defaultOk = 0, total = 0;
const types = {1: API.BASE_TYPES.map(t => t.name), 2: API.BASE_TYPES.map(t => t.name), 3: API.SWING_TYPES.map(t => t.name)};
const seen = {};
for(let level = 1; level <= 3; level++){
  for(let i = 0; i < BIG; i++){
    for(const fmt of API.FORMATS){
      const scn = API.genScenario(level, fmt, null);
      seen[level + ':' + scn.type] = 1;
      const ph = API.say(scn);
      total++;
      const label = 'L' + level + ' ' + fmt + ' ' + scn.type;
      checkSegs(ph.segs, label);
      const zh = ph.segs.map(s => s.zh).join('');
      Array.from(zh).forEach(c => chars.add(c));
      ok(ph.es.length > 5 && ph.en.length > 5, label + ' 翻譯太短');
      ok(!/undefined|NaN|\[object/.test(zh + ph.es + ph.en), label + ' 內容有 undefined');
      ok(!/\s{2,}| ,| \.| !| \?/.test(ph.es + ' ' + ph.en), label + ' 翻譯空白／標點怪怪的：' + ph.es + ' | ' + ph.en);
      const a = API.analyze(scn);
      if(a.rain) ok(/雨|颱/.test(zh), label + ' 有雨的題目句子沒提到雨：' + zh);
      if(a.typhoon) ok(/颱/.test(zh), label + ' 颱風題沒提到颱風：' + zh);
      if(a.air) ok(/空氣/.test(zh), label + ' 空氣題沒提到空氣：' + zh);
      if(level >= 2) scn.periods.forEach(p => ok(zh.includes(API.numParts(p.t).zh + '度') || (level === 2 && fmt === 'push' && !/度/.test(zh)) || (level === 3 && fmt === 'push' && !/度/.test(zh)), label + ' 沒念出溫度 ' + p.t + '：' + zh));
      if(level === 1) ok(!/\d|度/.test(zh), label + ' 第一關不該有數字：' + zh);
      const sols = API.allSolutions(scn);
      if(!sols.length){ noSol++; if(noSol < 6) console.log('  無解：', JSON.stringify(scn)); }
      if(API.check({top:'tee', outer:null, bottom:'pants', shoes:'sneakers', acc:[]}, scn).length === 0) defaultOk++;
      if(i === 0 && fmt === 'news'){ console.log('  範例 L' + level + ' ' + scn.type + '：' + zh + '\n     ES: ' + ph.es + '\n     EN: ' + ph.en); }
    }
  }
}
ok(noSol === 0, '有 ' + noSol + ' 題沒有任何正確穿法');
console.log('題目數 ' + total + '，其中「短袖＋長褲＋球鞋」也算對的：' + defaultOk + '（' + (100 * defaultOk / total).toFixed(1) + '%）');
ok(defaultOk / total < 0.35, '預設穿法太常對（' + (100 * defaultOk / total).toFixed(1) + '%），題目沒有鑑別度');
Object.keys(types).forEach(l => types[l].forEach(t => ok(seen[l + ':' + t], '第 ' + l + ' 關沒出現過題型 ' + t)));

/* 5. 規則手動驗證（確定的答案）*/
const S = (t, sky, extra) => Object.assign({level: 1, day: 'today', fmt: 'news', type: 'x', periods: [{when: null, t, sky, prob: sky === 'rainy' ? 80 : 10, air: false}]}, extra || {});
const O = (top, outer, bottom, shoes, acc) => ({top, outer, bottom, shoes, acc: acc || []});
const has = (P, c) => P.includes(c);
ok(check_ok(O('tee', null, 'shorts', 'sneakers', ['hat']), S(32, 'sunny')), '大熱天：短袖短褲球鞋＋帽子應該對');
ok(has(API.check(O('tee', null, 'shorts', 'sneakers', []), S(32, 'sunny')), 'sun'), '大太陽沒防曬要被提醒');
ok(has(API.check(O('long', 'jacket', 'pants', 'sneakers', []), S(32, 'sunny')), 'hot'), '大熱天穿外套要說太熱');
ok(has(API.check(O('tee', null, 'shorts', 'sneakers', []), S(8, 'sunny')), 'cold'), '8 度穿短袖要說太冷');
ok(check_ok(O('long', 'coat', 'pants', 'sneakers', ['scarf']), S(8, 'sunny')), '8 度：長袖＋厚外套＋長褲＋圍巾應該對');
ok(has(API.check(O('long', 'coat', 'pants', 'sneakers', []), S(8, 'sunny')), 'needScarf'), '8 度要圍巾或手套');
ok(has(API.check(O('tee', null, 'shorts', 'sneakers', []), S(20, 'rainy')), 'needRain'), '下雨要傘或雨衣');
ok(has(API.check(O('long', null, 'pants', 'sandals', ['umbrella']), S(20, 'rainy')), 'feetWet'), '下雨穿涼鞋要被提醒');
ok(check_ok(O('long', null, 'pants', 'boots', ['umbrella']), S(19, 'rainy')), '下雨 19 度：長袖長褲雨鞋雨傘應該對');
ok(has(API.check(O('tee', 'raincoat', 'shorts', 'boots', ['umbrella']), S(27, 'typhoon')), 'typhoonUmb'), '颱風不能撐傘');
ok(check_ok(O('tee', 'raincoat', 'shorts', 'boots', []), S(27, 'typhoon')), '颱風：雨衣＋雨鞋應該對');
ok(has(API.check(O('tee', null, 'shorts', 'sneakers', []), S(24, 'overcast', {periods: [{when: null, t: 24, sky: 'overcast', prob: 20, air: true}]})), 'air'), '空氣不好要口罩');
ok(has(API.check(O('tee', null, 'pants', 'sandals', []), S(12, 'cloudy')), 'feetCold'), '12 度穿涼鞋腳會冷');
ok(has(API.check(O('tee', 'coat', 'pants', 'sneakers', []), S(18, 'cloudy')), 'tooThick'), '18 度不用厚外套');
ok(has(API.check(O(null, null, 'pants', 'sneakers', []), S(18, 'cloudy')), 'incomplete'), '沒選上衣要說還沒穿好');
const swing = {level: 3, day: 'today', fmt: 'news', type: 'coldToHot', periods: [{when: 'morning', t: 12, sky: 'sunny', prob: 10, air: false}, {when: 'afternoon', t: 29, sky: 'sunny', prob: 10, air: false}]};
ok(check_ok(O('tee', 'jacket', 'pants', 'sneakers', ['hat']), swing), '早 12 度午 29 度：短袖＋外套＋長褲＋帽子應該對');
ok(has(API.check(O('tee', null, 'pants', 'sneakers', ['hat']), swing), 'cold'), '早上冷、沒外套要說冷');
function check_ok(o, s){ const P = API.check(o, s); if(P.length) console.log('    （問題：' + P.join(',') + '）'); return P.length === 0; }

/* 6. 用到的字：列出所有不同的字，方便檢查簡體對照表有沒有漏 */
const all = new Set(chars);
Object.keys(API.ITEMS).forEach(k => Array.from(API.ITEMS[k].zh).forEach(c => all.add(c)));
msgKeys.forEach(k => API.MSG[k]().segs.forEach(s => Array.from(s.zh).forEach(c => all.add(c))));
API.OKMSG.forEach(f => f().segs.forEach(s => Array.from(s.zh).forEach(c => all.add(c))));
Object.keys(API.UI).forEach(k => Array.from(API.UI[k][0]).forEach(c => all.add(c)));
const cjk = Array.from(all).filter(c => /[一-鿿]/.test(c)).sort();
const noMap = cjk.filter(c => !API.S2[c]);
console.log('用到的中文字共 ' + cjk.length + ' 個。沒有簡體對照（代表簡繁同形）的字：\n' + noMap.join(''));
console.log('有對照的：' + cjk.filter(c => API.S2[c]).map(c => c + '→' + API.S2[c]).join(' '));

Object.keys(failKinds).forEach(k => failKinds[k] > 3 && console.log('  （「' + k + '」類共 ' + failKinds[k] + ' 筆）'));
console.log('\n' + (fails ? '失敗 ' + fails + ' 項' : '全部通過') + '（通過 ' + passes + ' 項）');
process.exit(fails ? 1 : 0);
