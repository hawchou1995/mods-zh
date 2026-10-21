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
  <nav>
    <a>Communities</a><a>Developers</a><a>Switch to legacy</a>
    <a>Get Manager</a><button>Upload</button><button>Upload package</button>
    <div class="account-menu"><a>Settings</a><a>Teams</a><a>Log Out</a></div>
  </nav>
  <form><input placeholder="Search Mods..."></form>
  <section>
    <div>Sections</div><div>All</div>
    <div>Categories</div><div>Client Mods</div><div>Dev Tools</div>
    <div>Libraries</div><div>Modpacks</div><div>Rundown Mods</div><div>Rundowns</div>
    <div>Other filters</div><div>Deprecated</div><div>NSFW</div>
    <div>Last updated</div>
    <div class="result-count"><strong>1-20</strong> of <strong>868</strong> results</div>
    <div>4 weeks ago</div>
  </section>
  <div class="package-description">A simple and easy to use mod manager</div>
  <div class="author-byline">by <a href="#author">ebkr</a></div>
  <div id="later"></div>
</body></html>`;
const TS_UPLOAD_HTML = `<!DOCTYPE html><html><body>
  <header aria-label="Header"><nav aria-label="Main"><a href="/" aria-label="Home">Home</a></nav></header>
  <main>
    <h1>Upload package</h1>
    <p class="upload__helper-text">Need help formatting your package? Check out the<!-- --> <a href="https://wiki.thunderstore.io/mods/creating-a-package">Thunderstore wiki</a>.</p>
    <p class="upload__helper-text">Review your readme before upload using the<!-- --> <a href="/tools/markdown-preview/">markdown preview tool</a>.</p>
    <p class="upload__helper-text">Uploading a large file? Check your package manifest first with the<!-- --> <a href="/tools/manifest-v1-validator/">package manifest validator</a>.</p>
    <h3>Upload file</h3><p>Upload your package as a ZIP file.</p>
    <label>Choose or drag ZIP file here<span>10GB max</span></label>
    <h3>Team</h3><p>Select the team you want your package to be associated with.</p><input placeholder="Select team"><button aria-label="Toggle options"></button><p>No teams available?</p><a>Create team</a>
    <h3>Communities</h3><p>Select communities you want your package to be listed under.</p><input placeholder="Select communities"><button aria-label="Toggle options"></button>
    <h3>Categories</h3><p>Select descriptive categories to help people discover your package.</p><p>Select a community to view available categories</p>
    <h3>Contains NSFW content</h3><p>Select if your package contains NSFW material. An "NSFW" -tag will be applied to your package.</p><button>No</button><button>Yes</button>
    <h3>Submit</h3><p>Double-check your selections and hit "Submit" when you're ready!</p><button>Reset</button><button>Submit</button>
    <p class="footer-manager__desc">Download Thunderstore Mod Manager for Windows to easily install, update, and manage your mods.</p>
    <p id="long-unmapped">This long static-looking sentence has no approved dictionary entry and must remain unchanged in the localization engine.</p>
    <footer aria-label="Developer links"><a>API Documentation</a><a>Package Format Docs</a><a>Manifest Validator</a><a>Markdown Preview</a><a>Contact Us</a><a>Privacy Policy</a><a>News</a><a>GitHub</a></footer>
  </main>
</body></html>`;

const TS_REQUIRED_HTML = `<!DOCTYPE html><html><body>
  <a class="tabs-item"><span>Required (</span><!-- react text -->0<!-- react text --><span>)</span></a>
  <div class="empty-state"><span>No dependencies</span><span>This package does not require any other packages to work.</span></div>
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

console.log('[jsdom · Thunderstore]');

