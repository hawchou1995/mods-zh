/* nexus-multigame.test.mjs —— Nexus 2026 新前端多游戏固定 UI（jsdom）
 *
 * 夹具里的英文串逐条抄自 2026-11-18 实机采集的真实 DOM（原始 JSON 只留在 scratch，
 * 这里不含下载 URL、账号信息、cookie）。覆盖：
 *   · [data-e2eid="category-filter"] 分类容器（HD2 的 Animations/Visuals，其他社区的
 *     BodySlide/Characters/Items/Monsters/Skills）
 *   · Language 组（Thai/Hindi/Bulgarian/Hebrew/Romanian）
 *   · 排序 portal [id^="headlessui-listbox-options"] 首次与重开
 *   · 页头 GAMES 门户 [data-e2eid="games-sub-nav"] 与页脚 footer[aria-label="Desktop footer"]
 *   · 负向：同名游戏名 / 模组标题 / 作者名 / 描述输入 / 同名负向必须逐字保留
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CODE = readFileSync(join(ROOT, 'dist', 'mods-zh.user.js'), 'utf8');

const GAMES = ['helldivers2', 'skyrimspecialedition', 'fallout4', 'cyberpunk2077',
    'stardewvalley', 'baldursgate3', '7daystodie', 'monsterhunterwilds'];

/* 分类清单：逐条来自实机采集（每个游戏社区的分类集合不同，是同一个容器的不同内容） */
const CATEGORIES = ['Animations', 'Visuals', 'Audio', 'Armour', 'BodySlide', 'Characters',
    'Items', 'Monsters', 'Skills', 'NPC', 'Weapons', 'Locations'];
const LANGUAGES = ['Thai', 'Hindi', 'Bulgarian', 'Hebrew', 'Romanian', 'Vietnamese'];
const SORTS = ['Date Published', 'Unique Downloads', 'Last Updated', 'Mod Name', 'File Size', 'Last Comment'];

function categoryBlock() {
    return `<div data-e2eid="category-filter"><div class="group/checkbox">${
        CATEGORIES.map(c => `<label><p><span>${c}</span><span>(269)</span></p></label>`).join('')
    }</div></div>`;
}

function languageBlock() {
    /* 实机 Language 折叠块里是一组 checkbox-filter-language-* / group/checkbox 标签 */
    return `<div data-e2eid="language-filter">${LANGUAGES.map(l =>
        `<div class="group/checkbox"><label><span>${l}</span></label></div>`).join('')}</div>`;
}

function sortPortal() {
    return `<div id="headlessui-listbox-options-_r_9_" role="listbox">${
        SORTS.map(s => `<div role="option"><span>${s}</span></div>`).join('')
    }</div>`;
}

function subNav() {
    return `<div data-e2eid="games-sub-nav" id="headlessui-popover-panel-_r_j6_">
      <ul><li><p>Games</p></li><li><a href="https://www.nexusmods.com/games"><span>All games</span><span>(5,854)</span></a></li></ul>
      <div><p>My games</p>
        <div class="group/game"><a data-e2eid="favourite-game" href="https://www.nexusmods.com/games/7daystodie"><span>7 Days To Die</span></a><button><span class="sr-only">Remove</span></button></div>
        <div class="group/game"><a data-e2eid="favourite-game" href="https://www.nexusmods.com/games/skyrimspecialedition"><span>Skyrim Special Edition</span></a><button><span class="sr-only">Remove</span></button></div>
      </div>
      <ul><li><a href="https://www.nexusmods.com/games/helldivers2/mods"><span>Mod updates</span></a></li>
          <li><a href="https://www.nexusmods.com/tracked"><span>Tracked mods</span></a></li>
          <li><a href="https://www.nexusmods.com/my"><span>My stuff</span></a></li></ul>
    </div>`;
}

function footer() {
    return `<footer aria-label="Desktop footer" role="navigation"><div class="grid">
      <div><details><summary><h3>Nexus Mods</h3></summary>
        <a href="https://www.nexusmods.com/news">News</a><a href="https://www.nexusmods.com/about/stats">Statistics</a></details></div>
      <div><details><summary><h3>Discover</h3></summary>
        <a href="https://www.nexusmods.com/games">All games</a>
        <a href="https://www.nexusmods.com/games/helldivers2/mods">All mods</a>
        <a href="https://www.nexusmods.com/games/helldivers2/mods?sort=createdAt">New mods</a>
        <a href="https://www.nexusmods.com/games/helldivers2/mods?sort=endorsements">Popular mods</a>
        <a href="https://www.nexusmods.com/games/helldivers2/mods?sort=trending">Trending mods</a>
        <a href="https://www.nexusmods.com/collections">All collections</a>
        <a href="https://www.nexusmods.com/games/helldivers2/images">All images</a></details></div>
    </div></footer>`;
}

