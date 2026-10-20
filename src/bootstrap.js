/* =============================================================================
 * bootstrap.js —— 启动、菜单、持久化、URL 变化接管
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

/* 菜单：状态切换 + 手动重扫 + 版本 + 反馈入口 */
function registerMenu() {
    if (typeof GM_registerMenuCommand !== 'function') return;

    GM_registerMenuCommand(
        State.enabled ? '界面中文化：已开启（点击切回原文）' : '界面中文化：已关闭（点击开启）',
        () => {
            const on = setEnabled(!State.enabled);
            saveEnabled(on);
            if (typeof GM_unregisterMenuCommand === 'function' && State.menuId) {
                GM_unregisterMenuCommand(State.menuId);
            }
            registerMenu();
        }
    );

    GM_registerMenuCommand('重新扫描当前页面', () => {
        if (!State.enabled) return;
        State.cache.clear();
        State.originals = new WeakMap();
        scanRoot(document.body);
    });

    GM_registerMenuCommand('版本 v' + API.version + '（' + (State.site ? State.site.name : '未匹配站点') + '）', () => {
        const s = API.stats;
        alert('mods-zh v' + API.version +
            '\n站点：' + (State.site ? State.site.name : '未匹配') +
            '\n页型：' + State.page +
            '\n词条：' + State.dict.size + ' 条' +
            '\n已替换：文本 ' + s.nodes + ' 处，属性 ' + s.attrs + ' 处');
    });

    GM_registerMenuCommand('打开项目主页 / 反馈问题', () => openUrl(HOME_URL));
}

/* SPA 路由变化：history 劫持 + popstate + hashchange + 低频兜底 */
function watchUrl() {
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

    const ok = boot();
    if (!ok) return;

    registerMenu();
    watchUrl();

    // 调试出口：控制台可查 __MODS_ZH__.stats / .entries()
    try { window.__MODS_ZH__ = API; } catch (e) { /* 沙箱只读 */ }
})();
