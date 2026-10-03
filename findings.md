# Findings: 甘特图开源调研

## Requirements
- 开始 / 关闭时间用红色小旗
- 行看起来一体：标题浮在条上、横滚可见、不换行
- 进度画在条上，不写在标题栏
- 投入日才着色；进行中不要用今天当结束旗
- 本地优先 Electron + vanilla JS；确认前不开发、不引入新库

## Research Findings

检索时间：2026-08-28。星标与 `pushed_at` 来自 GitHub API。

### 筛选标准
- 能否解释「标题贴在条上、横滚仍可见」
- 进度是否画在条内
- 是否和 EveryTime 一样是 vanilla / 可抄视觉而不绑框架
- 许可证、活跃度、数据模型是否冲突（投入 ≠ 起止区间）

### 入选方案

#### 1. frappe/gantt — 最有参考价值
- https://github.com/frappe/gantt
- 6097 ★ · MIT · JS/SVG · 最近推送 2026-06-18 · 仍在维护
- 为 ERPNext 自研，设计参考 Google Gantt / DHTMLX
- 架构：`Gantt` 实例 + SVG `bar` / `bar-progress` / `bar-label`；任务模型是 `start, end, progress`
- 关键能力：`auto_move_label` 在横滚时把标题夹在「可见条」里；条太短则标题落到条右侧（`big`）；进度是同一条上的更深色矩形
- 解决的问题：没有左侧标题列，条和字是同一物件
- 对 EveryTime：视觉配方应复用；整库不要引进（没有「投入日」语义，会把空档天画成实心条）

#### 2. OpenProject — 产品级 UX 参考
- https://github.com/opf/openproject
- 15958 ★ · GPL-3.0 · Ruby + Angular · 最近推送 2026-08-27 · 非常活跃
- 架构：左侧工作包表 + 右侧时间轴，纵向对齐、横向各滚
- 条上可配左/右/最右标签；里程碑用菱形；父级用「夹子」跨子任务
- 避开：不能搬进 Electron 桌面备忘；GPL；协同/依赖调度过重
- 可复用：父级更瘦的汇总条；今天列高亮；旗标用点而不是第二根彩条

#### 3. MaTeMaTuK/gantt-task-react — 进度填色教科书，但已停更
- https://github.com/MaTeMaTuK/gantt-task-react
- 1094 ★ · MIT · React/TS · 最近推送 2024-08-12 · 157 个未关 issue
- 经典左表右条；`barBackground` + `barProgress` 两层同高圆角
- `listCellWidth: ""` 可关掉左表
- 避开：引入 React；仓库不活跃

#### 4. DHTMLX/gantt — 企业完整甘特，不要整库接入
- https://github.com/DHTMLX/gantt
- 1841 ★ · 社区版现标 MIT · vanilla JS · 最近推送 2026-08-20
- 网格+时间轴、依赖、关键路径、资源；PRO 功能分层
- 避开：体积和 API 会吞掉现有 policy；默认左表正是用户否定的「标题栏」

#### 5. ANovokmet/svelte-gantt
- 623 ★ · MIT · Svelte、零运行时依赖 · 最近推送 2025-05-03
- 高性能、树、缩放、资源预订
- 避开：要上 Svelte 编译链；更偏预订而不是个人投入账本

#### 6. svar-widgets/gantt
- 253 ★ · MIT（从 GPL 改过来）· Svelte/React · 最近推送 2026-06-29
- 现代组件，有 PRO 升级
- 避开：框架绑定 + 商业分层

#### 7. neuronetio/gantt-schedule-timeline-calendar (GSTC)
- 3626 ★ · 许可证 Other（常见为 AGPL/商业双轨）· TS · 最近推送 2026-06-11
- 虚拟化、日历/预订全能
- 避开：许可证不适合塞进当前应用

### 未入选但扫过
- Super Productivity：本地优先待办，核心明确不做甘特，只当插件设想
- ApexGantt：需 license key
- Mermaid Gantt：静态图，无横滚交互
- Plane / Leantime：整套 Web PM，和桌面账本不是一类产品

### EveryTime 现状差距
- 自绘 DOM + 百分比定位，policy 已区分投入段 / 起止旗 / 进度轨
- 标题用 `position: sticky; left` 钉在视口左边，看起来像独立列或独立胶囊，和条不是同一物件
- 进度填色和投入段叠两套颜色
- 起止旗目前是青绿/蓝，不是红旗
- 进行中任务的条只占全时间轴很小一段，标题却停在视口左缘，条在日期中间 → 「不一体」

### Frappe 标题算法（应抄）
1. 标题是条上的文字，不是单独 sticky 列
2. 字宽 ≤ 条宽：写在条内
3. 字宽 > 条宽：写在条右侧，单行
4. 横滚时只在「条的可见区间」内平移标题，出了这条就不显示
5. 进行中任务的轨是 start→today 时，看 8 月日期时标题会贴在这段可见条上

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 不引入第三方甘特库 | 数据语义（投入≠区间）和 vanilla 架构对不上 |
| 主参考 Frappe，辅参考 OpenProject | 分别解决「条上标题」和「父级/里程碑」 |
| 确认前不写实现 | 用户要求先出方案 |
