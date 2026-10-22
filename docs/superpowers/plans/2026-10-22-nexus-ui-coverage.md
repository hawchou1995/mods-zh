# Nexus UI Coverage Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to execute this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Nexus Mods Simplified Chinese coverage across audited first-party UI routes while preserving all game/mod/user-generated names and content.

**Architecture:** Keep the existing exact-string dictionary and site-level anchored patterns. Extend `nexus.detect()` with explicit route groups, share stable navigation/footer strings in `global`, add route-specific dictionaries for new page groups, and protect forum/topic UGC with observed DOM selectors. Add raw-source evidence and regression fixtures without changing the localization engine's matching model.

**Tech Stack:** JavaScript ES modules, Node.js >=18, jsdom 29, existing custom smoke DOM, existing `npm run verify` pipeline.

## Global Constraints

- Do not translate game names, mod names, collection titles, author/user names, mod or forum descriptions, news headlines/body, comments/posts/logs, filenames, or user-entered values.
- Do not add unanchored substring replacement, automatic translation, or word-fragment fallback.
- Dynamic count/date patterns must be fully anchored and preserve captured digits, versions, and names.
- Translate text nodes and the existing attribute allowlist: `placeholder`, `aria-label`, `title`.
- Keep third-party destinations outside translation scope; do not submit forms or change account/site preferences.
- Do not bump the release version or publish/push in this implementation pass.

## File Map

- Modify `src/locals/nexus.js`: Nexus host/path classification, shared UI entries, route-specific dictionaries, anchored patterns, and forum UGC ignore selectors.
- Modify `test/smoke.test.mjs`: route classification, canonical dictionary strings, metadata consistency, and core UGC protection assertions.
- Modify `test/browser.test.mjs`: jsdom fixtures for each audited route family, translated attributes, split dynamic values, toggle restoration, and UGC negative controls.
- Create `docs/evidence/nexus-expanded.txt`: source strings from the 2026-10-22 authenticated bsk audit, grouped by route; omit dynamic user/game/mod names and content.
- Modify `package.json`: include the expanded Nexus evidence file in the `coverage` script.
- Modify `CONTEXT.md`: update the Nexus page-type glossary to include the groups actually supported by `nexus.detect()`.
- Modify `README.md`: update the current mapping and evidence counts after coverage is measured.

---

### Task 1: Add Nexus route groups and route tests

**Files:** `src/locals/nexus.js`, `test/browser.test.mjs`

- [ ] Add failing route assertions for these URLs:

```js
const cases = [
    ['https://www.nexusmods.com/games', 'games'],
    ['https://www.nexusmods.com/games/skyrimspecialedition', 'game'],
    ['https://www.nexusmods.com/games/skyrimspecialedition/mods', 'browse'],
    ['https://www.nexusmods.com/games/skyrimspecialedition/collections', 'collection'],
    ['https://www.nexusmods.com/collections', 'collection'],
    ['https://www.nexusmods.com/games/skyrimspecialedition/images', 'media'],
    ['https://www.nexusmods.com/games/skyrimspecialedition/videos', 'media'],
    ['https://www.nexusmods.com/news', 'news'],
    ['https://forums.nexusmods.com/', 'forums'],
    ['https://help.nexusmods.com/', 'support'],
    ['https://wiki.nexusmods.com/', 'support'],
    ['https://users.nexusmods.com/auth/sign_in', 'account'],
    ['https://www.nexusmods.com/skyrimspecialedition/mods/196306', 'mod'],
];
```

- [ ] Run `npm run build; node test/browser.test.mjs`; confirm the new `games`, `game`, `media`, `news`, and `forums` assertions fail before route implementation.
- [ ] Update `detect(path, host)` in `src/locals/nexus.js` in this order: account/forum/help/wiki host checks, root, mod detail patterns, game-specific browse/collection/media paths, `/games`, game detail, `/collections`, `/news`, existing user pages, fallback `global`.
- [ ] Run `npm run build; node test/browser.test.mjs`; expect all route assertions to pass while legacy mod and browse routes retain their current page IDs.

### Task 2: Complete shared navigation, footer, game-directory, and game-home UI

**Files:** `src/locals/nexus.js`, `test/browser.test.mjs`

