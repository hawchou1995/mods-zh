# Thunderstore 全社区固定界面枚举盘点（2026-11-16 当次）

本文件是 v1.0.7 的取证记录，也是 `test/thunderstore-enums.test.mjs` 的清单来源（测试直接解析本文件，
避免测试与词库各写一份互相掩护）。

## 1. 社区清单与来源

| 项 | 值 |
| --- | --- |
| 清单来源 | 公开 API `https://thunderstore.io/api/experimental/community/`（cursor 分页 4 页，去重 371 条） |
| 与站点页面交叉核对 | `https://thunderstore.io/communities/` 与 `https://old.thunderstore.io/communities/` 的 `href="/c/<slug>/"` 集合，同为 371 条、无差异 |
| 逐社区页面 | `https://thunderstore.io/c/<slug>/`（SSR HTML，2026-11-16 抓取 371/371，HTTP 200） |
| 前端版本 | 同一轮从 `/c/gtfo/` 的 `window.__reactRouterManifest` 取路由 chunk：PackageSearch / Community / home 等 24 个 chunk |

> 抓取脚本与原始 HTML 在本轮 scratch（`mods-zh-task/html/*.html`），未纳入仓库；
> 需要复核时按上面的 URL 重抓即可（分页器每页 20 条、社区页 SSR 结构稳定）。

## 2. 固定界面结构（SSR，`/c/<社区>/`）

```html
<details class="collapsible"><summary class="…collapsible__header">Sections</summary>
  <div role="radiogroup" class="radio-group">
    <label class="radio-group__label …"><input type="radio" value="all"/>All</label>
    …（每条分区一个 radio，value 为服务端 section uuid）
  </div></details>
<details class="collapsible"><summary class="…collapsible__header">Categories</summary>
  <ol class="checkbox-list"><li><label class="checkbox-list__label …">
    <span><button class="…checkbox-list__checkbox-button">…</button>分类名</span></label></li>…</ol></details>
<details class="collapsible"><summary class="…collapsible__header">Other filters</summary>
  …Deprecated / NSFW…</details>
```

卡片分类徽标：`<a href="/c/<社区>/?includedCategories=<id>" class="tag …"><span>分类名</span></a>`。
同一 (社区, 分类 id) 在所有抓取页面里只对应一个文案（0 冲突，1386 个 URL），文案集合与筛选器分类集合完全一致。

`Sections` 与 `Categories` **共用同一层 `<details>` 容器**，只能靠 `<summary>` 标题区分；
**55 条分区名里有 31 条同时是某个社区的分类名**（按 §3/§4 清单逐键求交集，脚本核算）：
`Mods`、`Modpacks`、`Maps`、`Developer Tools`、`Asset Replacements`、`Experimental`、`Bundles`、`Combos`、
`Act I`、`Act II`、`Act III`、`Kaycee's Mod`、`Magnificus Mod`、`Grimora Mod`、`P03 In Kaycee's Mod`、
`Custom Cards`、`Gameplay`、`Plugins`、`Asset Packs`、`Saves`、`Sound Packs`、`Translations`、`Universes`、
`Worlds`、`0.62 Branch`、`0.66 Branch`、`0.70 Branch`、`1.0 Classic Branch`、`Oakveil Update`、`Deep North Update`、
`Rundowns`。同名不同义（分区位置 vs 分类位置），所以词条按容器 + 标题锚点装配（`include`）。

## 3. 分区枚举（全社区去重 55 条）

- `All` — 全部 — 372 次出现 / 371 个社区（`socom-legacy` 的分区单选组里 `All` 出现两次：一次是固定的
  `value="all"` 哨兵，一次是 uuid `01a1ae7a-6de8-017b-f43b-da5158931af2` 的服务端分区，两者线上都显示
  `All`；去重枚举键仍是 1 条，§7 该社区分区数按 2 记为原始出现次数）
- `Modpacks` — 整合包 — 346 个社区
- `Mods` — 模组 — 343 个社区
- `Maps` — 地图 — 5 个社区
- `Developer Tools` — 开发者工具 — 4 个社区
- `Mods (excluding AI)` — 模组（不含 AI） — 4 个社区
- `Mods (including AI)` — 模组（含 AI） — 4 个社区
- `All Mods` — 全部模组 — 2 个社区：inscryption / schedule-i
- `APIs & Libraries` — API 与库 — 2 个社区：content-warning / lethal-company
- `Asset Replacements` — 资源替换 — 2 个社区：lethal-company / peak
- `Experimental` — 实验性 — 2 个社区：subnautica-below-zero / subnautica
- `Other` — 其他 — 2 个社区：bomb-rush-cyberfunk / hytale
- `0.62 Branch` — 0.62 分支 — 1 个社区：tcg-card-shop-simulator
- `0.62 Branch Modpacks` — 0.62 分支整合包 — 1 个社区：tcg-card-shop-simulator
- `0.66 Branch` — 0.66 分支 — 1 个社区：tcg-card-shop-simulator
- `0.66 Branch Modpacks` — 0.66 分支整合包 — 1 个社区：tcg-card-shop-simulator
- `0.70 Branch` — 0.70 分支 — 1 个社区：tcg-card-shop-simulator
- `0.70 Branch Modpacks` — 0.70 分支整合包 — 1 个社区：tcg-card-shop-simulator
- `1.0 Classic Branch` — 1.0 经典分支 — 1 个社区：tcg-card-shop-simulator
- `1.0 Classic Branch Modpacks` — 1.0 经典分支整合包 — 1 个社区：tcg-card-shop-simulator
- `Act I` — 第一章 — 1 个社区：inscryption
- `Act II` — 第二章 — 1 个社区：inscryption
- `Act III` — 第三章 — 1 个社区：inscryption
- `All Versions` — 所有版本 — 1 个社区：v-rising
- `Asset Packs` — 资源包 — 1 个社区：hytale
- `Assets & Cosmetics` — 资源与外观 — 1 个社区：socom-legacy
- `Bundles` — 捆绑包 — 1 个社区：atlyss
- `Cars` — 车辆 — 1 个社区：distance
- `Clientside Mods` — 客户端模组 — 1 个社区：content-warning
- `Combos` — 组合 — 1 个社区：hytale
- `Custom Cards` — 自定义卡牌 — 1 个社区：rounds
- `Deep North Update` — 极北之地更新 — 1 个社区：valheim
- `Dev Tools and Libraries` — 开发工具与库 — 1 个社区：totally-accurate-battle-simulator
- `Gameplay` — 玩法 — 1 个社区：socom-legacy
- `Grimora Mod` — Grimora 模组 — 1 个社区：inscryption
- `Host Only Mods` — 仅主机端模组 — 1 个社区：content-warning
- `Kaycee's Mod` — 凯西的模组 — 1 个社区：inscryption
- `Magnificus Mod` — Magnificus 模组 — 1 个社区：inscryption
- `Main Branch` — 主分支 — 1 个社区：tcg-card-shop-simulator
- `Main Branch Modpacks` — 主分支整合包 — 1 个社区：tcg-card-shop-simulator
- `Missions` — 任务 — 1 个社区：socom-legacy
- `Modpacks & Soundpacks` — 整合包与音效包 — 1 个社区：content-warning
- `Mono Modpacks` — Mono 整合包 — 1 个社区：schedule-i
- `Mono Mods` — Mono 模组 — 1 个社区：schedule-i
- `Oakveil Update` — Oakveil 更新 — 1 个社区：v-rising
- `P03 In Kaycee's Mod` — 凯西的模组中的 P03 — 1 个社区：inscryption
- `Plugins` — 插件 — 1 个社区：hytale
- `Resource Packs` — 资源包 — 1 个社区：peak
- `Rundowns` — 远征序列 — 1 个社区：gtfo
- `Saves` — 存档 — 1 个社区：hytale
- `Sound Packs` — 音效包 — 1 个社区：ultrakill
- `Translations` — 翻译 — 1 个社区：content-warning
- `Universes` — 宇宙 — 1 个社区：hytale
- `Vanilla Compatible Mods` — 原版兼容模组 — 1 个社区：content-warning
- `Worlds` — 世界 — 1 个社区：hytale

## 4. 分类枚举（全社区去重 370 条）

