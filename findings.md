# 关键发现

## 当前结构

- 项目是 Next.js 16 App Router + React 19 + Prisma SQLite。
- 数据模型已有 `User`、`Subject`、`ErrorItem`、`KnowledgeTag`、`ReviewSchedule`、`PracticeRecord`。
- `ErrorItem` 已有题目、答案、解析、错因分析、作答状态、知识点标签、错题本、掌握度。
- `ReviewSchedule` 已存在，但没有完整二刷业务闭环。

## 页面与接口

- 录入入口：`src/app/page.tsx`、`src/app/notebooks/[id]/add/page.tsx`。
- 录入确认组件：`src/components/correction-editor.tsx`。
- 列表组件：`src/components/error-list.tsx`。
- 详情页：`src/app/error-items/[id]/page.tsx`。
- 统计页：`src/app/stats/page.tsx` + `src/components/wrong-answer-stats.tsx`。
- AI 接口：`/api/analyze`、`/api/reanswer`。
- 错题接口：`/api/error-items`、`/api/error-items/list`、`/api/error-items/[id]`、`/api/error-items/[id]/mastery`。

## AI 链路

- `getAIService()` 根据 `config/app-config.json` 或环境变量选择 Gemini/OpenAI/Azure。
- OpenAI 已支持多实例和自定义模型名，ChatGPT5.5 不需要新增 provider。
- 当前 Prompt 通过 XML 标签输出，provider 内部用 `extractTag` 解析。

## 风险点

- 新字段会影响 import/export、测试 mock、列表筛选、详情编辑。
- AI 输出字段增多后可能缺标签，解析应默认保守值而不是抛错。
- 旧 `masteryLevel` 仍被后台和部分 UI 使用，需要兼容映射。

## 实施中新增发现

- `/api/reanswer` 也是文字录入的重要 AI 链路；如果只改 `/api/analyze`，手动输入后进入确认页会丢失考试类型、模块、错因建议和四类复盘内容。
- `ReviewSchedule` 可以直接复用实现二刷计划，不需要新增平行复盘表；新增 `reviewStage` 足够区分第 2/7/14/30 天。
- 周报不需要后台任务即可首版闭环；打开 `/weekly-report` 时按当前自然周懒生成并用 `userId + weekStart` 缓存。
- 全仓 ESLint 当前不是干净基线，失败项覆盖测试、旧 API、旧组件和 React hooks 规则；本次可用 `npm run build` 和定向测试作为主要验证证据。
- 设置页“提示词”实际只有 `analyze` 和 `similar` 两个可编辑模板；当前配置文件中两者为空，因此页面默认内容来自代码里的 `DEFAULT_ANALYZE_TEMPLATE` 和 `DEFAULT_SIMILAR_TEMPLATE`。
- 已存在的 3000 端口 `next start` 进程显示旧构建内容；本轮浏览器验收使用新启动的 3001 端口验证当前构建产物。
- 标签管理页旧 K12 内容并非只来自翻译：`src/app/tags/page.tsx` 写死了 math/english/physics 等学科列表，并把顶级标签当作年级；`/api/admin/migrate-tags` 还会重建 K12 标准标签库，是旧标签回流的关键来源。
- `KnowledgeTag.subject` 只是字符串字段，可在不改表名的情况下复用为考公/考编“科目模块”；需要用归一化函数兼容旧 `math/english/...` subject。
- 主流程残留年级链路包括 `/api/analyze`、`/api/error-items`、Openclaw 批量上传、`CorrectionEditor`、`DirectTextEditor`、详情页标签编辑和 `KnowledgeFilter`。
- “我的错题本”页面上的“数学/英语”不是页面写死文案，而是 `/api/notebooks` 在用户没有错题本时自动创建的默认 `Subject` 数据；已有旧默认本需要在读取时迁移，否则只改默认创建无法清理截图中的现存卡片。
- 设置页默认 Prompt 仍通过 `<subject>` 兼容标签暴露了旧学科枚举，并通过 `generateGradeInstruction` 注入学历/年级约束；要彻底考公化，应保留 XML 标签但不再向模型暴露旧学科值。
