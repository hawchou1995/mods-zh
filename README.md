# Thunderstore & Nexus Mods 中文化

把 Thunderstore 与 Nexus Mods 的**界面元素**翻成简体中文的脚本猫 / 油猴兼容 userscript（userscript）。

只翻界面，不碰内容：模组名称、作者、描述正文、评论、文件名一律保持英文原样 —— 这些是你要复制去搜索、对比、报错的东西，翻了只会碍事。

- 词条（按站点各自去重，同一英文键跨页型只计一次）：**Thunderstore 572 键**（`dict` 合并去重 215 + 固定枚举表 `TS_ENUM_ZH` 398）+ **Nexus Mods 549 键**（`dict` 合并去重 501 + 上下文词表去重 118），按站点去重合计 **1121 键**（这只是两个站点各自去重后相加，**不是**跨站并集）；`scoped` 规则表内的同键按上下文重复生效，不另计入。**66 条**正则规则（Thunderstore 20 / Nexus 46）；Nexus 扩展覆盖游戏、合集、媒体、新闻、论坛、帮助、API 文档与账户固定 UI
- Thunderstore 固定枚举独立成表：`const TS_ENUM_ZH = Object.freeze({…})`，**分区 55 + 分类 370 + 分组标题 4（Sections / Categories / Other filters / Filters）= 398 条**（当次 371 个社区逐个抓取后去重，见 `docs/evidence/thunderstore-communities-2026-11-16.md`），四条 scoped 规则共享这一张表、按 `<summary>` 标题锚定生效，不进全局字典
- 覆盖：`thunderstore.io`；Nexus Mods 根域及 `www`、`next`、`forums`、`help`、`api-docs`、`users` 一方子域路由
- 产物：单文件 `dist/mods-zh.user.js`，无外部依赖、无网络请求；GM 接口只用 `GM_getValue/GM_setValue/GM_registerMenuCommand/GM_unregisterMenuCommand/GM_openInTab/unsafeWindow`（`unsafeWindow` 仅用于检测兼容读写页面标记）
- 当前版本：`v1.0.8`

## 安装

| 渠道 | 地址 |
| --- | --- |
| Greasyfork（推荐） | https://greasyfork.org/zh-CN/scripts/601176 |
| GitHub 直装 | `https://raw.githubusercontent.com/hawchou1995/mods-zh/main/dist/mods-zh.user.js` |
| 源码仓库 | https://github.com/hawchou1995/mods-zh |

## 翻译边界

| 翻译 | 不翻译 |
| --- | --- |
| 顶栏、侧栏、页脚导航 | 模组名称、包名 |
| 按钮、开关、标签页、面包屑 | 作者名、上传者名 |
| 筛选器、分类名、语言枚举、排序 | 模组描述正文、变更日志 |
| 下载区、统计标签（认可数 / 独立下载 / 总浏览…） | 评论、帖子、论坛内容 |
| 结果计数、相对时间、日期格式 | 文件名、代码块、输入框内容 |
| `placeholder` / `aria-label` / `title` 属性 | Cookiebot 弹窗（第三方，自带多语言） |

## 菜单

装好后在油猴面板里对本脚本点右键，有三个**互相独立**的开关，各自持久化、互不替代：

- **界面中文化：已开启 / 已关闭** —— 一键切回英文原文（原文逐字存于 WeakMap，关闭即还原），状态会记住
- **广告净化：已开启 / 已关闭**（v1.0.8 新增）—— 只隐藏已取证的广告与营销条（Nexus 旧文件页 `.ads-holder` / `#billboard_*` / `#mpu_bottom` / `#nonPremiumBanner` / `#freeTrialBanner` / `#adBlockingBanner` 与新前端促销文本容器，Thunderstore 的 `.ad-container[data-cid^="nimbus-v2-"]` 与悬浮视频广告位）。实现方式是注入一张自有样式表 + 给命中的节点打标记属性，**不删除任何 React 节点**，关闭时样式表移除、属性逐条还原。默认开启
- **检测兼容：已开启 / 已关闭**（v1.0.8，旧 Nexus 上默认开启）—— 沿站点自己的广告拦截检测函数（动态命名，按源码形态识别：`window.blockingAds` 赋值 + `Cookies.get('ab')` + `Cookies.set('ab')`）做可逆包装：检测参数固定为 **false** 后调用原函数，保留它自己的 expiry 与 `NexusConsent` 门禁，因此写入的是 `ab=0|<exp>` 而不是 `1|<exp>`。关闭后函数与 `areAdsBlocked` 恢复原实现，已写过的 cookie 状态与已渲染档位需要刷新（状态会提示 `needsReload`）。**不碰**随机 probe（`/api/scripts/adsservice.js` 的 `window.<token> = true` 只代表脚本已执行，不改写）、`adShieldActive`（AdShield 灰度总开关）与新前端 React context 的 `adsBlockedByUser`；**不 mock/替换 Cookies、fetch、XHR、定时器，不伪造 Premium，不改 `download-url` 或 DOM 上的 `download-speed`**。拿不到页面主 realm（`unsafeWindow`）或本页没有该检测脚本时，菜单如实显示「不可用 / 等待检测脚本」，不会假装成功
- **重新扫描当前页面** —— 站点改版后手动补扫
- **版本 v1.0.8（站点名）** —— 显示当前站点、页型、词条数、替换计数与两个新开关的状态