- `Modpacks` — 整合包 — 349 个社区
- `Mods` — 模组 — 349 个社区
- `Libraries` — 库 — 347 个社区
- `Misc` — 杂项 — 344 个社区
- `Tools` — 工具 — 342 个社区
- `Audio` — 音频 — 336 个社区
- `AI Generated` — AI 生成 — 92 个社区
- `Items` — 物品 — 20 个社区
- `Maps` — 地图 — 16 个社区
- `Tweaks` — 调整 — 16 个社区
- `Client-side` — 客户端 — 13 个社区
- `Quality of Life` — 体验优化 — 13 个社区
- `Skins` — 皮肤 — 12 个社区
- `Weapons` — 武器 — 12 个社区
- `Cosmetics` — 外观 — 11 个社区
- `Server-side` — 服务端 — 11 个社区
- `Characters` — 角色 — 8 个社区
- `Enemies` — 敌人 — 8 个社区
- `Cards` — 卡牌 — 7 个社区
- `Gameplay` — 玩法 — 7 个社区
- `Language` — 语言 — 7 个社区
- `All Clients` — 所有客户端 — 6 个社区
- `Cosmetic` — 外观 — 6 个社区
- `Quality Of Life` — 体验优化 — 6 个社区
- `UI` — 界面 — 6 个社区
- `Utility` — 实用工具 — 6 个社区
- `Bug Fixes` — 缺陷修复 — 5 个社区
- `Emotes` — 表情动作 — 5 个社区
- `Gamemodes` — 游戏模式 — 5 个社区
- `Host Only` — 仅主机端 — 5 个社区
- `Music` — 音乐 — 5 个社区
- `NPCs` — NPC — 5 个社区
- `Translations` — 翻译 — 5 个社区
- `AI Generated Content` — AI 生成内容 — 4 个社区
- `Artifacts` — 神器 — 4 个社区
- `Asset Replacements` — 资源替换 — 4 个社区
- `Bosses` — Boss — 4 个社区
- `Cheats` — 作弊 — 4 个社区
- `Client Side` — 客户端 — 4 个社区
- `Client-Side` — 客户端 — 4 个社区
- `Developer Tools` — 开发者工具 — 4 个社区
- `Furniture` — 家具 — 4 个社区
- `Monsters` — 怪物 — 4 个社区
- `QoL` — 体验优化 — 4 个社区
- `Textures` — 贴图 — 4 个社区
- `Balance` — 平衡 — 3 个社区
- `Crafting` — 制作 — 3 个社区
- `Custom Maps` — 自定义地图 — 3 个社区
- `Events` — 活动 — 3 个社区
- `Gameplay Tweaks` — 玩法调整 — 3 个社区
- `Memes` — 梗 — 3 个社区
- `NSFW` — 成人内容 — 3 个社区
- `Optimization` — 优化 — 3 个社区
- `Skills` — 技能 — 3 个社区
- `Accessibility` — 无障碍 — 2 个社区：hades-ii / hollow-knight-silksong
- `Ammo` — 弹药 — 2 个社区：h3vr / receiver-2
- `Animation` — 动画 — 2 个社区：mycopunk / r5flowstate
- `Asset Packs` — 资源包 — 2 个社区：gtfo / hytale
- `Assets` — 资源 — 2 个社区：atlyss / talespire
- `BepInEx` — BepInEx — 2 个社区：content-warning / lethal-company
- `Biomes` — 生物群系 — 2 个社区：peak / plasma
- `Building` — 建造 — 2 个社区：valheim / windrose
- `Camera Mods` — 镜头模组 — 2 个社区：content-warning / reskate
- `Client` — 客户端 — 2 个社区：core-keeper / v-rising
- `Code Mods` — 代码模组 — 2 个社区：bonelab / boneworks
- `Content` — 内容 — 2 个社区：patapon-1-2-replay / scrap-mechanic
- `Costumes` — 服装 — 2 个社区：hard-time-3 / wrestling-empire
- `Custom Items` — 自定义物品 — 2 个社区：bonelab / boneworks
- `Custom NPCs` — 自定义 NPC — 2 个社区：bonelab / boneworks
- `Custom Player Models` — 自定义玩家模型 — 2 个社区：bonelab / boneworks
- `Custom Skins` — 自定义皮肤 — 2 个社区：bonelab / boneworks
- `Custom Weapons` — 自定义武器 — 2 个社区：bonelab / boneworks
- `Difficulty` — 难度 — 2 个社区：chrono-ark / touhou-lost-branch-of-legend
- `Equipment` — 装备 — 2 个社区：last-train-outta-wormtown / lethal-company
- `Experimental` — 实验性 — 2 个社区：subnautica-below-zero / subnautica
- `Game Modes` — 游戏模式 — 2 个社区：crab-game / socom-legacy
- `Gamemode` — 游戏模式 — 2 个社区：r5flowstate / shadows-of-doubt
- `Host-Only` — 仅主机端 — 2 个社区：content-warning / super-battle-golf
- `Levels` — 关卡 — 2 个社区：repo / white-knuckle
- `Localization` — 本地化 — 2 个社区：clover-pit / touhou-lost-branch-of-legend
- `MelonLoader` — MelonLoader — 2 个社区：content-warning / lethal-company
- `Meme` — 梗 — 2 个社区：distance / monster-train-2
- `Models` — 模型 — 2 个社区：northstar / socom-legacy
- `Moves` — 招式 — 2 个社区：hard-time-3 / wrestling-empire
- `Overrides` — 覆盖修改 — 2 个社区：hard-time-3 / wrestling-empire
- `Patch` — 补丁 — 2 个社区：rounds / shadows-of-doubt
- `Plugins` — 插件 — 2 个社区：hytale / reskate
- `Props` — 道具 — 2 个社区：socom-legacy / talespire
- `Quests` — 任务 — 2 个社区：atlyss / outward
- `Rooms` — 房间 — 2 个社区：enter-the-gungeon / my-dream-setup
- `Run Modifiers` — 对局修正 — 2 个社区：chrono-ark / touhou-lost-branch-of-legend
- `Server` — 服务端 — 2 个社区：core-keeper / v-rising
- `Server-Side` — 服务端 — 2 个社区：labyrinthine / mycopunk
- `Ships` — 飞船 — 2 个社区：cobalt-core / windrose
- `Sound` — 音效 — 2 个社区：patapon-1-2-replay / r5flowstate
- `Stages` — 关卡 — 2 个社区：nasb / risk-of-rain-returns
- `Themes` — 主题 — 2 个社区：tcg-card-shop-simulator / wrestling-empire
- `Tiles` — 地块 — 2 个社区：receiver-2 / talespire
- `Translation` — 翻译 — 2 个社区：balatro / monster-train-2
- `Transportation` — 交通工具 — 2 个社区：dyson-sphere-program / valheim
- `Tweaks & Quality Of Life` — 调整与体验优化 — 2 个社区：crab-game / lethal-company
- `Utils` — 实用工具 — 2 个社区：core-keeper / totally-accurate-battle-simulator
- `Vehicles` — 载具 — 2 个社区：lethal-company / valheim
- `Visual Effects` — 视觉效果 — 2 个社区：rounds / socom-legacy
- `World Generation` — 世界生成 — 2 个社区：valheim / windrose
- `(Deprecated category) Audio` — （已弃用的分类）音频 — 1 个社区：hollow-knight-silksong
- `(Deprecated category) Misc` — （已弃用的分类）杂项 — 1 个社区：hollow-knight-silksong
- `(Deprecated category) Tools` — （已弃用的分类）工具 — 1 个社区：hollow-knight-silksong
- `0.62 Branch` — 0.62 分支 — 1 个社区：tcg-card-shop-simulator
- `0.66 Branch` — 0.66 分支 — 1 个社区：tcg-card-shop-simulator
- `0.70 Branch` — 0.70 分支 — 1 个社区：tcg-card-shop-simulator
- `1.0 Classic Branch` — 1.0 经典分支 — 1 个社区：tcg-card-shop-simulator
- `1.0 Update` — 1.0 更新 — 1 个社区：v-rising
- `Abilities` — 能力 — 1 个社区：last-train-outta-wormtown
- `Acceleracers` — 加速车手 — 1 个社区：distance
- `Accolades` — 荣誉 — 1 个社区：peak
- `Act I` — 第一章 — 1 个社区：inscryption
- `Act II` — 第二章 — 1 个社区：inscryption
- `Act III` — 第三章 — 1 个社区：inscryption
- `Addons` — 附加组件 — 1 个社区：muck
- `Afflictions` — 苦难 — 1 个社区：peak
- `AI` — AI — 1 个社区：shadows-of-doubt
- `AI & NPCs` — AI 与 NPC — 1 个社区：socom-legacy
- `All Clients Required` — 所有客户端必装 — 1 个社区：super-battle-golf
- `All Required` — 全部必需 — 1 个社区：void-crew
- `Alloyed Collective` — Alloyed Collective — 1 个社区：riskofrain2
- `Animation Packs` — 动画包 — 1 个社区：reskate
- `APIs` — API — 1 个社区：my-dream-setup
- `Apps` — 应用 — 1 个社区：tcg-card-shop-simulator
- `Arenas` — 竞技场 — 1 个社区：wrestling-empire
- `Ashlands Update` — 灰烬之地更新 — 1 个社区：valheim
- `Asphalt` — 柏油 — 1 个社区：distance
- `Assembling Machines` — 组装机 — 1 个社区：dyson-sphere-program
- `Asset Importing` — 资源导入 — 1 个社区：resonite
- `Asset Replacement` — 资源替换 — 1 个社区：tcg-card-shop-simulator
- `Balancing` — 平衡调整 — 1 个社区：outward
- `Battle Force 5` — 战斗力量 5 — 1 个社区：distance
- `Battles` — 对战 — 1 个社区：monster-train-2
- `Belts and Sorters` — 传送带与分拣器 — 1 个社区：dyson-sphere-program
- `Blaster Master` — 爆破大师 — 1 个社区：distance
- `Blueprints` — 蓝图 — 1 个社区：dyson-sphere-program
- `Bog Witch Update` — 沼泽女巫更新 — 1 个社区：valheim
- `Boombox Music` — 音箱音乐 — 1 个社区：lethal-company
- `Boss` — 首领 — 1 个社区：hollow-knight-silksong
- `Bros` — 兄弟 — 1 个社区：broforce
- `Buffs` — 增益 — 1 个社区：white-knuckle
- `Bug Workaround` — 缺陷规避 — 1 个社区：resonite
- `Build Models` — 建造模型 — 1 个社区：my-dream-setup
- `Bundles` — 捆绑包 — 1 个社区：atlyss
- `Burnout` — 狂飙 — 1 个社区：distance
- `Campaigns` — 战役 — 1 个社区：receiver-2
- `Car` — 汽车 — 1 个社区：distance
- `Carryables` — 可搬运物 — 1 个社区：void-crew
- `Cars (film)` — 汽车（电影） — 1 个社区：distance
- `Cases` — 箱体 — 1 个社区：shadows-of-doubt
- `Charms` — 护符 — 1 个社区：clover-pit
- `Christmas` — 圣诞节 — 1 个社区：distance
- `City Generation` — 城市生成 — 1 个社区：shadows-of-doubt
- `Clans` — 氏族 — 1 个社区：monster-train-2
- `Classes` — 职业 — 1 个社区：outward
- `Client Mods` — 客户端模组 — 1 个社区：gtfo
- `Client-Only` — 仅客户端 — 1 个社区：content-warning
- `Combos` — 组合 — 1 个社区：hytale
- `Commands` — 命令 — 1 个社区：crab-game
- `Companions` — 同伴 — 1 个社区：windrose
- `Components` — 组件 — 1 个社区：plasma
- `Console` — 控制台 — 1 个社区：voices-of-the-void
- `Content Mods` — 内容模组 — 1 个社区：balatro
- `Context Menu` — 右键菜单 — 1 个社区：resonite
- `Contracts` — 契约 — 1 个社区：yapyap
- `Controls` — 操作 — 1 个社区：resonite
- `Costs` — 消耗 — 1 个社区：inscryption
- `Courses` — 赛道 — 1 个社区：super-battle-golf
- `Crafts` — 制作 — 1 个社区：voices-of-the-void
- `Custom Audio` — 自定义音频 — 1 个社区：bonelab
- `Custom Cards` — 自定义卡牌 — 1 个社区：rounds
- `Custom Crests` — 自定义纹章 — 1 个社区：hollow-knight-silksong
- `Custom Menus` — 自定义菜单 — 1 个社区：northstar
- `Custom Tools` — 自定义工具 — 1 个社区：hollow-knight-silksong
- `Customisation` — 自定义 — 1 个社区：atlyss
- `Dashboard` — 仪表盘 — 1 个社区：resonite
- `DataBlocks (MTFO)` — 数据块（MTFO） — 1 个社区：gtfo
- `DDS` — DDS — 1 个社区：northstar
- `Decor` — 装饰 — 1 个社区：shadows-of-doubt
- `Decoration` — 装饰 — 1 个社区：tcg-card-shop-simulator
- `Decorations` — 装饰 — 1 个社区：void-crew
- `Dedicated Server` — 专用服务器 — 1 个社区：windrose
- `Deep North Update` — 极北之地更新 — 1 个社区：valheim
- `Disables Progression` — 禁用进度 — 1 个社区：void-crew
- `Display` — 显示 — 1 个社区：lethal-league-blaze
- `Drones` — 无人机 — 1 个社区：repo
- `Dyson` — 戴森 — 1 个社区：dyson-sphere-program
- `Early Plugins` — 早期插件 — 1 个社区：hytale
- `Effects` — 效果 — 1 个社区：talespire
- `Elites` — 精英 — 1 个社区：risk-of-rain-returns
- `Encounters` — 遭遇 — 1 个社区：inscryption
- `Environment` — 环境 — 1 个社区：dyson-sphere-program
- `Exhibits` — 展品 — 1 个社区：touhou-lost-branch-of-legend
- `Expansion` — 扩展 — 1 个社区：hollow-knight-silksong
- `Expansions` — 扩展 — 1 个社区：tcg-card-shop-simulator
- `F-Zero` — F-Zero — 1 个社区：distance
- `Faces` — 面孔 — 1 个社区：peak
- `Factions` — 阵营 — 1 个社区：totally-accurate-battle-simulator
- `Farming` — 农耕 — 1 个社区：core-keeper
- `Fish` — 鱼类 — 1 个社区：webfishing
- `Fixes` — 修复 — 1 个社区：lost-skies-ic
- `Floors` — 楼层 — 1 个社区：enter-the-gungeon
- `Framework` — 框架 — 1 个社区：r5flowstate
- `Frameworks` — 框架 — 1 个社区：socom-legacy
- `Game Breaking` — 破坏游戏性 — 1 个社区：dyson-sphere-program
- `Game mechanics` — 游戏机制 — 1 个社区：patapon-1-2-replay
- `Gameplay mechanics` — 玩法机制 — 1 个社区：cobalt-core
- `Gear` — 装备 — 1 个社区：valheim
- `Gear and Armor` — 装备与护甲 — 1 个社区：windrose
- `Gloomrot Update` — 幽暗腐化更新 — 1 个社区：v-rising
- `Graphics` — 画面 — 1 个社区：patapon-1-2-replay
- `Grimora Mod` — Grimora 模组 — 1 个社区：inscryption
- `Gungeoneers` — 地牢枪手 — 1 个社区：enter-the-gungeon
- `Guns` — 枪械 — 1 个社区：enter-the-gungeon
- `Halloween` — 万圣节 — 1 个社区：distance
- `Halloween Modjam 2022` — 2022 万圣节模组创作活动 — 1 个社区：riskofrain2
- `Halo` — 光环 — 1 个社区：distance
- `Hand Cosmetics` — 手部外观 — 1 个社区：white-knuckle
- `Hand Packs` — 手部包 — 1 个社区：white-knuckle
- `Hardware Integration` — 硬件集成 — 1 个社区：resonite
- `Hats` — 帽子 — 1 个社区：enter-the-gungeon
- `Hazards` — 危险 — 1 个社区：lethal-company
- `Hildir's Request Update` — 希尔德请求更新 — 1 个社区：valheim
- `Host-Side` — 仅主机端 — 1 个社区：void-crew
- `Hot Wheels` — 风火轮 — 1 个社区：distance
- `IL2CPP` — IL2CPP — 1 个社区：schedule-i
- `Info` — 信息 — 1 个社区：dyson-sphere-program
- `Inspectors` — 检查器 — 1 个社区：resonite
- `Integration` — 整合 — 1 个社区：talespire
- `Interactables` — 可交互物 — 1 个社区：risk-of-rain-returns
- `Interiors` — 室内 — 1 个社区：lethal-company
- `Inventory Modifications` — 背包修改 — 1 个社区：windrose
- `Kaycee's Mod` — 凯西的模组 — 1 个社区：inscryption
- `Kerfur` — Kerfur 机器人 — 1 个社区：voices-of-the-void
- `Language: CN` — 语言：中文 — 1 个社区：northstar
- `Language: EN` — 语言：英文 — 1 个社区：northstar
- `Languages` — 语言 — 1 个社区：atlyss
- `Leaderboard Legal` — 排行榜可用 — 1 个社区：white-knuckle
- `Legend` — 传奇 — 1 个社区：r5flowstate
- `LEGO` — 乐高 — 1 个社区：distance
- `Locations` — 地点 — 1 个社区：hard-time-3
- `Logic Mod` — 逻辑模组 — 1 个社区：windrose
- `Logic Nodes` — 逻辑节点 — 1 个社区：plasma
- `Logistics` — 物流 — 1 个社区：dyson-sphere-program
- `Magic` — 魔法 — 1 个社区：core-keeper
- `Magnificus Mod` — Magnificus 模组 — 1 个社区：inscryption
- `Map` — 地图 — 1 个社区：r5flowstate
- `Mecha` — 机甲 — 1 个社区：dyson-sphere-program
- `Mechanics` — 机制 — 1 个社区：outward
- `Memory Packs` — 记忆包 — 1 个社区：clover-pit
- `Merchants` — 商人 — 1 个社区：monster-train-2
- `Minis` — 迷你模型 — 1 个社区：talespire
- `Missions & Campaigns` — 任务与战役 — 1 个社区：socom-legacy
- `Mistlands Update` — 迷雾之地更新 — 1 个社区：valheim
- `Mixtapes` — 混音磁带 — 1 个社区：peak
- `Mobs` — 生物 — 1 个社区：core-keeper
- `Mod Jam 1 - Void` — 模组创作活动 1 - 虚空 — 1 个社区：risk-of-rain-returns
- `Mod_Session Required` — 需要 Mod_Session — 1 个社区：void-crew
- `Model` — 模型 — 1 个社区：r5flowstate
- `Model Replacements` — 模型替换 — 1 个社区：banjo-kazooie-nuts-and-bolts-recompiled
- `Modifiers` — 修正项 — 1 个社区：clover-pit
- `Modpack` — 整合包 — 1 个社区：r5flowstate
- `Mono` — Mono 运行时 — 1 个社区：schedule-i
- `Monster Truck` — 怪物卡车 — 1 个社区：distance
- `Moons` — 星球 — 1 个社区：lethal-company
- `Mutators` — 变异器 — 1 个社区：monster-train-2
- `Nebula Compatible` — 兼容 Nebula — 1 个社区：dyson-sphere-program
- `Networked` — 联网 — 1 个社区：talespire
- `New Mechanics` — 新机制 — 1 个社区：balatro
- `Nitronic Rush` — 氮气狂飙 — 1 个社区：distance
- `NPC` — NPC — 1 个社区：bonelab
- `Oakveil Update` — Oakveil 更新 — 1 个社区：v-rising
- `Objectives` — 目标 — 1 个社区：last-train-outta-wormtown
- `Original Car` — 原版汽车 — 1 个社区：distance
- `P03 In Kaycee's Mod` — 凯西的模组中的 P03 — 1 个社区：inscryption
- `Patapon 1` — 啪嗒砰 1 — 1 个社区：patapon-1-2-replay
- `Patapon 2` — 啪嗒砰 2 — 1 个社区：patapon-1-2-replay
- `Patterns` — 图案 — 1 个社区：clover-pit
- `Pelts` — 毛皮 — 1 个社区：inscryption
- `Performance` — 性能 — 1 个社区：lethal-company
- `Perks` — 专长 — 1 个社区：white-knuckle
- `Phone Options` — 手机选项 — 1 个社区：clover-pit
- `Phone Related` — 手机相关 — 1 个社区：tcg-card-shop-simulator
- `Placeables` — 可放置物 — 1 个社区：voices-of-the-void
- `Player Characters` — 玩家角色 — 1 个社区：riskofrain2
- `Police` — 警车 — 1 个社区：distance
- `Posters` — 海报 — 1 个社区：lethal-company
- `Power` — 能力 — 1 个社区：dyson-sphere-program
- `Pre-Release` — 预发布 — 1 个社区：hytale
- `Protoflux` — ProtoFlux — 1 个社区：resonite
- `PvP` — PvP — 1 个社区：valheim
- `QOL` — 体验优化 — 1 个社区：tcg-card-shop-simulator
- `Real Car` — 真实车辆 — 1 个社区：distance
- `Rebalance` — 平衡性调整 — 1 个社区：gtfo
- `Regions` — 地区 — 1 个社区：inscryption
- `Release` — 正式版 — 1 个社区：hytale
- `Requires Manual Dependencies` — 需手动安装依赖 — 1 个社区：tcg-card-shop-simulator
- `Reskins` — 重新贴图 — 1 个社区：enter-the-gungeon
- `Resources` — 资源 — 1 个社区：dyson-sphere-program
- `Robes` — 法袍 — 1 个社区：yapyap
- `Rocket League` — 火箭联盟 — 1 个社区：distance
- `Ruleset` — 规则集 — 1 个社区：talespire
- `Rundown Tools` — 远征序列工具 — 1 个社区：gtfo
- `Rundowns` — 远征序列 — 1 个社区：gtfo
- `Runner` — 跑酷 — 1 个社区：distance
- `Sandbox` — 沙盒 — 1 个社区：mycopunk
- `Saves` — 存档 — 1 个社区：hytale
- `Scene File` — 场景文件 — 1 个社区：h3vr
- `Scrybes` — 布道者 — 1 个社区：inscryption
- `Seekers of the Storm Update` — 风暴追寻者更新 — 1 个社区：riskofrain2
- `Sellables` — 可售物品 — 1 个社区：tcg-card-shop-simulator
- `Server Side` — 服务端 — 1 个社区：webfishing
- `Sets` — 套装 — 1 个社区：tcg-card-shop-simulator
- `Shaders` — 着色器 — 1 个社区：socom-legacy
- `Shop` — 商店 — 1 个社区：tcg-card-shop-simulator
- `Sigils` — 印记 — 1 个社区：inscryption
- `Signals` — 信号 — 1 个社区：voices-of-the-void
- `Single Player` — 单人游戏 — 1 个社区：windrose
- `Skateboards` — 滑板 — 1 个社区：reskate
- `Sonic` — 索尼克 — 1 个社区：distance
- `Sound Packs` — 音效包 — 1 个社区：ultrakill
- `Soundpack` — 音效包 — 1 个社区：content-warning
- `Space Ship` — 太空飞船 — 1 个社区：distance
- `Special Abilities` — 特殊能力 — 1 个社区：inscryption
- `Species` — 物种 — 1 个社区：webfishing
- `Speed Racer` — 极速赛车手 — 1 个社区：distance
- `Speedrunning` — 速通 — 1 个社区：another-crabs-treasure
- `Storage` — 存储 — 1 个社区：dyson-sphere-program
- `Suits` — 服装 — 1 个社区：lethal-company
- `Survivors` — 幸存者 — 1 个社区：risk-of-rain-returns
- `Survivors of the Void` — 虚空幸存者 — 1 个社区：riskofrain2
- `Symbols` — 符号 — 1 个社区：clover-pit
- `Tapes` — 磁带 — 1 个社区：receiver-2
- `Technical Tweaks` — 技术调整 — 1 个社区：resonite
- `Technology` — 科技 — 1 个社区：core-keeper
- `Text Changes` — 文本改动 — 1 个社区：balatro
- `Texture Replacements` — 贴图替换 — 1 个社区：banjo-kazooie-nuts-and-bolts-recompiled
- `Trackmania` — 赛道狂飙 — 1 个社区：distance
- `Traits` — 特质 — 1 个社区：inscryption
- `Tribes` — 部族 — 1 个社区：inscryption
- `TV Videos` — 电视视频 — 1 个社区：lethal-company
- `UE4SS Mod` — UE4SS 模组 — 1 个社区：windrose
- `UI & HUD` — 界面与 HUD — 1 个社区：socom-legacy
- `Units` — 单位 — 1 个社区：totally-accurate-battle-simulator
- `Universes` — 宇宙 — 1 个社区：hytale
- `Upgrades` — 升级 — 1 个社区：repo
- `Utilities` — 实用工具 — 1 个社区：rounds
- `Valuables` — 贵重物品 — 1 个社区：repo
- `Vanilla compatible` — 原版兼容 — 1 个社区：straftat
- `Vanilla Compatible` — 原版兼容 — 1 个社区：content-warning
- `Vault File` — 避难所文件 — 1 个社区：h3vr
- `Vehicle Parts` — 车辆部件 — 1 个社区：banjo-kazooie-nuts-and-bolts-recompiled
- `Visual Tweaks` — 视觉调整 — 1 个社区：resonite
- `Voicepacks` — 语音包 — 1 个社区：nasb
- `Wacky Races` — 疯狂赛车 — 1 个社区：distance
- `Wands` — 法杖 — 1 个社区：yapyap
- `Weapon` — 武器 — 1 个社区：r5flowstate
- `Weapons & Equipment` — 武器与装备 — 1 个社区：socom-legacy
- `Wearables` — 可穿戴物 — 1 个社区：h3vr
- `Weather` — 天气 — 1 个社区：lethal-company
- `Wizards` — 法师 — 1 个社区：resonite
- `World` — 世界 — 1 个社区：peak
- `World Race` — 世界竞速 — 1 个社区：distance
- `Worldgen` — 世界生成 — 1 个社区：core-keeper
- `Worlds` — 世界 — 1 个社区：hytale

