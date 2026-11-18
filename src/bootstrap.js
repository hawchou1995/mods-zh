/* =============================================================================
 * bootstrap.js —— 启动、菜单、持久化、URL 变化接管
 *
 * 三个开关各自持久化、互不替代：
 *   · 界面中文化  GM key modsZh.enabled       （State.enabled）
 *   · 广告净化    GM key modsZh.cleanup       （CleanupState，见 cleanup.js）
 *   · 检测兼容    GM key modsZh.detectCompat  （DetectState，见 cleanup.js）
 * 菜单每个开关只注册一次，切换时只改自己那一项的文案（不重复注册、不改顺序），
 * 因此反复切换不会累积菜单项；首次切换时才查 ScriptCat/GM 契约（GM_unregisterMenuCommand 存在时优先用它重挂）。
 * ========================================================================== */

const STORE_KEY = 'modsZh.enabled';
const HOME_URL = 'https://github.com/hawchou1995/mods-zh';

function loadEnabled() {
    try {
        if (typeof GM_getValue === 'function') {
            const v = GM_getValue(STORE_KEY, true);
            return v === undefined ? true : !!v;
        }
    } catch (e) { /* 无 GM 环境 */ }
    try {
        const v = localStorage.getItem(STORE_KEY);
        return v === null ? true : v === '1';
    } catch (e) { /* 隐私模式 */ }
    return true;
}

function saveEnabled(on) {
    try {
        if (typeof GM_setValue === 'function') { GM_setValue(STORE_KEY, on); return; }
    } catch (e) { /* ignore */ }
    try { localStorage.setItem(STORE_KEY, on ? '1' : '0'); } catch (e) { /* ignore */ }
}

function openUrl(url) {
    if (typeof GM_openInTab === 'function') { GM_openInTab(url, { active: true }); return; }
    window.open(url, '_blank');
}

/* 菜单项登记表：id -> 当前注册句柄。切换时优先「就地改文案」：
 * GM_registerMenuCommand 没有 update 接口，因此用 unregister + register 重挂**同一槽位**，
 * 保证菜单项数量恒定、顺序不变。管理器不支持 unregister 时退化为只注册一次（文案在再次点击时更新）。 */
const MenuSlots = {
    i18n: { key: null, handle: null, label: () => '', action: null },
    ads: { key: null, handle: null, label: () => '', action: null },
    detect: { key: null, handle: null, label: () => '', action: null },
};

function registerSlot(slot) {
    if (typeof GM_registerMenuCommand !== 'function') return false;
    slot.handle = GM_registerMenuCommand(slot.label(), slot.action);
    return true;
}

function refreshSlot(slot) {
    // 支持 unregister 的管理器：重挂同一槽位，文案即时更新、数量不变
    if (typeof GM_unregisterMenuCommand === 'function' && slot.handle !== null && slot.handle !== undefined) {
        try {
            GM_unregisterMenuCommand(slot.handle);
        } catch (e) { /* 句柄已失效：继续重挂 */ }
        slot.handle = null;
        return registerSlot(slot);
    }
    return true;
}

function cleanupSummary() {
    try { return cleanupStatus(); } catch (e) { return { ads: 'failed', reason: String(e && e.message || e) }; }
}

function detectSummary() {
    try { return detectCompatibilityStatus(); } catch (e) {
        return { detect: 'failed', failed: true, error: String(e && e.message || e) };
    }
}

function adsLabel() {
    const st = cleanupSummary();
    if (st.ads === 'on') return '广告净化：已开启（点击关闭并还原）';
    if (st.ads === 'off') return '广告净化：已关闭（点击开启）';
    if (st.ads === 'unsupported') return '广告净化：当前页面无已取证规则';
    return '广告净化：未知状态（' + (st.reason || st.ads) + '）';
}

function detectLabel() {
    const st = detectSummary();
    if (st.detect === 'on') {
        return '检测兼容：已开启（writer ' + (st.writers || 0) + ' 个，档位 ' + (st.serverState || 'pending') +
            (st.partial ? '，部分失败' : '') + '，点击关闭）';
    }
    if (st.detect === 'pending') return '检测兼容：等待站点检测脚本出现（可刷新页面）';
    // 拿不到页面主 realm 或不支持的页：如实显示不可用，绝不显示「已开启」
    if (st.detect === 'unsupported' || st.detect === 'sandbox') {
        return '检测兼容：不可用（' + (st.reason || 'no-page-window') + '，点击重试）';
    }
    if (st.detect === 'failed') return '检测兼容：失败（' + (st.error || '未知') + '，点击重试）';
    return '检测兼容：已关闭（点击开启）';
}

function detectionAlert(st) {
    const lines = ['检测兼容状态：' + st.detect];
    if (st.reason) lines.push('原因：' + st.reason);
    if (st.error) lines.push('说明：' + st.error);
    lines.push('已识别 writer：' + (st.writers || 0) + ' 个（' + (st.writer || '-') + '）');
    lines.push('服务端档位：' + (st.serverState || 'pending') +
        '（pending = 未取得 cookie 偏好，未写 ab；档位要刷新页面后才会变）');
    lines.push(st.needsReload ? '已发出的请求与 SSR 档位不会在本页内变化，需要刷新页面。' : '无需刷新。');
    lines.push('只包装站点自己的检测 writer（检测参数固定 false），不改 download-url、不伪造 Premium。');
    if (st.partial) lines.push('部分成功：' + (st.error || '-'));
    alert(lines.join(String.fromCharCode(10)));
}