- [ ] Add a raw-English fixture containing `Media`, `Community`, `Support`, `Search/`, `Upload`, `Show notifications`, `View messages`, `Unread notifications`, `Open profile menu`, `Open navigation menu`, `Close navigation menu`, `Discover`, `Network stats`, `Support Nexus Mods`, `Try premium for free`, `Statistics`, `Careers`, `About us`, `Premium features`, `Terms of Service`, and `Privacy Policy`.
- [ ] Add exact global translations for the preceding strings, retaining existing uppercase keys and brand terms; add an anchored response-time pattern for `Served in 0.571s` that preserves the captured time.
- [ ] Add `games` and `game` dictionaries for fixed headings and controls, including `All games`, `Game genre`, `Game genre search`, `Search game`, `Vortex Support`, `No. of mods`, `No. of collections`, `Downloads`, `Trending Mods`, `Latest news`, `View all`, `View more`, `Updated`, `Surprise`, and `All time`.
- [ ] Add these fixed game-genre mappings: `Action` → `动作`, `Adventure` → `冒险`, `ARPG` → `动作角色扮演`, `Dungeon crawl` → `地牢探索`, `Fighting` → `格斗`, `FPS` → `第一人称射击`, `Hack and Slash` → `砍杀`, `Horror` → `恐怖`, `Indie` → `独立游戏`, `Metroidvania` → `银河恶魔城`, `MMORPG` → `大型多人在线角色扮演`, `Music` → `音乐`, `Platformer` → `平台跳跃`, `Puzzle` → `解谜`, `Racing` → `赛车`, `Roguelike` → `肉鸽`, `RPG` → `角色扮演`, `Sandbox` → `沙盒`, `Simulation` → `模拟`, `Space sim` → `太空模拟`, `Sports` → `体育`, `Stealth` → `潜行`, `Strategy` → `策略`, `Survival` → `生存`, `Third-Person Shooter` → `第三人称射击`, `Visual Novel` → `视觉小说`, and `VR` → `VR`.
- [ ] Add `^Bookmark (.+)$` only as an anchored label pattern producing `收藏 $1`; assert `Skyrim Special Edition` remains exactly unchanged in the result.
- [ ] Run `npm run build; node test/browser.test.mjs`; assert shared UI strings and genre labels translate, while the game card name and `Bookmark Skyrim Special Edition` suffix remain intact.

### Task 3: Complete mod-browse, collection, and media controls

**Files:** `src/locals/nexus.js`, `test/browser.test.mjs`

- [ ] Add fixtures for the audited control labels `Category`, `Tags`, `Search parameters`, `Language support`, `Content options`, `File size`, `Filter`, `Sort`, `Desc`, `to`, `Game version`, `Badge`, `Included Mods`, `Adult Content`, `Essentials`, `Miscellaneous`, `Themed`, `Official`, `Collection`, and `Wabbajack list`.
- [ ] Add fixed image categories: `Aesthetics` → `美学`, `Combat` → `战斗`, `Funny` → `搞笑`, `Misc` → `杂项`, `Narrative` → `叙事`, and `Poses` → `姿势`.
- [ ] Add fixed video categories: `General` → `综合`, `Personal Showcase` → `个人展示`, `Interview` → `访谈`, `Review` → `评测`, and `Story Driven` → `剧情向`; add `^Screenshot Community Event #(\d+)$` → `截图社区活动 #$1`; reuse `Funny` and `Tutorial` entries only when their translations match exactly.
- [ ] Add the full-anchor count pattern `^([\d,]+) items$` and exact entries for `No. of mods`, `No. of collections`, and `No. of endorsements`; do not match version strings or collection/user content.
- [ ] Test `Show filters`, `Hide filters`, `Filter`, `Sort`, `Desc`, `Previous page`, `Next page`, `Go`, `Page`, `Game version`, `Badge`, and media category labels; assert number-only version values such as `1.6.1170.0` remain unchanged.
- [ ] Run `npm run build; node test/browser.test.mjs` and confirm all fixed controls pass.

### Task 4: Complete news, mod-detail, account, and forum UI with UGC guards

**Files:** `src/locals/nexus.js`, `test/browser.test.mjs`

