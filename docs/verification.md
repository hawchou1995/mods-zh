# 验证记录

本文件记录 v1.0.0 首发、v1.0.1 GTFO 截图补漏与 v1.0.2 上传/详情补全的验证证据；没验证的如实写在这里。

## 1. 词条取证（真实页面，2026-10-20）

| 站点 | 页面 | 方式 | 落盘 |
| --- | --- | --- | --- |
| Thunderstore | `/`、`/communities/`、`/c/lethal-company/`、`/c/lethal-company/p/BepInEx/BepInExPack/`、`/c/gtfo/` | Anysearch 页面抽取 + HawChow 提供的 GTFO 已登录页截图交叉核对 | `docs/evidence/thunderstore.txt` |
| Nexus Mods | `/skyrimspecialedition/mods/266`（模组详情页）、`/games/skyrimspecialedition/mods`（浏览页） | Chromium 实机 DOM 读取（`innerText` + `placeholder` / `aria-label` 原值） | `docs/evidence/nexus.txt` |

Nexus 站点在抓取时经过 Cloudflare 校验，验证通过后取到的是 **2026 版新前端**页面（导航为 `GAMES / MODS / MOD UPDATES / COLLECTIONS / MEDIA / COMMUNITY / SUPPORT`）。旧版路径 `/<game>/mods/<id>` 仍可访问，字典对两套页面共用的文案一并覆盖，页型判定对两种 URL 都识别为 `mod`。

## 2. 词条覆盖率

```
$ npm run coverage
站点     : thunderstore   快照行数 : 203  命中 : 203 (100.0%)  未命中 : 0
站点     : nexus          快照行数 : 230  命中 : 230 (100.0%)  未命中 : 0
```

覆盖率的计算口径与运行期一致：跳过已是中文的行、跳过纯数字行，其余逐条走「精确字典 → 正则组」。任何一条未命中都会让命令 `exit 1`，所以在 CI 里它就是一道门禁。

## 3. 自动化测试

```
$ npm test
最小 DOM（test/smoke.test.mjs）：15 条，全通过
jsdom（test/browser.test.mjs）： 9 条，全通过
```

覆盖的行为：

| 项 | smoke | jsdom |
| --- | --- | --- |
| 词条总数 / 跨页型同键译法冲突 / 译文等于原文 | ✅ | |
| 字典命中（导航、分类、按钮、标签页） | ✅ | ✅ |
| 正则 / 上下文计数（结果计数、相对时间、两种日期、`Required (N)`、`Go to page N`） | ✅ | ✅ |
| UGC 区域保持原文（`.package-description`、`.mod-description`） | ✅ | ✅ |
| Cookiebot 弹窗整棵子树跳过 | ✅ | |
| 属性翻译（`placeholder` / `aria-label`） | ✅ | ✅ |
| 动态插入节点被 MutationObserver 接管 | | ✅ |
| 统计文案拆在 `<strong>` 与普通文本节点间仍能翻译，且保留数字加粗结构 | | ✅ |
| `by` 静态前缀翻译为“作者”，作者名链接保持原文 | | ✅ |
| 开关关闭后逐字还原原文 | ✅ | ✅ |
| 页型判定（`mod` / `browse` / `package`） | | ✅ |

jsdom 跑的是**同一份 `dist/mods-zh.user.js`**，不是源码 —— 产物本身被测到，构建管线断裂会被抓到。

## 4. 未验证 / 未覆盖（明确留口）

1. **未在真实浏览器里对线上页面注入本脚本人肉验收。** 计划用 PI 内置浏览器 + 油猴装载实测，但本轮执行时浏览器面板不可见（`Browser view did not become visible`），`bsk` 守护进程也无法在本机常驻（`os error 5`，Job Object 限制），因此退回到 jsdom 集成测试 + 覆盖率体检。**首次安装后建议人工看一眼**：Thunderstore 社区页、Nexus 模组详情页各扫一遍，缺词按 README 的流程补。
2. **`next.nexusmods.com`（Beta 前端）未纳入**：DOM 仍在变，暂不覆盖。
3. **Thunderstore 旧站（Legacy）未纳入**。
4. **登录态页面未取证**：上传包页（`/package/create/`）与 Nexus 账号页（`users.nexusmods.com`）的词条按页面语义编写，属**未取证补充**，数量 20 条以内（`upload` 5 条、`account` 9 条及少量 global），命中与否取决于真实文案，不影响其余 300+ 条已验证词条。
5. **Cookiebot 弹窗刻意不翻**：第三方组件，自带多语言且节点量巨大，翻了收益低、风险高。

## 5. 复现方式

```bash
git clone https://github.com/hawchou1995/mods-zh
cd mods-zh
npm install
npm run verify
```

## 6. v1.0.0 首发线上验收（历史记录）

| 项 | 首发结果 |
| --- | --- |
| GitHub 仓库 | https://github.com/hawchou1995/mods-zh （PUBLIC，默认分支 main） |
| raw 产物 | HTTP 200，39473 字节 |
| Greasyfork | https://greasyfork.org/zh-CN/scripts/601176 ，版本 1.0.0 |
| 首发代码回抓 | 1010 行；除 Greasyfork 重写 `@downloadURL` / `@updateURL` 外，其余与本地一致 |

## 7. v1.0.1 截图补漏与本地验收

依据 `https://thunderstore.io/c/gtfo/` 页面抽取与用户提供的已登录 GTFO 截图，补齐：`Developers`、`Switch to legacy`、`Get Manager`、`Upload`、`Teams`、`Log Out`、`Search Mods...`、`Last updated`，以及 GTFO 分类 `Client Mods` / `Dev Tools` / `Rundown Mods` / `Rundowns`。已存在的 `Settings`、`Sections`、`All`、`Libraries`、`Modpacks`、`Other filters`、`Deprecated`、`Pinned` 保持原词条。

截图里的 `1-20 of 868 results` 实际由加粗数字与普通文本节点拼成，整句正则单独匹配不到；v1.0.1 在完整计数容器确认匹配后，只改 `of` / `results` 文本节点，保留数字加粗结构。作者行只翻静态 `by` 前缀，作者名链接与模组描述仍原样。

- `npm run verify`：15 条 smoke、7 条 jsdom 全过；Thunderstore 91/91、Nexus 230/230 覆盖。
- README 和 userscript `@description` 加入青橘反馈链接 `https://qingju.me/`。
- 脚本介绍页已回读到该链接；当前显示版本 1.0.1，版本历史页包含 1.0.1。

## 8. v1.0.1 线上产物验收

| 项 | 结果 |
| --- | --- |
| GitHub raw | HTTP 200，42496 字节，SHA-256 `EA91B595493359767ECA3C1506F80956FD31E9E95D5377170F769A4447052A1F`；与本地产物一致 |
| Greasyfork 版本历史 | `1.0.1` 命中 |
| Greasyfork CDN | 42560 字节，版本 `1.0.1`，介绍含 `https://qingju.me/`；忽略站点重写的两条更新 URL 后，与本地产物逐行一致 |
| Greasyfork CDN SHA-256 | `69AE151610138D7F656B34A4FFCBCEF41AE51820B6F3D4085792C877FFB5C9AE`；比本地产物多的 64 字节来自 `@downloadURL` / `@updateURL` 的站点重写 |