## 5. 其他筛选（371/371 社区相同）

- `Deprecated` — 已弃用 — 371 个社区
- `NSFW` — 成人内容 — 371 个社区

## 6. 社区页其余固定 UI（2026-11-16 线上 DOM 复核）

| 文案 | 位置 | 状态 |
| --- | --- | --- |
| 页头 `Mods` 类标题、面包屑、`Upload package`、`Modding Wiki`、`Modding Discord` | 社区页 | v1.0.6 已覆盖 |
| `Last updated` / 排序项 / 分页 `Next` / 结果计数 | 列表工具条 | v1.0.6 已覆盖（含分段计数） |
| `Listing` | 社区页卡片作者行 | **不翻**：核实为**作者名**（`/c/gtfo/p/Listing/` 的 `card-package__link`，mod 为 `LIETHOUSE`），属 UGC |
| 页脚 `This page is` + `open-source ❤` | 页脚 | v1.0.6 已覆盖（注入实测：`This page is 开源 ❤`，`© …` 版权行按惯例不翻） |
| 移动端筛选抽屉标题 `Filters` | `[id="package-search-filters-drawer"] .drawer__header-content h3` | 本轮新增 → `筛选器`（`include: Filters` 规则） |
| 语言分类 `Language: CN` / `Language: EN` | `northstar` 等社区的分类 | 本轮新增 → `语言：中文` / `语言：英文` |