- [ ] Add news controls `News & Updates`, `Jump`, `All time`, `24 hrs`, `7 days`, `14 days`, `30 days`, `1 year`, `Range...`, `From`, `To`, `Recent`, `Last Comment`, `Asc`, `Desc`, `20 items`, `40 items`, `60 items`, `80 items`, and `Learn more`; leave editorial article headlines and body text unmatched.
- [ ] Add mod-detail controls `Exclusive media content and more`, `File information`, `Credits and distribution permission`, `Author notes`, `File credits`, `Donation Points system`, `See who endorsed this mod`, `Link a new video`, `Tracking`, `Endorse`, and `Vote`; preserve dynamic mod title, author, description, and file names.
- [ ] Add account-form strings `Email or Username`, `Forgot your Password?`, `Need an account?`, `Register here`, and `Sign out`; do not inspect or translate account-specific profile values.
- [ ] Add Help Center strings `Search the knowledge base`, `Policies and Guidelines`, `Frequently Asked Questions`, `Account Settings`, and `Website Features`; leave help article descriptions unchanged. Wiki returned HTTP 403 during the tested request, so add no guessed wiki-page entries.
- [ ] Add forum navigation/control strings `Existing user? Sign In`, `Sign Up`, `Browse`, `Game Communities`, `Forums`, `Online Users`, `Guidelines`, `Staff`, `Search`, `Events`, `Activity`, `Explore`, `Search...`, `Everywhere`, `Topics`, `Members`, `Community Activity`, `Popular Game Communities`, `Active Topics`, `Tell a friend`, `Email`, `Share`, `Contact Us`, and `Cookies`.
- [ ] Add only fixed forum board names observed in the homepage directory: `Site Updates` → `网站更新`, `Projects` → `项目`, `Site Support` → `站点支持`, `Vortex Support` → `Vortex 支持`, `Mod Troubleshooting` → `模组故障排查`, `Mod Ideas` → `模组创意`, `Modding Academy` → `模组制作学院`, `Articles and Guides` → `文章与指南`, `Newbies` → `新人专区`, `General Chat` → `综合聊天`, `Gaming` → `游戏讨论`, `Hardware and software discussion` → `硬件与软件讨论`, `Off-Topic` → `闲聊`, and `Formal Warnings, Bans and Takedowns` → `正式警告、封禁与下架`.
- [ ] Add forum UGC selectors `.ipsType_richText`, `.ipsDataItem_lastPoster`, `.ipsDataItem_lastPoster__title`, and `a.ipsDataItem_title[href*="/topic/"]`; retain `/forum/` links so fixed board names can be translated.
- [ ] Add jsdom forum fixture where `Browse` translates, `Site Updates` with `href="/forum/3-site-updates/"` translates to `网站更新`, same-text `href="/topic/123-site-updates/"` stays unchanged, and `.ipsType_richText` text remains unchanged.
- [ ] Add news/mod negative fixtures: `Cyberpunk Modathon 2026`, `Dwarven Man`, `NexusSiteBot`, `Dwemer Man`, `A simple user description`, and `readme.txt` must stay unchanged.
- [ ] Run `npm run build; node test/browser.test.mjs`; expect all positive and negative checks to pass.

### Task 5: Add evidence snapshots, coverage wiring, and glossary counts

**Files:** `docs/evidence/nexus-expanded.txt`, `package.json`, `CONTEXT.md`, `README.md`

- [ ] Create `docs/evidence/nexus-expanded.txt` with separate headings for `games`, `game`, `browse`, `collection`, `media`, `news`, `mod`, `forums`, `support`, and `account`; include only original static UI text and fixed enum labels, never page-specific names or content.
- [ ] Add `node tools/coverage.mjs nexus docs/evidence/nexus-expanded.txt` to the `coverage` script in `package.json`.
- [ ] Run `npm run coverage --silent`; use the emitted unmatched list to add only evidenced fixed UI entries, then rerun until every retained evidence row is covered.
- [ ] Update the Nexus page-type glossary in `CONTEXT.md` with `games`, `game`, `media`, `news`, `forums`, and `support`, plus existing `home`, `browse`, `mod`, `collection`, and `account`.
- [ ] Update the README mapping totals from the actual registry and coverage output, not hand-estimated values.
- [ ] Run `git diff --check` and confirm evidence contains no dynamic mod title, author handle, forum topic, news headline, filename, or entered value.

### Task 6: Full regression and final residual audit

**Files:** all files changed above

- [ ] Run `npm run verify`; expected outcome is successful build, 0 failing smoke tests, 0 failing jsdom tests, and 100% coverage for each declared snapshot.
- [ ] Run `node --check src/locals/nexus.js; node --check test/smoke.test.mjs; node --check test/browser.test.mjs; git diff --check`.
- [ ] Inspect `git status --short` and `git diff --stat`; confirm the only changes are Nexus localization, related tests/evidence, project glossary, README counts, and coverage wiring.
- [ ] Do not commit or push implementation changes unless requested; report the exact modified paths and any first-party page that could not be read.