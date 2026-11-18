# 广告净化与反拦截检测证据（2026-11-18）

采集：用户已登录的浏览器标签，只读 HAR（`nexus-adblock-inspection-20261118.json`，仅保留在本地
scratch，不随仓库分发）。本文只保留选择器、脚本原文与判定，不含签名 URL、cookie、账号信息。

## 1. Nexus 旧文件页 `/<game>/mods/<id>?tab=files`

| 项目 | 取值 | 说明 |
|---|---|---|
| 广告槽位容器 | `.ads-holder.ads-top` / `.ads-holder.ads-bottom` | 站点 CSS 当前 `display:none`、高度 0 |
| 槽位 id | `#billboard_top` `#video_top` `#vertical_sticky_left` `#vertical_sticky_right` `#billboard_bottom` `#mpu_bottom` `#mobile_mpu_bottom` | 由站点广告脚本填充 |
| 已移除的无来源规则 | `#adBanner` | 本轮未取得实证容器，v1.0.8 不写该规则 |
| 反拦截提示 | `#adBlockingBanner` | 文案写 1.5MB/s |
| 会员促销条 | `#nonPremiumBanner` / `#freeTrialBanner` | 3 MB/s / Try Premium free + CTA |
| 下载元素 | `mod-file-download[download-speed="reduced"]` | 同页另有 `download-url="#ERROR-download-location-not-found"` |

### 1.1 页面 inline 检测脚本（原文节选，cookie 分支省略）

```js
window.blockingAds = false;
function <随机名>(blocking = false) {
    window.blockingAds = blocking;          // 真实写入口
    // ... 另外写 Cookies 'ab'
}
function areAdsBlocked(){ return window.blockingAds; }
```

结论：旧站真实读取链路是 `window.blockingAds` 与 `areAdsBlocked()`（后者读前者）。
脚本名每次加载随机，所以只能按「函数体内读 window.blockingAds」的语义定位，不能写死名字。

### 1.2 AdShield 实验开关（不属于检测）

```js
window.adShieldActive = false && isAllowedCountry && existingBucketId !== undefined && isInRollout(existingBucketId);
```

`adShieldActive` 是 AdShield 灰度桶判定的总开关，**不是**广告拦截检测结果，v1.0.8 不改写。

## 2. 新前端广告脚本

| 资源 | 原文 | 结论 |
|---|---|---|
| `/api/scripts/adsservice.js` | `window.eSTdHLCPsMFO = true;` | 探针：检测命中时把同名全局置 **true** |
| `advert6.js` / `adword.js` | 建 `div#<同一 token>`、`display:none`、挂到 body/documentElement | 只建节点，不写全局 |
| `_next` chunk `AdProvider` | `let [s,l]=useState(!1) … (function(){ e||window.eSTdHLCPsMFO||t(!0) })()` | 读取窗口上同名布尔：存在即「检测到拦截」 |
| `_next` chunk `AdProvider` context | `adsBlockedByUser` 是 React context 的 state | **不在 window 上**，v1.0.8 不创建也不改写同名全局 |

token 每次加载随机；处理方式是「window[token] === true 时才视为已执行」，改写为 `undefined`
（= 未执行语义），关闭时按原描述符写回 `true`。没有正向证据的「隐藏 div + 同名布尔」组合
不做猜测性改写（例如 div 已挂但布尔尚未赋值时不动）。

## 3. Thunderstore

| 选择器 | 来源 | 说明 |
|---|---|---|
| `#nimbus-v2-floating-video` / `.layout__floating-video-anchor` | `/c/gtfo/` 实机 | 悬浮视频广告位，inline 300×169，唯一仍可见的广告单元 |
| `.ad-container[data-cid^="nimbus-v2-"]` | 同页 | NitroPay 广告位（React 渲染，禁止删除节点） |
| `.layout__ads-stack` | 同页 | 侧栏广告堆栈 |
| `.ad-container__fallback` | 服务端渲染在容器内 | 「请为广告放行」兜底文案 |

Thunderstore 侧未取得广告拦截检测脚本证据，因此**没有**检测兼容规则。

## 4. 下载档位对照（独立验证，2026-11-18 后续）

同账号、同文件（id 74231）、同入口 `?tab=files&file_id=74231` 的一组 SSR 对照：

| 条件 | HTTP | `download-url` | `download-speed` |
|---|---|---|---|
| `ab` 不存在 | 200 | `#ERROR-download-location-not-found` | `reduced` |
| `ab=0|<exp>`（值为 `0|<秒级时间戳>`） | 200 | `#ERROR-download-location-not-found` | `standard` |

- 之后 3 次对照（ab=0 / 无 ab / ab=1）全部 **HTTP 403**（约 6.3 KB 响应），属请求频率/风控限制，
  未复现 200 → **只有一组观测**，不能当作稳定复现。
- 两种状态下 `download-url` 都是服务器模板产出的占位符；组件 `mod-file-download` 只把属性原样读出来，
  未见同源「链接生成」接口。本次观察到的有效 CDN 请求由既有第三方扩展发起（initiator 为扩展脚本），
  **不是**本脚本或页面原生流程产生。
- 唯一一次真实字节样本：`Range: bytes=0-1023` → HTTP 206，`content-range: bytes 0-1023/582311`，
  1024 B / 612 ms，文件仅 568 KB。**不能代表任何档位速度**，不算测速成功。

## 5. 未知项（不作绝对结论）

- `ab` 是否 httpOnly：站点自己的 `Cookies.set('ab', …)` 能被 JS 调用，说明写入侧不依赖 httpOnly；
  但对读取/服务端可见性的具体机制本次未验证，不作断言。
- 站点是否存在其它（含未公开）的链接生成入口：本次只核对了本页加载的组件与脚本，不能推断「不存在任何 API」。
- 服务端是否在 CDN 侧按 `ab` 限速：未验证（URL 鉴权字段与本脚本无关，未做对比测速）。

## 6. 明确未验证 / 不做

- **大流量速度对照未完成**：无 ≥8 MiB 有效样本，不承诺「解除限速」「恢复 3MB/s」等结果。
- 本模块不修改 `download-url`、不修改 DOM 上的 `download-speed`，不做任何「看起来很成功」的显示。
