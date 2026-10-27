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
