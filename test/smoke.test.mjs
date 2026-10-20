/* smoke.test.mjs —— 构建产物冒烟测试
 *
 * 断言四类东西：
 *   1. 词条库完整性：键数达标、跨页型同键不同译视为冲突
 *   2. 引擎行为：命中字典 / 命中正则 / UGC 区域不动 / 属性翻译
 *   3. 开关：关闭后原文逐字还原
 *   4. 产物：dist 文件存在且能通过语法解析（由 vm 加载本身证明）
 *
 * 运行：npm test（需先 npm run build）
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert';
import { createDocument, mount, Element, MutationObserverStub } from './fake-dom.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist', 'mods-zh.user.js');

let passed = 0;
const failures = [];

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log('  ok   ' + name);
    } catch (e) {
        failures.push({ name, error: e });
        console.log('  FAIL ' + name + ' -> ' + e.message);
    }
}

/* ---------------------------------------------------------------- 1. 词条库审计 */

function auditLocals() {
    const ctx = vm.createContext({ console });
    for (const rel of ['src/locals/_registry.js', 'src/locals/thunderstore.js', 'src/locals/nexus.js']) {
        vm.runInContext(readFileSync(join(ROOT, rel), 'utf8'), ctx, { filename: rel });
    }
    return vm.runInContext('SITES.map(s => ({ id: s.id, dict: s.dict, patterns: (s.patterns||[]).length }))', ctx);
}

const sites = auditLocals();

/* ---------------------------------------------------------------- 2. 运行时夹具 */

function loadBundle(hostname, pathname) {
    const doc = createDocument();
    const sandbox = {
        console,
        document: doc,
        location: { hostname, pathname, href: 'https://' + hostname + pathname },
        history: { pushState() { }, replaceState() { } },
        MutationObserver: MutationObserverStub,
        addEventListener() { }, removeEventListener() { },
        setTimeout, clearTimeout,
        setInterval: () => 0, clearInterval: () => { },
        alert: () => { },
    };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(readFileSync(DIST, 'utf8'), sandbox, { filename: 'mods-zh.user.js' });
    return { sandbox, doc, api: sandbox.__MODS_ZH__ };
}

function buildTree(doc, spec) {
    const root = new Element('div');
    for (const item of spec) {
        if (typeof item === 'string') { root.addText(item); continue; }
        const el = new Element(item.tag, item.attrs);
        if (item.text) el.addText(item.text);
        root.appendChild(el);
    }
    return mount(doc.body, root, doc);
}

/* ---------------------------------------------------------------- 3. 测试 */

console.log('\n[词条库]');
test('两站点均已注册且带正则组', () => {
    const ids = sites.map(s => s.id);
    assert.strictEqual(sites.map(s => s.id).join(','), 'thunderstore,nexus');
    assert.ok(sites.every(s => s.patterns > 0));
});
test('词条总数 >= 200（去重后）', () => {
    let total = 0;
    for (const s of sites) {
        const keys = new Set();
        for (const group of Object.values(s.dict)) for (const k of Object.keys(group)) keys.add(k);
        total += keys.size;
    }
    assert.ok(total >= 200, '实际 ' + total);
});
test('同站跨页型同键不得给出不同译法', () => {
    for (const s of sites) {
        const seen = new Map();
        for (const [page, group] of Object.entries(s.dict)) {
            for (const [k, v] of Object.entries(group)) {
                if (seen.has(k)) {
                    assert.strictEqual(seen.get(k), v,
                        s.id + ' 的 "' + k + '" 在 ' + page + ' 与其它页型译法不一致');
                } else {
                    seen.set(k, v);
                }
            }
        }
    }
});
test('词条值不含英文 UI 原文（未翻译残留的显式占位除外）', () => {
    const allowSame = new Set(['API', 'WIKI', 'VORTEX', 'DMCA', 'Discord', 'Wiki', 'NPC', 'VR',
        'BepInEx', 'MelonLoader', 'NEXUS MODS', 'Vortex']);
    for (const s of sites) {
        for (const group of Object.values(s.dict)) {
            for (const [k, v] of Object.entries(group)) {
                if (allowSame.has(k)) continue;
                assert.notStrictEqual(k, v, s.id + ' 词条 "' + k + '" 译文等于原文');
            }
        }
    }
});

