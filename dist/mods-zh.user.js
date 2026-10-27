// ==UserScript==
// @name         Thunderstore & Nexus Mods 中文化
// @name:en      Thunderstore & Nexus Mods Chinese
// @namespace    https://github.com/hawchou1995/mods-zh
// @version      1.0.6
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

(function () {
    'use strict';

    const VERSION = "1.0.6";

/* =============================================================================
 * _registry.js —— 站点注册表
 *
 * 每个站点模块把自身对象 push 进 SITES，engine.js 启动时按 hostname 匹配。
 * 站点对象约定：
 *   {
 *     id:     唯一标识
 *     name:   人类可读名称（菜单里显示）
 *     match:  hostname 正则
 *     ignore: 忽略选择器字符串（UGC / 代码 / 用户输入区域），全站生效
 *     ignorePages: 可选 { 页型: 选择器 }，只在对应页型追加的忽略选择器
 *             （同一 DOM 结构在不同页型分属 UGC 与固定 UI 时用，如 Thunderstore 面包屑末段）
 *     detect(pathname, search): 返回页型字符串
 *     namePrefixes: 可选 [ { selector, re, from, to } ]，页头「固定前缀 + 动态名称」规则：
 *             只替换前缀片段，其余文本节点整节点保护（作者名不会被当界面词条翻译）
 *     alias:  可选 { 页型: 共享页型 }，该页型先并入共享页型的词条，再叠加自身词条
 *             （例：Thunderstore 作者列表页 author 复用社区列表页 community）
 *     dict:   { 页型: { 英文: 中文 } }，键 'global' 表示全站生效
 *     patterns: [[RegExp, string | Function], ...] 全站生效的正则组
 *   }
 *
 * 词条约定：
 *   - 只收 UI 元素与站点枚举标签（分类、语言、排序、按钮、表单、状态）
 *   - 不收 mod 名称、作者名、描述正文、评论、文件名
 *   - 键必须按站点 DOM 里真实出现的完整文本抄录（出处见 docs/evidence/）
 * ========================================================================== */

const SITES = [];

/* =============================================================================
 * thunderstore.js —— thunderstore.io 词条
 *
 * 取证来源（2026-10-20 抓取，文本见 docs/evidence/thunderstore-*.txt）：
 *   首页           https://thunderstore.io/
 *   社区包列表     https://thunderstore.io/c/lethal-company/
 *   社区总览       https://thunderstore.io/communities/
 *   包详情页       https://thunderstore.io/c/lethal-company/p/BepInEx/BepInExPack/
 * ========================================================================== */

SITES.push({
    id: 'thunderstore',
    name: 'Thunderstore',
    match: /(^|\.)thunderstore\.io$/,

    /* 忽略区域：mod 名称 / 作者名 / 描述正文 / 代码块 / 用户输入
     * Thunderstore 前端为 React，类名是编译哈希，因此按语义类名片段与标签名过滤，
     * 另外用 role/lang 兜底。命中即整棵子树跳过。 */
    ignore: [
        'pre', 'code', 'kbd', 'textarea', '[contenteditable="true"]',
        '[class*="markdown"]', '[class*="Markdown"]',
        /* 模组名/包名属 UGC：即使与界面词条同串（例如模组就叫 Libraries）也不翻 */
        '[class*="package-name"]', '[class*="PackageName"]', '[class*="card-package__title"]',
        '[class*="author"]', '[class*="Author"]',
        '[class*="description"]', '[class*="Description"]',
        '[class*="changelog"]', '[class*="Changelog"]',
        'script', 'style', 'noscript',
    ].join(','),

    /* 面包屑末段是非链接 <span class="breadcrumbs__segment">，同一个 class 有两种含义：
     *   作者页 → 作者名、包详情 → 包名、社区页 → 社区/游戏名：UGC，整棵跳过；
     *   社区总览 /communities/ → "Communities"、上传页 /package/create/ → "Upload"、
     *   工具页 /tools/markdown-preview|manifest-v1-validator/ → 同名固定 UI：必须翻译。
     * 因此只在名称型页型上加这条保护，不做全局 ignore（全局会让上面几页退回英文）。
     * 中间层级的固定项（Communities / 社区名）是 <a>，不在保护范围内。 */
    ignorePages: {
        author: 'span.breadcrumbs__segment',
        package: 'span.breadcrumbs__segment',
        community: 'span.breadcrumbs__segment',
    },

    /* 作者列表页 /c/<社区>/p/<作者>/ 的筛选器、展示控件、排序与卡片外壳
     * 与社区列表页是同一套组件（PackageSearch），词条直接复用 community 组。 */
    /* 页头“Mods uploaded by <作者名>”：React 注释拆成两个文本节点，
     * 作者名可能是 Misc / Tools / All 这类与界面词条同串的值（实测 /c/riskofrain2/p/Misc/），
     * 只翻前缀，名称节点整节点保护。单文本节点形态同样只替换前缀片段。 */
    namePrefixes: [
        { selector: '.page-header__heading', re: /^(?:Mods uploaded by|上传者)\s+(.+)$/, from: 'Mods uploaded by', to: '上传者' },
    ],

    alias: { author: 'community' },

    detect(path) {
        if (path === '/' || path === '') return 'home';
        if (path.indexOf('/communities') === 0) return 'communities';
        if (path.indexOf('/package/create') === 0) return 'upload';
        // 作者列表页：/c/<社区>/p/<作者>/（无包名段）。此前落到 global，
        // 导致筛选器与卡片徽标只剩 global 词条可用。
        if (/^\/c\/[^/]+\/p\/[^/]+\/?$/.test(path)) return 'author';
        // 包相关页：/c/<社区>/p/<作者>/<包名>[/required|/wiki|/changelog|/versions|/source|/dependants]
        if (/^\/c\/[^/]+\/p\/[^/]+\/[^/]+\//.test(path) ||
            /^\/c\/[^/]+\/p\/[^/]+\/[^/]+$/.test(path)) return 'package';
        // 社区页与其包列表
        if (/^\/c\/[^/]+\/(packages)?$/.test(path)) return 'community';
        return 'global';
    },

    dict: {
        /* ---------------- 全站：顶栏 / 页脚 / 通用按钮 ---------------- */
        global: {
            'Communities': '社区',
            'Upload package': '上传包',
            'Search Mods...': '搜索模组…',
            'Search mods': '搜索模组',
            'Search': '搜索',
            'Developers': '开发者',
            'Switch to legacy': '切换到旧版',
            'Get Manager': '获取管理器',
            'Upload': '上传',
            'Teams': '团队',
            'Log Out': '退出登录',
            'Last updated': '最后更新',
            'Mods': '模组',
            'Download': '下载',
            'Details': '详情',
            'Categories': '分类',
            'Wiki': 'Wiki',
            'Sign in': '登录',
            'Sign up': '注册',
            'Log in': '登录',
            'Logout': '退出登录',
            'Settings': '设置',
            'Loading...': '加载中…',
            'Something went wrong': '出错了',
            'Log In': '登录',
            'Home': '首页',
            'API Docs': 'API 文档',
            'API Documentation': 'API 文档',
            'Package Format Docs': '软件包格式文档',
            'Manifest Validator': '清单校验器',
            'Markdown Preview': 'Markdown 预览',
            'Contact Us': '联系我们',
            'Privacy Policy': '隐私政策',
            'News': '新闻',
            'GitHub': 'GitHub',
            'Close': '关闭',
            'Next': '下一页',
            'Pagination': '分页',
            'Last Updated': '最后更新',
            'Get Thunderstore Mod Manager App': '获取 Thunderstore Mod Manager 应用',
            'Header': '页眉',
            'Main': '主要内容',
            'Menu': '菜单',
            'Close menu': '关闭菜单',
            'Back to previous menu': '返回上级菜单',
            'Mobile main menu': '移动端主菜单',
            'Mobile developer menu': '移动端开发者菜单',
            'Developer links': '开发者链接',
            'Invite link to Thunderstores Discord server': '邀请加入 Thunderstore Discord 服务器',
            'Link to Thunderstores Github': 'Thunderstore GitHub 链接',
            'This page is open source, link to Thunderstore UIs Github page': '本页面为开源项目，查看 Thunderstore UI 的 GitHub 页面',
            'Toggle options': '切换选项',
            'open-source ❤': '开源 ❤',
            'Download Thunderstore Mod Manager for Windows to easily install, update, and manage your mods.':
                '下载 Windows 版 Thunderstore 模组管理器，轻松安装、更新和管理你的模组。',
            'Log In': '登录',
            'Home': '首页',
            'API Docs': 'API 文档',
            'API Documentation': 'API 文档',
            'Package Format Docs': '软件包格式文档',
            'Manifest Validator': '清单校验器',
            'Markdown Preview': 'Markdown 预览',
            'Contact Us': '联系我们',
            'Privacy Policy': '隐私政策',
            'News': '新闻',
            'GitHub': 'GitHub',
            'Get Thunderstore Mod Manager App': '获取 Thunderstore Mod Manager 应用',
            'Header': '页眉',
            'Main': '主要内容',
            'Menu': '菜单',
            'Close menu': '关闭菜单',
            'Back to previous menu': '返回上级菜单',
            'Mobile main menu': '移动端主菜单',
            'Mobile developer menu': '移动端开发者菜单',
            'Developer links': '开发者链接',
            'Invite link to Thunderstores Discord server': '邀请加入 Thunderstore Discord 服务器',
            'Link to Thunderstores Github': 'Thunderstore GitHub 链接',
            'This page is open source, link to Thunderstore UIs Github page': '本页面为开源项目，查看 Thunderstore UI 的 GitHub 页面',
            'Toggle options': '切换选项',
            'open-source ❤': '开源 ❤',
            'Download Thunderstore Mod Manager for Windows to easily install, update, and manage your mods.':
                '下载 Windows 版 Thunderstore 模组管理器，轻松安装、更新和管理你的模组。',
        },

        /* ---------------- 首页 ---------------- */
        home: {
            'The Mod Database': '模组数据库',
            'What are you playing today?': '今天玩点什么？',
            'Choose from over 110,000 mods across 300+ games': '300+ 款游戏、超过 110,000 个模组',
            'Top Communities': '热门社区',
            'New Communities': '新社区',
            'See all': '查看全部',
            'Managing Mods': '管理模组',
            'Just Got Better': '现在更省心了',
            'Download Thunderstore Mod Manager for Windows to easily install, update, and manage your mods.':
                '下载 Windows 版 Thunderstore 模组管理器，轻松安装、更新和管理你的模组。',
            'Get Manager': '获取管理器',
        },

        /* ---------------- 社区总览 /communities/ ---------------- */
        communities: {
            'Popular': '热门',
            'Communities': '社区',
        },

        /* ---------------- 社区包列表 /c/<社区>/ ---------------- */
        community: {
            'Sections': '分区',
            'All': '全部',
            'Asset Replacements': '资源替换',
            'APIs & Libraries': 'API 与库',
            'Modpacks': '整合包',
            'Other filters': '其他筛选',
            'Deprecated': '已弃用',
            'NSFW': '成人内容',
            'Filters': '筛选器',
            'Pinned': '置顶',
            'by': '作者',
            'Modding Wiki': '模组 Wiki',
            'Modding Discord': '模组 Discord',
            'Card layout': '卡片布局',
            'Content width': '内容宽度',
            /* 展示控件下拉菜单：thunderstore PackageSearch 常量
             * header 为 Cards / View，选项 label 为 Grid / List 与 Compact / Wide；
             * 菜单由 Radix portal 在点开时才挂到 body，靠 MutationObserver 接管。 */
            'Cards': '卡片',
            'Grid': '网格',
            'List': '列表',
            'View': '视图',
            'Compact': '紧凑',
            'Wide': '宽屏',
            /* 列表空态（PackageSearch bundle 字面 + 真实 SSR）：
             * <p class="package-count">No results</p>
             * <span class="empty-state__title">It's empty in here</span>
             * <span class="empty-state__message">Team <名称> hasn't uploaded any mods …</span>
             * 团队名走 patterns 的完整锚定规则，只换模板文字。 */
            'No results': '没有结果',
            'No results found': '没有找到结果',
            "It's empty in here": '空空如也',
            'Be the first to upload a mod!': '成为第一个上传模组的人！',
            'Make sure all keywords are spelled correctly or try different search parameters.':
                '请确认所有关键词拼写正确，或尝试不同的搜索条件。',
            'Clear all filters': '清除所有筛选',
            'Newest': '最新发布',
            'Most downloaded': '下载量最多',
            'Top rated': '评分最高',
            'Thunderstore development is made possible with ads. Please consider making an exception to your adblock.':
                'Thunderstore 依靠广告维持开发，请考虑对本站关闭广告拦截。',

            /* GTFO 分类枚举（GTFO 社区页与截图核对） */
            'Client Mods': '客户端模组',
            'Dev Tools': '开发工具',
            'Rundown Mods': '远征序列模组',
            'Rundowns': '远征序列',

            /* 分类枚举（Lethal Company 社区全量 31 项，各社区分类集合不同但同名同义） */
            'AI Generated': 'AI 生成',
            'Audio': '音频',
            'BepInEx': 'BepInEx',
            'Boombox Music': '音箱音乐',
            'Bug Fixes': '缺陷修复',
            'Client-side': '客户端',
            'Cosmetics': '外观',
            'Emotes': '表情动作',
            'Equipment': '装备',
            'Furniture': '家具',
            'Hazards': '危险',
            'Interiors': '室内',
            'Items': '物品',
            'Libraries': '库',
            'MelonLoader': 'MelonLoader',
            'Misc': '杂项',
            'Monsters': '怪物',
            'Moons': '星球',
            'Performance': '性能',
            'Posters': '海报',
            'Server-side': '服务端',
            'Suits': '服装',
            'Tools': '工具',
            'Translations': '翻译',
            'Tweaks & Quality Of Life': '调整与体验优化',
            'Vehicles': '载具',
            'TV Videos': '电视视频',
            'Weather': '天气',
        },

        /* ---------------- 作者列表页 /c/<社区>/p/<作者>/ ---------------- */
        author: {
            /* 页头 React 注释把前缀和作者名拆成两个文本节点
             * （<h1>Mods uploaded by <!-- -->Kaldea</h1>），这里只翻前缀；
             * 单节点形式由 patterns 里的完整锚定规则处理，作者名都保持原文。 */
            'Mods uploaded by': '上传者',
        },

        /* ---------------- 包详情页 ---------------- */
        package: {
            'Install with App': '使用 App 安装',
            'Latest version': '最新版本',
            'Last Updated': '最后更新',
            'First Uploaded': '首次上传',
            'Downloads': '下载量',
            'Likes': '点赞',
            'Size': '大小',
            'Dependants': '被依赖',
            'Changelog': '更新日志',
            'Versions': '版本',
            'Analysis': '分析',
            'Required': '必需依赖',
            'Optional': '可选依赖',
            'Total downloads': '总下载量',
            'Report': '举报',
            'No dependencies': '没有依赖项',
            'This package does not require any other packages to work.': '此软件包无需依赖其他软件包即可运行。',
            'Dependencies': '依赖项',
        },

        /* ---------------- 上传页 /package/create/ ---------------- */
        upload: {
            'Upload': '上传',
            'Package name': '包名',
            'Community': '社区',
            'Submit': '提交',
            'Cancel': '取消',
            'Upload file': '上传文件',
            'Upload your package as a ZIP file.': '请将软件包以 ZIP 文件格式上传。',
            'Need help formatting your package? Check out the': '需要帮助格式化软件包？请查看',
            'Thunderstore wiki': 'Thunderstore Wiki',
            'Review your readme before upload using the': '上传前请先检查 README，并使用',
            'markdown preview tool': 'Markdown 预览工具',
            'Uploading a large file? Check your package manifest first with the': '上传大文件前，请先使用',
            'package manifest validator': '软件包清单校验器',
            'Choose or drag ZIP file here': '选择或将 ZIP 文件拖到此处',
            '10GB max': '最大 10 GB',
            'Team': '团队',
            'Select the team you want your package to be associated with.': '选择要与此软件包关联的团队。',
            'Select team': '选择团队',
            'Select communities you want your package to be listed under.': '选择要列出此软件包的社区。',
            'Select communities': '选择社区',
            'Select descriptive categories to help people discover your package.': '选择描述性分类，方便其他人发现你的软件包。',
            'Contains NSFW content': '包含 NSFW 内容',
            'Select if your package contains NSFW material. An "NSFW" -tag will be applied to your package.': '请选择软件包是否包含 NSFW 内容；选中后将为软件包添加“NSFW”标签。',
            'No': '否',
            'Yes': '是',
            'No teams available?': '没有可用的团队？',
            'Create team': '创建团队',
            'Select a community to view available categories': '选择一个社区以查看可用分类',
            'Double-check your selections and hit "Submit" when you\'re ready!': '请仔细核对所选内容，确认无误后点击“提交”！',
            'Reset': '重置',
            'Select categories': '选择分类',
            'Drop ZIP file here': '将 ZIP 文件拖放到此处',
            'Please upload a ZIP archive (application/zip).': '请上传 ZIP 压缩包（application/zip）。',
            'Please choose a ZIP file before submitting.': '提交前请选择 ZIP 文件。',
            'Please fix the problems with your .zip file before submitting.': '请先修复 ZIP 文件中的问题，再提交。',
            'Please review the form errors above and submit again.': '请修正上方表单错误后重新提交。',
            "If you need to test your mod, you can import it locally through the 'Import local mod' option in your mod manager's settings.": '如果需要测试模组，可在模组管理器设置中选择“导入本地模组”。',
            'You have BepInEx.dll in your .zip file. BepInEx should probably be a dependency in your manifest.json file instead.': 'ZIP 压缩包中包含 BepInEx.dll。建议在 manifest.json 中将 BepInEx 声明为依赖项。',
            'You have Assembly-CSharp.dll in your .zip file. Your package may be removed if you do not have permission to distribute this file.': 'ZIP 压缩包中包含 Assembly-CSharp.dll。若无权分发该文件，你的软件包可能会被移除。',
            "If you're making a modpack, do not include the files for each mod in your .zip file. Instead, put the dependency string for each mod inside your manifest.json file.": '如果正在制作模组整合包，请勿将各模组文件打包进 ZIP；请在 manifest.json 中填写每个模组的依赖项字符串。',
            'The file names of manifest.json, icon.png, and README.md are case-sensitive.': 'manifest.json、icon.png 和 README.md 文件名区分大小写。',
            'Your manifest.json, icon.png, and README.md files must have the correct file extensions.': 'manifest.json、icon.png 和 README.md 文件必须使用正确的扩展名。',
            'Your manifest, icon, and README files should be at the root of the .zip file. You can prevent this by compressing the contents of a folder, rather than the folder itself.': 'manifest、icon 和 README 文件应位于 ZIP 压缩包根目录。压缩文件夹内的内容，而不是文件夹本身，即可避免此问题。',
            'Your manifest.json, icon.png, or README.md file is missing its file extension.': 'manifest.json、icon.png 或 README.md 文件缺少扩展名。',
            'Your package is missing a manifest.json file!': '软件包缺少 manifest.json 文件！',
            'Your package is missing an icon.png file!': '软件包缺少 icon.png 文件！',
            'Your package is missing a README.md file!': '软件包缺少 README.md 文件！',
            'Upload progress': '上传进度',
            'Uploading…': '正在上传…',
            'Submitting…': '正在提交…',
            'Processing…': '正在处理中…',
            'Retry Status Check': '重试状态检查',
            'Success!': '成功！',
            'The package is listed in': '软件包已发布到',
            'communities': '个社区',
            'community': '个社区',
            'View listing': '查看软件包页面',
            'Link': '链接',
            'Upload already running': '上传已在进行中。',
            'Executor not initialized, cannot pause upload': '上传任务尚未初始化，无法暂停。',
            'MultipartUpload.handle accessed before set': '上传句柄尚未设置便被访问。',
            'Uploads are not related to the same upload handle': '这些上传分片不属于同一上传任务。',
            'No uploads found': '未找到上传任务。',
            'Failed to initialize MD5 WorkerManager: Worker not supported': '当前浏览器不支持 MD5 WorkerManager，无法初始化。',
            'Failed to create MD5 worker': '无法创建 MD5 Worker。',
            'File selection changed during validation.': '验证过程中所选文件已更改。',
            'API host is not configured': '未配置 API 主机。',
            'Network error': '网络错误',
            'HTTP error': 'HTTP 错误',
            'Upload failed': '上传失败',
            'Upload failed before submission.': '提交前上传失败。',
            'Unknown error': '未知错误',
        },
    },

    /* ---------------- 正则组 ---------------- */
    patterns: [
        // "Mods uploaded by Kaldea"（页头若被渲染成单个文本节点）：与拆节点形态统一为「上传者 <名称>」，
        // 名称原字节返回（函数式替换，避免名称里的 $ 被当成替换语法解析）
        [/^Mods uploaded by (.+)$/, (_match, name) => '上传者 ' + name],
        // "Team Misc hasn't uploaded any mods for this community yet."：只换模板文字，团队名原样保留
        [/^Team (.+) hasn['\u2019]t uploaded any mods for this community yet\.$/,
            (_match, team) => '团队 ' + team + ' 还没有为该社区上传任何模组。'],
        // "1-20 of 19588 results"
        [/^(\d[\d,]*)-(\d[\d,]*) of ([\d,]+) results?$/, '$1-$2，共 $3 条结果'],
        // "1 of 1 result" / "21 of 21 results"（末页或仅一条，数字不带区间）：单文本节点形态
        [/^(\d[\d,]*) of (\d[\d,]*) results?$/, '$1，共 $2 条结果'],
        // "19588 results"
        [/^([\d,]+) results?$/, '共 $1 条结果'],
        // "Required (0)"
        [/^Required\s*\(\s*(\d+)\s*\)$/i, '必需依赖（$1）'],
        // Thunderstore 上传页动态 ZIP 校验与传输状态；均为完整字符串锚定。
        [/^You have (\d+) \.dll files in your \.zip file\. Some of these files may be unnecessary\.$/i, 'ZIP 压缩包中包含 $1 个 .dll 文件，其中某些可能并非必需。'],
        [/^HTTP error: (\d+)$/i, 'HTTP 错误：$1'],
        [/^ETAG missing on part upload: (\d+)$/i, '分片 $1 缺少 ETag。'],
        [/^Uploading…\s*(\d+%)$/i, '正在上传… $1'],
        [/^Error polling submission status: (.+)$/i, (_match, detail) => '查询提交状态失败：' + detail
            .replace(/unknown error/gi, '未知错误')
            .replace(/UPLOAD_FAILED:\s*Network error/gi, '网络错误')
            .replace(/UPLOAD_FAILED:\s*HTTP error:\s*(\d+)/gi, 'HTTP 错误：$1')
            .replace(/HTTP error:\s*(\d+)/gi, 'HTTP 错误：$1')
            .replace(/Network error/gi, '网络错误')
            .replace(/(?:ETAG_MISSING:\s*)?ETAG missing on part upload:\s*(\d+)/gi, '分片 $1 缺少 ETag。')],
        [/^Upload failed with errors: (.+)$/i, (_match, detail) => '上传失败：' + detail
            .replace(/UPLOAD_FAILED:\s*Network error/gi, '网络错误')
            .replace(/UPLOAD_FAILED:\s*HTTP error:\s*(\d+)/gi, 'HTTP 错误：$1')
            .replace(/ETAG_MISSING:\s*ETAG missing on part upload:\s*(\d+)/gi, '分片 $1 缺少 ETag。')],
        // 相对时间
        [/^just now$/i, '刚刚'],
        [/^(\d+)\s*second(s)? ago$/i, '$1 秒前'],
        [/^(\d+)\s*minute(s)? ago$/i, '$1 分钟前'],
        [/^(\d+)\s*hour(s)? ago$/i, '$1 小时前'],
        [/^(\d+)\s*day(s)? ago$/i, '$1 天前'],
        [/^(\d+)\s*week(s)? ago$/i, '$1 周前'],
        [/^(\d+)\s*month(s)? ago$/i, '$1 个月前'],
        [/^(\d+)\s*year(s)? ago$/i, '$1 年前'],
    ],
});

/* =============================================================================
 * nexus.js —— nexusmods.com 词条
 *
 * 取证来源（2026-10-20 抓取，文本见 docs/evidence/nexus-*.txt）：
 *   模组详情页   https://www.nexusmods.com/skyrimspecialedition/mods/266
 *   模组浏览页   https://www.nexusmods.com/games/skyrimspecialedition/mods
 * 站点现为 2026 版新前端（导航 GAMES / MODS / COLLECTIONS / MEDIA / COMMUNITY…），
 * 旧版页面（/<game>/mods/<id>）仍可访问，字典对两套页面共用的文案一并覆盖。
 * ========================================================================== */

const NX_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NX_MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

function nxMonth(token) {
    const t = token.slice(0, 3).toLowerCase();
    for (let i = 0; i < 12; i++) {
        if (NX_MONTHS_SHORT[i].toLowerCase() === t) return i + 1;
    }
    return 0;
}

const NX_COUNTED_LABELS = Object.freeze({
    'Essentials': '必备',
    'Miscellaneous': '杂项',
    'Themed': '主题',
    'Official': '官方',
    'Top Pick': '精选',
    'Collection': '合集',
    'Wabbajack list': 'Wabbajack 列表',
    'Aesthetics': '美学',
    'Combat': '战斗',
    'Funny': '搞笑',
    'Misc': '杂项',
    'Narrative': '叙事',
    'Poses': '姿势',
    'General': '综合',
    'Personal Showcase': '个人展示',
    'Interview': '访谈',
    'Review': '评测',
    'Story Driven': '剧情向',
});

function nxCountedLabel(all, label, count) {
    if (Object.prototype.hasOwnProperty.call(NX_COUNTED_LABELS, label)) {
        return NX_COUNTED_LABELS[label] + ' (' + count + ')';
    }
    const event = label.match(/^Screenshot Community Event #(\d+)$/);
    return event ? '截图社区活动 #' + event[1] + ' (' + count + ')' : all;
}

/* ---- 模组浏览页（2026 新前端）固定 UI 枚举 ----
 * 取证：docs/evidence/nexus-browse-2026-10-27.txt
 *   · 实机 DOM 里分类名与计数是两个相邻 span：
 *     <label><p><span class="truncate …">Avatars</span><span class="text-neutral-subdued">(269)</span></p></label>
 *   · 卡片分类元数据是 a[data-e2eid="mod-tile-category"]，href 同时含 /games/ 与 ?categoryName=
 *   · 时间范围是 HeadlessUI Popover 按钮文本，已选 chip 是 "Time range: 28 Days"
 *   · 页大小 label 是大写 "20 Items"（生产 JS 字面量），旧正则只认小写 items
 * 这些串与 mod 标题/作者/描述可能同形（标题就叫 Vehicles / 28 Days / 20 Items），
 * 所以只放进 site.scoped 的上下文规则，不进全局 dict。 */
const NX_BROWSE_CATEGORY_ZH = Object.freeze({
    'Avatars': '头像',
    'Cheats': '作弊',
    'Creatures': '生物',
    'Environment': '环境',
    'Items - Food': '物品 - 食品',
    'Items – Food': '物品 – 食品',
    'Items and Loot': '物品与战利品',
    'Maps': '地图',
    'Prefabs': '预制建筑',
    'Quests': '任务',
    'Vehicles': '载具',
    'XML Edits': 'XML 修改',
    'Zombies': '僵尸',
});

const NX_TIME_RANGE_ZH = Object.freeze({
    'all time': '所有时间',
    '24 hours': '24 小时',
    '7 days': '7 天',
    '14 days': '14 天',
    '28 days': '28 天',
    '1 year': '1 年',
    'custom': '自定义',
});

/* "Avatars (10)" -> "头像 (10)"：同节点形态，计数一位不动 */
function nxCategoryCounted(all, label, count) {
    const zh = NX_BROWSE_CATEGORY_ZH[label];
    return zh ? zh + ' (' + count + ')' : all;
}

/* "Time range: 28 Days" -> "时间范围：28 天"；custom 与大小写变体都保留含义 */
function nxTimeRangeChip(all, value) {
    const raw = value.trim();
    return '时间范围：' + (NX_TIME_RANGE_ZH[raw.toLowerCase()] || raw);
}

/* 会员横幅的第二个文本节点（前半句 "Try Premium free" 是粗体 span，见取证文件）：
 * 整句是站点点级固定营销文案，但只在横幅容器里翻，避免把同名 UGC 段落牵连进来。 */
function nxPremiumBannerTail(all, dash) {
    return (dash ? dash + ' ' : '') + '解锁更快的下载速度与一键安装';
}

/* ---- 已选搜索条件 chip："Title: <用户输入>"（实机 chip 标签是单文本节点）----
 * 生产 bundle 里标签由 `${humanize(field)}: ${value}` 拼成，field ∈ title/description/author/uploader。
 * 只翻固定前缀，冒号后的用户输入逐字节保留（含 "24 Hours"、中文、冒号、多个空格、$1 / $& / $`）。
 * 用函数式替换，避免 String.replace 把值里的 $ 序列当替换模式。 */
const NX_SEARCH_FIELD_ZH = Object.freeze({
    Title: '标题',
    Description: '描述',
    Author: '作者',
    Uploader: '上传者',
});

function nxSearchChipLabel(all, field, value) {
    const zh = NX_SEARCH_FIELD_ZH[field];
    return zh ? zh + '：' + value : all;
}

/* 时间范围枚举："24 Hours" / "7 days" / "1 Year"：数字原样保留，只本地化单位 */
const NX_TIME_OPTION_PATTERNS = [
    [/^([\d,]+)\s*hours?$/i, (all, n) => n + ' 小时'],
    [/^([\d,]+)\s*days?$/i, (all, n) => n + ' 天'],
    [/^([\d,]+)\s*years?$/i, (all, n) => n + ' 年'],
];

SITES.push({
    id: 'nexus',
    name: 'Nexus Mods',
    match: /(^|\.)nexusmods\.com$/,

    /* 忽略区域：
     *  - Cookiebot 同意弹窗（第三方，自带多语言，且节点量巨大）
     *  - mod 描述正文 / 评论 / 论坛帖 / 变更日志（UGC）
     *  - 文件名、代码块、用户输入 */
    ignore: [
        '#CybotCookiebotDialog', '[id^="Cybot"]',
        'pre', 'code', 'kbd', 'textarea', '[contenteditable="true"]',
        '[class*="mod-description"]', '[class*="description-wrapper"]',
        '[class*="comment"]', '[class*="Comment"]',
        '[class*="markdown"]', '[class*="prose"]',
        '[class*="mod-title"]', '[class*="file-name"]',
        // 2026 新前端的卡片结构（data-e2eid 稳定标识）：标题/作者/摘要都是 UGC
        '[data-e2eid="mod-tile-title"]', '[data-e2eid="mod-tile-summary"]', '[data-e2eid="user-link"]',
        // 游戏名链接仍整棵跳过；卡片上的分类元数据是同一 URL 族里的固定 UI，单独放行
        '[href*="/games/"]:not([data-e2eid="mod-tile-category"])',
        '[href*="/collections/"]', '[href*="/images/"]', '[href*="/videos/"]',
        '[href*="/topic/"]', '[class*="featured-article"]',
        '.ipsType_richText',
        '.ipsDataItem_lastPoster',
        '.ipsDataItem_lastPoster__title',
        'a.ipsDataItem_title[href*="/topic/"]',
        'script', 'style', 'noscript',
    ].join(','),

    detect(path, host) {
        if (host.indexOf('users.nexusmods.com') === 0) return 'account';
        if (host.indexOf('forums.nexusmods.com') === 0) return 'forums';
        if (host.indexOf('help.nexusmods.com') === 0 || host.indexOf('wiki.nexusmods.com') === 0 || host.indexOf('api-docs.nexusmods.com') === 0) return 'support';
        if (path === '/' || path === '') return 'home';
        if (/^\/games\/[^/]+\/mods\/\d+/.test(path)) return 'mod';
        if (/^\/[^/]+\/mods\/\d+/.test(path)) return 'mod';          // 旧版详情页
        if (/^\/games\/[^/]+\/mods\/?$/.test(path)) return 'browse';
        if (/^\/games\/[^/]+\/collections(?:\/|$)/.test(path)) return 'collection';
        if (/^\/games\/[^/]+\/(?:images|videos)(?:\/|$)/.test(path)) return 'media';
        if (/^\/games\/?$/.test(path)) return 'games';
        if (/^\/games\/[^/]+\/?$/.test(path)) return 'game';
        if (/^\/collections(?:\/|$)/.test(path)) return 'collection';
        if (/^\/(?:images|videos)(?:\/|$)/.test(path)) return 'media';
        if (/^\/news(?:\/|$)/.test(path)) return 'news';
        if (path.indexOf('/users/') === 0) return 'account';
        return 'global';
    },

    dict: {
        /* ---------------- 全站：顶部导航 / 页脚 ---------------- */
        global: {
            /* 顶部导航 */
            'GAMES': '游戏',
            'MODS': '模组',
            'MOD UPDATES': '模组更新',
            'COLLECTIONS': '合集',
            'MEDIA': '媒体',
            'IMAGES': '图片',
            'VIDEOS': '视频',
            'COMMUNITY': '社区',
            'NEWS': '新闻',
            'SUPPORT': '支持',
            'WIKI': 'WIKI',
            'VORTEX': 'VORTEX',
            'Media': '媒体',
            'Community': '社区',
            'Support': '支持',
            'Search/': '搜索 /',
            'Search /': '搜索 /',
            'Upload': '上传',
            'Show notifications': '显示通知',
            'View messages': '查看消息',
            'Unread notifications': '未读通知',
            'Discover': '发现',
            'Network stats': '站点数据',
            'Support Nexus Mods': '支持 NEXUS MODS',
            'Try premium for free': '免费试用高级版',
            'Try Premium for free': '免费试用高级版',
            'Join us on Discord': '加入 Discord',
            'Follow us on X': '关注 X',
            'Follow us on Twitter': '关注 Twitter',
            'Follow us on TikTok': '关注 TikTok',
            'Follow us on Twitch': '关注 Twitch',
            'Follow us on Youtube': '关注 YouTube',
            'Follow us on YouTube': '关注 YouTube',
            'Home': '首页',
            'Browse': '浏览',
            'Search': '搜索',
            'Search...': '搜索…',
            'Sign In': '登录',
            'Sign Up': '注册',
            'Existing user?': '已有账号？',
            'Game Communities': '游戏社区',
            'Online Users': '在线用户',
            'Guidelines': '指南',
            'Staff': '工作人员',
            'Events': '活动',
            'Activity': '动态',
            'Explore': '探索',
            'Popular Game Communities': '热门游戏社区',
            'Active Topics': '活跃主题',
            'Tell a friend': '推荐给朋友',
            'Email': '邮箱',
            'Share': '分享',
            'Contact Us': '联系我们',
            'Cookies': 'Cookie 设置',
            'Sign out': '退出登录',
            'Trending Mods': '趋势模组',
            'Latest news': '最新消息',
            'View all': '查看全部',
            'View more': '查看更多',
            'Updated': '已更新',
            'Popular': '热门',
            'Surprise': '随机',
            'All time': '所有时间',
            'Downloads': '下载量',
            'Sort by': '排序依据',
            'Sort direction': '排序方向',
            'Time': '时间',
            'Filter': '筛选',
            'Sort': '排序',
            'Page': '页码',
            'Previous page': '上一页',
            'Next page': '下一页',
            'Games per page': '每页游戏数',
            'Mods per page': '每页模组数',
            'Collections per page': '每页合集数',
            'Media per page': '每页媒体数',
            'Asc': '升序',
            'Desc': '降序',

            /* 导航下拉项 */
            'All games': '所有游戏',
            'Recently added': '最近添加',
            'Your favourited games will be displayed here': '你收藏的游戏会显示在这里',
            'All mods': '所有模组',
            'New': '最新',
            'Trending': '热门趋势',
            'Most endorsed': '认可最多',
            'Top files': '下载榜',
            'Mod categories': '模组分类',
            'Mods of the month': '本月模组',
            'Recent activity': '最近动态',
            'All collections': '所有合集',
            'Highest rated': '评分最高',
            'Latest': '最新',
            'Forums': '论坛',
            'Wiki': 'Wiki',
            'Support authors': '支持作者',
            'All news': '所有新闻',
            'Site news': '站点新闻',
            'Competitions': '竞赛',
            'Interviews': '访谈',
            'Help': '帮助',
            'Contact': '联系我们',
            'Give feedback': '反馈建议',
            'FAQ': '常见问题',
            'API': 'API',
            'Game guides': '游戏指南',
            'Tutorial': '教程',
            'Tools': '工具',
            'Collections': '合集',

            /* 账号区 */
            'Vortex help': 'Vortex 帮助',
            'Install Vortex': '安装 Vortex',
            'Please log in': '请登录',
            'Log in': '登录',
            'Log out': '退出登录',
            'Sign up': '注册',
            'Go premium': '开通会员',
            'Premium features': '会员功能',
            'Notifications': '通知',
            'Mark all as read': '全部标为已读',
            "You're up to date": '已全部读完',
            /* 无障碍标签（取证：aria-label 原值） */
            'Show search': '显示搜索',
            'Open navigation menu': '打开导航菜单',
            'Close navigation menu': '关闭导航菜单',
            'Open profile menu': '打开个人菜单',
            'Breadcrumb navigation': '面包屑导航',
            'Filters panel': '筛选面板',
            'Show Tags': '显示标签',
            'Pagination navigation': '分页导航',
            'Clear game filter': '清除游戏筛选',
            'Go to previous page': '上一页',
            'Go to next page': '下一页',
            'Jump to page': '跳转页码',
            'See All': '查看全部',
            'Title contains': '标题包含',
            'Description contains': '描述包含',
            'Author contains': '作者包含',
            'Uploader contains': '上传者包含',
            'Back': '返回',
            'Games': '游戏',
            'Mods': '模组',
            'Close': '关闭',

            /* 页脚 */
            'NEXUS MODS': 'NEXUS MODS',
            'News': '新闻',
            'Statistics': '统计',
            'Careers': '招聘',
            'About us': '关于我们',
            'DISCOVER': '发现',
            'New mods': '新模组',
            'Popular mods': '热门模组',
            'Trending mods': '趋势模组',
            'All images': '所有图片',
            'Report a bug': '报告缺陷',
            'Unban requests': '解封申请',
            'DMCA': 'DMCA',
            'Manage cookie settings': '管理 Cookie 设置',
            'Discord': 'Discord',
            'Contact us': '联系我们',
            'SUPPORT NEXUS MODS': '支持 NEXUS MODS',
            'Mod faster with premium': '开通会员，下载更快',
            'NETWORK STATS': '站点数据',
            'Members': '会员数',
            'Kudos given': '送出赞许',
            'Page served in': '页面响应耗时',
            'Server info': '服务器信息',
            'Terms of Service': '服务条款',
            'Privacy Policy': '隐私政策',
            'Kudos': '赞许',
        },

        /* ---------------- 首页 ---------------- */
        home: {
            'Browse the internet\'s best mods': '浏览全网最优秀的模组',
            'Welcome back,': '欢迎回来，',
            'My Games': '我的游戏',
            'My games': '我的游戏',
            'Tracking Centre': '追踪中心',
            'Tracking centre': '追踪中心',
            'Download history': '下载历史记录',
            'My content': '我的内容',
            'Add game': '添加游戏',
            'Hot Collections': '热门合集',
            'Get fast downloads with premium': '开通会员，下载更快',
            'Try Premium free': '免费试用 Premium',
            'Free Premium': '免费会员',
            'Cash payouts': '现金报酬',
            'Make mods. Earn rewards. Cash payouts': '创作模组，赢取奖励并获得现金报酬',
        },

        /* ---------------- 游戏目录 ---------------- */
        games: {
            'GAME': '游戏',
            'Game': '游戏',
            'GAME GENRE': '游戏类型',
            'Game genre': '游戏类型',
            'Game genre search': '搜索游戏类型',
            'Search game': '搜索游戏',
            'Show games': '显示游戏',
            'Choose from': '可供选择',
            'games': '款游戏',
            'to mod': '以便修改',
            'Affiliate link': '联盟链接',
            'Get games to mod, cheaper.': '更便宜地购买可添加模组的游戏。',
            'Discover offers': '探索优惠',
            'Vortex Support': 'Vortex 支持',
            'VORTEX SUPPORT': 'Vortex 支持',
            'No. of mods': '模组数',
            'No. of collections': '合集数',
            'Action': '动作',
            'Adventure': '冒险',
            'ARPG': '动作角色扮演',
            'Dungeon crawl': '地牢探索',
            'Fighting': '格斗',
            'FPS': '第一人称射击',
            'Hack and Slash': '砍杀',
            'Horror': '恐怖',
            'Indie': '独立游戏',
            'Metroidvania': '银河恶魔城',
            'MMORPG': '大型多人在线角色扮演',
            'Music': '音乐',
            'Platformer': '平台跳跃',
            'Puzzle': '解谜',
            'Racing': '赛车',
            'Roguelike': '肉鸽',
            'RPG': '角色扮演',
            'Sandbox': '沙盒',
            'Simulation': '模拟',
            'Space sim': '太空模拟',
            'Sports': '体育',
            'Stealth': '潜行',
            'Strategy': '策略',
            'Survival': '生存',
            'Third-Person Shooter': '第三人称射击',
            'Visual Novel': '视觉小说',
            'VR': 'VR',
        },

        /* ---------------- 游戏主页 /games/<game> ---------------- */
        game: {
            'No. of endorsements': '认可数',
            'Mods filter': '模组筛选',
            'Media filter': '媒体筛选',
        },

        /* ---------------- 合集列表与详情 ---------------- */
        collection: {
            'All collections': '所有合集',
            'Hide filters': '收起筛选',
            'Show filters': '展开筛选',
            'Game': '游戏',
            'Search game': '搜索游戏',
            'Show games': '显示游戏',
            'Game version': '游戏版本',
            'Category': '分类',
            'Essentials': '必备',
            'Miscellaneous': '杂项',
            'Themed': '主题',
            'Badge': '徽章',
            'Official': '官方',
            'Top Pick': '精选',
            'Included Mods': '包含的模组',
            'Collection': '合集',
            'Wabbajack list': 'Wabbajack 列表',
            'Tags': '标签',
            'Adult Content': '成人内容',
            'Hide adult content': '隐藏成人内容',
            'Highest rated': '评分最高',
            'Collections per page': '每页合集数',
        },

        /* ---------------- 图片与视频列表 ---------------- */
        media: {
            'Hide filters': '收起筛选',
            'Show filters': '展开筛选',
            'Category': '分类',
            'Aesthetics': '美学',
            'Combat': '战斗',
            'Funny': '搞笑',
            'Misc': '杂项',
            'Narrative': '叙事',
            'Poses': '姿势',
            'Content options': '内容选项',
            'Sort direction': '排序方向',
            'Media per page': '每页媒体数',
            'Recently added': '最近添加',
            'General': '综合',
            'Personal Showcase': '个人展示',
            'Interview': '访谈',
            'Review': '评测',
            'Story Driven': '剧情向',
        },

        /* ---------------- 新闻 ---------------- */
        news: {
            'News & Updates': '新闻与动态',
            'Jump': '跳转',
            '24 hrs': '24 小时',
            '7 days': '7 天',
            '14 days': '14 天',
            '30 days': '30 天',
            '1 year': '1 年',
            'Range...': '自选范围…',
            'From': '起始日期',
            'To': '截止日期',
            'Recent': '最近',
            'Title': '标题',
            'Author': '作者',
            'Last Comment': '最新评论',
            'Learn more': '了解更多',
            'Competition': '竞赛',
            'Feature': '专题',
            'Site News': '站点新闻',
            'Mod News': '模组新闻',
        },

        /* ---------------- Help Center / API Docs ---------------- */
        support: {
            'Search the knowledge base': '搜索知识库',
            'Policies and Guidelines': '政策与指南',
            'Frequently Asked Questions': '常见问题',
            'Account Settings': '账号设置',
            'Website Features': '网站功能',
            'Overview': '概览',
            'collections': '合集',
            'mod-bugs': '模组缺陷',
            'mod-files': '模组文件',
            'mods': '模组',
            'vortex': 'Vortex',
            'Download': '下载',
            'Legacy APIs': '旧版 API',
            'API Stability': 'API 稳定性',
            'Upcoming Changes': '即将变更',
            'Request samples': '请求示例',
            'Response samples': '响应示例',
            'Responses': '响应',
            'PATH PARAMETERS': '路径参数',
            'QUERY PARAMETERS': '查询参数',
            'REQUEST BODY SCHEMA:': '请求正文架构：',
            'Content type': '内容类型',
            'Copy': '复制',
            'Expand all': '全部展开',
            'Collapse all': '全部折叠',
            'AUTHORIZATIONS:': '授权：',
            'I want to': '我想要',
            'upload a mod': '上传模组',
        },

        /* ---------------- Nexus Mods Forums ---------------- */
        forums: {
            'Nexus Mods Hub': 'Nexus Mods 中心',
            'Existing user? Sign In': '已有账号？登录',
            'Topics': '主题',
            'Everywhere': '全站',
            'Community Activity': '社区动态',
            'Site Updates': '网站更新',
            'Projects': '项目',
            'Site Support': '站点支持',
            'Vortex Support': 'Vortex 支持',
            'Mod Troubleshooting': '模组故障排查',
            'Mod Ideas': '模组创意',
            'Modding Academy': '模组制作学院',
            'Articles and Guides': '文章与指南',
            'Newbies': '新人专区',
            'General Chat': '综合聊天',
            'Gaming': '游戏讨论',
            'Hardware and software discussion': '硬件与软件讨论',
            'Off-Topic': '闲聊',
            'Formal Warnings, Bans and Takedowns': '正式警告、封禁与下架',
            'Nexus Mods app': 'Nexus Mods 应用',
        },
        /* ---------------- 模组浏览页 /games/<game>/mods ---------------- */
        browse: {
            'Home': '首页',
            'Browse the internet\'s best mods': '浏览全网最优秀的模组',
            'Hide filters': '收起筛选',
            'Show filters': '展开筛选',
            'Category': '分类',
            'Tags': '标签',
            'Search parameters': '搜索参数',
            'Language support': '语言支持',
            'Content options': '内容选项',
            'File size': '文件大小',
            'to': '至',
            'CATEGORY': '分类',
            'TAGS': '标签',
            'Includes': '包含',
            'Excludes': '排除',
            'SEARCH PARAMETERS': '搜索参数',
            'Title': '标题',
            'Description': '描述',
            'Author': '作者',
            'Uploader': '上传者',
            'Apply': '应用',
            'LANGUAGE SUPPORT': '语言支持',
            'Hide translations': '隐藏翻译',
            'CONTENT OPTIONS': '内容选项',
            'Hide adult content': '隐藏成人内容',
            'Show only adult content': '仅显示成人内容',
            'Supported by Vortex': '支持 Vortex',
            'Show only updated mods': '仅显示已更新模组',
            'FILE SIZE': '文件大小',
            'No min': '无下限',
            'No max': '无上限',
            'DOWNLOADS': '下载量',
            'ENDORSEMENTS': '认可数',
            'Sort': '排序',
            'Previous page': '上一页',
            'Next page': '下一页',
            'Go': '跳转',
            'Make mods.': '创作模组。',
            'Earn rewards.': '赚取奖励。',
            'Learn More': '了解更多',
            'Endorsements': '认可数',
            'Downloads': '下载量',
            'Start free trial': '免费试用',
            'Display': '显示',

            /* 语言枚举 */
            'Afrikaans': '南非荷兰语',
            'Arabic': '阿拉伯语',
            'Czech': '捷克语',
            'Dutch': '荷兰语',
            'English': '英语',
            'French': '法语',
            'German': '德语',
            'Hungarian': '匈牙利语',
            'Indonesian': '印尼语',
            'Italian': '意大利语',
            'Japanese': '日语',
            'Korean': '韩语',
            'Polish': '波兰语',
            'Portuguese (Brazil)': '葡萄牙语（巴西）',
            'Portuguese (Portugal)': '葡萄牙语（葡萄牙）',
            'Russian': '俄语',
            'Simplified Chinese': '简体中文',
            'Spanish (Latin America)': '西班牙语（拉美）',
            'Spanish (Spain)': '西班牙语（西班牙）',
            'Traditional Chinese': '繁体中文',
            'Turkish': '土耳其语',
            'Ukrainian': '乌克兰语',
            'Vietnamese': '越南语',

            /* 分类枚举（Skyrim SE 全量；分类名跨游戏统一） */
            'Alchemy': '炼金',
            'Animation': '动画',
            'Armour': '护甲',
            'Armour - Shields': '护甲 - 盾牌',
            'Audio': '音频',
            'Body, Face, and Hair': '身体、面部与头发',
            'Bug Fixes': '缺陷修复',
            'Buildings': '建筑',
            'Cheats and God items': '作弊与神级物品',
            'Cities, Towns, Villages, and Hamlets': '城市、城镇、村庄与村落',
            'Clothing and Accessories': '服装与饰品',
            'Collectables, Treasure Hunts, and Puzzles': '收集品、寻宝与解谜',
            'Combat': '战斗',
            'Crafting': '制作',
            'Creatures and Mounts': '生物与坐骑',
            'Dungeons': '地牢',
            'Environmental': '环境',
            'Followers & Companions': '随从与同伴',
            'Followers & Companions - Creatures': '随从与同伴 - 生物',
            'Gameplay': '玩法',
            'Guilds/Factions': '公会 / 派系',
            'Immersion': '沉浸感',
            'Items and Objects - Player': '物品与物件 - 玩家',
            'Items and Objects - World': '物品与物件 - 世界',
            'Locations - New': '地点 - 新增',
            'Locations - Vanilla': '地点 - 原版',
            'Magic - Gameplay': '魔法 - 玩法',
            'Magic - Spells & Enchantments': '魔法 - 法术与附魔',
            'Miscellaneous': '杂项',
            'Modders Resources': '模组作者资源',
            'Models and Textures': '模型与贴图',
            'NPC': 'NPC',
            'Overhauls': '大修',
            'Patches': '补丁',
            'Player homes': '玩家住宅',
            'Presets - ENB and ReShade': '预设 - ENB 与 ReShade',
            'Quests and Adventures': '任务与冒险',
            'Races, Classes, and Birthsigns': '种族、职业与星座',
            'Save Games': '存档',
            'Shouts': '龙吼',
            'Skills and Leveling': '技能与升级',
            'Stealth': '潜行',
            'User Interface': '用户界面',
            'Utilities': '实用工具',
            'Visuals and Graphics': '视觉与画面',
            'VR': 'VR',
            'Weapons': '武器',
            'Weapons and Armour': '武器与护甲',
        },

        /* ---------------- 模组详情页 ---------------- */
        mod: {
            'Details': '详情',
            'Exclusive media content and more': '独家媒体内容及更多',
            'File information': '文件信息',
            'Credits and distribution permission': '致谢与分发许可',
            'Author notes': '作者说明',
            'File credits': '文件鸣谢',
            'Donation Points system': '捐赠点数系统',
            'See who endorsed this mod': '查看认可此模组的用户',
            'Link a new video': '关联新视频',
            'Tracking': '追踪',
            'Endorse': '认可',
            'Vote': '投票',
            'Endorsements': '认可数',
            'Unique DLs': '独立下载',
            'Total DLs': '总下载',
            'Total views': '总浏览',
            'Version': '版本',
            'Download:': '下载：',
            'Last updated': '最后更新',
            'Original upload': '原始上传',
            'Created by': '作者',
            'Uploaded by': '上传者',
            'Virus scan': '病毒扫描',
            'Safe to use': '可安全使用',
            'Tags for this mod': '本模组标签',
            'View more...': '查看更多…',
            'DESCRIPTION': '描述',
            'FILES': '文件',
            'ARTICLES': '文章',
            'POSTS': '帖子',
            'LOGS': '日志',
            'STATS': '统计',
            'About this mod': '关于本模组',
            'Share': '分享',
            'Requirements': '前置要求',
            'Permissions and credits': '权限与致谢',
            'Translations': '翻译',
            'Mirrors': '镜像',
            'Donations': '赞助',
            'Mods using this mod': '使用此模组的模组',
            'Collections containing this mod': '包含此模组的合集',
            'Mod options': '模组选项',
            'Report abuse': '举报滥用',
            'Adult content': '成人内容',
            'This mod is not supported on older versions': '此模组不支持旧版本',
            'LEARN MORE': '了解更多',
        },

        /* ---------------- 账号页 users.nexusmods.com ---------------- */
        account: {
            'Email': '邮箱',
            'Email or Username': '邮箱或用户名',
            'Forgot your Password?': '忘记密码？',
            'Need an account?': '还没有账号？',
            'Register here': '在此注册',
            'Password': '密码',
            'Forgot password?': '忘记密码？',
            'Remember me': '记住我',
            'Account settings': '账号设置',
            'Profile': '个人资料',
            'Preferences': '偏好设置',
            'Security': '安全',
            'Change password': '修改密码',
            'Save changes': '保存更改',
            'Cancel': '取消',
            'Submit': '提交',
        },
    },

    patterns: [
        // "122,730 results"
        [/^([\d,]+) results$/, '共 $1 条结果'],
        // "Endorsements 479,848"（两个文本节点粘连的情形）
        [/^Endorsements\s+([\d,]+)$/, '认可数 $1'],
        [/^Downloads\s+([\d,]+)$/, '下载量 $1'],
        [/^Unique DLs\s+([\d,]+)$/, '独立下载 $1'],
        [/^Total DLs\s+([\d,]+)$/, '总下载 $1'],
        [/^Total views\s+([\d,]+)$/, '总浏览 $1'],
        // "Version 4.3.9c"
        [/^Version\s+([\w.\-]+)$/, '版本 $1'],
        // "Go to page 6137"
        [/^Go to page (\d+)$/, '第 $1 页'],
        // "Endorsements 0" / "Kudos 4,442,644"
        [/^Kudos\s+([\d,]+)$/, '赞许 $1'],
        // "Members 79,608,318"
        [/^Members\s+([\d,]+)$/, '会员数 $1'],
        // "Mods 962,292"
        [/^Mods\s+([\d,]+)$/, '模组数 $1'],
        // "Translations language 14 languages"
        [/^language (\d+) languages$/, '$1 种语言'],
        // "Mods using this mod (1829)"
        [/^Mods using this mod \((\d+)\)$/, '使用此模组的模组（$1）'],
        // "Skyrim Special Edition mods"（游戏名保留，仅换词序示意；不匹配具体游戏名，故只处理通用后缀）
        // "36 minutes ago 20 Oct 2026" 之类由下方相对时间与日期规则分别命中

        // 相对时间
        [/^just now$/i, '刚刚'],
        [/^(\d+)\s*second(s)? ago$/i, '$1 秒前'],
        [/^(\d+)\s*minute(s)? ago$/i, '$1 分钟前'],
        [/^(\d+)\s*hour(s)? ago$/i, '$1 小时前'],
        [/^(\d+)\s*day(s)? ago$/i, '$1 天前'],
        [/^(\d+)\s*week(s)? ago$/i, '$1 周前'],
        [/^(\d+)\s*month(s)? ago$/i, '$1 个月前'],
        [/^(\d+)\s*year(s)? ago$/i, '$1 年前'],

        [/^(.+) \(([\d,]+)\)$/, nxCountedLabel],
        [/^([\d,]+) items$/, '每页 $1 项'],
        [/^Screenshot Community Event #(\d+)$/, '截图社区活动 #$1'],
        // "20 Oct 2026"
        [/^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})$/, (all, d, mon, y) => {
            const m = nxMonth(mon);
            return m ? y + '年' + m + '月' + parseInt(d, 10) + '日' : all;
        }],
        // "06 September 2026, 6:22AM"
        [/^(\d{1,2}) ([A-Z][a-z]+) (\d{4}), (\d{1,2}):(\d{2})\s*(AM|PM)$/, (all, d, mon, y, hh, mm, ap) => {
            const m = nxMonth(mon);
            if (!m) return all;
            let h = parseInt(hh, 10) % 12;
            if (ap.toUpperCase() === 'PM') h += 12;
            return y + '年' + m + '月' + parseInt(d, 10) + '日 ' + (h < 10 ? '0' + h : h) + ':' + mm;
        }],
        // Dynamic UI labels preserve the numeric value and game name.
        [/^Served in ([\d.]+|--)s$/, '服务器响应耗时 $1 秒'],
        [/^Bookmark (.+)$/, '收藏 $1'],
    ],

    /* 页型上下文规则：引擎按 rule.selector 判定「当前文本节点是不是在这个固定 UI 子树里」，
     * 命中才翻，出了上下文一律不动。这样恰好叫 Vehicles / 28 Days / 20 Items 的
     * mod 标题、作者名、描述不会因为新增词条被牵连。pages 限定页型，避免溢出到 mod 详情页。 */
    scoped: [
        {
            pages: ['browse'],
            selector: '[data-e2eid="category-filter"], [data-e2eid="mod-tile-category"]',
            dict: NX_BROWSE_CATEGORY_ZH,
            patterns: [[/^(.+) \(([\d,]+)\)$/, nxCategoryCounted]],
        },
        {
            pages: ['browse'],
            selector: '[id^="headlessui-popover-panel"]',
            dict: {
                'All time': '所有时间',
                'From': '起始日期',
                'To': '截止日期',
                'From date': '起始日期',
                'To date': '截止日期',
                'Go': '跳转',
            },
            patterns: NX_TIME_OPTION_PATTERNS,
        },
        {
            pages: ['browse'],
            selector: '[class~="group/select"]',
            dict: { 'All time': '所有时间' },
            patterns: NX_TIME_OPTION_PATTERNS,
        },
        {
            pages: ['browse'],
            selector: '[data-e2eid^="remove-filter-"], [data-e2eid="remove-all-filters"]',
            dict: { 'Clear all': '全部清除', 'Remove filter for': '移除筛选' },
            patterns: [[/^Time range: (.+)$/, nxTimeRangeChip]],
            // "Title: <用户输入>"：按原始文本匹配，冒号后的值一位不动
            rawPatterns: [[/^(Title|Description|Author|Uploader): ([\s\S]*)$/, nxSearchChipLabel]],
        },
        {
            /* 页大小下拉里的固定营销说明（实机三节点拆分，见取证文件的 md:hidden 块）：
             *   <div class="mt-4 md:hidden"><p><span>View more results … with </span><a>premium</a><span>.</span></p></div>
             * 选择器钉在 md:hidden 营销块上，mod 标题/描述里的同串不受影响。 */
            pages: ['browse'],
            selector: '[id^="headlessui-listbox-options"] div[class~="md:hidden"][class~="mt-4"]',
            rawPatterns: [
                [/^View more results for mods, collections and media with\s*$/, '查看更多模组、合集与媒体结果，需升级为 '],
                [/^premium$/, '高级会员'],
                [/^\.$/, '。'],
            ],
        },
        {
            /* 页大小控件（实机 browse 页 `[data-e2eid="select-mods-per-page"]` + 它的
             * `[id^="headlessui-listbox-options"]` 面板）。本轮新增的大小写/单数扩展只在这里生效；
             * 全局仍保留 HEAD 的小写 `20 items` 词条行为（collections / media / news 旧前端走那条）。 */
            pages: ['browse'],
            selector: '[class~="group/select"], [id^="headlessui-listbox-options"]',
            patterns: [[/^([\d,]+)\s+items?$/i, '每页 $1 项']],
        },
        {
            /* 站点级会员横幅（实机 `p.text-body-md.text-neutral-moderate.min-w-0`）：
             * 粗体 span 与尾部说明各是一个文本节点，只在横幅容器内翻译。
             * 普通正文/标题里恰好写 "Try Premium free" 时不翻（见 jsdom 负向用例）。 */
            pages: 'all',
            selector: 'p[class~="min-w-0"][class~="text-neutral-moderate"]',
            dict: { 'Try Premium free': '免费试用 Premium' },
            patterns: [[/^([-\u2013\u2014])?\s*unlock faster downloads\s*&\s*1-click installs$/i, nxPremiumBannerTail]],
        },
        {
            // 页头 "7 Days To Die mods"：只换固定后缀，游戏名一个字节都不动
            pages: ['browse'],
            selector: 'h1',
            patterns: [[/^(.+?) mods$/, '$1 模组']],
        },
    ],
});

/* =============================================================================
 * engine.js —— 文本驱动的界面中文化引擎
 *
 * 设计要点（与「只翻界面、不翻 UGC」的口径一致）：
 *   1. 按 hostname 选站点，按 pathname 选页型，合并 global + 页型 词条
 *   2. 遍历文本节点与白名单属性（placeholder / aria-label / title），
 *      命中字典或正则即替换
 *   3. 命中即停：译文本身不会再命中字典，因此重复扫描是幂等的，
 *      MutationObserver 不会被自身写入喂成死循环
 *   4. UGC 区域（描述、评论、代码、输入框）由站点 ignore 选择器整棵子树跳过
 *   5. 原文写入 WeakMap，支持一键还原
 * ========================================================================== */

const CONFIG = {
    MAX_LEN: 80,                                  // 默认正则长度门槛
    PATTERN_MAX_LEN: 240,                         // 动态界面模板专用上限
    ATTRS: ['placeholder', 'aria-label', 'title'], // 属性翻译白名单
    SKIP_TAGS: ['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'KBD',
        'TEXTAREA', 'SVG', 'CANVAS', 'TEMPLATE', 'IFRAME'],
    DEBOUNCE: 80,
    CJK: /[\u4e00-\u9fff\u3040-\u30ff]/,
};

const State = {
    site: null,
    page: null,
    dict: new Map(),
    patterns: [],
    scoped: [],            // 页型上下文规则：只在该 DOM 上下文内查表（见 site.scoped）
    cache: new Map(),      // 原文 -> 译文（含 null，表示不翻）
    ignoreSelector: '',
    originals: new WeakMap(),     // 文本节点 -> 原文
    attrOriginals: new WeakMap(), // 元素 -> { 属性名: 原文 }，每个属性各自记录
    protectedNodes: new WeakSet(), // 动态名称文本节点（作者名等）：整节点不参与查表
    lastWritten: new WeakMap(),    // 文本节点 -> 本脚本最后写入的值（用于区分站点外写与自写）
    attrLastWritten: new WeakMap(), // 元素 -> { 属性名: 本脚本最后写入的值 }
    observer: null,
    timer: 0,
    enabled: true,
    writing: false,
    stats: { nodes: 0, attrs: 0 },
};

/* ------------------------------------------------------------------ 词条装配 */

/* 页型上下文规则装配：site.scoped = [{ pages?, selector, exclude?, dict?, patterns? }]
 * 只装配当前页型声明的规则；dict 过滤掉空值与同值，patterns 沿用「完整锚定」约定。
 * 用途：同一串在不同 DOM 上下文里含义不同（分类标签 vs mod 标题、下拉枚举 vs UGC），
 * 上下文里才翻，出了上下文一个字节都不动。 */
function buildScopedRules(site, page) {
    const rules = [];
    for (const rule of site.scoped || []) {
        if (!rule || !rule.selector) continue;
        // pages: 'all' 表示站点级组件（横幅等）在所有页型生效；数组则按页型精确装配
        if (rule.pages && rule.pages !== 'all' && rule.pages.indexOf(page) === -1) continue;
        const dict = new Map();
        const source = rule.dict || {};
        for (const key of Object.keys(source)) {
            const val = source[key];
            if (typeof val === 'string' && val && val !== key) dict.set(key, val);
        }
        rules.push({
            selector: rule.selector,
            exclude: rule.exclude || '',
            dict,
            patterns: rule.patterns || [],
            // rawPatterns：按**原始文本**匹配（不归一化空白），用于"固定前缀 + 用户输入值"这类
            // 必须逐字节保留值的内容（如已选筛选 chip 的 "Title: <用户输入>"）。
            rawPatterns: rule.rawPatterns || [],
        });
    }
    return rules;
}

function buildDict(site, page) {
    const dict = new Map();
    // 站点可声明 alias：{ 页型: 共享页型 }，例如 Thunderstore 的作者列表页
    // 复用社区页的列表 UI 词条。共享页型先铺，本页型后铺，本页型优先。
    const alias = site.alias && site.alias[page];
    const groups = alias && site.dict[alias]
        ? [site.dict.global, site.dict[alias], site.dict[page]]
        : [site.dict.global, site.dict[page]];
    for (const group of groups) {
        if (!group) continue;
        for (const key of Object.keys(group)) {
            const val = group[key];
            if (typeof val === 'string' && val && val !== key) dict.set(key, val);
        }
    }
    State.dict = dict;
    State.patterns = site.patterns || [];
    State.scoped = buildScopedRules(site, page);
    State.cache.clear();
    // 页型级 ignore：只在某些页型成立的忽略选择器（Thunderstore 面包屑末段在
    // author/package/community 是动态名称，在社区总览/上传/工具页却是固定 UI）。
    // 与 alias 一样按页型装配，换页型时重建，保证不漏配也不残留。
    const pageIgnore = (site.ignorePages && site.ignorePages[page]) || '';
    State.ignoreSelector = [site.ignore, pageIgnore].filter(Boolean).join(',');
}

function detectSite() {
    const host = location.hostname;
    // 调试用：docs/demo/ 下的本地复现页没有真实域名，可用 window.__MODS_ZH_FORCE_SITE__ 指定站点 id
    const forced = (typeof window !== 'undefined' && window.__MODS_ZH_FORCE_SITE__) || '';
    for (const site of SITES) {
        if (forced && site.id === forced) return site;
        if (site.match.test(host)) return site;
    }
    return null;
}

function currentPage(site) {
    const forced = (typeof window !== 'undefined' && window.__MODS_ZH_FORCE_PAGE__) || '';
    return forced || site.detect(location.pathname, location.hostname);
}

/* ------------------------------------------------------------------ 文本翻译 */

function normalize(text) {
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * 查表：精确命中优先，其次正则。
 * @param {string} key 归一化后的原文
 * @returns {string|null} 译文；无命中返回 null
 */
function lookup(key) {
    if (State.cache.has(key)) return State.cache.get(key);
    if (CONFIG.CJK.test(key)) { State.cache.set(key, null); return null; } // 已是中日文
    if (/^[\s\d.,:%+\-/()（）]+$/.test(key)) { State.cache.set(key, null); return null; } // 纯数字符号

    let result = null;
    if (State.dict.has(key)) {
        // 精确白名单允许长帮助句；动态正则须完整锚定并受长度上限约束。
        result = State.dict.get(key);
    } else if (key.length <= CONFIG.MAX_LEN ||
        (State.site && State.site.id === 'thunderstore' && key.length <= CONFIG.PATTERN_MAX_LEN)) {
        for (const [re, to] of State.patterns) {
            if (!re.test(key)) continue;
            const out = typeof to === 'function' ? key.replace(re, to) : key.replace(re, to);
            if (out && out !== key) { result = out; break; }
        }
    }
    State.cache.set(key, result);
    return result;
}

/**
 * 上下文 raw 规则：与 lookupScoped 同样是"只在 rule.selector 子树内"，但直接匹配
 * 文本节点的原始值（nodeValue），不做空白归一化、不做 CJK/纯符号跳过。
 * 用于固定前缀 + 动态值同节点、且值必须逐字节保留的场景（chip 的 "Title: <用户输入>"）。
 * 替换一律走函数形式，值里的 $1 / $& / $` 不会被 String.replace 当替换模式解释。
 * @returns {boolean} 是否已改写该节点
 */
/* 站点在原地改写同一节点（筛选条件变化、SPA 局部刷新）时，nodeValue/属性值会变成新的站点原文。
 * MutationObserver 的回调是异步的（微任务之后才到），State.writing 那时早已复位，
 * 因此不能靠同步标记区分「自写」和「站点外写」；这里用 lastWritten 记录本脚本最后写入的值：
 *   · 当前值 == lastWritten  -> 是自写（或未被改写），保持原原文不动；
 *   · 当前值 != lastWritten  -> 站点外写，把原文更新为站点当前值，避免关闭开关回滚旧值。
 * WeakMap 不持有节点，节点被销毁后自动释放。 */
function refreshOriginal(node, raw) {
    const written = State.lastWritten.get(node);
    if (written !== undefined) {
        if (written === raw) return;                 // 自写：原文不动
        State.originals.set(node, raw);              // 站点在开启状态下改写
        State.lastWritten.delete(node);
        return;
    }
    // lastWritten 缺失有两种来源：① 从没写过；② 上一次关闭时还原过并清掉了记录。
    // 无论哪种，只要当前值与已记录原文不同，就是站点在关闭期间改写了该节点，
    // 原文必须跟进——否则再次关闭会复活过期值。
    if (State.originals.has(node) && State.originals.get(node) !== raw) {
        State.originals.set(node, raw);
    }
}

function translateScopedRaw(node, el) {
    if (!State.scoped.length || !el || typeof el.closest !== 'function') return false;
    const raw = node.nodeValue;
    if (!raw) return false;
    refreshOriginal(node, raw);
    for (const rule of State.scoped) {
        if (!rule.rawPatterns.length) continue;
        let host = null;
        try { host = el.closest(rule.selector); } catch (e) { host = null; }
        if (!host) continue;
        if (rule.exclude) {
            let blocked = false;
            try { blocked = !!el.closest(rule.exclude); } catch (e) { blocked = false; }
            if (blocked) continue;
        }
        for (const [re, to] of rule.rawPatterns) {
            if (!re.test(raw)) continue;
            const out = raw.replace(re, to);
            if (!out || out === raw) continue;
            if (!State.originals.has(node)) State.originals.set(node, raw);
            State.writing = true;
            node.nodeValue = out;
            State.writing = false;
            State.lastWritten.set(node, out);
            State.stats.nodes++;
            return true;
        }
    }
    return false;
}

/**
 * 页型上下文查表：只有当 rule.selector 命中 el 的祖先子树时才生效，命中即停。
 * 结果依赖上下文，因此不写 State.cache（缓存是「原文 -> 译文」的全局单值）。
 * @param {Element|null} el 文本节点的父元素 / 属性宿主
 * @param {string} key 归一化后的原文
 * @returns {string|null} 译文；无命中返回 null
 */
function lookupScoped(el, key) {
    if (!State.scoped.length || !el || typeof el.closest !== 'function') return null;
    for (const rule of State.scoped) {
        let host = null;
        try { host = el.closest(rule.selector); } catch (e) { host = null; }
        if (!host) continue;
        if (rule.exclude) {
            let blocked = false;
            try { blocked = !!el.closest(rule.exclude); } catch (e) { blocked = false; }
            if (blocked) continue;
        }
        if (rule.dict.has(key)) return rule.dict.get(key);
        for (const [re, to] of rule.patterns) {
            if (!re.test(key)) continue;
            const out = key.replace(re, to);
            if (out && out !== key) return out;
        }
    }
    return null;
}

function isIgnored(el) {
    if (!el) return true;
    if (State.ignoreSelector) {
        try {
            if (el.closest(State.ignoreSelector)) return true;
        } catch (e) { /* 选择器非法时忽略该层保护 */ }
    }
    if (el.isContentEditable) return true;
    if (CONFIG.SKIP_TAGS.indexOf(el.tagName) !== -1) return true;
    return false;
}

function translateTextNode(node) {
    // 动态名称（作者/团队名）节点整节点跳过：名称可能正好等于某条界面词条
    if (State.protectedNodes.has(node)) return false;
    const raw = node.nodeValue;
    if (!raw) return false;
    // 站点外写（同一节点被改成新内容）时先刷新原文，再按新内容查表
    refreshOriginal(node, raw);
    const key = normalize(raw);
    if (!key) return false;

    const parent = node.parentElement;
    // 上下文 raw 规则（固定前缀 + 需逐字节保留的值）优先；忽略区域不参与
    if (!isIgnored(parent) && translateScopedRaw(node, parent)) return true;
    let hit = lookup(key) || lookupScoped(parent, key);
    let authorPrefix = false;

    // Thunderstore 的卡片常把静态 "by" 前缀包在 author 容器里；
    // 保留作者链接原文，只翻前缀，避免 ignore 规则连 UI 一起吞掉。
    if (State.site && State.site.id === 'thunderstore' && parent) {
        let authorContainer = null;
        try { authorContainer = parent.closest('[class*="author"],[class*="Author"]'); } catch (e) { /* ignore */ }
        if (authorContainer) {
            let authorLink = null;
            try { authorLink = parent.closest('a'); } catch (e) { /* ignore */ }
            if (authorLink) return false;
            const prefix = raw.match(/^(\s*)by(?=\s|$)/i);
            if (!prefix) return false;
            hit = prefix[1] + '作者' + raw.slice(prefix[0].length);
            authorPrefix = true;
        }
    }

    if (!hit || (!authorPrefix && hit === key)) return false;
    if (isIgnored(parent) && !authorPrefix) return false;

    if (!State.originals.has(node)) State.originals.set(node, raw);
    const lead = raw.match(/^\s*/)[0];
    const trail = raw.match(/\s*$/)[0];
    const next = authorPrefix ? hit : lead + hit + trail;
    State.writing = true;
    node.nodeValue = next;
    State.writing = false;
    State.lastWritten.set(node, next);
    State.stats.nodes++;
    return true;
}

function translateAttributes(el) {
    let changed = false;
    for (const attr of CONFIG.ATTRS) {
        const raw = el.getAttribute(attr);
        if (!raw) continue;
        // 同一元素的 placeholder / aria-label / title 各自记原文，还原时才不会互相覆盖
        let record = State.attrOriginals.get(el);
        if (!record) { record = {}; State.attrOriginals.set(el, record); }
        let written = State.attrLastWritten.get(el);
        if (!written) { written = {}; State.attrLastWritten.set(el, written); }
        // 站点原地改写该属性：原文换成站点当前值。这一句必须放在"是否需要翻译"之前——
        // 站点改成的新值可能压根没有词条，此时若不更新原文，关闭开关会把它冲回旧值。
        if (attr in written) {
            if (written[attr] !== raw) {
                record[attr] = raw;
                delete written[attr];
            }
        } else if ((attr in record) && record[attr] !== raw) {
            // 关闭期间站点改写：记录里还是上一次的原文，同样要跟进
            record[attr] = raw;
        }
        const key = normalize(raw);
        if (!key) continue;
        const hit = lookup(key) || lookupScoped(el, key);
        if (!hit || hit === key) continue;
        // Also honor ignore selectors on the attribute host itself, without suppressing textarea placeholders.
        if ((isIgnored(el) && el.tagName !== 'TEXTAREA') || isIgnored(el.parentElement)) continue;
        if (!(attr in record)) record[attr] = raw;
        el.setAttribute(attr, hit);
        written[attr] = hit;
        changed = true;
        State.stats.attrs++;
    }
    return changed;
}

/* 页头「固定前缀 + 动态名称」：Thunderstore 的真实形态是
 *   <h1 class="… page-header__heading">Mods uploaded by <!-- -->Misc</h1>
 * React 注释把前缀和作者/团队名拆成两个文本节点，而名称可能正好等于某条界面词条
 * （Misc / Tools / All / Libraries / Cards / View / Deprecated …），整节点查表会被误翻成“杂项”。
 * 这里只改前缀文本节点，同一页头里其余文本节点标记为受保护，名称一个字节都不动；
 * 单文本节点形态同理（只替换其中的前缀片段）。站点用 namePrefixes 声明规则。
 */
function translateHeaderNamePrefix(root) {
    const rules = (State.site && State.site.namePrefixes) || [];
    if (!rules.length || !root || !root.querySelectorAll) return;
    const doc = root.ownerDocument || root;

    for (const rule of rules) {
        const targets = [];
        if (root.matches && root.matches(rule.selector)) targets.push(root);
        for (const el of root.querySelectorAll(rule.selector)) targets.push(el);

        for (const el of targets) {
            if (!rule.re.test(normalize(el.textContent || ''))) continue;

            const walker = doc.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */, null);
            const nodes = [];
            let node = walker.nextNode();
            while (node) { nodes.push(node); node = walker.nextNode(); }

            let prefixNode = null;
            for (const textNode of nodes) {
                const raw = textNode.nodeValue || '';
                const at = raw.indexOf(rule.from);
                if (at === -1) continue;
                const value = raw.slice(0, at) + rule.to + raw.slice(at + rule.from.length);
                if (!State.originals.has(textNode)) State.originals.set(textNode, raw);
                State.writing = true;
                textNode.nodeValue = value;
                State.writing = false;
                State.lastWritten.set(textNode, value);
                State.stats.nodes++;
                prefixNode = textNode;
                break;
            }

            // 前缀之外的一切都是动态名称，整节点受保护（含重复扫描时的幂等路径）
            for (const textNode of nodes) {
                if (textNode !== prefixNode) State.protectedNodes.add(textNode);
            }
        }
    }
}

/* 统计文案常由数字节点和 React 注释拆开的文本组成。
 * 只在完整计数容器匹配时翻译分隔词，保留数字及其 DOM 结构。 */
function translateSplitResultCounter(root) {
    if (!root || !root.querySelectorAll) return;
    // 区间形态 1-20 of 868 results；末页 / 仅一条时不带区间：1 of 1 result、21 of 21 results
    const resultRe = /^[\d,]+(?:\s*-\s*[\d,]+)? of [\d,]+ results?$/i;
    const doc = root.ownerDocument || root;

    for (const el of root.querySelectorAll('*')) {
        if (isIgnored(el) || !resultRe.test(normalize(el.textContent || ''))) continue;
        let nestedMatch = false;
        for (const child of el.children) {
            if (resultRe.test(normalize(child.textContent || ''))) { nestedMatch = true; break; }
        }
        if (nestedMatch) continue;

        const walker = doc.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */, null);
        const nodes = [];
        let node = walker.nextNode();
        while (node) { nodes.push(node); node = walker.nextNode(); }
        const write = (target, value, count = true) => {
            if (!target || target.nodeValue === value) return;
            if (!State.originals.has(target)) State.originals.set(target, target.nodeValue);
            State.writing = true;
            target.nodeValue = value;
            State.writing = false;
            State.lastWritten.set(target, value);
            if (count) State.stats.nodes++;
        };

        for (let i = 0; i < nodes.length; i++) {
            const textNode = nodes[i];
            const token = normalize(textNode.nodeValue || '').toLowerCase();
            if (token === 'of') {
                const previous = nodes[i - 1];
                if (previous && /^\s*[\d,]+(?:\s*-\s*[\d,]+)?\s*$/.test(previous.nodeValue || '')) {
                    write(previous, (previous.nodeValue || '').replace(/\s+$/, ''), false);
                }
                write(textNode, '，共 ');
            } else if (token === 'results') {
                write(textNode, ' 条结果');
            } else if (token === 'result') {
                write(textNode, ' 条结果');
                const suffix = nodes[i + 1];
                if (suffix && normalize(suffix.nodeValue || '').toLowerCase() === 's') {
                    write(suffix, '', false);
                    i++;
                }
            }
        }
    }
}

/* 上传成功摘要含动态数量和 React 拆开的 community / 冒号；
 * 仅在完整摘要容器匹配时修正，避免改写 UGC 标点。 */
function translateSplitPackageListingSummary(root) {
    if (!root || !root.querySelectorAll) return;
    const summaryRe = /^(?:The package is listed in|软件包已发布到)\s+[\d,]+\s+(?:communities|community|个社区)\s*[:：]\s*$/i;
    const doc = root.ownerDocument || root;

    for (const el of root.querySelectorAll('*')) {
        if (isIgnored(el) || !summaryRe.test(normalize(el.textContent || ''))) continue;
        let nestedMatch = false;
        for (const child of el.children) {
            if (summaryRe.test(normalize(child.textContent || ''))) { nestedMatch = true; break; }
        }
        if (nestedMatch) continue;

        const walker = doc.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */, null);
        let node = walker.nextNode();
        while (node) {
            const raw = node.nodeValue || '';
            const value = raw
                .replace(/The package is listed in/i, '软件包已发布到')
                .replace(/\bcommunities?\b/i, '个社区')
                .replace(/:\s*$/, suffix => suffix.replace(':', '：'));
            if (value !== raw) {
                if (!State.originals.has(node)) State.originals.set(node, raw);
                State.writing = true;
                node.nodeValue = value;
                State.writing = false;
                State.lastWritten.set(node, value);
                State.stats.nodes++;
            }
            node = walker.nextNode();
        }
    }
}

/* Required 计数在 React SSR 中被注释拆成 "Required (" / 数字 / ")"；
 * 仅在完整计数容器吻合时翻译，避免误碰 UGC 里的普通单词。 */
function translateSplitRequiredCounter(root) {
    if (!root || !root.querySelectorAll) return;
    const requiredRe = /^(?:Required|必需依赖)\s*\(\s*[\d,]+\s*\)$/i;
    const doc = root.ownerDocument || root;

    for (const el of root.querySelectorAll('*')) {
        if (isIgnored(el) || !requiredRe.test(normalize(el.textContent || ''))) continue;
        let nestedMatch = false;
        for (const child of el.children) {
            if (requiredRe.test(normalize(child.textContent || ''))) { nestedMatch = true; break; }
        }
        if (nestedMatch) continue;

        const walker = doc.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */, null);
        const nodes = [];
        let node = walker.nextNode();
        while (node) { nodes.push(node); node = walker.nextNode(); }
        const write = (target, value) => {
            if (target.nodeValue === value) return;
            if (!State.originals.has(target)) State.originals.set(target, target.nodeValue);
            State.writing = true;
            target.nodeValue = value;
            State.writing = false;
            State.lastWritten.set(target, value);
            State.stats.nodes++;
        };

        for (const textNode of nodes) {
            const raw = textNode.nodeValue || '';
            const value = raw
                .replace(/\bRequired\b/i, '必需依赖')
                .replace(/(必需依赖)\s*\(/, '$1（')
                .replace(/\s*\)/g, '）');
            write(textNode, value);
        }

        // React 也可能把标签、空格与括号分成三个不同文本节点。
        for (let i = 0; i < nodes.length - 1; i++) {
            const left = nodes[i];
            const right = nodes[i + 1];
            if (/必需依赖\s+$/.test(left.nodeValue || '') && /^\s*（/.test(right.nodeValue || '')) {
                write(left, left.nodeValue.replace(/\s+$/, ''));
                write(right, right.nodeValue.replace(/^\s+/, ''));
            }
            if (/[\d,]+\s+$/.test(left.nodeValue || '') && /^\s*）/.test(right.nodeValue || '')) {
                write(left, left.nodeValue.replace(/\s+$/, ''));
                write(right, right.nodeValue.replace(/^\s+/, ''));
            }
        }
    }
}

