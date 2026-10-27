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

/* 作者列表页 /c/<社区>/p/<作者>/ —— 2026-10-26 抓自
 * https://thunderstore.io/c/gtfo/p/Kaldea/?deprecated=true 的真实 DOM 结构
 * （SVG、广告位与图片地址折叠；作者名 / 模组名 / 描述按真实内容保留，用于断言不被翻译）。
 * 展示控件下拉菜单是 Radix portal，点开才挂载到 <body>，不在此静态夹具里。 */
const TS_AUTHOR_HTML = `<!DOCTYPE html><html><body>
  <header class="page-header"><div class="page-header__content-simple"><div class="page-header__info">
    <h1 class="display display--variant--primary display--size--2 page-header__heading">Mods uploaded by <!-- -->Kaldea</h1>
  </div></div></header>
  <div class="package-search package-search--with-sidebar-ad">
    <div class="package-search__sidebar"><div class="package-search__filters">
      <details class="collapsible" open><summary class="button button--variant--secondary button--size--big button--ghost collapsible__header">Sections<svg></svg></summary>
        <div class="collapsible__content"><div role="radiogroup" class="radio-group" aria-required="false">
          <label class="radio-group__label radio-group__label--selected"><button type="button" role="radio" aria-checked="true" data-state="checked" value="all" class="radio-group__radio"><svg></svg></button><input type="radio" aria-hidden="true" checked value="all">All</label>
        </div></div></details>
      <details class="collapsible" open><summary class="button button--variant--secondary button--size--big button--ghost collapsible__header">Categories<svg></svg></summary>
        <div class="collapsible__content"><ol class="checkbox-list">
          <li><label class="checkbox-list__label checkbox-list__label--off" for="cb-client-mods"><span><button id="cb-client-mods" class="checkbox-list__icon checkbox-list__checkbox-button"><svg></svg></button>Client Mods</span><button class="checkbox-list__icon checkbox-list__exclude-button"><svg></svg></button></label></li>
          <li><label class="checkbox-list__label checkbox-list__label--off" for="cb-dev-tools"><span><button id="cb-dev-tools" class="checkbox-list__icon checkbox-list__checkbox-button"><svg></svg></button>Dev Tools</span><button class="checkbox-list__icon checkbox-list__exclude-button"><svg></svg></button></label></li>
          <li><label class="checkbox-list__label checkbox-list__label--off" for="cb-libraries"><span><button id="cb-libraries" class="checkbox-list__icon checkbox-list__checkbox-button"><svg></svg></button>Libraries</span><button class="checkbox-list__icon checkbox-list__exclude-button"><svg></svg></button></label></li>
          <li><label class="checkbox-list__label checkbox-list__label--off" for="cb-modpacks"><span><button id="cb-modpacks" class="checkbox-list__icon checkbox-list__checkbox-button"><svg></svg></button>Modpacks</span><button class="checkbox-list__icon checkbox-list__exclude-button"><svg></svg></button></label></li>
          <li><label class="checkbox-list__label checkbox-list__label--off" for="cb-rundown-mods"><span><button id="cb-rundown-mods" class="checkbox-list__icon checkbox-list__checkbox-button"><svg></svg></button>Rundown Mods</span><button class="checkbox-list__icon checkbox-list__exclude-button"><svg></svg></button></label></li>
          <li><label class="checkbox-list__label checkbox-list__label--off" for="cb-rundowns"><span><button id="cb-rundowns" class="checkbox-list__icon checkbox-list__checkbox-button"><svg></svg></button>Rundowns</span><button class="checkbox-list__icon checkbox-list__exclude-button"><svg></svg></button></label></li>
        </ol></div></details>
      <details class="collapsible" open><summary class="button button--variant--secondary button--size--big button--ghost collapsible__header">Other filters<svg></svg></summary>
        <div class="collapsible__content"><ol class="checkbox-list">
          <li><label class="checkbox-list__label checkbox-list__label--include" for="cb-deprecated"><span><button id="cb-deprecated" class="checkbox-list__icon checkbox-list__checkbox-button"><svg></svg></button>Deprecated</span></label></li>
          <li><label class="checkbox-list__label checkbox-list__label--off" for="cb-nsfw"><span><button id="cb-nsfw" class="checkbox-list__icon checkbox-list__checkbox-button"><svg></svg></button>NSFW</span></label></li>
        </ol></div></details>
    </div></div>
    <div class="package-search__content">
      <div class="package-search__search-wrapper"><div class="text-input__wrapper text-input__wrapper--variant--primary"><svg></svg><input placeholder="Search Mods..." aria-label="Search mods" id="searchInput" value="Mastaba R66"></div></div>
      <div class="package-search__top-bar"><div class="display-controls">
        <button aria-label="Card layout" type="button" id="cards-trigger" aria-haspopup="menu" aria-expanded="false" class="button button--variant--secondary display-controls__trigger display-controls__trigger--cards"><svg></svg></button>
        <button aria-label="Content width" type="button" id="view-trigger" aria-haspopup="menu" aria-expanded="false" class="button button--variant--secondary display-controls__trigger display-controls__trigger--view"><svg></svg></button>
      </div></div>
      <div class="package-search__search-params"><div class="package-search__results"><p class="package-count"><b>1-3 </b>&nbsp;of&nbsp;<b>3</b>&nbsp;results</p></div></div>
      <div class="package-search__packages"><div class="package-search__grid">
        <div class="card-package card-package--variant--card card-package--size--medium" id="card-deprecated">
          <a tabindex="-1" title="Mastaba R66 ENDFIELD STANDARD ISSUE by Kaldea" class="link card-package__media" href="/c/gtfo/p/Kaldea/Mastaba_R66_ENDFIELD_STANDARD_ISSUE/"><div class="card-package__image-tags"><div class="tag tag--variant--yellow tag--size--small tag--dark"><svg></svg>Deprecated</div></div><div class="image card-package__image-wrapper"><div class="image__content image__content--variant--primary"><img alt="" class="image__src"></div></div></a>
          <div class="card-package__content">
            <div class="card-package__info"><div class="card-package__heading"><a title="Mastaba R66 ENDFIELD STANDARD ISSUE" class="link card-package__title" href="/c/gtfo/p/Kaldea/Mastaba_R66_ENDFIELD_STANDARD_ISSUE/">Mastaba R66 ENDFIELD STANDARD ISSUE</a></div>
            <div class="card-package__author"><span class="card-package__prefix">by</span><a title="Kaldea" class="link link--variant--cyber card-package__link" href="/c/gtfo/p/Kaldea/">Kaldea</a></div></div>
            <p class="card-package__description">Mastaba R66 的终末地风格皮肤。Endfield-style Mastaba R66 skin with floating holographic markings.</p>
            <div class="card-package__tags"><a href="/c/gtfo/?includedCategories=44" class="tag tag--variant--primary tag--size--xsmall tag--dark tag--hoverable"><span>Client Mods</span></a></div>
            <div class="card-package__footer"><div class="card-package__meta"><div class="meta-item meta-item--variant--default meta-item--size--12"><svg></svg>24</div></div><span class="card-package__updated" aria-label="Last Updated"><svg></svg><span> <!-- -->2 days ago</span></span></div>
          </div>
        </div>
        <div class="card-package card-package--variant--card card-package--size--medium" id="card-ugc">
          <a tabindex="-1" title="Libraries by ebkr" class="link card-package__media" href="/c/gtfo/p/ebkr/Libraries/"><div class="image card-package__image-wrapper"><div class="image__content image__content--variant--primary"><img alt="" class="image__src"></div></div></a>
          <div class="card-package__content">
            <div class="card-package__info"><div class="card-package__heading"><a title="Libraries" class="link card-package__title" href="/c/gtfo/p/ebkr/Libraries/">Libraries</a></div>
            <div class="card-package__author"><span class="card-package__prefix">by</span><a title="ebkr" class="link link--variant--cyber card-package__link" href="/c/gtfo/p/ebkr/">ebkr</a></div></div>
            <p class="card-package__description">Deprecated NSFW 说明：All、View 与 Cards 都是用户原文的一部分。</p>
            <div class="card-package__tags"><a href="/c/gtfo/?includedCategories=8" class="tag tag--variant--primary tag--size--xsmall tag--dark tag--hoverable"><span>Libraries</span></a></div>
            <div class="card-package__footer"><div class="card-package__meta"><div class="meta-item meta-item--variant--default meta-item--size--12"><svg></svg>7</div></div><span class="card-package__updated" aria-label="Last Updated"><svg></svg><span> <!-- -->3 weeks ago</span></span></div>
          </div>
        </div>
      </div></div>
    </div>
  </div>
</body></html>`;