测试：`npm run verify` 共 115 项（原有 90 项回归 + 多游戏固定 UI 8 项 + 广告净化/检测兼容 17 项）。

关于「下载档位」的边界：一组同账号、同文件（74231）、同入口的 200 对照显示，`ab` 不存在时服务端渲染 `download-speed="reduced"`，`ab=0|<exp>` 时为 `standard`；随后 3 次对照均返回 HTTP 403（风控/限流），因此这只是**一组观测**，不等于稳定可复现。另有一点必须说清：两种状态下 `download-url` 都是站点自己输出的 `#ERROR-download-location-not-found` 占位符，本次观察到的可用 CDN 下载由既有第三方扩展发起，**真实大流量速度对照仍未完成**（唯一一次 Range 样本 1024 B / 612 ms / HTTP 206，不能代表任何档位）。本脚本不改 `download-url`、不改 DOM 档位伪装成功，也不承诺任何实际网速。

## 项目结构

```
mods-zh/
├── src/
│   ├── locals/
│   │   ├── _registry.js       站点注册表（SITES 数组）
│   │   ├── thunderstore.js    Thunderstore 词条 + 正则
│   │   └── nexus.js           Nexus Mods 词条 + 正则
│   ├── engine.js              文本驱动引擎：选站点 → 选页型 → 合并词条 → 遍历替换 → 监听变化
│   └── bootstrap.js           启动、菜单、持久化、SPA 路由接管
├── build.mjs                  src/ → dist/mods-zh.user.js 单文件拼装
├── dist/mods-zh.user.js       发布产物（随仓库提交，updateURL 指向它）
├── test/
│   ├── smoke.test.mjs         最小 DOM：词条完整性、查表、开关还原
│   └── browser.test.mjs       jsdom：真实 DOM + 真实 MutationObserver + 属性翻译
│       thunderstore-enums.test.mjs  全社区固定枚举：静态装配 + 真实 SSR 侧栏 + SPA/开关/幂等
├── tools/
│   ├── coverage.mjs           词条覆盖率体检（快照 vs 字典，--page / --scoped 分组口径）
│   └── collect-ui-text.js     在真实页面控制台导出 UI 文本快照
└── docs/
    ├── evidence/              取证快照（两站真实页面文本）
    ├── demo/                  本地复现页（jsdom 之外的浏览器手测）
    └── verification.md        验证记录与未覆盖项
```

## 引擎怎么工作

1. `detectSite()` 按 `location.hostname` 选站点，`currentPage()` 按 `pathname` 选页型（Nexus：`home` / `games` / `game` / `browse` / `mod` / `collection` / `media` / `news` / `forums` / `support` / `account`）
2. 合并 `global` + 页型词条成一张 Map，正则组单列
3. `TreeWalker` 遍历文本节点，归一化空白后查表；精确命中优先，其次正则；命中即写回，保留原有前后空白
4. `MutationObserver` + 80ms 防抖接管动态渲染的节点；写入用 `State.writing` 标记，且译文本身不会再命中字典，因此扫描天然幂等、不会被自身写入喂成死循环
5. UGC 防护走三层：站点级 `ignore` 选择器（`closest` 判定整棵子树跳过）、标签黑名单（`CODE/PRE/TEXTAREA…`）、`contenteditable` 判定
6. 属性翻译同样查表，只处理 `placeholder` / `aria-label` / `title`
7. **上下文规则（`site.scoped`）**：容器选择器之外还可以写 `include`（标题锚点）——同一层 `<details>` 承载多组枚举时（Thunderstore 的 `Sections` / `Categories`），只有容器内存在文本等于 `include` 的标题元素才启用该规则，见 `docs/adr/0003-context-anchored-enumeration.md`。同一串在不同 DOM 上下文里含义不同的，写在 `scoped: [{ pages, selector, dict, patterns }]` 里，引擎只在 `rule.selector` 命中的子树内查表（`closest` 判定，命中即停，结果不进全局缓存）。典型例子：Nexus 浏览页的分类名 `Vehicles` 要翻，卡片里恰好叫 `Vehicles` 的 mod 标题不能翻；`28 Days` 作为时间范围选项要翻，作为 UGC 文本不能翻。出了上下文一个字节都不动，`pages` 限定页型避免溢出（如 mod 详情页的 `<h1>` 标题）。需要「固定前缀 + 用户输入值」同节点的场景（如已选筛选 chip 的 `Title: <用户输入>`）用 `rawPatterns`：按文本节点**原始值**匹配（不归一化空白），替换走函数形式，值里的 `$1` / `$&` / 反引号与多空格都逐字节保留

