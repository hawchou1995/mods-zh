/* v1.0.7 · Thunderstore 全社区固定枚举回归
 *
 * 数据来源：docs/evidence/thunderstore-communities-2026-11-16.md（当次 371 个社区的
 * SSR 社区页逐个提取，去重后分区 55 条 / 分类 370 条）。本文件由脚本生成，
 * 词条表从同一份证据文档解析，避免测试与词库各写一份互相掩护。
 *
 * 三类断言：
 *   1. 静态装配（vm 里跑 src/locals/*.js，不碰 DOM）：每个枚举键都能由对应 scoped 规则产出译文；
 *   2. 真实 DOM（jsdom + 真实 SSR 侧栏 HTML + 真实 MutationObserver）：分区/分类/卡片徽标中文化，
 *      同名 UGC（mod 标题、作者名、描述、筛选 chip）保持原字节；
 *   3. 交互：动态插入、SPA 切社区、开关逐字还原后再次开启、重复扫描幂等。
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CODE = readFileSync(join(ROOT, 'dist', 'mods-zh.user.js'), 'utf8');

/* 真实 SSR 侧栏（https://thunderstore.io/c/gtfo/ ，2026-11-16 抓取；SVG 保留，其余不动） */
const TS_SECTIONS_GTFO = "<div class=\"package-search package-search--with-sidebar-ad\"><div class=\"package-search__sidebar\"><div class=\"package-search__filters\"><details class=\"collapsible\" open=\"\"><summary class=\"button button--variant--secondary button--size--big button--ghost collapsible__header\">Sections<svg data-prefix=\"fas\" data-icon=\"caret-down\" class=\"svg-inline--fa fa-caret-down  icon icon--inline  \" role=\"img\" viewBox=\"0 0 320 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M140.3 376.8c12.6 10.2 31.1 9.5 42.8-2.2l128-128c9.2-9.2 11.9-22.9 6.9-34.9S301.4 192 288.5 192l-256 0c-12.9 0-24.6 7.8-29.6 19.8S.7 237.5 9.9 246.6l128 128 2.4 2.2z\"></path></svg></summary><div class=\"collapsible__content\"><div role=\"radiogroup\" aria-required=\"false\" dir=\"ltr\" class=\"radio-group\" tabindex=\"-1\" style=\"outline:none\"><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"all\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"all\"/>All</label><div class=\"radio-group__divider\" role=\"presentation\"></div><label class=\"radio-group__label radio-group__label--selected\"><button type=\"button\" role=\"radio\" aria-checked=\"true\" data-state=\"checked\" value=\"01a1bcb5-f7fc-71bd-2ea9-171a774865a5\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-state=\"checked\" data-prefix=\"fas\" data-icon=\"circle-dot\" class=\"svg-inline--fa fa-circle-dot  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zm0-352a96 96 0 1 1 0 192 96 96 0 1 1 0-192z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" checked=\"\" value=\"01a1bcb5-f7fc-71bd-2ea9-171a774865a5\"/>Mods (excluding AI)</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"01a1bcb5-f80c-6821-7f65-1cadaccfebe4\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"01a1bcb5-f80c-6821-7f65-1cadaccfebe4\"/>Mods (including AI)</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"01a1bcb5-f81f-f123-0b31-201918c496e2\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"01a1bcb5-f81f-f123-0b31-201918c496e2\"/>Rundowns</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"01a1bcb5-f838-791e-d34d-ae003a8153d1\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"01a1bcb5-f838-791e-d34d-ae003a8153d1\"/>Modpacks</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"01a1bcb5-f84a-785a-f32a-e987510705cc\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"01a1bcb5-f84a-785a-f32a-e987510705cc\"/>Developer Tools</label></div></div></details><details class=\"collapsible\" open=\"\"><summary class=\"button button--variant--secondary button--size--big button--ghost collapsible__header\">Categories<svg data-prefix=\"fas\" data-icon=\"caret-down\" class=\"svg-inline--fa fa-caret-down  icon icon--inline  \" role=\"img\" viewBox=\"0 0 320 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M140.3 376.8c12.6 10.2 31.1 9.5 42.8-2.2l128-128c9.2-9.2 11.9-22.9 6.9-34.9S301.4 192 288.5 192l-256 0c-12.9 0-24.6 7.8-29.6 19.8S.7 237.5 9.9 246.6l128 128 2.4 2.2z\"></path></svg></summary><div class=\"collapsible__content\"><ol class=\"checkbox-list\"><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-2988\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-2988\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>AI Generated</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-3035\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-3035\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Bug Fixes</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-44\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-44\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Client Mods</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-3032\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-3032\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>DataBlocks (MTFO)</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-46\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-46\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Developer Tools</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-3031\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-3031\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Asset Packs</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-48\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-48\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Libraries</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-47\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-47\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Modpacks</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-3034\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-3034\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Quality of Life</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-3033\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-3033\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Rebalance</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-45\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-45\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Rundown Tools</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-43\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-43\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Rundowns</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li></ol></div></details><details class=\"collapsible\" open=\"\"><summary class=\"button button--variant--secondary button--size--big button--ghost collapsible__header\">Other filters<svg data-prefix=\"fas\" data-icon=\"caret-down\" class=\"svg-inline--fa fa-caret-down  icon icon--inline  \" role=\"img\" viewBox=\"0 0 320 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M140.3 376.8c12.6 10.2 31.1 9.5 42.8-2.2l128-128c9.2-9.2 11.9-22.9 6.9-34.9S301.4 192 288.5 192l-256 0c-12.9 0-24.6 7.8-29.6 19.8S.7 237.5 9.9 246.6l128 128 2.4 2.2z\"></path></svg></summary><div class=\"collapsible__content\"><ol class=\"checkbox-list\"><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_bj4kl5_-deprecated\"><span><button id=\"checkbox-list__checkbox___R_bj4kl5_-deprecated\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Deprecated</span></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_bj4kl5_-nsfw\"><span><button id=\"checkbox-list__checkbox___R_bj4kl5_-nsfw\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>NSFW</span></label></li></ol></div></details></div></div></div>";

/* 真实 SSR 侧栏（https://thunderstore.io/c/totally-accurate-battle-simulator/ ，2026-11-16 抓取；SVG 保留，其余不动） */
const TS_SECTIONS_TOTALLY_ACCURATE_BATTLE_SIMULATOR = "<div class=\"package-search package-search--with-sidebar-ad\"><div class=\"package-search__sidebar\"><div class=\"package-search__filters\"><details class=\"collapsible\" open=\"\"><summary class=\"button button--variant--secondary button--size--big button--ghost collapsible__header\">Sections<svg data-prefix=\"fas\" data-icon=\"caret-down\" class=\"svg-inline--fa fa-caret-down  icon icon--inline  \" role=\"img\" viewBox=\"0 0 320 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M140.3 376.8c12.6 10.2 31.1 9.5 42.8-2.2l128-128c9.2-9.2 11.9-22.9 6.9-34.9S301.4 192 288.5 192l-256 0c-12.9 0-24.6 7.8-29.6 19.8S.7 237.5 9.9 246.6l128 128 2.4 2.2z\"></path></svg></summary><div class=\"collapsible__content\"><div role=\"radiogroup\" aria-required=\"false\" dir=\"ltr\" class=\"radio-group\" tabindex=\"-1\" style=\"outline:none\"><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"all\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"all\"/>All</label><div class=\"radio-group__divider\" role=\"presentation\"></div><label class=\"radio-group__label radio-group__label--selected\"><button type=\"button\" role=\"radio\" aria-checked=\"true\" data-state=\"checked\" value=\"01a1bcb6-6688-56d6-abcd-defa17b4bb21\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-state=\"checked\" data-prefix=\"fas\" data-icon=\"circle-dot\" class=\"svg-inline--fa fa-circle-dot  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zm0-352a96 96 0 1 1 0 192 96 96 0 1 1 0-192z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" checked=\"\" value=\"01a1bcb6-6688-56d6-abcd-defa17b4bb21\"/>Mods</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"01a1bcb6-669f-d385-7396-9e569c2cf108\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"01a1bcb6-669f-d385-7396-9e569c2cf108\"/>Modpacks</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"01a1c35d-33cb-c1c1-2b71-e4bec70b7555\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"01a1c35d-33cb-c1c1-2b71-e4bec70b7555\"/>Dev Tools and Libraries</label></div></div></details><details class=\"collapsible\" open=\"\"><summary class=\"button button--variant--secondary button--size--big button--ghost collapsible__header\">Categories<svg data-prefix=\"fas\" data-icon=\"caret-down\" class=\"svg-inline--fa fa-caret-down  icon icon--inline  \" role=\"img\" viewBox=\"0 0 320 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M140.3 376.8c12.6 10.2 31.1 9.5 42.8-2.2l128-128c9.2-9.2 11.9-22.9 6.9-34.9S301.4 192 288.5 192l-256 0c-12.9 0-24.6 7.8-29.6 19.8S.7 237.5 9.9 246.6l128 128 2.4 2.2z\"></path></svg></summary><div class=\"collapsible__content\"><ol class=\"checkbox-list\"><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-2990\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-2990\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>AI Generated</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-3037\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-3037\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Audio</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-3041\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-3041\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Developer Tools</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-3039\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-3039\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Factions</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-109\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-109\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Libraries</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-3040\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-3040\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Maps</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-3036\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-3036\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Misc</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-106\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-106\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Modpacks</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-105\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-105\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Mods</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-107\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-107\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Tweaks</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-3038\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-3038\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Units</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-108\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-108\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Utils</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li></ol></div></details><details class=\"collapsible\" open=\"\"><summary class=\"button button--variant--secondary button--size--big button--ghost collapsible__header\">Other filters<svg data-prefix=\"fas\" data-icon=\"caret-down\" class=\"svg-inline--fa fa-caret-down  icon icon--inline  \" role=\"img\" viewBox=\"0 0 320 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M140.3 376.8c12.6 10.2 31.1 9.5 42.8-2.2l128-128c9.2-9.2 11.9-22.9 6.9-34.9S301.4 192 288.5 192l-256 0c-12.9 0-24.6 7.8-29.6 19.8S.7 237.5 9.9 246.6l128 128 2.4 2.2z\"></path></svg></summary><div class=\"collapsible__content\"><ol class=\"checkbox-list\"><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_bj4kl5_-deprecated\"><span><button id=\"checkbox-list__checkbox___R_bj4kl5_-deprecated\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Deprecated</span></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_bj4kl5_-nsfw\"><span><button id=\"checkbox-list__checkbox___R_bj4kl5_-nsfw\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>NSFW</span></label></li></ol></div></details></div></div></div>";