/* ------------------------------------------------------------------ DOM 遍历 */

function scanRoot(root) {
    if (!root) return;
    const doc = root.ownerDocument || root;
    const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */, null);
    const batch = [];
    let n = walker.nextNode();
    while (n) {
        batch.push(n);
        n = walker.nextNode();
    }
    translateHeaderNamePrefix(root);
    for (const node of batch) translateTextNode(node);
    translateSplitResultCounter(root);
    translateSplitRequiredCounter(root);
    translateSplitPackageListingSummary(root);

    if (root.querySelectorAll) {
        const sel = CONFIG.ATTRS.map(a => '[' + a + ']').join(',');
        for (const el of root.querySelectorAll(sel)) {
            if (isIgnored(el)) continue;
            translateAttributes(el);
        }
    }
}

function schedule() {
    if (!State.enabled) return;
    if (State.timer) return;
    State.timer = setTimeout(() => {
        State.timer = 0;
        if (!State.enabled) return;
        scanRoot(document.body);
    }, CONFIG.DEBOUNCE);
}

function startObserver() {
    if (State.observer || !document.body) return;
    State.observer = new MutationObserver((records) => {
        if (State.writing) return;
        for (const r of records) {
            if (r.type === 'characterData') { schedule(); return; }
            if (r.type === 'attributes') { schedule(); return; }
            if (r.addedNodes && r.addedNodes.length) { schedule(); return; }
        }
    });
    State.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: CONFIG.ATTRS,
    });
}

