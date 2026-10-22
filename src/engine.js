/* =============================================================================
 * engine.js —— 文本驱动的界面中文化引擎
 *
 * 设计要点（与「只翻界面、不翻 UGC」的口径一致）：
 *   1. 按 hostname 选站点，按 pathname 选页型，合并 global + 页型 词条
 *   2. 遍历文本节点与白名单属性（placeholder / aria-label / title），
 *      命中字典或正则即替换
 *   3. 命中即停：译文本身不会再命中字典，因此重复扫描是幂等的，
 *      MutationObserver 不会被自身写入喂成死循环
 *   4. UGC 区域（描述、评论、代码、输入框）由站点 ignore 选择器整棵子树跳过
 *   5. 原文写入 WeakMap，支持一键还原
 * ========================================================================== */

const CONFIG = {
    MAX_LEN: 80,                                  // 默认正则长度门槛
    PATTERN_MAX_LEN: 240,                         // 动态界面模板专用上限
    ATTRS: ['placeholder', 'aria-label', 'title'], // 属性翻译白名单
    SKIP_TAGS: ['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'KBD',
        'TEXTAREA', 'SVG', 'CANVAS', 'TEMPLATE', 'IFRAME'],
    DEBOUNCE: 80,
    CJK: /[\u4e00-\u9fff\u3040-\u30ff]/,
};

const State = {
    site: null,
    page: null,
    dict: new Map(),
    patterns: [],
    cache: new Map(),      // 原文 -> 译文（含 null，表示不翻）
    ignoreSelector: '',
    originals: new WeakMap(), // 文本节点/属性宿主 -> 原文
    observer: null,
    timer: 0,
    enabled: true,
    writing: false,
    stats: { nodes: 0, attrs: 0 },
};

/* ------------------------------------------------------------------ 词条装配 */

function buildDict(site, page) {
    const dict = new Map();
    const groups = [site.dict.global, site.dict[page]];
    for (const group of groups) {
        if (!group) continue;
        for (const key of Object.keys(group)) {
            const val = group[key];
            if (typeof val === 'string' && val && val !== key) dict.set(key, val);
        }
    }
    State.dict = dict;
    State.patterns = site.patterns || [];
    State.cache.clear();
    State.ignoreSelector = site.ignore || '';
}

function detectSite() {
    const host = location.hostname;
    // 调试用：docs/demo/ 下的本地复现页没有真实域名，可用 window.__MODS_ZH_FORCE_SITE__ 指定站点 id
    const forced = (typeof window !== 'undefined' && window.__MODS_ZH_FORCE_SITE__) || '';
    for (const site of SITES) {
        if (forced && site.id === forced) return site;
        if (site.match.test(host)) return site;
    }
    return null;
}

function currentPage(site) {
    const forced = (typeof window !== 'undefined' && window.__MODS_ZH_FORCE_PAGE__) || '';
    return forced || site.detect(location.pathname, location.hostname);
}

/* ------------------------------------------------------------------ 文本翻译 */

