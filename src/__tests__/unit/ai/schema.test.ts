/**
 * AI Schema 单元测试
 *
 * 测试 Zod 验证 schema，特别是新增的错因分析字段
 */
import { describe, it, expect } from 'vitest';
import { ParsedQuestionSchema, safeParseParsedQuestion } from '@/lib/ai/schema';

describe('ParsedQuestionSchema 验证', () => {
    const validBaseQuestion = {
        questionText: '求解方程 2x + 3 = 7',
        answerText: 'x = 2',
        analysis: '移项后计算得出 x = 2',
        subject: '数学',
        knowledgePoints: ['一元一次方程'],
        requiresImage: false,
    };

    describe('基础字段验证', () => {
        it('应该接受有效的基础题目数据', () => {
            const result = ParsedQuestionSchema.safeParse(validBaseQuestion);
            expect(result.success).toBe(true);
        });

        it('questionText 不能为空', () => {
            const result = ParsedQuestionSchema.safeParse({
                ...validBaseQuestion,
                questionText: '',
            });
            expect(result.success).toBe(false);
        });

        it('answerText 不能为空', () => {
            const result = ParsedQuestionSchema.safeParse({
                ...validBaseQuestion,
                answerText: '',
            });
            expect(result.success).toBe(false);
        });

        it('analysis 不能为空', () => {
            const result = ParsedQuestionSchema.safeParse({
                ...validBaseQuestion,
                analysis: '',
            });
            expect(result.success).toBe(false);
        });
    });

    describe('错因分析字段验证', () => {
        it('应该接受包含完整错因分析的数据', () => {
            const result = ParsedQuestionSchema.safeParse({
                ...validBaseQuestion,
                wrongAnswerText: 'x = 4',
                mistakeAnalysis: '计算错误',
                mistakeStatus: 'wrong_attempt',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.wrongAnswerText).toBe('x = 4');
                expect(result.data.mistakeAnalysis).toBe('计算错误');
                expect(result.data.mistakeStatus).toBe('wrong_attempt');
            }
        });

        it('错因字段缺失时应该使用默认值', () => {
            const result = ParsedQuestionSchema.safeParse(validBaseQuestion);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.wrongAnswerText).toBe('');
                expect(result.data.mistakeAnalysis).toBe('');
                expect(result.data.mistakeStatus).toBe('unknown');
            }
        });

        it('mistakeStatus 只接受合法值', () => {
            const validStatuses = ['not_attempted', 'wrong_attempt', 'unknown'];

            validStatuses.forEach(status => {
                const result = ParsedQuestionSchema.safeParse({
                    ...validBaseQuestion,
                    mistakeStatus: status,
                });
                expect(result.success).toBe(true);
            });
        });

        it('mistakeStatus 拒绝非法值', () => {
            const result = ParsedQuestionSchema.safeParse({
                ...validBaseQuestion,
                mistakeStatus: 'invalid_status',
            });
            expect(result.success).toBe(false);
        });

        it('wrongAnswerText 可以为空字符串', () => {
            const result = ParsedQuestionSchema.safeParse({
                ...validBaseQuestion,
                wrongAnswerText: '',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.wrongAnswerText).toBe('');
            }
        });

        it('mistakeAnalysis 可以为空字符串', () => {
            const result = ParsedQuestionSchema.safeParse({
                ...validBaseQuestion,
                mistakeAnalysis: '',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.mistakeAnalysis).toBe('');
            }
        });
    });

    describe('考公/考编 AI 字段验证', () => {
        it('应该接受完整的考公/考编分析字段', () => {
            const result = ParsedQuestionSchema.safeParse({
                ...validBaseQuestion,
                examType: '国考',
                subjectModule: '资料分析',
                questionType: '资料分析-增长率',
                options: ['A. 10%', 'B. 12%', 'C. 15%', 'D. 20%'],
                mistakeReason: '计算错误',
                aiMistakeReasonSuggestion: '计算错误',
                fastestSolution: '先估算分母，再用截位直除。',
                trapAnalysis: '选项差距小，不能直接口算。',
                nextReviewTip: '下次先判断增长率公式再代数。',
                similarQuestionMethod: '看到基期量与现期量同时出现，优先识别增长率题型。',
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.examType).toBe('国考');
                expect(result.data.subjectModule).toBe('资料分析');
                expect(result.data.options).toHaveLength(4);
                expect(result.data.mistakeReason).toBe('计算错误');
                expect(result.data.fastestSolution).toContain('截位直除');
            }
        });

        it('缺少考公/考编字段时应填充保守默认值', () => {
            const result = ParsedQuestionSchema.safeParse(validBaseQuestion);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.examType).toBe('省考');
                expect(result.data.subjectModule).toBe('其他');
                expect(result.data.questionType).toBe('');
                expect(result.data.options).toEqual([]);
                expect(result.data.mistakeReason).toBe('其他');
                expect(result.data.aiMistakeReasonSuggestion).toBe('其他');
                expect(result.data.fastestSolution).toBe('');
                expect(result.data.trapAnalysis).toBe('');
                expect(result.data.nextReviewTip).toBe('');
                expect(result.data.similarQuestionMethod).toBe('');
            }
        });

        it('非法枚举值应该被拒绝', () => {
            const result = ParsedQuestionSchema.safeParse({
                ...validBaseQuestion,
                examType: '中考',
                subjectModule: '数学',
                mistakeReason: '不会',
            });

            expect(result.success).toBe(false);
        });
    });

    describe('safeParseParsedQuestion', () => {
        it('应该安全解析有效数据', () => {
            const result = safeParseParsedQuestion(validBaseQuestion);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.questionText).toBe(validBaseQuestion.questionText);
            }
        });

        it('应该安全解析包含错因的数据', () => {
            const dataWithMistake = {
                ...validBaseQuestion,
                wrongAnswerText: 'x = 4',
                mistakeStatus: 'wrong_attempt',
            };
            const result = safeParseParsedQuestion(dataWithMistake);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.wrongAnswerText).toBe('x = 4');
                expect(result.data.mistakeStatus).toBe('wrong_attempt');
            }
        });

        it('无效数据应该返回失败结果', () => {
            const result = safeParseParsedQuestion({
                ...validBaseQuestion,
                questionText: '',
            });
            expect(result.success).toBe(false);
        });
    });
});
