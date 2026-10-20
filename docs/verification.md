# 验证记录

本文件记录 v1.0.0 首发与 v1.0.1 截图补漏的验证证据；没验证的如实写在这里，不写进 README 当卖点。

## 1. 词条取证（真实页面，2026-10-20）

| 站点 | 页面 | 方式 | 落盘 |
| --- | --- | --- | --- |
| Thunderstore | `/`、`/communities/`、`/c/lethal-company/`、`/c/lethal-company/p/BepInEx/BepInExPack/`、`/c/gtfo/` | Anysearch 页面抽取 + HawChow 提供的 GTFO 已登录页截图交叉核对 | `docs/evidence/thunderstore.txt` |
| Nexus Mods | `/skyrimspecialedition/mods/266`（模组详情页）、`/games/skyrimspecialedition/mods`（浏览页） | Chromium 实机 DOM 读取（`innerText` + `placeholder` / `aria-label` 原值） | `docs/evidence/nexus.txt` |

Nexus 站点在抓取时经过 Cloudflare 校验，验证通过后取到的是 **2026 版新前端**页面（导航为 `GAMES / MODS / MOD UPDATES / COLLECTIONS / MEDIA / COMMUNITY / SUPPORT`）。旧版路径 `/<game>/mods/<id>` 仍可访问，字典对两套页面共用的文案一并覆盖，页型判定对两种 URL 都识别为 `mod`。

## 2. 词条覆盖率

```
$ npm run coverage
站点     : thunderstore   快照行数 : 91   命中 : 91 (100.0%)   未命中 : 0
站点     : nexus          快照行数 : 230  命中 : 230 (100.0%)  未命中 : 0
```

覆盖率的计算口径与运行期一致：跳过已是中文的行、跳过纯数字行，其余逐条走「精确字典 → 正则组」。任何一条未命中都会让命令 `exit 1`，所以在 CI 里它就是一道门禁。

## 3. 自动化测试

```
$ npm test
最小 DOM（test/smoke.test.mjs）：15 条，全通过
jsdom（test/browser.test.mjs）： 7 条，全通过
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