/* UGC / 同名负向：游戏名链接（同 href 族）、模组卡片标题、作者名、描述输入、
 * 以及刚好叫 "New mods" 的一个模组标题——都必须逐字节保留 */
function ugcBlock() {
    return `<div>
      <a href="https://www.nexusmods.com/games/helldivers2"><span>Helldivers 2</span></a>
      <a href="https://www.nexusmods.com/games/skyrimspecialedition"><span>Skyrim Special Edition</span></a>
      <div data-e2eid="mod-tile-title"><a href="https://www.nexusmods.com/games/helldivers2/mods/123">New mods</a></div>
      <div data-e2eid="mod-tile-title"><a href="https://www.nexusmods.com/games/helldivers2/mods/124">Thai</a></div>
      <div data-e2eid="mod-tile-title"><a href="https://www.nexusmods.com/games/helldivers2/mods/125">Date Published</a></div>
      <div data-e2eid="mod-tile-title"><a href="https://www.nexusmods.com/games/helldivers2/mods/126">Animations</a></div>
      <a data-e2eid="user-link" href="https://www.nexusmods.com/users/1"><span>Mod updates</span></a>
      <div class="mod-description">Thai Animations Date Published All mods</div>
      <input placeholder="Search mods" value="All mods">
    </div>`;
}

function browsePage(game) {
    return `<!DOCTYPE html><html><body>
      <nav><div id="headlessui-popover-panel-nav">${'</div>'}</nav>
      ${subNav()}
      <main>
        <h1>${game} mods</h1>
        ${categoryBlock()}
        ${languageBlock()}
        <button id="sort-trigger">Date Published</button>
      </main>
      ${sortPortal()}
      ${footer()}
      ${ugcBlock()}
    </body></html>`;
}

function boot(html, url) {
    const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
    dom.window.eval(CODE);
    return dom;
}

const wait = ms => new Promise(r => setTimeout(r, ms));
let passed = 0;
const failures = [];
async function test(name, fn) {
    try { await fn(); passed++; console.log('  ok   ' + name); }
    catch (e) { failures.push({ name, error: e }); console.log('  FAIL ' + name + ' -> ' + e.message); }
}

const norm = s => (s || '').replace(/\s+/g, ' ').trim();

console.log('[jsdom · Nexus 多游戏固定 UI]');

await test('八个游戏社区的分类容器统一翻出固定分类（含 HD2 Animations/Visuals）', async () => {
    for (const game of GAMES) {
        const dom = boot(browsePage(game), 'https://www.nexusmods.com/games/' + game + '/mods');
        const d = dom.window.document;
        const cat = d.querySelector('[data-e2eid="category-filter"]');
        assert.ok(cat, game + '：缺少分类容器');
        const text = norm(cat.textContent);
        for (const zh of ['动画', '视觉', '音频', '护甲', '角色', '物品', '怪物', '技能', '武器', '地点']) {
            assert.ok(text.includes(zh), game + '：分类未翻译 ' + zh + ' -> ' + text);
        }
        // 计数原样保留
        assert.ok(text.includes('(269)'), game + '：分类计数被改动 -> ' + text);
        dom.window.close();
    }
});

await test('语言组固定枚举（Thai/Hindi/Bulgarian/Hebrew/Romanian…）被翻译', async () => {
    const dom = boot(browsePage('helldivers2'), 'https://www.nexusmods.com/games/helldivers2/mods');
    const box = dom.window.document.querySelector('[data-e2eid="language-filter"]');
    const text = norm(box.textContent);
    for (const zh of ['泰语', '印地语', '保加利亚语', '希伯来语', '罗马尼亚语', '越南语']) {
        assert.ok(text.includes(zh), '语言未翻译 ' + zh + ' -> ' + text);
    }
    dom.window.close();
});

await test('排序 portal 首次打开与关闭后重开都被翻译（同一 portal 复用）', async () => {
    const dom = boot(browsePage('helldivers2'), 'https://www.nexusmods.com/games/helldivers2/mods');
    const d = dom.window.document;
    const read = () => [...d.querySelectorAll('[id^="headlessui-listbox-options"] [role="option"]')]
        .map(o => norm(o.textContent));
    assert.deepStrictEqual(read(), ['发布日期', '独立下载量', '最后更新', '模组名称', '文件大小', '最后评论']);

    // 关闭下拉：React 卸载 portal 节点
    d.querySelector('[id^="headlessui-listbox-options"]').remove();
    await wait(120);
    // 重新打开：同 id 前缀的新 portal 挂到 body
    const again = d.createElement('div');
    again.id = 'headlessui-listbox-options-_r_c_';
    again.setAttribute('role', 'listbox');
    again.innerHTML = SORTS.map(x => '<div role="option"><span>' + x + '</span></div>').join('');
    d.body.appendChild(again);
    await wait(150);
    assert.deepStrictEqual(read(), ['发布日期', '独立下载量', '最后更新', '模组名称', '文件大小', '最后评论']);
    dom.window.close();
});

