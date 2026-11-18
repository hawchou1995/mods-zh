/* =============================================================================
 * cleanup.js —— 广告净化与广告拦截检测兼容（独立于汉化总开关）
 *
 * 设计约束与取证明细见 docs/adr/0004-ad-cleanup.md、docs/evidence/ads-and-detect-2026-11-18.md：
 *   1. 只动自己的样式表、仅自己写入的属性、以及页面同一 realm 的布尔标记；
 *      不删除 React 节点（删了会被框架重建，形成循环），不 mock fetch/XHR/定时器，
 *      不碰登录、Cloudflare 挑战、下载 API 与下载 CDN。
 *   2. 每条规则都对应一条已采证的真实 DOM；没有实证的容器一律不写规则，
 *      [class*="ad"] 这类会命中 header / download 的粗暴选择器禁止使用。
 *   3. 关闭时逐条还原：移除本模块注入的 <style>、属性写回原值、检测标记写回原值；
 *      无法在本次页面内彻底撤销的（框架可能复用旧值）在 status().needsReload 中如实标注。
 *   4. 三个开关各自持久化、互不替代：汉化总开关不影响本模块，
 *      本模块的两个开关也不触碰 State.enabled。
 * ========================================================================== */

const CLEANUP_KEY = 'modsZh.cleanup';
const DETECT_KEY = 'modsZh.detectCompat';
const CLEANUP_STYLE_ID = 'mods-zh-cleanup';
const CLEANUP_MARK_ATTR = 'data-modszh-cleanup';
const DETECT_MARK_ATTR = 'data-modszh-detect';

/* ------------------------------------------------------------------ 持久化 */

/* 与汉化开关同一条读取链路：GM_getValue 优先，localStorage 兜底。
 * 存储异常时返回 fallback，绝不让脚本因为存储不可用而启动失败。 */
function cleanupStoreGet(key, fallback) {
    try {
        if (typeof GM_getValue === 'function') {
            const v = GM_getValue(key, fallback);
            return v === undefined ? fallback : !!v;
        }
    } catch (e) { /* 无 GM 环境 */ }
    try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : v === '1';
    } catch (e) { /* 隐私模式 */ }
    return fallback;
}

function cleanupStoreSet(key, on) {
    try {
        if (typeof GM_setValue === 'function') { GM_setValue(key, on); return; }
    } catch (e) { /* ignore */ }
    try { localStorage.setItem(key, on ? '1' : '0'); } catch (e) { /* ignore */ }
}

/* ------------------------------------------------------------------ 规则表 */

/* ---- Nexus Mods ----
 * 取证：2026-11-18 旧文件页 /<game>/mods/<id>?tab=files 的槽位清单
 *   .ads-holder.ads-top / .ads-holder.ads-bottom 内
 *   #billboard_top #video_top #vertical_sticky_left #vertical_sticky_right
 *   #billboard_bottom #mpu_bottom #mobile_mpu_bottom。
 * 无来源的空槽位（如旧笔记里的 #adBanner）不再写规则。
 * 站点 CSS 目前自己把它们压成 display:none（高度 0）；用户关掉自己的广告插件后
 * 这些槽位会被站点脚本重新展开——本模块只在开启时把槽位收成 0 高度，
 * 关闭即移除样式表，回到站点原状。 */
const NX_AD_SELECTORS = [
    '.ads-holder',
    '#billboard_top',
    '#billboard_bottom',
    '#video_top',
    '#mpu_top',
    '#mpu_bottom',
    '#mobile_mpu_bottom',
    '#vertical_sticky_left',
    '#vertical_sticky_right',
];

/* Nexus 营销条（用户要求的「去广告」范围：Premium 促销条、反拦截替代的升级横幅）。
 * 来源与证据（docs/evidence/ads-and-detect-2026-11-18.md）：
 *   · #adBlockingBanner —— 旧文件页「检测到你拦截广告」提示，原文写 1.5MB/s
 *   · #nonPremiumBanner / #freeTrialBanner —— 旧站会员促销条（3 MB/s / Try Premium free）
 *   · 新前端促销文本容器 p[class~="min-w-0"][class~="text-neutral-moderate"] ——
 *     生产 chunk 里就是 "Try Premium free - unlock faster downloads & 1-click installs"
 * 只隐藏这些「整段固定促销」的容器与其中的 CTA；账号菜单、下载选项、正文一律不动。 */
