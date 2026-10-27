#!/usr/bin/env node
/* coverage.mjs —— 词条覆盖率体检
 *
 * 输入：一份纯文本快照（每行一条站点 UI 字符串，通常是 tools/collect-ui-text.js
 *       在真实页面导出的结果），以及站点 id。
 * 输出：命中/未命中统计 + 未命中的原文清单（可直接补进 locals）。
 *
 * 用法：node tools/coverage.mjs thunderstore docs/evidence/thunderstore.txt
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [siteId, file] = process.argv.slice(2);

if (!siteId || !file) {
    console.error('用法: node tools/coverage.mjs <site-id> <snapshot.txt> [--page <页型>]');
    process.exit(2);
}

const ctx = vm.createContext({ console });
for (const rel of ['src/locals/_registry.js', 'src/locals/thunderstore.js', 'src/locals/nexus.js']) {
    vm.runInContext(readFileSync(join(ROOT, rel), 'utf8'), ctx, { filename: rel });
}

const site = vm.runInContext(
    'SITES.find(s => s.id === ' + JSON.stringify(siteId) + ')',
    ctx
);
if (!site) {
    console.error('未知站点 id: ' + siteId);
    process.exit(2);
}

/* 默认口径：该站点所有分组的并集（用于找缺口）。
 * 加 --page <页型> 后只装配运行期真实会加载的分组：global + alias 共享页型 + 该页型，
 * 这样快照命中数才等价于“该页型下真的翻出来了”，而不是合并词库的静态覆盖。 */
const pageArgIdx = process.argv.indexOf('--page');
const page = pageArgIdx > 0 ? process.argv[pageArgIdx + 1] : '';
let scope;
if (page) {
    const alias = site.alias && site.alias[page];
    scope = [['global', site.dict.global]];
    if (alias && site.dict[alias]) scope.push([alias, site.dict[alias]]);
    if (site.dict[page]) scope.push([page, site.dict[page]]);
} else {
    scope = Object.entries(site.dict);
}

const dict = new Map();
for (const [, group] of scope) {
    for (const [k, v] of Object.entries(group)) dict.set(k, v);
}

/* 页型上下文规则（site.scoped）：运行期只有落在 rule.selector 子树里才会命中。
 * 这里把它们算进「该页型可命中集合」，否则分类标签、时间枚举、chip 这类
 * 只允许在固定 UI 上下文里翻的词条会被误报成缺口。 */
const scopedRules = (site.scoped || []).filter(r => !page || !r.pages || r.pages === 'all' || r.pages.indexOf(page) !== -1);
const scopedDict = new Map();
const scopedPatterns = [];
for (const rule of scopedRules) {
    for (const [k, v] of Object.entries(rule.dict || {})) scopedDict.set(k, v);
    for (const p of rule.patterns || []) scopedPatterns.push(p);
    // rawPatterns 按原始文本匹配（chip 的 "Title: <值>" 等），快照行已归一化空白，
    // 这里用同一套规则判定"该页型能不能翻出来"。
    for (const p of rule.rawPatterns || []) scopedPatterns.push(p);
}

const CJK = /[\u4e00-\u9fff]/;
const lines = readFileSync(resolve(ROOT, file), 'utf8')
    .split(/\r?\n/)
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(s => s && !s.startsWith('#'));

let hit = 0;
const missed = [];

for (const key of lines) {
    if (CJK.test(key)) { hit++; continue; }               // 已是中文，不算缺口
    if (/^[\d\s.,:%+\-/()]+$/.test(key)) { hit++; continue; } // 纯数字
    let out = dict.get(key) || scopedDict.get(key);
    if (!out) {
        for (const [re, to] of (site.patterns || []).concat(scopedPatterns)) {
            if (!re.test(key)) continue;
            const r = key.replace(re, to);
            if (r && r !== key) { out = r; break; }
        }
    }
    if (out) hit++;
    else missed.push(key);
}

const total = lines.length;
const pct = total ? (hit / total * 100).toFixed(1) : '0.0';
console.log('站点     : ' + siteId);
console.log('词条口径 : ' + (page ? '页型 ' + page + '（' + scope.map(s => s[0]).join(' + ') + '）' : '全部分组并集'));
console.log('上下文规则: ' + scopedRules.length + ' 条（' + (page ? '按页型装配' : '全部页型并集') + '）');
console.log('口径说明 : 静态规则匹配（按页型展平 dict / patterns / scoped），不验证 selector 是否命中、');
console.log('           ignore 是否生效、真实 DOM 结构与弹层是否出现；它只能证明"词条存在且可被规则产出译文"，');
console.log('           不能当作页面运行覆盖。运行期覆盖以 test/browser.test.mjs 的真实 DOM 用例与实机注入复验为准。');
console.log('快照行数 : ' + total);
console.log('命中     : ' + hit + ' (' + pct + '%)');
console.log('未命中   : ' + missed.length);

if (missed.length) {
    console.log('\n未命中清单：');
    for (const m of missed) console.log('  - ' + m);
    process.exitCode = 1;
}