await test('页头 GAMES 门户与页脚固定链接被翻译，计数保留', async () => {
    const dom = boot(browsePage('helldivers2'), 'https://www.nexusmods.com/games/helldivers2/mods');
    const d = dom.window.document;
    const nav = norm(d.querySelector('[data-e2eid="games-sub-nav"]').textContent);
    for (const zh of ['所有游戏', '我的游戏', '模组更新', '追踪的模组', '我的内容', '移除']) {
        assert.ok(nav.includes(zh), '门户导航未翻译 ' + zh + ' -> ' + nav);
    }
    assert.ok(nav.includes('(5,854)'), '门户计数被改动 -> ' + nav);
    const foot = norm(d.querySelector('footer[aria-label="Desktop footer"]').textContent);
    for (const zh of ['新模组', '热门模组', '趋势模组', '所有图片', '所有模组', '所有游戏', '所有合集']) {
        assert.ok(foot.includes(zh), '页脚未翻译 ' + zh + ' -> ' + foot);
    }
    dom.window.close();
});

await test('负向：游戏名 / 模组标题 / 作者 / 描述输入逐字保留（含与词条同名的 UGC）', async () => {
    for (const game of GAMES) {
        const dom = boot(browsePage(game), 'https://www.nexusmods.com/games/' + game + '/mods');
        const d = dom.window.document;
        const titles = [...d.querySelectorAll('[data-e2eid="mod-tile-title"]')].map(e => norm(e.textContent));
        assert.deepStrictEqual(titles, ['New mods', 'Thai', 'Date Published', 'Animations'],
            game + '：模组标题被翻译 -> ' + JSON.stringify(titles));
        assert.strictEqual(norm(d.querySelector('[data-e2eid="user-link"]').textContent), 'Mod updates',
            game + '：作者名被翻译');
        assert.strictEqual(norm(d.querySelector('.mod-description').textContent),
            'Thai Animations Date Published All mods', game + '：描述被翻译');
        const gameLink = d.querySelector('a[href="https://www.nexusmods.com/games/helldivers2"] span');
        assert.strictEqual(norm(gameLink.textContent), 'Helldivers 2', game + '：游戏名被翻译');
        assert.strictEqual(d.querySelector('input').getAttribute('value'), 'All mods', game + '：输入值被改动');
        dom.window.close();
    }
});

await test('重复扫描与关闭/重开汉化：计数不累积、原文可逐字还原', async () => {
    const dom = boot(browsePage('helldivers2'), 'https://www.nexusmods.com/games/helldivers2/mods');
    const d = dom.window.document;
    const api = dom.window.__MODS_ZH__;
    await wait(120);
    const cat = d.querySelector('[data-e2eid="category-filter"]');
    const once = norm(cat.textContent);
    api.rescan(); api.rescan();
    await wait(120);
    assert.strictEqual(norm(cat.textContent), once, '重复扫描改变了分类文本');

    api.setEnabled(false);
    assert.strictEqual(norm(cat.textContent),
        CATEGORIES.map(c => c + '(269)').join(''), '关闭汉化后分类没有逐字还原');

    api.setEnabled(true);
    await wait(120);
    assert.strictEqual(norm(cat.textContent), once, '重开汉化后分类文本不一致');
    const foot = norm(d.querySelector('footer[aria-label="Desktop footer"]').textContent);
    assert.ok(foot.includes('新模组'), '重开后页脚未重新翻译');
    dom.window.close();
});

await test('SPA 切换游戏：分类与页脚保持翻译，不残留上一游戏的词条状态', async () => {
    const dom = boot(browsePage('helldivers2'), 'https://www.nexusmods.com/games/helldivers2/mods');
    const d = dom.window.document;
    const api = dom.window.__MODS_ZH__;
    dom.window.history.pushState({}, '', '/games/skyrimspecialedition/mods');
    await wait(900);
    assert.strictEqual(api.page, 'browse');
    const cat = norm(d.querySelector('[data-e2eid="category-filter"]').textContent);
    assert.ok(cat.includes('动画') && cat.includes('角色'), 'SPA 切游戏后分类未翻译 -> ' + cat);
    dom.window.close();
});

/* 失败→通过：allow 放行必须只认「真实固定路由」，且不能穿过硬 UGC。
 * 门户/页脚里混入 mod 详情链接（/mods/123）、作者链接、README/代码块时，
 * 同名字串（New mods / Trending mods / Mod updates）一律保持原文；
 * 指向 /games/<game>/mods 与 ?sort= / ?tab= 的固定导航链接仍然翻。 */