const NX_PROMO_SELECTORS = [
    '#adBlockingBanner',
    '#nonPremiumBanner',
    '#freeTrialBanner',
    '[data-e2eid="adblocking-banner"]',
    '[data-e2eid="non-premium-banner"]',
    'p[class~="min-w-0"][class~="text-neutral-moderate"]',
];
const NX_PROMO_CTA_SELECTORS = [
    'p[class~="min-w-0"][class~="text-neutral-moderate"] a',
    'p[class~="min-w-0"][class~="text-neutral-moderate"] button',
    '#nonPremiumBanner a',
    '#freeTrialBanner a',
    '#adBlockingBanner a',
];

/* ---- Thunderstore ----
 * 取证：GTFO 社区页 /c/gtfo/
 *   · .ad-container[data-cid^="nimbus-v2-"] —— NitroPay 广告位（React 渲染，禁止删除）
 *   · 其内部的 .ad-container__fallback —— 「请为广告放行」兜底文案
 *   · #nimbus-v2-floating-video（同 .layout__floating-video-anchor）—— 悬浮视频广告位，
 *     inline 300x169，是实测唯一仍然可见的广告单元
 *   · .layout__ads-stack —— 侧栏广告堆栈容器
 * 全部是 nitro 专用命名，不会命中 header / 下载按钮 / 包卡片。 */
const TS_AD_SELECTORS = [
    '#nimbus-v2-floating-video',
    '.layout__floating-video-anchor',
    '.ad-container[data-cid^="nimbus-v2-"]',
    '.layout__ads-stack',
];

const CLEANUP_RULES = {
    nexus: { ads: NX_AD_SELECTORS.concat(NX_PROMO_SELECTORS, NX_PROMO_CTA_SELECTORS), banners: [] },
    thunderstore: { ads: TS_AD_SELECTORS, banners: [] },
};

/* 样式表内容：每个选择器单独一条，便于在测试里逐条核对；
 * 兜底文案单独一条，保证容器被站点重新展开时里面的「请放行广告」文字也不显示。 */
function cleanupCss(site) {
    const rules = CLEANUP_RULES[site && site.id];
    if (!rules) return '';
    const decl = 'display:none !important;height:0 !important;min-height:0 !important;' +
        'width:0 !important;min-width:0 !important;margin:0 !important;padding:0 !important;' +
        'border:0 !important;visibility:hidden !important;pointer-events:none !important;';
    const lines = [];
    for (const sel of rules.ads) lines.push(sel + '{' + decl + '}');
    // 兜底文案只在 Thunderstore 存在（服务端渲染进 .ad-container），其他站点不写空规则
    if (site && site.id === 'thunderstore') lines.push('.ad-container__fallback{' + decl + '}');
    return lines.join('\n');
}

/* ------------------------------------------------------------------ 广告净化 */

const CleanupState = {
    site: null,
    enabled: false,
    applied: false,
    observer: null,
    style: null,
    touched: [],            // [{ el, attr, value }]：本模块写过、关闭时要还原的属性
    status: { ads: 'idle', reason: '' },
};

function cleanupInjectedStyle() {
    if (CleanupState.style) return CleanupState.style;
    const doc = document;
    const existing = doc.querySelector('style#' + CLEANUP_STYLE_ID);
    if (existing) { CleanupState.style = existing; return existing; }
    const style = doc.createElement('style');
    style.id = CLEANUP_STYLE_ID;
    style.appendChild(doc.createTextNode(cleanupCss(CleanupState.site)));
    (doc.head || doc.documentElement).appendChild(style);
    CleanupState.style = style;
    return style;
}

/* Marking: 仅对规则命中的节点打标记，用于状态展示与测试核对。
 * 所有属性写入都进 touched，关闭时逐条还原到原值（原先没有该属性就移除）。 */