function stopObserver() {
    if (State.observer) { State.observer.disconnect(); State.observer = null; }
    if (State.timer) { clearTimeout(State.timer); State.timer = 0; }
}

/* ------------------------------------------------------------------ 开关 */

function restoreAll() {
    // 文本节点：只回写"本脚本最后写入、且之后没被站点改写"的节点。
    // 当前值与 lastWritten 不一致 ⇒ 站点（含关闭期间）已经改写，以站点当前值为准，
    // 把原文更新为它并跳过回写，避免关闭操作复活过期内容。
    const walker = document.createTreeWalker(document.body, 4, null);
    let n = walker.nextNode();
    while (n) {
        const written = State.lastWritten.get(n);
        if (written !== undefined) {
            const current = n.nodeValue;
            if (current !== written) {
                State.originals.set(n, current);
            } else if (State.originals.has(n)) {
                n.nodeValue = State.originals.get(n);
            }
            State.lastWritten.delete(n);
        }
        n = walker.nextNode();
    }
    // 属性：逐元素逐属性还原，placeholder / aria-label / title 各自独立。
    // 只处理本脚本写过的属性；站点在关闭期间移除的不要复活，改写的以当前值为准。
    const attrSelector = CONFIG.ATTRS.map(a => '[' + a + ']').join(',');
    for (const el of document.querySelectorAll(attrSelector)) {
        const record = State.attrOriginals.get(el);
        const written = State.attrLastWritten.get(el);
        if (!record || !written) continue;
        for (const attr of Object.keys(written)) {
            const current = el.getAttribute(attr);
            if (current === null) { delete record[attr]; continue; }              // 站点已移除：不复活
            if (current !== written[attr]) { record[attr] = current; continue; }  // 站点已改写：以当前值为准
            if (attr in record) el.setAttribute(attr, record[attr]);
        }
        State.attrLastWritten.delete(el);
    }
}