/* 真实 /c/riskofrain2/p/Misc/ 片段（2026-10-26 HTTP 200 SSR）：作者名恰好叫 Misc（= 界面词条），
 * 面包屑末段是非链接 <span class="breadcrumbs__segment">，空态为 package-count "No results" +
 * empty-state__title/message（bundle 中 message 为 `Team ${namespace} hasn't uploaded any mods ...`）。 */
/* 真实「无中间层级」面包屑：Home 链接 + 非链接 <span class="breadcrumbs__segment">。
 * 2026-10-26 抓取的 4 个页面（HTTP 200）都是这个结构，末段是**固定 UI**，不是名称：
 *   /communities/                → 面包屑 "Communities"（h1 同名）
 *   /package/create/             → 面包屑 "Upload"（h1 "Upload package"）
 *   /tools/markdown-preview/     → 面包屑 "Markdown Preview"（h1 同名）
 *   /tools/manifest-v1-validator/→ 面包屑 "Manifest Validator"（h1 同名）
 * 与作者/包详情的「末段=动态名称」共用同一个 class，因此保护必须按页型收窄。 */
function breadcrumbPageHTML(label, heading) {
    return `<!DOCTYPE html><html><body>
  <div class="breadcrumbs breadcrumbs--variant--default breadcrumbs--size--medium">
    <a aria-label="Home" data-state="closed" class="link  breadcrumbs__segment breadcrumbs__homelink" href="/" data-discover="true"><span class="breadcrumbs__item-content"><svg></svg></span></a>
    <span class="breadcrumbs__segment"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">${label}</span></span></span>
  </div>
  <header class="page-header page-header--simple"><div class="page-header__content-simple"><div class="page-header__info">
    <h1 class="display display--variant--primary display--size--2 page-header__heading">${heading}</h1>
  </div></div></header>
</body></html>`;
}

const BREADCRUMB_PAGES = [
    ['https://thunderstore.io/communities/', 'communities', 'Communities', 'Communities', '社区', '社区'],
    ['https://thunderstore.io/package/create/', 'upload', 'Upload', 'Upload package', '上传', '上传包'],
    ['https://thunderstore.io/tools/markdown-preview/', 'global', 'Markdown Preview', 'Markdown Preview', 'Markdown 预览', 'Markdown 预览'],
    ['https://thunderstore.io/tools/manifest-v1-validator/', 'global', 'Manifest Validator', 'Manifest Validator', '清单校验器', '清单校验器'],
];

const TS_AUTHOR_MISC_HTML = `<!DOCTYPE html><html><body>
  <nav class="breadcrumbs breadcrumbs--variant--default breadcrumbs--size--medium">
    <a aria-label="Home" class="link breadcrumbs__segment breadcrumbs__homelink" href="/"><span class="breadcrumbs__item-content"><svg></svg></span></a>
    <a class="link link--variant--cyber breadcrumbs__segment" href="/communities/"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">Communities</span></span></a>
    <a class="link link--variant--cyber breadcrumbs__segment" href="/c/riskofrain2/"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">Risk of Rain 2</span></span></a>
    <span class="breadcrumbs__segment"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">Misc</span></span></span>
  </nav>
  <section class="page team">
    <header class="page-header page-header--simple"><div class="page-header__content-simple"><div class="page-header__info">
      <h1 class="display display--variant--primary display--size--2 page-header__heading">Mods uploaded by <!-- -->Misc</h1>
    </div></div></header>
    <div class="package-search package-search--with-sidebar-ad">
      <div class="package-search__sidebar"><div class="package-search__filters">
        <details class="collapsible" open><summary class="button button--variant--secondary button--size--big button--ghost collapsible__header">Sections<svg></svg></summary>
          <div class="collapsible__content"><div role="radiogroup" class="radio-group" aria-required="false">
            <label class="radio-group__label radio-group__label--unselected"><button type="button" role="radio" aria-checked="false" value="all" class="radio-group__radio"><svg></svg></button><input type="radio" value="all">All</label>
            <div class="radio-group__divider" role="presentation"></div>
            <label class="radio-group__label radio-group__label--selected"><button type="button" role="radio" aria-checked="true" value="mods" class="radio-group__radio"><svg></svg></button><input type="radio" checked value="mods">Mods</label>
            <label class="radio-group__label radio-group__label--unselected"><button type="button" role="radio" aria-checked="false" value="modpacks" class="radio-group__radio"><svg></svg></button><input type="radio" value="modpacks">Modpacks</label>
          </div></div></details>
      </div></div>
      <div class="package-search__content">
        <div class="package-search__search-params"><div class="package-search__results"><p class="package-count">No results</p></div></div>
        <div class="package-search__packages"><div class="empty-state no-result">
          <div class="empty-state__icon no-result__ghostbounce"><svg></svg></div>
          <div class="no-result__info">
            <span class="empty-state__title ">It's empty in here</span>
            <span class="empty-state__message ">Team Misc hasn't uploaded any mods for this community yet.</span>
          </div>
        </div></div>
      </div>
    </div>
  </section>
</body></html>`;

/* 极简作者页：只保留面包屑非链接末段 + 页头 + Sections 侧栏，用于把作者名换成任意与 UI 同串的值。
 * splitHeading=true 复现 React 注释拆节点的真实形态，false 复现单文本节点形态。 */
function authorPageHTML(name, splitHeading) {
    const heading = splitHeading ? 'Mods uploaded by <!-- -->' + name : 'Mods uploaded by ' + name;
    return `<!DOCTYPE html><html><body>
  <nav class="breadcrumbs breadcrumbs--variant--default breadcrumbs--size--medium">
    <a aria-label="Home" class="link breadcrumbs__segment breadcrumbs__homelink" href="/"><span class="breadcrumbs__item-content"><svg></svg></span></a>
    <a class="link link--variant--cyber breadcrumbs__segment" href="/communities/"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">Communities</span></span></a>
    <span class="breadcrumbs__segment"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">${name}</span></span></span>
  </nav>
  <section class="page team">
    <header class="page-header page-header--simple"><div class="page-header__content-simple"><div class="page-header__info">
      <h1 class="display display--variant--primary display--size--2 page-header__heading">${heading}</h1>
    </div></div></header>
    <div class="package-search package-search--with-sidebar-ad"><div class="package-search__sidebar"><div class="package-search__filters">
      <details class="collapsible" open><summary class="button button--variant--secondary button--size--big button--ghost collapsible__header">Sections<svg></svg></summary>
        <div class="collapsible__content"><div role="radiogroup" class="radio-group">
          <label class="radio-group__label radio-group__label--unselected"><button type="button" role="radio" aria-checked="false" value="all" class="radio-group__radio"><svg></svg></button><input type="radio" value="all">All</label>
          <label class="radio-group__label radio-group__label--selected"><button type="button" role="radio" aria-checked="true" value="mods" class="radio-group__radio"><svg></svg></button><input type="radio" checked value="mods">Mods</label>
        </div></div></details>
    </div></div></div>
  </section>
</body></html>`;
}

const NX_HTML = `<!DOCTYPE html><html><body>
  <nav><a>MODS</a><a>COLLECTIONS</a></nav>
  <button aria-label="Show search"></button>
  <div>Endorsements</div><div>Unique DLs</div><div>Virus scan</div>
  <div>Virus scan</div><div>Requirements</div>
  <div>06 September 2026, 6:22AM</div><div>122,730 results</div>
  <div class="mod-description">The Unofficial Patch fixes hundreds of bugs</div>
</body></html>`;

const NX_GAMES_HTML = `<!DOCTYPE html><html><body>
  <nav><button>Media</button><button>Community</button><button>Support</button><button>Search/</button><button>Upload</button>
    <button aria-label="Show notifications"></button><a aria-label="View messages"></a><button>Unread notifications</button>
    <button aria-label="Open profile menu"></button><button aria-label="Open navigation menu"></button></nav>
  <h1>All games</h1><p><span>Choose from</span> <b>5,619</b> <span>games</span> <span>to mod</span></p>
  <p>Affiliate link</p><p>Get games to mod, cheaper.</p><a>Discover offers</a>
  <button>Game</button><input placeholder="Search game"><button>Game genre</button>
  <label>Action <span>(952)</span></label><label>Dungeon crawl <span>(20)</span></label><label>Third-Person Shooter <span>(61)</span></label>
  <button>Vortex Support</button><div>No. of mods</div><div>No. of collections</div><button>Collections</button><button aria-label="Bookmark Skyrim Special Edition"></button>
  <a class="game-name">Skyrim Special Edition</a>
  <div class="mod-title">Sample Mod Name</div><div class="mod-description">About this mod</div>
  <footer><h3>Support Nexus Mods</h3><h3>Discover</h3><h3>Network stats</h3><a>Statistics</a><a>Careers</a><a>About us</a><a>Premium features</a>
    <a title="Join us on Discord"></a><span>Kudos</span><span>Served in 0.571s</span></footer>
</body></html>`;

