# EveryTime 发布与更新规划

目标：把当前“今日日程”桌面 APP 产品化为可持续安装、更新、迁移的公开软件。

## 推荐路线

1. 代码托管：GitHub public repository `EveryTime`
2. 安装包发布：GitHub Releases
3. 自动更新：`electron-updater` + GitHub Releases
4. 用户数据：
   - 本地仍保存在 `%APPDATA%\today-daily-planner\planner-data.json`
   - 每次保存前自动备份到 `%APPDATA%\today-daily-planner\backups`
   - 后续增加 OneDrive / Microsoft Graph 云同步，解决换电脑历史记录不丢

## 为什么不再使用 D 盘本地更新

本地安装包目录只适合开发调试。它的问题是：

- 换电脑后安装包和历史版本可能丢失。
- 没有公开下载入口。
- 不适合长期使用或分发。
- 不能真正做到“像官方 APP 一样持续更新”。

## GitHub Releases 负责什么

- 保存每个版本的安装包。
- 保存 `latest.yml` 等自动更新元数据。
- 让 APP 能检查新版、下载并安装。
- 让用户换电脑后可以重新下载最新版。

## GitHub Releases 不负责什么

- 不保存用户的待办、日程、备注历史。
- 不同步用户设置。
- 不替代 OneDrive、数据库或其他云同步。

## 后续需要完成

- [ ] 确认 GitHub 实际用户名或登录 GitHub CLI 后自动读取。
- [ ] 创建公开仓库：`EveryTime`
- [ ] 推送当前代码。
- [ ] 安装 `electron-updater`。
- [ ] 把当前本地更新器替换为 GitHub Releases 自动更新器。
- [ ] 配置 `package.json` 的 `publish` 字段。
- [ ] 配置 GitHub Actions 自动构建 Release。
- [ ] 增加 OneDrive / Microsoft Graph 数据同步。
- [ ] 后续准备正式图标、隐私说明、代码签名证书。

## 安全约定

- 不提交用户数据。
- 不提交 `%APPDATA%` 中的数据文件。
- 不提交 GitHub Token。
- 不提交 Microsoft OAuth Secret。
- 公开仓库内只保留程序代码、文档、构建配置。