更新通过已登录浏览器在既有脚本 `/zh-CN/scripts/601176/versions/new` 提交，走 `code_upload` 上传源码；更新说明为 v1.0.1，不新建脚本。

## 9. v1.0.2 上传页与 Required 漏译修复

- `/package/create/` 原始 DOM 取证覆盖帮助说明、三段内联链接、上传区、10GB 限制、Team/Communities/Categories 区块、NSFW 说明、No/Yes、Reset/Submit、占位符、ARIA 标签与页脚导航。
- 详情页源 HTML 的标签实际是 `Required (<!-- -->0<!-- -->)`：React 注释把标签、计数和括号拆成独立文本节点，导致整句正则和单词字典都可能漏掉。v1.0.2 在完整 `Required (N)` 容器匹配后改标签和括号，保留数字节点；`/required` 空态文案也一并翻译。
- `lookup()` 改为先查精确白名单、再对未知长文本应用长度门。已验证精确的 NSFW 帮助文案和页脚说明会翻译，未收录长句仍保持原文。
- `npm run verify`：15 条 smoke + 9 条 jsdom 全过；覆盖率 Thunderstore 203/203、Nexus 230/230。
- v1.0.2 已发布到既有 Greasyfork 脚本 601176；更新通过已登录浏览器在 `/zh-CN/scripts/601176/versions/new` 提交 `code_upload`，非新建脚本。线上回抓结果：
  - GitHub 代码提交：`d1bca55437c96275d8d84788e43bd3623d07e076`；raw 产物 HTTP 200 / 50322 B / SHA-256 `0EE17920EA2F5E7CD54068385EDDFE7E715472829EA69BC4ABBC6956655B5AFD`。
  - Greasyfork 版本历史命中 `1.0.2`，更新说明已显示；脚本页显示 1.0.2 且介绍包含 `https://qingju.me/`。
  - Greasyfork CDN 50386 B / SHA-256 `FC6813098546044DF3153ECF041D1CB43DDE3B4F38B721BFA6C5FACF13CACCE2`；移除 Greasyfork 自动改写的 `@downloadURL` / `@updateURL` 后，与本地源码逐行一致。

## 10. 实时动态筛选与分段结果计数补全（2026-10-20）

- 在真实浏览器检查 `https://thunderstore.io/c/lethal-company/` 与 `https://thunderstore.io/c/gtfo/`：展开 Filters 并打开排序菜单，核对 Lethal Company 分类、GTFO 分类、分页控件及 ARIA 标签。抓取的 UI-only 快照：`docs/evidence/thunderstore-dynamic.txt`。
- 新发现的词条补入全局/社区词典：`Close`、`Next`、`Pagination`、大小写不同的 `Last Updated`、`Card layout`、`Content width`、`Newest`、`Most downloaded`、`Top rated`。原有 `Asset Replacements`、`APIs & Libraries` 及 GTFO 分类词条已覆盖。
- 真实列表 DOM 为 `<p class="package-count"><b>1-20 </b>&nbsp;of&nbsp;<b>868</b>&nbsp;result<!-- -->s</p>`。引擎此前虽能匹配完整容器，却漏掉 React 注释拆开的 `result` / `s`，并保留范围数字后的空格；现改为输出 `1-20，共 868 条结果`，关闭中文化后精确恢复原始节点。
- 新增 jsdom 动态面板与计数回归；`npm run verify`：15 条 smoke、11 条 jsdom 全通过；Thunderstore 原快照 203/203、新增动态快照 54/54、Nexus 230/230。
- 2026-10-20 的未登录公开浏览器访问曾跳转登录页；2026-10-21 续测时用 bsk 登录 profile 打开上传页，完整结果见第11节。v1.0.2 的早期未登录限制已由后续实测补齐。
- 第10节编写时的二次补丁仍在本地，仓库发布版为 v1.0.2；后续发版状态见第11节。

## 11. bsk 登录态上传页动态控件与 ZIP 校验补全（2026-10-21）

- bsk `status --json` 确认 Chrome 扩展在线。曾列出一个 Thunderstore 用户标签，但借用时返回 `No tab with id`，随后列表中该标签消失；未伪称成功借用。改在同一已登录 Chrome profile 的 bsk Agent 标签打开 `https://thunderstore.io/package/create/`；页面 GET HTTP 200、标题 `Upload package | Thunderstore`，`/api/experimental/current-user/` 返回 HTTP 200。
- 从同源原始 HTML 读取确认静态英文；页面另有翻译扩展改写可见文字，因此精确动态原文以 HTTP 200 的 `upload-B0mDWrXl.js` 字符串为准。
- 实际展开 Team、Communities 与分类控件；GTFO 分类选择器显示 `Select categories`。未选分类。用 scratch 中仅含文本条目的临时 ZIP 在 bsk 表单触发客户端本地校验，实测缺少 `manifest.json`、`icon.png`、`README.md` 和 BepInEx / Assembly-CSharp / DLL 数量提示；`Submit` 始终禁用。
- bsk 网络增量只有静态 JS、页面与社区数据 GET，没有文件上传或包提交请求。未选择最终 Submit，未产生线上提交。
- ZIP 校验提示、上传进度/错误状态与成功摘要文案已补全；结果计数兼容 singular/plural，React 尾缀清理不误增计数，成功摘要全角冒号在分段 DOM 中正确处理。动态错误详情统一本地化，所有长文本模式由 smoke 门禁确认完整锚定。
- `docs/evidence/thunderstore-dynamic.txt` 保存 UI-only 快照和 bundle 字面文案；未触发的网络失败、提交后校验提示标注为源码已核对、未手动触发。
- 最终发布前验证：`npm run verify`，16 条 smoke、12 条 jsdom 全过；Thunderstore 原快照 203/203、新增动态与上传校验快照 100/100、Nexus 230/230。构建产物 58,947 B / 1,338 行，版本 `1.0.3`；GitHub 与 GreasyFork 推送待进行。

## 12. 作者列表页（/c/<社区>/p/<作者>/）固定 UI 漏翻修复（2026-10-26）

用户截图：Thunderstore 在 GTFO 中按作者 `Kaldea` + 弃用筛选后，页头 `Mods uploaded by Kaldea`、左侧筛选器（`Sections`/`All`/`Client Mods`/`Dev Tools`/`Libraries`/`Modpacks`/`Rundown Mods`/`Rundowns`/`Other filters`/`Deprecated`/`NSFW`）、展示控件下拉（`Cards`/`Grid`/`List` 与 `View`/`Compact`/`Wide`）以及卡片上的 `Deprecated` 徽标与 `Client Mods` 标签仍是英文，而 `Categories`、搜索、`Last updated` 等已翻译。

