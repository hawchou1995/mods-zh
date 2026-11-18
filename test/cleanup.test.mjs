/* cleanup.test.mjs —— 广告净化 / 反拦截检测兼容（jsdom，真实 DOM + 真实 MutationObserver）
 *
 * 覆盖：
 *   · Nexus 旧文件页广告槽位、TS nitro 广告位：隐藏用自有 <style>，关闭后节点与属性逐条还原
 *   · 不删除节点（React 重建循环）、不误伤 header / 下载按钮 / 卡片
 *   · 检测兼容：document-start 时页面脚本拿到的 adsBlockedByUser / blockingAds / areAdsBlocked()
 *     与随机 token 标记都变成「未拦截」；关闭后写回原值
 *   · 隔离 realm（fake DOM 里 window 与 document 不同源）时状态为 sandbox，不假成功
 *   · 三个开关互不替代、各自持久化、反复切换不累积菜单项
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CODE = readFileSync(join(ROOT, 'dist', 'mods-zh.user.js'), 'utf8');

/* ---------------- 夹具：结构与实机一致（广告槽位 id、nitro data-cid） ---------------- */

const NEXUS_FILE_HTML = `<!DOCTYPE html><html><head></head><body>
  <header aria-label="Header"><a href="/">Nexus Mods</a><button>Sign in</button></header>
  <div class="wrapper">
    <div class="ads-holder clearfix ads-top">
      <div class="ad ad-billboard" id="billboard_top"></div>
      <div class="ad ad-video" id="video_top"></div>
      <div class="ad-vertical_sticky_left" id="vertical_sticky_left"></div>
      <div class="ad-vertical_sticky_right" id="vertical_sticky_right"></div>
    </div>
    <div id="adBlockingBanner" style="display:none">We notice you are using an ad blocker. Downloads are limited to 1.5MB/s.</div>
    <div class="non-premium-banner">Download speed: 3 MB/s — Try Premium for uncapped downloads</div>
    <main>
      <h1>Some Mod</h1>
      <div class="mod-description">Use an adblock-friendly download manager if you like.</div>
      <a class="btn inline-flex" id="manual-download" href="/Core/Libs/Common/Widgets/DownloadPopUp?id=74231">Manual download</a>
      <button class="btn" id="vortex-download">Mod manager download</button>
      <div class="ads-holder clearfix ads-bottom">
        <div class="ad ad-billboard" id="billboard_bottom"></div>
        <div class="ad ad-mpu" id="mpu_bottom"></div>
      </div>
      <div id="adBanner"></div>
    </main>
  </div>
</body></html>`;

const TS_HTML = `<!DOCTYPE html><html><head></head><body>
  <header aria-label="Header"><a href="/">Thunderstore</a></header>
  <div class="layout__ads-stack"><div class="ad-container" data-cid="nimbus-v2-community-sidebar-300x250" data-size="display-300-250" id="rail-ad">
    <div class="ad-container__fallback"><span class="ad-container__fallback-text">Thunderstore development is made possible with ads. Please consider making an exception to your adblocker.</span></div>
  </div></div>
  <div id="nimbus-v2-floating-video" class="layout__floating-video-anchor nitro-floating-hidden" style="width: 300px; height: 169px;"><iframe title="ad"></iframe></div>
  <main class="package-search">
    <div class="package-card"><a class="package-card__name" href="/c/gtfo/p/BepInEx/">BepInEx</a><a class="button" id="install" href="/c/gtfo/p/BepInEx/versions/">Install with Mod Manager</a></div>
    <div class="empty-state">No packages found</div>
    <div class="readme">This package header requires an adblock-free experience.</div>
    <a id="download" class="button" href="/package/download/gtfo/BepInEx/1.0.0/">Manual Download</a>
  </main>
</body></html>`;

function boot(html, url, opts) {
    const options = Object.assign({ url, runScripts: 'outside-only', pretendToBeVisual: true }, opts || {});
    const dom = new JSDOM(html, options);
    if (!options.deferEval) dom.window.eval(CODE);
    return dom;
}

const wait = ms => new Promise(r => setTimeout(r, ms));
let passed = 0;
const failures = [];
async function test(name, fn) {
    try { await fn(); passed++; console.log('  ok   ' + name); }
    catch (e) { failures.push({ name, error: e }); console.log('  FAIL ' + name + ' -> ' + e.message); }
}

