# Nexus 新前端多游戏固定 UI 采集（2026-11-18）

采集对象（共 8 个，全部可访问，均取得 browse 页 DOM 文本）：

| 游戏域名 | 页面 | 取得内容 |
|---|---|---|
| `helldivers2` | `/games/helldivers2/mods`（browse）、`/helldivers2/mods/18959?tab=files` | 分类、语言、排序、门户、页脚、旧文件页 |
| `skyrimspecialedition` | `/games/…/mods` | 同上（browse） |
| `fallout4` | 同上 | 同上 |
| `cyberpunk2077` | 同上 | 同上 |
| `stardewvalley` | 同上 | 同上 |
| `baldursgate3` | 同上 | 同上 |
| `7daystodie` | 同上 | 同上 |
| `monsterhunterwilds` | 同上 | 同上（另有 `/monsterhunterwilds/about/stats` 页脚链接） |

不可访问项：无（未出现登录墙或 404）。原始 JSON 只保留在本地 scratch，不随仓库分发。

## 1. 分类容器

`[data-e2eid="category-filter"]` 内是 `<label><p><span>Animations</span><span>(269)</span></p></label>` 形态；
卡片上的分类元数据是 `a[data-e2eid="mod-tile-category"]`。

各社区实际出现的分类（本轮采集到的并集，逐条进入 `NX_CATEGORY_VOCAB`）：
Animations、Visuals、Audio、Armour、Body、BodySlide、Crafting、Environment、Gameplay、Items、
Locations、Magic、Monsters、NPC、Overhauls、Skills、Textures、User Interface、Weapons、Miscellaneous、
Immersion、Buildings、Models and Textures、Utilities、Vehicles、Cheats、Creatures、Maps、Quests、
Zombies、Prefabs、Avatars、Clothing、Hair、Poses、Power Armor、Settlements、Player、Characters、Companions。

HD2 截图中漏翻的 **Animations / Visuals** 由本表覆盖。

## 2. 语言组

`Language` 折叠块内 a 组复选框；本轮缺翻并补齐：Thai、Hindi、Bulgarian、Hebrew、Romanian；
同时补齐 Vietnamese、Indonesian、Ukrainian、Turkish、Arabic、Korean、Japanese、Spanish、French、
German、Italian、Polish、Portuguese、Russian、Chinese。

## 3. 排序 portal

`[id^="headlessui-listbox-options"]`（挂在 body 上，`role="option"`），首次打开与关闭重开都是同一形态。
实采项：Date Published、Unique Downloads、Last Updated、Mod Name、File Size、Last Comment
（Endorsements / Downloads / Trending 原先已覆盖）。

## 4. 页头门户与页脚

- 门户：`[data-e2eid="games-sub-nav"]`（HeadlessUI popover portal），含 `My games`、`Mod updates`、
  `Tracked mods`、`My stuff`、`My mods`、`Mod rewards`、`Download history`、`Upload mod`、
  `My images`、`Upload image`、`My videos`、`Upload video`、`Supporter images`、`Remove` 等固定项。
- 页脚：`<footer aria-label="Desktop footer">`，`All mods` / `New mods` / `Popular mods` /
  `Trending mods` / `All images` / `All collections` 的 href 都是 `/games/<game>/mods…` 一族。

问题与修复：全局 ignore 的 `[href*="/games/"]:not([data-e2eid="mod-tile-category"])` 会连页脚/门户
里的固定导航一起保护。处理方式是引擎新增 `rule.allow` + 站点 `hardUgc`：

- allow 只认**真实固定路由**：`…/games`、`…/mods` 及带 `?sort=` / `?tab=` 的列表页、
  `/collections`、`/images`、`/videos`、`/news`；
- `/games/<game>/mods/<id>`（模组详情）、`/games/<game>`（游戏名路由）**不放行**；
- 硬 UGC（`mod-tile-title`、`user-link`、`.mod-description`、`.markdown`、`.prose`、`.file-name`、
  `pre`、`code`、`kbd`）即便在放行容器内也一律保持原文。

对应测试：`test/nexus-multigame.test.mjs`（固定分类/语言/排序/门户/页脚 5 个正向用例 +
UGC 与同名负向用例 + 关闭还原/SPA 往返用例）。

## 5. 支持范围

- 支持：Nexus 2026 新前端 browse 固定 UI（分类、语言、排序、门户、页脚）、旧文件页广告槽位与检测脚本。
- 不支持/未覆盖：新前端 React context 里的 `adsBlockedByUser`、AdShield 灰度总开关
  （`adShieldActive`）、Thunderstore 的广告拦截检测（未取得证据）。