- **真实路由与取证**：`curl` 直取 `https://thunderstore.io/c/gtfo/p/Kaldea/?deprecated=true` 返回 HTTP 200，标题 `Mods uploaded by Kaldea | Thunderstore - The GTFO Mod Database`，页头 DOM 为 `<h1 class="… page-header__heading">Mods uploaded by <!-- -->Kaldea</h1>`（React 注释把前缀与作者名拆成两个文本节点）。展示控件是 Radix 菜单，点开才把 `display-controls__menu` 挂到 `body`；菜单文案取自同源 `assets/PackageSearch-*.js` 常量（`header:"Cards"`/`"View"`，选项 `Grid`/`List`、`Compact`/`Wide`）。快照落盘 `docs/evidence/thunderstore-author.txt`（28 行，UI-only）。
- **根因**：`src/locals/thunderstore.js` 的 `detect(path)` 只认 `/c/<社区>/` 与 `/c/<社区>/p/<作者>/<包名>`；作者列表页 `/c/<社区>/p/<作者>/` 落到 `global` 页型，于是只装配 global 词条。截图里已翻译的 `Categories`、`Search`、`Last updated` 恰好在 global 组，而 `Sections`/`All`/GTFO 分类/`Other filters`/`Deprecated`/`NSFW`/`Pinned`/`Card layout`/`Content width` 都在 community 组，于是整组缺席；`Cards`/`Grid`/`List`/`View`/`Compact`/`Wide` 与页头 `Mods uploaded by` 此前根本没有词条。
- **修复**：新增页型 `author`，并在站点对象声明 `alias: { author: 'community' }`；`engine.js` 的 `buildDict()` 支持 `alias`（先铺共享页型再铺本页型），无需复制整组词条。补词条 `Cards`/`Grid`/`List`/`View`/`Compact`/`Wide`（community 组）、`Mods uploaded by`（author 组）、搜索框 `aria-label` 的 `Search mods`；页头用完整锚定正则 `/^Mods uploaded by (.+)$/` 覆盖“单文本节点”形态，作者名始终保留原文。UGC 守卫补 `[class*="card-package__title"]`：模组名即使与界面词条同串（如模组就叫 `Libraries`）也不翻译。
- **回归测试**（本轮快照，第 13 节又加了 5 条）：修复前 smoke 18/1 失败、jsdom 24/3 失败（`page` 判成 `global`、`Cards` 未翻译、关闭后未还原），修复后 smoke 19 条、jsdom 27 条全通过。新增用例覆盖作者列表页固定 UI、弃用筛选已启用状态、下拉菜单动态挂载 + 关闭重开、卡片徽标/分类标签、作者名两个不同取值（`Kaldea`/`ebkr`）与模组名/描述/输入值保持原文、关闭中文化逐字还原。
- `npm run verify`：19 条 smoke + 27 条 jsdom 全过；覆盖率（当时 `tools/coverage.mjs` 只有“全部分组并集”口径）Thunderstore 203/203、动态 100/100、作者列表页 28/28、Nexus 230/230 与 210/210。**注意：并集口径的 28/28 不能证明 author 路由真的命中**，第 13 节已改为 `--page author` 页型门禁。产物 `dist/mods-zh.user.js` 75,094 B / 1,705 行，版本仍为 `1.0.4`（未升版本、未发布）。
- **未验证**：本轮未在真实浏览器里注入脚本验收（仅用 curl 取服务端 SSR HTML 与同源 bundle 文本、jsdom 复现真实 DOM 结构）；Radix 菜单的真实挂载点由 bundle 源码确定，测试用同结构节点模拟。

## 13. Code Review 修复：作者名保护、属性原文、空态补译、覆盖率口径（2026-10-26）

上一轮（第 12 节）作者页 alias 修好了漏翻，但 alias 引入 community 组后带来新回归；本轮按 Code Review 的四条实证问题修复。

- **A 作者名被当界面词条翻译**。真实 `https://thunderstore.io/c/riskofrain2/p/Misc/`（HTTP 200）的页头是 `<h1 class="… page-header__heading">Mods uploaded by <!-- -->Misc</h1>`，面包屑末段是非链接 `<span class="breadcrumbs__segment">…<span class="breadcrumbs__item-label">Misc</span></span>`。作者名 `Misc`/`Tools`/`All` 与社区组词条同串，整节点查表会变成“杂项”“工具”“全部”。修复：站点对象新增 `namePrefixes` 规则，引擎新增 `translateHeaderNamePrefix()`——**只替换页头里的前缀片段**，同一页头其余文本节点进 `State.protectedNodes` 整节点跳过（`translateTextNode()` 首行拦截），单文本节点形态只替换前缀、名称原字节保留；面包屑末段用 `span.breadcrumbs__segment` 整棵跳过（固定项 `Communities` 是 `<a>`，不受影响）。**注意：这条当时写进了全局 `ignore`，属于本条修复的过度收窄，已在第 15 节按页型收窄并补回归。**作者页仍整体翻译固定 UI，未做整页忽略。反向也验证过：Lethal Company 社区页的分类 `Misc`/`Tools` 照常翻成“杂项”“工具”。
- **B 同一元素多个属性的原文互相覆盖**。真实 `#searchInput` 同时有 `placeholder="Search Mods..."` 与 `aria-label="Search mods"`，旧实现 `State.originals` 按元素只存一个字符串，关闭后两属性都还原成 `Search Mods...`。修复：新增 `State.attrOriginals`（元素 → `{ 属性名: 原文 }`），`translateAttributes()` 逐属性记录，`restoreAll()` 逐属性还原；`onLocationChange()` 与菜单「重新扫描」一并重置。输入值与文本节点还原逻辑不变。
- **C 两种页头形态译法不一致**。拆节点形态输出「上传者 Kaldea」，单文本节点形态原为「Kaldea 上传的模组」。统一为「上传者 <名称>」，两条路径（`translateHeaderNamePrefix` 与 `^Mods uploaded by (.+)$` 正则）都只前置固定词，名称原字节返回；正则改用函数式替换，名称里的 `$` 不会被当成替换语法。
- **D 空态未翻译**。真实 `/c/riskofrain2/p/Misc/` 的空态为 `<p class="package-count">No results</p>` + `<span class="empty-state__title">It's empty in here</span>` + `<span class="empty-state__message">Team Misc hasn't uploaded any mods for this community yet.</span>`。补 `No results`、`It's empty in here`、`No results found`、`Clear all filters`、`Be the first to upload a mod!`、`Make sure all keywords are spelled correctly or try different search parameters.`（community 组，author 页经 alias 复用），团队提示走完整锚定正则 `^Team (.+) hasn['’]t uploaded any mods for this community yet\.$` → 「团队 <名称> 还没有为该社区上传任何模组。」，只换模板文字、团队名原样，未做全站无界替换。
- **E 覆盖率口径**。`tools/coverage.mjs` 原来把所有分组取并集，作者快照 28/28 不能证明 author 路由真的命中。现新增可选 `--page <页型>`：只装配运行期会加载的 `global + alias 共享页型 + 本页型`，`package.json` 的作者快照改为 `--page author` 门禁；默认（无参数）仍是并集口径，供找缺口用，工具未重构。真正端到端仍由 jsdom 集成测试保证：用例以 `https://thunderstore.io/c/riskofrain2/p/Misc/`、`https://thunderstore.io/c/gtfo/p/Kaldea/` 启动产物并断言 `__MODS_ZH__.page === 'author'` 与具体译文。
- **修复前负向记录**（先加测试后改代码，原始摘要）：jsdom `27 passed, 5 failed`，失败为 `上传者 杂项 !== 上传者 Misc`、`上传者 工具 !== 上传者 Tools`、`No results !== 没有结果`、`aria-label 还原成 'Search Mods...'`、SPA 切到作者页后标题仍被改写。
- **修复后**：`npm run verify` rc=0 —— smoke 19 条、jsdom 32 条全过；覆盖率 Thunderstore 203/203、动态 100/100、作者页 35/35（`--page author` 页型门禁）、Nexus 230/230 与 210/210；产物 80,636 B / 1,794 行，版本仍 `1.0.4`。
- **真实 SSR 复测**（curl HTTP 200 + jsdom 跑产物，非浏览器注入）：`/c/riskofrain2/p/Misc/` → 页型 `author`、h1「上传者 Misc」、面包屑 `["社区","Risk of Rain 2","Misc"]`、侧栏「分区/全部/模组/整合包」、`没有结果`、`空空如也`、`团队 Misc 还没有为该社区上传任何模组。`；`/p/Tools/`、`/p/All/` 同样保留名称；`/c/gtfo/p/Kaldea/` 与 `?deprecated=true` 维持上一轮结果且卡片标题/描述未变；`/c/lethal-company/` 分类 `Misc`→`杂项`；包详情页面包屑保留包名 `BepInExPack_GTFO`。**仍未在真实浏览器里注入脚本验收**。

