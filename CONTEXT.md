# 术语表

本项目的领域语言。只收概念，不收实现细节。

**词条（entry）** —— 一条 `英文原文 → 中文译文` 映射。原文必须是站点 DOM 里真实出现过的完整文本，取自 `docs/evidence/` 的快照。

**页型（page）** —— 站点内部的界面类别，由 URL 判定。Thunderstore 有 `home` / `communities` / `community` / `author` / `package` / `upload`；Nexus Mods 有 `home` / `games` / `game` / `browse` / `mod` / `collection` / `media` / `news` / `forums` / `support` / `account`。词条按页型分组，另外有一组 `global` 全站生效。

**界面元素（UI element）** —— 站点提供的、与内容无关的文案：导航、按钮、筛选器、分类枚举、语言枚举、排序项、统计标签、面包屑、提示语。

**UGC（user generated content）** —— 站点用户生产的内容：模组名称、包名、作者名、上传者名、模组描述正文、变更日志、评论、帖子、文件名。

**忽略区域（ignore region）** —— DOM 子树，命中即整棵跳过。每个站点一组选择器，用于把 UGC 圈出来。

**正则组（pattern）** —— 无法用固定文本表达的词条：结果计数（`1-20 of 19588 results`）、相对时间（`4 weeks ago`）、日期（`20 Oct 2026` / `06 September 2026, 6:22AM`）、带数字的状态标签（`Required (0)`、`Go to page 2`）。

**覆盖率（coverage）** —— 取证快照里被词条与正则命中的行数占比。口径与运行期一致，未命中即失败。

**幂等扫描（idempotent scan）** —— 译文本身不会再命中词条，因此重复扫描同一段 DOM 不产生新写入，MutationObserver 不会被自身写入喂成死循环。

**固定枚举（enumerated UI）** —— 站点服务端下发的、跨社区共享的界面值：Thunderstore 的分区（Sections）、
分类（Categories）、其他筛选（Deprecated / NSFW）。与 UGC 同名时（`Developer Tools` 既是分区也是分类，
`Libraries` 既是分类也常是 mod 名）必须靠 DOM 上下文区分，不能进全局字典。

**标题锚点（include）** —— `site.scoped` 规则的额外判定：容器选择器命中后，容器内还要存在文本等于
`include` 的标题元素（`<summary>Sections</summary>`）规则才生效。用来在同一层 `<details>` 里隔离
「分区」与「分类」两组枚举，见 `docs/adr/0003-context-anchored-enumeration.md`。

**共享枚举表（shared table）** —— Thunderstore 的四条 `scoped` 规则都写 `dict: TS_ENUM_ZH`，指向同一个
`Object.freeze` 对象（398 条）；测试断言 `r.dict === rules[0].dict`，防止哪一天有人又复制一份。