console.log('[jsdom · 广告净化与检测兼容]');

await test('Nexus：广告槽位被自有样式表压为 0 高度，节点仍在 DOM（不删 React 节点）', async () => {
    const dom = boot(NEXUS_FILE_HTML, 'https://www.nexusmods.com/helldivers2/mods/123?tab=files');
    const d = dom.window.document;
    await wait(80);
    const style = d.querySelector('style#mods-zh-cleanup');
    assert.ok(style, '没有注入净化样式表');
    const css = style.textContent;
    for (const sel of ['.ads-holder', '#billboard_top', '#video_top', '#mpu_bottom', '#adBlockingBanner']) {
        assert.ok(css.includes(sel), '样式表缺少规则 ' + sel);
    }
    for (const id of ['billboard_top', 'video_top', 'billboard_bottom', 'mpu_bottom']) {
        assert.ok(d.getElementById(id), '广告节点被删除：' + id);
    }
    assert.strictEqual(d.querySelector('#billboard_top').getAttribute('data-modszh-cleanup'), 'ad');
    // 正常下载按钮 / 头部不受影响
    assert.strictEqual(d.querySelector('#manual-download').getAttribute('data-modszh-cleanup'), null);
    assert.strictEqual(d.querySelector('#vortex-download').getAttribute('data-modszh-cleanup'), null);
    assert.strictEqual(d.querySelector('header').getAttribute('data-modszh-cleanup'), null);
    assert.ok(!css.includes('header'), '不得对 header 写规则');
    assert.ok(!css.includes('#manual-download'), '不得对下载按钮写规则');
    dom.window.close();
});

await test('Nexus：关闭净化后样式表移除、标记属性逐条还原', async () => {
    const dom = boot(NEXUS_FILE_HTML, 'https://www.nexusmods.com/helldivers2/mods/123?tab=files');
    const d = dom.window.document;
    await wait(80);
    const api = dom.window.__MODS_ZH__;
    assert.strictEqual(api.ads().ads, 'on');
    api.setCleanupEnabled(false);
    assert.strictEqual(d.querySelector('style#mods-zh-cleanup'), null, '样式表未移除');
    for (const el of d.querySelectorAll('[data-modszh-cleanup]')) {
        assert.fail('属性未还原：' + (el.id || el.className));
    }
    assert.strictEqual(api.ads().ads, 'off');
    // 再开启：恢复且计数不翻倍
    api.setCleanupEnabled(true);
    const marked = d.querySelectorAll('[data-modszh-cleanup="ad"]').length;
    assert.ok(marked >= 6, '重新开启后标记不足：' + marked);
    api.setCleanupEnabled(true);
    assert.strictEqual(d.querySelectorAll('[data-modszh-cleanup="ad"]').length, marked, '重复开启导致标记累积');
    dom.window.close();
});

await test('Thunderstore：nitro 广告位与兜底文案被隐藏规则覆盖，下载按钮/卡片不受影响', async () => {
    const dom = boot(TS_HTML, 'https://thunderstore.io/c/gtfo/');
    const d = dom.window.document;
    await wait(80);
    const css = d.querySelector('style#mods-zh-cleanup').textContent;
    assert.ok(css.includes('.ad-container[data-cid^="nimbus-v2-"]'), '缺少 nitro 广告位规则');
    assert.ok(css.includes('#nimbus-v2-floating-video'), '缺少悬浮视频广告规则');
    assert.ok(css.includes('.ad-container__fallback'), '缺少兜底文案规则');
    assert.ok(!/class\*="ad"/.test(css), '不得使用 class*=ad 这类粗暴规则');
    assert.ok(d.getElementById('rail-ad'), '广告容器被删除（React 会重建）');
    assert.ok(d.getElementById('nimbus-v2-floating-video'), '悬浮广告节点被删除');
    assert.strictEqual(d.querySelector('#install').hasAttribute('data-modszh-cleanup'), false);
    assert.strictEqual(d.querySelector('#download').hasAttribute('data-modszh-cleanup'), false);
    assert.strictEqual(d.querySelector('.package-card__name').textContent, 'BepInEx');
    dom.window.close();
});