/* 菜单：三个开关 + 手动重扫 + 状态 + 反馈入口。每个开关只注册一次。 */
function registerMenu() {
    if (typeof GM_registerMenuCommand !== 'function') return;

    MenuSlots.i18n.label = () => (State.enabled ? '界面中文化：已开启（点击切回原文）' : '界面中文化：已关闭（点击开启）');
    MenuSlots.i18n.action = () => {
        const on = setEnabled(!State.enabled);
        saveEnabled(on);
        refreshSlot(MenuSlots.i18n);
    };

    MenuSlots.ads.label = adsLabel;
    MenuSlots.ads.action = () => {
        const next = !CleanupState.enabled;
        setCleanupEnabled(next);
        cleanupStoreSet(CLEANUP_KEY, next);
        refreshSlot(MenuSlots.ads);
    };

    MenuSlots.detect.label = detectLabel;
    MenuSlots.detect.action = () => {
        const next = !DetectState.enabled;
        setDetectCompatEnabled(next).then((st) => {
            cleanupStoreSet(DETECT_KEY, next && st && st.detect === 'on');
            refreshSlot(MenuSlots.detect);
            // 隔离 realm / 拿不到主 realm 不会 reject，但结果同样不可用：弹可见状态，不假装成功
            if (st && (st.detect === 'sandbox' || st.detect === 'unsupported' || st.detect === 'failed')) {
                DetectState.enabled = false;
                cleanupStoreSet(DETECT_KEY, false);
                refreshSlot(MenuSlots.detect);
            }
            detectionAlert(detectSummary());
        }, (err) => {
            // 失败也要落状态：菜单文案变成「失败」，并弹出可见错误
            cleanupStoreSet(DETECT_KEY, false);
            DetectState.enabled = false;
            refreshSlot(MenuSlots.detect);
            detectionAlert({ detect: 'failed', failed: true, error: String((err && err.message) || err), reason: 'toggle', needsReload: false });
        });
    };

    registerSlot(MenuSlots.i18n);
    registerSlot(MenuSlots.ads);
    registerSlot(MenuSlots.detect);

    GM_registerMenuCommand('重新扫描当前页面', () => {
        if (!State.enabled) return;
        State.cache.clear();
        // 原文容器不清空：重扫不能丢掉已翻译节点的原文，否则关闭开关无法逐字还原
        State.protectedNodes = new WeakSet();
        scanRoot(document.body);
    });

    GM_registerMenuCommand('版本 v' + API.version + '（' + (State.site ? State.site.name : '未匹配站点') + '）', () => {
        const s = API.stats;
        const ads = cleanupSummary();
        const det = detectSummary();
        alert('mods-zh v' + API.version +
            '\n站点：' + (State.site ? State.site.name : '未匹配') +
            '\n页型：' + State.page +
            '\n词条：' + State.dict.size + ' 条' +
            '\n已替换：文本 ' + s.nodes + ' 处，属性 ' + s.attrs + ' 处' +
            '\n广告净化：' + ads.ads + '（' + (ads.reason || '-') + '）' +
            '\n检测兼容：' + det.detect + '（' + (det.patched || 0) + ' 处）');
    });

    GM_registerMenuCommand('打开项目主页 / 反馈问题', () => openUrl(HOME_URL));
}

/* SPA 路由变化：history 劫持 + popstate + hashchange + 低频兜底（只建一次） */
function watchUrl() {
    if (watchUrl.started) return;
    watchUrl.started = true;
    let last = location.href;
    const tick = () => {
        if (location.href === last) return;
        last = location.href;
        onLocationChange();
    };
    for (const fn of ['pushState', 'replaceState']) {
        const orig = history[fn];
        if (typeof orig !== 'function') continue;
        history[fn] = function () {
            const ret = orig.apply(this, arguments);
            setTimeout(tick, 0);
            return ret;
        };
    }
    window.addEventListener('popstate', tick);
    window.addEventListener('hashchange', tick);
    setInterval(tick, 700);
}

(function main() {
    State.enabled = loadEnabled();

    // 站点匹配独立于汉化开关：关掉汉化后，广告净化与检测兼容仍按各自开关工作
    State.site = detectSite();
    State.page = State.site ? currentPage(State.site) : null;
    if (State.site) {
        cleanupBoot(State.site);
        const ok = boot();
        if (!ok) return;
        registerMenu();
        watchUrl();
    }

    // 调试出口：控制台可查 __MODS_ZH__.stats / .ads() / .detect()
    try {
        API.ads = cleanupStatus;
        API.detect = detectCompatibilityStatus;
        API.setCleanupEnabled = setCleanupEnabled;
        API.setDetectCompatEnabled = setDetectCompatEnabled;
        window.__MODS_ZH__ = API;
    } catch (e) { /* 沙箱只读 */ }
    // 检测兼容不依赖汉化是否启动（站点匹配失败时也按已存偏好执行一次）
    if (!State.site) {
        try { cleanupBootDetectOnly(); } catch (e) { /* 状态已在内部记录 */ }
    }
})();