/* 真实 SSR 侧栏（https://thunderstore.io/c/inscryption/ ，2026-11-16 抓取；SVG 保留，其余不动） */
const TS_SECTIONS_INSCRYPTION = "<div class=\"package-search package-search--with-sidebar-ad\"><div class=\"package-search__sidebar\"><div class=\"package-search__filters\"><details class=\"collapsible\" open=\"\"><summary class=\"button button--variant--secondary button--size--big button--ghost collapsible__header\">Sections<svg data-prefix=\"fas\" data-icon=\"caret-down\" class=\"svg-inline--fa fa-caret-down  icon icon--inline  \" role=\"img\" viewBox=\"0 0 320 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M140.3 376.8c12.6 10.2 31.1 9.5 42.8-2.2l128-128c9.2-9.2 11.9-22.9 6.9-34.9S301.4 192 288.5 192l-256 0c-12.9 0-24.6 7.8-29.6 19.8S.7 237.5 9.9 246.6l128 128 2.4 2.2z\"></path></svg></summary><div class=\"collapsible__content\"><div role=\"radiogroup\" aria-required=\"false\" dir=\"ltr\" class=\"radio-group\" tabindex=\"-1\" style=\"outline:none\"><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"all\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"all\"/>All</label><div class=\"radio-group__divider\" role=\"presentation\"></div><label class=\"radio-group__label radio-group__label--selected\"><button type=\"button\" role=\"radio\" aria-checked=\"true\" data-state=\"checked\" value=\"0180391e-c86c-de17-ce10-e793c9e4c7c4\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-state=\"checked\" data-prefix=\"fas\" data-icon=\"circle-dot\" class=\"svg-inline--fa fa-circle-dot  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zm0-352a96 96 0 1 1 0 192 96 96 0 1 1 0-192z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" checked=\"\" value=\"0180391e-c86c-de17-ce10-e793c9e4c7c4\"/>All Mods</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"0185302f-668c-9b06-d96c-02646d77b73b\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"0185302f-668c-9b06-d96c-02646d77b73b\"/>Act I</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"0185302f-a1b9-2642-81d2-407e76273c4e\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"0185302f-a1b9-2642-81d2-407e76273c4e\"/>Act II</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"0185302f-d7c0-be41-0853-d4ff54f460aa\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"0185302f-d7c0-be41-0853-d4ff54f460aa\"/>Act III</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"01853030-1f13-78cd-6cd6-6d4779ea8075\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"01853030-1f13-78cd-6cd6-6d4779ea8075\"/>Kaycee&#x27;s Mod</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"019fa685-ad1b-bbad-b635-058af741669b\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"019fa685-ad1b-bbad-b635-058af741669b\"/>Magnificus Mod</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"019fa685-ad2b-608a-1b9a-655b3cc6b39a\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"019fa685-ad2b-608a-1b9a-655b3cc6b39a\"/>Grimora Mod</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"019fa685-ad3a-c017-f151-d86d0ebe8579\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"019fa685-ad3a-c017-f151-d86d0ebe8579\"/>P03 In Kaycee&#x27;s Mod</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"019fa685-ad4b-19b9-2c7b-1cb058ffc357\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"019fa685-ad4b-19b9-2c7b-1cb058ffc357\"/>Developer Tools</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"0180391e-8992-a2c2-da70-96e3aed3c084\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"0180391e-8992-a2c2-da70-96e3aed3c084\"/>Modpacks</label></div></div></details><details class=\"collapsible\" open=\"\"><summary class=\"button button--variant--secondary button--size--big button--ghost collapsible__header\">Categories<svg data-prefix=\"fas\" data-icon=\"caret-down\" class=\"svg-inline--fa fa-caret-down  icon icon--inline  \" role=\"img\" viewBox=\"0 0 320 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M140.3 376.8c12.6 10.2 31.1 9.5 42.8-2.2l128-128c9.2-9.2 11.9-22.9 6.9-34.9S301.4 192 288.5 192l-256 0c-12.9 0-24.6 7.8-29.6 19.8S.7 237.5 9.9 246.6l128 128 2.4 2.2z\"></path></svg></summary><div class=\"collapsible__content\"><ol class=\"checkbox-list\"><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-128\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-128\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Act I</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-129\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-129\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Act II</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-130\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-130\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Act III</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-2567\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-2567\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>AI Generated Content</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-122\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-122\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Audio</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-121\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-121\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Bosses</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-119\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-119\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Cards</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-2436\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-2436\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Costs</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-445\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-445\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Encounters</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-529\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-529\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Grimora Mod</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-375\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-375\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Items</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-373\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-373\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Kaycee&#x27;s Mod</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-124\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-124\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Language</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-125\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-125\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Libraries</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-530\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-530\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Magnificus Mod</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-127\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-127\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Misc</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-126\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-126\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Modpacks</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-351\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-351\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Music</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-528\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-528\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>P03 In Kaycee&#x27;s Mod</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-2435\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-2435\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Pelts</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-444\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-444\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Regions</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-120\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-120\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Scrybes</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-2431\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-2431\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Sigils</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-2432\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-2432\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Special Abilities</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-2437\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-2437\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Tools</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-2433\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-2433\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Traits</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-2434\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-2434\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Tribes</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-123\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-123\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Tweaks</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li></ol></div></details><details class=\"collapsible\" open=\"\"><summary class=\"button button--variant--secondary button--size--big button--ghost collapsible__header\">Other filters<svg data-prefix=\"fas\" data-icon=\"caret-down\" class=\"svg-inline--fa fa-caret-down  icon icon--inline  \" role=\"img\" viewBox=\"0 0 320 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M140.3 376.8c12.6 10.2 31.1 9.5 42.8-2.2l128-128c9.2-9.2 11.9-22.9 6.9-34.9S301.4 192 288.5 192l-256 0c-12.9 0-24.6 7.8-29.6 19.8S.7 237.5 9.9 246.6l128 128 2.4 2.2z\"></path></svg></summary><div class=\"collapsible__content\"><ol class=\"checkbox-list\"><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_bj4kl5_-deprecated\"><span><button id=\"checkbox-list__checkbox___R_bj4kl5_-deprecated\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Deprecated</span></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_bj4kl5_-nsfw\"><span><button id=\"checkbox-list__checkbox___R_bj4kl5_-nsfw\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>NSFW</span></label></li></ol></div></details></div></div></div>";