await test('Thunderstore：关闭净化后隐藏规则全部撤除', async () => {
    const dom = boot(TS_HTML, 'https://thunderstore.io/c/gtfo/');
    const d = dom.window.document;
    await wait(80);
    dom.window.__MODS_ZH__.setCleanupEnabled(false);
    assert.strictEqual(d.querySelector('style#mods-zh-cleanup'), null);
    assert.strictEqual(d.querySelectorAll('[data-modszh-cleanup]').length, 0);
    assert.strictEqual(d.getElementById('nimbus-v2-floating-video').getAttribute('class'),
        'layout__floating-video-anchor nitro-floating-hidden', '悬浮广告 class 被改动');
    dom.window.close();
});

/* ---- 以下用例直接执行从真实页面源码摘出的旧站检测 writer（脱敏：随机函数名已换成固定串） ---- */

/* 与线上 f3 原文同构：window.blockingAds 赋值 + Cookies.get('ab') + Cookies.set('ab') + NexusConsent 门禁 */
const LEGACY_WRITER_SRC = `
window.blockingAds = false;
function detWriterProbe(blocking = false) {
    var mins = 5;
    var days = mins / ( 24 * 60 );
    window.blockingAds = blocking;
    const isBlocked = blocking;
    var currentStoredStatus = Cookies.get('ab');
    var newStatus = null;
    var skipWrite = false;
    if (currentStoredStatus === undefined) { newStatus = isBlocked ? 1 : 0; }
    else {
        var arrStoredStatus = currentStoredStatus.split("|");
        if (arrStoredStatus.length !== 2) { newStatus = isBlocked ? 1 : 0; }
        else {
            var numericStoredStatus = parseInt(arrStoredStatus[0]);
            if (numericStoredStatus === 0 && isBlocked === true) { newStatus = 2; }
            else if (numericStoredStatus === 1 && isBlocked !== true) { newStatus = 0; }
            else { newStatus = currentStoredStatus; skipWrite = true; }
        }
    }
    if (skipWrite !== true) {
        var now = Math.round(Date.now() / 1000);
        var secs = mins * 60;
        var expiry = now + secs;
        if (NexusConsent.get().preferences) {
            Cookies.set('ab', newStatus + '|' + expiry, { expires: days });
        }
    }
}
function areAdsBlocked(){ return window.blockingAds; }
`;

/* 极简 Cookies / NexusConsent：只实现 writer 用到的接口 */
function installSiteGlobals(win, opts) {
    const jar = new Map();
    const writes = [];
    win.Cookies = {
        get(k) { return jar.has(k) ? jar.get(k) : undefined; },
        set(k, v, o) { jar.set(k, v); writes.push({ k, v, o }); },
        remove(k) { jar.delete(k); },
    };
    win.NexusConsent = { get: () => ({ preferences: !!(opts && opts.consent) }) };
    return { jar, writes };
}

async function bootNexusFiles(extraHead, opts) {
    const head = (opts && opts.head) || '';
    // 用占位注释标出页面 inline 脚本位置：jsdom 不执行 inline script，下面按同样顺序手动 eval
    const dom = boot(NEXUS_FILE_HTML.replace('</head>', '<!--SITE_INLINE-->' + head + '</head>'),
        'https://www.nexusmods.com/helldivers2/mods/18959?tab=files', { deferEval: true });
    const win = dom.window;
    const g = installSiteGlobals(win, opts);
    win.GM_getValue = (k, d) => d;
    win.GM_setValue = () => { };
    win.GM_registerMenuCommand = () => 1;
    win.GM_unregisterMenuCommand = () => { };
    win.eval(LEGACY_WRITER_SRC);   // 页面自己的 inline 脚本（document-start 之后）
    win.eval(CODE);                // 用户脚本（模拟 document-start 之后立即执行）
    await wait(60);
    return { dom, win, ...g };
}