await test('页面文本被替换且 UGC 原文保留', async () => {
    const dom = boot(TS_HTML, 'https://thunderstore.io/c/gtfo/');
    const d = dom.window.document;
    const t = d.body.textContent;
    assert.ok(t.includes('社区'), 'Communities 未翻译：' + t);
    assert.ok(t.includes('上传'), 'Upload 未翻译');
    assert.ok(t.includes('上传包'), 'Upload package 未翻译');
    assert.ok(t.includes('开发者'), 'Developers 未翻译');
    assert.ok(t.includes('切换到旧版'), 'Switch to legacy 未翻译');
    assert.ok(t.includes('获取管理器'), 'Get Manager 未翻译');
    assert.ok(t.includes('设置'), 'Settings 未翻译');
    assert.ok(t.includes('团队'), 'Teams 未翻译');
    assert.ok(t.includes('退出登录'), 'Log Out 未翻译');
    assert.ok(t.includes('分类'), 'Categories 未翻译');
    assert.ok(t.includes('客户端模组'), 'Client Mods 未翻译');
    assert.ok(t.includes('开发工具'), 'Dev Tools 未翻译');
    assert.ok(t.includes('库'), 'Libraries 未翻译');
    assert.ok(t.includes('整合包'), 'Modpacks 未翻译');
    assert.ok(t.includes('远征序列模组'), 'Rundown Mods 未翻译');
    assert.ok(t.includes('远征序列'), 'Rundowns 未翻译');
    assert.ok(t.includes('最后更新'), 'Last updated 未翻译');
    assert.ok(t.includes('1-20， 共 868 条结果') || t.includes('1-20，共 868 条结果'), '拆分节点结果计数未翻译：' + t);
    assert.ok(t.includes('4 周前'), '相对时间未翻译');
    assert.strictEqual(d.querySelector('.author-byline').textContent, '作者 ebkr', '作者前缀 by 未翻译');
    assert.strictEqual(d.querySelector('.author-byline a').textContent, 'ebkr', '作者名不应翻译');
    assert.strictEqual(
        d.querySelector('.package-description').textContent,
        'A simple and easy to use mod manager'
    );
    dom.window.close();
});

await test('placeholder 属性被翻译', async () => {
    const dom = boot(TS_HTML, 'https://thunderstore.io/c/gtfo/');
    assert.strictEqual(dom.window.document.querySelector('input').getAttribute('placeholder'), '搜索模组…');
    dom.window.close();
});

await test('上传页静态文案、控件属性与链接均本地化', async () => {
    const dom = boot(TS_UPLOAD_HTML, 'https://thunderstore.io/package/create/');
    const d = dom.window.document;
    const text = d.body.textContent.replace(/\s+/g, ' ');

    assert.ok(text.includes('上传包'), 'Upload package 标题');
    assert.ok(text.includes('需要帮助格式化软件包？请查看'), '格式帮助说明');
    assert.ok(text.includes('Thunderstore Wiki'), 'Wiki 链接文字');
    assert.ok(text.includes('上传前请先检查 README，并使用'), 'README 帮助说明');
    assert.ok(text.includes('Markdown 预览工具'), 'Markdown 工具链接文字');
    assert.ok(text.includes('上传大文件前，请先使用'), '大文件帮助说明');
    assert.ok(text.includes('软件包清单校验器'), 'manifest validator 链接文字');
    assert.ok(text.includes('上传文件') && text.includes('ZIP 文件'), '上传文件区');
    assert.ok(text.includes('最大 10 GB'), '文件大小限制');
    assert.ok(text.includes('选择要与此软件包关联的团队'), 'Team 说明');
    assert.ok(text.includes('没有可用的团队？') && text.includes('创建团队'), '团队空态');
    assert.ok(text.includes('选择要列出此软件包的社区'), 'Communities 说明');
    assert.ok(text.includes('选择描述性分类'), 'Categories 说明');
    assert.ok(text.includes('包含 NSFW 内容') && text.includes('添加“NSFW”标签'), 'NSFW 说明');
    assert.ok(text.includes('否') && text.includes('是'), 'No/Yes 开关');
    assert.ok(text.includes('重置') && text.includes('提交'), 'Reset/Submit 按钮');
    assert.ok(text.includes('下载 Windows 版 Thunderstore 模组管理器，轻松安装、更新和管理你的模组。'), '超过长度阈值的精确 UI 词条应翻译');
    assert.strictEqual(d.querySelector('#long-unmapped').textContent, 'This long static-looking sentence has no approved dictionary entry and must remain unchanged in the localization engine.');

    assert.strictEqual(d.querySelectorAll('input')[0].getAttribute('placeholder'), '选择团队');
    assert.strictEqual(d.querySelectorAll('input')[1].getAttribute('placeholder'), '选择社区');
    assert.strictEqual(d.querySelector('button[aria-label="切换选项"]')?.getAttribute('aria-label'), '切换选项');
    assert.strictEqual(d.querySelector('header').getAttribute('aria-label'), '页眉');
    assert.strictEqual(d.querySelector('nav').getAttribute('aria-label'), '主要内容');
    assert.strictEqual(d.querySelector('a[aria-label="首页"]').getAttribute('href'), '/');
    assert.strictEqual(d.querySelector('a[href="https://wiki.thunderstore.io/mods/creating-a-package"]').getAttribute('href'), 'https://wiki.thunderstore.io/mods/creating-a-package');
    dom.window.close();
});

