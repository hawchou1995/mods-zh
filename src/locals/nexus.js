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