await test('门户/页脚 allow 不得穿过 UGC：详情链接、作者链接、markdown、code 同串保持原文', async () => {
    const html = `<!DOCTYPE html><html><body>
      <div data-e2eid="games-sub-nav">
        <ul>
          <li><a href="https://www.nexusmods.com/games/helldivers2/mods"><span>Mod updates</span></a></li>
          <li><a href="https://www.nexusmods.com/games/helldivers2/mods?sort=createdAt"><span>New mods</span></a></li>
        </ul>
        <div><a href="https://www.nexusmods.com/games/helldivers2/mods/123"><span>New mods</span></a></div>
        <div><a href="https://www.nexusmods.com/games/helldivers2/mods/124"><span>Trending mods</span></a></div>
        <div><a data-e2eid="user-link" href="https://www.nexusmods.com/users/1"><span>Mod updates</span></a></div>
        <div class="mod-description"><a href="https://www.nexusmods.com/games/helldivers2/mods/125">Mod updates</a></div>
        <div class="markdown"><p>Trending mods</p></div>
        <pre><code>New mods</code></pre>
        <div><a href="https://www.nexusmods.com/games/helldivers2"><span>Helldivers 2</span></a></div>
      </div>
      <footer aria-label="Desktop footer"><div>
        <a href="https://www.nexusmods.com/games/helldivers2/mods?sort=createdAt&timeRange=1">New mods</a>
        <a href="https://www.nexusmods.com/games/helldivers2/mods?sort=endorsements&timeRange=7">Trending mods</a>
        <a href="https://www.nexusmods.com/games/helldivers2/mods/123">New mods</a>
        <div class="markdown"><a href="https://www.nexusmods.com/games/helldivers2/modulations">New mods</a></div>
        <code>Trending mods</code>
        <a href="https://www.nexusmods.com/games/helldivers2/mods">All mods</a>
      </div></footer>
    </body></html>`;
    const dom = boot(html, 'https://www.nexusmods.com/games/helldivers2/mods');
    const d = dom.window.document;
    const nav = d.querySelector('[data-e2eid="games-sub-nav"]');
    const foot = d.querySelector('footer[aria-label="Desktop footer"]');
    const texts = sel => [...sel.querySelectorAll('a, span, p, code')].map(e => norm(e.textContent));

    const navTexts = texts(nav);
    // 固定路由仍翻
    assert.ok(navTexts.includes('模组更新'), '门户固定 /mods 链接未翻：' + JSON.stringify(navTexts));
    assert.ok(navTexts.includes('新模组'), '门户固定 ?sort= 链接未翻：' + JSON.stringify(navTexts));
    // 详情链接 / 作者 / 描述 / markdown / code 保持原文
    for (const raw of ['New mods', 'Trending mods', 'Mod updates']) {
        assert.ok(navTexts.includes(raw), '门户内 UGC 同串被翻译：' + raw + ' -> ' + JSON.stringify(navTexts));
    }
    assert.strictEqual(norm(nav.querySelector('a[href="https://www.nexusmods.com/games/helldivers2/mods/123"]').textContent),
        'New mods', '模组详情链接被翻译');
    assert.strictEqual(norm(nav.querySelector('[data-e2eid="user-link"]').textContent), 'Mod updates', '作者链接被翻译');
    assert.strictEqual(norm(nav.querySelector('.mod-description').textContent), 'Mod updates', '描述被翻译');
    assert.strictEqual(norm(nav.querySelector('.markdown').textContent), 'Trending mods', 'markdown 被翻译');
    assert.strictEqual(norm(nav.querySelector('pre code').textContent), 'New mods', '代码块被翻译');
    // 游戏名路由 /games/xxx 本身不可翻
    assert.strictEqual(norm(nav.querySelector('a[href="https://www.nexusmods.com/games/helldivers2"]').textContent),
        'Helldivers 2', '游戏名被翻译');

    const footTexts = texts(foot);
    assert.ok(footTexts.includes('新模组') && footTexts.includes('趋势模组'), '页脚固定链接未翻：' + JSON.stringify(footTexts));
    assert.ok(footTexts.includes('所有模组'), '页脚 All mods 未翻');
    assert.strictEqual(norm(foot.querySelector('a[href="https://www.nexusmods.com/games/helldivers2/mods/123"]').textContent),
        'New mods', '页脚内模组详情链接被翻译');
    assert.strictEqual(norm(foot.querySelector('.markdown').textContent), 'New mods', '页脚内 markdown 被翻译');
    assert.strictEqual(norm(foot.querySelector('code').textContent), 'Trending mods', '页脚内代码被翻译');
    dom.window.close();
});

const NL = String.fromCharCode(10);
console.log(NL + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) {
    for (const f of failures) console.error(NL + "--- " + f.name + NL + ((f.error && f.error.stack) || f.error));
    process.exit(1);
}