## 7. 逐社区采集状态（371/371）

| 社区 slug | 页面标题 | 分区数 | 分类数 | 结果计数 |
| --- | --- | --- | --- | --- |
| 2-ship-2-harkinian | 2 Ship 2 Harkinian Mods · Thunderstore | 3 | 6 | 1 of 1 result |
| 20-minutes-till-dawn | 20 Minutes Till Dawn Mods · Thunderstore | 3 | 7 | 1-20 of 26 results |
| 3dash | 3Dash Mods · Thunderstore | 3 | 5 | 1-3 of 3 results |
| 9-kings | 9 Kings Mods · Thunderstore | 3 | 6 | 1-5 of 5 results |
| a-dance-of-fire-and-ice | A Dance of Fire and Ice Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| a-gentlemens-dispute | A Gentlemen's Dispute Mods · Thunderstore | 3 | 6 | 1-20 of 22 results |
| a-little-to-the-left | A Little to the Left Mods · Thunderstore | 3 | 7 | 1-3 of 3 results |
| a-webbing-journey | A Webbing Journey Mods · Thunderstore | 3 | 7 | 1-3 of 3 results |
| across-the-obelisk | Across the Obelisk Mods · Thunderstore | 3 | 7 | 1-20 of 158 results |
| aeruta | Aeruta Mods · Thunderstore | 3 | 6 | 1-5 of 5 results |
| against-the-storm | Against the Storm Mods · Thunderstore | 3 | 6 | 1-20 of 51 results |
| against | AGAINST Mods · Thunderstore | 3 | 5 | 1-6 of 6 results |
| ai-limit | AI LIMIT Mods · Thunderstore | 3 | 7 | 1-3 of 3 results |
| airframe-ultra | Airframe Ultra Mods · Thunderstore | 3 | 7 | 1-3 of 3 results |
| airport-security-sucks | Airport Security Sucks! Mods · Thunderstore | 3 | 7 | 1-2 of 2 results |
| ale-and-tale-tavern | Ale & Tale Tavern Mods · Thunderstore | 3 | 6 | 1-20 of 34 results |
| aloft | Aloft Mods · Thunderstore | 3 | 5 | 1-12 of 12 results |
| among-us-3d | Among Us 3D Mods · Thunderstore | 3 | 7 | 1-3 of 3 results |
| among-us | Among Us Mods · Thunderstore | 3 | 9 | 1-13 of 13 results |
| an-unfinished-game | An Unfinished Game Mods · Thunderstore | 3 | 6 | 1-5 of 5 results |
| ancient-dungeon-vr | Ancient Dungeon VR Mods · Thunderstore | 3 | 7 | 1-6 of 6 results |
| aneurism-iv | ANEURISM IV Mods · Thunderstore | 3 | 6 | 1-6 of 6 results |
| angry-birds-vr-isle-of-pigs | Angry Birds VR: Isle of Pigs Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| another-crabs-treasure | Another Crab's Treasure Mods · Thunderstore | 3 | 8 | 1-7 of 7 results |
| approximately-up | Approximately Up Mods · Thunderstore | 3 | 7 | 1-4 of 4 results |
| arcus-chroma | Arcus Chroma Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| aska | ASKA Mods · Thunderstore | 3 | 6 | 1-20 of 63 results |
| astroneer | Astroneer Mods · Thunderstore | 3 | 4 | 1-20 of 44 results |
| atlyss | ATLYSS Mods · Thunderstore | 4 | 16 | 1-20 of 596 results |
| atomicrops | Atomicrops Mods · Thunderstore | 3 | 6 | 1-20 of 28 results |
| atrio-the-dark-wild | Atrio: The Dark Wild Mods · Thunderstore | 3 | 7 | 1-7 of 7 results |
| baby-steps | Baby Steps Mods · Thunderstore | 3 | 6 | 1-10 of 10 results |
| back-to-the-dawn | Back to the Dawn Mods · Thunderstore | 3 | 9 | 1-3 of 3 results |
| backpack-hero | Backpack Hero Mods · Thunderstore | 3 | 7 | 1-9 of 9 results |
| bad-north | Bad North Mods · Thunderstore | 3 | 6 | 1-17 of 17 results |
| balatro | Balatro Mods · Thunderstore | 3 | 14 | 1-20 of 218 results |
| banjo-kazooie-nuts-and-bolts-recompiled | Banjo-Kazooie: Nuts & Bolts Recompiled Mods · Thunderstore | 3 | 10 | No results |
| banjo-recompiled | Banjo: Recompiled Mods · Thunderstore | 3 | 6 | 1-20 of 57 results |
| beetleball | Beetleball Mods · Thunderstore | 3 | 6 | 1-14 of 14 results |
| below-the-stone | Below the Stone Mods · Thunderstore | 3 | 6 | 1-7 of 7 results |
| bendy-and-the-ink-machine | Bendy and the Ink Machine Mods · Thunderstore | 3 | 6 | 1-6 of 6 results |
| berry-bury-berry | Berry Bury Berry Mods · Thunderstore | 3 | 7 | 1-3 of 3 results |
| beton-brutal | BETON BRUTAL Mods · Thunderstore | 3 | 6 | 1-17 of 17 results |
| betrayal-beach | Betrayal Beach Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| big-ambitions | Big Ambitions Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| big-walk | Big Walk Mods · Thunderstore | 3 | 6 | 1-20 of 107 results |
| block-story | Block Story Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| bloons-td-6 | Bloons TD 6 Mods · Thunderstore | 3 | 7 | 1-20 of 37 results |
| blue-prince | Blue Prince Mods · Thunderstore | 3 | 6 | 1-7 of 7 results |
| bomb-rush-cyberfunk | Bomb Rush Cyberfunk Mods · Thunderstore | 5 | 7 | 1-20 of 424 results |
| bombanana | BOMBANANA! Mods · Thunderstore | 3 | 6 | 1-8 of 8 results |
| bomberman-64-recompiled | Bomberman 64: Recompiled Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| bonelab | BONELAB Mods · Thunderstore | 3 | 16 | 1-20 of 928 results |
| boneworks | Boneworks Mods · Thunderstore | 1 | 8 | 1-20 of 1256 results |
| book-of-travels | Book of Travels Mods · Thunderstore | 3 | 6 | 1-8 of 8 results |
| bopl-battle | Bopl Battle Mods · Thunderstore | 3 | 6 | 1-20 of 268 results |
| broforce | Broforce Mods · Thunderstore | 3 | 7 | 1-20 of 29 results |
| brotato | Brotato Mods · Thunderstore | 3 | 7 | 1-7 of 7 results |
| brutalistick-vr | BRUTALISTICK VR Mods · Thunderstore | 3 | 6 | 1-20 of 49 results |
| burglin-gnomes | Burglin' Gnomes Mods · Thunderstore | 3 | 7 | 1-20 of 38 results |
| cairn | Cairn Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| carrier-deck | Carrier Deck Mods · Thunderstore | 3 | 6 | 1-10 of 10 results |
| cast-n-chill | Cast n Chill Mods · Thunderstore | 3 | 7 | 1-3 of 3 results |
| castle-story | Castle Story Mods · Thunderstore | 3 | 6 | 1-8 of 8 results |
| cat-mail-co | Cat Mail Co. Mods · Thunderstore | 3 | 7 | 1-13 of 13 results |
| cave-crawlers | Cave Crawlers Mods · Thunderstore | 3 | 6 | 1-7 of 7 results |
| chill-with-you | Chill with You : Lo-Fi Story Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| chrono-ark | Chrono Ark Mods · Thunderstore | 3 | 15 | 1-20 of 39 results |
| cities-skylines-ii | Cities: Skylines II Mods · Thunderstore | 3 | 6 | 1-20 of 184 results |
| clover-pit | CloverPit Mods · Thunderstore | 3 | 15 | 1-20 of 25 results |
| cobalt-core | Cobalt Core Mods · Thunderstore | 3 | 13 | 1 of 1 result |
| content-warning | Content Warning Mods · Thunderstore | 8 | 20 | 1-20 of 317 results |
| core-keeper | Core Keeper Mods · Thunderstore | 3 | 16 | 1-19 of 19 results |
| crab-game | Crab Game Mods · Thunderstore | 3 | 14 | 1-20 of 45 results |
| crack | CRACK Mods · Thunderstore | 3 | 7 | 1-12 of 12 results |
| crashout-crew | Crashout Crew Mods · Thunderstore | 3 | 13 | 1-20 of 32 results |
| crawl | Crawl Mods · Thunderstore | 3 | 7 | 1-7 of 7 results |
| crawlspace-2 | Crawlspace 2 Mods · Thunderstore | 3 | 6 | 1-10 of 10 results |
| crawlspace | Crawlspace Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| crime-simulator | Crime Simulator Mods · Thunderstore | 3 | 6 | 1-12 of 12 results |
| cryo | CRYO Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| cult-of-pin | Cult of PiN Mods · Thunderstore | 3 | 7 | 1-3 of 3 results |
| cult-of-the-lamb | Cult of the Lamb Mods · Thunderstore | 3 | 7 | 1-20 of 82 results |
| cuphead | Cuphead Mods · Thunderstore | 3 | 7 | 1-4 of 4 results |
| cursed-words | Cursed Words Mods · Thunderstore | 3 | 6 | 1-11 of 11 results |
| dale-dawson-stationery-supplies | Dale & Dawson Stationery Supplies Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| darkwater | Darkwater Mods · Thunderstore | 3 | 6 | 1-12 of 12 results |
| deadly-delivery | Deadly Delivery Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| deep-rock-galactic-survivor | Deep Rock Galactic: Survivor Mods · Thunderstore | 3 | 6 | 1-15 of 15 results |
| def-jam-fight-for-ny-recompiled | Def Jam: Fight for NY Recompiled Mods · Thunderstore | 3 | 7 | 1-4 of 4 results |
| depo | DEPO : Death Epileptic Pixel Origins Mods · Thunderstore | 3 | 6 | 1-9 of 9 results |
| dice-kingdoms | Dice Kingdoms Mods · Thunderstore | 3 | 7 | 1-7 of 7 results |
| dinosaur-planet-recompiled | Dinosaur Planet: Recompiled Mods · Thunderstore | 3 | 6 | 1-5 of 5 results |
| disco-elysium | Disco Elysium Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| distance | Distance Mods · Thunderstore | 4 | 34 | 1-20 of 29 results |
| dome-keeper | Dome Keeper Mods · Thunderstore | 3 | 6 | 1 of 1 result |
| dread-hunger | Dread Hunger Mods · Thunderstore | 3 | 6 | 1 of 1 result |
| dredge | Dredge Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| ducks-can-drive | Ducks Can Drive Mods · Thunderstore | 3 | 6 | 1-7 of 7 results |
| dusk | DUSK Mods · Thunderstore | 3 | 6 | 1-6 of 6 results |
| dyson-sphere-program | Dyson Sphere Program Mods · Thunderstore | 1 | 19 | 1-20 of 651 results |
| easy-delivery-co | Easy Delivery Co Mods · Thunderstore | 3 | 6 | 1-20 of 33 results |
| electoral-carnage | Electoral Carnage Mods · Thunderstore | 3 | 7 | 1-11 of 11 results |
| ena-dream-bbq | ENA: Dream BBQ Mods · Thunderstore | 3 | 6 | 1-9 of 9 results |
| enter-the-gungeon | Enter the Gungeon Mods · Thunderstore | 3 | 18 | 1-20 of 372 results |
| erenshor | Erenshor Mods · Thunderstore | 3 | 6 | 1-20 of 67 results |
| escape-from-playtime | Escape from Playtime Mods · Thunderstore | 3 | 7 | 1-2 of 2 results |
| everything-is-crab | Everything is Crab Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| factory-planner | Factory Planner Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| fate-reawakened | FATE: Reawakened Mods · Thunderstore | 3 | 7 | 1-16 of 16 results |
| five-nights-at-freddys-into-the-pit | Five Nights at Freddy's: Into the Pit Mods · Thunderstore | 3 | 6 | 1-6 of 6 results |
| flipping-is-hard | Flipping is Hard Mods · Thunderstore | 3 | 7 | 1-2 of 2 results |
| football-manager-26 | Football Manager 26 Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| for-the-king | For The King Mods · Thunderstore | 1 | 0 | 1-20 of 21 results |
| forsaken-frontiers | Forsaken Frontiers Mods · Thunderstore | 3 | 6 | 1-10 of 10 results |
| frozen-ship | Frozen Ship Mods · Thunderstore | 3 | 7 | 1-4 of 4 results |
| frukt | FRUKT Mods · Thunderstore | 3 | 7 | 1-2 of 2 results |
| gamble-with-your-friends | Gamble With Your Friends Mods · Thunderstore | 3 | 6 | 1-20 of 76 results |
| gang-beasts | Gang Beasts Mods · Thunderstore | 3 | 7 | 1-20 of 74 results |
| garfield-kart-furious-racing | Garfield Kart - Furious Racing Mods · Thunderstore | 3 | 6 | 1-13 of 13 results |
| gatekeeper | Gatekeeper Mods · Thunderstore | 3 | 6 | 1-11 of 11 results |
| getting-over-it | Getting Over It with Bennett Foddy Mods · Thunderstore | 3 | 6 | 1-14 of 14 results |
| gladio-mori | Gladio Mori Mods · Thunderstore | 3 | 6 | 1-20 of 23 results |
| gloomwood | Gloomwood Mods · Thunderstore | 3 | 6 | 1-11 of 11 results |
| goblin-buster | Goblin Buster: Incremental Tower Defense Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| goblin-cleanup | Goblin Cleanup Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| goodbye-volcano-high | Goodbye Volcano High Mods · Thunderstore | 3 | 6 | 1-7 of 7 results |
| gorebox | GoreBox Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| gorilla-tag | Gorilla Tag Mods · Thunderstore | 3 | 6 | 1-13 of 13 results |
| grain-rot | Grain Rot Mods · Thunderstore | 3 | 6 | 1-20 of 21 results |
| granny-chapter-two | Granny: Chapter Two Mods · Thunderstore | 3 | 6 | 1-6 of 6 results |
| graveyard-keeper-2 | Graveyard Keeper 2 Mods · Thunderstore | 3 | 7 | 1-20 of 35 results |
| green-hell-vr | Green Hell VR Mods · Thunderstore | 1 | 0 | 1-6 of 6 results |
| grey-hack | Grey Hack Mods · Thunderstore | 3 | 6 | 1-11 of 11 results |
| grilluminati | Grilluminati Mods · Thunderstore | 3 | 7 | 1 of 1 result |
| grime | GRIME Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| gtfo | GTFO Mods · Thunderstore | 6 | 12 | 1-20 of 772 results |
| guilty-as-sock | Guilty as Sock! Mods · Thunderstore | 3 | 6 | 1-10 of 10 results |
| gunman-contracts-stand-alone | Gunman Contracts - Stand Alone Mods · Thunderstore | 3 | 7 | 1-5 of 5 results |
| h3vr | H3VR Mods · Thunderstore | 3 | 18 | 1-20 of 5560 results |
| hades-ii | Hades 2 Mods · Thunderstore | 3 | 11 | 1-20 of 186 results |
| hard-bullet | Hard Bullet Mods · Thunderstore | 1 | 9 | 1-20 of 59 results |
| hard-time-3 | Hard Time III Mods · Thunderstore | 3 | 14 | 1-11 of 11 results |
| harvest-moon-64-recompiled | Harvest Moon 64 Recompiled Mods · Thunderstore | 3 | 6 | 1-9 of 9 results |
| holdfast-nations-at-war | Holdfast: Nations At War Mods · Thunderstore | 3 | 7 | 1-10 of 10 results |
| hollow-knight-silksong | Hollow Knight: Silksong Mods · Thunderstore | 3 | 14 | 1-20 of 450 results |
| home-safety-hotline | Home Safety Hotline Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| hot-lava | Hot Lava Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| hotds | House of the Dying Sun Mods · Thunderstore | 3 | 6 | 1-13 of 13 results |
| house-of-legacy | House of Legacy Mods · Thunderstore | 3 | 6 | 1-20 of 36 results |
| how-to-fish | How to Fish Mods · Thunderstore | 3 | 7 | 1-20 of 249 results |
| human-fall-flat | Human Fall Flat Mods · Thunderstore | 3 | 6 | 1-14 of 14 results |
| hytale | Hytale Mods · Thunderstore | 9 | 15 | 1-4 of 4 results |
| i-am-your-beast | I Am Your Beast Mods · Thunderstore | 3 | 6 | 1-8 of 8 results |
| in-falsus | In Falsus Mods · Thunderstore | 3 | 7 | 1-15 of 15 results |
| in-silence | In Silence Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| inferno-protocol | Inferno Protocol Mods · Thunderstore | 3 | 7 | 1-11 of 11 results |
| inscryption | Inscryption Mods · Thunderstore | 11 | 28 | 1-20 of 467 results |
| inside-the-backrooms | Inside The Backrooms Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| iron-nest | IRON NEST: Heavy Turret Simulator Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| ironstrike | IRONSTRIKE Mods · Thunderstore | 3 | 7 | 1 of 1 result |
| island-market-simulator | Island Market Simulator Mods · Thunderstore | 3 | 6 | 1-8 of 8 results |
| jump-scare-mansion | Spooky's Jump Scare Mansion: HD Renovation Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| jump-space | Jump Space Mods · Thunderstore | 3 | 6 | 1-20 of 25 results |
| keywe | KeyWe Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| labyrinthine | Labyrinthine Mods · Thunderstore | 3 | 8 | 1-7 of 7 results |
| last-pirates-die-together | Last Pirates: Die Together Mods · Thunderstore | 3 | 6 | 1-7 of 7 results |
| last-train-outta-wormtown | Last Train Outta' Wormtown Mods · Thunderstore | 3 | 12 | 1-20 of 27 results |
| lazy-witchs-factory | Lazy Witch's Factory Mods · Thunderstore | 3 | 7 | 1-9 of 9 results |
| lens-island | Len's Island Mods · Thunderstore | 3 | 6 | 1-8 of 8 results |
| lethal-company | Lethal Company Mods · Thunderstore | 6 | 31 | 1-20 of 19373 results |
| lethal-league-blaze | Lethal League Blaze Mods · Thunderstore | 1 | 7 | 1-20 of 91 results |
| limitless-survivor | Limitless Survivor Mods · Thunderstore | 3 | 7 | 1-2 of 2 results |
| logic-world | Logic World Mods · Thunderstore | 3 | 6 | 1-6 of 6 results |
| lootun | Lootun Mods · Thunderstore | 3 | 6 | 1-9 of 9 results |
| lost-skies-ic | Lost Skies Island Creator Mods · Thunderstore | 1 | 3 | 1-4 of 4 results |
| lost-skies | Lost Skies Mods · Thunderstore | 3 | 8 | 1-20 of 78 results |
| lucid-cats | Lucid Cats Mods · Thunderstore | 3 | 7 | 1 of 1 result |
| lucky-shot | Lucky Shot Mods · Thunderstore | 3 | 6 | 1-15 of 15 results |
| lumentale-memories-of-trey | LumenTale: Memories of Trey Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| lycans | Lycans Mods · Thunderstore | 3 | 6 | 1-20 of 120 results |
| mage-arena | Mage Arena Mods · Thunderstore | 3 | 6 | 1-20 of 84 results |
| magicite | Magicite Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| magicraft | Magicraft Mods · Thunderstore | 3 | 6 | 1-5 of 5 results |
| make-way | Make Way Mods · Thunderstore | 3 | 7 | 1 of 1 result |
| malteses-fluffy-onsen | Maltese's Fluffy Onsen Mods · Thunderstore | 3 | 6 | 1-5 of 5 results |
| meccha-chameleon | MECCHA CHAMELEON Mods · Thunderstore | 3 | 6 | 1-7 of 7 results |
| mechanica | Mechanica Mods · Thunderstore | 1 | 0 | 1-13 of 13 results |
| meeple-station | Meeple Station Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| mega-man-64-recompiled | Mega Man 64: Recompiled Mods · Thunderstore | 3 | 6 | No results |
| megabonk | Megabonk Mods · Thunderstore | 3 | 6 | 1-20 of 130 results |
| mewgenics | Mewgenics Mods · Thunderstore | 3 | 6 | No results |
| mimesis | Mimesis Mods · Thunderstore | 3 | 6 | 1-20 of 69 results |
| mine-mogul | MineMogul Mods · Thunderstore | 3 | 6 | 1-10 of 10 results |
| minigunner | Minigunner Mods · Thunderstore | 3 | 7 | 1 of 1 result |
| minos | MINOS Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| mio-memories-in-orbit | MIO: Memories in Orbit Mods · Thunderstore | 3 | 7 | 1-2 of 2 results |
| miside-zero | MiSide: Zero Mods · Thunderstore | 3 | 6 | 1-7 of 7 results |
| miside | MiSide Mods · Thunderstore | 3 | 6 | 1-7 of 7 results |
| modulus-factory-automation | Modulus: Factory Automation Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| monster-train-2 | Monster Train 2 Mods · Thunderstore | 3 | 18 | 1-20 of 68 results |
| moonlighter | Moonlighter Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| movie-battles-2 | Movie Battles II Mods · Thunderstore | 3 | 7 | 1 of 1 result |
| muck | Muck Mods · Thunderstore | 1 | 4 | 1-20 of 207 results |
| my-dream-setup | My Dream Setup Mods · Thunderstore | 3 | 9 | 1-5 of 5 results |
| my-winter-car | My Winter Car Mods · Thunderstore | 3 | 6 | No results |
| mycopunk | Mycopunk Mods · Thunderstore | 3 | 14 | 1-20 of 162 results |
| nasb | Nickelodeon All-Star Brawl Mods · Thunderstore | 1 | 6 | 1-20 of 268 results |
| necropolis | Necropolis Mods · Thunderstore | 3 | 6 | 1-20 of 21 results |
| nine-sols | Nine Sols Mods · Thunderstore | 3 | 6 | 1-20 of 92 results |
| nivalis-nights | Nivalis Nights Mods · Thunderstore | 3 | 7 | 1-11 of 11 results |
| northstar | Titanfall 2: Northstar Mods · Thunderstore | 1 | 10 | 1-20 of 2126 results |
| nuclear-option | Nuclear Option Mods · Thunderstore | 3 | 6 | 1-10 of 10 results |
| nucleares | Nucleares Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| odd-remedy | Odd Remedy Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| offscreen | Offscreen Mods · Thunderstore | 3 | 7 | 1-3 of 3 results |
| old-market-simulator | Old Market Simulator Mods · Thunderstore | 3 | 6 | 1-20 of 76 results |
| on-together | On-Together: Virtual Co-Working Mods · Thunderstore | 3 | 6 | 1-20 of 72 results |
| ostranauts | Ostranauts Mods · Thunderstore | 3 | 6 | 1-12 of 12 results |
| outward | Outward Mods · Thunderstore | 1 | 11 | 1-20 of 443 results |
| over-the-hill | Over the Hill Mods · Thunderstore | 3 | 7 | 1 of 1 result |
| pac-man-world-re-pac | PAC-MAN WORLD Re-PAC Mods · Thunderstore | 3 | 6 | 1-5 of 5 results |
| painting-vr | Painting VR Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| pair-a-dice | Pair A Dice Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| palworld | Palworld Mods · Thunderstore | 3 | 6 | 1-17 of 17 results |
| panicore | Panicore Mods · Thunderstore | 3 | 6 | 1-12 of 12 results |
| paper-animal-adventure | Paper Animal Adventure Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| papers-please | Papers, Please Mods · Thunderstore | 3 | 7 | 1-2 of 2 results |
| paquerette-down-the-bunburrows | Paquerette Down the Bunburrows Mods · Thunderstore | 3 | 6 | 1-6 of 6 results |
| paradiddle | Paradiddle Mods · Thunderstore | 3 | 6 | 1-7 of 7 results |
| paralives | Paralives Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| patapon-1-2-replay | PATAPON 1+2 REPLAY Mods · Thunderstore | 3 | 11 | 1-20 of 24 results |
| patch-quest | Patch Quest Mods · Thunderstore | 3 | 6 | 1-7 of 7 results |
| peak | PEAK Mods · Thunderstore | 5 | 23 | 1-20 of 1434 results |
| peaks-of-yore | Peaks of Yore Mods · Thunderstore | 3 | 6 | 1-6 of 6 results |
| peglin | Peglin Mods · Thunderstore | 1 | 0 | 1-20 of 45 results |
| pigface | PIGFACE Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| pikuniku | Pikuniku Mods · Thunderstore | 3 | 6 | 1-5 of 5 results |
| pit-of-goblin | Pit of Goblin Mods · Thunderstore | 3 | 6 | 1-10 of 10 results |
| plasma | Plasma Mods · Thunderstore | 3 | 9 | 1-8 of 8 results |
| potion-craft | Potion Craft Mods · Thunderstore | 1 | 0 | 1-18 of 18 results |
| project-arrhythmia | Afterbeat Mods · Thunderstore | 3 | 6 | 1-9 of 9 results |
| project-gorgon | Project Gorgon Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| pulsar-lost-colony | Pulsar: Lost Colony Mods · Thunderstore | 3 | 6 | 1-5 of 5 results |
| pummel-party | Pummel Party Mods · Thunderstore | 3 | 7 | 1 of 1 result |
| pushing-it-together-sisyphus | Pushing it! Together - Sisyphus Co-op Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| puttler | Puttler Mods · Thunderstore | 3 | 6 | 1-5 of 5 results |
| r5flowstate | R5Flowstate Mods · Thunderstore | 3 | 15 | 1-19 of 19 results |
| raft | Raft Mods · Thunderstore | 3 | 7 | 1-3 of 3 results |
| random-access-mayhem | RAM: Random Access Mayhem Mods · Thunderstore | 3 | 6 | 1-10 of 10 results |
| ravenfield | Ravenfield Mods · Thunderstore | 3 | 7 | 1-13 of 13 results |
| re-legend | Re:Legend Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| receiver-2 | Receiver 2 Mods · Thunderstore | 3 | 11 | 1-20 of 47 results |
| repo | R.E.P.O. Mods · Thunderstore | 3 | 18 | 1-20 of 3658 results |
| reskate | ReSkate Mods · Thunderstore | 3 | 14 | 1-20 of 5352 results |
| resonite | Resonite Mods · Thunderstore | 3 | 20 | 1-20 of 137 results |
| return-from-core | Return From Core Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| return-of-the-obra-dinn | Return of the Obra Dinn Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| rhythm-doctor | Rhythm Doctor Mods · Thunderstore | 3 | 6 | 1-5 of 5 results |
| risk-of-rain-returns | Risk of Rain Returns Mods · Thunderstore | 3 | 22 | 1-20 of 187 results |
| riskofrain2 | Risk of Rain 2 Mods · Thunderstore | 4 | 24 | 1-20 of 3572 results |
| roadside-research | Roadside Research Mods · Thunderstore | 3 | 6 | 1-20 of 22 results |
| rogue-genesia | Rogue: Genesia Mods · Thunderstore | 3 | 7 | 1-11 of 11 results |
| rogue-tower | Rogue Tower Mods · Thunderstore | 1 | 0 | 1-20 of 33 results |
| romestead | Romestead Mods · Thunderstore | 3 | 7 | 1-20 of 22 results |
| rounds | ROUNDS Mods · Thunderstore | 5 | 10 | 1-20 of 830 results |
| rumble | RUMBLE Mods · Thunderstore | 3 | 7 | 1-20 of 130 results |
| rv-there-yet | RV There Yet? Mods · Thunderstore | 3 | 6 | 1-10 of 10 results |
| sailwind | Sailwind Mods · Thunderstore | 3 | 6 | 1-20 of 86 results |
| scam-with-your-friends | Scam With Your Friends Mods · Thunderstore | 3 | 7 | 1-5 of 5 results |
| schedule-i | Schedule I Mods · Thunderstore | 5 | 8 | 1-20 of 232 results |
| scrap-mechanic | Scrap Mechanic Mods · Thunderstore | 3 | 7 | 1-5 of 5 results |
| screw-drivers | Screw Drivers Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| shadows-of-doubt | Shadows of Doubt Mods · Thunderstore | 3 | 13 | 1-20 of 170 results |
| shadows-over-loathing | Shadows Over Loathing Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| shapez-2 | Shapez 2 Mods · Thunderstore | 3 | 6 | 1-14 of 14 results |
| shift-at-midnight | Shift At Midnight Mods · Thunderstore | 3 | 6 | 1-20 of 22 results |
| ship-of-harkinian | Ship of Harkinian Mods · Thunderstore | 3 | 6 | No results |
| side-effects | SIDE EFFECTS Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| sineus-arena-survivors | Sineus Arena Survivors Mods · Thunderstore | 3 | 6 | 1-7 of 7 results |
| skul-the-hero-slayer | Skul: The Hero Slayer Mods · Thunderstore | 3 | 6 | 1-20 of 50 results |
| slashers-keep | Slasher's Keep Mods · Thunderstore | 3 | 6 | 1-2 of 2 results |
| sledding-game | Sledding Game Mods · Thunderstore | 3 | 6 | 1-20 of 22 results |
| slip-skid | Slip & Skid Mods · Thunderstore | 3 | 6 | 1-20 of 32 results |
| slipstream-rogue-space | Slipstream: Rogue Space Mods · Thunderstore | 3 | 6 | 1-11 of 11 results |
| smash-64-recompiled | Smash 64 Recompiled Mods · Thunderstore | 3 | 7 | 1-2 of 2 results |
| smushi-come-home | Smushi Come Home Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| socom-legacy | SOCOM Legacy Mods · Thunderstore | 8 | 20 | No results |
| songs-of-conquest | Songs of Conquest Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| sons-of-the-forest | Sons Of The Forest Mods · Thunderstore | 3 | 7 | 1-20 of 86 results |
| soulcalibur-vi | SOULCALIBUR VI Mods · Thunderstore | 3 | 6 | 1-5 of 5 results |
| soulstone-survivors | Soulstone Survivors Mods · Thunderstore | 3 | 7 | 1-3 of 3 results |
| space-cat-digger | Space Cat Digger Mods · Thunderstore | 3 | 7 | 1-20 of 53 results |
| spaghetti-kart | Spaghetti Kart Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| stacklands | Stacklands Mods · Thunderstore | 3 | 7 | 1-20 of 27 results |
| starfox-64-recompiled | Starfox 64: Recompiled Mods · Thunderstore | 3 | 6 | 1-9 of 9 results |
| starsand | Starsand Mods · Thunderstore | 1 | 0 | 1-20 of 21 results |
| starship | Starship Mods · Thunderstore | 3 | 6 | 1 of 1 result |
| stick-fight-the-game | Stick Fight: The Game Mods · Thunderstore | 3 | 7 | 1-20 of 35 results |
| stolen-realm | Stolen Realm Mods · Thunderstore | 3 | 6 | 1-20 of 31 results |
| stonewards | Stonewards Mods · Thunderstore | 3 | 6 | 1-20 of 40 results |
| straftat | STRAFTAT Mods · Thunderstore | 4 | 9 | 1-20 of 90 results |
| subnautica-below-zero | Subnautica: Below Zero Mods · Thunderstore | 3 | 1 | 1-20 of 57 results |
| subnautica | Subnautica Mods · Thunderstore | 3 | 1 | 1-20 of 71 results |
| subterranauts | Subterranauts Mods · Thunderstore | 3 | 6 | 1-19 of 19 results |
| subterror | Subterror Mods · Thunderstore | 3 | 6 | 1-5 of 5 results |
| sulfur | SULFUR Mods · Thunderstore | 3 | 6 | 1-20 of 44 results |
| sun-haven | Sun Haven Mods · Thunderstore | 3 | 6 | 1-20 of 31 results |
| sunkenland | Sunkenland Mods · Thunderstore | 3 | 6 | 1-20 of 22 results |
| super-battle-golf | Super Battle Golf Mods · Thunderstore | 3 | 14 | 1-20 of 87 results |
| super-fantasy-kingdom | Super Fantasy Kingdom Mods · Thunderstore | 3 | 6 | 1-20 of 23 results |
| super-psycho-baseball | Super Psycho Baseball Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| superhot-mind-control-delete | SUPERHOT: MIND CONTROL DELETE Mods · Thunderstore | 3 | 6 | 1-6 of 6 results |
| superhot-vr | SUPERHOT VR Mods · Thunderstore | 3 | 7 | 1-3 of 3 results |
| superhot | SUPERHOT Mods · Thunderstore | 3 | 6 | 1-11 of 11 results |
| supermarket-together | Supermarket Together Mods · Thunderstore | 3 | 6 | 1-20 of 47 results |
| survival-fountain-of-youth | Survival: Fountain of Youth Mods · Thunderstore | 3 | 7 | 1-2 of 2 results |
| sushiamo | Sushiamo Mods · Thunderstore | 3 | 7 | 1-2 of 2 results |
| talespire | TaleSpire Mods · Thunderstore | 1 | 11 | 1-20 of 433 results |
| tank-team | Tank Team Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| tcg-card-shop-simulator | TCG Card Shop Simulator Mods · Thunderstore | 12 | 27 | 1-20 of 24 results |
| techtonica | Techtonica Mods · Thunderstore | 3 | 6 | 1-20 of 98 results |
| the-alto-collection | The Alto Collection Mods · Thunderstore | 3 | 7 | 1 of 1 result |
| the-choicer-voicer | The Choicer Voicer Mods · Thunderstore | 3 | 6 | No results |
| the-farmer-was-replaced | The Farmer Was Replaced Mods · Thunderstore | 3 | 6 | 1-8 of 8 results |
| the-lab | The Lab Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| the-message-from-deep-space | The Message from Deep Space Mods · Thunderstore | 3 | 7 | 1-5 of 5 results |
| the-planet-crafter | The Planet Crafter Mods · Thunderstore | 3 | 6 | 1-13 of 13 results |
| the-sexy-brutale | The Sexy Brutale Mods · Thunderstore | 3 | 7 | 1-2 of 2 results |
| the-spell-brigade | The Spell Brigade Mods · Thunderstore | 3 | 6 | 1-20 of 27 results |
| thronefall | Thronefall Mods · Thunderstore | 3 | 6 | 1-9 of 9 results |
| timberborn | Timberborn Mods · Thunderstore | 4 | 5 | 1-20 of 26 results |
| tiny-rogues | Tiny Rogues Mods · Thunderstore | 3 | 7 | 1-2 of 2 results |
| tiny-terrys-turbo-trip | Tiny Terry's Turbo Trip Mods · Thunderstore | 3 | 7 | 1-3 of 3 results |
| totally-accurate-battle-simulator | Totally Accurate Battle Simulator Mods · Thunderstore | 4 | 12 | 1-20 of 221 results |
| touhou-lost-branch-of-legend | Touhou: Lost Branch of Legend Mods · Thunderstore | 3 | 21 | 1-20 of 80 results |
| trash-day | Trash Day Mods · Thunderstore | 3 | 7 | 1-4 of 4 results |
| trombone-champ | Trombone Champ Mods · Thunderstore | 3 | 6 | 1-20 of 67 results |
| tunguska-the-visitation | Tunguska: The Visitation Mods · Thunderstore | 3 | 7 | 1-2 of 2 results |
| ultimate-chicken-horse | Ultimate Chicken Horse Mods · Thunderstore | 3 | 7 | 1-20 of 41 results |
| ultrakill | ULTRAKILL Mods · Thunderstore | 5 | 14 | 1-20 of 729 results |
| unfair-flips | Unfair Flips Mods · Thunderstore | 3 | 6 | 1-8 of 8 results |
| v-rising | V Rising Mods · Thunderstore | 3 | 7 | 1-20 of 283 results |
| valheim | Valheim Mods · Thunderstore | 4 | 27 | 1-20 of 6287 results |
| vampire-crawlers | Vampire Crawlers Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| vellum | Vellum Mods · Thunderstore | 3 | 6 | 1-19 of 19 results |
| vertigo-2 | Vertigo 2 Mods · Thunderstore | 3 | 6 | 1-5 of 5 results |
| very-very-valet | Very Very Valet Mods · Thunderstore | 3 | 6 | 1-7 of 7 results |
| vigil | Vigil Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| viva-pinata-trouble-in-paradise-recompiled | Viva Piñata: Trouble in Paradise Recompiled Mods · Thunderstore | 3 | 6 | 1-4 of 4 results |
| voices-of-the-void | Voices of the Void Mods · Thunderstore | 3 | 15 | 1-20 of 187 results |
| void-crew | Void Crew Mods · Thunderstore | 3 | 16 | 1-20 of 85 results |
| voodoo-fishin | Voodoo Fishin' Mods · Thunderstore | 3 | 6 | 1-10 of 10 results |
| vtol-vr | VTOL VR Mods · Thunderstore | 1 | 0 | 1-3 of 3 results |
| wanderburg | Wanderburg Mods · Thunderstore | 3 | 7 | 1-2 of 2 results |
| waterpark-simulator | Waterpark Simulator Mods · Thunderstore | 3 | 6 | 1-6 of 6 results |
| we-love-katamari-reroll-royal-reverie | We Love Katamari REROLL+ Royal Reverie Mods · Thunderstore | 3 | 6 | 1-3 of 3 results |
| webfishing | WEBFISHING Mods · Thunderstore | 3 | 11 | 1-20 of 387 results |
| west-of-loathing | West of Loathing Mods · Thunderstore | 3 | 6 | 1-5 of 5 results |
| whisper-of-the-house | Whisper of the House Mods · Thunderstore | 3 | 7 | 1-3 of 3 results |
| white-knuckle | White Knuckle Mods · Thunderstore | 3 | 19 | 1-20 of 258 results |
| wildfrost | Wildfrost Mods · Thunderstore | 3 | 6 | 1-7 of 7 results |
| windrose | Windrose Mods · Thunderstore | 3 | 26 | 1-9 of 9 results |
| wizard-of-legend | Wizard of Legend Mods · Thunderstore | 1 | 0 | 1-20 of 27 results |
| wizard-with-a-gun | Wizard with a Gun Mods · Thunderstore | 3 | 6 | 1-17 of 17 results |
| wobbly-life | Wobbly Life Mods · Thunderstore | 3 | 6 | 1-11 of 11 results |
| word-play | Word Play Mods · Thunderstore | 3 | 6 | 1-11 of 11 results |
| wrestling-empire | Wrestling Empire Mods · Thunderstore | 3 | 15 | 1-20 of 44 results |
| yapyap | YAPYAP Mods · Thunderstore | 3 | 14 | 1-20 of 87 results |
| zelda-64-recompiled | Zelda 64: Recompiled Mods · Thunderstore | 3 | 6 | 1-20 of 188 results |
| zort | Zort Mods · Thunderstore | 3 | 6 | 1-14 of 14 results |

