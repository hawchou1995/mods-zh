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
            'Search Mods...': '搜索模组…',
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
        },
    },

    /* ---------------- 正则组 ---------------- */
    patterns: [
        // "1-20 of 19588 results"
        [/^(\d[\d,]*)-(\d[\d,]*) of ([\d,]+) results$/, '$1-$2，共 $3 条结果'],
        // "19588 results"
        [/^([\d,]+) results$/, '共 $1 条结果'],
        // "Required (0)"
        [/^Required\s*\(\s*(\d+)\s*\)$/i, '必需依赖（$1）'],
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
