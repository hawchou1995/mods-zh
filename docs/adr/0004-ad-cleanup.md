# 0004 · 广告净化与检测兼容独立成模块，且必须可逆

## 状态

已采纳（v1.0.8）

## 背景

用户要求：关闭 Thunderstore 与 Nexus 的广告，关闭反拦截检测；同时修好「拦截广告后站点出现的
额外等待 / 入口禁用 / 速度降级」。约束是不能影响汉化、不能伪造 Premium、不能阻断登录与下载。

现有架构只有「汉化」一个开关：`State.enabled`（GM key `modsZh.enabled`），
`setEnabled(false)` 会还原全部译文。如果把广告/检测逻辑塞进同一个开关，用户关汉化就会顺带
打开广告或恢复检测，反之亦然。

## 决策

1. **三个开关互相独立、各自持久化**：
   `modsZh.enabled`（汉化）、`modsZh.cleanup`（广告净化）、`modsZh.detectCompat`（检测兼容）。
   任何一条路径都不得互相替代。
2. **新增 `src/cleanup.js`**，只依赖 DOM 与 GM_getValue/setValue，不引入框架；
   通过 `bootstrap.js` 的稳定菜单槽位（每项只注册一次）对外暴露，调试出口挂在 `__MODS_ZH__`。
3. **广告净化**只做两件事：注入自有 `<style id="mods-zh-cleanup">`、给命中的广告/促销节点打
   `data-modszh-cleanup` 标记。**不删除节点**（React 会重建），关闭时移除样式表并按记录还原属性。
   Nexus 侧覆盖广告槽位、`#nonPremiumBanner` / `#freeTrialBanner` / `#adBlockingBanner` 与新前端促销文本容器；
   落在站点 `hardUgc` 里的同款容器不隐藏。
4. **检测兼容沿真实 writer 处理，而不是只改全局变量**。旧文件页的检测函数每次加载随机命名，
   因此按**源码形态**识别（`window.blockingAds` 赋值 + `Cookies.get('ab')` + `Cookies.set('ab')` 三条同时命中），
   再用可逆 wrapper 把检测参数固定为 `false` 后调用原函数：expiry、`NexusConsent` 门禁与写入分支都沿用原逻辑。
   只改 `window.blockingAds` 的 getter 无效——writer 的局部参数 `blocking`/`isBlocked` 仍是 true，会写 `ab=1`。
   由此写入的是 `ab=0|<exp>`；站点自己的 `areAdsBlocked()` 一并改为恒 false（可逆）。
5. **随机 probe 不动**：`/api/scripts/adsservice.js` 的 `window.<token> = true` 只证明脚本执行成功，
   不构成「判定为拦截」的证据。本模块**不设置、不删除、不改写**任何 token；
   `adShieldActive`（灰度总开关）与新前端 React context 的 `adsBlockedByUser` 同样不在改写范围。
6. **realm 与范围**：需要页面 window 时走 `unsafeWindow`（新增 `@grant unsafeWindow`），
   直连页面 window 要求 `document.defaultView === window`；只有已注册的站点才运行，未匹配站点直接报
   `unsupported` 且不写任何全局。
7. **可逆与失败**：关闭时还原 writer、`areAdsBlocked` 描述符，并按站点自己的 `Cookies` 接口把
   `ab` 写回开启前读到的值（只读这一个非凭据键，不解析 `document.cookie`）；
   已发出的请求与已渲染档位需要刷新，状态返回 `needsReload: true`。
   识别为有界时序（约 20 s 内轮询 + DOMContentLoaded/load 各一次），关闭即停；不用无限 Observer。
   `pagehide` 清理，`pageshow(persisted)` 按当前开关重建。

## 代价

- 多一个 `@grant unsafeWindow`：部分管理器会在首次安装时提示；不加则检测兼容恒为 `unsupported`。
- 检测兼容依赖站点保持 `Cookies.get('ab')` / `Cookies.set('ab')` 的源码形态；站点改版后识别会落空并报
  `unsupported/pending`（不猜测、不强改）。
- 广告规则必须逐条有取证来源，新增站点需要先采集 DOM 再写规则；无来源的规则（如 `#adBanner`）
  一律不写。
- 检测兼容不覆盖新前端的 React context `adsBlockedByUser`，也不承诺下载速度恢复：
  只有一组 200 对照（`reduced` → `standard`），后续对照被 403，真实大流量速度未验证；
  `download-url` 两种状态都是站点占位符，有效 CDN 下载来自既有第三方扩展。