/* 真实 SSR 侧栏（https://thunderstore.io/c/lethal-company/ ，2026-11-16 抓取；SVG 保留，其余不动） */
const TS_SECTIONS_LETHAL_COMPANY = "<div class=\"package-search package-search--with-sidebar-ad\"><div class=\"package-search__sidebar\"><div class=\"package-search__filters\"><details class=\"collapsible\" open=\"\"><summary class=\"button button--variant--secondary button--size--big button--ghost collapsible__header\">Sections<svg data-prefix=\"fas\" data-icon=\"caret-down\" class=\"svg-inline--fa fa-caret-down  icon icon--inline  \" role=\"img\" viewBox=\"0 0 320 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M140.3 376.8c12.6 10.2 31.1 9.5 42.8-2.2l128-128c9.2-9.2 11.9-22.9 6.9-34.9S301.4 192 288.5 192l-256 0c-12.9 0-24.6 7.8-29.6 19.8S.7 237.5 9.9 246.6l128 128 2.4 2.2z\"></path></svg></summary><div class=\"collapsible__content\"><div role=\"radiogroup\" aria-required=\"false\" dir=\"ltr\" class=\"radio-group\" tabindex=\"-1\" style=\"outline:none\"><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"all\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"all\"/>All</label><div class=\"radio-group__divider\" role=\"presentation\"></div><label class=\"radio-group__label radio-group__label--selected\"><button type=\"button\" role=\"radio\" aria-checked=\"true\" data-state=\"checked\" value=\"018bb887-fa45-e515-cfea-76e144826dbc\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-state=\"checked\" data-prefix=\"fas\" data-icon=\"circle-dot\" class=\"svg-inline--fa fa-circle-dot  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zm0-352a96 96 0 1 1 0 192 96 96 0 1 1 0-192z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" checked=\"\" value=\"018bb887-fa45-e515-cfea-76e144826dbc\"/>Mods (excluding AI)</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"01a19aa1-0239-47fc-37dc-9fec56ec1941\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"01a19aa1-0239-47fc-37dc-9fec56ec1941\"/>Mods (including AI)</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"018c6367-e029-effe-001d-5109aa529342\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"018c6367-e029-effe-001d-5109aa529342\"/>Asset Replacements</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"018c259b-91e0-3cbc-9c23-92d877153be7\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"018c259b-91e0-3cbc-9c23-92d877153be7\"/>APIs &amp; Libraries</label><label class=\"radio-group__label radio-group__label--unselected\"><button type=\"button\" role=\"radio\" aria-checked=\"false\" data-state=\"unchecked\" value=\"018bb887-fa52-7236-0344-e714696ee5d5\" class=\"radio-group__radio\" tabindex=\"-1\" data-radix-collection-item=\"\"><svg data-prefix=\"fas\" data-icon=\"circle\" class=\"svg-inline--fa fa-circle  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button><input type=\"radio\" aria-hidden=\"true\" style=\"transform:translateX(-100%);position:absolute;pointer-events:none;opacity:0;margin:0\" tabindex=\"-1\" value=\"018bb887-fa52-7236-0344-e714696ee5d5\"/>Modpacks</label></div></div></details><details class=\"collapsible\" open=\"\"><summary class=\"button button--variant--secondary button--size--big button--ghost collapsible__header\">Categories<svg data-prefix=\"fas\" data-icon=\"caret-down\" class=\"svg-inline--fa fa-caret-down  icon icon--inline  \" role=\"img\" viewBox=\"0 0 320 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M140.3 376.8c12.6 10.2 31.1 9.5 42.8-2.2l128-128c9.2-9.2 11.9-22.9 6.9-34.9S301.4 192 288.5 192l-256 0c-12.9 0-24.6 7.8-29.6 19.8S.7 237.5 9.9 246.6l128 128 2.4 2.2z\"></path></svg></summary><div class=\"collapsible__content\"><ol class=\"checkbox-list\"><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-2086\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-2086\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>AI Generated</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-711\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-711\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Asset Replacements</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-663\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-663\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Audio</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-682\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-682\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>BepInEx</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-720\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-720\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Boombox Music</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-870\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-870\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Bug Fixes</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-684\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-684\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Client-side</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-692\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-692\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Cosmetics</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-713\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-713\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Emotes</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-687\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-687\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Equipment</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-691\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-691\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Furniture</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-869\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-869\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Hazards</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-767\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-767\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Interiors</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-688\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-688\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Items</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-661\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-661\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Libraries</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-683\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-683\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>MelonLoader</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-662\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-662\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Misc</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-659\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-659\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Modpacks</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-658\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-658\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Mods</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-689\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-689\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Monsters</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-690\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-690\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Moons</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-871\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-871\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Performance</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-722\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-722\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Posters</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-685\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-685\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Server-side</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-686\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-686\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Suits</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-660\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-660\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Tools</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-712\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-712\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Translations</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-872\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-872\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Tweaks &amp; Quality Of Life</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-1475\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-1475\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Vehicles</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-721\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-721\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>TV Videos</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_aj4kl5_-868\"><span><button id=\"checkbox-list__checkbox___R_aj4kl5_-868\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Weather</span><button class=\"checkbox-list__icon checkbox-list__exclude-button \"><svg data-prefix=\"fas\" data-icon=\"ban\" class=\"svg-inline--fa fa-ban  icon icon--inline  \" role=\"img\" viewBox=\"0 0 512 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M367.2 412.5L99.5 144.8c-22.4 31.4-35.5 69.8-35.5 111.2 0 106 86 192 192 192 41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3c22.4-31.4 35.5-69.8 35.5-111.2 0-106-86-192-192-192-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"></path></svg></button></label></li></ol></div></details><details class=\"collapsible\" open=\"\"><summary class=\"button button--variant--secondary button--size--big button--ghost collapsible__header\">Other filters<svg data-prefix=\"fas\" data-icon=\"caret-down\" class=\"svg-inline--fa fa-caret-down  icon icon--inline  \" role=\"img\" viewBox=\"0 0 320 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M140.3 376.8c12.6 10.2 31.1 9.5 42.8-2.2l128-128c9.2-9.2 11.9-22.9 6.9-34.9S301.4 192 288.5 192l-256 0c-12.9 0-24.6 7.8-29.6 19.8S.7 237.5 9.9 246.6l128 128 2.4 2.2z\"></path></svg></summary><div class=\"collapsible__content\"><ol class=\"checkbox-list\"><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_bj4kl5_-deprecated\"><span><button id=\"checkbox-list__checkbox___R_bj4kl5_-deprecated\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>Deprecated</span></label></li><li><label class=\"checkbox-list__label checkbox-list__label--off\" for=\"checkbox-list__checkbox___R_bj4kl5_-nsfw\"><span><button id=\"checkbox-list__checkbox___R_bj4kl5_-nsfw\" class=\"checkbox-list__icon checkbox-list__checkbox-button \"><svg data-prefix=\"fas\" data-icon=\"square\" class=\"svg-inline--fa fa-square  icon icon--inline  \" role=\"img\" viewBox=\"0 0 448 512\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32z\"></path></svg></button>NSFW</span></label></li></ol></div></details></div></div></div>";

/* 合成卡片：结构与真实 card-package 一致，标题/作者/描述故意取与分类枚举同串的值 */
const TS_CARD_UGC = "<div class=\"card-package card-package--variant--card\" id=\"card-lc\">\n  <div class=\"card-package__content\">\n    <div class=\"card-package__heading\"><a class=\"link card-package__title\" href=\"/c/lethal-company/p/a/B/\"><span>Libraries</span></a></div>\n    <div class=\"card-package__author\"><span class=\"card-package__prefix\">by</span><a class=\"link card-package__link\" href=\"/c/lethal-company/p/Misc/\">Mods</a></div>\n    <p class=\"card-package__description\">Libraries Mods Modpacks Tools Audio — 用户描述原样。</p>\n    <div class=\"card-package__tags\"><a href=\"/c/lethal-company/?includedCategories=8\" class=\"tag\"><span>Libraries</span></a><a href=\"/c/lethal-company/?includedCategories=1\" class=\"tag\"><span>Mods</span></a></div>\n  </div>\n</div>";

