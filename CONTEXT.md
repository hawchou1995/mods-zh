# 术语表

本项目的领域语言。只收概念，不收实现细节。

**词条（entry）** —— 一条 `英文原文 → 中文译文` 映射。原文必须是站点 DOM 里真实出现过的完整文本，取自 `docs/evidence/` 的快照。

**页型（page）** —— 站点内部的界面类别，由 URL 判定。Thunderstore 有 `home` / `communities` / `community` / `package` / `upload`；Nexus Mods 有 `home` / `games` / `game` / `browse` / `mod` / `collection` / `account`。词条按页型分组，另外有一组 `global` 全站生效。

**界面元素（UI element）** —— 站点提供的、与内容无关的文案：导航、按钮、筛选器、分类枚举、语言枚举、排序项、统计标签、面包屑、提示语。

**UGC（user generated content）** —— 站点用户生产的内容：模组名称、包名、作者名、上传者名、模组描述正文、变更日志、评论、帖子、文件名。

**忽略区域（ignore region）** —— DOM 子树，命中即整棵跳过。每个站点一组选择器，用于把 UGC 圈出来。

**正则组（pattern）** —— 无法用固定文本表达的词条：结果计数（`1-20 of 19588 results`）、相对时间（`4 weeks ago`）、日期（`20 Oct 2026` / `06 September 2026, 6:22AM`）、带数字的状态标签（`Required (0)`、`Go to page 2`）。

**覆盖率（coverage）** —— 取证快照里被词条与正则命中的行数占比。口径与运行期一致，未命中即失败。

**幂等扫描（idempotent scan）** —— 译文本身不会再命中词条，因此重复扫描同一段 DOM 不产生新写入，MutationObserver 不会被自身写入喂成死循环。