## 14. 单结果计数（无区间）漏翻补齐（2026-10-26）

第 13 节复核真实作者页时发现：`/c/gtfo/p/Kaldea/` 只有 1 个结果时，计数仍是英文 `1 of 1 result` —— 这正是用户要求的“筛选后界面”漏翻，本轮补齐。

- **真实 DOM 结构**（curl HTTP 200，页面顶部与底部分页各一处，无 React 注释）：
  `<p class="package-count"><b>1 </b>\u00a0of\u00a0<b>1</b>\u00a0result</p>`。数字在 `<b>` 里且第一个 `<b>` 带尾随空格，`of` 与 `result` 各自是含不换行空格的独立文本节点，因此整句正则匹配不到、必须走分段计数处理器。
- **缺口根因**：`src/engine.js` 的 `translateSplitResultCounter()` 里 `resultRe` 原为强制区间 `^[\d,]+\s*-\s*[\d,]+ of [\d,]+ results?$`；页面总数为 1（或末页正好只剩 1 项）时 Thunderstore 的 PackageSearch 不输出 `-` 区间，于是整个计数容器不匹配，`of` / `result` 原样保留。单文本节点形态也缺词条，只剩 `^([\d,]+) results?$`（无 `of`）能命中。
- **最小修复**：`resultRe` 的区间段改为可选 `^[\d,]+(?:\s*-\s*[\d,]+)? of [\d,]+ results?$`；`of` 之前数字节点的尾随空格裁剪同样放宽到无区间形态（否则输出 `1 ，共 1 条结果`）；`patterns` 增补 `^([\d,]+|[\d,]+-[\d,]+) of (\d[\d,]*) results?$` 中无区间的一条 `^(\d[\d,]*) of (\d[\d,]*) results?$` → `$1，共 $2 条结果`（单文本节点形态）。数字原样保留，`result`/`results` 与拆开的 `s` 尾缀沿用原逻辑，未做任何无界替换。
- **回归**：先加测试跑负向 —— jsdom `32 passed, 1 failed`（`'1  of 1 result' !== '1，共 1 条结果'`）、smoke `18 passed, 1 failed`；修复后 jsdom 33 条、smoke 19 条全过。新用例覆盖 `<b>` 拆分 + 单文本 + 不换行空格差异、`1 of 1 result`/`21 of 21 results`/`1-3 of 3 results`、数字节点与加粗结构保留、关闭后逐字还原（含 `<b>` 尾随空格与 nbsp）、再开启、MutationObserver 动态插入；并断言用户描述里恰好是 `1 of 1 result` 时保持原文。
- **真实 SSR 复测**：`/c/gtfo/p/Kaldea/` 两处计数 → `1，共 1 条结果`，关闭后逐字回到 `1 \u00a0of\u00a01\u00a0result`，再开启复原，卡片标题/描述/作者与面包屑名称未变；`?deprecated=true` → `1-3，共 3 条结果`；`/c/gtfo/` → `1-20，共 887 条结果`；`/c/lethal-company/` → `1-20，共 19677 条结果`；`/c/riskofrain2/p/Misc/` → `没有结果`，均无回归。
- **验证**：`npm run verify` rc=0 —— smoke 19 条、jsdom 33 条全过；覆盖率 Thunderstore 203/203、动态 100/100、作者页 37/37（`--page author` 页型门禁）、Nexus 230/230 与 210/210；产物 80,948 B / 1,797 行，版本仍 `1.0.4`（未升版本、未发布）。

## 15. 面包屑保护过度收窄的回归修复（2026-10-26，独立定点复验）

第 13 节把 `span.breadcrumbs__segment` 写进了**全局** `ignore`。这个 class 同时承载两类内容：

| 页型 | 末段内容 | 期望 |
| --- | --- | --- |
| `author` `/c/<社区>/p/<作者>/` | 作者名（如 `Misc`/`Kaldea`） | 保持原文 |
| `package` `/c/<社区>/p/<作者>/<包名>/`（含 `/changelog/`、`/required/`） | 包名 | 保持原文 |
| `community` `/c/<社区>/` | 社区/游戏名 | 保持原文 |
| `communities` `/communities/` | 固定 UI `Communities` | **翻译成“社区”** |
| `upload` `/package/create/` | 固定 UI `Upload` | **翻译成“上传”** |
| `global` `/tools/markdown-preview/`、`/tools/manifest-v1-validator/` | 固定 UI `Markdown Preview` / `Manifest Validator` | **翻译成“Markdown 预览”/“清单校验器”** |

- **回归事实**（真实 SSR + HEAD/工作树对照，`git rev-parse HEAD = a7b7cb6`）：`/communities/` 面包屑由 `社区` 退回 `Communities`；`/package/create/` 由 `上传` 退回 `Upload`；`/tools/markdown-preview/` 由 `Markdown 预览` 退回 `Markdown Preview`；`/tools/manifest-v1-validator/` 由 `清单校验器` 退回 `Manifest Validator`。四页 h1 仍被翻译，只有面包屑退回——正是“全局 ignore 误伤固定 UI”的特征。
- **修复（按页型收窄，仍保留名称保护）**：站点对象新增 `ignorePages: { author, package, community: 'span.breadcrumbs__segment' }`；`src/engine.js` 的 `buildDict()` 改为 `State.ignoreSelector = [site.ignore, site.ignorePages[page]].filter(Boolean).join(',')`——与 `alias` 同为**按页型装配、换页型时重建**，既不漏配也不残留；全局 `ignore` 不再包含该选择器。页型边界经实站核对：`/c/<社区>/packages/` 返回 404（`community` 页型只有 `/c/<社区>/`），包子页 `/changelog/`、`/required/` 末段仍是包名，因此三类名称页型的保护无副作用。
- **回归测试（先负后正）**：新增 3 条 jsdom 用例 —— ①四个固定 UI 页（真实面包屑结构：Home `<a>` + 非链接 `span.breadcrumbs__segment`）面包屑与页头都要翻译、关闭后逐字还原、再开启复原；②名称保护不下降（包名 `Tools`、社区名 `Tools` 与界面词条同串时末段保持原文，同时详情页 `Changelog`→`更新日志` 照常）；③SPA 转换页型 `community → communities → author` 时保护随页型撤销/装配（社区总览末段要翻、作者名要保留）。负向记录：jsdom `34 passed, 2 failed`（`'Communities' !== '社区'` 与 SPA 后仍 `Communities`）；修复后 jsdom **36 passed / 0 failed**、smoke 19 passed / 0 failed。
- **真实 SSR 复测（10 个已抓页面，jsdom 跑产物）**：四个固定 UI 页面包屑恢复为 `社区`/`上传`/`Markdown 预览`/`清单校验器`，与 HEAD 逐项一致；作者页 `["社区","GTFO","Kaldea"]`、`["社区","Risk of Rain 2","Misc"]` 与 h1「上传者 …」不变；包详情（含 `/changelog/`、`/required/`）`["社区","GTFO","BepInExPack_GTFO"]` 且 `详情/必需依赖（0）/Wiki/更新日志` 照常；社区页 `["社区","GTFO"]`。全部页面“关闭 → 再开启”后与首次翻译结果逐字一致。
- **验证**：`npm run verify` rc=0 —— smoke 19 条 + jsdom 36 条全过；覆盖率不变（Thunderstore 203/203、动态 100/100、作者页 37/37 `--page author`、Nexus 230/230 与 210/210）；产物 82,136 B / 1,812 行，版本仍 `1.0.4`（未提交、未推送、未升版本、未发布）。