await test('writer：不经兼容时 call(true) 写 ab=1|<exp>；开启后同样调用写 0|<exp>，blockingAds=false（失败→通过）', async () => {
    // 基线：不开兼容（默认在旧 Nexus 上是开，这里先显式关掉）
    const base = await bootNexusFiles('', { consent: true });
    await base.win.__MODS_ZH__.setDetectCompatEnabled(false);
    base.win.detWriterProbe(true);
    assert.strictEqual(base.win.blockingAds, true, '基线 call(true) 应置 blockingAds=true');
    assert.ok(/^1\|\d+$/.test(base.win.Cookies.get('ab')), '基线应写 ab=1|<exp>，实际 ' + base.win.Cookies.get('ab'));
    base.dom.window.close();

    // 开启兼容后
    const { dom, win, jar } = await bootNexusFiles('', { consent: true });
    await win.__MODS_ZH__.setDetectCompatEnabled(true);
    const st = win.__MODS_ZH__.detect();
    assert.strictEqual(st.detect, 'on', JSON.stringify(st));
    assert.strictEqual(st.writers, 1, '未识别 writer：' + JSON.stringify(st));
    assert.strictEqual(st.serverState, 'attempted', JSON.stringify(st));
    win.detWriterProbe(true);
    assert.strictEqual(win.blockingAds, false, 'wrapper 后 blockingAds 仍被写成 true');
    assert.ok(/^0\|\d+$/.test(jar.get('ab')), 'wrapper 后应写 ab=0|<exp>，实际 ' + jar.get('ab'));
    // 站点自己的 areAdsBlocked 也必须读到「未拦截」
    assert.strictEqual(win.areAdsBlocked(), false, 'areAdsBlocked 仍返回 true');
    dom.window.close();
});

await test('writer：关闭后函数恢复原实现，再 call(true) 回到 ab=1|<exp>', async () => {
    const { dom, win, jar } = await bootNexusFiles('', { consent: true });
    await win.__MODS_ZH__.setDetectCompatEnabled(false);
    const original = win.detWriterProbe;          // 关闭后拿到的是页面原函数
    await win.__MODS_ZH__.setDetectCompatEnabled(true);
    assert.notStrictEqual(win.detWriterProbe, original, '开启后应换成 wrapper');
    win.detWriterProbe(true);
    assert.ok(/^0\|/.test(jar.get('ab')));
    const off = await win.__MODS_ZH__.setDetectCompatEnabled(false);
    assert.strictEqual(off.detect, 'off', JSON.stringify(off));
    assert.strictEqual(off.needsReload, true, '关闭后应提示需要刷新');
    assert.strictEqual(win.detWriterProbe, original, '关闭后未还原原函数');
    win.detWriterProbe(true);
    assert.strictEqual(win.blockingAds, true);
    assert.ok(/^1\|\d+$/.test(jar.get('ab')), '还原后 call(true) 应写 1|<exp>，实际 ' + jar.get('ab'));
    dom.window.close();
});

await test('writer：晚定义（document-start 之后）也被有限时序捕获；关闭后晚回调不再被重挂', async () => {
    const dom = boot(NEXUS_FILE_HTML, 'https://www.nexusmods.com/helldivers2/mods/18959?tab=files', { deferEval: true });
    const win = dom.window;
    const g = installSiteGlobals(win, { consent: true });
    win.GM_getValue = (k, d) => d;
    win.GM_registerMenuCommand = () => 1;
    win.eval(CODE);
    await win.__MODS_ZH__.setDetectCompatEnabled(false);
    // 重新给一个干净页面状态：删掉 writer / areAdsBlocked，模拟「脚本尚未定义 writer」
    win.eval('delete window.detWriterProbe; delete window.areAdsBlocked; try { delete window.blockingAds; } catch (e) {}');
    await win.__MODS_ZH__.setDetectCompatEnabled(true);
    assert.strictEqual(win.__MODS_ZH__.detect().detect, 'pending', '未出现 writer 时应为 pending');
    // 页面稍后才定义 writer（模拟 inline 脚本晚到 / 动态插入）
    win.eval(LEGACY_WRITER_SRC);
    win.detWriterProbe(true);
    await wait(1200);
    const st = win.__MODS_ZH__.detect();
    assert.strictEqual(st.detect, 'on', '晚定义 writer 未被捕获：' + JSON.stringify(st));
    assert.ok(/^0\|/.test(g.jar.get('ab')), '晚定义 writer 调用后应写 0|<exp>');
    // 关闭后不再扫描
    await win.__MODS_ZH__.setDetectCompatEnabled(false);
    const countBefore = win.__MODS_ZH__.detect().writers;
    assert.strictEqual(countBefore, 0);
    await wait(700);   // 超过一个轮询间隔，确认没有残留计时器重挂
    assert.strictEqual(win.__MODS_ZH__.detect().writers, 0, '关闭后仍被重新包装');
    dom.window.close();
});

