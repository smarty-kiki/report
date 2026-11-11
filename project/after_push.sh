#!/bin/bash

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

ln -fs "$ROOT_DIR/report.Caddyfile" /etc/caddy/0.report.Caddyfile
/usr/sbin/service caddy reload

# 本站为纯静态站点（仓库的 site/），无后端进程，不需要 supervisor 配置。