/* ---- 证据文档解析出的枚举（顺序与文档一致） ---- */
const ALL_SECTIONS = [
    "All",
    "Modpacks",
    "Mods",
    "Maps",
    "Developer Tools",
    "Mods (excluding AI)",
    "Mods (including AI)",
    "All Mods",
    "APIs & Libraries",
    "Asset Replacements",
    "Experimental",
    "Other",
    "0.62 Branch",
    "0.62 Branch Modpacks",
    "0.66 Branch",
    "0.66 Branch Modpacks",
    "0.70 Branch",
    "0.70 Branch Modpacks",
    "1.0 Classic Branch",
    "1.0 Classic Branch Modpacks",
    "Act I",
    "Act II",
    "Act III",
    "All Versions",
    "Asset Packs",
    "Assets & Cosmetics",
    "Bundles",
    "Cars",
    "Clientside Mods",
    "Combos",
    "Custom Cards",
    "Deep North Update",
    "Dev Tools and Libraries",
    "Gameplay",
    "Grimora Mod",
    "Host Only Mods",
    "Kaycee's Mod",
    "Magnificus Mod",
    "Main Branch",
    "Main Branch Modpacks",
    "Missions",
    "Modpacks & Soundpacks",
    "Mono Modpacks",
    "Mono Mods",
    "Oakveil Update",
    "P03 In Kaycee's Mod",
    "Plugins",
    "Resource Packs",
    "Rundowns",
    "Saves",
    "Sound Packs",
    "Translations",
    "Universes",
    "Vanilla Compatible Mods",
    "Worlds",
];
const ALL_CATEGORIES = [
    "Modpacks",
    "Mods",
    "Libraries",
    "Misc",
    "Tools",
    "Audio",
    "AI Generated",
    "Items",
    "Maps",
    "Tweaks",
    "Client-side",
    "Quality of Life",
    "Skins",
    "Weapons",
    "Cosmetics",
    "Server-side",
    "Characters",
    "Enemies",
    "Cards",
    "Gameplay",
    "Language",
    "All Clients",
    "Cosmetic",
    "Quality Of Life",
    "UI",
    "Utility",
    "Bug Fixes",
    "Emotes",
    "Gamemodes",
    "Host Only",
    "Music",
    "NPCs",
    "Translations",
    "AI Generated Content",
    "Artifacts",
    "Asset Replacements",
    "Bosses",
    "Cheats",
    "Client Side",
    "Client-Side",
    "Developer Tools",
    "Furniture",
    "Monsters",
    "QoL",
    "Textures",
    "Balance",
    "Crafting",
    "Custom Maps",
    "Events",
    "Gameplay Tweaks",
    "Memes",
    "NSFW",
    "Optimization",
    "Skills",
    "Accessibility",
    "Ammo",
    "Animation",
    "Asset Packs",
    "Assets",
    "BepInEx",
    "Biomes",
    "Building",
    "Camera Mods",
    "Client",
    "Code Mods",
    "Content",
    "Costumes",
    "Custom Items",
    "Custom NPCs",
    "Custom Player Models",
    "Custom Skins",
    "Custom Weapons",
    "Difficulty",
    "Equipment",
    "Experimental",
    "Game Modes",
    "Gamemode",
    "Host-Only",
    "Levels",
    "Localization",
    "MelonLoader",
    "Meme",
    "Models",
    "Moves",
    "Overrides",
    "Patch",
    "Plugins",
    "Props",
    "Quests",
    "Rooms",
    "Run Modifiers",
    "Server",
    "Server-Side",
    "Ships",
    "Sound",
    "Stages",
    "Themes",
    "Tiles",
    "Translation",
    "Transportation",
    "Tweaks & Quality Of Life",
    "Utils",
    "Vehicles",
    "Visual Effects",
    "World Generation",
    "(Deprecated category) Audio",
    "(Deprecated category) Misc",
    "(Deprecated category) Tools",
    "0.62 Branch",
    "0.66 Branch",
    "0.70 Branch",
    "1.0 Classic Branch",
    "1.0 Update",
    "Abilities",
    "Acceleracers",
    "Accolades",
    "Act I",
    "Act II",
    "Act III",
    "Addons",
    "Afflictions",
    "AI",
    "AI & NPCs",
    "All Clients Required",
    "All Required",
    "Alloyed Collective",
    "Animation Packs",
    "APIs",
    "Apps",
    "Arenas",
    "Ashlands Update",
    "Asphalt",
    "Assembling Machines",
    "Asset Importing",
    "Asset Replacement",
    "Balancing",
    "Battle Force 5",
    "Battles",
    "Belts and Sorters",
    "Blaster Master",
    "Blueprints",
    "Bog Witch Update",
    "Boombox Music",
    "Boss",
    "Bros",
    "Buffs",
    "Bug Workaround",
    "Build Models",
    "Bundles",
    "Burnout",
    "Campaigns",
    "Car",
    "Carryables",
    "Cars (film)",
    "Cases",
    "Charms",
    "Christmas",
    "City Generation",
    "Clans",
    "Classes",
    "Client Mods",
    "Client-Only",
    "Combos",
    "Commands",
    "Companions",
    "Components",
    "Console",
    "Content Mods",
    "Context Menu",
    "Contracts",
    "Controls",
    "Costs",
    "Courses",
    "Crafts",
    "Custom Audio",
    "Custom Cards",
    "Custom Crests",
    "Custom Menus",
    "Custom Tools",
    "Customisation",
    "Dashboard",
    "DataBlocks (MTFO)",
    "DDS",
    "Decor",
    "Decoration",
    "Decorations",
    "Dedicated Server",
    "Deep North Update",
    "Disables Progression",
    "Display",
    "Drones",
    "Dyson",
    "Early Plugins",
    "Effects",
    "Elites",
    "Encounters",
    "Environment",
    "Exhibits",
    "Expansion",
    "Expansions",
    "F-Zero",
    "Faces",
    "Factions",
    "Farming",
    "Fish",
    "Fixes",
    "Floors",
    "Framework",
    "Frameworks",
    "Game Breaking",
    "Game mechanics",
    "Gameplay mechanics",
    "Gear",
    "Gear and Armor",
    "Gloomrot Update",
    "Graphics",
    "Grimora Mod",
    "Gungeoneers",
    "Guns",
    "Halloween",
    "Halloween Modjam 2022",
    "Halo",
    "Hand Cosmetics",
    "Hand Packs",
    "Hardware Integration",
    "Hats",
    "Hazards",
    "Hildir's Request Update",
    "Host-Side",
    "Hot Wheels",
    "IL2CPP",
    "Info",
    "Inspectors",
    "Integration",
    "Interactables",
    "Interiors",
    "Inventory Modifications",
    "Kaycee's Mod",
    "Kerfur",
    "Language: CN",
    "Language: EN",
    "Languages",
    "Leaderboard Legal",
    "Legend",
    "LEGO",
    "Locations",
    "Logic Mod",
    "Logic Nodes",
    "Logistics",
    "Magic",
    "Magnificus Mod",
    "Map",
    "Mecha",
    "Mechanics",
    "Memory Packs",
    "Merchants",
    "Minis",
    "Missions & Campaigns",
    "Mistlands Update",
    "Mixtapes",
    "Mobs",
    "Mod Jam 1 - Void",
    "Mod_Session Required",
    "Model",
    "Model Replacements",
    "Modifiers",
    "Modpack",
    "Mono",
    "Monster Truck",
    "Moons",
    "Mutators",
    "Nebula Compatible",
    "Networked",
    "New Mechanics",
    "Nitronic Rush",
    "NPC",
    "Oakveil Update",
    "Objectives",
    "Original Car",
    "P03 In Kaycee's Mod",
    "Patapon 1",
    "Patapon 2",
    "Patterns",
    "Pelts",
    "Performance",
    "Perks",
    "Phone Options",
    "Phone Related",
    "Placeables",
    "Player Characters",
    "Police",
    "Posters",
    "Power",
    "Pre-Release",
    "Protoflux",
    "PvP",
    "QOL",
    "Real Car",
    "Rebalance",
    "Regions",
    "Release",
    "Requires Manual Dependencies",
    "Reskins",
    "Resources",
    "Robes",
    "Rocket League",
    "Ruleset",
    "Rundown Tools",
    "Rundowns",
    "Runner",
    "Sandbox",
    "Saves",
    "Scene File",
    "Scrybes",
    "Seekers of the Storm Update",
    "Sellables",
    "Server Side",
    "Sets",
    "Shaders",
    "Shop",
    "Sigils",
    "Signals",
    "Single Player",
    "Skateboards",
    "Sonic",
    "Sound Packs",
    "Soundpack",
    "Space Ship",
    "Special Abilities",
    "Species",
    "Speed Racer",
    "Speedrunning",
    "Storage",
    "Suits",
    "Survivors",
    "Survivors of the Void",
    "Symbols",
    "Tapes",
    "Technical Tweaks",
    "Technology",
    "Text Changes",
    "Texture Replacements",
    "Trackmania",
    "Traits",
    "Tribes",
    "TV Videos",
    "UE4SS Mod",
    "UI & HUD",
    "Units",
    "Universes",
    "Upgrades",
    "Utilities",
    "Valuables",
    "Vanilla compatible",
    "Vanilla Compatible",
    "Vault File",
    "Vehicle Parts",
    "Visual Tweaks",
    "Voicepacks",
    "Wacky Races",
    "Wands",
    "Weapon",
    "Weapons & Equipment",
    "Wearables",
    "Weather",
    "Wizards",
    "World",
    "World Race",
    "Worldgen",
    "Worlds",
];
/* 译文与原文相同的品牌名（显式同值，见证据文档第 4 节） */
const BRAND_SAME = ['BepInEx', 'MelonLoader', 'IL2CPP', 'DDS', 'NPC', 'AI', 'UI', 'PvP', 'F-Zero', 'Alloyed Collective'];
const SECTION_ZH = {
    "0.62 Branch": "0.62 分支",
    "0.62 Branch Modpacks": "0.62 分支整合包",
    "0.66 Branch": "0.66 分支",
    "0.66 Branch Modpacks": "0.66 分支整合包",
    "0.70 Branch": "0.70 分支",
    "0.70 Branch Modpacks": "0.70 分支整合包",
    "1.0 Classic Branch": "1.0 经典分支",
    "1.0 Classic Branch Modpacks": "1.0 经典分支整合包",
    "Act I": "第一章",
    "Act II": "第二章",
    "Act III": "第三章",
    "All": "全部",
    "All Mods": "全部模组",
    "All Versions": "所有版本",
    "APIs & Libraries": "API 与库",
    "Asset Packs": "资源包",
    "Asset Replacements": "资源替换",
    "Assets & Cosmetics": "资源与外观",
    "Bundles": "捆绑包",
    "Cars": "车辆",
    "Clientside Mods": "客户端模组",
    "Combos": "组合",
    "Custom Cards": "自定义卡牌",
    "Deep North Update": "极北之地更新",
    "Dev Tools and Libraries": "开发工具与库",
    "Developer Tools": "开发者工具",
    "Experimental": "实验性",
    "Gameplay": "玩法",
    "Grimora Mod": "Grimora 模组",
    "Host Only Mods": "仅主机端模组",
    "Kaycee's Mod": "凯西的模组",
    "Magnificus Mod": "Magnificus 模组",
    "Main Branch": "主分支",
    "Main Branch Modpacks": "主分支整合包",
    "Maps": "地图",
    "Missions": "任务",
    "Modpacks": "整合包",
    "Modpacks & Soundpacks": "整合包与音效包",
    "Mods": "模组",
    "Mods (excluding AI)": "模组（不含 AI）",
    "Mods (including AI)": "模组（含 AI）",
    "Mono Modpacks": "Mono 整合包",
    "Mono Mods": "Mono 模组",
    "Oakveil Update": "Oakveil 更新",
    "Other": "其他",
    "P03 In Kaycee's Mod": "凯西的模组中的 P03",
    "Plugins": "插件",
    "Resource Packs": "资源包",
    "Rundowns": "远征序列",
    "Saves": "存档",
    "Sound Packs": "音效包",
    "Translations": "翻译",
    "Universes": "宇宙",
    "Vanilla Compatible Mods": "原版兼容模组",
    "Worlds": "世界",
};
const CATEGORY_ZH = {
    "(Deprecated category) Audio": "（已弃用的分类）音频",
    "(Deprecated category) Misc": "（已弃用的分类）杂项",
    "(Deprecated category) Tools": "（已弃用的分类）工具",
    "0.62 Branch": "0.62 分支",
    "0.66 Branch": "0.66 分支",
    "0.70 Branch": "0.70 分支",
    "1.0 Classic Branch": "1.0 经典分支",
    "1.0 Update": "1.0 更新",
    "Abilities": "能力",
    "Acceleracers": "加速车手",
    "Accessibility": "无障碍",
    "Accolades": "荣誉",
    "Act I": "第一章",
    "Act II": "第二章",
    "Act III": "第三章",
    "Addons": "附加组件",
    "Afflictions": "苦难",
    "AI": "AI",
    "AI & NPCs": "AI 与 NPC",
    "AI Generated": "AI 生成",
    "AI Generated Content": "AI 生成内容",
    "All": "全部",
    "All Clients": "所有客户端",
    "All Clients Required": "所有客户端必装",
    "All Required": "全部必需",
    "Alloyed Collective": "合金集合体",
    "Ammo": "弹药",
    "Animation": "动画",
    "Animation Packs": "动画包",
    "APIs": "API",
    "Apps": "应用",
    "Arenas": "竞技场",
    "Artifacts": "神器",
    "Ashlands Update": "灰烬之地更新",
    "Asphalt": "柏油",
    "Assembling Machines": "组装机",
    "Asset Importing": "资源导入",
    "Asset Packs": "资源包",
    "Asset Replacement": "资源替换",
    "Asset Replacements": "资源替换",
    "Assets": "资源",
    "Audio": "音频",
    "Balance": "平衡",
    "Balancing": "平衡调整",
    "Battle Force 5": "战斗力量 5",
    "Battles": "对战",
    "Belts and Sorters": "传送带与分拣器",
    "BepInEx": "BepInEx",
    "Biomes": "生物群系",
    "Blaster Master": "爆破大师",
    "Blueprints": "蓝图",
    "Bog Witch Update": "沼泽女巫更新",
    "Boombox Music": "音箱音乐",
    "Boss": "首领",
    "Bosses": "Boss",
    "Bros": "兄弟",
    "Buffs": "增益",
    "Bug Fixes": "缺陷修复",
    "Bug Workaround": "缺陷规避",
    "Build Models": "建造模型",
    "Building": "建造",
    "Bundles": "捆绑包",
    "Burnout": "狂飙",
    "Camera Mods": "镜头模组",
    "Campaigns": "战役",
    "Car": "汽车",
    "Cards": "卡牌",
    "Carryables": "可搬运物",
    "Cars (film)": "汽车（电影）",
    "Cases": "箱体",
    "Categories": "分类",
    "Characters": "角色",
    "Charms": "护符",
    "Cheats": "作弊",
    "Christmas": "圣诞节",
    "City Generation": "城市生成",
    "Clans": "氏族",
    "Classes": "职业",
    "Client": "客户端",
    "Client Mods": "客户端模组",
    "Client Side": "客户端",
    "Client-Only": "仅客户端",
    "Client-side": "客户端",
    "Client-Side": "客户端",
    "Code Mods": "代码模组",
    "Combos": "组合",
    "Commands": "命令",
    "Companions": "同伴",
    "Components": "组件",
    "Console": "控制台",
    "Content": "内容",
    "Content Mods": "内容模组",
    "Context Menu": "右键菜单",
    "Contracts": "契约",
    "Controls": "操作",
    "Cosmetic": "外观",
    "Cosmetics": "外观",
    "Costs": "消耗",
    "Costumes": "服装",
    "Courses": "赛道",
    "Crafting": "制作",
    "Crafts": "制作",
    "Custom Audio": "自定义音频",
    "Custom Cards": "自定义卡牌",
    "Custom Crests": "自定义纹章",
    "Custom Items": "自定义物品",
    "Custom Maps": "自定义地图",
    "Custom Menus": "自定义菜单",
    "Custom NPCs": "自定义 NPC",
    "Custom Player Models": "自定义玩家模型",
    "Custom Skins": "自定义皮肤",
    "Custom Tools": "自定义工具",
    "Custom Weapons": "自定义武器",
    "Customisation": "自定义",
    "Dashboard": "仪表盘",
    "DataBlocks (MTFO)": "数据块（MTFO）",
    "DDS": "DDS",
    "Decor": "装饰",
    "Decoration": "装饰",
    "Decorations": "装饰",
    "Dedicated Server": "专用服务器",
    "Deep North Update": "极北之地更新",
    "Developer Tools": "开发者工具",
    "Difficulty": "难度",
    "Disables Progression": "禁用进度",
    "Display": "显示",
    "Drones": "无人机",
    "Dyson": "戴森",
    "Early Plugins": "早期插件",
    "Effects": "效果",
    "Elites": "精英",
    "Emotes": "表情动作",
    "Encounters": "遭遇",
    "Enemies": "敌人",
    "Environment": "环境",
    "Equipment": "装备",
    "Events": "活动",
    "Exhibits": "展品",
    "Expansion": "扩展",
    "Expansions": "扩展",
    "Experimental": "实验性",
    "F-Zero": "F-Zero",
    "Faces": "面孔",
    "Factions": "阵营",
    "Farming": "农耕",
    "Fish": "鱼类",
    "Fixes": "修复",
    "Floors": "楼层",
    "Framework": "框架",
    "Frameworks": "框架",
    "Furniture": "家具",
    "Game Breaking": "破坏游戏性",
    "Game mechanics": "游戏机制",
    "Game Modes": "游戏模式",
    "Gamemode": "游戏模式",
    "Gamemodes": "游戏模式",
    "Gameplay": "玩法",
    "Gameplay mechanics": "玩法机制",
    "Gameplay Tweaks": "玩法调整",
    "Gear": "装备",
    "Gear and Armor": "装备与护甲",
    "Gloomrot Update": "幽暗腐化更新",
    "Graphics": "画面",
    "Grimora Mod": "Grimora 模组",
    "Gungeoneers": "地牢枪手",
    "Guns": "枪械",
    "Halloween": "万圣节",
    "Halloween Modjam 2022": "2022 万圣节模组创作活动",
    "Halo": "光环",
    "Hand Cosmetics": "手部外观",
    "Hand Packs": "手部包",
    "Hardware Integration": "硬件集成",
    "Hats": "帽子",
    "Hazards": "危险",
    "Hildir's Request Update": "希尔德请求更新",
    "Host Only": "仅主机端",
    "Host-Only": "仅主机端",
    "Host-Side": "仅主机端",
    "Hot Wheels": "风火轮",
    "IL2CPP": "IL2CPP",
    "Info": "信息",
    "Inspectors": "检查器",
    "Integration": "整合",
    "Interactables": "可交互物",
    "Interiors": "室内",
    "Inventory Modifications": "背包修改",
    "Items": "物品",
    "Kaycee's Mod": "凯西的模组",
    "Kerfur": "Kerfur 机器人",
    "Language": "语言",
    "Language: CN": "语言：中文",
    "Language: EN": "语言：英文",
    "Languages": "语言",
    "Leaderboard Legal": "排行榜可用",
    "Legend": "传奇",
    "LEGO": "乐高",
    "Levels": "关卡",
    "Libraries": "库",
    "Localization": "本地化",
    "Locations": "地点",
    "Logic Mod": "逻辑模组",
    "Logic Nodes": "逻辑节点",
    "Logistics": "物流",
    "Magic": "魔法",
    "Magnificus Mod": "Magnificus 模组",
    "Map": "地图",
    "Maps": "地图",
    "Mecha": "机甲",
    "Mechanics": "机制",
    "MelonLoader": "MelonLoader",
    "Meme": "梗",
    "Memes": "梗",
    "Memory Packs": "记忆包",
    "Merchants": "商人",
    "Minis": "迷你模型",
    "Misc": "杂项",
    "Missions & Campaigns": "任务与战役",
    "Mistlands Update": "迷雾之地更新",
    "Mixtapes": "混音磁带",
    "Mobs": "生物",
    "Mod Jam 1 - Void": "模组创作活动 1 - 虚空",
    "Mod_Session Required": "需要 Mod_Session",
    "Model": "模型",
    "Model Replacements": "模型替换",
    "Models": "模型",
    "Modifiers": "修正项",
    "Modpack": "整合包",
    "Modpacks": "整合包",
    "Mods": "模组",
    "Mono": "Mono",
    "Monster Truck": "怪物卡车",
    "Monsters": "怪物",
    "Moons": "星球",
    "Moves": "招式",
    "Music": "音乐",
    "Mutators": "变异器",
    "Nebula Compatible": "兼容 Nebula",
    "Networked": "联网",
    "New Mechanics": "新机制",
    "Nitronic Rush": "氮气狂飙",
    "NPC": "NPC",
    "NPCs": "NPC",
    "NSFW": "成人内容",
    "Oakveil Update": "Oakveil 更新",
    "Objectives": "目标",
    "Optimization": "优化",
    "Original Car": "原版汽车",
    "Other filters": "其他筛选",
    "Overrides": "覆盖修改",
    "P03 In Kaycee's Mod": "凯西的模组中的 P03",
    "Patapon 1": "啪嗒砰 1",
    "Patapon 2": "啪嗒砰 2",
    "Patch": "补丁",
    "Patterns": "图案",
    "Pelts": "毛皮",
    "Performance": "性能",
    "Perks": "专长",
    "Phone Options": "手机选项",
    "Phone Related": "手机相关",
    "Placeables": "可放置物",
    "Player Characters": "玩家角色",
    "Plugins": "插件",
    "Police": "警车",
    "Posters": "海报",
    "Power": "能力",
    "Pre-Release": "预发布",
    "Props": "道具",
    "Protoflux": "Protoflux",
    "PvP": "PvP",
    "QoL": "体验优化",
    "QOL": "体验优化",
    "Quality of Life": "体验优化",
    "Quality Of Life": "体验优化",
    "Quests": "任务",
    "Real Car": "真实车辆",
    "Rebalance": "平衡性调整",
    "Regions": "地区",
    "Release": "正式版",
    "Requires Manual Dependencies": "需手动安装依赖",
    "Reskins": "重新贴图",
    "Resources": "资源",
    "Robes": "法袍",
    "Rocket League": "火箭联盟",
    "Rooms": "房间",
    "Ruleset": "规则集",
    "Run Modifiers": "对局修正",
    "Rundown Tools": "远征序列工具",
    "Rundowns": "远征序列",
    "Runner": "跑酷",
    "Sandbox": "沙盒",
    "Saves": "存档",
    "Scene File": "场景文件",
    "Scrybes": "布道者",
    "Sections": "分区",
    "Seekers of the Storm Update": "风暴追寻者更新",
    "Sellables": "可售物品",
    "Server": "服务端",
    "Server Side": "服务端",
    "Server-side": "服务端",
    "Server-Side": "服务端",
    "Sets": "套装",
    "Shaders": "着色器",
    "Ships": "飞船",
    "Shop": "商店",
    "Sigils": "印记",
    "Signals": "信号",
    "Single Player": "单人游戏",
    "Skateboards": "滑板",
    "Skills": "技能",
    "Skins": "皮肤",
    "Sonic": "索尼克",
    "Sound": "音效",
    "Sound Packs": "音效包",
    "Soundpack": "音效包",
    "Space Ship": "太空飞船",
    "Special Abilities": "特殊能力",
    "Species": "物种",
    "Speed Racer": "极速赛车手",
    "Speedrunning": "速通",
    "Stages": "关卡",
    "Storage": "存储",
    "Suits": "服装",
    "Survivors": "幸存者",
    "Survivors of the Void": "虚空幸存者",
    "Symbols": "符号",
    "Tapes": "磁带",
    "Technical Tweaks": "技术调整",
    "Technology": "科技",
    "Text Changes": "文本改动",
    "Texture Replacements": "贴图替换",
    "Textures": "贴图",
    "Themes": "主题",
    "Tiles": "地块",
    "Tools": "工具",
    "Trackmania": "赛道狂飙",
    "Traits": "特质",
    "Translation": "翻译",
    "Translations": "翻译",
    "Transportation": "交通工具",
    "Tribes": "部族",
    "TV Videos": "电视视频",
    "Tweaks": "调整",
    "Tweaks & Quality Of Life": "调整与体验优化",
    "UE4SS Mod": "UE4SS 模组",
    "UI": "界面",
    "UI & HUD": "界面与 HUD",
    "Units": "单位",
    "Universes": "宇宙",
    "Upgrades": "升级",
    "Utilities": "实用工具",
    "Utility": "实用工具",
    "Utils": "实用工具",
    "Valuables": "贵重物品",
    "Vanilla compatible": "原版兼容",
    "Vanilla Compatible": "原版兼容",
    "Vault File": "避难所文件",
    "Vehicle Parts": "车辆部件",
    "Vehicles": "载具",
    "Visual Effects": "视觉效果",
    "Visual Tweaks": "视觉调整",
    "Voicepacks": "语音包",
    "Wacky Races": "疯狂赛车",
    "Wands": "法杖",
    "Weapon": "武器",
    "Weapons": "武器",
    "Weapons & Equipment": "武器与装备",
    "Wearables": "可穿戴物",
    "Weather": "天气",
    "Wizards": "法师",
    "World": "世界",
    "World Generation": "世界生成",
    "World Race": "世界竞速",
    "Worldgen": "世界生成",
    "Worlds": "世界",
};