function setEnabled(on) {
    State.enabled = !!on;
    if (State.enabled) {
        scanRoot(document.body);
        startObserver();
    } else {
        stopObserver();
        restoreAll();
    }
    return State.enabled;
}

/* ------------------------------------------------------------------ 生命周期 */

function onLocationChange() {
    if (!State.site) return;
    const page = currentPage(State.site);
    if (page === State.page) return;
    State.page = page;
    buildDict(State.site, page);
    // 只重建「按页型装配」的东西（词条/正则/上下文规则/ignore，buildDict 内完成）与页头名称保护；
    // 原文容器必须保留：SPA 切页不销毁导航、筛选控件等节点，重建会让这些节点的原文丢失，
    // 关闭开关时无法逐字还原（originals / attrOriginals / lastWritten 均为 WeakMap，随节点回收）。
    State.protectedNodes = new WeakSet();
    if (State.enabled) scanRoot(document.body);
}

function boot() {
    State.site = detectSite();
    if (!State.site) return false;
    State.page = currentPage(State.site);
    buildDict(State.site, State.page);

    if (document.body) {
        if (State.enabled) scanRoot(document.body);
        startObserver();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            if (State.enabled) scanRoot(document.body);
            startObserver();
        }, { once: true });
    }
    return true;
}

/* ------------------------------------------------------------------ 调试出口 */