await test('writer：NexusConsent.preferences=false 时原 helper 不写 cookie，状态为 pending（不报已恢复）', async () => {
    const { dom, win, jar } = await bootNexusFiles('', { consent: false });
    await win.__MODS_ZH__.setDetectCompatEnabled(true);
    const st = win.__MODS_ZH__.detect();
    assert.strictEqual(st.detect, 'on', JSON.stringify(st));
    assert.strictEqual(st.serverState, 'pending', '无 cookie 偏好时应为 pending：' + JSON.stringify(st));
    win.detWriterProbe(true);
    assert.strictEqual(jar.has('ab'), false, '无 cookie 偏好时不应写入 ab');
    assert.strictEqual(win.blockingAds, false, 'blockingAds 仍应被固定为 false');
    dom.window.close();
});

await test('范围：非 Nexus 域不跑检测兼容、不创建任何 window 属性', async () => {
    const dom = boot(TS_HTML, 'https://thunderstore.io/c/gtfo/', { deferEval: true });
    const win = dom.window;
    win.GM_getValue = (k, d) => (k === 'modsZh.detectCompat' ? true : d);   // 偏好为 true 也不能越界
    win.GM_registerMenuCommand = () => 1;
    win.eval(CODE);
    await wait(200);
    const st = win.__MODS_ZH__.detect();
    assert.notStrictEqual(st.detect, 'on', 'Thunderstore 不应跑旧 Nexus writer：' + JSON.stringify(st));
    for (const k of ['blockingAds', 'areAdsBlocked', 'adsBlockedByUser', 'adShieldActive', 'detWriterProbe']) {
        assert.strictEqual(Object.prototype.hasOwnProperty.call(win, k), false, '越界创建了 window.' + k);
    }
    // 完全未匹配站点（不属于任何已注册站点）同样不扫
    const dom2 = boot('<html><body><p>x</p></body></html>', 'http://localhost:9/demo.html', { deferEval: true });
    const w2 = dom2.window;
    w2.GM_getValue = (k, d) => (k === 'modsZh.detectCompat' ? true : d);
    w2.GM_registerMenuCommand = () => 1;
    w2.eval(CODE);
    await wait(120);
    const api2 = w2.__MODS_ZH__;
    assert.ok(api2, 'API 出口应存在（用于查看状态）');
    assert.notStrictEqual(api2.detect().detect, 'on', '未匹配站点不应跑检测兼容');
    for (const k of ['blockingAds', 'areAdsBlocked', 'adsBlockedByUser', 'adShieldActive']) {
        assert.strictEqual(Object.prototype.hasOwnProperty.call(w2, k), false, '未匹配站点创建了 window.' + k);
    }
    dom.window.close(); dom2.window.close();
});

await test('随机 probe 保持原样：adsservice 的 true 在开关前后都不被改成 false/undefined', async () => {
    const dom = boot(NEXUS_FILE_HTML, 'https://www.nexusmods.com/helldivers2/mods/18959?tab=files', { deferEval: true });
    const win = dom.window;
    const g = installSiteGlobals(win, { consent: true });
    win.GM_getValue = (k, d) => d;
    win.GM_registerMenuCommand = () => 1;
    win.eval("window.eSTdHLCPsMFO = true;" +
        "const blockElement=document.createElement('div');blockElement.id='eSTdHLCPsMFO';" +
        "blockElement.style.display='none';document.body.appendChild(blockElement);");
    win.eval(LEGACY_WRITER_SRC);
    win.eval(CODE);
    await win.__MODS_ZH__.setDetectCompatEnabled(true);
    await wait(120);
    assert.strictEqual(win.eSTdHLCPsMFO, true, '探针被改写（true -> ' + win.eSTdHLCPsMFO + '）');
    assert.ok(win.document.getElementById('eSTdHLCPsMFO'), 'advert6 的 div 被删除');
    await win.__MODS_ZH__.setDetectCompatEnabled(false);
    assert.strictEqual(win.eSTdHLCPsMFO, true, '关闭后探针值被改动');
    assert.ok(win.document.getElementById('eSTdHLCPsMFO'), '关闭后 div 丢失');
    dom.window.close();
});