因为匹配靠**文本**而不是 CSS 类名，两站前端用 React + 哈希类名（`css-1x2y3z`）改版时不会一改就崩。

## 开发

```bash
npm install
npm run build      # src/ → dist/mods-zh.user.js
npm test           # 20 条最小 DOM + 60 条 jsdom + 10 条固定枚举测试
npm run coverage   # 对照 docs/evidence/ 快照算词条覆盖率（静态匹配，不验证 selector/ignore/DOM）
npm run verify     # 以上全套
```

版本号唯一来源是 `package.json`，脚本头 `@version` 与运行时 `VERSION` 都由 `build.mjs` 注入，不会漂。

### 加一条词条

1. 在目标页面按 F12，控制台粘 `tools/collect-ui-text.js` 的内容并回车，导出该页所有可见 UI 短文本
2. 把新文本按页型加进 `src/locals/<站点>.js` 对应分组，`"English": "中文"`
3. `npm run build && npm test`，再跑 `npm run coverage` 看缺口
4. 同一站点跨页型出现同键，会自动校验「译法必须一致」—— 测试会拦下冲突
5. 新页型若与已有页型共用同一套组件（如作者列表页与社区列表页的筛选器），在站点对象里声明 `alias: { 新页型: 已有页型 }` 复用整组词条，不要复制一遍
6. 同一段 DOM 在不同页型分属 UGC 与固定 UI 时（如 Thunderstore 面包屑末段：作者/包/社区页是名称，社区总览/上传/工具页是固定 UI），用 `ignorePages: { 页型: 选择器 }` 只在对应页型追加忽略规则，不要写进全局 `ignore`
7. 快照默认按「全部分组并集」口径体检（找缺口）；要证明某页型下真的翻得出来，用 `node tools/coverage.mjs <站点> <快照> --page <页型>`，只装配该页型运行期实际加载的 global + alias + 本页型分组
8. 与 mod 标题/作者/描述**可能同形**的固定 UI（分类枚举、时间范围、页大小、筛选 chip 的日期值），不要写进 `dict` 或 `patterns`（那等于全局无界替换），写进 `scoped` 并声明 `pages` + 稳定的上下文 `selector`（如 `[data-e2eid="category-filter"]`、`[class~="group/select"]`）。`npm run coverage ... --page <页型>` 会把该页型的 `scoped` 规则算进可命中集合，所以这类词条不会在覆盖率里被误报成缺口。注意覆盖率是**静态口径**：它只证明"按该页型装配后能产出译文"，不验证 selector 是否真的命中、ignore 是否生效、真实 DOM/弹层是否出现；运行期是否真的翻出来由 `test/browser.test.mjs` 的真实 DOM 用例负责

### 本地手测

`docs/demo/index.html` 是复现页，`?site=thunderstore|nexus&page=community|mod` 指定站点与页型，直接双击打开即可看到真实浏览器里的替换结果；页面上的「动态插入」按钮用来验证 MutationObserver 是否接管后插入的节点。

## 已知限制

- **Wiki 页面未验证**：`wiki.nexusmods.com` 于 2026-10-22 返回 HTTP 403，因此没有加入 Wiki 专属词条；`www.nexusmods.com/community` 与 `/support` 实测为 404，社区与支持页按 `forums` / `help` 一方子域路由处理
- **Thunderstore 旧站 / Legacy 页面未纳入**：现行 `thunderstore.io` 已覆盖全部主要路径
- 词条按取证到的原文**精确匹配**：站点改文案（哪怕加一个句号）就会漏翻，需要按上面的流程补词条 —— 这是文本驱动方案的代价，也是它抗改版的原因
- Nexus 基线快照抓取于 2026-10-20，扩展固定 UI 快照抓取于 2026-10-22；Nexus 快照覆盖 230/230、210/210、66/66 行（100%），Thunderstore 快照覆盖 203/203、100/100、37/37 行（100%），全社区枚举快照覆盖 427/427 行（100%）；其中作者列表页快照（37 行）按 `--page author` 页型门禁体检，枚举快照按 `--scoped` 分组口径分别体检，都不是合并词库口径
- 枚举快照是**静态**口径：只证明「按该容器装配后能产出译文」，不验证 `summary` 锚点一定命中；运行期由 `test/thunderstore-enums.test.mjs` 的真实 SSR 侧栏用例与实机复验负责

## 许可

GPL-3.0（见 `LICENSE`）。引擎架构参考了 [maboloshi/github-chinese](https://github.com/maboloshi/github-chinese) 的「页型 + 词条 + MutationObserver」思路，代码为独立实现。

## 反馈

脚本问题与词条补充：

- [青橘社区](https://qingju.me/)
- [GitHub Issues](https://github.com/hawchou1995/mods-zh/issues)

请附页面 URL、截图和未翻译的原文，方便复现。