function normalize(text) {
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * 查表：精确命中优先，其次正则。
 * @param {string} key 归一化后的原文
 * @returns {string|null} 译文；无命中返回 null
 */
function lookup(key) {
    if (State.cache.has(key)) return State.cache.get(key);
    if (CONFIG.CJK.test(key)) { State.cache.set(key, null); return null; } // 已是中日文
    if (/^[\s\d.,:%+\-/()（）]+$/.test(key)) { State.cache.set(key, null); return null; } // 纯数字符号

    let result = null;
    if (State.dict.has(key)) {
        // 精确白名单允许长帮助句；动态正则须完整锚定并受长度上限约束。
        result = State.dict.get(key);
    } else if (key.length <= CONFIG.MAX_LEN ||
        (State.site && State.site.id === 'thunderstore' && key.length <= CONFIG.PATTERN_MAX_LEN)) {
        for (const [re, to] of State.patterns) {
            if (!re.test(key)) continue;
            const out = typeof to === 'function' ? key.replace(re, to) : key.replace(re, to);
            if (out && out !== key) { result = out; break; }
        }
    }
    State.cache.set(key, result);
    return result;
}

function isIgnored(el) {
    if (!el) return true;
    if (State.ignoreSelector) {
        try {
            if (el.closest(State.ignoreSelector)) return true;
        } catch (e) { /* 选择器非法时忽略该层保护 */ }
    }
    if (el.isContentEditable) return true;
    if (CONFIG.SKIP_TAGS.indexOf(el.tagName) !== -1) return true;
    return false;
}

function translateTextNode(node) {
    const raw = node.nodeValue;
    if (!raw) return false;
    const key = normalize(raw);
    if (!key) return false;

    let hit = lookup(key);
    let authorPrefix = false;
    const parent = node.parentElement;

    // Thunderstore 的卡片常把静态 "by" 前缀包在 author 容器里；
    // 保留作者链接原文，只翻前缀，避免 ignore 规则连 UI 一起吞掉。
    if (State.site && State.site.id === 'thunderstore' && parent) {
        let authorContainer = null;
        try { authorContainer = parent.closest('[class*="author"],[class*="Author"]'); } catch (e) { /* ignore */ }
        if (authorContainer) {
            let authorLink = null;
            try { authorLink = parent.closest('a'); } catch (e) { /* ignore */ }
            if (authorLink) return false;
            const prefix = raw.match(/^(\s*)by(?=\s|$)/i);
            if (!prefix) return false;
            hit = prefix[1] + '作者' + raw.slice(prefix[0].length);
            authorPrefix = true;
        }
    }

    if (!hit || (!authorPrefix && hit === key)) return false;
    if (isIgnored(parent) && !authorPrefix) return false;

    if (!State.originals.has(node)) State.originals.set(node, raw);
    const lead = raw.match(/^\s*/)[0];
    const trail = raw.match(/\s*$/)[0];
    State.writing = true;
    node.nodeValue = authorPrefix ? hit : lead + hit + trail;
    State.writing = false;
    State.stats.nodes++;
    return true;
}

function translateAttributes(el) {
    let changed = false;
    for (const attr of CONFIG.ATTRS) {
        const raw = el.getAttribute(attr);
        if (!raw) continue;
        const key = normalize(raw);
        if (!key) continue;
        const hit = lookup(key);
        if (!hit || hit === key) continue;
        // Also honor ignore selectors on the attribute host itself, without suppressing textarea placeholders.
        if ((isIgnored(el) && el.tagName !== 'TEXTAREA') || isIgnored(el.parentElement)) continue;
        if (!State.originals.has(el)) State.originals.set(el, raw);
        el.setAttribute(attr, hit);
        changed = true;
        State.stats.attrs++;
    }
    return changed;
}

/* 统计文案常由数字节点和 React 注释拆开的文本组成。
 * 只在完整计数容器匹配时翻译分隔词，保留数字及其 DOM 结构。 */
function translateSplitResultCounter(root) {
    if (!root || !root.querySelectorAll) return;
    const resultRe = /^[\d,]+\s*-\s*[\d,]+ of [\d,]+ results?$/i;
    const doc = root.ownerDocument || root;

    for (const el of root.querySelectorAll('*')) {
        if (isIgnored(el) || !resultRe.test(normalize(el.textContent || ''))) continue;
        let nestedMatch = false;
        for (const child of el.children) {
            if (resultRe.test(normalize(child.textContent || ''))) { nestedMatch = true; break; }
        }
        if (nestedMatch) continue;

        const walker = doc.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */, null);
        const nodes = [];
        let node = walker.nextNode();
        while (node) { nodes.push(node); node = walker.nextNode(); }
        const write = (target, value, count = true) => {
            if (!target || target.nodeValue === value) return;
            if (!State.originals.has(target)) State.originals.set(target, target.nodeValue);
            State.writing = true;
            target.nodeValue = value;
            State.writing = false;
            if (count) State.stats.nodes++;
        };

        for (let i = 0; i < nodes.length; i++) {
            const textNode = nodes[i];
            const token = normalize(textNode.nodeValue || '').toLowerCase();
            if (token === 'of') {
                const previous = nodes[i - 1];
                if (previous && /^\s*[\d,]+\s*-\s*[\d,]+\s*$/.test(previous.nodeValue || '')) {
                    write(previous, (previous.nodeValue || '').replace(/\s+$/, ''), false);
                }
                write(textNode, '，共 ');
            } else if (token === 'results') {
                write(textNode, ' 条结果');
            } else if (token === 'result') {
                write(textNode, ' 条结果');
                const suffix = nodes[i + 1];
                if (suffix && normalize(suffix.nodeValue || '').toLowerCase() === 's') {
                    write(suffix, '', false);
                    i++;
                }
            }
        }
    }
}