const API = {
    get version() { return typeof VERSION !== 'undefined' ? VERSION : 'dev'; },
    get site() { return State.site ? State.site.id : null; },
    get page() { return State.page; },
    get stats() { return { nodes: State.stats.nodes, attrs: State.stats.attrs }; },
    get enabled() { return State.enabled; },
    entries() { return State.dict.size; },
    setEnabled,
    rescan: () => scanRoot(document.body),
};

/* =============================================================================
 * bootstrap.js —— 启动、菜单、持久化、URL 变化接管
 * ========================================================================== */

const STORE_KEY = 'modsZh.enabled';
const HOME_URL = 'https://github.com/hawchou1995/mods-zh';

function loadEnabled() {
    try {
        if (typeof GM_getValue === 'function') {
            const v = GM_getValue(STORE_KEY, true);
            return v === undefined ? true : !!v;
        }
    } catch (e) { /* 无 GM 环境 */ }
    try {
        const v = localStorage.getItem(STORE_KEY);
        return v === null ? true : v === '1';
    } catch (e) { /* 隐私模式 */ }
    return true;
}

function saveEnabled(on) {
    try {
        if (typeof GM_setValue === 'function') { GM_setValue(STORE_KEY, on); return; }
    } catch (e) { /* ignore */ }
    try { localStorage.setItem(STORE_KEY, on ? '1' : '0'); } catch (e) { /* ignore */ }
}