## 16. Nexus 浏览页（7 Days To Die）筛选分类、时间范围、页头固定 UI 漏翻修复（2026-10-27）

用户反馈 Nexus 仍有固定 UI 漏翻并附 `/games/7daystodie/mods`（endorsements + 28 天时间范围）截图。本轮新增证据快照 `docs/evidence/nexus-browse-2026-10-27.txt`。

- **取证（三路交叉，互不替代）**：
  1. **生产 JS chunk 原文**（实机页面内抓 40 个 `/_next/static` chunk，0 失败）：时间范围枚举 `All time` / `24 Hours` / `7 Days` / `14 Days` / `28 Days` / `1 Year`；页大小 `20 Items` / `40 Items` / `60 Items` / `80 Items`（**大写 I**）；chip 模板 `` `Time range: ${label}` ``（含 `custom` 兜底）；`Clear all`（`data-e2eid="remove-all-filters"`）；会员横幅两个子节点 `<span class="font-semibold …">Try Premium free</span>` + `" - unlock faster downloads & 1-click installs"`；CTA `Start free trial`。
  2. **SSR 原始 HTML**（页内同源 `fetch('/games/7daystodie/mods')`，124,566 B，无第三方翻译污染）：页头 `<h1 class="text-heading-md …"><span class="line-clamp-2 break-words">7 Days To Die mods</span></h1>`；`skyrimspecialedition/mods` 同构（`Skyrim Special Edition mods`）。
  3. **实机 DOM**（bsk Agent Window，真实 Chrome）：分类名与计数是**两个相邻 span**（`label > p > span.truncate` + `span.text-neutral-subdued`，计数形如 `(269)`）；卡片分类元数据是 `a[data-e2eid="mod-tile-category"]`，`href` 同时含 `/games/` 与 `?categoryName=`；时间范围是 HeadlessUI **Popover**（面板 `[id^="headlessui-popover-panel"]`，日期输入 `placeholder="From"/"To"`，另有 `From date` / `To date` 的 sr-only 文本与 `Go` 按钮）；chip 是 `button[data-e2eid^="remove-filter-time-range-"]`。
- **根因（三条，均由现场 DOM 与仓库代码证明，非推测）**：
  1. 计数正则 `^(.+) \(([\d,]+)\)$` 只认「同一文本节点」，实机却是「分类名 span + 计数 span」两个节点；分类名单独查表时又不在浏览页词库里 → `Avatars / Cheats / Creatures / Environment / Items - Food / Items and Loot / Maps / Prefabs / Quests / Vehicles / XML Edits / Zombies` 全部保持英文。
  2. `ignore` 里的 `[href*="/games/"]` 把卡片分类链接 `a[data-e2eid="mod-tile-category"]` 一并吞掉（其 `href` 同时含 `/games/` 与 `?categoryName=`）→ 卡片上的分类值（`Vehicles` / `Items and Loot` …）翻不出来。
  3. 页大小正则写成小写 `^([\d,]+) items$`，站点实际是 `20 Items`；时间范围枚举、`From`/`To`（此前只存在于 `news` 分组）、`Clear all`、chip 文案、横幅整句、`Start free trial` 既无词条也无规则。页头 `7 Days To Die mods` 同理（原注释也承认没处理）。
- **修复**：
  - `src/engine.js` 新增**上下文规则**能力：`buildScopedRules()`（按页型装配 `site.scoped`）+ `lookupScoped()`（`closest(rule.selector)` 判定，命中即停，结果不进全局缓存；文本节点与 `placeholder`/`aria-label`/`title` 属性都走同一入口）。
  - `src/locals/nexus.js` 用 5 条 `scoped` 规则（全部 `pages: ['browse']`）覆盖：分类筛选与卡片分类（含同节点计数形态 `Avatars (10)`）、时间 Popover（枚举 + `From/To` + `From date/To date` + `Go`）、选择器当前值（`[class~="group/select"]`）、chip 与 `Clear all`、页头固定 `mods` 后缀（`^(.+?) mods$` → `$1 模组`，游戏名原样）。
  - `ignore`：`[href*="/games/"]` 收窄为 `[href*="/games/"]:not([data-e2eid="mod-tile-category"])`；补 2026 新前端 UGC 守卫 `[data-e2eid="mod-tile-title"]` / `[data-e2eid="mod-tile-summary"]` / `[data-e2eid="user-link"]`。
  - 页大小正则改 `^([\d,]+)\s+items?$/i`（大小写/单复数变体，数字原样保留）；会员横幅第二节点加完整锚定规则 `^([-\u2013\u2014])?\s*unlock faster downloads\s*&\s*1-click installs$`。
  - 与 UGC 可能同形的串（分类枚举、时间枚举、`Clear all`、`20 Items`）**不进**全局 `dict`/`patterns`，只待在 `scoped` 里；`test/smoke.test.mjs` 增加门禁断言（scoped 必须声明 `pages`、selector 非空、正则完整锚定、译文≠原文，且这批键不得出现在全局词库）。
