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
    scoped: [],            // 页型上下文规则：只在该 DOM 上下文内查表（见 site.scoped）
    cache: new Map(),      // 原文 -> 译文（含 null，表示不翻）
    ignoreSelector: '',
    originals: new WeakMap(),     // 文本节点 -> 原文
    attrOriginals: new WeakMap(), // 元素 -> { 属性名: 原文 }，每个属性各自记录
    protectedNodes: new WeakSet(), // 动态名称文本节点（作者名等）：整节点不参与查表
    lastWritten: new WeakMap(),    // 文本节点 -> 本脚本最后写入的值（用于区分站点外写与自写）
    attrLastWritten: new WeakMap(), // 元素 -> { 属性名: 本脚本最后写入的值 }
    observer: null,
    timer: 0,
    enabled: true,
    writing: false,
    stats: { nodes: 0, attrs: 0 },
};

/* ------------------------------------------------------------------ 词条装配 */

/* 页型上下文规则装配：site.scoped = [{ pages?, selector, exclude?, dict?, patterns? }]
 * 只装配当前页型声明的规则；dict 过滤掉空值与同值，patterns 沿用「完整锚定」约定。
 * 用途：同一串在不同 DOM 上下文里含义不同（分类标签 vs mod 标题、下拉枚举 vs UGC），
 * 上下文里才翻，出了上下文一个字节都不动。 */
function buildScopedRules(site, page) {
    const rules = [];
    for (const rule of site.scoped || []) {
        if (!rule || !rule.selector) continue;
        // pages: 'all' 表示站点级组件（横幅等）在所有页型生效；数组则按页型精确装配
        if (rule.pages && rule.pages !== 'all' && rule.pages.indexOf(page) === -1) continue;
        /* 与全局词库不同，上下文规则里的「同值键」必须保留：Thunderstore 的分区/分类里
         * Developer Tools、DataBlocks (MTFO)、BepInEx 这类品牌名译文就是原文本身，
         * 但它们在筛选组里**不能**再被别的规则或 UGC 处理影响；
         * 保留后 lookupScoped 命中即返回同值，translateTextNode 的 hit === key 分支会原样跳过。 */
        const dict = new Map();
        const source = rule.dict || {};
        for (const key of Object.keys(source)) {
            const val = source[key];
            if (typeof val === 'string' && val) dict.set(key, val);
        }
        rules.push({
            selector: rule.selector,
            exclude: rule.exclude || '',
            allow: rule.allow || '',
            // include：可选的上下文标题锚点。同一种容器（如 Thunderstore 的 <details>）
            // 承载多组枚举（Sections / Categories），光靠容器选择器分不开；只有容器内存在
            // 与 include 完全一致的标题元素时才启用本条规则，避免同名串跨组误翻。
            include: rule.include || '',
            dict,
            patterns: rule.patterns || [],
            // rawPatterns：按**原始文本**匹配（不归一化空白），用于"固定前缀 + 用户输入值"这类
            // 必须逐字节保留值的内容（如已选筛选 chip 的 "Title: <用户输入>"）。
            rawPatterns: rule.rawPatterns || [],
        });
    }
    return rules;
}