console.log('\n[Thunderstore 引擎]');
test('社区页导航与分类命中', () => {
    const { doc, api } = loadBundle('thunderstore.io', '/c/lethal-company/');
    const root = buildTree(doc, [
        { tag: 'a', text: 'Communities' },
        { tag: 'button', text: 'Upload package' },
        { tag: 'div', text: 'Sections' },
        { tag: 'div', text: 'All' },
        { tag: 'div', text: 'Asset Replacements' },
        { tag: 'div', text: 'Modpacks' },
        { tag: 'div', text: 'Tweaks & Quality Of Life' },
        { tag: 'div', text: 'Filters' },
    ]);
    api.rescan();
    const t = root.textContent;
    assert.ok(t.includes('社区'), 'Communities');
    assert.ok(t.includes('上传包'), 'Upload package');
    assert.ok(t.includes('分区'), 'Sections');
    assert.ok(t.includes('资源替换'), 'Asset Replacements');
    assert.ok(t.includes('整合包'), 'Modpacks');
    assert.ok(t.includes('调整与体验优化'), 'Tweaks & Quality Of Life');
});
test('结果计数与相对时间走正则', () => {
    const { doc, api } = loadBundle('thunderstore.io', '/c/lethal-company/');
    const root = buildTree(doc, [
        { tag: 'div', text: '1-20 of 19588 results' },
        { tag: 'div', text: '4 weeks ago' },
        { tag: 'div', text: '2 hours ago' },
        { tag: 'div', text: '30 days ago' },
    ]);
    api.rescan();
    const t = root.textContent;
    assert.ok(t.includes('1-20，共 19588 条结果'), t);
    assert.ok(t.includes('4 周前'), t);
    assert.ok(t.includes('2 小时前'), t);
    assert.ok(t.includes('30 天前'), t);
});
test('UGC 区域（描述）保持原文', () => {
    const { doc, api } = loadBundle('thunderstore.io', '/c/lethal-company/');
    buildTree(doc, [{
        tag: 'div', attrs: { class: 'package-description' },
        text: 'A simple and easy to use mod manager for many games using Thunderstore',
    }]);
    api.rescan();
    const desc = doc.body.querySelectorAll('[class*="description"]')[0];
    assert.ok(desc.textContent.startsWith('A simple'), desc.textContent);
});
test('placeholder 属性被翻译', () => {
    const { doc, api } = loadBundle('thunderstore.io', '/c/lethal-company/');
    buildTree(doc, [{ tag: 'input', attrs: { placeholder: 'Search' } }]);
    api.rescan();
    const input = doc.body.querySelectorAll('[placeholder]')[0];
    assert.strictEqual(input.getAttribute('placeholder'), '搜索');
});
test('包详情页专有词条生效', () => {
    const { doc, api } = loadBundle('thunderstore.io', '/c/lethal-company/p/BepInEx/BepInExPack/');
    const root = buildTree(doc, [
        { tag: 'button', text: 'Install with App' },
        { tag: 'div', text: 'Latest version' },
        { tag: 'div', text: 'Dependants' },
        { tag: 'div', text: 'Required (0)' },
        { tag: 'a', text: 'Changelog' },
    ]);
    api.rescan();
    const t = root.textContent;
    assert.ok(t.includes('使用 App 安装'), t);
    assert.ok(t.includes('最新版本'), t);
    assert.ok(t.includes('被依赖'), t);
    assert.ok(t.includes('必需依赖（0）'), t);
    assert.ok(t.includes('更新日志'), t);
});