function cleanupMarkNodes() {
    const rules = CLEANUP_RULES[CleanupState.site && CleanupState.site.id];
    if (!rules) return 0;
    let n = 0;
    for (const sel of rules.ads) {
        let list;
        try { list = document.querySelectorAll(sel); } catch (e) { continue; }
        for (const el of list) {
            if (el.getAttribute(CLEANUP_MARK_ATTR) === 'ad') continue;
            /* 硬 UGC（模组描述/README/代码）即使恰好套用了促销容器的样式类，也不隐藏、不标识 */
            let ugc = null;
            try { ugc = State.site && State.site.hardUgc ? State.site.hardUgc : null; } catch (e) { ugc = null; }
            if (ugc) {
                let hit = false;
                try { hit = !!el.closest(ugc); } catch (e) { hit = false; }
                if (hit) continue;
            }
            CleanupState.touched.push({ el, attr: CLEANUP_MARK_ATTR, value: el.getAttribute(CLEANUP_MARK_ATTR) });
            el.setAttribute(CLEANUP_MARK_ATTR, 'ad');
            n++;
        }
    }
    return n;
}

function cleanupApply() {
    if (!CleanupState.site || !CLEANUP_RULES[CleanupState.site.id]) {
        CleanupState.status = { ads: 'unsupported', reason: '站点没有已取证的广告规则' };
        return CleanupState.status;
    }
    cleanupInjectedStyle();
    const n = cleanupMarkNodes();
    CleanupState.applied = true;
    CleanupState.status = { ads: 'on', reason: '已注入样式，标记 ' + n + ' 个广告位' };
    return CleanupState.status;
}

function cleanupRevert() {
    // 页面卸载（pagehide）后 document 可能已不可用：只清状态，不抛错
    if (CleanupState.style && typeof CleanupState.style.remove === 'function') {
        try { CleanupState.style.remove(); } catch (e) { /* document 已卸载 */ }
    }
    CleanupState.style = null;
    // 逆序还原：同一元素多次写入时，最后一次记录的原值才是「本模块之前」的值
    for (let i = CleanupState.touched.length - 1; i >= 0; i--) {
        const t = CleanupState.touched[i];
        try {
            if (t.value === null || t.value === undefined) t.el.removeAttribute(t.attr);
            else t.el.setAttribute(t.attr, t.value);
        } catch (e) { /* 节点已卸载 */ }
    }
    CleanupState.touched = [];
    CleanupState.applied = false;
    CleanupState.status = { ads: 'off', reason: '样式与属性已还原' };
    return CleanupState.status;
}

function cleanupStartObserver() {
    if (CleanupState.observer || typeof MutationObserver !== 'function') return;
    if (!document.body) return;
    CleanupState.observer = new MutationObserver(() => {
        if (!CleanupState.enabled) return;
        // 广告位由 React 动态挂载：补打标记；站点重写 head 时把样式表补回
        cleanupMarkNodes();
        if (CleanupState.applied) cleanupInjectedStyle();
    });
    CleanupState.observer.observe(document.body, { childList: true, subtree: true });
}

function cleanupStopObserver() {
    if (CleanupState.observer) { CleanupState.observer.disconnect(); CleanupState.observer = null; }
}

/**
 * 广告净化开关。与汉化总开关 State.enabled 完全无关。
 * @param {boolean} on
 * @returns {{ads:string, reason:string}}
 */
function setCleanupEnabled(on) {
    CleanupState.enabled = !!on;
    if (CleanupState.enabled) {
        if (document.body) { cleanupApply(); cleanupStartObserver(); }
        else document.addEventListener('DOMContentLoaded', () => {
            if (!CleanupState.enabled) return;
            cleanupApply(); cleanupStartObserver();
        }, { once: true });
    } else {
        cleanupStopObserver();
        cleanupRevert();
    }
    return CleanupState.status;
}

function cleanupStatus() {
    return {
        ads: CleanupState.status.ads,
        enabled: CleanupState.enabled,
        applied: CleanupState.applied,
        marked: CleanupState.touched.length,
        styleId: CLEANUP_STYLE_ID,
        reason: CleanupState.status.reason,
        needsReload: false,
    };
}

/* ------------------------------------------------------------------ 反拦截检测兼容 */