await test('失败/部分失败不报全成功；识别不到 writer 时报 pending 而非 on', async () => {
    const dom = boot(NEXUS_FILE_HTML, 'https://www.nexusmods.com/helldivers2/mods/18959?tab=files', { deferEval: true });
    const win = dom.window;
    win.GM_getValue = (k, d) => d;
    win.GM_registerMenuCommand = () => 1;
    win.eval(CODE);
    await win.__MODS_ZH__.setDetectCompatEnabled(false);
    await win.__MODS_ZH__.setDetectCompatEnabled(true);
    assert.strictEqual(win.__MODS_ZH__.detect().detect, 'pending', '无 writer 时不能报 on');
    assert.notStrictEqual(win.__MODS_ZH__.detect().applied, true);
    dom.window.close();

    // 部分失败：识别到 writer，但 areAdsBlocked 不可配置 → 不改写它，仍可用 writer 的包装
    const b = await bootNexusFiles('', { consent: true });
    await b.win.__MODS_ZH__.setDetectCompatEnabled(false);
    b.win.eval('delete window.areAdsBlocked; Object.defineProperty(window, "areAdsBlocked", ' +
        '{ configurable: false, value: function () { return false; } });');
    await b.win.__MODS_ZH__.setDetectCompatEnabled(true);
    const st = b.win.__MODS_ZH__.detect();
    assert.strictEqual(st.detect, 'on', JSON.stringify(st));
    assert.strictEqual(st.writers, 1, 'writer 应仍被包装：' + JSON.stringify(st));
    // 不可配置的 areAdsBlocked 不尝试改写，也不因此谎报全量成功
    if (st.partial) assert.ok(/non-configurable/.test(st.error), '部分失败的说明：' + st.error);
    else assert.ok(/non-configurable/.test(st.reason) || st.error === '', '部分失败要显式可见：' + JSON.stringify(st));
    b.dom.window.close();
});

await test('三个开关互不替代', async () => {
    const store = new Map();
    const dom = boot(NEXUS_FILE_HTML, 'https://www.nexusmods.com/helldivers2/mods/123?tab=files', { deferEval: true });
    const win = dom.window;
    win.GM_getValue = (k, d) => (store.has(k) ? store.get(k) : d);
    win.GM_setValue = (k, v) => { store.set(k, v); };
    win.GM_registerMenuCommand = () => 1;
    win.GM_unregisterMenuCommand = () => { };
    win.eval(CODE);
    await wait(120);
    const api = win.__MODS_ZH__;
    assert.ok(api, 'API 未导出');

    api.setEnabled(false);
    assert.strictEqual(api.ads().enabled, true, '汉化开关影响了广告净化');
    api.setCleanupEnabled(false);
    assert.strictEqual(api.enabled, false, '净化开关影响了汉化');
    api.setEnabled(true);
    assert.strictEqual(api.ads().enabled, false, '汉化开关重开时错误地打开了广告净化');
    await api.setDetectCompatEnabled(true);
    assert.strictEqual(api.ads().enabled, false, '检测开关影响了广告净化');
    assert.strictEqual(api.detect().enabled, true);
    dom.window.close();
});

await test('菜单：三个开关各只注册一次，反复切换不累积菜单项', async () => {
    const store = new Map();
    let registered = [];
    const dom = boot(NEXUS_FILE_HTML, 'https://www.nexusmods.com/helldivers2/mods/123?tab=files', { deferEval: true });
    const win = dom.window;
    win.GM_getValue = (k, d) => (store.has(k) ? store.get(k) : d);
    win.GM_setValue = (k, v) => { store.set(k, v); };
    win.GM_registerMenuCommand = (label) => { registered.push(label); return registered.length; };
    win.GM_unregisterMenuCommand = (h) => { if (typeof h === 'number') registered[h - 1] = '<<removed>>'; };
    win.alert = () => { };
    win.eval(CODE);
    await wait(120);
    const api = win.__MODS_ZH__;
    // 记录菜单回调：管理器按注册顺序持有标签，这里模拟「点击第一项」的效果由 refreshSlot 重挂
    const countLive = (prefix) => registered.filter(l => l.startsWith(prefix)).length;
    assert.strictEqual(countLive('广告净化'), 1);
    assert.strictEqual(countLive('检测兼容'), 1);
    assert.strictEqual(countLive('界面中文化'), 1);
    const total = registered.length;
    for (let i = 0; i < 3; i++) {
        api.setCleanupEnabled(!api.ads().enabled);
        api.setEnabled(!api.enabled);
        await api.setDetectCompatEnabled(!api.detect().enabled);
    }
    // 直接调用 API 不经过菜单回调：注册表长度与只读标签数都不变（没有累积）
    assert.strictEqual(registered.length, total, '菜单条目被反复注册：' + JSON.stringify(registered));
    assert.strictEqual(countLive('广告净化'), 1);
    dom.window.close();
});

