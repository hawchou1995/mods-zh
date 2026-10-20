/* collect-ui-text.js —— 在真实页面控制台导出 UI 文本快照
 *
 * 用法：
 *   1. 打开目标页面（登录后效果更全）
 *   2. F12 → Console → 粘贴本文件全部内容 → 回车
 *   3. 控制台会打印一段文本，同时自动下载 <host>-<path>.txt
 *
 * 导出的每行一条文本，可直接喂给：
 *   node tools/coverage.mjs <site-id> <快照文件>
 * 算词条缺口。
 *
 * 过滤口径与脚本运行期一致：短文本、去重、剔除纯数字、剔除已在中文的节点、
 * 剔除 Cookiebot 弹窗与 UGC（描述 / 评论 / 代码 / 输入框）。
 */
(() => {
    const IGNORE = [
        '#CybotCookiebotDialog', '[id^="Cybot"]',
        'script', 'style', 'noscript', 'code', 'pre', 'kbd', 'textarea',
        '[contenteditable="true"]',
        '[class*="markdown"]', '[class*="description"]', '[class*="Description"]',
        '[class*="comment"]', '[class*="Comment"]', '[class*="package-name"]',
        '[class*="author"]', '[class*="Author"]', '[class*="mod-title"]',
    ].join(',');

    const MAX = 44;
    const CJK = /[\u4e00-\u9fff]/;
    const NUM = /^[\s\d.,:%+\-/()（）]+$/;

    const visible = (el) => {
        if (el.closest(IGNORE)) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    };

    const short = (el, getter) => {
        const t = (getter(el) || '').replace(/\s+/g, ' ').trim();
        if (!t || t.length < 2 || t.length > MAX) return null;
        if (CJK.test(t) || NUM.test(t)) return null;
        return t;
    };

    const texts = new Set();
    document.querySelectorAll('a,button,h1,h2,h3,h4,label,th,dt,dd,span,li,div,td,summary,option').forEach(el => {
        if (!visible(el) || el.children.length > 2) return;
        const t = short(el, e => e.innerText);
        if (t) texts.add(t);
    });

    const attrs = new Set();
    document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el => {
        if (!visible(el)) return;
        ['placeholder', 'aria-label', 'title'].forEach(k => {
            const v = el.getAttribute(k);
            if (!v) return;
            const t = short(el, () => v);
            if (t) attrs.add(k + '\t' + t);
        });
    });

    const lines = [
        '# ' + location.hostname + location.pathname + ' —— ' + new Date().toISOString(),
        '# 抓取自 collect-ui-text.js：文本节点在前，属性值（tab 分隔"属性名\t值"）在后',
        '',
        ...[...texts].sort(),
        '',
        '# 属性',
        ...[...attrs].sort(),
    ];

    const out = lines.join('\n');
    console.log(out);

    try {
        const blob = new Blob([out], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = location.hostname.replace(/[^\w.-]/g, '_') + '.txt';
        a.click();
        URL.revokeObjectURL(a.href);
        console.log('%c已下载快照文件，行数：' + lines.length, 'color:#1a7f37');
    } catch (e) {
        console.warn('自动下载失败，请手动复制上面的文本');
    }
})();