function buildDict(site, page) {
    const dict = new Map();
    // 站点可声明 alias：{ 页型: 共享页型 }，例如 Thunderstore 的作者列表页
    // 复用社区页的列表 UI 词条。共享页型先铺，本页型后铺，本页型优先。
    const alias = site.alias && site.alias[page];
    const groups = alias && site.dict[alias]
        ? [site.dict.global, site.dict[alias], site.dict[page]]
        : [site.dict.global, site.dict[page]];
    for (const group of groups) {
        if (!group) continue;
        for (const key of Object.keys(group)) {
            const val = group[key];
            if (typeof val === 'string' && val && val !== key) dict.set(key, val);
        }
    }
    State.dict = dict;
    State.patterns = site.patterns || [];
    State.scoped = buildScopedRules(site, page);
    State.cache.clear();
    // 页型级 ignore：只在某些页型成立的忽略选择器（Thunderstore 面包屑末段在
    // author/package/community 是动态名称，在社区总览/上传/工具页却是固定 UI）。
    // 与 alias 一样按页型装配，换页型时重建，保证不漏配也不残留。
    const pageIgnore = (site.ignorePages && site.ignorePages[page]) || '';
    State.ignoreSelector = [site.ignore, pageIgnore].filter(Boolean).join(',');
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

/**
 * 上下文 raw 规则：与 lookupScoped 同样是"只在 rule.selector 子树内"，但直接匹配
 * 文本节点的原始值（nodeValue），不做空白归一化、不做 CJK/纯符号跳过。
 * 用于固定前缀 + 动态值同节点、且值必须逐字节保留的场景（chip 的 "Title: <用户输入>"）。
 * 替换一律走函数形式，值里的 $1 / $& / $` 不会被 String.replace 当替换模式解释。
 * @returns {boolean} 是否已改写该节点
 */
/* 站点在原地改写同一节点（筛选条件变化、SPA 局部刷新）时，nodeValue/属性值会变成新的站点原文。
 * MutationObserver 的回调是异步的（微任务之后才到），State.writing 那时早已复位，
 * 因此不能靠同步标记区分「自写」和「站点外写」；这里用 lastWritten 记录本脚本最后写入的值：
 *   · 当前值 == lastWritten  -> 是自写（或未被改写），保持原原文不动；
 *   · 当前值 != lastWritten  -> 站点外写，把原文更新为站点当前值，避免关闭开关回滚旧值。
 * WeakMap 不持有节点，节点被销毁后自动释放。 */
function refreshOriginal(node, raw) {
    const written = State.lastWritten.get(node);
    if (written !== undefined) {
        if (written === raw) return;                 // 自写：原文不动
        State.originals.set(node, raw);              // 站点在开启状态下改写
        State.lastWritten.delete(node);
        return;
    }
    // lastWritten 缺失有两种来源：① 从没写过；② 上一次关闭时还原过并清掉了记录。
    // 无论哪种，只要当前值与已记录原文不同，就是站点在关闭期间改写了该节点，
    // 原文必须跟进——否则再次关闭会复活过期值。
    if (State.originals.has(node) && State.originals.get(node) !== raw) {
        State.originals.set(node, raw);
    }
}

function translateScopedRaw(node, el) {
    if (!State.scoped.length || !el || typeof el.closest !== 'function') return false;
    const raw = node.nodeValue;
    if (!raw) return false;
    refreshOriginal(node, raw);
    for (const rule of State.scoped) {
        if (!rule.rawPatterns.length) continue;
        let host = null;
        try { host = el.closest(rule.selector); } catch (e) { host = null; }
        if (!host) continue;
        if (rule.exclude) {
            let blocked = false;
            try { blocked = !!el.closest(rule.exclude); } catch (e) { blocked = false; }
            if (blocked) continue;
        }
        if (rule.include && !scopedIncludeHit(host, rule.include)) continue;
        for (const [re, to] of rule.rawPatterns) {
            if (!re.test(raw)) continue;
            const out = raw.replace(re, to);
            if (!out || out === raw) continue;
            if (!State.originals.has(node)) State.originals.set(node, raw);
            State.writing = true;
            node.nodeValue = out;
            State.writing = false;
            State.lastWritten.set(node, out);
            State.stats.nodes++;
            return true;
        }
    }
    return false;
}

/* include 锚点：宿主容器内必须有一个元素，其 aria-label（若有）或归一化文本
 * 与 rule.include 完全一致（Thunderstore 的 <summary class="collapsible__header">Sections</summary>）。
 * 找不到就不启用该规则——分区（Sections）与分类（Categories）共用同一层 <details>。
 * host 取自 closest(rule.selector)：普通场景返回第二个参数元素本身，
 * 因此这里按 Element 处理（querySelectorAll 必须有）。 */
const INCLUDED_ANCHOR = 'summary, [aria-label], h1, h2, h3, h4, legend, .collapsible__header';
const INCLUDE_TARGETS = [
    ['Sections', '分区'],
    ['Categories', '分类'],
    ['Other filters', '其他筛选'],
];
/* 结构性锚点：容器自身就是稳定的 DOM 语义，没有可见标题可对照。
 *   CardPackageTags —— 卡片分类徽标容器（链接里带 includedCategories=<uuid>） */
const STRUCTURAL_INCLUDE = {
    CardPackageTags: (host) => !!host.querySelector && !!host.querySelector('a[href*="includedCategories="]'),
};
/* 锚点文本先看**本脚本记录过的原文**（State.originals），再看当前文本：
 * 标题本身也会被翻译（Sections → 分区），而逐节点扫描时锚点往往已经写过一遍，
 * 只看 textContent 会让二次扫描误判「找不到锚点」而丢规则。 */
function scopedIncludeHit(host, include) {
    if (!host || typeof host.querySelectorAll !== 'function') return false;
    if (STRUCTURAL_INCLUDE[include]) return STRUCTURAL_INCLUDE[include](host);
    const wanted = [include];
    for (const [en, zh] of INCLUDE_TARGETS) {
        if (include === en && zh !== en) { wanted.push(zh); break; }
    }
    const nodes = host.querySelectorAll(INCLUDED_ANCHOR);
    for (const node of nodes) {
        const aria = node.getAttribute && node.getAttribute('aria-label');
        const texts = [aria, node.textContent];
        const walker = node.nodeType === 1 && node.ownerDocument
            ? node.ownerDocument.createTreeWalker(node, 4 /* SHOW_TEXT */, null)
            : null;
        if (walker) {
            let n = walker.nextNode();
            while (n) { if (State.originals.has(n)) texts.push(State.originals.get(n)); n = walker.nextNode(); }
        }
        for (const raw of texts) {
            if (!raw) continue;
            const text = raw.replace(/\s+/g, ' ').trim();
            if (wanted.indexOf(text) !== -1) return true;
        }
    }
    return false;
}

/**
 * 页型上下文查表：只有当 rule.selector 命中 el 的祖先子树时才生效，命中即停。
 * 结果依赖上下文，因此不写 State.cache（缓存是「原文 -> 译文」的全局单值）。
 * allow：可选「放行选择器」。站点 ignore 把整个 /games/ 链接族保护起来后，
 * 固定导航/页脚里的同 href 链接也会被一起吞掉；规则声明 allow 时，命中 allow 的元素
 * 允许绕过 ignore（只用于这条规则自己的 selector 子树，ignore 本身不做任何删改）。
 * @param {Element|null} el 文本节点的父元素 / 属性宿主
 * @param {string} key 归一化后的原文
 * @param {boolean} mayIgnore 该节点是否已在 ignore 区（true 时只认带 allow 的规则）
 * @returns {string|null} 译文；无命中返回 null
 */
function lookupScoped(el, key, mayIgnore) {
    if (!State.scoped.length || !el || typeof el.closest !== 'function') return null;
    for (const rule of State.scoped) {
        let host = null;
        try { host = el.closest(rule.selector); } catch (e) { host = null; }
        if (!host) continue;
        if (mayIgnore) {
            if (!rule.allow) continue;
            // 硬 UGC（嵌套在容器里的 UGC 结构）永远优先：任何 allow 都不能穿过它
            if (siteHardUgcHit(el)) continue;
            let ok = false;
            try { ok = !!el.closest(rule.allow); } catch (e) { ok = false; }
            if (!ok) continue;
        }
        if (rule.exclude) {
            let blocked = false;
            try { blocked = !!el.closest(rule.exclude); } catch (e) { blocked = false; }
            if (blocked) continue;
        }
        if (rule.include && !scopedIncludeHit(host, rule.include)) continue;
        if (rule.dict.has(key)) return rule.dict.get(key);
        for (const [re, to] of rule.patterns) {
            if (!re.test(key)) continue;
            const out = key.replace(re, to);
            if (out && out !== key) return out;
        }
    }
    return null;
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

/* 硬 UGC：这些结构无论在哪个固定 UI 容器里都保持原文。
 * 与站点 ignore 的区别：ignore 是「默认不翻」，allow 可以在已取证的固定容器里放行；
 * 硬 UGC 则**不可被 allow 穿透**（模组标题、作者链接、描述正文、文件名、代码）。
 * 由站点声明 site.hardUgc；未声明时为空（不影响任何既有站点行为）。 */
function siteHardUgcSelector() {
    return (State.site && State.site.hardUgc) || '';
}

function siteHardUgcHit(el) {
    const sel = siteHardUgcSelector();
    if (!sel || !el || typeof el.closest !== 'function') return false;
    try { return !!el.closest(sel); } catch (e) { return false; }
}

/* 所有带 allow 的上下文规则的放行选择器并集：文本节点是否落在「被显式放行的固定 UI」里。
 * 没有规则声明 allow 时返回空串，closest('') 会抛错，调用处按 try/catch 处理为不放行。 */
function scopedAllowSelector() {
    const list = [];
    for (const rule of State.scoped) if (rule.allow) list.push(rule.allow);
    return list.join(',');
}

function translateTextNode(node) {
    // 动态名称（作者/团队名）节点整节点跳过：名称可能正好等于某条界面词条
    if (State.protectedNodes.has(node)) return false;
    const raw = node.nodeValue;
    if (!raw) return false;
    // 站点外写（同一节点被改成新内容）时先刷新原文，再按新内容查表
    refreshOriginal(node, raw);
    const key = normalize(raw);
    if (!key) return false;

    const parent = node.parentElement;
    // 上下文 raw 规则（固定前缀 + 需逐字节保留的值）优先；忽略区域不参与
    if (!isIgnored(parent) && translateScopedRaw(node, parent)) return true;
    /* 顺序：上下文规则优先、全局词库兜底。同一串在固定 UI 容器里可能是站点枚举
     * （Thunderstore 分类 Cards → 卡牌），在别处是同形的展示控件 header（Cards → 卡片）；
     * 反过来先查全局字典会把枚举吃掉，前面的 scoped 规则就形同虚设。 */
    // ignore 区（导航/页脚被整族保护的 /games/ 链接）：只认规则显式放行的那一层
    const ignored = isIgnored(parent);
    let hit = lookupScoped(parent, key, ignored);
    if (!hit && !ignored) hit = lookup(key);
    let authorPrefix = false;

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
    /* 上下文规则明确声明「原文即译文」（Thunderstore 分区/分类里的品牌名）时，
     * 该文本已经在正确的固定 UI 位置，不再做任何改写。 */
    if (State.scoped.length && hit === key) return false;
    // 硬 UGC 无论是否在放行容器里都保持原文
    if (siteHardUgcHit(parent)) return false;
    // 放行只对带 allow 的上下文规则成立；其他情况仍按原 ignore 口径拒绝
    if (isIgnored(parent) && !authorPrefix) {
        let allowed = false;
        try { allowed = !!parent && !!parent.closest(scopedAllowSelector()); } catch (e) { allowed = false; }
        if (!allowed) return false;
    }

    if (!State.originals.has(node)) State.originals.set(node, raw);
    const lead = raw.match(/^\s*/)[0];
    const trail = raw.match(/\s*$/)[0];
    const next = authorPrefix ? hit : lead + hit + trail;
    State.writing = true;
    node.nodeValue = next;
    State.writing = false;
    State.lastWritten.set(node, next);
    State.stats.nodes++;
    return true;
}

function translateAttributes(el) {
    let changed = false;
    for (const attr of CONFIG.ATTRS) {
        const raw = el.getAttribute(attr);
        if (!raw) continue;
        // 同一元素的 placeholder / aria-label / title 各自记原文，还原时才不会互相覆盖
        let record = State.attrOriginals.get(el);
        if (!record) { record = {}; State.attrOriginals.set(el, record); }
        let written = State.attrLastWritten.get(el);
        if (!written) { written = {}; State.attrLastWritten.set(el, written); }
        // 站点原地改写该属性：原文换成站点当前值。这一句必须放在"是否需要翻译"之前——
        // 站点改成的新值可能压根没有词条，此时若不更新原文，关闭开关会把它冲回旧值。
        if (attr in written) {
            if (written[attr] !== raw) {
                record[attr] = raw;
                delete written[attr];
            }
        } else if ((attr in record) && record[attr] !== raw) {
            // 关闭期间站点改写：记录里还是上一次的原文，同样要跟进
            record[attr] = raw;
        }
        const key = normalize(raw);
        if (!key) continue;
        const hit = lookup(key) || lookupScoped(el, key, false);
        if (!hit || hit === key) continue;
        // Also honor ignore selectors on the attribute host itself, without suppressing textarea placeholders.
        if ((isIgnored(el) && el.tagName !== 'TEXTAREA') || isIgnored(el.parentElement)) continue;
        if (!(attr in record)) record[attr] = raw;
        el.setAttribute(attr, hit);
        written[attr] = hit;
        changed = true;
        State.stats.attrs++;
    }
    return changed;
}

/* 页头「固定前缀 + 动态名称」：Thunderstore 的真实形态是
 *   <h1 class="… page-header__heading">Mods uploaded by <!-- -->Misc</h1>
 * React 注释把前缀和作者/团队名拆成两个文本节点，而名称可能正好等于某条界面词条
 * （Misc / Tools / All / Libraries / Cards / View / Deprecated …），整节点查表会被误翻成“杂项”。
 * 这里只改前缀文本节点，同一页头里其余文本节点标记为受保护，名称一个字节都不动；
 * 单文本节点形态同理（只替换其中的前缀片段）。站点用 namePrefixes 声明规则。
 */
function translateHeaderNamePrefix(root) {
    const rules = (State.site && State.site.namePrefixes) || [];
    if (!rules.length || !root || !root.querySelectorAll) return;
    const doc = root.ownerDocument || root;

    for (const rule of rules) {
        const targets = [];
        if (root.matches && root.matches(rule.selector)) targets.push(root);
        for (const el of root.querySelectorAll(rule.selector)) targets.push(el);

        for (const el of targets) {
            if (!rule.re.test(normalize(el.textContent || ''))) continue;

            const walker = doc.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */, null);
            const nodes = [];
            let node = walker.nextNode();
            while (node) { nodes.push(node); node = walker.nextNode(); }

            let prefixNode = null;
            for (const textNode of nodes) {
                const raw = textNode.nodeValue || '';
                const at = raw.indexOf(rule.from);
                if (at === -1) continue;
                const value = raw.slice(0, at) + rule.to + raw.slice(at + rule.from.length);
                if (!State.originals.has(textNode)) State.originals.set(textNode, raw);
                State.writing = true;
                textNode.nodeValue = value;
                State.writing = false;
                State.lastWritten.set(textNode, value);
                State.stats.nodes++;
                prefixNode = textNode;
                break;
            }

            // 前缀之外的一切都是动态名称，整节点受保护（含重复扫描时的幂等路径）
            for (const textNode of nodes) {
                if (textNode !== prefixNode) State.protectedNodes.add(textNode);
            }
        }
    }
}

/* 统计文案常由数字节点和 React 注释拆开的文本组成。
 * 只在完整计数容器匹配时翻译分隔词，保留数字及其 DOM 结构。 */
function translateSplitResultCounter(root) {
    if (!root || !root.querySelectorAll) return;
    // 区间形态 1-20 of 868 results；末页 / 仅一条时不带区间：1 of 1 result、21 of 21 results
    const resultRe = /^[\d,]+(?:\s*-\s*[\d,]+)? of [\d,]+ results?$/i;
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
            State.lastWritten.set(target, value);
            if (count) State.stats.nodes++;
        };

        for (let i = 0; i < nodes.length; i++) {
            const textNode = nodes[i];
            const token = normalize(textNode.nodeValue || '').toLowerCase();
            if (token === 'of') {
                const previous = nodes[i - 1];
                if (previous && /^\s*[\d,]+(?:\s*-\s*[\d,]+)?\s*$/.test(previous.nodeValue || '')) {
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
                State.lastWritten.set(node, value);
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
            State.lastWritten.set(target, value);
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
    translateHeaderNamePrefix(root);
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
    // 文本节点：只回写"本脚本最后写入、且之后没被站点改写"的节点。
    // 当前值与 lastWritten 不一致 ⇒ 站点（含关闭期间）已经改写，以站点当前值为准，
    // 把原文更新为它并跳过回写，避免关闭操作复活过期内容。
    const walker = document.createTreeWalker(document.body, 4, null);
    let n = walker.nextNode();
    while (n) {
        const written = State.lastWritten.get(n);
        if (written !== undefined) {
            const current = n.nodeValue;
            if (current !== written) {
                State.originals.set(n, current);
            } else if (State.originals.has(n)) {
                n.nodeValue = State.originals.get(n);
            }
            State.lastWritten.delete(n);
        }
        n = walker.nextNode();
    }
    // 属性：逐元素逐属性还原，placeholder / aria-label / title 各自独立。
    // 只处理本脚本写过的属性；站点在关闭期间移除的不要复活，改写的以当前值为准。
    const attrSelector = CONFIG.ATTRS.map(a => '[' + a + ']').join(',');
    for (const el of document.querySelectorAll(attrSelector)) {
        const record = State.attrOriginals.get(el);
        const written = State.attrLastWritten.get(el);
        if (!record || !written) continue;
        for (const attr of Object.keys(written)) {
            const current = el.getAttribute(attr);
            if (current === null) { delete record[attr]; continue; }              // 站点已移除：不复活
            if (current !== written[attr]) { record[attr] = current; continue; }  // 站点已改写：以当前值为准
            if (attr in record) el.setAttribute(attr, record[attr]);
        }
        State.attrLastWritten.delete(el);
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
    // 只重建「按页型装配」的东西（词条/正则/上下文规则/ignore，buildDict 内完成）与页头名称保护；
    // 原文容器必须保留：SPA 切页不销毁导航、筛选控件等节点，重建会让这些节点的原文丢失，
    // 关闭开关时无法逐字还原（originals / attrOriginals / lastWritten 均为 WeakMap，随节点回收）。
    State.protectedNodes = new WeakSet();
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