await test('广告净化状态对外可见：unsupported / on / off 与实际行为一致', async () => {
    const dom = boot(NEXUS_FILE_HTML, 'https://www.nexusmods.com/helldivers2/mods/123?tab=files');
    const win = dom.window;
    await wait(80);
    const api = win.__MODS_ZH__;
    const sample = api.ads();
    for (const key of ['ads', 'enabled', 'applied', 'marked', 'reason', 'needsReload']) {
        assert.ok(key in sample, '状态缺少字段 ' + key);
    }
    assert.strictEqual(sample.ads, 'on');
    assert.ok(sample.marked > 0);
    const det = api.detect();
    for (const key of ['detect', 'enabled', 'applied', 'writers', 'serverState', 'failed', 'partial', 'error', 'needsReload']) {
        assert.ok(key in det, '检测状态缺少字段 ' + key);
    }
    // 检测从未开启且从未关闭过：状态是 idle（不是『已处理』，也不是假的 off/on）
    assert.ok(['idle', 'off', 'pending'].includes(det.detect), '检测状态异常：' + det.detect);
    dom.window.close();
});

/* 营销条（截图里的紫色 Try Premium free 促销条 + 反拦截替代升级横幅）必须覆盖，
 * 但账号菜单 / 下载选项 / 正文里的同款容器不能被误伤。 */
await test('Nexus：Premium 促销条与升级横幅被隐藏（可逆），账号菜单/下载选项/正文不受影响', async () => {
    const html = `<!DOCTYPE html><html><body>
      <div id="nonPremiumBanner"><span>Download speed: 3 MB/s</span><a href="/premium">Try Premium free</a></div>
      <div id="freeTrialBanner"><span>Start free trial</span><a href="/premium">Go Premium</a></div>
      <div id="adBlockingBanner">We notice you are using an ad blocker. Downloads are limited to 1.5MB/s.</div>
      <p class="text-body-md text-neutral-moderate min-w-0"><span>Try Premium free</span> - unlock faster downloads &amp; 1-click installs</p>
      <div id="nonPremiumBanner-account-menu"><p class="min-w-0 text-neutral-moderate">Your plan: Member</p></div>
      <div class="account-menu"><p>My profile</p></div>
      <select id="download-options"><option>Slow download</option></select>
      <article class="mod-description"><p class="min-w-0 text-neutral-moderate">Author text mentioning Premium free</p></article>
    </body></html>`;
    const dom = boot(html, 'https://www.nexusmods.com/helldivers2/mods/18959?tab=files');
    const d = dom.window.document;
    await wait(80);
    const css = d.querySelector('style#mods-zh-cleanup').textContent;
    for (const sel of ['#nonPremiumBanner', '#freeTrialBanner', '#adBlockingBanner',
        'p[class~="min-w-0"][class~="text-neutral-moderate"]']) {
        assert.ok(css.includes(sel), '缺少营销条规则：' + sel);
    }
    for (const id of ['nonPremiumBanner', 'freeTrialBanner', 'adBlockingBanner']) {
        assert.strictEqual(d.getElementById(id).getAttribute('data-modszh-cleanup'), 'ad', '未标识：' + id);
    }
    assert.strictEqual(d.querySelector('.account-menu p').hasAttribute('data-modszh-cleanup'), false, '账号菜单被误伤');
    assert.strictEqual(d.querySelector('#download-options').hasAttribute('data-modszh-cleanup'), false, '下载选项被误伤');
    assert.strictEqual(d.querySelector('select').hasAttribute('data-modszh-cleanup'), false);
    assert.strictEqual(d.querySelector('#nonPremiumBanner a').getAttribute('data-modszh-cleanup'), 'ad', '促销 CTA 未标识');
    // 关闭即全部还原
    dom.window.__MODS_ZH__.setCleanupEnabled(false);
    assert.strictEqual(d.querySelectorAll('[data-modszh-cleanup]').length, 0, '关闭后仍有标识属性');
    assert.strictEqual(d.querySelector('style#mods-zh-cleanup'), null);
    dom.window.close();
});