- **回归测试（先负后正）**：新增 9 条 jsdom + 1 条 smoke 词库审计。负向记录：jsdom `37 passed, 8 failed`（分类未翻译、卡片分类未翻译、页头未替换、横幅未翻译、时间选项只命中 `All time`、chip/页大小失败、开关还原失败、SPA 动态插入未翻译）+ smoke `19 passed`；修复后 jsdom **45 passed / 0 failed**、smoke **20 passed / 0 failed**。用例覆盖：拆分节点与同节点计数、卡片分类 vs 同名 UGC（标题 `Vehicles` / `Gameplay`、作者 `Avatars` / `28 Days`、摘要含 `Avatars (10)`）、页头只换后缀且 mod 页 `<h1>` 不受影响、横幅整句、时间下拉首次打开/关闭后重新插入/关闭开关后属性逐字还原、chip 与 `Clear all`、页大小大小写变体、SPA 跨游戏切换、以及「上下文不溢出到 mod 详情页」。
- **覆盖率（page-aware，静态口径）**：新快照 60 行。修前 `node tools/coverage.mjs nexus docs/evidence/nexus-browse-2026-10-27.txt --page browse` → `15/60 (25.0%)`，未命中 45 条（与截图清单逐项对应）；修后 `60/60 (100.0%)`。`tools/coverage.mjs` 同步支持 `scoped`（按页型装配），输出多一行「上下文规则 N 条」，避免上下文词条被误算成缺口。**`60/60` 只说明"按页型装配后能产出译文"，不验证 selector 是否命中、ignore 是否生效、真实 DOM/弹层是否出现**（见第 18 节的口径更正）；运行期证明是本节下面的真实浏览器注入复验与 jsdom 用例。
- **真实浏览器（bsk Agent Window + 真实 Chrome）**：脚本以 base64 分块注入页面（非扩展安装、未改扩展设置、未复制 Cookie、未碰用户标签页），`/games/7daystodie/mods` 实测：
  - 分类筛选 21 项全部中文且计数原样：`头像 (269)`、`作弊 (99)`、`生物 (130)`、`环境 (139)`、`物品 - 食品 (212)`、`物品和战利品 (782)`、`地图 (202)`、`预制建筑 (660)`、`任务 (101)`、`载具 (370)`、`XML 修改 (484)`、`僵尸 (195)` …
  - 卡片分类 `Vehicles` → `载具`，同卡片标题 `Vehicles`、作者 `28 Days`、摘要原文不变（合成卡片节点复验：`载具` / `Vehicles` / `28 Days` / `Avatars (10) and Cheats in 20 Items.`）。
  - 时间 Popover：`From`/`To` 的 placeholder 与 `From date`/`To date` → `起始日期`/`截止日期`，选项 `所有时间 / 24 小时 / 7 天 / 14 天 / 28 天 / 1 年`，`Go` → `跳转`；选择器当前值 `28 Days` → `28 天`。
  - 合成节点（走真实 MutationObserver 路径）：`Time range: 7 Days` → `时间范围：7 天`、`Clear all` → `全部清除`、`20 Items` → `每页 20 项`、横幅 → `免费试用 Premium - 解锁更快的下载速度与一键安装`、`Skyrim Special Edition mods` → `Skyrim Special Edition 模组`。
  - 关闭开关：上述文本逐字回到英文（`Time range: 7 Days` / `Try Premium free - unlock faster downloads & 1-click installs` / `20 Items` / `Vehicles` / `Skyrim Special Edition mods`），两个日期占位符各自独立还原（`from=From`、`to=To`），再开启恢复。
  - 会话用完后 `bsk session stop axwo`，`bsk session list` 为空。
- **限制（明确留口）**：同一浏览器里还有第三方翻译扩展在运行（DOM 上可见 `read-frog` 标记，只能证明"它在该页运行过"，不能逐条证明某段文案的归属）。因此**页头、页大小、真实 chip 文本、横幅**在实机上已有中文时无法判定是谁写的，改用「真实 DOM 结构 + 合成节点 + 关闭/再开启逐字还原」取证；能确证归属的是本脚本独有格式的项（`24 小时` 带空格、`起始日期`、`28 天`）。凡实机文本与本脚本规则输出不一致时，一律按"非本脚本所为"处理，不把第三方扩展的改写当成自己的效果。
- **验证**：`npm run verify` rc=0 —— smoke 20 条 + jsdom 45 条全过；覆盖率 Thunderstore 203/203、动态 100/100、作者页 37/37（`--page author`）、Nexus 230/230 与 210/210、Nexus 浏览页 60/60（`--page browse`）。`git diff --check` rc=0，改动文件 `node --check` 全 rc=0，两次 `node build.mjs` 产物 SHA256 一致（`98AEB6607BC4C9047A403768CFC6C11F2A4D42BDB968D022B9B58B081B1E7F07`），产物 89,398 B / 1,973 行。HEAD 仍为 `16bd784`，版本仍 `1.0.5`（未升版本、未提交、未推送、未发布）。

## 17. 页大小营销说明与已选搜索条件 chip 补译（2026-10-27，定点补齐）

第 16 节报告里标注的两处留口，本轮定点补齐；范围不外扩。

- **真实证据（实机 DOM，2026-10-27，`/games/7daystodie/mods`）**：
  1. 页大小下拉面板 `[id^="headlessui-listbox-options"]` 里，营销说明是**三节点拆分**：
     `<div class="mt-4 md:hidden"><p class="text-body-sm text-translucent-moderate"><span>View more results for mods, collections and media with </span><a class="nxm-link … text-premium-strong" href="https://www.nexusmods.com/premium">premium</a><span>.</span></p></div>`（首节点带尾随空格，`.md:hidden` 说明窄屏可见）。
  2. 已选搜索条件 chip（在搜索参数里填 Title/Description/Author/Uploader 后点应用生成）是
     `<button data-e2eid="remove-filter-title-…"><div><span class="flex items-center gap-x-1 px-2"><span class="sr-only">Remove filter for </span><span class="text-body-sm grow text-left">Title: <用户输入></span><svg/></span></div></button>`，
     标签由生产 bundle 的 `${humanize(field)}: ${value}`（field ∈ title/description/author/uploader）拼成，冒号后就是用户输入。实机值实测含冒号、空格、`$1`、`$&`、反引号与中文（`Title: 24 Hours: Avatars $1 中文 x`、`Description: Author: $& $` + 反引号 + ` 值`）。
