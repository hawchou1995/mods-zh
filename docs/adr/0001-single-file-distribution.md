# 0001 · 发布单文件，源码拆分在 src/

## 状态

已采纳（v1.0.0）

## 背景

参考项目 [github-chinese](https://github.com/maboloshi/github-chinese) 走双轨：`main.user.js` 通过 `@require` 从 GitHub raw 拉 `locals.js` 词条库，另有一份 Greasyfork 专用单文件版。它这么做的原因是词条三万行、单文件过大。

本项目词条 337 条，产物约 39KB。

## 决策

仓库里维护 `src/`（引擎、词条、启动分离），用 `build.mjs` 拼成 `dist/mods-zh.user.js` 单文件；Greasyfork 与 GitHub 分发都发这一份产物，不使用 `@require`。

## 理由

- `@require` 让脚本多一个网络依赖：raw.githubusercontent 挂了或墙了，脚本就是一段空代码，用户看到的是「装了但没反应」，比不装更难排查
- Greasyfork 审核会读源码，单文件让审核看到的就是运行时执行的全部内容
- 39KB 远未到需要拆分的体量；拆分的唯一收益是可读性，而 `src/` 已经给了
- CI 校验 `dist/` 与 `src/` 一致（`git diff --exit-code dist/`），产物不会与源码漂移

## 代价

- 每次改词条都要 `npm run build` 并提交产物，仓库多一份生成物
- 用户从 GitHub 直装时拿到的是产物，改词条的人要看 `src/`

若词条规模涨到两三万行（例如同时覆盖多个模组站），这个决策需要重新评估 —— 届时按页型拆分 `@require` 才有意义。
