# Task Plan: 甘特图开源调研与改造方案

## Goal
在 GitHub 筛选最有参考价值的开源甘特实现，对照 EveryTime 的本地优先、叶子任务、投入≠区间语义，给出可确认的改造方案；用户确认前不进入开发。

## Current Phase
complete

## Phases

### Phase 1: GitHub 调研与筛选
- [x] 搜索开源甘特库与含甘特的项目管理应用
- [x] 按参考价值筛 5–7 个方案并核对活跃度
- [x] 记录架构、技术栈、解决的问题
- **Status:** complete

### Phase 2: 对照 EveryTime 并出方案
- [x] 对照当前甘特实现的差距
- [x] 明确复用 / 避开项
- [x] 给出修改、调整、完善方案（含红色小旗）
- [x] 用 canvas 呈现对比，等待用户确认
- **Status:** complete

### Phase 3: 开发实现
- [x] 标题夹在条的可见区间内；无条则不挂左侧名字
- [x] 红旗开始/关闭，黄旗仅计划中/进行中，今天竖线
- [x] 更新测试并在隔离 Electron 中验证
- **Status:** complete

## Key Questions
1. 是否引入第三方甘特库，还是继续自绘？
2. 标题应贴在条上还是左侧固定列？
3. 进度条、投入段、起止旗如何同时存在且不抢视觉？

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 不引入 npm 甘特库 | 投入≠区间，自绘更小 |
| 标题只跟可见条走 | 条不在当前期间就不需要名字 |
| 黄旗仅 planned / in_progress | 已结束不再显示目标截止 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
|          |         |            |
