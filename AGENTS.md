# Repository instructions

## Project constraints

- 提交信息必须使用约定式提交（Conventional Commits）。
- `src/index.user.js` 头部元数据块（包括 `@name`、`@version`、`@description`、`@namespace`、`@match` 等）以及 `package.json` 中的 `version` 等版本/元数据字段只能由人工手动管理。未经明确允许，agent 不得修改。
- 本项目是 Bangumi 组件。新增样式前，必须先探索目标 Bangumi 页面及其 DOM 与样式表，优先复用 **Bangumi** 原站已有的 CSS 类、CSS 变量和既有视觉语言；只有确认没有可复用样式后，才编写新的 CSS。
- 默认禁止任何 issue 写操作。只有在人工显式要求时（例如调用相关 skill 或在对话中明确要求）才允许执行 issue 写操作。

## Agent skills

### Issue tracker

Issues and specs for this repo live as GitHub issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository. See `docs/agents/domain.md`.