console.log('\n[Nexus Mods 引擎]');
test('全站导航与详情页标签命中', () => {
    const { doc, api } = loadBundle('www.nexusmods.com', '/skyrimspecialedition/mods/266');
    const root = buildTree(doc, [
        { tag: 'a', text: 'MODS' },
        { tag: 'div', text: 'Endorsements' },
        { tag: 'div', text: 'Unique DLs' },
        { tag: 'div', text: 'Virus scan' },
        { tag: 'div', text: 'Safe to use' },
        { tag: 'a', text: 'Requirements' },
        { tag: 'a', text: 'Permissions and credits' },
    ]);
    api.rescan();
    const t = root.textContent;
    assert.ok(t.includes('模组'), 'MODS');
    assert.ok(t.includes('认可数'), 'Endorsements');
    assert.ok(t.includes('独立下载'), 'Unique DLs');
    assert.ok(t.includes('病毒扫描'), 'Virus scan');
    assert.ok(t.includes('可安全使用'), 'Safe to use');
    assert.ok(t.includes('前置要求'), 'Requirements');
    assert.ok(t.includes('权限与致谢'), 'Permissions and credits');
});
test('浏览页筛选器与分类命中', () => {
    const { doc, api } = loadBundle('www.nexusmods.com', '/games/skyrimspecialedition/mods');
    const root = buildTree(doc, [
        { tag: 'div', text: 'Hide filters' },
        { tag: 'div', text: 'CATEGORY' },
        { tag: 'div', text: 'Armour' },
        { tag: 'div', text: 'Body, Face, and Hair' },
        { tag: 'div', text: 'LANGUAGE SUPPORT' },
        { tag: 'div', text: 'Simplified Chinese' },
        { tag: 'div', text: 'Show only adult content' },
        { tag: 'div', text: 'No min' },
        { tag: 'div', text: '122,730 results' },
    ]);
    api.rescan();
    const t = root.textContent;
    assert.ok(t.includes('收起筛选'), 'Hide filters');
    assert.ok(t.includes('分类'), 'CATEGORY');
    assert.ok(t.includes('护甲'), 'Armour');
    assert.ok(t.includes('身体、面部与头发'), 'Body, Face, and Hair');
    assert.ok(t.includes('语言支持'), 'LANGUAGE SUPPORT');
    assert.ok(t.includes('简体中文'), 'Simplified Chinese');
    assert.ok(t.includes('仅显示成人内容'), 'Show only adult content');
    assert.ok(t.includes('无下限'), 'No min');
    assert.ok(t.includes('共 122,730 条结果'), t);
});
test('两种日期格式转换', () => {
    const { doc, api } = loadBundle('www.nexusmods.com', '/skyrimspecialedition/mods/266');
    const root = buildTree(doc, [
        { tag: 'div', text: '20 Oct 2026' },
        { tag: 'div', text: '06 September 2026, 6:22AM' },
        { tag: 'div', text: '36 minutes ago' },
    ]);
    api.rescan();
    const t = root.textContent;
    assert.ok(t.includes('2026年10月20日'), t);
    assert.ok(t.includes('2026年9月6日 06:22'), t);
    assert.ok(t.includes('36 分钟前'), t);
});
test('aria-label 属性被翻译', () => {
    const { doc, api } = loadBundle('www.nexusmods.com', '/games/skyrimspecialedition/mods');
    buildTree(doc, [{ tag: 'button', attrs: { 'aria-label': 'Show search' } }]);
    api.rescan();
    const btn = doc.body.querySelectorAll('[aria-label]')[0];
    assert.strictEqual(btn.getAttribute('aria-label'), '显示搜索');
});
test('Cookiebot 弹窗整棵子树跳过', () => {
    const { doc, api } = loadBundle('www.nexusmods.com', '/skyrimspecialedition/mods/266');
    const wrap = new Element('div', { id: 'CybotCookiebotDialog' });
    wrap.addText('Accept all');
    mount(doc.body, wrap, doc);
    api.rescan();
    assert.strictEqual(wrap.textContent, 'Accept all');
});

console.log('\n[开关]');
test('关闭后逐字还原原文', () => {
    const { doc, api } = loadBundle('thunderstore.io', '/communities/');
    const root = buildTree(doc, [
        { tag: 'a', text: 'Communities' },
        { tag: 'div', text: 'See all' },
        { tag: 'input', attrs: { placeholder: 'Search' } },
    ]);
    api.rescan();
    assert.ok(root.textContent.includes('社区'));
    api.setEnabled(false);
    assert.strictEqual(root.textContent.trim(), 'CommunitiesSee all');
    assert.strictEqual(doc.body.querySelectorAll('[placeholder]')[0].getAttribute('placeholder'), 'Search');
    api.setEnabled(true);
    assert.ok(root.textContent.includes('社区'));
});

/* ---------------------------------------------------------------- 4. 汇总 */

console.log('\n' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) {
    for (const f of failures) {
        console.error('\n--- ' + f.name + '\n' + (f.error && f.error.stack || f.error));
    }
    process.exit(1);
}
if (!existsSync(DIST)) {
    console.error('缺少产物：' + DIST);
    process.exit(1);
}