/* ---------------------------------------------------------------------------
 * 已取证的旧站检测 writer（源码原文见 docs/evidence/ads-and-detect-2026-11-18.md，
 * 动态函数名每次加载随机，因此按**源码形态**识别，不硬编码名字）：
 *
 *   window.blockingAds = false;
 *   function <随机名>(blocking = false) {
 *       window.blockingAds = blocking;              // ① 写全局
 *       const isBlocked = blocking;
 *       var currentStoredStatus = Cookies.get('ab'); // ② 读探测 cookie
 *       ... 计算 newStatus / expiry（now + mins*60）
 *       if (NexusConsent.get().preferences) {
 *           Cookies.set('ab', newStatus + '|' + expiry, { expires: days }); // ③ 写探测 cookie
 *       }
 *   }
 *   function areAdsBlocked(){ return window.blockingAds; }
 *
 * 已知事实（同账号同文件同一入口的 1 组 200 对照）：
 *   ab 不存在        -> SSR `download-speed="reduced"`
 *   ab=0|<exp>       -> SSR `download-speed="standard"`
 * 所以「让 writer 以 false 走一遍」是已批准、可载明的客户端兼容层。
 *
 * 只改 `window.blockingAds` 的 getter 没有用：writer 的局部参数 blocking / isBlocked
 * 仍然是 true，cookie 会被写成 1。必须沿真实 writer 处理：
 *   · 识别：函数源码同时含 window.blockingAds 赋值、Cookies.get('ab')、Cookies.set('ab')
 *   · 包装：收到 true 时改为调用原函数 false（保留原 expiry / consent / 写入分支、其余参数与 this）
 *   · 更新当前状态：调用已识别的原函数(false)，由原 NexusConsent 门禁决定是否真的写 cookie
 *
 * 随机 probe（/api/scripts/adsservice.js 的 `window.<token> = true`）：源码只说明「脚本已执行」，
 * **不**代表「判定为拦截」。本模块不设置、不删除、不改写任何 token，保持页面原样。
 * adShieldActive（灰度总开关）与新前端 React context 的 adsBlockedByUser 同样不改写。
 *
 * 不做：不整体 patch Cookies / fetch / XHR / 定时器，不伪造 Premium，不改 download-url /
 * download-speed DOM，不阻断任何请求。
 * --------------------------------------------------------------------------- */

/* 把 ab 写回「开启前读到的原值」。两种情形分开处理：
 *   · 开启时不存在（undefined）→ 删除该键（不续命、不留残留）
 *   · 开启时存在 → 原样写回原字符串（首段 0/1/2 与 expiry 都不变），expiry 取**原值自带的**
 *     时间戳；若原值已过期就按已过期写回（不延长期限），不做任何"续命"。
 * 只用站点自己的 Cookies 接口，不解析 document.cookie，不碰其它 cookie。 */
function detectRestoreAb(win, original) {
    let cookies = null;
    try { cookies = win.Cookies; } catch (e) { cookies = null; }
    if (!cookies || typeof cookies.set !== 'function') return 'skipped:no-cookies-api';
    if (original === undefined || original === null) {
        try {
            if (typeof cookies.remove === 'function') cookies.remove('ab');
            return 'removed';
        } catch (e) { return 'failed'; }
    }
    const text = String(original);
    const parts = text.split('|');
    // 只认 writer 产物的形态（数字|秒级时间戳）；其它形态一律原样写回也不再推断过期
    const expiryOk = parts.length === 2 && /^\d+$/.test(parts[1]);
    try {
        let current = null;
        try { current = cookies.get('ab'); } catch (e) { current = undefined; }
        if (current === text) return 'unchanged';
        const opts = expiryOk ? { expires: new Date(Number(parts[1]) * 1000) } : {};
        cookies.set('ab', text, opts);
        return 'restored';
    } catch (e) {
        return 'failed';
    }
}