## 8. 未完成项 / 边界（明确留口）

1. `Mods (excluding AI)` / `Mods (including AI)` 只在 4 个社区出现（gtfo / lethal-company / riskofrain2 /
   ultrakill，按原始提取 JSON 复算），线上 wording 已核对；其余社区的 section uuid 由服务端下发，未逐条核对语义。
2. 9 个社区（for-the-king / green-hell-vr / mechanica / peglin / potion-craft / rogue-tower / starsand /
   vtol-vr / wizard-of-legend）**没有分类区块**，HTML 里没有 `Categories` 容器，只有分区可翻。
3. 7 个社区当时 `No results`（banjo-kazooie-nuts-and-bolts-recompiled / mega-man-64-recompiled / mewgenics /
   my-winter-car / ship-of-harkinian / socom-legacy / the-choicer-voicer），列表区没有卡片徽标可抽样，
   仅验证侧栏。
4. 上传页（`/package/create/`）的分类选择器按所选社区动态拉取**同一份**分类，词表已在 v1.0.6 覆盖；
   本轮未登录，未重新取证。
5. 分区/分类的**服务端 uuid** 未写入词库：译文按文案匹配，uuid 变化不影响。
6. 服务端下发但社区页 SSR 里不出现的分类（只能通过 API/上传页选择器看到）不在本清单内；本轮口径是
   「社区页上真实渲染出来的固定枚举」，与 v1.0.6 的上传页词表互补。