let passed = 0;
const failures = [];
async function test(name, fn) {
    try { await fn(); passed++; console.log('  ok   ' + name); }
    catch (e) { failures.push({ name, error: e }); console.log('  FAIL ' + name + ' -> ' + e.message); }
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const BS = String.fromCharCode(92);
const norm = s => (s || '').replace(new RegExp(BS + 's+', 'g'), ' ').trim();

function loadSite() {
    const ctx = vm.createContext({ console });
    for (const rel of ['src/locals/_registry.js', 'src/locals/thunderstore.js']) {
        vm.runInContext(readFileSync(join(ROOT, rel), 'utf8'), ctx, { filename: rel });
    }
    return vm.runInContext('SITES.find(s => s.id === "thunderstore")', ctx);
}

function boot(html, url) {
    const dom = new JSDOM('<!DOCTYPE html><html><body>' + html + '</body></html>',
        { url, runScripts: 'outside-only', pretendToBeVisual: true });
    dom.window.eval(CODE);
    return dom;
}

/* 取 <details> 区块里各 label 的文本（分区=单选、分类=勾选） */
function labels(root) {
    return [...root.querySelectorAll('.radio-group__label, .checkbox-list__label')].map(l => norm(l.textContent));
}

console.log('[jsdom · Thunderstore 固定枚举（全社区）]');

await test('静态装配：分区 55 条、分类 370 条都能由 scoped 规则产出译文（不碰 DOM）', async () => {
    const site = loadSite();
    const rules = site.scoped || [];
    const sectionRule = rules.find(r => r.include === 'Sections');
    const categoryRule = rules.find(r => r.include === 'Categories');
    assert.ok(sectionRule, '缺少 include=Sections 的上下文规则');
    assert.ok(categoryRule, '缺少 include=Categories 的上下文规则');
    /* 维护性断言：四条 scoped 规则必须引用**同一个**冻结对象，改一处即全改 */
    assert.strictEqual(rules.length, 4, 'scoped 规则数应为 4（Sections/Categories/CardPackageTags/Filters），实际 ' + rules.length);
    for (const r of rules) {
        assert.strictEqual(r.dict, rules[0].dict, '规则 ' + r.include + ' 的 dict 不是同一个对象（被复制了）');
        assert.ok(Object.isFrozen(r.dict), '共享表必须是 Object.freeze 冻结对象');
        assert.ok(r.include, '规则 ' + r.selector + ' 缺少 include 锚点');
    }
    assert.strictEqual(Object.keys(rules[0].dict).length, 398, '共享表应为 398 条（分区/分类去重 397 + 移动端抽屉标题 Filters）');
    assert.strictEqual(rules[0].dict['Filters'], '筛选器', '移动端筛选抽屉标题 Filters 词条缺失');
    /* 三条规则共用同一张枚举表：分区 55 条必须全部在内（多余的是分类/分组标题），
     * 且分区与分类规则对该键的译文必须完全一致（同一服务端枚举，不允许两套译法）。 */
    for (const key of ALL_SECTIONS) {
        assert.ok(key in sectionRule.dict, '分区缺少词条：' + key);
        assert.ok(key in categoryRule.dict, '分类规则里缺少同表枚举：' + key);
        assert.strictEqual(sectionRule.dict[key], categoryRule.dict[key], '同一枚举两套译法：' + key);
    }
    for (const c of ALL_CATEGORIES) {
        assert.ok(categoryRule.dict[c], '分类缺少词条：' + c);
        /* 品牌名（BepInEx / MelonLoader 等）译文就是原文，属显式同值，不算漏翻 */
        if (categoryRule.dict[c] === c) assert.ok(BRAND_SAME.includes(c), '分类译文等于原文但不是品牌名：' + c);
    }
    /* 分区词条只能靠 include=Sections 的规则命中：分类规则里不得出现分区专属键 */
    /* v1.0.6 之前就在 community 组里的通用列表 UI（All / Mods / Modpacks / Maps / Translations /
     * Asset Replacements）不搬动，避免回归；真正的新增分区键只能待在 scoped 规则里。 */
    const LEGACY_COMMUNITY = ['All', 'Mods', 'Modpacks', 'Maps', 'Translations', 'Asset Replacements', 'Other filters', 'Pinned', 'NSFW', 'Deprecated', 'Developer Tools', 'APIs & Libraries'];
    const exclusive = ALL_SECTIONS.filter(s => !ALL_CATEGORIES.includes(s) && !LEGACY_COMMUNITY.includes(s));
    for (const s of exclusive) {
        assert.ok(!(s in (site.dict.community || {})), '分区专用键不得进 community 全局组：' + s);
        /* 分区与分类共用同一张表；真正隔离它们的是 include 锚点 + 各自 <details>。
         * 这里要求：任何一条规则都不得缺少锚点（缺锚点 = 全局无界生效 = 会翻到 UGC）。 */
        const unanchored = [];
        for (const r of rules) {
            const has = Object.prototype.hasOwnProperty.call(r.dict || {}, s);
            if (has && !r.include) unanchored.push(r.selector);
        }
        assert.deepStrictEqual(unanchored, [], '分区键出现在无锚点上下文规则里（等于全局替换）：' + s + ' → ' + unanchored);
    }
});

await test('真实 SSR 侧栏（/c/gtfo/）：分区、分类、其他筛选全部中文化且逐条可校验', async () => {
    const dom = boot(TS_SECTIONS_GTFO, 'https://thunderstore.io/c/gtfo/');
    const d = dom.window.document;
    const filters = d.querySelector('.package-search__filters');
    const details = [...filters.querySelectorAll('details')];
    const otherBlock = details.find(x => norm(x.querySelector('summary').textContent) === '其他筛选');
    const sectionBlock = details.find(x => x !== otherBlock && !!x.querySelector('.radio-group'));
    const categoryBlock = details.find(x => x !== otherBlock && !!x.querySelector('.checkbox-list'));
    assert.ok(sectionBlock, 'Sections 标题未翻译或缺失');
    assert.ok(otherBlock, 'Other filters 标题未翻译或缺失');
    /* 分区：每个 label 都必须翻成词库里的固定译法 */
    const sectionLabels = labels(sectionBlock);
    const expectedSections = 6;
    assert.strictEqual(sectionLabels.length, expectedSections, '分区数异常：' + sectionLabels.join(' / '));
    const zhValues = Object.values(SECTION_ZH).concat(Object.values(CATEGORY_ZH));
    for (const label of sectionLabels) assert.ok(zhValues.includes(label), '分区未翻译：' + label);
    /* 分类：真实侧栏里的每一条都要出现在词库译文里 */
    if (categoryBlock) {
        for (const label of labels(categoryBlock)) {
            assert.ok(Object.values(CATEGORY_ZH).includes(label) || /^(分类|Sections|Categories)$/.test(label), '分类未翻译：' + label);
        }
        assert.deepStrictEqual(labels(otherBlock), ['已弃用', '成人内容'], '其他筛选未翻译');
    } else {
        assert.deepStrictEqual(labels(otherBlock), ['已弃用', '成人内容'], '其他筛选未翻译');
    }
    /* 页面里不得再出现英文分区名（分区专属键中任意一条） */
    const text = norm(filters.textContent);
    for (const s of ['Mods (excluding AI)', 'Mods (including AI)', 'All Mods', 'Host Only Mods', 'Vanilla Compatible Mods', 'Modpacks & Soundpacks']) {
        assert.ok(!text.includes(s), '侧栏仍含英文分区：' + s);
    }
    dom.window.close();
});

await test('真实 SSR 侧栏（/c/totally-accurate-battle-simulator/）：分区、分类、其他筛选全部中文化且逐条可校验', async () => {
    const dom = boot(TS_SECTIONS_TOTALLY_ACCURATE_BATTLE_SIMULATOR, 'https://thunderstore.io/c/totally-accurate-battle-simulator/');
    const d = dom.window.document;
    const filters = d.querySelector('.package-search__filters');
    const details = [...filters.querySelectorAll('details')];
    const otherBlock = details.find(x => norm(x.querySelector('summary').textContent) === '其他筛选');
    const sectionBlock = details.find(x => x !== otherBlock && !!x.querySelector('.radio-group'));
    const categoryBlock = details.find(x => x !== otherBlock && !!x.querySelector('.checkbox-list'));
    assert.ok(sectionBlock, 'Sections 标题未翻译或缺失');
    assert.ok(otherBlock, 'Other filters 标题未翻译或缺失');
    /* 分区：每个 label 都必须翻成词库里的固定译法 */
    const sectionLabels = labels(sectionBlock);
    const expectedSections = 4;
    assert.strictEqual(sectionLabels.length, expectedSections, '分区数异常：' + sectionLabels.join(' / '));
    const zhValues = Object.values(SECTION_ZH).concat(Object.values(CATEGORY_ZH));
    for (const label of sectionLabels) assert.ok(zhValues.includes(label), '分区未翻译：' + label);
    /* 分类：真实侧栏里的每一条都要出现在词库译文里 */
    if (categoryBlock) {
        for (const label of labels(categoryBlock)) {
            assert.ok(Object.values(CATEGORY_ZH).includes(label) || /^(分类|Sections|Categories)$/.test(label), '分类未翻译：' + label);
        }
        assert.deepStrictEqual(labels(otherBlock), ['已弃用', '成人内容'], '其他筛选未翻译');
    } else {
        assert.deepStrictEqual(labels(otherBlock), ['已弃用', '成人内容'], '其他筛选未翻译');
    }
    /* 页面里不得再出现英文分区名（分区专属键中任意一条） */
    const text = norm(filters.textContent);
    for (const s of ['Mods (excluding AI)', 'Mods (including AI)', 'All Mods', 'Host Only Mods', 'Vanilla Compatible Mods', 'Modpacks & Soundpacks']) {
        assert.ok(!text.includes(s), '侧栏仍含英文分区：' + s);
    }
    dom.window.close();
});

await test('真实 SSR 侧栏（/c/inscryption/）：分区、分类、其他筛选全部中文化且逐条可校验', async () => {
    const dom = boot(TS_SECTIONS_INSCRYPTION, 'https://thunderstore.io/c/inscryption/');
    const d = dom.window.document;
    const filters = d.querySelector('.package-search__filters');
    const details = [...filters.querySelectorAll('details')];
    const otherBlock = details.find(x => norm(x.querySelector('summary').textContent) === '其他筛选');
    const sectionBlock = details.find(x => x !== otherBlock && !!x.querySelector('.radio-group'));
    const categoryBlock = details.find(x => x !== otherBlock && !!x.querySelector('.checkbox-list'));
    assert.ok(sectionBlock, 'Sections 标题未翻译或缺失');
    assert.ok(otherBlock, 'Other filters 标题未翻译或缺失');
    /* 分区：每个 label 都必须翻成词库里的固定译法 */
    const sectionLabels = labels(sectionBlock);
    const expectedSections = 11;
    assert.strictEqual(sectionLabels.length, expectedSections, '分区数异常：' + sectionLabels.join(' / '));
    const zhValues = Object.values(SECTION_ZH).concat(Object.values(CATEGORY_ZH));
    for (const label of sectionLabels) assert.ok(zhValues.includes(label), '分区未翻译：' + label);
    /* 分类：真实侧栏里的每一条都要出现在词库译文里 */
    if (categoryBlock) {
        for (const label of labels(categoryBlock)) {
            assert.ok(Object.values(CATEGORY_ZH).includes(label) || /^(分类|Sections|Categories)$/.test(label), '分类未翻译：' + label);
        }
        assert.deepStrictEqual(labels(otherBlock), ['已弃用', '成人内容'], '其他筛选未翻译');
    } else {
        assert.deepStrictEqual(labels(otherBlock), ['已弃用', '成人内容'], '其他筛选未翻译');
    }
    /* 页面里不得再出现英文分区名（分区专属键中任意一条） */
    const text = norm(filters.textContent);
    for (const s of ['Mods (excluding AI)', 'Mods (including AI)', 'All Mods', 'Host Only Mods', 'Vanilla Compatible Mods', 'Modpacks & Soundpacks']) {
        assert.ok(!text.includes(s), '侧栏仍含英文分区：' + s);
    }
    dom.window.close();
});

await test('真实 SSR 侧栏（/c/lethal-company/）：分区、分类、其他筛选全部中文化且逐条可校验', async () => {
    const dom = boot(TS_SECTIONS_LETHAL_COMPANY, 'https://thunderstore.io/c/lethal-company/');
    const d = dom.window.document;
    const filters = d.querySelector('.package-search__filters');
    const details = [...filters.querySelectorAll('details')];
    const otherBlock = details.find(x => norm(x.querySelector('summary').textContent) === '其他筛选');
    const sectionBlock = details.find(x => x !== otherBlock && !!x.querySelector('.radio-group'));
    const categoryBlock = details.find(x => x !== otherBlock && !!x.querySelector('.checkbox-list'));
    assert.ok(sectionBlock, 'Sections 标题未翻译或缺失');
    assert.ok(otherBlock, 'Other filters 标题未翻译或缺失');
    /* 分区：每个 label 都必须翻成词库里的固定译法 */
    const sectionLabels = labels(sectionBlock);
    const expectedSections = 6;
    assert.strictEqual(sectionLabels.length, expectedSections, '分区数异常：' + sectionLabels.join(' / '));
    const zhValues = Object.values(SECTION_ZH).concat(Object.values(CATEGORY_ZH));
    for (const label of sectionLabels) assert.ok(zhValues.includes(label), '分区未翻译：' + label);
    /* 分类：真实侧栏里的每一条都要出现在词库译文里 */
    if (categoryBlock) {
        for (const label of labels(categoryBlock)) {
            assert.ok(Object.values(CATEGORY_ZH).includes(label) || /^(分类|Sections|Categories)$/.test(label), '分类未翻译：' + label);
        }
        assert.deepStrictEqual(labels(otherBlock), ['已弃用', '成人内容'], '其他筛选未翻译');
    } else {
        assert.deepStrictEqual(labels(otherBlock), ['已弃用', '成人内容'], '其他筛选未翻译');
    }
    /* 页面里不得再出现英文分区名（分区专属键中任意一条） */
    const text = norm(filters.textContent);
    for (const s of ['Mods (excluding AI)', 'Mods (including AI)', 'All Mods', 'Host Only Mods', 'Vanilla Compatible Mods', 'Modpacks & Soundpacks']) {
        assert.ok(!text.includes(s), '侧栏仍含英文分区：' + s);
    }
    dom.window.close();
});

await test('GTFO：分区与分类里的 Developer Tools 各自翻译，卡片徽标翻、mod 标题/作者/描述不翻', async () => {
    const html = TS_SECTIONS_GTFO +
        '<div class="package-search__search-params"><div class="package-search__results"><p class="package-count"><b>1-20 </b>&nbsp;of&nbsp;<b>922</b>&nbsp;result<!-- -->s</p></div></div>' +
        '<div class="package-search__packages">' + TS_CARD_UGC + '</div>';
    const dom = boot(html, 'https://thunderstore.io/c/gtfo/?section=all');
    const d = dom.window.document;
    const details = [...d.querySelectorAll('.package-search__filters details')];
    const sectionBlock = details.find(x => norm(x.querySelector('summary').textContent) === '分区');
    const categoryBlock = details.find(x => norm(x.querySelector('summary').textContent) === '分类');
    assert.ok(labels(sectionBlock).includes('开发者工具'), '分区 Developer Tools 未翻译：' + labels(sectionBlock));
    assert.ok(labels(categoryBlock).includes('开发者工具'), '分类 Developer Tools 未翻译：' + labels(categoryBlock));
    assert.ok(labels(sectionBlock).includes('模组（不含 AI）'), 'Mods (excluding AI) 未翻译');
    assert.ok(labels(sectionBlock).includes('模组（含 AI）'), 'Mods (including AI) 未翻译');
    assert.ok(labels(sectionBlock).includes('远征序列'), 'Rundowns 分区未翻译');
    assert.ok(!labels(categoryBlock).includes('DataBlocks (MTFO)'), '分类 DataBlocks (MTFO) 未翻成中文');
    assert.ok(labels(categoryBlock).includes('数据块（MTFO）'), '分类 DataBlocks (MTFO) 译文缺失');
    const tags = [...d.querySelectorAll('.card-package__tags .tag')].map(t => norm(t.textContent));
    assert.deepStrictEqual(tags, ['库', '模组'], '卡片分类徽标未翻译：' + tags);
    assert.strictEqual(norm(d.querySelector('.card-package__title').textContent), 'Libraries', 'mod 标题被翻译');
    assert.strictEqual(norm(d.querySelector('.card-package__link').textContent), 'Mods', '作者名被翻译');
    assert.strictEqual(norm(d.querySelector('.card-package__description').textContent), 'Libraries Mods Modpacks Tools Audio — 用户描述原样。', '描述被翻译');
    assert.strictEqual(norm(d.querySelector('.package-count').textContent), '1-20，共 922 条结果');
    assert.strictEqual(norm(d.querySelector('.card-package__prefix').textContent), '作者');
    dom.window.close();
});

await test('同名 UGC 负向：分区/分类同串出现在正文、<h1>、描述、markdown、输入值、作者名时一律不动', async () => {
    const ugc = [
        '<p id="ugc-body">Libraries Misc Tools Audio Modpacks Mods Developer Tools</p>',
        '<h1 id="ugc-title">Developer Tools</h1>',
        '<div class="package-description" id="ugc-desc">Maps Gameplay Translations</div>',
        '<div class="markdown" id="ugc-md">Vehicles Weather</div>',
        '<div class="changelog" id="ugc-log">Rundowns Rebalance</div>',
        '<div class="card-package__author"><span class="card-package__prefix">by</span><a id="ugc-author" class="link card-package__link" href="/c/lethal-company/p/Tools/">Tools</a></div>',
        '<input id="ugc-input" value="Developer Tools">',
    ].join('');
    const dom = boot(TS_SECTIONS_LETHAL_COMPANY + ugc, 'https://thunderstore.io/c/lethal-company/');
    const d = dom.window.document;
    assert.strictEqual(d.getElementById('ugc-body').textContent, 'Libraries Misc Tools Audio Modpacks Mods Developer Tools');
    assert.strictEqual(d.getElementById('ugc-title').textContent, 'Developer Tools', '<h1> 标题被翻译');
    assert.strictEqual(d.getElementById('ugc-desc').textContent, 'Maps Gameplay Translations');
    assert.strictEqual(d.getElementById('ugc-md').textContent, 'Vehicles Weather');
    assert.strictEqual(d.getElementById('ugc-log').textContent, 'Rundowns Rebalance');
    assert.strictEqual(d.getElementById('ugc-author').textContent, 'Tools', '作者名被翻译');
    assert.strictEqual(d.getElementById('ugc-input').value, 'Developer Tools', '输入值被改写');
    dom.window.close();
});

await test('动态插入：后插入的 <details> 枚举被 MutationObserver 接管，重复扫描不累积替换', async () => {
    const dom = boot('<div id="late"></div>', 'https://thunderstore.io/c/gtfo/');
    const d = dom.window.document;
    const api = dom.window.__MODS_ZH__;
    d.getElementById('late').insertAdjacentHTML('afterbegin', TS_SECTIONS_TOTALLY_ACCURATE_BATTLE_SIMULATOR);
    await wait(300);
    const text = norm(d.getElementById('late').textContent);
    for (const s of ['模组', '整合包', '开发工具与库']) assert.ok(text.includes(s), '动态插入后仍缺译文：' + s);
    assert.ok(!text.includes('Dev Tools and Libraries'), '动态插入的分区未翻译');
    const before = api.stats.nodes;
    api.rescan(); api.rescan();
    await wait(150);
    assert.strictEqual(api.stats.nodes, before, '重复扫描产生了新写入（非幂等）');
    assert.ok(!text.includes('模组模组'));
    dom.window.close();
});

await test('SPA 切社区 gtfo → TABS → gtfo：按新社区重装配，关闭开关逐字还原、再开启复原', async () => {
    const dom = boot(TS_SECTIONS_GTFO, 'https://thunderstore.io/c/gtfo/');
    const d = dom.window.document;
    const api = dom.window.__MODS_ZH__;
    const sidebar = d.querySelector('.package-search__filters');
    const snapshot = norm(sidebar.textContent);
    const parser = new dom.window.DOMParser();
    const tabsFilters = parser.parseFromString(TS_SECTIONS_TOTALLY_ACCURATE_BATTLE_SIMULATOR, 'text/html')
        .querySelector('.package-search__filters');
    const gtfoFilters = parser.parseFromString(TS_SECTIONS_GTFO, 'text/html')
        .querySelector('.package-search__filters');
    sidebar.innerHTML = tabsFilters.innerHTML;
    dom.window.history.pushState({}, '', '/c/totally-accurate-battle-simulator/');
    await wait(320);
    assert.ok(norm(sidebar.textContent).includes('开发工具与库'), 'SPA 切社区后 TABS 分区未翻译');
    assert.strictEqual(sidebar.textContent.includes('Dev Tools and Libraries'), false);
    dom.window.history.pushState({}, '', '/c/gtfo/');
    await wait(120);
    sidebar.innerHTML = gtfoFilters.innerHTML;
    await wait(320);
    assert.strictEqual(norm(sidebar.textContent), snapshot, 'SPA 往返后译文与初次加载不一致');
    api.setEnabled(false);
    const off = norm(sidebar.textContent);
    for (const s of ['Sections', 'Mods (excluding AI)', 'Mods (including AI)', 'Rundowns', 'Developer Tools', 'Categories', 'Other filters', 'Deprecated', 'NSFW']) {
        assert.ok(off.includes(s), '关闭后未还原：' + s);
    }
    assert.ok(!off.includes('分区') && !off.includes('其他筛选'), '关闭后仍有中文：' + off.slice(0, 200));
    api.setEnabled(true);
    await wait(150);
    assert.strictEqual(norm(sidebar.textContent), snapshot, '再次开启后未复原');
    dom.window.close();
});

await test('分类徽标与同名 mod 标题同页共存：徽标翻、标题不翻，开关往返逐字还原', async () => {
    const dom = boot(TS_CARD_UGC, 'https://thunderstore.io/c/lethal-company/');
    const d = dom.window.document;
    const tags = [...d.querySelectorAll('.card-package__tags .tag')];
    assert.strictEqual(norm(tags[0].textContent), '库');
    assert.strictEqual(norm(tags[1].textContent), '模组');
    assert.strictEqual(norm(d.querySelector('.card-package__title').textContent), 'Libraries');
    const api = dom.window.__MODS_ZH__;
    api.setEnabled(false);
    assert.strictEqual(norm(tags[0].textContent), 'Libraries', '徽标未还原');
    api.setEnabled(true);
    assert.strictEqual(norm(tags[0].textContent), '库');
    dom.window.close();
});

console.log('');
console.log('[jsdom · Thunderstore 固定枚举] ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) {
    for (const f of failures) console.error('\n--- ' + f.name + '\n' + (f.error && f.error.stack || f.error));
    process.exit(1);
}
