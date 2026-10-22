#!/usr/bin/env python3
"""瀏覽器測試（Playwright + Chromium）：file://、擋外部網路、假 speechSynthesis。
用法：PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/browser_test.py [截圖資料夾]
會跑完整三關、換各種設定、檢查有沒有 console 錯誤，並存截圖。"""
import os, sys, json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'tests' / 'shots'
OUT.mkdir(parents=True, exist_ok=True)
URL = (ROOT / 'index.html').as_uri()

FAKE_SPEECH = """
(() => {
  window.__spoken = [];
  const voices = [{lang:'zh-TW', name:'Fake Mei-Jia', default:true}];
  const synth = { getVoices: () => voices, speak: u => window.__spoken.push(u.text), cancel(){}, addEventListener(){}, speaking:false };
  Object.defineProperty(window, 'speechSynthesis', {value: synth, configurable:true});
  window.SpeechSynthesisUtterance = function(t){ this.text = t; };
})();
"""
errors = []
fails = []
def check(cond, msg):
    if not cond:
        fails.append(msg); print('✗', msg)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='zh-TW')
    ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file://') else r.abort())
    ctx.add_init_script(FAKE_SPEECH)
    pg = ctx.new_page()
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'ERR_FAILED' not in m.text and 'Failed to load resource' not in m.text else None)
    pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    pg.goto(URL)
    pg.wait_for_selector('#bStart')
    pg.screenshot(path=str(OUT / '01_start.png'), full_page=True)

    # ---- 衣櫃圖示總覽：每個分頁截一張 ----
    pg.click('#bStart')
    pg.wait_for_selector('#grid .item')
    pg.wait_for_timeout(500)
    for slot in ['top', 'outer', 'bottom', 'shoes', 'acc']:
        pg.click(f'[data-tab="{slot}"]')
        pg.locator('#grid').screenshot(path=str(OUT / f'02_grid_{slot}.png'))
    check(len(pg.evaluate('window.__spoken')) >= 1, '第一題開始後應該自動念一次')

    # ---- 角色穿各種衣服的外觀 ----
    def dress(items):
        for it in items:
            slot = pg.evaluate(f'__WO.ITEMS["{it}"].slot')
            pg.click(f'[data-tab="{slot}"]'); pg.click(f'#grid [data-id="{it}"]')
    pg.screenshot(path=str(OUT / '03_play_empty.png'), full_page=True)
    dress(['long', 'coat', 'pants', 'boots', 'scarf', 'gloves', 'hat', 'mask'])
    pg.locator('#stage').screenshot(path=str(OUT / '04_outfit_winter.png'))
    for it in ['long', 'coat', 'pants', 'boots', 'scarf', 'gloves', 'hat', 'mask']:
        dress([it]) if it in ('long', 'coat', 'pants', 'boots') else None
    # 清掉重穿夏天
    pg.evaluate('(()=>{const G=__WO.G;G.outfit={top:null,outer:null,bottom:null,shoes:null,acc:[]};})()')
    pg.evaluate('document.getElementById("stage").innerHTML=""')
    pg.click('[data-tab="top"]')
    dress(['tank', 'skirt', 'sandals', 'shades', 'sunscreen'])
    pg.locator('#stage').screenshot(path=str(OUT / '05_outfit_summer_girlish.png'))
    pg.evaluate('(()=>{const G=__WO.G;G.outfit={top:"tee",outer:"raincoat",bottom:"shorts",shoes:"boots",acc:["umbrella"]};})()')
    pg.click('[data-tab="acc"]'); pg.click('#grid [data-id="umbrella"]'); pg.click('#grid [data-id="umbrella"]')  # 重畫
    pg.locator('#stage').screenshot(path=str(OUT / '06_outfit_rain.png'))
    pg.evaluate('document.getElementById("bHome").click()')

    # ---- 完整玩三關：每關 10 題，混合答對／答錯一次／答錯兩次 ----
    def play_level(level):
        pg.wait_for_selector('#bStart')
        pg.click(f'[data-lv="{level}"]')
        pg.fill('#inName', 'Ben<b>')
        pg.click('#bStart')
        for r in range(1, 11):
            pg.wait_for_selector('#bGo', timeout=5000)
            scn = pg.evaluate('__WO.G.scn')
            want = pg.evaluate('__WO.G.phrase.segs.map(s=>s.zh).join("")')
            try:
                pg.wait_for_function('(w) => window.__spoken.includes(w)', arg=want, timeout=3000)
            except Exception:
                check(False, f'L{level} 第{r}題沒有念出「{want}」')
            sol = pg.evaluate('__WO.solve(__WO.G.scn)')
            wear = [sol['top'], sol['outer'], sol['bottom'], sol['shoes']] + sol['acc']
            wear = [w for w in wear if w]
            mode = r % 3
            if r == 1:
                pg.click('#bPeek'); pg.wait_for_selector('#say .say')
                pg.screenshot(path=str(OUT / f'10_L{level}_peek.png'), full_page=True)
            if mode == 1:      # 直接答對
                dress(wear); pg.click('#bGo')
                pg.wait_for_selector('#bNext'); check('msgbox ok' in pg.inner_html('#msg'), f'L{level} 第{r}題答對卻沒出現成功訊息')
            elif mode == 2:    # 先答錯（什麼都不選→還沒穿好；或亂穿）再答對
                pg.click('#bGo'); pg.wait_for_selector('#msg .msgbox.bad')
                if r == 2: pg.screenshot(path=str(OUT / f'11_L{level}_wrong_incomplete.png'), full_page=True)
                dress(['tank', 'shorts', 'sandals'])
                pg.click('#bGo'); pg.wait_for_selector('#msg .msgbox')
                bad = pg.evaluate('document.querySelectorAll("#msg .msgbox.bad").length')
                if bad:   # 真的錯了（多半如此），接著穿對
                    if r == 5: pg.screenshot(path=str(OUT / f'12_L{level}_wrong_try2.png'), full_page=True)
                    pg.evaluate('(()=>{const G=__WO.G;G.outfit={top:null,outer:null,bottom:null,shoes:null,acc:[]};})()')
                    dress(wear); pg.click('#bGo')
                pg.wait_for_selector('#bNext')
            else:              # 連錯兩次 → 顯示答案
                pg.click('#bGo'); pg.wait_for_selector('#msg .msgbox.bad')
                dress(['tank', 'shorts', 'sandals']); pg.click('#bGo')
                pg.wait_for_selector('#bNext')
            if r == 3: pg.screenshot(path=str(OUT / f'13_L{level}_result.png'), full_page=True)
            pg.click('#bNext')
        pg.wait_for_selector('#bAgain')
        pg.wait_for_timeout(300)
        pg.screenshot(path=str(OUT / f'14_L{level}_end.png'), full_page=True)
        note = pg.inner_text('#saveNote')
        check(note.strip() != '', f'L{level} 結束畫面沒有儲存提示')
        pg.click('#bH2')
    for lv in (1, 2, 3):
        play_level(lv)

    # ---- 設定：簡體、注音、兩種、純中文 ----
    def settings(**kw):
        pg.click('#bSet')
        for k, v in kw.items():
            pg.click(f'#sheet [data-k="{k}"][data-v="{v}"]')
        pg.click('#bClose')
    settings(script='simp', phon='zhuyin', lang='en')
    pg.screenshot(path=str(OUT / '20_start_simp_zhuyin_en.png'), full_page=True)
    pg.click('#bStart'); pg.wait_for_selector('#bGo')
    pg.click('#bPeek'); pg.wait_for_selector('#say .say')
    html = pg.inner_html('#say')
    check('ㄧ' in html or 'ㄨ' in html or 'ㄩ' in html or 'ㄚ' in html, '注音模式應該出現注音符號')
    check('颱' not in pg.inner_text('#sPlay') and '風' not in pg.inner_text('#sPlay'), '簡體模式不該出現繁體 颱／風')
    pg.screenshot(path=str(OUT / '21_play_simp_zhuyin.png'), full_page=True)
    pg.click('#bSet2'); pg.click('#sheet [data-k="phon"][data-v="both"]'); pg.click('#sheet [data-k="lang"][data-v="zh"]'); pg.click('#bClose')
    pg.screenshot(path=str(OUT / '22_play_both_zhonly.png'), full_page=True)
    stored = json.loads(pg.evaluate('localStorage.getItem("hanziGames.settings")'))
    check(stored['phon'] == 'both' and stored['lang'] == 'zh' and stored['script'] == 'simp', '設定要存進 hanziGames.settings：' + str(stored))
    zhonly = pg.inner_text('#sPlay')
    check('Escuchar' not in zhonly and 'Listen' not in zhonly and 'Salir' not in zhonly, '純中文模式不該有西英文')
    pg.click('#bSet2'); pg.click('#sheet [data-k="phon"][data-v="off"]'); pg.click('#bClose')
    check('<rt>' not in pg.inner_html('#sPlay'), '不顯示拼音時不該有 rt')
    pg.click('#bHome')
    check('firebase' not in pg.content().lower(), '頁面不該再有 Firebase')
    # 靜音鈕、版權
    check(pg.locator('#hgMute').count() == 1 and pg.locator('#hgCopy').count() == 1, '要有靜音鈕和版權行')
    check(pg.locator('#bBoard').count() == 0, '不該有排行榜按鈕')
    # 桌機寬度
    pg.set_viewport_size({'width': 1100, 'height': 800})
    pg.click('#bStart'); pg.wait_for_selector('#bGo')
    pg.screenshot(path=str(OUT / '30_desktop_play.png'), full_page=True)
    b.close()

print('console/page 錯誤：', errors if errors else '無')
check(not errors, 'console 有錯誤：' + str(errors[:3]))
print('截圖在', OUT)
print('全部通過' if not fails else f'失敗 {len(fails)} 項')
sys.exit(1 if fails else 0)