await test('Required React 分段计数与 /required 空态被翻译', async () => {
    const dom = boot(TS_REQUIRED_HTML, 'https://thunderstore.io/c/gtfo/p/BepInEx/BepInExPack_GTFO/required');
    const d = dom.window.document;
    assert.strictEqual(dom.window.__MODS_ZH__.page, 'package');
    assert.strictEqual(d.querySelector('.tabs-item').textContent, '必需依赖（0）');
    assert.ok(d.body.textContent.includes('没有依赖项'));
    assert.ok(d.body.textContent.includes('此软件包无需依赖其他软件包即可运行。'));
    dom.window.close();
});

await test('React 注释拆分的单复数结果计数正确且关闭后还原', async () => {
    const html = `<!DOCTYPE html><html><body>
      <p class="package-count"><b>1-20 </b>&nbsp;of&nbsp;<b>868</b>&nbsp;result<!-- -->s</p>
      <p class="package-count"><b>1-1 </b>&nbsp;of&nbsp;<b>1</b>&nbsp;result</p>
    </body></html>`;
    const dom = boot(html, 'https://thunderstore.io/c/gtfo/');
    const [plural, singular] = dom.window.document.querySelectorAll('.package-count');
    const nbsp = String.fromCharCode(160);
    const originals = ['1-20 ' + nbsp + 'of' + nbsp + '868' + nbsp + 'results', '1-1 ' + nbsp + 'of' + nbsp + '1' + nbsp + 'result'];

    assert.strictEqual(plural.textContent, '1-20，共 868 条结果');
    assert.strictEqual(singular.textContent, '1-1，共 1 条结果');
    const api = dom.window.__MODS_ZH__;
    assert.strictEqual(api.stats.nodes, 4, '拆分复数计数只应统计两个标签各自的 of 和结果词');
    api.rescan();
    assert.strictEqual(api.stats.nodes, 4, '重复扫描不得重复计数');
    dom.window.__MODS_ZH__.setEnabled(false);
    assert.deepStrictEqual([plural.textContent, singular.textContent], originals, '关闭后须还原原始 React 文本节点');
    dom.window.close();
});

await test('动态筛选器、排序菜单、分页与 aria-label 被翻译', async () => {
    const html = '<!DOCTYPE html><html><body><div id="late"></div></body></html>';
    const dom = boot(html, 'https://thunderstore.io/c/lethal-company/');
    const d = dom.window.document;
    d.getElementById('late').innerHTML = `
      <section>
        <h2>Filters</h2><button aria-label="Close"></button>
        <div role="combobox">Last updated</div>
        <button aria-label="Card layout"></button><button aria-label="Content width"></button>
        <div role="listbox"><div role="option">Newest</div><div role="option">Most downloaded</div><div role="option">Top rated</div></div>
        <div>Sections</div><button>All</button><button>Mods</button><button>Asset Replacements</button><button>APIs &amp; Libraries</button><button>Modpacks</button>
        <div>Other filters</div><button>Deprecated</button><button>NSFW</button>
        <span aria-label="Last Updated">4 hours ago</span>
        <nav aria-label="Pagination"><button>Next</button></nav>
      </section>`;
    await wait(300);
    const text = d.body.textContent.replace(/\s+/g, ' ');

    assert.strictEqual(d.querySelector('#late h2').textContent, '筛选器', '动态插入的 Filters 标题必须翻译');
    for (const [expected, source] of [
        ['最后更新', 'Last updated'], ['最新发布', 'Newest'], ['下载量最多', 'Most downloaded'],
        ['评分最高', 'Top rated'], ['分区', 'Sections'], ['全部', 'All'], ['模组', 'Mods'],
        ['资源替换', 'Asset Replacements'], ['API 与库', 'APIs & Libraries'], ['整合包', 'Modpacks'],
        ['其他筛选', 'Other filters'], ['已弃用', 'Deprecated'], ['成人内容', 'NSFW'],
        ['4 小时前', '4 hours ago'], ['下一页', 'Next'],
    ]) assert.ok(text.includes(expected), `${source} 未翻译：${text}`);

    assert.strictEqual(d.querySelector('button[aria-label="关闭"]')?.getAttribute('aria-label'), '关闭');
    assert.strictEqual(d.querySelector('button[aria-label="卡片布局"]')?.getAttribute('aria-label'), '卡片布局');
    assert.strictEqual(d.querySelector('button[aria-label="内容宽度"]')?.getAttribute('aria-label'), '内容宽度');
    assert.strictEqual(d.querySelector('span[aria-label="最后更新"]')?.getAttribute('aria-label'), '最后更新');
    assert.strictEqual(d.querySelector('nav').getAttribute('aria-label'), '分页');
    dom.window.close();
});