const NX_GAME_HTML = `<!DOCTYPE html><html><body>
  <h2>Trending Mods</h2><a>View all</a><div>No. of endorsements</div>
  <h2>Collections</h2><a>View all</a><h2>Mods</h2>
  <div role="radiogroup" aria-label="Mods filter"><button>New</button><button>Updated</button><button>Trending</button><button>Popular</button><button>Surprise</button></div>
  <button aria-label="Time">All time</button><h2>Media</h2><div role="radiogroup" aria-label="Media filter"><button>Popular</button></div>
  <h2>Latest news</h2><a class="game-name">Skyrim Special Edition</a><div class="mod-title">Sample Mod Name</div>
</body></html>`;

const NX_NEXT_HOME_HTML = `<!DOCTYPE html><html><body>
  <h1>Welcome back,</h1><span class="profile-name">SampleUser</span>
  <button>My games</button><a>Tracking centre</a><a>Download history</a><a>My content</a><a>Add game</a>
  <h2>Trending Mods</h2><h2>Hot Collections</h2><h2>Latest news</h2>
  <button>New</button><button>Updated</button><button>Trending</button><button>Popular</button><button>Surprise</button>
  <button aria-label="Time">All time</button><div class="mod-title">Sample Mod Name</div>
</body></html>`;
const NX_COLLECTION_HTML = `<!DOCTYPE html><html><body>
  <h1>All collections</h1><button>Hide filters</button>
  <button>Game</button><input aria-label="games" placeholder="Search game"><button aria-label="Show games"></button>
  <button>Game version</button><label>1.6.1170.0</label>
  <button>Category</button><label>Essentials <span>(472)</span></label><label>Miscellaneous (598)</label><label>Themed (496)</label>
  <button>Badge</button><label>Official (5)</label><label>Top Pick (10)</label>
  <button>Included Mods</button><label>Collection (4,843)</label><label>Wabbajack list (26)</label>
  <button>Tags</button><input aria-label="Tags"><button>Adult Content</button><label>Hide adult content</label>
  <button>Show filters</button><button>Filter</button><button>Sort</button><button aria-label="Sort by">Highest rated</button>
  <button aria-label="Collections per page">20 items</button><button title="Previous page">Previous page</button><button title="Next page">Next page</button>
  <input aria-label="Jump to page"><button>Go</button>
  <a href="/games/skyrimspecialedition/collections/sample" class="collection-title">Themed</a>
  <p class="collection-description">This collection summary contains original author-written text.</p>
</body></html>`;

const NX_MEDIA_HTML = `<!DOCTYPE html><html><body>
  <h1>Skyrim Special Edition images</h1><button>Hide filters</button><button>Category</button>
  <label>Aesthetics (114,405)</label><label>Combat (4,243)</label><label>Funny (4,543)</label>
  <label>Misc (45,290)</label><label>Narrative (6,156)</label><label>Poses (25,776)</label>
  <label>Screenshot Community Event #18 (3,243)</label><button>Content options</button>
  <button>Show filters</button><button>Filter</button><button>Sort</button><button aria-label="Sort by">Recently added</button>
  <button aria-label="Sort direction">Desc</button><button aria-label="Media per page">20 items</button>
  <button title="Previous page">Previous page</button><button title="Next page">Next page</button>
  <a href="/games/skyrimspecialedition/images/123" class="media-title">Aesthetics</a>
  <p class="media-description">A user-written media description.</p>
</body></html>`;

