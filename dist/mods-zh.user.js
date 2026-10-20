// ==UserScript==
// @name         Thunderstore & Nexus Mods 中文化
// @name:en      Thunderstore & Nexus Mods Chinese
// @namespace    https://github.com/hawchou1995/mods-zh
// @version      1.0.0
// @description  中文化 Thunderstore 与 Nexus Mods 的界面元素：导航、按钮、筛选器、分类、语言、排序、下载区、面包屑、相对时间与日期。不翻译模组名称、作者、描述与评论。
// @description:en  Localize Thunderstore and Nexus Mods UI elements (navigation, buttons, filters, categories, sorting, download panels, relative dates) into Simplified Chinese. Mod names, authors, descriptions and comments stay untranslated.
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

    const VERSION = "1.0.0";

/* =============================================================================
 * _registry.js —— 站点注册表
 *
 * 每个站点模块把自身对象 push 进 SITES，engine.js 启动时按 hostname 匹配。
 * 站点对象约定：
 *   {
 *     id:     唯一标识
 *     name:   人类可读名称（菜单里显示）
 *     match:  hostname 正则
 *     ignore: 忽略选择器字符串（UGC / 代码 / 用户输入区域）
 *     detect(pathname, search): 返回页型字符串
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
        '[class*="package-name"]', '[class*="PackageName"]',
        '[class*="author"]', '[class*="Author"]',
        '[class*="description"]', '[class*="Description"]',
        '[class*="changelog"]', '[class*="Changelog"]',
        'script', 'style', 'noscript',
    ].join(','),

    detect(path) {
        if (path === '/' || path === '') return 'home';
        if (path.indexOf('/communities') === 0) return 'communities';
        if (path.indexOf('/package/create') === 0) return 'upload';
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
            'Search': '搜索',
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
            'Thunderstore development is made possible with ads. Please consider making an exception to your adblock.':
                'Thunderstore 依靠广告维持开发，请考虑对本站关闭广告拦截。',

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
        },

        /* ---------------- 上传页 /package/create/ ---------------- */
        upload: {
            'Upload': '上传',
            'Package name': '包名',
            'Community': '社区',
            'Submit': '提交',
            'Cancel': '取消',
        },
    },

    /* ---------------- 正则组 ---------------- */
    patterns: [
        // "1-20 of 19588 results"
        [/^(\d[\d,]*)-(\d[\d,]*) of ([\d,]+) results$/, '$1-$2，共 $3 条结果'],
        // "19588 results"
        [/^([\d,]+) results$/, '共 $1 条结果'],
        // "Required (0)"
        [/^Required \((\d+)\)$/, '必需依赖（$1）'],
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
        'script', 'style', 'noscript',
    ].join(','),

    detect(path, host) {
        if (host.indexOf('users.nexusmods.com') === 0) return 'account';
        if (path === '/' || path === '') return 'home';
        if (/^\/games\/[^/]+\/mods\/\d+/.test(path)) return 'mod';
        if (/^\/[^/]+\/mods\/\d+/.test(path)) return 'mod';          // 旧版详情页
        if (/^\/games\/[^/]+\/mods\/?$/.test(path)) return 'browse';
        if (/^\/games\/?$/.test(path)) return 'games';
        if (/^\/games\/[^/]+\/?$/.test(path)) return 'game';
        if (path.indexOf('/collections') === 0) return 'collection';
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
        },

        /* ---------------- 首页 ---------------- */
        home: {
            'Browse the internet\'s best mods': '浏览全网最优秀的模组',
        },

        /* ---------------- 模组浏览页 /games/<game>/mods ---------------- */
        browse: {
            'Home': '首页',
            'Browse the internet\'s best mods': '浏览全网最优秀的模组',
            'Hide filters': '收起筛选',
            'Show filters': '展开筛选',
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
    MAX_LEN: 80,                                  // 超长文本不处理（多为正文）
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
    cache: new Map(),      // 原文 -> 译文（含 null，表示不翻）
    ignoreSelector: '',
    originals: new WeakMap(), // 文本节点/属性宿主 -> 原文
    observer: null,
    timer: 0,
    enabled: true,
    writing: false,
    stats: { nodes: 0, attrs: 0 },
};

/* ------------------------------------------------------------------ 词条装配 */

function buildDict(site, page) {
    const dict = new Map();
    const groups = [site.dict.global, site.dict[page]];
    for (const group of groups) {
        if (!group) continue;
        for (const key of Object.keys(group)) {
            const val = group[key];
            if (typeof val === 'string' && val && val !== key) dict.set(key, val);
        }
    }
    State.dict = dict;
    State.patterns = site.patterns || [];
    State.cache.clear();
    State.ignoreSelector = site.ignore || '';
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
    if (key.length > CONFIG.MAX_LEN) { State.cache.set(key, null); return null; }
    if (CONFIG.CJK.test(key)) { State.cache.set(key, null); return null; } // 已是中日文
    if (/^[\s\d.,:%+\-/()（）]+$/.test(key)) { State.cache.set(key, null); return null; } // 纯数字符号

    let result = null;
    if (State.dict.has(key)) {
        result = State.dict.get(key);
    } else {
        for (const [re, to] of State.patterns) {
            if (!re.test(key)) continue;
            const out = typeof to === 'function' ? key.replace(re, to) : key.replace(re, to);
            if (out && out !== key) { result = out; break; }
        }
    }
    State.cache.set(key, result);
    return result;
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
    const raw = node.nodeValue;
    if (!raw) return false;
    const key = normalize(raw);
    if (!key) return false;
    const hit = lookup(key);
    if (!hit || hit === key) return false;
    if (isIgnored(node.parentElement)) return false;

    if (!State.originals.has(node)) State.originals.set(node, raw);
    const lead = raw.match(/^\s*/)[0];
    const trail = raw.match(/\s*$/)[0];
    State.writing = true;
    node.nodeValue = lead + hit + trail;
    State.writing = false;
    State.stats.nodes++;
    return true;
}

function translateAttributes(el) {
    let changed = false;
    for (const attr of CONFIG.ATTRS) {
        const raw = el.getAttribute(attr);
        if (!raw) continue;
        const key = normalize(raw);
        if (!key) continue;
        const hit = lookup(key);
        if (!hit || hit === key) continue;
        if (isIgnored(el.parentElement)) continue;
        if (!State.originals.has(el)) State.originals.set(el, raw);
        el.setAttribute(attr, hit);
        changed = true;
        State.stats.attrs++;
    }
    return changed;
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
    for (const node of batch) translateTextNode(node);

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
    // 文本节点
    const walker = document.createTreeWalker(document.body, 4, null);
    let n = walker.nextNode();
    while (n) {
        if (State.originals.has(n)) n.nodeValue = State.originals.get(n);
        n = walker.nextNode();
    }
    // 属性
    for (const attr of CONFIG.ATTRS) {
        for (const el of document.querySelectorAll('[' + attr + ']')) {
            if (State.originals.has(el)) el.setAttribute(attr, State.originals.get(el));
        }
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
    State.originals = new WeakMap();
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
        State.originals = new WeakMap();
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
