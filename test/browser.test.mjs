/* browser.test.mjs —— jsdom 集成测试（真实 DOM + 真实 MutationObserver + 真实选择器）
 *
 * 与 smoke.test.mjs 的分工：
 *   smoke   —— 用自写最小 DOM 跑得快，验证词条/查表/开关的纯逻辑
 *   browser —— 用 jsdom 跑同一份 dist 产物，验证真实 DOM 语义：
 *              属性翻译、UGC 区域跳过、动态插入节点被 MutationObserver 接管
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist', 'mods-zh.user.js');
const CODE = readFileSync(DIST, 'utf8');

const TS_HTML = `<!DOCTYPE html><html><body>
  <nav><a>Communities</a><button>Upload package</button></nav>
  <form><input placeholder="Search"></form>
  <section>
    <div>Sections</div><div>All</div><div>Asset Replacements</div>
    <div>Modpacks</div><div>Other filters</div><div>Deprecated</div>
    <div>1-20 of 19588 results</div><div>4 weeks ago</div>
  </section>
  <div class="package-description">A simple and easy to use mod manager</div>
  <div id="later"></div>
</body></html>`;

const NX_HTML = `<!DOCTYPE html><html><body>
  <nav><a>MODS</a><a>COLLECTIONS</a></nav>
  <button aria-label="Show search"></button>
  <div>Endorsements</div><div>Unique DLs</div><div>Virus scan</div>
  <div>Virus scan</div><div>Requirements</div>
  <div>06 September 2026, 6:22AM</div><div>122,730 results</div>
  <div class="mod-description">The Unofficial Patch fixes hundreds of bugs</div>
</body></html>`;

function boot(html, url) {
    const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
    dom.window.eval(CODE);
    return dom;
}

const wait = ms => new Promise(r => setTimeout(r, ms));
let passed = 0;
const failures = [];

async function test(name, fn) {
    try {
        await fn();
        passed++;
        console.log('  ok   ' + name);
    } catch (e) {
        failures.push({ name, error: e });
        console.log('  FAIL ' + name + ' -> ' + e.message);
    }
}

console.log('\n[jsdom · Thunderstore]');

await test('页面文本被替换且 UGC 原文保留', async () => {
    const dom = boot(TS_HTML, 'https://thunderstore.io/c/lethal-company/');
    const d = dom.window.document;
    const t = d.body.textContent;
    assert.ok(t.includes('社区'), 'Communities 未翻译：' + t);
    assert.ok(t.includes('上传包'), 'Upload package 未翻译');
    assert.ok(t.includes('资源替换'), 'Asset Replacements 未翻译');
    assert.ok(t.includes('整合包'), 'Modpacks 未翻译');
    assert.ok(t.includes('1-20，共 19588 条结果'), '结果计数未翻译');
    assert.ok(t.includes('4 周前'), '相对时间未翻译');
    assert.strictEqual(
        d.querySelector('.package-description').textContent,
        'A simple and easy to use mod manager'
    );
    dom.window.close();
});

await test('placeholder 属性被翻译', async () => {
    const dom = boot(TS_HTML, 'https://thunderstore.io/c/lethal-company/');
    assert.strictEqual(dom.window.document.querySelector('input').getAttribute('placeholder'), '搜索');
    dom.window.close();
});

await test('动态插入节点被 MutationObserver 接管', async () => {
    const dom = boot(TS_HTML, 'https://thunderstore.io/c/lethal-company/');
    const d = dom.window.document;
    const later = d.getElementById('later');
    later.innerHTML = '<div>Filters</div><div>Pinned</div><div>2 hours ago</div>';
    await wait(300);
    const t = later.textContent;
    assert.ok(t.includes('筛选器'), '动态节点 Filters 未翻译：' + t);
    assert.ok(t.includes('置顶'), '动态节点 Pinned 未翻译');
    assert.ok(t.includes('2 小时前'), '动态节点时间未翻译');
    dom.window.close();
});

await test('关闭开关后原文逐字还原', async () => {
    const dom = boot(TS_HTML, 'https://thunderstore.io/c/lethal-company/');
    const d = dom.window.document;
    const api = dom.window.__MODS_ZH__;
    assert.ok(api, '调试出口 __MODS_ZH__ 缺失');
    assert.ok(d.body.textContent.includes('社区'));
    api.setEnabled(false);
    assert.ok(d.body.textContent.includes('Communities'), '还原失败');
    assert.strictEqual(d.querySelector('input').getAttribute('placeholder'), 'Search');
    api.setEnabled(true);
    assert.ok(d.body.textContent.includes('社区'));
    dom.window.close();
});

console.log('\n[jsdom · Nexus Mods]');

await test('导航、统计标签、日期与计数被替换', async () => {
    const dom = boot(NX_HTML, 'https://www.nexusmods.com/skyrimspecialedition/mods/266');
    const d = dom.window.document;
    const t = d.body.textContent;
    assert.ok(t.includes('模组'), 'MODS 未翻译');
    assert.ok(t.includes('合集'), 'COLLECTIONS 未翻译');
    assert.ok(t.includes('认可数'), 'Endorsements 未翻译');
    assert.ok(t.includes('独立下载'), 'Unique DLs 未翻译');
    assert.ok(t.includes('病毒扫描'), 'Virus scan 未翻译');
    assert.ok(t.includes('前置要求'), 'Requirements 未翻译');
    assert.ok(t.includes('2026年9月6日 06:22'), '日期未转换：' + t);
    assert.ok(t.includes('共 122,730 条结果'), '结果计数未转换');
    assert.strictEqual(dom.window.document.querySelector('button').getAttribute('aria-label'), '显示搜索');
    dom.window.close();
});

await test('mod 描述区域保持原文', async () => {
    const dom = boot(NX_HTML, 'https://www.nexusmods.com/skyrimspecialedition/mods/266');
    assert.strictEqual(
        dom.window.document.querySelector('.mod-description').textContent,
        'The Unofficial Patch fixes hundreds of bugs'
    );
    dom.window.close();
});

await test('页面类型按 URL 判定', async () => {
    const mod = boot(NX_HTML, 'https://www.nexusmods.com/skyrimspecialedition/mods/266');
    assert.strictEqual(mod.window.__MODS_ZH__.page, 'mod');
    mod.window.close();

    const browse = boot(NX_HTML, 'https://www.nexusmods.com/games/skyrimspecialedition/mods');
    assert.strictEqual(browse.window.__MODS_ZH__.page, 'browse');
    browse.window.close();

    const ts = boot(TS_HTML, 'https://thunderstore.io/c/lethal-company/p/BepInEx/BepInExPack/');
    assert.strictEqual(ts.window.__MODS_ZH__.page, 'package');
    ts.window.close();
});

console.log('\n' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) {
    for (const f of failures) console.error('\n--- ' + f.name + '\n' + (f.error && f.error.stack || f.error));
    process.exit(1);
}
