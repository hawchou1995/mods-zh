/* fake-dom.mjs —— 测试用最小 DOM
 *
 * 只实现引擎实际用到的能力：
 *   文本节点遍历（createTreeWalker SHOW_TEXT）、属性读写、
 *   closest / querySelectorAll（仅支持本脚本用到的选择器形态）、MutationObserver 桩
 * 选择器支持：#id、[attr]、[attr="v"]、[attr^="v"]、[class*="v"]、裸标签名，逗号分隔的并集
 */

export class TextNode {
    constructor(value, parent) {
        this.nodeType = 3;
        this.nodeValue = value;
        this.parentElement = parent || null;
    }
}

function matchToken(el, token) {
    const t = token.trim();
    if (!t) return false;
    if (t === '*') return true;
    if (t === '*') return true;
    if (t.startsWith('#')) return (el.getAttribute('id') || '') === t.slice(1);
    const attrRe = /^\[([\w-]+)(?:([*^$]?=)"([^"]*)")?\]$/;
    const m = t.match(attrRe);
    if (m) {
        const [, name, op, val] = m;
        const cur = el.getAttribute(name);
        if (op === undefined) return cur !== null;
        if (cur === null) return false;
        if (op === '=') return cur === val;
        if (op === '*=') return cur.indexOf(val) !== -1;
        if (op === '^=') return cur.indexOf(val) === 0;
        if (op === '$=') return cur.lastIndexOf(val) === cur.length - val.length;
    }
    return el.tagName === t.toUpperCase();
}

function matches(el, selector) {
    if (!el || el.nodeType !== 1) return false;
    return selector.split(',').some(tok => matchToken(el, tok));
}

export class Element {
    constructor(tag, attrs) {
        this.nodeType = 1;
        this.tagName = tag.toUpperCase();
        this.attrs = new Map(Object.entries(attrs || {}));
        this.childNodes = [];
        this.parentElement = null;
        this.ownerDocument = null;
        this.isContentEditable = false;
    }

    appendChild(node) {
        node.parentElement = this;
        if (node.ownerDocument === undefined || node.ownerDocument === null) node.ownerDocument = this.ownerDocument;
        this.childNodes.push(node);
        return node;
    }

    addText(text) {
        return this.appendChild(new TextNode(text, this));
    }

    getAttribute(name) {
        return this.attrs.has(name) ? this.attrs.get(name) : null;
    }

    setAttribute(name, value) {
        this.attrs.set(name, String(value));
    }

    closest(selector) {
        let el = this;
        while (el) {
            if (matches(el, selector)) return el;
            el = el.parentElement;
        }
        return null;
    }

    querySelectorAll(selector) {
        const out = [];
        const walk = (node) => {
            for (const child of node.childNodes) {
                if (child.nodeType !== 1) continue;
                if (matches(child, selector)) out.push(child);
                walk(child);
            }
        };
        walk(this);
        return out;
    }

    /** 渲染为纯文本（测试断言用） */
    get textContent() {
        let s = '';
        for (const c of this.childNodes) {
            s += c.nodeType === 3 ? c.nodeValue : c.textContent;
        }
        return s;
    }
}

export function createDocument() {
    const body = new Element('body');
    const doc = {
        body,
        createTreeWalker(root) {
            const stack = [];
            const collect = (node) => {
                for (const c of node.childNodes) {
                    if (c.nodeType === 3) stack.push(c);
                    else if (c.nodeType === 1) collect(c);
                }
            };
            collect(root || body);
            let i = 0;
            return { nextNode: () => (i < stack.length ? stack[i++] : null) };
        },
        querySelectorAll(sel) { return body.querySelectorAll(sel); },
        addEventListener() { },
    };
    body.ownerDocument = doc;
    return doc;
}

/** 挂载子树并回填 ownerDocument */
export function mount(parent, el, doc) {
    const fix = (node) => {
        node.ownerDocument = doc;
        for (const c of node.childNodes) if (c.nodeType === 1) fix(c);
    };
    fix(el);
    parent.appendChild(el);
    return el;
}

export class MutationObserverStub {
    constructor(cb) { this.cb = cb; }
    observe() { }
    disconnect() { }
}