const DETECT_WRITER_SOURCE = {
    flagWrite: /window\.blockingAds\s*=/,
    read: /Cookies\.get\(\s*['"]ab['"]\s*\)/,
    write: /Cookies\.set\(\s*['"]ab['"]\s*,/,
};

/* 识别窗口的上界：只在 document-start 之后的有限时间内轮询 + DOMContentLoaded/load 各查一次 */
const DETECT_SCAN_INTERVAL = 400;
const DETECT_SCAN_BUDGET = 20000;

const DetectState = {
    site: null,
    enabled: false,
    applied: false,
    /** @type {Array<{name:string, orig:Function, wrapped:Function}>} 已包装的 writer */
    writers: [],
    /** @type {Array<{obj:object, prop:string, desc:object|null}>} 已改写的 areAdsBlocked 等 */
    records: [],
    /** @type {Map<string, object>} 已识别但未被包装的函数（诊断用，不留改写） */
    seen: new Map(),
    /* 首次识别 writer 时读到的 ab 原值（仅这一个非凭据键，用站点自己的 Cookies 接口读） */
    originalAb: null,
    abRestore: 'untouched',
    timer: 0,
    scanStartedAt: 0,
    observer: null,
    status: {
        detect: 'idle', reason: '', writer: 'unknown', serverState: 'pending',
        failed: false, partial: false, error: '', needsReload: false,
    },
};

/* 页面主 realm：优先 unsafeWindow；直连页面 window 要求 document.defaultView === window */
function detectPageWindow() {
    try {
        if (typeof unsafeWindow !== 'undefined' && unsafeWindow && unsafeWindow.document) return unsafeWindow;
    } catch (e) { /* 未授权 unsafeWindow */ }
    try {
        const w = typeof window !== 'undefined' ? window : null;
        if (!w || !w.document) return null;
        if (w.document.defaultView === w) return w;
    } catch (e) { /* 跨 realm 访问抛错 */ }
    return null;
}

function snapshotDescriptor(obj, prop) {
    try { return Object.getOwnPropertyDescriptor(obj, prop) || null; } catch (e) { return null; }
}

function restoreDescriptor(obj, prop, desc) {
    try {
        if (desc) Object.defineProperty(obj, prop, desc);
        else delete obj[prop];
        return true;
    } catch (e) { return false; }
}

/* 源码形态识别：必须三条原文同时命中，且不是已经包装过的函数 */
function detectIsWriterFn(win, fn) {
    if (typeof fn !== 'function') return false;
    if (fn.__modszhWriter) return false;
    let src = '';
    try { src = Function.prototype.toString.call(fn); } catch (e) { return false; }
    if (src.indexOf('window.blockingAds') === -1) return false;
    if (!DETECT_WRITER_SOURCE.read.test(src)) return false;
    if (!DETECT_WRITER_SOURCE.write.test(src)) return false;
    // 只认窗口上挂着的函数（writer 是全局声明），排除原型/闭包里的同名形
    try {
        if (win[fn.name] !== fn) return false;
    } catch (e) { return false; }
    return true;
}

/* 广告检测参数固定为 false 的 wrapper：保留 this 与其余参数（writer 只有第一个参数是检测标志） */
function detectMakeWrapper(orig) {
    const wrapped = function (blocking) {
        const rest = Array.prototype.slice.call(arguments, 1);
        return orig.apply(this, [false].concat(rest));
    };
    wrapped.__modszhWriter = true;
    wrapped.__modszhOrig = orig;
    try {
        Object.defineProperty(wrapped, 'name', { value: orig.name, configurable: true });
    } catch (e) { /* name 只读：不影响识别（识别用 __modszhWriter 标记） */ }
    return wrapped;
}

function detectPatchProp(win, prop, value, kind) {
    const desc = snapshotDescriptor(win, prop);
    if (desc && desc.configurable === false) return { ok: false, reason: 'non-configurable:' + prop };
    try {
        Object.defineProperty(win, prop, {
            configurable: true,
            enumerable: desc ? !!desc.enumerable : true,
            get() { return value; },
            set() { /* 站点回写检测结果：吞掉，保持「未拦截」 */ },
        });
        DetectState.records.push({ obj: win, prop, desc, kind });
        return { ok: true };
    } catch (e) {
        return { ok: false, reason: prop + ':' + String((e && e.message) || e) };
    }
}

/* 有界识别：轮询 + DOMContentLoaded/load 各一次；超时即停，不留计时器 */
function detectStartScan() {
    if (detectStartScan.started) return;
    detectStartScan.started = true;
    DetectState.scanStartedAt = Date.now();
    /* 单一循环：每轮都尝试识别，直到命中（写状态并停）或超预算。
     * 命中前即使 status 被别处改写也不会漏扫 —— 只有 writers 非空才算完成。 */
    const tick = () => {
        DetectState.timer = 0;
        if (!DetectState.enabled) return;
        detectScanOnce();
        if (DetectState.writers.length) {
            detectStopScan();
            detectUpdateServerState();
            detectFinish();
            return;
        }
        if (Date.now() - DetectState.scanStartedAt > DETECT_SCAN_BUDGET) {
            detectStopScan();
            detectFinish();
            return;
        }
        DetectState.timer = setTimeout(tick, DETECT_SCAN_INTERVAL);
    };
    DetectState.timer = setTimeout(tick, 0);
    try {
        document.addEventListener('DOMContentLoaded', () => { if (DetectState.enabled) detectScanOnce(); }, { once: true });
        window.addEventListener('load', () => { if (DetectState.enabled) detectScanOnce(); }, { once: true });
    } catch (e) { /* document 不可用时只靠轮询 */ }
}

function detectStopScan() {
    if (DetectState.timer) { clearTimeout(DetectState.timer); DetectState.timer = 0; }
}

/* 扫描并包装：每命中一个 writer 就包装一次；不会重复包装（__modszhWriter 标记） */
function detectScanOnce() {
    const win = detectPageWindow();
    if (!win) return 0;
    let n = 0;
    let names = [];
    try { names = Object.getOwnPropertyNames(win); } catch (e) { return 0; }
    for (const name of names) {
        let fn;
        try { fn = win[name]; } catch (e) { continue; }
        if (!detectIsWriterFn(win, fn)) continue;
        try { win[name] = detectMakeWrapper(fn); } catch (e) { continue; }
        DetectState.writers.push({ name, orig: fn, wrapped: win[name] });
        DetectState.seen.set(name, { wrapped: true });
        if (DetectState.originalAb === null) {
            // 只读这一个非凭据键，用于关闭时按站点契约写回；不做任何解析
            try {
                const c = win.Cookies && typeof win.Cookies.get === 'function' ? win.Cookies.get('ab') : undefined;
                DetectState.originalAb = c === undefined ? undefined : c;
            } catch (e) { DetectState.originalAb = undefined; }
        }
        n++;
    }
    // 旧站的 areAdsBlocked 只读 window.blockingAds：一并改成恒 false（可逆）
    if (n || DetectState.writers.length) {
        let hasFn = false;
        try { hasFn = typeof win.areAdsBlocked === 'function' && !DetectState.records.some(r => r.prop === 'areAdsBlocked'); } catch (e) { hasFn = false; }
        if (hasFn) {
            let src = '';
            try { src = Function.prototype.toString.call(win.areAdsBlocked); } catch (e) { src = ''; }
            if (/window\.blockingAds/.test(src)) {
                const d = snapshotDescriptor(win, 'areAdsBlocked');
                if (d && d.configurable === false) {
                    // 不可配置就不尝试：不制造 partial，如实写进原因
                    DetectState.status.error = (DetectState.status.error ? DetectState.status.error + '; ' : '') +
                        'areAdsBlocked(non-configurable，未改写)';
                } else {
                    detectPatchProp(win, 'areAdsBlocked', function () { return false; }, 'areAdsBlocked');
                }
            }
        }
    }
    return n;
}

/* 让 writer 以 false 走一遍：由原函数自己的 NexusConsent 门禁决定是否写 ab。
 * 返回 serverState：pending（未拿到 cookie 偏好，未写）/ attempted（已调用）。 */
function detectUpdateServerState() {
    const win = detectPageWindow();
    if (!win || !DetectState.writers.length) return DetectState.status.serverState;
    const w = DetectState.writers[DetectState.writers.length - 1];
    try {
        // 调用**原函数**（不是 wrapper）并显式传 false：保持它自己的 expiry/consent/写入逻辑
        w.orig.call(win, false);
    } catch (e) {
        DetectState.status.error = 'writer-call:' + String((e && e.message) || e);
        return DetectState.status.serverState;
    }
    let consent = null;
    try {
        consent = win.NexusConsent && typeof win.NexusConsent.get === 'function' ? win.NexusConsent.get() : null;
    } catch (e) { consent = null; }
    if (consent && consent.preferences) {
        DetectState.status.serverState = 'attempted';
        DetectState.status.reason = 'writer(false) 已执行，ab 由站点 NexusConsent 门禁写入';
    } else {
        DetectState.status.serverState = 'pending';
        DetectState.status.reason = 'writer(false) 已执行，但未取得 cookie 偏好（NexusConsent 未就绪）→ 未写 ab';
    }
    return DetectState.status.serverState;
}

/* 一次性状态汇总：识别结果 / 是否接管 / serverState */
function detectFinish() {
    if (!DetectState.writers.length) {
        if (!DetectState.status.error) {
            DetectState.status = {
                detect: 'unsupported',
                reason: '未识别到已取证 writer（本页没有旧站检测脚本）',
                writer: 'none',
                serverState: 'unsupported',
                failed: false,
                partial: false,
                error: '',
                needsReload: false,
            };
        }
        return;
    }
    DetectState.applied = true;
    DetectState.status = {
        detect: 'on',
        reason: DetectState.status.reason || 'writer 已包装（检测参数固定 false）',
        writer: 'wrapped:' + DetectState.writers.map(w => w.name).join(','),
        serverState: DetectState.status.serverState || 'pending',
        failed: false,
        partial: !!DetectState.status.error,
        error: DetectState.status.error || '',
        // 已经渲染的 SSR 档位不会在本页面内改变：恢复需要 reload，本模块不改 DOM 伪装成功
        needsReload: true,
    };
}

/* 完全回滚：还原 writer 名称、areAdsBlocked 等描述符、停扫描 */
function detectRollbackAll() {
    const win = detectPageWindow();
    let failed = 0;
    if (win) {
        for (let i = DetectState.writers.length - 1; i >= 0; i--) {
            const w = DetectState.writers[i];
            try {
                const cur = win[w.name];
                if (cur === w.wrapped || (typeof cur === 'function' && cur.__modszhOrig === w.orig)) {
                    win[w.name] = w.orig;
                } else if (cur === w.orig) {
                    // 已经是原函数（页面自己覆盖回来了）：无需还原
                } else {
                    failed++;
                }
            } catch (e) { failed++; }
        }
    }
    for (let i = DetectState.records.length - 1; i >= 0; i--) {
        const r = DetectState.records[i];
        if (!restoreDescriptor(r.obj, r.prop, r.desc)) failed++;
    }
    DetectState.writers = [];
    DetectState.records = [];
    detectStopScan();
    // 按 writer 自己的契约把 ab 写回开启前读到的值（同一作用域、同一过期时间）
    let ab = 'skipped';
    if (win && DetectState.originalAb !== null) {
        try { ab = detectRestoreAb(win, DetectState.originalAb); } catch (e) { ab = 'failed'; }
    }
    DetectState.originalAb = null;
    DetectState.abRestore = ab;
    if (DetectState.observer) {
        try { DetectState.observer.disconnect(); } catch (e) { /* ignore */ }
        DetectState.observer = null;
    }
    DetectState.applied = false;
    return failed;
}

/* 开关排队：连续点击串行执行，关闭后不会被排队中的开启改回 */
let detectPending = Promise.resolve();

function setDetectCompatEnabled(on) {
    const next = !!on;
    detectPending = detectPending.then(() => detectToggleNow(next), () => detectToggleNow(next));
    return detectPending;
}

function detectToggleNow(on) {
    if (!on) {
        const had = DetectState.writers.length + DetectState.records.length;
        const failed = detectRollbackAll();
        detectStartScan.started = false;
        DetectState.enabled = false;
        DetectState.status = {
            detect: failed ? 'failed' : 'off',
            reason: had ? 'writer 已还原为原函数（' + had + ' 处）' : '未改写（关闭状态）',
            writer: had ? 'restored' : 'none',
            serverState: 'pending',
            failed: failed > 0,
            partial: failed > 0 && failed < had,
            error: failed ? failed + ' 处无法还原' : '',
            // 已写过的 ab 与已渲染的档位不在本页面内回滚
            needsReload: had > 0,
            ab: DetectState.abRestore || 'untouched',
        };
        return Promise.resolve(DetectState.status);
    }
    const win = detectPageWindow();
    if (!win) {
        DetectState.enabled = false;
        DetectState.status = {
            detect: 'unsupported', reason: 'no-page-window', writer: 'unknown', serverState: 'unsupported',
            failed: false, partial: false,
            error: '拿不到页面主 realm（需 @grant unsafeWindow 或直连页面 window）', needsReload: false,
        };
        return Promise.resolve(DetectState.status);
    }
    DetectState.enabled = true;
    DetectState.status = {
        detect: 'pending', reason: '等待旧站 writer 出现', writer: 'scanning', serverState: 'pending',
        failed: false, partial: false, error: '', needsReload: false,
    };
    // 同步先扫一次：writer 已经在 document-start 之后定义时立刻命中
    detectScanOnce();
    if (DetectState.writers.length) {
        detectUpdateServerState();
        detectFinish();
        return Promise.resolve(DetectState.status);
    }
    // 开启/重开都要重新计时（之前可能已经用掉过预算或残留 started 标记）
    detectStartScan.started = false;
    detectStartScan();
    return Promise.resolve(DetectState.status);
}

function detectCompatibilityStatus() {
    const st = DetectState.status;
    return {
        detect: st.detect,
        enabled: DetectState.enabled,
        applied: DetectState.applied,
        writer: st.writer,
        writers: DetectState.writers.length,
        ab: DetectState.abRestore || 'untouched',
        serverState: st.serverState,
        reason: st.reason,
        failed: !!st.failed,
        partial: !!st.partial,
        error: st.error || '',
        needsReload: !!st.needsReload,
    };
}

/* 页面卸载：撤掉包装并停扫描（BFCache 恢复时按当前开关重建） */
function detectHandlePageHide() {
    detectStopScan();
    if (DetectState.applied) detectRollbackAll();
}

/* 只有已取证的站点才允许跑检测兼容：不在任意域名扫描或写全局 */
function cleanupSiteAllowed() {
    const id = CleanupState.site && CleanupState.site.id;
    return id === 'nexus' || id === 'thunderstore';
}

/* ------------------------------------------------------------------ 启动 */

function cleanupBootDetectOnly() {
    if (!cleanupSiteAllowed()) {
        DetectState.status = {
            detect: 'unsupported', reason: 'site-not-supported', writer: 'none', serverState: 'unsupported',
            failed: false, partial: false, error: '', needsReload: false,
        };
        return;
    }
    // 默认：旧 Nexus 上开（用户本轮明确要检测处理）；其他站点默认关，由菜单打开
    const fallback = !!(DetectState.site && DetectState.site.id === 'nexus');
    try {
        if (cleanupStoreGet(DETECT_KEY, fallback)) {
            setDetectCompatEnabled(true).catch(() => { /* 失败已回滚，状态在 status 里 */ });
        }
    } catch (e) {
        DetectState.status = {
            detect: 'failed', reason: 'boot', writer: 'unknown', serverState: 'pending',
            failed: true, partial: false, error: String((e && e.message) || e), needsReload: false,
        };
        detectRollbackAll();
    }
}

function cleanupBoot(site) {
    CleanupState.site = site;
    DetectState.site = site;
    cleanupBootDetectOnly();
    /* 生命周期只挂一次：pagehide 撤掉全部改写与扫描；
     * pageshow.persisted（BFCache 恢复）时按当前开关重新应用。 */
    if (!cleanupBoot.lifecycle) {
        cleanupBoot.lifecycle = true;
        window.addEventListener('pagehide', () => {
            detectHandlePageHide();
            cleanupStopObserver();
            cleanupRevert();
        });
        window.addEventListener('pageshow', (ev) => {
            if (!ev || !ev.persisted) return;
            if (DetectState.enabled) setDetectCompatEnabled(true).catch(() => { });
            if (CleanupState.enabled) setCleanupEnabled(true);
        });
    }
    setCleanupEnabled(cleanupStoreGet(CLEANUP_KEY, true));
}
