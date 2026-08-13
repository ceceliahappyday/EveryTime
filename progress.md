# 开发进度

## 2026-08-06

- 为任务轨迹、截止任务、已完成任务增加可拖拽能力。
- 为日视图投入记录增加 `text/entry-id` 拖拽源。
- 统一日期落点：任务拖入创建一小时 task_work；已有投入拖入复制原时长并保留原记录。
- 项目甘特图支持按日期桶接收任务或投入记录。
- 已完成回归测试、版本号更新和安装包构建；待提交 GitHub Release。

## 验证结果

- `node -c app.js`、`node -c main.js` 通过。
- 拖拽策略测试及任务视图、日程类型、周期、项目折叠、项目汇总、任务选项测试全部通过。
- 本次拖拽改造未修改 STORAGE_KEY，也未删除历史数据。

## 2026-08-07 缺陷修复准备

- 根因一：完成操作只修改当前任务对象；历史重复 ID 记录可能仍是进行中，重新归一化后覆盖显示状态。
- 根因二：层级判断只读取标准 `parentId`，历史字段未迁移时子任务被错误视为顶层或无法建立父子线索。
- 修复：完成/恢复统一调用 `toggleTaskCompletion`，同步同 ID 的全部历史记录；迁移兼容历史父级字段；叶子任务按任意层级进入统一左侧清单。
- 待完成：回归测试、版本号、安装包和 GitHub 发布。
-
## 2026-08-10 拖拽与任务投入缺陷

- 修复日视图时间槽未处理 `text/entry-id` 的问题；同日拖动已有投入现在复制新记录，原记录保留并立即重绘。
- 增加统一拖拽高亮清理，避免 drop/dragend 后残留 `drag-over`。
- 增加有效时长和 22:00 边界保护，禁止写入 `end <= start`。
- 新建或关联任务投入后，统一刷新同 ID 任务记录的自动状态；已开始投入显示进行中，未来投入显示计划中。
- 增加可执行的 task-work 行为测试，覆盖复制、边界、零时长和多投入状态。
- v2.0.40 已完成安装包构建，准备提交 GitHub Release。
- 2026-08-12: Added explicit CommonJS startup policy, canonical `EveryTime` login registration, conservative legacy-alias cleanup, single-instance locking, and executable regression checks. No task data or STORAGE_KEY changes.
- 2026-08-12: v2.0.42 fixed week-view work-entry rendering. Linked task-work entries now show leaf titles, time range, duration, notes, and parent breadcrumbs; multiple same-day entries remain separate and clickable/draggable. Due-only items are visually separated as plan/deadline prompts.
- 2026-08-12: v2.0.43 fixed project Gantt date-window behavior: current day/week/month anchors after the sticky label column, history remains left-scrollable, future defaults to about 30 days and expands by demand, while normal rerenders preserve horizontal scroll.
- 2026-08-12: Corrected v2.0.43 design: restored complete historical/future Gantt domain, removed data truncation and near-right auto-expansion, added independent initial viewport anchoring and synchronized top horizontal scrolling.
- 2026-08-12: v2.0.44 completed the project timeline correction: full recursive date domain, top scrollbar class/wiring, guarded bidirectional scroll sync, and real-today anchoring for project entry and “回到今天”.
- 2026-08-13: v2.0.45 added searchable hierarchical task linking for schedule entries. The native select remains a hidden compatibility value container; the accessible combobox supports parent/leaf metadata, breadcrumb paths, predictable fuzzy search, keyboard selection, current-link restoration, calendar disablement, and ended-current-link visibility.