- **根因**：营销说明三节点各自都查不到词条；chip 标签是「固定前缀 + 动态值」单节点，既无规则，且引擎常规查表会先做空白归一化（`text.replace(/\\s+/g, ' ')` + `trim`），直接拿归一化后的 key 回写会破坏值里的连续空格，因此不能用普通 `patterns` 处理。
- **修复（最小）**：
  - `src/engine.js`：新增 `rawPatterns` + `translateScopedRaw()`（L156-190 一带）——与 `lookupScoped` 同样是 `closest(rule.selector)` 上下文限定，但直接匹配 `node.nodeValue` 的**原始文本**（不归一化、不做 CJK/纯符号跳过），替换一律走函数形式（值里的 `$1`/`$&`/`` $` `` 不会被 `String.replace` 当替换模式）；原文写回 `State.originals`，关闭开关照常逐字还原；`isIgnored(parent)` 区域不参与。
  - `src/locals/nexus.js`：chip 规则补 `rawPatterns: [/^(Title|Description|Author|Uploader): ([\\s\\S]*)$/, nxSearchChipLabel]`（`NX_SEARCH_FIELD_ZH` = 标题/描述/作者/上传者，分隔符换成全角 `：`，值原样拼接）；新增一条 `scoped` 规则把选择器钉在 `[id^="headlessui-listbox-options"] div[class~="md:hidden"][class~="mt-4"]`，用三条 raw 规则翻译营销说明的三个节点（`查看更多模组、合集与媒体结果，需升级为 ` / `高级会员` / `。`）。
  - `tools/coverage.mjs`：page-aware 命中集合纳入 `rawPatterns`；`test/smoke.test.mjs`：上下文正则门禁扩到 `rawPatterns`（同样必须 `^…$` 完整锚定）。
- **测试（先负后正）**：新增 4 条 jsdom → 总数 **49**；smoke 仍 20 条。负向记录（dist 未修复）：`46 passed, 3 failed` —— ①营销说明三节点仍全英文；②同串在固定 UI 面板里仍不翻译；③chip 前缀未翻译。第 4 条（同串出现在 mod 标题/描述/作者名时不得翻译）修前即通过，修后必须继续通过（回归护栏）。修后 **49 passed / 0 failed**。
- **覆盖率（静态口径）**：快照由 60 行扩到 66 行（新增 7 条实机串里 1 条纯符号行计入命中）。用运行时口径单独测量本轮 6 条新串：修前 6/6 未命中、修后 0 未命中；`node tools/coverage.mjs nexus docs/evidence/nexus-browse-2026-10-27.txt --page browse` → `66/66 (100.0%)`，上下文规则 6 条。**该数字不验证 selector/ignore/DOM（见第 18 节）**。
- **真实浏览器复验（bsk Agent Window，脚本 base64 分块注入）**：真实 chip `Title: 24 Hours: Avatars $1 中文 x` → `标题：24 Hours: Avatars $1 中文 x`、`Description: Author: $& $\` 值` → `描述：Author: $& $\` 值`（前缀翻、值逐字节不变）；合成真实结构 chip `Author: Vehicles` → `作者：车辆`、`Uploader: 28 Days` → `上传者：28 天`、`Title:   double  spaces` → `标题：  double  spaces`（多余空格保留）；打开页大小下拉后营销块三节点 → `查看更多模组、合集与媒体结果，需升级为 ` / `高级会员` / `。`。关闭开关：营销三节点逐字回到 `View more results … with ` / `premium` / `.`，两个 chip 回到 `Title: …` / `Description: …`；author chip 在注入本脚本之前就已经是 `作者：车辆`（见第 18 节的时间线证据），关闭时保持原样，说明还原只作用于本脚本写过的节点；再开启复原。会话 `bsk session stop sczj` 已清理（`session list` 中只剩非本代理创建的会话）。
- **仍有留口（不猜、不扩）**：
  1. 桌面端同一面板的营销块（`Learn more` / `with premium` / `Browse more results for mods, collections and media everywhere.` / `Upgrade to premium`）**未翻**：截图与 bundle 里没有它们的原始英文证据（抓取时已被同机第三方翻译扩展改写），按"不猜"原则保留原文，待有干净证据再补。
  2. chip 前缀只在 `browse` 页型生效；collections / media 浏览页也有同类 chip 容器，但本轮未取证，不扩匹配。
  3. chip 前缀要求站点原样的 `Field: ` 形态（含单个半角空格）；大小写或分隔符变化一律不匹配（fail-closed）。
  4. 同一浏览器还有第三方翻译扩展在运行，真实页面上存在"谁先写谁生效"的竞争；实机归属只按"本脚本独有格式"与"禁用前后差异"判定，未做逐条归因。
- **验证**：`npm run verify` rc=0 —— smoke 20 + jsdom 49 全过；覆盖率 Thunderstore 203/203、动态 100/100、作者页 37/37、Nexus 230/230 与 210/210、浏览页 66/66（`--page browse`）；`git diff --check` rc=0；改动文件 `node --check` 全 rc=0；两次 `node build.mjs` 产物 SHA256 一致；HEAD 仍 `16bd784`，版本仍 `1.0.5`（未提交、未推送、未发布）。

## 18. 独立 Code Review 定点修复：SPA 原文保真、站点原地改写、Items/横幅作用域、覆盖率口径（2026-10-27）

Review 指出的五项全部按「先加失败测试 → 最小修复 → 回归」处理；范围未外扩，未升版本。

### A. SPA 切页后关闭开关丢失原文（阻塞）

- **根因**：`src/engine.js` 的 `onLocationChange()` 在页型变化时重建 `State.originals` / `State.attrOriginals`（`new WeakMap()`）。SPA 切页不会销毁导航、筛选控件等节点，重建后这些节点已翻译但原文没了，关闭开关无法还原。`src/bootstrap.js` 的手动「重新扫描当前页面」有同一缺陷（同样重建原文容器）。
- **复现（修前失败）**：jsdom 用例「SPA 切页往返后关闭开关：导航与分类的原文不丢」→ 失败信息 `SPA 切页后导航原文丢失：游戏模组`。
- **修复**：`onLocationChange()` 只重建「按页型装配」的东西（`buildDict` 内的词条/正则/上下文规则/ignore）与页头名称保护；`originals` / `attrOriginals` / `lastWritten` 一律保留（都是 WeakMap，节点销毁后自动回收，不会堆积）。`bootstrap.js` 的手动重扫同样不再清空原文容器。
- **回归**：切页往返后 `setEnabled(false)` → 导航回到 `GAMESMODS`、分类回到 `Avatars`、chip 回到 `Time range: 28 Days`；再开启恢复中文；换页型后 `scoped` 规则按新页型重建（不跨页污染）。

### B. 站点原地改写节点后关闭开关回滚旧值（阻塞）

- **根因**：原文只在首次翻译时记录（`if (!State.originals.has(node))`），站点在同一 Text 节点写入新内容后，`originals` 仍是旧值；关闭开关会把旧值写回去，覆盖用户当前的筛选值。`MutationObserver` 回调是异步的（微任务之后），`State.writing` 同步标记早已复位，因此**不能**用同步标记区分自写与站点外写。
- **修复**：新增 `State.lastWritten`（文本节点 → 本脚本最后写入的值）与 `State.attrLastWritten`（元素 → {属性: 值}），以及 `refreshOriginal(node, raw)`：当前值与 lastWritten 不同 ⇒ 判定为站点外写，把原文更新为站点当前值；`restoreAll()` 还原后清掉 lastWritten，避免再次开启时把恢复值误判成外写。所有写入点（文本主路径、`translateScopedRaw`、页头前缀、三个分段处理器、属性）统一登记 lastWritten。
- **复现（修前失败）**：两条用例失败——文本节点断言 `关闭开关必须恢复站点当前值，而不是第一次翻译前的旧值`；属性断言 `属性还原必须用站点当前值`。
- **覆盖**：同一节点多次改写（`Author: Vehicles` → `Author: Vehicles 2` → `Author: $& 中文  双空格`）、翻译态被站点再覆盖、再次开启/再次关闭、同一宿主 `placeholder` + `aria-label` 独立记录、值里的 `$&` / 中文 / 连续空格逐字节保留；另外覆盖「站点改成的新值本身没有词条」的两种形态（文本 `a plain site value`、属性 `From date (updated)`）——此时也必须把原文换成站点值，否则关闭开关会把站点新值冲回旧值（属性路径曾有此缺陷，已把「刷新原文」提到「是否需要翻译」判定之前并加断言）。
- **实机复验**（bsk Agent Window，真实 Chrome，合成节点走真实 `MutationObserver`）：`Author: Vehicles` → `作者：Vehicles`；站点改写为 `Author: Vehicles 2` → `作者：Vehicles 2`；再改为 `Author: $& 中文  双空格` → `作者：$& 中文  双空格`；关闭开关 → `Author: $& 中文  双空格`（站点最新值，不是第一次的旧值），再开启复原。

### C. 本轮把 Items 规则扩大成全局大小写/单数（直接伤到 UGC）

