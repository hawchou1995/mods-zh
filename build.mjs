#!/usr/bin/env node
/* build.mjs —— 把 src/ 拼成单文件 userscript
 *
 * 产物：dist/mods-zh.user.js（Greasyfork 与 GitHub Release 都用这一份）
 * 约定：版本号唯一来源是 package.json，userscript 头部与运行时 VERSION 都从它派生
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

const PARTS = [
    'src/locals/_registry.js',
    'src/locals/thunderstore.js',
    'src/locals/nexus.js',
    'src/engine.js',
    'src/bootstrap.js',
];

const HEADER = `// ==UserScript==
// @name         Thunderstore & Nexus Mods 中文化
// @name:en      Thunderstore & Nexus Mods Chinese
// @namespace    https://github.com/hawchou1995/mods-zh
// @version      ${pkg.version}
// @description  中文化 Thunderstore 与 Nexus Mods 的界面元素：导航、按钮、筛选器、分类、语言、排序、下载区、面包屑、相对时间与日期。不翻译模组名称、作者、描述与评论。问题反馈：https://qingju.me/
// @description:en  Localize Thunderstore and Nexus Mods UI into Simplified Chinese. Dynamic mod content stays untranslated. Feedback: https://qingju.me/
// @author       hawchou1995
// @license      GPL-3.0
// @icon         https://www.google.com/s2/favicons?sz=64&domain=thunderstore.io
// @match        https://thunderstore.io/*
// @match        https://www.nexusmods.com/*
// @match        https://nexusmods.com/*
// @match        https://users.nexusmods.com/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_openInTab
// @homepageURL  https://github.com/hawchou1995/mods-zh
// @supportURL   https://github.com/hawchou1995/mods-zh/issues
// @downloadURL  https://raw.githubusercontent.com/hawchou1995/mods-zh/main/dist/mods-zh.user.js
// @updateURL    https://raw.githubusercontent.com/hawchou1995/mods-zh/main/dist/mods-zh.user.js
// ==/UserScript==
`;

function read(rel) {
    const p = resolve(ROOT, rel);
    if (!existsSync(p)) throw new Error('缺少源文件：' + rel);
    return readFileSync(p, 'utf8').replace(/\s+$/, '');
}

const body = PARTS.map(read).join('\n\n');

const out = [
    HEADER,
    '(function () {',
    "    'use strict';",
    '',
    '    const VERSION = ' + JSON.stringify(pkg.version) + ';',
    '',
    body,
    '})();',
    '',
].join('\n');

const distDir = join(ROOT, 'dist');
mkdirSync(distDir, { recursive: true });
const distPath = join(distDir, 'mods-zh.user.js');
writeFileSync(distPath, out, 'utf8');

const lines = out.split('\n').length;
console.log('built  ' + distPath);
console.log('bytes  ' + Buffer.byteLength(out, 'utf8'));
console.log('lines  ' + lines);
console.log('version ' + pkg.version);