await test('Nexus：无来源的空槽位规则不再写入（#adBanner 已移除）', async () => {
    const dom = boot(NEXUS_FILE_HTML, 'https://www.nexusmods.com/helldivers2/mods/18959?tab=files');
    await wait(60);
    const css = dom.window.document.querySelector('style#mods-zh-cleanup').textContent;
    assert.ok(!/#adBanner\b/.test(css), '仍存在无来源的 #adBanner 规则');
    assert.ok(!/adShieldActive/.test(css));
    dom.window.close();
});

/* 关闭还原 ab 的三种原始状态（有效原值 / 已过期原值 / 原本不存在）
 * 用完整 served writer 原文的等价体（含 Cookies.get/set、expiry、NexusConsent 门禁）重放。 */
await test('ab 还原：有效原值 1|<exp> 在关闭后逐字节写回；过期原值不续命；原本不存在则删除', async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const pastExp = Math.floor(Date.now() / 1000) - 3600;

    // (1) 有效原值：关闭后回到 1|<futureExp>，expiry 原样（不延长）
    {
        const { dom, win, jar } = await bootNexusFiles('', { consent: true });
        win.Cookies.set('ab', '1|' + futureExp, { expires: new Date(futureExp * 1000) });
        // 重新走一次「识别 → 记录原值」：关闭后再开启前设置为该原始状态
        await win.__MODS_ZH__.setDetectCompatEnabled(false);
        jar.set('ab', '1|' + futureExp);
        await win.__MODS_ZH__.setDetectCompatEnabled(true);
        win.detWriterProbe(true);                 // 站点自己写 0|<new exp>
        assert.strictEqual(jar.get('ab').split('|')[0], '0', '开启期间应为 0');
        const st = await win.__MODS_ZH__.setDetectCompatEnabled(false);
        assert.strictEqual(jar.get('ab'), '1|' + futureExp, '关闭后必须逐字节写回原值');
        assert.ok(/^(restored|unchanged)$/.test(st.ab), '状态应报告已还原，实际 ' + st.ab);
        dom.window.close();
    }

    // (2) 已过期原值：写回原字符串，但 expiry 必须是原来的（过去）时间，不能续命成未来
    {
        const { dom, win, jar } = await bootNexusFiles('', { consent: true });
        await win.__MODS_ZH__.setDetectCompatEnabled(false);
        jar.clear();
        jar.set('ab', '1|' + pastExp);
        // 注意：cleanup 会把 win.Cookies 解构到局部变量，替换 win.Cookies.set 抓不到调用；
        // 这里改为在 set 内部记录，再用「开启前最后一条记录」判定还原动作
        const rec = [];
        win.Cookies.set = function (k, v, o) { jar.set(k, String(v)); rec.push({ v: String(v), o: o || {} }); };
        await win.__MODS_ZH__.setDetectCompatEnabled(true);
        win.detWriterProbe(true);
        await win.__MODS_ZH__.setDetectCompatEnabled(false);
        assert.strictEqual(jar.get('ab'), '1|' + pastExp, '过期原值也必须原样写回');
        const last = rec[rec.length - 1];
        assert.ok(last, '应有写回动作');
        // 跨 realm：脚本产物里的 Date 属于 window realm，不能用 node 侧的 instanceof Date 判
        assert.ok(last.o.expires && typeof last.o.expires.getTime === 'function', '写回必须带 expires（尊重原过期时间）');
        assert.ok(last.o.expires.getTime() <= Date.now(), '过期原值不得被续命：' + last.o.expires.toISOString());
        dom.window.close();
    }

    // (3) 原本不存在：关闭后删除该键，不留下 0/false
    {
        const { dom, win, jar } = await bootNexusFiles('', { consent: true });
        await win.__MODS_ZH__.setDetectCompatEnabled(false);
        jar.clear();
        await win.__MODS_ZH__.setDetectCompatEnabled(true);
        win.detWriterProbe(true);
        assert.ok(jar.has('ab'), '开启期间站点应写入 ab');
        await win.__MODS_ZH__.setDetectCompatEnabled(false);
        assert.strictEqual(jar.has('ab'), false, '原本不存在时关闭后必须删除 ab，实际 ' + jar.get('ab'));
        dom.window.close();
    }
});

const NL = String.fromCharCode(10);
console.log(NL + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) {
    for (const f of failures) console.error(NL + '--- ' + f.name + NL + ((f.error && f.error.stack) || f.error));
    process.exit(1);
}