- **根因**：第 16 节把全局正则从 HEAD 的 `^([\d,]+) items$`（小写复数）改成了 `^([\d,]+)\s+items?$/i`，导致 mod 详情页普通 `<p>20 Items</p>` 也被翻成「每页 20 项」。
- **修复**：全局正则**回退到 HEAD 形态** `^([\d,]+) items$`（collections / media / news 旧前端的既有行为不变）；本轮新增的大小写/单数扩展改为 `pages: ['browse']` 的上下文规则，选择器 `[class~="group/select"], [id^="headlessui-listbox-options"]`（实测的页大小控件与其下拉面板）。
- **同时收窄**：`Try Premium free` 原本被第 16 节写进全局 `dict`（HEAD 只在 `home` 组）。现改为站点级上下文规则 `pages: 'all'` + 选择器 `p[class~="min-w-0"][class~="text-neutral-moderate"]`（实测横幅容器），横幅尾部说明的正则也从全局移进同一条规则；`pages: 'all'` 是新加的显式哨兵，smoke 门禁仍要求每条 scoped 规则显式声明页型（数组或 `'all'`），数组元素仍需是已知页型。
- **复现（修前失败）**：`普通正文里的 "20 Items" / "1 Item" 不得翻译` 与 `mod 标题里的同串不得翻译`。
- **回归**：真实分页控件 `20 Items` / `40 Items` / `1 Item` 仍翻；同页普通正文、mod 详情正文、用户 title/summary 里的同串保持原文；站点级横幅在 browse 与 mod 页都翻，而 `<h1>Try Premium free</h1>` 与描述正文保持原文；旧页面（collections / media / news 的 `20 items`）行为不变。

### D. 覆盖率口径更正

`tools/coverage.mjs` 只按页型展平 `dict` / `patterns` / `scoped`，**不验证** selector 是否命中、`ignore` 是否生效、真实 DOM/弹层是否出现；把 selector 换成不存在的值它照样 100%。因此：

- 工具输出新增三行「口径说明」，明确它是静态规则匹配、不能当作页面运行覆盖；
- `README.md` 的 coverage 说明与「加一条词条」第 8 条同步标注；
- 第 16 / 17 节的 `60/60`、`66/66` 已就地标注为静态口径；
- 运行期证明改为以 `test/browser.test.mjs` 的真实 DOM 用例（真实树 + 真实 `MutationObserver`）与实机注入复验为准。**未**修改任何测试断言或评分来掩盖问题。

### E. 第三方翻译扩展的归因边界

第 16 / 17 节把 chip 的 `作者：车辆` / `上传者：28 天` 归因给同机翻译扩展，这**不是已证事实**，已改为证据化表述：

- 可证的部分：这两个 chip 在**本脚本注入之前**就已经是中文（同页时间线：注入前 `作者：车辆`、`上传者：28 天`，且 `Description: …` / `Title: …` 仍为英文，`window.__MODS_ZH__ === undefined`）；而本脚本的 chip 规则逐字节保留值，若由本脚本产出应为 `上传者：28 Days`。因此「不是本脚本产出」可证，「具体由哪个扩展产出」未证。
- 未做：没有为了归因去改任何扩展设置（隔离实验需要改动用户配置，超出授权范围），故明确保留该边界。

### 回归与验证

- 修前：jsdom `49 passed, 5 failed`（A 1 条、B 2 条、C 2 条）；修后：**jsdom 54 passed / 0 failed**、smoke **20 passed / 0 failed**。
- 覆盖率（静态口径）：Thunderstore 203/203、动态 100/100、作者页 37/37、Nexus 230/230 与 210/210、浏览页 66/66（上下文规则 8 条），工具输出已带口径说明。
- `npm run verify` rc=0；改动文件 `node --check` 全 rc=0；`git diff --check` rc=0；两次 `node build.mjs` 产物 SHA256 一致；HEAD 仍 `16bd784`，版本仍 `1.0.5`（未提交、未推送、未发布）。
- 实机会话：`bsk session stop eebl`，`session list` 为空；合成节点已全部移除，URL 已 `replaceState` 回浏览页。

## 19. 定点复验修复：关闭期间站点改写后再次关闭复活过期原文（2026-10-27）

独立复验给出可复现路径：`refreshOriginal()` 对 `written === undefined` 直接 return；`restoreAll()` 关闭时清掉 `lastWritten` 但保留 `originals`，于是**关闭期间**的站点改写不会被记录，再次关闭把过期原文写回去。

- **修前（jsdom 真实 `MutationObserver` 时序，5 条新用例全红）**：
  - `关闭不能复活旧原文（实际 "Author: Vehicles"）`
  - `关闭应恢复新值而不是最初的 Vehicles`（关闭期间改成新的**可翻译**原文 `Author: Vehicles 9`，开启会翻成 `作者：Vehicles 9`，关闭却回到 `Author: Vehicles`）
  - `关闭不能复活旧占位符 From（实际 "From"）`（`placeholder` → `Site placeholder`，`aria-label` → `From date`）
  - `关闭不能复活站点已移除的属性`（关闭期间 `removeAttribute('title')`，再开关后 `title` 被复活）
  - `SPA 往返 + 重扫后关闭仍不得复活旧值`
- **修复（`src/engine.js`）**：
  1. `refreshOriginal()`：`lastWritten` 存在时按原逻辑判定自写/外写；**缺失时**只要当前值与已记录原文不同，就视为站点（含关闭期间）改写，原文跟进。属性侧同理（`attr in written` 分支 + `attr in record && record[attr] !== raw` 分支）。
  2. `restoreAll()` 从"无条件回写 `originals`"改为**只回写仍是本脚本写入值的节点/属性**：`current !== lastWritten` ⇒ 站点已改写/尚未观察，把原文更新为当前值并跳过回写；属性被移除（`getAttribute() === null`）⇒ 删记录、**不复活**；属性值被改写 ⇒ 以当前值为准。正常路径（值仍是译文）行为不变。
  3. 这样同时覆盖"开启状态站点改写后立刻关闭"（不等 80ms 防抖）的竞态：关闭不再用旧原文覆盖站点新内容。
- **回归（修后 60 passed / 0 failed）**，新增 6 条用例覆盖：text 非词条新值、text 可翻译新值、同一元素 `placeholder`/`aria-label`/`title` 独立 + 输入 `value` 逐字不变、关闭期间属性被移除不复活、重复扫描 + SPA 往返 + 立刻关闭竞态、textarea 属性不被损坏。
- **守卫有效性佐证（未改仓库文件）**：把 `restoreAll` 单点回退成旧实现（refreshOriginal 保持新实现）后跑「立刻关闭」竞态 → 输出 `Author: Vehicles`（复活旧原文）；新实现 → `immediate site value`。说明该断言确实锁住 `restoreAll` 的守卫，而不是靠 `refreshOriginal` 顺带通过。
- **顺带发现的既有问题（本轮不改，仅记录）**：`translateAttributes()` 里的 `el.tagName !== 'TEXTAREA'` 豁免在 `scanRoot()` 的 `isIgnored(el)` 过滤之后**不可达**（`TEXTAREA` 在 `SKIP_TAGS` 中），因此 `textarea` 的 `placeholder` 一直不会被翻译。属本次改动之前就存在的行为，本轮未改；新增用例只锁定"开关往返不会损坏 textarea 上的属性"，并断言 `input` 的 `aria-label`/`title` 仍各自独立翻译还原。
- **验证**：`npm run verify` rc=0 —— smoke 20 + jsdom 60 全过；覆盖率静态口径不变（203/203、100/100、37/37、230/230、210/210、浏览页 66/66）；改动文件 `node --check` 全 rc=0；`git diff --check` rc=0；两次 build 产物 SHA256 一致；HEAD 仍 `16bd784`，版本仍 `1.0.5`（未提交、未推送、未发布）。