await test('上传页 ZIP 校验、传输状态与结果文案均翻译且保留 UGC', async () => {
    const dom = boot('<!DOCTYPE html><html><body><main><div id="dynamic-validation"></div></main></body></html>', 'https://thunderstore.io/package/create/');
    const d = dom.window.document;
    d.getElementById('dynamic-validation').innerHTML = `
      <label>Drop ZIP file here</label><input id="category" placeholder="Select categories">
      <p id="zip-type">Please upload a ZIP archive (application/zip).</p>
      <p id="zip-required">Please choose a ZIP file before submitting.</p>
      <p id="zip-errors">Please fix the problems with your .zip file before submitting.</p>
      <p id="form-errors">Please review the form errors above and submit again.</p>
      <p id="test-tip">If you need to test your mod, you can import it locally through the 'Import local mod' option in your mod manager's settings.</p>
      <p id="bepinex">You have BepInEx.dll in your .zip file. BepInEx should probably be a dependency in your manifest.json file instead.</p>
      <p id="assembly">You have Assembly-CSharp.dll in your .zip file. Your package may be removed if you do not have permission to distribute this file.</p>
      <p id="modpack">If you're making a modpack, do not include the files for each mod in your .zip file. Instead, put the dependency string for each mod inside your manifest.json file.</p>
      <p id="case">The file names of manifest.json, icon.png, and README.md are case-sensitive.</p>
      <p id="extensions">Your manifest.json, icon.png, and README.md files must have the correct file extensions.</p>
      <p id="root">Your manifest, icon, and README files should be at the root of the .zip file. You can prevent this by compressing the contents of a folder, rather than the folder itself.</p>
      <p id="missing-extension">Your manifest.json, icon.png, or README.md file is missing its file extension.</p>
      <p id="missing-manifest">Your package is missing a manifest.json file!</p>
      <p id="missing-icon">Your package is missing an icon.png file!</p>
      <p id="missing-readme">Your package is missing a README.md file!</p>
      <p id="dll-count">You have 11 .dll files in your .zip file. Some of these files may be unnecessary.</p>
      <p id="http-error">HTTP error: 503</p>
      <p id="etag-error">ETAG missing on part upload: 12</p>
      <p id="poll-error">Error polling submission status: Unknown error</p>
      <p id="multi-upload-error">Upload failed with errors: UPLOAD_FAILED: Network error</p>
      <p id="poll-http">Error polling submission status: HTTP error: 503</p>
      <p id="poll-network">Error polling submission status: Network error</p>
      <p id="multi-http">Upload failed with errors: UPLOAD_FAILED: HTTP error: 502</p>
      <p id="multi-etag">Upload failed with errors: ETAG_MISSING: ETAG missing on part upload: 9</p>
      <p id="upload-state">Upload already running</p><p id="unknown">Unknown error</p>
      <div role="progressbar" aria-label="Upload progress"></div><p id="uploading">Uploading… 42%</p>
      <p id="submitting">Submitting…</p><p id="processing">Processing…</p>
      <button id="retry">Retry Status Check</button><span id="success">Success!</span>
      <p id="listed">The package is listed in<!-- --> <b>2</b><!-- --> communities<!-- -->:</p>
      <p id="listed-singular">The package is listed in<!-- --> <b>1</b><!-- --> community<!-- -->:</p>
      <a id="view">View listing</a><span id="link">Link</span>
      <p class="package-description" id="ugc">Your package is missing a manifest.json file!</p>`;
    await wait(300);

    const expected = [
        ['zip-type', '请上传 ZIP 压缩包（application/zip）。'],
        ['zip-required', '提交前请选择 ZIP 文件。'],
        ['zip-errors', '请先修复 ZIP 文件中的问题，再提交。'],
        ['form-errors', '请修正上方表单错误后重新提交。'],
        ['test-tip', '如果需要测试模组，可在模组管理器设置中选择“导入本地模组”。'],
        ['bepinex', 'ZIP 压缩包中包含 BepInEx.dll。建议在 manifest.json 中将 BepInEx 声明为依赖项。'],
        ['assembly', 'ZIP 压缩包中包含 Assembly-CSharp.dll。若无权分发该文件，你的软件包可能会被移除。'],
        ['modpack', '如果正在制作模组整合包，请勿将各模组文件打包进 ZIP；请在 manifest.json 中填写每个模组的依赖项字符串。'],
        ['case', 'manifest.json、icon.png 和 README.md 文件名区分大小写。'],
        ['extensions', 'manifest.json、icon.png 和 README.md 文件必须使用正确的扩展名。'],
        ['root', 'manifest、icon 和 README 文件应位于 ZIP 压缩包根目录。压缩文件夹内的内容，而不是文件夹本身，即可避免此问题。'],
        ['missing-extension', 'manifest.json、icon.png 或 README.md 文件缺少扩展名。'],
        ['missing-manifest', '软件包缺少 manifest.json 文件！'],
        ['missing-icon', '软件包缺少 icon.png 文件！'],
        ['missing-readme', '软件包缺少 README.md 文件！'],
        ['dll-count', 'ZIP 压缩包中包含 11 个 .dll 文件，其中某些可能并非必需。'],
        ['http-error', 'HTTP 错误：503'],
        ['etag-error', '分片 12 缺少 ETag。'],
        ['poll-error', '查询提交状态失败：未知错误'],
        ['multi-upload-error', '上传失败：网络错误'],
        ['poll-http', '查询提交状态失败：HTTP 错误：503'],
        ['poll-network', '查询提交状态失败：网络错误'],
        ['multi-http', '上传失败：HTTP 错误：502'],
        ['multi-etag', '上传失败：分片 9 缺少 ETag。'],
        ['upload-state', '上传已在进行中。'],
        ['unknown', '未知错误'],
        ['uploading', '正在上传… 42%'],
        ['submitting', '正在提交…'],
        ['processing', '正在处理中…'],
        ['retry', '重试状态检查'],
        ['success', '成功！'],
        ['listed', '软件包已发布到 2 个社区：'],
        ['listed-singular', '软件包已发布到 1 个社区：'],
        ['view', '查看软件包页面'],
        ['link', '链接'],
    ];
    for (const [id, text] of expected) {
        assert.strictEqual(d.getElementById(id).textContent.trim(), text, id + ' 翻译不匹配');
    }
    assert.strictEqual(d.querySelector('#dynamic-validation label').textContent.trim(), '将 ZIP 文件拖放到此处');
    assert.strictEqual(d.querySelector('#category').getAttribute('placeholder'), '选择分类');
    assert.strictEqual(d.querySelector('[role="progressbar"]').getAttribute('aria-label'), '上传进度');
    assert.strictEqual(d.getElementById('ugc').textContent, 'Your package is missing a manifest.json file!', '用户描述不应翻译');
    dom.window.__MODS_ZH__.setEnabled(false);
    assert.strictEqual(d.getElementById('listed').textContent, 'The package is listed in 2 communities:');
    assert.strictEqual(d.getElementById('listed-singular').textContent, 'The package is listed in 1 community:');
    dom.window.close();
});

await test('动态插入节点被 MutationObserver 接管', async () => {
    const dom = boot(TS_HTML, 'https://thunderstore.io/c/gtfo/');
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
    const dom = boot(TS_HTML, 'https://thunderstore.io/c/gtfo/');
    const d = dom.window.document;
    const api = dom.window.__MODS_ZH__;
    assert.ok(api, '调试出口 __MODS_ZH__ 缺失');
    assert.ok(d.body.textContent.includes('社区'));
    api.setEnabled(false);
    assert.ok(d.body.textContent.includes('Communities'), '还原失败');
    assert.strictEqual(d.querySelector('input').getAttribute('placeholder'), 'Search Mods...');
    api.setEnabled(true);
    assert.ok(d.body.textContent.includes('社区'));
    dom.window.close();
});

console.log('[jsdom · Nexus Mods]');

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

    const ts = boot(TS_HTML, 'https://thunderstore.io/c/gtfo/p/BepInEx/BepInExPack_GTFO/');
    assert.strictEqual(ts.window.__MODS_ZH__.page, 'package');
    ts.window.close();
});

console.log('\n' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) {
    for (const f of failures) console.error('\n--- ' + f.name + '\n' + (f.error && f.error.stack || f.error));
    process.exit(1);
}