/* 上传成功摘要含动态数量和 React 拆开的 community / 冒号；
 * 仅在完整摘要容器匹配时修正，避免改写 UGC 标点。 */
function translateSplitPackageListingSummary(root) {
    if (!root || !root.querySelectorAll) return;
    const summaryRe = /^(?:The package is listed in|软件包已发布到)\s+[\d,]+\s+(?:communities|community|个社区)\s*[:：]\s*$/i;
    const doc = root.ownerDocument || root;

    for (const el of root.querySelectorAll('*')) {
        if (isIgnored(el) || !summaryRe.test(normalize(el.textContent || ''))) continue;
        let nestedMatch = false;
        for (const child of el.children) {
            if (summaryRe.test(normalize(child.textContent || ''))) { nestedMatch = true; break; }
        }
        if (nestedMatch) continue;

        const walker = doc.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */, null);
        let node = walker.nextNode();
        while (node) {
            const raw = node.nodeValue || '';
            const value = raw
                .replace(/The package is listed in/i, '软件包已发布到')
                .replace(/\bcommunities?\b/i, '个社区')
                .replace(/:\s*$/, suffix => suffix.replace(':', '：'));
            if (value !== raw) {
                if (!State.originals.has(node)) State.originals.set(node, raw);
                State.writing = true;
                node.nodeValue = value;
                State.writing = false;
                State.stats.nodes++;
            }
            node = walker.nextNode();
        }
    }
}

/* Required 计数在 React SSR 中被注释拆成 "Required (" / 数字 / ")"；
 * 仅在完整计数容器吻合时翻译，避免误碰 UGC 里的普通单词。 */
function translateSplitRequiredCounter(root) {
    if (!root || !root.querySelectorAll) return;
    const requiredRe = /^(?:Required|必需依赖)\s*\(\s*[\d,]+\s*\)$/i;
    const doc = root.ownerDocument || root;

    for (const el of root.querySelectorAll('*')) {
        if (isIgnored(el) || !requiredRe.test(normalize(el.textContent || ''))) continue;
        let nestedMatch = false;
        for (const child of el.children) {
            if (requiredRe.test(normalize(child.textContent || ''))) { nestedMatch = true; break; }
        }
        if (nestedMatch) continue;

        const walker = doc.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */, null);
        const nodes = [];
        let node = walker.nextNode();
        while (node) { nodes.push(node); node = walker.nextNode(); }
        const write = (target, value) => {
            if (target.nodeValue === value) return;
            if (!State.originals.has(target)) State.originals.set(target, target.nodeValue);
            State.writing = true;
            target.nodeValue = value;
            State.writing = false;
            State.stats.nodes++;
        };

        for (const textNode of nodes) {
            const raw = textNode.nodeValue || '';
            const value = raw
                .replace(/\bRequired\b/i, '必需依赖')
                .replace(/(必需依赖)\s*\(/, '$1（')
                .replace(/\s*\)/g, '）');
            write(textNode, value);
        }

        // React 也可能把标签、空格与括号分成三个不同文本节点。
        for (let i = 0; i < nodes.length - 1; i++) {
            const left = nodes[i];
            const right = nodes[i + 1];
            if (/必需依赖\s+$/.test(left.nodeValue || '') && /^\s*（/.test(right.nodeValue || '')) {
                write(left, left.nodeValue.replace(/\s+$/, ''));
                write(right, right.nodeValue.replace(/^\s+/, ''));
            }
            if (/[\d,]+\s+$/.test(left.nodeValue || '') && /^\s*）/.test(right.nodeValue || '')) {
                write(left, left.nodeValue.replace(/\s+$/, ''));
                write(right, right.nodeValue.replace(/^\s+/, ''));
            }
        }
    }
}

