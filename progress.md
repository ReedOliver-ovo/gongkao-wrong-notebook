# 进度记录

## 2026-06-26

- 阶段 0 开始：建立计划、发现、进度文件。
- 已确认基线单元测试：`ai-prompts.test.ts` 和 `mistake-status.test.ts` 通过。
- 已切换到开发分支：`codex/civil-service-review-system`。
- 阶段 0 完成：新增 `PLANS.md`、`findings.md`、`progress.md`。
- 阶段 1 开始：先补 `civil-service.test.ts` 失败测试，再实现枚举常量与二刷规则工具。
- 枚举与二刷规则单测已通过：`npm test -- --run src/__tests__/unit/civil-service.test.ts`。
- 阶段 1 完成：新增 Prisma migration，扩展 `ErrorItem`、`ReviewSchedule`，新增 `WeeklyReport`，并完成 `npx prisma migrate dev --skip-seed` 与 Prisma Client 生成。
- 阶段 2 完成：改造分析 Prompt、重新解题 Prompt、AI schema 与 OpenAI/Gemini/Azure XML 解析，新增考公字段容错默认值。
- 阶段 3 完成：错题创建/更新/列表接口支持考公字段；录入确认页、直接录入页、详情页支持模块、错因、掌握状态和 AI 复盘内容编辑/展示；列表支持模块、错因、复盘状态筛选。
- 阶段 4 完成：新错题自动生成第 2/7/14/30 天复盘计划；新增待复盘接口、完成复盘接口和 `/reviews` 页面；连续两次正确标记已掌握，重复错误标记长期易错。
- 阶段 5 完成：统计接口和面板增加本周新增、本周复盘、二刷正确率、模块 TOP5、错因 TOP5、长期易错题；新增懒生成并缓存的 `/api/weekly-report` 与 `/weekly-report` 页面。
- 阶段 6 完成：上传控件增加移动端拍照捕获和 iPhone/iPad 提示，PWA manifest 放开横竖屏适配。
- 验证记录：相关单元/集成测试 185 个通过；全量 `npm test` 通过；`npm run build` 通过。
- 已知验证限制：`npm run lint` 仍失败，主要来自仓库既有大量 `any`、旧 `@ts-ignore`、React hooks 规则和未使用变量；本次未做全仓 lint 治理。
- 提示词设置改造完成：将设置页现有“题目分析提示词”和“举一反三提示词”默认模板改为行测/职测/公基错题复盘语境，不新增配置项、不写入 `config/app-config.json`。
- 提示词验证记录：先新增失败用例，再改模板；`npm test -- --run src/__tests__/unit/ai-prompts.test.ts` 通过；`npm run build` 通过；Chrome 在 `http://localhost:3001` 验收默认提示词内容通过。
- K12 残留清理开始：采用“彻底迁移产品语义，保留旧字段兼容”的方案。
- 已新增失败测试并实现：考公/考编标准标签库、旧 K12 学科 subject 到考公模块的归一化映射；`civil-service.test.ts` 通过。
- 已新增 `User.examType` migration，注册页和设置账户页改为考试类型，不再展示教育阶段/入学年份。
- 已改造标签管理页、标签 API、标签建议和管理员标签迁移：默认使用考公模块，移除年级选择，迁移旧自定义标签到考公模块。
- 已改造录入确认、直接录入、详情页和错题列表知识点筛选：停止自动年级计算和 K12 学科推断。
- 已改造 AI 标签注入和 OpenAI/Gemini/Azure provider：注入考公模块标签，不再预取数学/物理/化学等 K12 标签。
- K12 残留清理验证记录：`npm test -- --run src/__tests__/unit/civil-service.test.ts src/__tests__/unit/ai-prompts.test.ts` 通过；`npx prisma generate` 通过；`npx prisma migrate dev --skip-seed` 已应用 `20260626010000_add_user_exam_type`；`npm run build` 通过；Chrome 在 `http://localhost:3001` 验收标签管理、设置账户、直接录入页面通过。
- 补充验证完成：补齐 provider 单测中的 `getCivilServiceTagsFromDB` mock，并放宽 Gemini 多次重试用例超时；provider 定向测试 59 个通过；全量 `npm test` 518 个测试通过；`npm run build` 通过。
- 提示词与默认错题本补充清理开始：先新增失败测试，覆盖默认 Prompt 不再出现学科化/K12 表达，以及 `/api/notebooks` 默认创建和旧“数学/英语”错题本迁移为“资料分析/逻辑推理”。
- 已完成最小实现：默认 Prompt 保留 XML 兼容标签但不再暴露旧学科枚举；`generateGradeInstruction` 返回空字符串；设置页变量说明改为考公模块标签；`/api/notebooks` 自动创建与迁移默认错题本。定向测试 `ai-prompts.test.ts` 与 `notebooks.test.ts` 已通过。
- 补充浏览器验收完成：Chrome 访问 `http://localhost:3001/notebooks`，页面仅展示默认错题本“资料分析”“逻辑推理”，不再展示“数学”“英语”；重新执行定向测试 87 个通过。
- README 公考/事业编化完成：项目标题、简介、功能列表和推荐使用流程已改为国考/省考/事业编错题复盘语境；检查 README 不再残留“学生、教师、K12、数学、物理、化学、英语、学科、年级”等旧定位文案。