const NX_NEWS_HTML = `<!DOCTYPE html><html><body>
  <h1>News &amp; Updates</h1><select><option>Jump</option></select>
  <select><option>All time</option><option>24 hrs</option><option>7 days</option><option>14 days</option><option>30 days</option><option>1 year</option><option>Range...</option></select>
  <input placeholder="From"><input placeholder="To">
  <select><option>Recent</option><option>Title</option><option>Author</option><option>Last Comment</option></select>
  <select><option>Asc</option><option>Desc</option></select>
  <select><option>20 items</option><option>40 items</option><option>60 items</option><option>80 items</option></select>
  <button>Learn more</button><h2>Trending Mods</h2>
  <article class="featured-article"><h2>Cyberpunk Modathon 2026</h2><p>Support</p><p>Dwarven Man</p><p>NexusSiteBot</p><p>Dwemer Man</p><p>A simple user description</p><span>readme.txt</span></article>
</body></html>`;
const NX_FORUM_HTML = `<!DOCTYPE html><html><body>
  <nav><a>Browse</a><a>Game Communities</a><a>Forums</a><a>Online Users</a><a>Guidelines</a><a>Staff</a>
    <a>Search</a><a>Events</a><a>Activity</a><a>Explore</a><a>Everywhere</a><a>Topics</a><a>Members</a>
    <a>Community Activity</a><a>Popular Game Communities</a><a>Active Topics</a><a>Tell a friend</a>
    <a>Email</a><a>Share</a><a>Contact Us</a><a>Cookies</a><span>Existing user? Sign In</span></nav>
  <a href="/forum/3-site-updates/">Site Updates</a>
  <a class="ipsDataItem_title" href="/topic/123-site-updates/">Site Updates</a>
  <div class="ipsType_richText">Site Updates</div>
  <div class="ipsDataItem_lastPoster"><span class="ipsDataItem_lastPoster__title">NexusSiteBot</span></div>
  <a href="/forum/12-vortex-support/">Vortex Support</a>
</body></html>`;
const NX_SUPPORT_HTML = `<!DOCTYPE html><html><body>
  <input placeholder="Search the knowledge base"><h2>Policies and Guidelines</h2>
  <h2>Frequently Asked Questions</h2><a>Account Settings</a><a>Website Features</a>
  <div class="prose">A help article about account settings stays in English.</div>
</body></html>`;
const NX_API_HTML = `<!DOCTYPE html><html><body>
  <h2>Legacy APIs</h2><h2>API Stability</h2><h2>Upcoming Changes</h2>
  <button>Request samples</button><button>Response samples</button><h3>Responses</h3>
  <div>PATH PARAMETERS</div><div>QUERY PARAMETERS</div><div>REQUEST BODY SCHEMA:</div>
  <button>Copy</button><button>Expand all</button><button>Collapse all</button><div>AUTHORIZATIONS:</div>
  <pre>GET /v1/games</pre><div class="prose">An API explanation remains unchanged.</div>
</body></html>`;
const NX_ACCOUNT_HTML = `<!DOCTYPE html><html><body>
  <label>Email or Username</label><input aria-label="Email or Username" value="account@example.test">
  <a>Forgot your Password?</a><span>Need an account?</span><a>Register here</a><button>Sign out</button>
  <span class="profile-name">SampleUser</span>
</body></html>`;
const NX_MOD_UI_HTML = `<!DOCTYPE html><html><body>
  <h2>Exclusive media content and more</h2><h3>File information</h3>
  <h3>Credits and distribution permission</h3><h3>Author notes</h3><h3>File credits</h3>
  <a>Donation Points system</a><a>See who endorsed this mod</a><button>Link a new video</button>
  <button>Tracking</button><button>Endorse</button><button>Vote</button>
  <div class="mod-title">Dwarven Man</div><div class="author-byline">NexusSiteBot</div>
  <div class="mod-description">A simple user description</div><a class="file-name">readme.txt</a>
  <article class="featured-article">Dwemer Man</article>
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

console.log('[jsdom · Thunderstore 作者列表页]');

await test('作者列表页固定 UI（筛选器/展示控件/徽标/分类标签）中文化且 UGC 原文保留', async () => {
    const dom = boot(TS_AUTHOR_HTML, 'https://thunderstore.io/c/gtfo/p/Kaldea/?deprecated=true');
    const d = dom.window.document;
    const api = dom.window.__MODS_ZH__;

    assert.strictEqual(api.page, 'author', '作者列表页须识别为独立页型并复用社区列表词条');
    assert.strictEqual(d.querySelector('.page-header__heading').textContent, '上传者 Kaldea', '页头只翻前缀，作者名保持原文');

    const sidebar = d.querySelector('.package-search__filters').textContent;
    for (const [expected, source] of [
        ['分区', 'Sections'], ['全部', 'All'], ['分类', 'Categories'],
        ['客户端模组', 'Client Mods'], ['开发工具', 'Dev Tools'], ['库', 'Libraries'],
        ['整合包', 'Modpacks'], ['远征序列模组', 'Rundown Mods'], ['远征序列', 'Rundowns'],
        ['其他筛选', 'Other filters'], ['已弃用', 'Deprecated'], ['成人内容', 'NSFW'],
    ]) assert.ok(sidebar.includes(expected), `${source} 未翻译：${sidebar}`);

    assert.strictEqual(d.querySelector('.display-controls__trigger--cards').getAttribute('aria-label'), '卡片布局');
    assert.strictEqual(d.querySelector('.display-controls__trigger--view').getAttribute('aria-label'), '内容宽度');
    assert.strictEqual(d.querySelector('.package-count').textContent, '1-3，共 3 条结果');

    const deprecatedCard = d.getElementById('card-deprecated');
    assert.strictEqual(deprecatedCard.querySelector('.card-package__title').textContent, 'Mastaba R66 ENDFIELD STANDARD ISSUE', '模组名不得翻译');
    assert.strictEqual(deprecatedCard.querySelector('.card-package__link').textContent, 'Kaldea', '作者名不得翻译');
    assert.strictEqual(deprecatedCard.querySelector('.card-package__prefix').textContent, '作者');
    assert.strictEqual(deprecatedCard.querySelector('.card-package__description').textContent,
        'Mastaba R66 的终末地风格皮肤。Endfield-style Mastaba R66 skin with floating holographic markings.', '描述不得翻译');
    assert.strictEqual(deprecatedCard.querySelector('.card-package__image-tags .tag').textContent, '已弃用', '卡片弃用徽标未翻译');
    assert.strictEqual(deprecatedCard.querySelector('.card-package__tags .tag').textContent, '客户端模组', '卡片分类标签未翻译');
    assert.strictEqual(deprecatedCard.querySelector('.card-package__updated').getAttribute('aria-label'), '最后更新');
    assert.ok(deprecatedCard.querySelector('.card-package__updated').textContent.includes('2 天前'));

    // UGC 与界面词条同串：模组名/描述/作者名保持原文，分类标签（界面枚举）照常翻译
    const ugcCard = d.getElementById('card-ugc');
    assert.strictEqual(ugcCard.querySelector('.card-package__title').textContent, 'Libraries', '与 UI 词条同串的模组名不得翻译');
    assert.strictEqual(ugcCard.querySelector('.card-package__link').textContent, 'ebkr');
    assert.strictEqual(ugcCard.querySelector('.card-package__description').textContent,
        'Deprecated NSFW 说明：All、View 与 Cards 都是用户原文的一部分。', '描述内与 UI 同串的文字不得翻译');
    assert.strictEqual(ugcCard.querySelector('.card-package__tags .tag').textContent, '库', '同一串出现在分类标签里仍应翻译');

    // 链接与属性不得被改写（title 在翻译白名单里，但内容是 UGC）
    const media = deprecatedCard.querySelector('.card-package__media');
    assert.strictEqual(media.getAttribute('title'), 'Mastaba R66 ENDFIELD STANDARD ISSUE by Kaldea');
    assert.strictEqual(media.getAttribute('href'), '/c/gtfo/p/Kaldea/Mastaba_R66_ENDFIELD_STANDARD_ISSUE/');
    assert.strictEqual(deprecatedCard.querySelector('.card-package__title').getAttribute('href'),
        '/c/gtfo/p/Kaldea/Mastaba_R66_ENDFIELD_STANDARD_ISSUE/');

    const search = d.getElementById('searchInput');
    assert.strictEqual(search.getAttribute('placeholder'), '搜索模组…');
    assert.strictEqual(search.getAttribute('aria-label'), '搜索模组');
    assert.strictEqual(search.value, 'Mastaba R66', '输入值必须保持原文');
    dom.window.close();
});

await test('展示控件下拉菜单动态挂载与关闭重开都被翻译', async () => {
    const dom = boot(TS_AUTHOR_HTML, 'https://thunderstore.io/c/gtfo/p/Kaldea/');
    const d = dom.window.document;
    const openMenu = (name, header, options) => {
        const menu = d.createElement('div');
        menu.className = 'display-controls__menu display-controls__menu--' + name;
        menu.setAttribute('role', 'menu');
        menu.innerHTML = '<div class="display-controls__header">' + header + '</div>' + options.map(([value, label]) =>
            '<div class="display-controls__option display-controls__option--' + value + '" role="menuitemradio">' +
            '<button type="button"><svg></svg>' + label + '</button></div>').join('');
        d.body.appendChild(menu);
        return menu;
    };

    const cardsMenu = openMenu('cards', 'Cards', [['grid', 'Grid'], ['list', 'List']]);
    const viewMenu = openMenu('view', 'View', [['compact', 'Compact'], ['wide', 'Wide']]);
    await wait(300);

    const text = d.body.textContent.replace(/\s+/g, ' ');
    for (const [expected, source] of [['卡片', 'Cards'], ['网格', 'Grid'], ['列表', 'List'],
        ['视图', 'View'], ['紧凑', 'Compact'], ['宽屏', 'Wide']]) {
        assert.ok(text.includes(expected), `${source} 未翻译：${text}`);
    }

    // 动态挂载的按钮属性同样要被翻译
    const lateTrigger = d.createElement('button');
    lateTrigger.setAttribute('aria-label', 'Card layout');
    d.body.appendChild(lateTrigger);
    await wait(300);
    assert.strictEqual(lateTrigger.getAttribute('aria-label'), '卡片布局', '动态节点属性未被翻译');

    // Radix 关闭即卸载菜单节点；重开是全新节点，必须被 MutationObserver 再次接管
    cardsMenu.remove();
    viewMenu.remove();
    await wait(200);
    const reopened = openMenu('cards', 'Cards', [['grid', 'Grid'], ['list', 'List']]);
    await wait(300);
    assert.strictEqual(reopened.querySelector('.display-controls__header').textContent, '卡片');
    assert.deepStrictEqual(
        [...reopened.querySelectorAll('.display-controls__option button')].map(b => b.textContent),
        ['网格', '列表'],
        '重开的菜单节点必须被再次翻译'
    );
    dom.window.close();
});

await test('作者列表页关闭中文化后逐字还原', async () => {
    const dom = boot(TS_AUTHOR_HTML, 'https://thunderstore.io/c/gtfo/p/Kaldea/?deprecated=true');
    const d = dom.window.document;
    const api = dom.window.__MODS_ZH__;
    api.setEnabled(false);

    assert.strictEqual(d.querySelector('.page-header__heading').textContent, 'Mods uploaded by Kaldea');
    const sidebar = d.querySelector('.package-search__filters').textContent;
    for (const source of ['Sections', 'All', 'Client Mods', 'Dev Tools', 'Libraries', 'Modpacks',
        'Rundown Mods', 'Rundowns', 'Other filters', 'Deprecated', 'NSFW']) {
        assert.ok(sidebar.includes(source), `${source} 未还原：${sidebar}`);
    }
    assert.strictEqual(d.querySelector('.display-controls__trigger--cards').getAttribute('aria-label'), 'Card layout');
    assert.strictEqual(d.getElementById('searchInput').getAttribute('placeholder'), 'Search Mods...');
    assert.strictEqual(d.getElementById('searchInput').value, 'Mastaba R66');
    assert.strictEqual(d.querySelector('#card-deprecated .card-package__image-tags .tag').textContent, 'Deprecated');
    assert.strictEqual(d.querySelector('#card-deprecated .card-package__prefix').textContent, 'by');

    api.setEnabled(true);
    assert.strictEqual(d.querySelector('.page-header__heading').textContent, '上传者 Kaldea');
    dom.window.close();
});

await test('作者名与界面词条同串：标题前缀与固定 UI 照翻，作者名与面包屑保持原字节', async () => {
    const dom = boot(TS_AUTHOR_MISC_HTML, 'https://thunderstore.io/c/riskofrain2/p/Misc/');
    const d = dom.window.document;
    assert.strictEqual(dom.window.__MODS_ZH__.page, 'author');
    assert.strictEqual(d.querySelector('.page-header__heading').textContent, '上传者 Misc', '作者名 Misc 不得被翻成“杂项”');
    assert.deepStrictEqual([...d.querySelectorAll('.breadcrumbs__item-label')].map(e => e.textContent),
        ['社区', 'Risk of Rain 2', 'Misc'], '面包屑只翻固定项与链接项，作者名保持原文');
    const sidebar = d.querySelector('.package-search__filters').textContent;
    assert.ok(sidebar.includes('分区'), '侧栏 Sections 未翻译：' + sidebar);
    assert.ok(sidebar.includes('全部'), '侧栏 All 未翻译：' + sidebar);
    assert.ok(sidebar.includes('模组'), '侧栏 Mods 未翻译：' + sidebar);
    assert.ok(sidebar.includes('整合包'), '侧栏 Modpacks 未翻译：' + sidebar);

    dom.window.__MODS_ZH__.setEnabled(false);
    assert.strictEqual(d.querySelector('.page-header__heading').textContent, 'Mods uploaded by Misc');
    dom.window.__MODS_ZH__.setEnabled(true);
    assert.strictEqual(d.querySelector('.page-header__heading').textContent, '上传者 Misc');
    dom.window.close();
});

await test('作者名等于 All/Cards/View/Deprecated 等词条时两种页头形态都保持原字节', async () => {
    for (const name of ['Misc', 'Tools', 'All', 'Libraries', 'Cards', 'View', 'Deprecated']) {
        for (const split of [true, false]) {
            const dom = boot(authorPageHTML(name, split), 'https://thunderstore.io/c/gtfo/p/' + name + '/');
            const d = dom.window.document;
            const tag = `${name} / ${split ? 'split' : 'single'}`;
            assert.strictEqual(dom.window.__MODS_ZH__.page, 'author', tag);
            assert.strictEqual(d.querySelector('.page-header__heading').textContent, '上传者 ' + name, tag + ' 作者名被改写');
            assert.strictEqual(d.querySelectorAll('.breadcrumbs__item-label')[1].textContent, name, tag + ' 面包屑作者名被改写');
            assert.strictEqual(d.querySelectorAll('.breadcrumbs__item-label')[0].textContent, '社区', tag + ' 面包屑固定项未翻译');
            const sidebar = d.querySelector('.package-search__filters').textContent;
            assert.ok(sidebar.includes('分区'), tag + ' 侧栏 Sections 未翻译');
            assert.ok(sidebar.includes('全部'), tag + ' 侧栏 All 未翻译（作者名同串不得连累侧栏）');
            dom.window.close();
        }
    }

    // 反向：同一个词在社区页作为分类枚举时必须照常翻译（保护只作用于作者名/面包屑名称）
    const communityDom = boot(`<!DOCTYPE html><html><body>
        <h1 class="display display--variant--primary display--size--3">Lethal Company</h1>
        <ol class="checkbox-list"><li><label class="checkbox-list__label"><span><button class="checkbox-list__icon"></button>Misc</span></label></li>
          <li><label class="checkbox-list__label"><span><button class="checkbox-list__icon"></button>Tools</span></label></li></ol>
      </body></html>`, 'https://thunderstore.io/c/lethal-company/');
    assert.strictEqual(communityDom.window.__MODS_ZH__.page, 'community');
    assert.deepStrictEqual([...communityDom.window.document.querySelectorAll('.checkbox-list__label')].map(e => e.textContent),
        ['杂项', '工具'], '社区页分类 Misc/Tools 仍须翻译');
    communityDom.window.close();
});

await test('真实 Misc 空态与团队提示被翻译且保留团队名', async () => {
    const dom = boot(TS_AUTHOR_MISC_HTML, 'https://thunderstore.io/c/riskofrain2/p/Misc/');
    const d = dom.window.document;
    assert.strictEqual(d.querySelector('.package-count').textContent, '没有结果');
    assert.strictEqual(d.querySelector('.empty-state__title').textContent, '空空如也');
    assert.strictEqual(d.querySelector('.empty-state__message').textContent, '团队 Misc 还没有为该社区上传任何模组。');

    // 同一空态组件的其它真实分支（bundle 字面）：动态挂载后同样被接管
    const late = d.createElement('div');
    late.className = 'no-result';
    late.innerHTML = '<div class="no-result__info"><span class="empty-state__title">No results found</span>' +
        '<span class="empty-state__message">Make sure all keywords are spelled correctly or try different search parameters.</span></div>' +
        '<button class="no-result__button">Clear all filters</button>' +
        '<div class="empty-state"><span class="empty-state__message">Be the first to upload a mod!</span></div>';
    d.body.appendChild(late);
    await wait(300);
    assert.strictEqual(late.querySelectorAll('.empty-state__title')[0].textContent, '没有找到结果');
    assert.ok(late.querySelectorAll('.empty-state__message')[0].textContent.includes('请确认所有关键词拼写正确'),
        late.querySelectorAll('.empty-state__message')[0].textContent);
    assert.strictEqual(late.querySelector('.no-result__button').textContent, '清除所有筛选');
    assert.strictEqual(late.querySelectorAll('.empty-state__message')[1].textContent, '成为第一个上传模组的人！');
    dom.window.close();
});

await test('同一元素的 placeholder / aria-label / title 各自记录原文并在关闭、再开启后正确还原', async () => {
    const html = `<!DOCTYPE html><html><body>
      <input id="multi" placeholder="Search Mods..." aria-label="Search mods" title="Card layout" value="Kaldea">
      <button id="same" aria-label="Close" title="Close">Close</button>
    </body></html>`;
    const dom = boot(html, 'https://thunderstore.io/c/gtfo/');
    const d = dom.window.document;
    const api = dom.window.__MODS_ZH__;
    const multi = d.getElementById('multi');
    const same = d.getElementById('same');

    assert.strictEqual(multi.getAttribute('placeholder'), '搜索模组…');
    assert.strictEqual(multi.getAttribute('aria-label'), '搜索模组');
    assert.strictEqual(multi.getAttribute('title'), '卡片布局');
    assert.strictEqual(multi.value, 'Kaldea', '输入值不得被改写');
    assert.strictEqual(same.getAttribute('aria-label'), '关闭');
    assert.strictEqual(same.getAttribute('title'), '关闭');

    api.rescan();
    api.rescan();
    assert.strictEqual(multi.getAttribute('placeholder'), '搜索模组…', '重复扫描应保持幂等');
    assert.strictEqual(multi.getAttribute('title'), '卡片布局', '重复扫描应保持幂等');

    api.setEnabled(false);
    assert.strictEqual(multi.getAttribute('placeholder'), 'Search Mods...', 'placeholder 必须还原成自己的原文');
    assert.strictEqual(multi.getAttribute('aria-label'), 'Search mods', 'aria-label 必须还原成自己的原文');
    assert.strictEqual(multi.getAttribute('title'), 'Card layout', 'title 必须还原成自己的原文');
    assert.strictEqual(multi.value, 'Kaldea');
    assert.strictEqual(same.getAttribute('aria-label'), 'Close');
    assert.strictEqual(same.getAttribute('title'), 'Close');

    api.setEnabled(true);
    assert.strictEqual(multi.getAttribute('placeholder'), '搜索模组…', '再次开启后应重新翻译');
    assert.strictEqual(multi.getAttribute('aria-label'), '搜索模组');
    assert.strictEqual(multi.getAttribute('title'), '卡片布局');
    assert.strictEqual(multi.value, 'Kaldea');
    dom.window.close();
});

await test('SPA 从社区页切到作者页后按新页型重装配词条并保护作者名', async () => {
    const dom = boot('<!DOCTYPE html><html><body><div id="root"></div></body></html>', 'https://thunderstore.io/c/riskofrain2/');
    const d = dom.window.document;
    const api = dom.window.__MODS_ZH__;
    assert.strictEqual(api.page, 'community');

    d.getElementById('root').innerHTML = `<nav class="breadcrumbs">
        <a class="link breadcrumbs__segment" href="/communities/"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">Communities</span></span></a>
        <span class="breadcrumbs__segment"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">Tools</span></span></span>
      </nav>
      <h1 class="display page-header__heading">Mods uploaded by <!-- -->Tools</h1>
      <div class="package-search__filters"><summary class="collapsible__header">Sections<svg></svg></summary><div role="radiogroup"><label class="radio-group__label">All</label></div></div>`;
    dom.window.history.pushState({}, '', '/c/riskofrain2/p/Tools/');
    await wait(500);

    assert.strictEqual(api.page, 'author', 'SPA 路由变化后页型必须重新判定');
    assert.strictEqual(d.querySelector('.page-header__heading').textContent, '上传者 Tools');
    assert.deepStrictEqual([...d.querySelectorAll('.breadcrumbs__item-label')].map(e => e.textContent), ['社区', 'Tools']);
    assert.ok(d.querySelector('.package-search__filters').textContent.includes('分区'));
    assert.ok(d.querySelector('.package-search__filters').textContent.includes('全部'));
    dom.window.close();
});

await test('单结果计数（无区间）的单文本与 React 拆分形态都翻译，数字与结构保留', async () => {
    const html = `<!DOCTYPE html><html><body>
      <p class="package-count" id="split-single"><b>1 </b>&nbsp;of&nbsp;<b>1</b>&nbsp;result</p>
      <p class="package-count" id="split-last-page"><b>21 </b>&nbsp;of&nbsp;<b>21</b>&nbsp;results</p>
      <p class="package-count" id="split-range"><b>1-3 </b>&nbsp;of&nbsp;<b>3</b>&nbsp;results</p>
      <p class="package-count" id="text-single">1 of 1 result</p>
      <p class="package-count" id="text-nbsp">1&nbsp;of&nbsp;1&nbsp;result</p>
      <p class="package-count" id="text-range">1-3 of 3 results</p>
      <p class="package-description" id="ugc">1 of 1 result</p>
      <div id="late"></div>
    </body></html>`;
    const dom = boot(html, 'https://thunderstore.io/c/gtfo/p/Kaldea/');
    const d = dom.window.document;
    const api = dom.window.__MODS_ZH__;
    const nbsp = String.fromCharCode(160);
    const text = id => d.getElementById(id).textContent;

    assert.strictEqual(text('split-single'), '1，共 1 条结果', '真实 SSR 形态：<b>1 </b>' + nbsp + 'of' + nbsp + '<b>1</b>' + nbsp + 'result');
    assert.strictEqual(text('split-last-page'), '21，共 21 条结果', '末页仅 1 项时数字不带区间、result 为复数');
    assert.strictEqual(text('split-range'), '1-3，共 3 条结果', '原有区间形态不得回归');
    assert.strictEqual(text('text-single'), '1，共 1 条结果', '单文本节点形态');
    assert.strictEqual(text('text-nbsp'), '1，共 1 条结果', '单文本节点 + 不换行空格的空白差异');
    assert.strictEqual(text('text-range'), '1-3，共 3 条结果');
    assert.strictEqual(text('ugc'), '1 of 1 result', '用户描述里恰好是计数格式时不得翻译');

    // 数字节点与加粗结构保留
    const splitBolds = [...d.getElementById('split-single').querySelectorAll('b')].map(b => b.textContent);
    assert.deepStrictEqual(splitBolds, ['1', '1'], '数字节点必须保留且不带多余空格');
    assert.deepStrictEqual([...d.getElementById('split-last-page').querySelectorAll('b')].map(b => b.textContent),
        ['21', '21'], '大数字不得被改写或截断');

    // 关闭后逐字还原（含不换行空格与 <b> 尾随空格）
    api.setEnabled(false);
    assert.strictEqual(text('split-single'), '1 ' + nbsp + 'of' + nbsp + '1' + nbsp + 'result');
    assert.strictEqual(text('split-last-page'), '21 ' + nbsp + 'of' + nbsp + '21' + nbsp + 'results');
    assert.strictEqual(text('split-range'), '1-3 ' + nbsp + 'of' + nbsp + '3' + nbsp + 'results');
    assert.strictEqual(text('text-nbsp'), '1' + nbsp + 'of' + nbsp + '1' + nbsp + 'result');
    assert.strictEqual(text('ugc'), '1 of 1 result');
    api.setEnabled(true);
    assert.strictEqual(text('split-single'), '1，共 1 条结果', '再次开启后应重新翻译');

    // 动态插入（MutationObserver）与重开一致
    d.getElementById('late').innerHTML =
        '<p class="package-count" id="late-single"><b>1 </b>&nbsp;of&nbsp;<b>1</b>&nbsp;result</p>' +
        '<p class="package-count" id="late-plural"><b>7 </b>&nbsp;of&nbsp;<b>7</b>&nbsp;results</p>';
    await wait(300);
    assert.strictEqual(text('late-single'), '1，共 1 条结果', '动态插入的单结果计数未被接管');
    assert.strictEqual(text('late-plural'), '7，共 7 条结果');
    dom.window.close();
});

await test('固定 UI 面包屑（非链接末段）在社区总览/上传/工具页照常翻译且关闭后逐字还原', async () => {
    for (const [url, page, label, heading, expectLabel, expectHeading] of BREADCRUMB_PAGES) {
        const dom = boot(breadcrumbPageHTML(label, heading), url);
        const d = dom.window.document;
        const api = dom.window.__MODS_ZH__;
        const crumbs = () => d.querySelector('.breadcrumbs__item-label').textContent;
        const title = () => d.querySelector('.page-header__heading').textContent;

        assert.strictEqual(api.page, page, url + ' 页型判定');
        assert.strictEqual(crumbs(), expectLabel, url + ' 面包屑末段必须翻译（固定 UI，不是名称）');
        assert.strictEqual(title(), expectHeading, url + ' 页头必须翻译');

        api.setEnabled(false);
        assert.strictEqual(crumbs(), label, url + ' 关闭后面包屑必须逐字还原');
        assert.strictEqual(title(), heading, url + ' 关闭后页头必须逐字还原');
        api.setEnabled(true);
        assert.strictEqual(crumbs(), expectLabel, url + ' 再次开启后应重新翻译');
        dom.window.close();
    }
});

await test('名称保护不下降：包详情与社区页的末级面包屑名称仍保持原文', async () => {
    // 包详情：包名与界面词条同串（Tools），末级面包屑必须原样；页面固定 UI（Changelog）照常翻译
    const pkgDom = boot(`<!DOCTYPE html><html><body>
        <div class="breadcrumbs breadcrumbs--variant--default">
          <a class="link breadcrumbs__segment" href="/communities/"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">Communities</span></span></a>
          <a class="link link--variant--cyber breadcrumbs__segment" href="/c/gtfo/"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">GTFO</span></span></a>
          <span class="breadcrumbs__segment"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">Tools</span></span></span>
        </div>
        <a class="tabs-item"><span>Changelog</span></a><div>Latest version</div>
      </body></html>`, 'https://thunderstore.io/c/gtfo/p/ebkr/Tools/');
    const pd = pkgDom.window.document;
    assert.strictEqual(pkgDom.window.__MODS_ZH__.page, 'package');
    assert.deepStrictEqual([...pd.querySelectorAll('.breadcrumbs__item-label')].map(e => e.textContent),
        ['社区', 'GTFO', 'Tools'], '包名与界面词条同串时不得改写');
    assert.strictEqual(pd.querySelector('.tabs-item').textContent, '更新日志', '详情页固定 UI 仍须翻译');

    // 社区页：社区名与界面词条同串时同样保持原文
    const comDom = boot(`<!DOCTYPE html><html><body>
        <div class="breadcrumbs breadcrumbs--variant--default">
          <a class="link breadcrumbs__segment" href="/communities/"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">Communities</span></span></a>
          <span class="breadcrumbs__segment"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">Tools</span></span></span>
        </div>
        <summary class="collapsible__header">Sections<svg></svg></summary>
      </body></html>`, 'https://thunderstore.io/c/riskofrain2/');
    const cd = comDom.window.document;
    assert.strictEqual(comDom.window.__MODS_ZH__.page, 'community');
    assert.deepStrictEqual([...cd.querySelectorAll('.breadcrumbs__item-label')].map(e => e.textContent),
        ['社区', 'Tools'], '社区名不得被当界面词条翻译');
    assert.strictEqual(cd.querySelector('.collapsible__header').textContent, '分区');
    pkgDom.window.close();
    comDom.window.close();
});

await test('SPA 转换页型时按新页型重装配面包屑保护（不遗留、不丢失）', async () => {
    const communityHTML = `<!DOCTYPE html><html><body><div id="root">
        <div class="breadcrumbs breadcrumbs--variant--default">
          <a class="link breadcrumbs__segment" href="/communities/"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">Communities</span></span></a>
          <span class="breadcrumbs__segment"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">GTFO</span></span></span>
        </div>
        <h1 class="display page-header__heading">GTFO</h1>
      </div></body></html>`;
    const communitiesHTML = `<div class="breadcrumbs breadcrumbs--variant--default">
          <a class="link breadcrumbs__segment" href="/communities/"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">Communities</span></span></a>
          <span class="breadcrumbs__segment"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">Communities</span></span></span>
        </div><h1 class="page-header__heading">Communities</h1>`;
    const authorHTML = `<div class="breadcrumbs breadcrumbs--variant--default">
          <a class="link breadcrumbs__segment" href="/communities/"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">Communities</span></span></a>
          <a class="link link--variant--cyber breadcrumbs__segment" href="/c/riskofrain2/"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">Risk of Rain 2</span></span></a>
          <span class="breadcrumbs__segment"><span class="breadcrumbs__item-content"><span class="breadcrumbs__item-label">Misc</span></span></span>
        </div>
        <h1 class="page-header__heading">Mods uploaded by <!-- -->Misc</h1>`;

    const dom = boot(communityHTML, 'https://thunderstore.io/c/gtfo/');
    const d = dom.window.document;
    const api = dom.window.__MODS_ZH__;
    const labels = () => [...d.querySelectorAll('.breadcrumbs__item-label')].map(e => e.textContent);

    assert.strictEqual(api.page, 'community');
    assert.deepStrictEqual(labels(), ['社区', 'GTFO'], '社区页面包屑名称保持原文');

    // 社区页 → 社区总览：保护必须随页型撤掉，末段 "Communities" 要翻
    d.getElementById('root').innerHTML = communitiesHTML;
    dom.window.history.pushState({}, '', '/communities/');
    await wait(500);
    assert.strictEqual(api.page, 'communities');
    assert.deepStrictEqual(labels(), ['社区', '社区'], 'SPA 切到社区总览后不得沿用作者/社区保护');

    // 社区总览 → 作者页：保护必须随页型装配回来
    d.getElementById('root').innerHTML = authorHTML;
    dom.window.history.pushState({}, '', '/c/riskofrain2/p/Misc/');
    await wait(500);
    assert.strictEqual(api.page, 'author');
    assert.strictEqual(d.querySelector('.page-header__heading').textContent, '上传者 Misc');
    assert.deepStrictEqual(labels(), ['社区', 'Risk of Rain 2', 'Misc'], 'SPA 切到作者页后作者名必须受保护');
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

await test('游戏目录公共导航、筛选与页脚 UI 翻译且保留动态名称', async () => {
    const dom = boot(NX_GAMES_HTML, 'https://www.nexusmods.com/games');
    const d = dom.window.document;
    const text = d.body.textContent;
    for (const [source, translated] of [
        ['Media', '媒体'], ['Community', '社区'], ['Support', '支持'], ['Upload', '上传'],
        ['Unread notifications', '未读通知'],

        ['Discover', '发现'], ['Network stats', '站点数据'], ['Kudos', '赞许'],
        ['Choose from', '可供选择'], ['games', '款游戏'], ['Game genre', '游戏类型'],
        ['Action', '动作'], ['Dungeon crawl', '地牢探索'], ['Third-Person Shooter', '第三人称射击'],
        ['Get games to mod, cheaper.', '更便宜地购买可添加模组的游戏。'], ['Discover offers', '探索优惠'],
        ['Vortex Support', 'Vortex 支持'], ['No. of mods', '模组数'],
        ['No. of collections', '合集数'], ['Support Nexus Mods', '支持 NEXUS MODS'],
        ['Statistics', '统计'], ['Careers', '招聘'], ['About us', '关于我们'],
    ]) assert.ok(text.includes(translated), `${source} 未翻译：${text}`);
    for (const [source, translated] of [
        ['Show notifications', '显示通知'], ['View messages', '查看消息'],
        ['Open profile menu', '打开个人菜单'], ['Open navigation menu', '打开导航菜单'],
    ]) {
        const element = [...d.querySelectorAll('[aria-label]')].find(e => e.getAttribute('aria-label') === translated);
        assert.ok(element, `${source} aria-label 未翻译`);
    }
    assert.strictEqual(d.querySelector('input').getAttribute('placeholder'), '搜索游戏');
    assert.strictEqual(d.querySelector('[aria-label^="收藏 "]').getAttribute('aria-label'), '收藏 Skyrim Special Edition');
    assert.strictEqual(d.querySelector('.game-name').textContent, 'Skyrim Special Edition');
    assert.strictEqual(d.querySelector('.mod-title').textContent, 'Sample Mod Name');
    assert.strictEqual(d.querySelector('.mod-description').textContent, 'About this mod');
    const api = dom.window.__MODS_ZH__;
    api.setEnabled(false);
    assert.strictEqual(d.querySelector('.game-name').textContent, 'Skyrim Special Edition');
    assert.strictEqual(d.querySelector('[aria-label]').getAttribute('aria-label'), 'Show notifications');
    dom.window.close();
});

await test('游戏主页的趋势、媒体、时间筛选翻译且保留游戏名', async () => {
    const dom = boot(NX_GAME_HTML, 'https://www.nexusmods.com/games/skyrimspecialedition');
    const d = dom.window.document;
    const text = d.body.textContent;
    for (const [source, translated] of [
        ['Trending Mods', '趋势模组'], ['View all', '查看全部'], ['No. of endorsements', '认可数'],
        ['New', '最新'], ['Updated', '已更新'], ['Trending', '热门趋势'], ['Popular', '热门'],
        ['Surprise', '随机'], ['All time', '所有时间'], ['Media', '媒体'], ['Latest news', '最新消息'],
    ]) assert.ok(text.includes(translated), `${source} 未翻译：${text}`);
    assert.strictEqual(d.querySelector('.game-name').textContent, 'Skyrim Special Edition');
    assert.strictEqual(d.querySelector('.mod-title').textContent, 'Sample Mod Name');
    dom.window.close();
});

await test('next Nexus 首页固定控件翻译且账户与动态条目原样保留', async () => {
    const dom = boot(NX_NEXT_HOME_HTML, 'https://next.nexusmods.com/');
    const d = dom.window.document;
    const text = d.body.textContent;
    for (const [source, translated] of [
        ['Welcome back,', '欢迎回来，'], ['My games', '我的游戏'], ['Tracking centre', '追踪中心'],
        ['Download history', '下载历史记录'], ['My content', '我的内容'], ['Add game', '添加游戏'],
        ['Hot Collections', '热门合集'], ['Latest news', '最新消息'], ['All time', '所有时间'],
    ]) assert.ok(text.includes(translated), `${source} 未翻译：${text}`);
    assert.strictEqual(d.querySelector('.profile-name').textContent, 'SampleUser');
    assert.strictEqual(d.querySelector('.mod-title').textContent, 'Sample Mod Name');
    dom.window.close();
});
await test('合集页分类、徽章、排序和分页 UI 翻译且保护合集名', async () => {
    const dom = boot(NX_COLLECTION_HTML, 'https://www.nexusmods.com/collections');
    const d = dom.window.document;
    const text = d.body.textContent;
    for (const [source, translated] of [
        ['All collections', '所有合集'], ['Hide filters', '收起筛选'], ['Game version', '游戏版本'],
        ['Category', '分类'], ['Essentials', '必备'], ['Miscellaneous', '杂项'], ['Themed', '主题'],
        ['Badge', '徽章'], ['Official', '官方'], ['Top Pick', '精选'], ['Included Mods', '包含的模组'],
        ['Collection', '合集'], ['Wabbajack list', 'Wabbajack 列表'], ['Tags', '标签'],
        ['Adult Content', '成人内容'], ['Show filters', '展开筛选'], ['Filter', '筛选'],
        ['Sort', '排序'], ['Previous page', '上一页'], ['Next page', '下一页'], ['20 items', '每页 20 项'],
    ]) assert.ok(text.includes(translated), `${source} 未翻译：${text}`);
    assert.strictEqual(d.querySelector('.collection-title').textContent, 'Themed');
    assert.strictEqual(d.querySelector('.collection-description').textContent, 'This collection summary contains original author-written text.');
    assert.strictEqual(d.querySelector('label').textContent, '1.6.1170.0');
    const counted = [...d.querySelectorAll('label')].find(el => el.textContent.includes('(598)'));
    assert.strictEqual(counted.textContent, '杂项 (598)');
    const api = dom.window.__MODS_ZH__;
    api.setEnabled(false);
    assert.strictEqual(counted.textContent, 'Miscellaneous (598)');
    api.setEnabled(true);
    assert.strictEqual(counted.textContent, '杂项 (598)');
    dom.window.close();
});

await test('媒体页固定分类、分页属性和动态媒体标题保护', async () => {
    const dom = boot(NX_MEDIA_HTML, 'https://www.nexusmods.com/games/skyrimspecialedition/images');
    const d = dom.window.document;
    const text = d.body.textContent;
    for (const [source, translated] of [
        ['Category', '分类'], ['Aesthetics', '美学'], ['Combat', '战斗'], ['Funny', '搞笑'],
        ['Misc', '杂项'], ['Narrative', '叙事'], ['Poses', '姿势'],
        ['Screenshot Community Event #18', '截图社区活动 #18'], ['Content options', '内容选项'],
        ['Desc', '降序'], ['20 items', '每页 20 项'],
        ['Previous page', '上一页'], ['Next page', '下一页'],
    ]) assert.ok(text.includes(translated), `${source} 未翻译：${text}`);
    assert.strictEqual(d.querySelector('.media-title').textContent, 'Aesthetics');
    assert.strictEqual(d.querySelector('.media-description').textContent, 'A user-written media description.');
    assert.strictEqual(d.querySelector('[title="上一页"]').getAttribute('title'), '上一页');
    assert.strictEqual(d.querySelector('[aria-label="排序方向"]').getAttribute('aria-label'), '排序方向');
    dom.window.close();
});

await test('论坛导航与固定版块翻译，主题标题和帖子正文原样保留', async () => {
    const dom = boot(NX_FORUM_HTML, 'https://forums.nexusmods.com/');
    const d = dom.window.document;
    const text = d.body.textContent;
    for (const translated of ['浏览', '游戏社区', '论坛', '在线用户', '指南', '工作人员', '搜索', '活动', '动态', '探索', '全站', '主题', '社区动态', '热门游戏社区', '活跃主题', '推荐给朋友', '邮箱', '分享', '联系我们', 'Cookie 设置', '已有账号？登录', '网站更新', 'Vortex 支持']) {
        assert.ok(text.includes(translated), `${translated} should translate`);
    }
    assert.strictEqual(d.querySelector('a[href="/forum/3-site-updates/"]').textContent, '网站更新');
    assert.strictEqual(d.querySelector('a[href*="/topic/"]').textContent, 'Site Updates');
    assert.strictEqual(d.querySelector('.ipsType_richText').textContent, 'Site Updates');
    assert.strictEqual(d.querySelector('.ipsDataItem_lastPoster__title').textContent, 'NexusSiteBot');
    dom.window.close();
});

await test('Help Center 固定控件翻译且文章正文保留', async () => {
    const dom = boot(NX_SUPPORT_HTML, 'https://help.nexusmods.com/');
    const d = dom.window.document;
    for (const translated of ['政策与指南', '常见问题', '账号设置', '网站功能']) assert.ok(d.body.textContent.includes(translated), translated);
    assert.strictEqual(d.querySelector('input').getAttribute('placeholder'), '搜索知识库');
    assert.strictEqual(d.querySelector('.prose').textContent, 'A help article about account settings stays in English.');
    dom.window.close();
});

await test('API Docs 固定导航和控件翻译，代码与说明保留原文', async () => {
    const dom = boot(NX_API_HTML, 'https://api-docs.nexusmods.com/');
    const d = dom.window.document;
    for (const translated of ['旧版 API', 'API 稳定性', '即将变更', '请求示例', '响应示例', '响应', '路径参数', '查询参数', '请求正文架构：', '复制', '全部展开', '全部折叠', '授权：']) assert.ok(d.body.textContent.includes(translated), translated);
    assert.strictEqual(d.querySelector('pre').textContent, 'GET /v1/games');
    assert.strictEqual(d.querySelector('.prose').textContent, 'An API explanation remains unchanged.');
    dom.window.close();
});

await test('账户表单固定标签翻译且账户值保留', async () => {
    const dom = boot(NX_ACCOUNT_HTML, 'https://users.nexusmods.com/auth/sign_in');
    const d = dom.window.document;
    for (const translated of ['邮箱或用户名', '忘记密码？', '还没有账号？', '在此注册', '退出登录']) assert.ok(d.body.textContent.includes(translated), translated);
    assert.strictEqual(d.querySelector('input').getAttribute('aria-label'), '邮箱或用户名');
    assert.strictEqual(d.querySelector('input').value, 'account@example.test');
    assert.strictEqual(d.querySelector('.profile-name').textContent, 'SampleUser');
    dom.window.close();
});

await test('模组详情控件翻译且标题、作者、说明和文件名保留', async () => {
    const dom = boot(NX_MOD_UI_HTML, 'https://www.nexusmods.com/skyrimspecialedition/mods/196306');
    const d = dom.window.document;
    for (const translated of ['独家媒体内容及更多', '文件信息', '致谢与分发许可', '作者说明', '文件鸣谢', '捐赠点数系统', '查看认可此模组的用户', '关联新视频', '追踪', '认可', '投票']) assert.ok(d.body.textContent.includes(translated), translated);
    assert.strictEqual(d.querySelector('.mod-title').textContent, 'Dwarven Man');
    assert.strictEqual(d.querySelector('.author-byline').textContent, 'NexusSiteBot');
    assert.strictEqual(d.querySelector('.mod-description').textContent, 'A simple user description');
    assert.strictEqual(d.querySelector('.file-name').textContent, 'readme.txt');
    assert.strictEqual(d.querySelector('.featured-article').textContent, 'Dwemer Man');
    dom.window.close();
});

await test('新闻筛选器翻译但新闻标题与正文保留', async () => {
    const dom = boot(NX_NEWS_HTML, 'https://www.nexusmods.com/news');
    const d = dom.window.document;
    const text = d.body.textContent;
    for (const [source, translated] of [
        ['News & Updates', '新闻与动态'], ['Jump', '跳转'], ['All time', '所有时间'],
        ['24 hrs', '24 小时'], ['7 days', '7 天'], ['14 days', '14 天'], ['30 days', '30 天'],
        ['1 year', '1 年'], ['Range...', '自选范围…'], ['Recent', '最近'], ['Title', '标题'],
        ['Author', '作者'], ['Last Comment', '最新评论'], ['Asc', '升序'], ['Desc', '降序'],
        ['20 items', '每页 20 项'], ['Learn more', '了解更多'],
    ]) assert.ok(text.includes(translated), `${source} 未翻译：${text}`);
    assert.strictEqual(d.querySelector('.featured-article h2').textContent, 'Cyberpunk Modathon 2026');
    assert.strictEqual(d.querySelector('.featured-article p').textContent, 'Support');
    for (const value of ['Cyberpunk Modathon 2026', 'Dwarven Man', 'NexusSiteBot', 'Dwemer Man', 'A simple user description', 'readme.txt']) {
        assert.ok(d.body.textContent.includes(value), `${value} should remain original UGC`);
    }
    assert.ok(d.body.textContent.includes('趋势模组'), '页面固定栏目标题应翻译');
    dom.window.close();
});
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

await test('Nexus routes classify audited page groups', async () => {
    const cases = [
        ['https://www.nexusmods.com/games', 'games'],
        ['https://next.nexusmods.com/', 'home'],
        ['https://www.nexusmods.com/games/skyrimspecialedition', 'game'],
        ['https://www.nexusmods.com/games/skyrimspecialedition/mods', 'browse'],
        ['https://www.nexusmods.com/games/skyrimspecialedition/collections', 'collection'],
        ['https://www.nexusmods.com/collections', 'collection'],
        ['https://www.nexusmods.com/games/skyrimspecialedition/images', 'media'],
        ['https://www.nexusmods.com/games/skyrimspecialedition/videos', 'media'],
        ['https://www.nexusmods.com/news', 'news'],
        ['https://www.nexusmods.com/newsletter', 'global'],
        ['https://forums.nexusmods.com/', 'forums'],
        ['https://help.nexusmods.com/', 'support'],
        ['https://wiki.nexusmods.com/', 'support'],
        ['https://users.nexusmods.com/auth/sign_in', 'account'],
        ['https://www.nexusmods.com/skyrimspecialedition/mods/196306', 'mod'],
    ];
    for (const [url, page] of cases) {
        const dom = boot(NX_HTML, url);
        assert.strictEqual(dom.window.__MODS_ZH__.page, page, url);
        dom.window.close();
    }
});
console.log('\n' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) {
    for (const f of failures) console.error('\n--- ' + f.name + '\n' + (f.error && f.error.stack || f.error));
    process.exit(1);
}
