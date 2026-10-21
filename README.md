# Thunderstore & Nexus Mods 中文化

把 Thunderstore 与 Nexus Mods 的**界面元素**翻成简体中文的油猴脚本（userscript）。

只翻界面，不碰内容：模组名称、作者、描述正文、评论、文件名一律保持英文原样 —— 这些是你要复制去搜索、对比、报错的东西，翻了只会碍事。

- 词条：**459 条分组映射**（Thunderstore 206 / Nexus Mods 253），**40 组**正则；覆盖社区动态筛选、上传校验、详情与 Required 依赖页
- 覆盖：`thunderstore.io`、`www.nexusmods.com`、`nexusmods.com`、`users.nexusmods.com`
- 产物：单文件 `dist/mods-zh.user.js`，无外部依赖、无网络请求、无权限索取
- 当前发布版本：`v1.0.3`

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

装好后在油猴面板里对本脚本点右键，有三项：

- **界面中文化：已开启 / 已关闭** —— 一键切回英文原文（原文逐字存于 WeakMap，关闭即还原），状态会记住
- **重新扫描当前页面** —— 站点改版后手动补扫
- **版本 v1.0.3（站点名）** —— 显示当前站点、页型、生效词条数与已替换计数

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
├── tools/
│   ├── coverage.mjs           词条覆盖率体检（快照 vs 字典）
│   └── collect-ui-text.js     在真实页面控制台导出 UI 文本快照
└── docs/
    ├── evidence/              取证快照（两站真实页面文本）
    ├── demo/                  本地复现页（jsdom 之外的浏览器手测）
    └── verification.md        验证记录与未覆盖项
```

## 引擎怎么工作

1. `detectSite()` 按 `location.hostname` 选站点，`currentPage()` 按 `pathname` 选页型（如 Thunderstore 的 `community` / `package`、Nexus 的 `browse` / `mod`）
2. 合并 `global` + 页型词条成一张 Map，正则组单列
3. `TreeWalker` 遍历文本节点，归一化空白后查表；精确命中优先，其次正则；命中即写回，保留原有前后空白
4. `MutationObserver` + 80ms 防抖接管动态渲染的节点；写入用 `State.writing` 标记，且译文本身不会再命中字典，因此扫描天然幂等、不会被自身写入喂成死循环
5. UGC 防护走三层：站点级 `ignore` 选择器（`closest` 判定整棵子树跳过）、标签黑名单（`CODE/PRE/TEXTAREA…`）、`contenteditable` 判定
6. 属性翻译同样查表，只处理 `placeholder` / `aria-label` / `title`

因为匹配靠**文本**而不是 CSS 类名，两站前端用 React + 哈希类名（`css-1x2y3z`）改版时不会一改就崩。

## 开发

```bash
npm install
npm run build      # src/ → dist/mods-zh.user.js
npm test           # 15 条最小 DOM 测试 + 9 条 jsdom 测试
npm run coverage   # 对照 docs/evidence/ 快照算词条覆盖率
npm run verify     # 以上全套
```

版本号唯一来源是 `package.json`，脚本头 `@version` 与运行时 `VERSION` 都由 `build.mjs` 注入，不会漂。

### 加一条词条

1. 在目标页面按 F12，控制台粘 `tools/collect-ui-text.js` 的内容并回车，导出该页所有可见 UI 短文本
2. 把新文本按页型加进 `src/locals/<站点>.js` 对应分组，`"English": "中文"`
3. `npm run build && npm test`，再跑 `npm run coverage` 看缺口
4. 同一站点跨页型出现同键，会自动校验「译法必须一致」—— 测试会拦下冲突

### 本地手测

`docs/demo/index.html` 是复现页，`?site=thunderstore|nexus&page=community|mod` 指定站点与页型，直接双击打开即可看到真实浏览器里的替换结果；页面上的「动态插入」按钮用来验证 MutationObserver 是否接管后插入的节点。

## 已知限制

- **`next.nexusmods.com`（新版 Beta 前端）未纳入**：DOM 还在变，等稳定后再加，避免词条一半命中一半不命中
- **Thunderstore 旧站 / Legacy 页面未纳入**：现行 `thunderstore.io` 已覆盖全部主要路径
- 词条按取证到的原文**精确匹配**：站点改文案（哪怕加一个句号）就会漏翻，需要按上面的流程补词条 —— 这是文本驱动方案的代价，也是它抗改版的原因
- 词条快照抓取于 2026-10-20；Nexus 用的是 2026 版新前端页面

## 许可

GPL-3.0（见 `LICENSE`）。引擎架构参考了 [maboloshi/github-chinese](https://github.com/maboloshi/github-chinese) 的「页型 + 词条 + MutationObserver」思路，代码为独立实现。

## 反馈

脚本问题与词条补充：

- [青橘社区](https://qingju.me/)
- [GitHub Issues](https://github.com/hawchou1995/mods-zh/issues)

请附页面 URL、截图和未翻译的原文，方便复现。