/* ------------------------------------------------------------------ DOM 遍历 */

function scanRoot(root) {
    if (!root) return;
    const doc = root.ownerDocument || root;
    const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */, null);
    const batch = [];
    let n = walker.nextNode();
    while (n) {
        batch.push(n);
        n = walker.nextNode();
    }
    for (const node of batch) translateTextNode(node);
    translateSplitResultCounter(root);
    translateSplitRequiredCounter(root);
    translateSplitPackageListingSummary(root);

    if (root.querySelectorAll) {
        const sel = CONFIG.ATTRS.map(a => '[' + a + ']').join(',');
        for (const el of root.querySelectorAll(sel)) {
            if (isIgnored(el)) continue;
            translateAttributes(el);
        }
    }
}

function schedule() {
    if (!State.enabled) return;
    if (State.timer) return;
    State.timer = setTimeout(() => {
        State.timer = 0;
        if (!State.enabled) return;
        scanRoot(document.body);
    }, CONFIG.DEBOUNCE);
}

function startObserver() {
    if (State.observer || !document.body) return;
    State.observer = new MutationObserver((records) => {
        if (State.writing) return;
        for (const r of records) {
            if (r.type === 'characterData') { schedule(); return; }
            if (r.type === 'attributes') { schedule(); return; }
            if (r.addedNodes && r.addedNodes.length) { schedule(); return; }
        }
    });
    State.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: CONFIG.ATTRS,
    });
}

function stopObserver() {
    if (State.observer) { State.observer.disconnect(); State.observer = null; }
    if (State.timer) { clearTimeout(State.timer); State.timer = 0; }
}

/* ------------------------------------------------------------------ 开关 */

function restoreAll() {
    // 文本节点
    const walker = document.createTreeWalker(document.body, 4, null);
    let n = walker.nextNode();
    while (n) {
        if (State.originals.has(n)) n.nodeValue = State.originals.get(n);
        n = walker.nextNode();
    }
    // 属性
    for (const attr of CONFIG.ATTRS) {
        for (const el of document.querySelectorAll('[' + attr + ']')) {
            if (State.originals.has(el)) el.setAttribute(attr, State.originals.get(el));
        }
    }
}

function setEnabled(on) {
    State.enabled = !!on;
    if (State.enabled) {
        scanRoot(document.body);
        startObserver();
    } else {
        stopObserver();
        restoreAll();
    }
    return State.enabled;
}

/* ------------------------------------------------------------------ 生命周期 */

function onLocationChange() {
    if (!State.site) return;
    const page = currentPage(State.site);
    if (page === State.page) return;
    State.page = page;
    buildDict(State.site, page);
    State.originals = new WeakMap();
    if (State.enabled) scanRoot(document.body);
}

function boot() {
    State.site = detectSite();
    if (!State.site) return false;
    State.page = currentPage(State.site);
    buildDict(State.site, State.page);

    if (document.body) {
        if (State.enabled) scanRoot(document.body);
        startObserver();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            if (State.enabled) scanRoot(document.body);
            startObserver();
        }, { once: true });
    }
    return true;
}

/* ------------------------------------------------------------------ 调试出口 */

const API = {
    get version() { return typeof VERSION !== 'undefined' ? VERSION : 'dev'; },
    get site() { return State.site ? State.site.id : null; },
    get page() { return State.page; },
    get stats() { return { nodes: State.stats.nodes, attrs: State.stats.attrs }; },
    get enabled() { return State.enabled; },
    entries() { return State.dict.size; },
    setEnabled,
    rescan: () => scanRoot(document.body),
};
