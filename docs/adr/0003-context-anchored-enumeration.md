# 0003 · 固定枚举按「容器 + 标题锚点」装配，不做全局替换

## 状态

已采纳（v1.0.7）

## 背景

Thunderstore 社区页（`/c/<社区>/`）的筛选器由三个 `<details>` 组成：

```html
<details><summary class="…collapsible__header">Sections</summary>     …单选组…
<details><summary class="…collapsible__header">Categories</summary>   …勾选组…
<details><summary class="…collapsible__header">Other filters</summary> …Deprecated / NSFW…
```

三者**共用同一层容器选择器**，只有 `<summary>` 标题不同。而服务端把「分区」与「分类」放在**同一张
枚举表**里：同一个名字在不同社区可能当分区、也可能当分类（`Developer Tools` 在 GTFO 同时出现在
两处；`Maps`、`Gameplay`、`Asset Replacements`、`Translations`、`Mods` 同样）。卡片徽标
（`<a class="tag" href="…?includedCategories=<id>">`）用的又是分类名。

如果把这些名字写进全局 `dict`，就会翻到 mod 标题、作者名、描述里的同串（`Libraries` 既是分类名，
也常是 mod 名），违反「只翻界面」的总原则。

## 决策

`site.scoped` 规则新增两个可选字段：

1. **`include`（标题锚点）**：`closest(rule.selector)` 命中的容器内，必须存在一个 `summary` /
   `[aria-label]` / 标题元素，其文本（或本脚本记录过的原文）与 `include` 完全一致，规则才生效。
   锚点对照当前文本 **和** `State.originals` 里的原文，因为标题本身也会被翻译（`Sections → 分区`）。
2. **结构性锚点**：`CardPackageTags` 这类容器没有可见标题，用 `STRUCTURAL_INCLUDE` 里的函数判定
   （卡片标签容器里必须有 `a[href*="includedCategories="]`）。

配合两条引擎行为：

- `translateTextNode()` 先查 scoped 规则、再查全局词库（上下文优先），否则全局 `Cards → 卡片`
  会抢在分类规则 `Cards → 卡牌` 之前命中；
- scoped 规则允许「译文 = 原文」的显式同值键（`BepInEx`、`DataBlocks (MTFO)`、`Developer Tools`），
  这类键在容器里命中后原样保留，并且不再走全局词库。

四条规则的 `dict` 指向**同一个冻结对象**（`const TS_ENUM_ZH`），因此不存在「同一枚举两套译法」的可能，
只由 `include` 决定在哪一类容器里生效。

## 后果

- 全社区固定枚举合并成**一个** `const TS_ENUM_ZH = Object.freeze({…})`（398 条 = 分区 55 + 分类 370 +
  分组标题 4：`Sections` / `Categories` / `Other filters` / `Filters`；`Deprecated` / `NSFW` 同时留在 v1.0.6 的
  community 组），`scoped` 的四条规则都写 `dict: TS_ENUM_ZH`，不复制内容。
  `test/thunderstore-enums.test.mjs` 用 `assert.strictEqual(r.dict, rules[0].dict)` 锁住「同一对象」，
  `tools/coverage.mjs --scoped N` 仍可按规则分组体检。
- 新增一处 DOM 依赖：`<summary>` 标题文案。站点改标题会同时漏翻标题与整组枚举，由
  `test/thunderstore-enums.test.mjs` 的真实 SSR 侧栏用例兜底。
- 规则数量增长靠 `include` 而不是新选择器，避免 `:nth-child` 这类位置耦合。
