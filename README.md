# 研究档案

纯静态个人研究网站。没有构建步骤，没有服务端，也没有外部依赖。

## 目录结构

```
report/
├── README.md
├── project/
│   ├── report.Caddyfile # Caddy 静态托管配置（report.yao-yang.cn）
│   └── after_push.sh    # 部署脚本：软链 Caddyfile 并 reload
└── site/                # 网站根目录（Caddy root）
    ├── index.html       # 首页：免责声明 + 倒序报告目录
    ├── assets/          # 首页专用样式、脚本、图标
    ├── robots.txt
    └── reports/
        └── bloom-energy/           # 公司（永久 slug）
            └── 2026-11-11/         # 报告日期（YYYY-MM-DD）
                ├── index.html      # 该期报告
                ├── cover.webp      # 首页封面缩略图
                └── assets/         # 该期报告引用的全部图片与脚本
```

每期报告都是自包含的：删除公司下的某个日期目录，就同时删除了那一期的正文、封面和全部依赖。

## 部署

线上由服务器上的 Caddy 托管，域名 `report.yao-yang.cn`。本站没有后端进程，
Caddy 只负责返回页面和相关的静态文件。

- `project/report.Caddyfile`：`root * /var/www/report/site`、`file_server`、`encode gzip`
- `project/after_push.sh`：把 Caddyfile 软链到 `/etc/caddy/0.report.Caddyfile` 并 reload Caddy

服务器上仓库放在 `/var/www/report`，拉取更新后执行：

```bash
./project/after_push.sh
```

新增或更新报告后不需要重启任何服务，Caddy 会直接读取 `site/` 下的静态文件。

## 本地预览

```bash
cd site
python3 -m http.server 4173 --bind 127.0.0.1
```

然后打开 <http://127.0.0.1:4173/>。

## 新增一期报告

1. 在对应公司目录下新建日期文件夹，例如：
   `site/reports/bloom-energy/2027-03-15/`
2. 把报告 HTML 命名为 `index.html`，所有依赖放入同目录的 `assets/`。
3. 生成一张 4:3 封面 `cover.webp`（建议 1200×900），放在同一日期目录。
4. 在 `site/index.html` 的对应日期分组最上方新增一张报告卡片；如果是新的日期，
   整组（日期行 + 卡片）放在旧日期之上。
5. 给报告页加返回首页的链接。当前报告页中的写法是：

```html
<a id="back-to-index" href="../../../index.html" aria-label="返回报告目录">…</a>
```

报告目录使用 `<公司 slug>/<报告日期>/`，同一家公司再次覆盖时新建日期目录即可，旧版本不会被覆盖。

## 删除一期报告

删除 `site/reports/<公司>/<日期>/` 整个目录，再从首页删掉对应的 `<article class="report-card">` 即可。
首页封面位于报告目录内部，不会留下失效图片。

## 约定

- 报告日期使用报告自身的发布日期，格式固定为 `YYYY-MM-DD`。
- 首页编号 `No. 06`、`No. 07`……按发布时间递增；最新的显示在最上方。
- 整站已设置 `noindex, nofollow`，`robots.txt` 禁止抓取，仅作个人阅读使用。
- 所有报告内容均不构成投资建议。
