<div align="center">

# EverUs

**一款暗色系杂志风格的 Halo 2.0 博客主题**

[![Halo](https://img.shields.io/badge/Halo-%E2%89%A5%202.19.0-26a760?logo=halo)](https://halo.run)
[![Version](https://img.shields.io/badge/Version-1.0.11-26a760)](https://github.com/imorisun/halo-theme-everus/releases)
[![License](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](LICENSE)
[![CD](https://github.com/imorisun/halo-theme-everus/actions/workflows/cd.yaml/badge.svg)](https://github.com/imorisun/halo-theme-everus/actions/workflows/cd.yaml)

[特性](#-特性) · [安装](#-安装) · [配置](#-主题配置) · [开发](#-开发指南) · [常见问题](#-常见问题)

<img src="screenshot.png" alt="EverUs Theme Preview" width="800" />

</div>

## 📖 项目简介

EverUs 是一款为 [Halo 2.0](https://halo.run) 打造的**暗色系杂志风格**博客主题，从 [JaneLens/EverUs](https://github.com/JaneLens/EverUs)（Typecho 版）移植并魔改而来。主题以深邃的黑色为基底，搭配绿色点缀（`#26a760`），融入页面过渡动画与 GSAP 滚动动效，为读者呈现沉浸式的阅读体验。

## ✨ 特性

- 🎨 **暗色视觉风格** — 黑色基底 + 绿色点缀，低亮度护眼阅读
- 🎬 **GSAP 滚动动画** — 内容区域随页面滚动淡入，段落逐条出现，回滚可逆
- 🎵 **音乐播放器** — 内置 APlayer，支持网易云音乐 / QQ 音乐歌单及自定义直链歌单
- 🖼️ **Fancybox 图片灯箱** — 文章封面点击全屏预览，支持幻灯片切换
- 📱 **响应式布局** — 完美适配桌面端与移动端
- 🔤 **自定义字体** — 支持通过 URL 加载自定义 woff2/woff/ttf/eot/svg 字体
- 🧭 **面包屑导航** — 分类、标签、作者、瞬间等页面均配备层级导航
- 📝 **瞬间页面** — 集成 Halo Moments 插件，支持标签筛选与点赞
- 🔗 **友链页面** — 集成 Halo Links 插件，友链卡片网格展示，支持分组筛选
- 📜 **归档页面** — 按年份→月份→文章三级层级展示，支持分页
- 👤 **作者页面** — 展示作者信息及全部文章
- 🦶 **自定义页脚** — 支持自定义文字、ICP 备案号及公安备案号

## 📋 环境要求

| 依赖 | 版本要求 |
|------|---------|
| Halo | ≥ 2.19.0 |
| Node.js（仅打包时） | ≥ 18 |
| pnpm（仅打包时） | ≥ 8 |

## 🚀 安装

### 方式一：应用市场安装（推荐）

1. 登录 Halo Console
2. 进入 **外观 → 主题管理**
3. 搜索 **EverUs** 并点击安装
4. 安装完成后点击 **启用**

### 方式二：手动上传安装

1. 从 [Releases](https://github.com/imorisun/halo-theme-everus/releases) 下载最新 ZIP 包
2. 登录 Halo Console → **外观 → 主题管理**
3. 点击 **安装主题** → **上传 ZIP**，选择下载的文件
4. 安装完成后启用

### 方式三：本地开发安装

```bash
# 克隆仓库到 Halo 主题目录
git clone https://github.com/imorisun/halo-theme-everus.git ~/.halo2/themes/halo-theme-everus

# 重启 Halo 后，在 Console → 外观 → 主题管理中启用
```

## 🔌 推荐插件

| 插件 | 用途 | 必需 |
|------|------|------|
| [plugin-comment-widget](https://github.com/halo-sigs/plugin-comment-widget) | 评论组件 | ✅ 必需 |
| [plugin-moments](https://github.com/halo-sigs/plugin-moments) | 瞬间（动态）功能 | ❌ 可选 |
| [plugin-links](https://github.com/halo-sigs/plugin-links) | 友情链接功能 | ❌ 可选 |
| [plugin-search-widget](https://github.com/halo-sigs/plugin-search-widget) | 全局搜索组件 | ❌ 可选 |

## ⚙️ 主题配置

在 Halo Console → **外观 → 主题管理 → EverUs → 设置** 中可进行以下配置：

### 样式与字体

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| 自定义字体 URL | 字体文件直链地址，支持 woff2/woff/ttf/eot/svg 格式 | 系统默认字体 |

### 首页

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| Banner 背景图 | 首页顶部 Banner 的背景图片 | 暗色渐变背景 |

### 页脚

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| 自定义页脚文字 | 替换默认版权声明的自定义文字 | 默认版权声明 |
| ICP 备案号 | 网站 ICP 备案号，自动链接到工信部查询 | 无 |
| 公安备案号 | 网站公安备案号，自动链接到公安部备案查询 | 无 |

### 作者页

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| 公开显示邮箱 | 在作者页面侧边栏显示邮箱 | 开启 |
| 公开显示手机号 | 在作者页面侧边栏显示手机号 | 关闭 |

### 音乐播放器

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| 自定义歌单 | 每行一首，格式：`歌名 \| 歌手 \| 音频直链 \| 封面直链`（优先级高于平台歌单） | 无 |
| 平台歌单 ID | 网易云音乐 / QQ 音乐歌单 ID | 无 |
| 音乐平台 | 选择 `netease`（网易云音乐）或 `tencent`（QQ音乐） | netease |

> 💡 **提示**：自定义歌单优先级高于平台歌单，若同时填写将只使用自定义歌单。

## 📂 目录结构

```
halo-theme-everus/
├── .github/
│   └── workflows/
│       └── cd.yaml              # GitHub Actions CD 流水线
├── gradle/
│   └── wrapper/                 # Gradle Wrapper
├── templates/                   # Thymeleaf 模板文件
│   ├── layout.html              # 全局布局（导航、页脚、播放器）
│   ├── index.html               # 首页
│   ├── post.html                # 文章详情页
│   ├── page.html                # 自定义页面
│   ├── category.html            # 分类详情页
│   ├── categories.html          # 全部分类页
│   ├── tag.html                 # 标签详情页
│   ├── tags.html                # 全部标签页
│   ├── archives.html            # 归档页
│   ├── author.html              # 作者页
│   ├── moments.html             # 瞬间动态页
│   ├── links.html               # 友链页
│   ├── error/
│   │   └── error.html           # 错误页面
│   ├── modules/
│   │   ├── pagination.html      # 分页组件
│   │   ├── post-card-list.html  # 文章卡片列表
│   │   └── widgets/
│   │       └── comment.html     # 评论组件
│   └── assets/
│       ├── css/
│       │   ├── style.css        # 主题全局样式
│       │   └── icon.css         # 图标字体样式
│       ├── js/
│       │   ├── main.js          # 核心交互逻辑
│       │   └── aplayer/         # 音乐播放器相关文件
│       └── images/              # 图片资源
├── theme.yaml                   # 主题元数据配置
├── settings.yaml                # 主题设置表单定义
├── screenshot.png               # 主题预览截图
├── build.gradle                 # Gradle 构建配置
├── package.json                 # pnpm 配置 & 打包脚本
└── LICENSE                      # GPL-3.0 许可证
```

## 🛠️ 开发指南

### 技术栈

- **模板引擎**：Thymeleaf 3.0.12
- **前端核心**：jQuery 3.7.1
- **动画引擎**：GSAP 3.12.5（ScrollTrigger）
- **图片灯箱**：Fancyapps UI 5.0.36
- **音乐播放**：APlayer + Meting2
- **构建工具**：Gradle + pnpm + @halo-dev/theme-package-cli

### 本地开发环境搭建

1. **安装依赖**

```bash
# 安装前端依赖
pnpm install

# 构建 Gradle 项目（可选）
./gradlew clean build
```

2. **链接到 Halo 主题目录**

将项目目录软链接到 Halo 工作目录的 `themes/` 下，确保文件夹名与 `theme.yaml` 中 `metadata.name` 一致：

```bash
# Linux / macOS
ln -s $(pwd) ~/.halo2/themes/halo-theme-everus

# Windows（管理员权限 PowerShell）
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.halo2\themes\halo-theme-everus" -Target "$(pwd)"
```

3. **关闭 Thymeleaf 缓存**

为了让模板修改即时生效，需要关闭 Thymeleaf 缓存：

```bash
# Docker 方式：添加环境变量
-e SPRING_THYMELEAF_CACHE=false

# 配置文件方式（application.yaml）
spring:
  thymeleaf:
    cache: false
```

4. **启动 Halo 并启用主题**

访问 Halo Console → 外观 → 主题管理，启用 **EverUs** 主题。

### Finder API 参考

主题使用以下 Halo Finder API 查询数据：

| Finder | 用途 |
|--------|------|
| `postFinder` | 查询文章列表与详情 |
| `categoryFinder` | 查询分类列表与详情 |
| `tagFinder` | 查询标签列表与详情 |
| `menuFinder` | 查询导航菜单 |
| `momentFinder` | 查询瞬间动态（需 Moments 插件） |
| `singlePageFinder` | 查询自定义页面 |
| `pluginFinder` | 检测插件可用性 |

### 模板标签

| 标签 | 用途 |
|------|------|
| `<halo:comment />` | 评论组件 |
| `<halo:footer />` | 页脚插件注入点 |

### 静态资源引用

```html
<!-- 引用主题内静态资源 -->
<img th:src="${#theme.assets('/images/logo.svg')}" alt="Logo" />
<link rel="stylesheet" th:href="${#theme.assets('/css/style.css')}" />
<script th:src="${#theme.assets('/js/main.js')}"></script>
```

### 打包发布

```bash
# 构建主题 ZIP 包
pnpm build

# 产物输出至 dist/ 目录
```

CI/CD 使用 GitHub Actions，在 Release 发布时自动构建并发布到 Halo 应用市场。

## ❓ 常见问题

**Q: 安装主题后页面没有样式？**
> A: 请确认主题已正确启用。在 Halo Console → 外观 → 主题管理中，点击主题下方的「启用」按钮。

**Q: 瞬间页面显示为空？**
> A: 需要安装并启用 [plugin-moments](https://github.com/halo-sigs/plugin-moments) 插件，并至少发布一条瞬间内容。

**Q: 友链页面不显示内容？**
> A: 需要安装并启用 [plugin-links](https://github.com/halo-sigs/plugin-links) 插件，并在插件中添加友链。

**Q: 评论组件不显示？**
> A: 请确保已安装 [plugin-comment-widget](https://github.com/halo-sigs/plugin-comment-widget) 插件。评论组件为 Web Component，首次加载可能需要初始化时间。

**Q: 音乐播放器没有声音？**
> A: 请检查：
> - 使用平台歌单时，确认歌单 ID 正确且可公开访问
> - 使用自定义歌单时，确认音频直链支持跨域访问（CORS）
> - QQ 音乐部分歌曲可能因版权限制无法播放

**Q: Banner 背景图如何更换？**
> A: 在 Halo Console → 外观 → EverUs 设置 → 首页中上传新的 Banner 背景图。

**Q: 本地开发时模板修改不生效？**
> A: 确保已关闭 Thymeleaf 缓存，参见「开发指南」中的说明。

## 🤝 贡献

欢迎对本主题贡献代码、报告问题或提出改进建议！

### 贡献流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/awesome-feature`
3. 提交更改：`git commit -m 'feat: add awesome feature'`
4. 推送到分支：`git push origin feature/awesome-feature`
5. 发起 Pull Request

### Issue 报告

请在 [Issues](https://github.com/imorisun/halo-theme-everus/issues) 页面提交问题，建议包含：

- Halo 版本号
- 主题版本号
- 问题描述（截图 + 复现步骤）
- 浏览器及版本

### 代码规范

- 缩进：2 空格（HTML / CSS / JS）
- CSS 使用 BEM 命名约定（如 `.cat-group__item`、`.post-card__link`）
- JavaScript 使用 IIFE 包裹避免全局污染
- Thymeleaf 模板使用安全导航运算符（`?.`）避免空指针异常

## 📄 许可证

本项目采用 [GNU General Public License v3.0](LICENSE) 开源许可协议。

```
EverUs - A dark-themed Halo blog theme
Copyright (C) 2024 晨阳

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```

## 🙏 致谢

- [Halo](https://halo.run) — 强大易用的开源建站工具
- [JaneLens/EverUs](https://github.com/JaneLens/EverUs) — Typecho 版原始主题，提供设计灵感与视觉基础

---

<div align="center">

Made with ❤️ by [晨阳](https://www.puresky.top)

</div>