function openUrl(url) {
    if (typeof GM_openInTab === 'function') { GM_openInTab(url, { active: true }); return; }
    window.open(url, '_blank');
}

/* 菜单：状态切换 + 手动重扫 + 版本 + 反馈入口 */
function registerMenu() {
    if (typeof GM_registerMenuCommand !== 'function') return;

    GM_registerMenuCommand(
        State.enabled ? '界面中文化：已开启（点击切回原文）' : '界面中文化：已关闭（点击开启）',
        () => {
            const on = setEnabled(!State.enabled);
            saveEnabled(on);
            if (typeof GM_unregisterMenuCommand === 'function' && State.menuId) {
                GM_unregisterMenuCommand(State.menuId);
            }
            registerMenu();
        }
    );

    GM_registerMenuCommand('重新扫描当前页面', () => {
        if (!State.enabled) return;
        State.cache.clear();
        // 原文容器不清空：重扫不能丢掉已翻译节点的原文，否则关闭开关无法逐字还原
        State.protectedNodes = new WeakSet();
        scanRoot(document.body);
    });

    GM_registerMenuCommand('版本 v' + API.version + '（' + (State.site ? State.site.name : '未匹配站点') + '）', () => {
        const s = API.stats;
        alert('mods-zh v' + API.version +
            '\n站点：' + (State.site ? State.site.name : '未匹配') +
            '\n页型：' + State.page +
            '\n词条：' + State.dict.size + ' 条' +
            '\n已替换：文本 ' + s.nodes + ' 处，属性 ' + s.attrs + ' 处');
    });

    GM_registerMenuCommand('打开项目主页 / 反馈问题', () => openUrl(HOME_URL));
}

/* SPA 路由变化：history 劫持 + popstate + hashchange + 低频兜底 */
function watchUrl() {
    let last = location.href;
    const tick = () => {
        if (location.href === last) return;
        last = location.href;
        onLocationChange();
    };
    for (const fn of ['pushState', 'replaceState']) {
        const orig = history[fn];
        if (typeof orig !== 'function') continue;
        history[fn] = function () {
            const ret = orig.apply(this, arguments);
            setTimeout(tick, 0);
            return ret;
        };
    }
    window.addEventListener('popstate', tick);
    window.addEventListener('hashchange', tick);
    setInterval(tick, 700);
}

(function main() {
    State.enabled = loadEnabled();

    const ok = boot();
    if (!ok) return;

    registerMenu();
    watchUrl();

    // 调试出口：控制台可查 __MODS_ZH__.stats / .entries()
    try { window.__MODS_ZH__ = API; } catch (e) { /* 沙箱只读 */ }
})();
})();
