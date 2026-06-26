import { describe, expect, it } from 'vitest';
import {
    CIVIL_SERVICE_EXAM_TYPES,
    CIVIL_SERVICE_MASTERY_STATUS,
    CIVIL_SERVICE_MISTAKE_REASONS,
    CIVIL_SERVICE_SUBJECT_MODULES,
    normalizeExamType,
    normalizeMasteryStatus,
    normalizeMistakeReason,
    normalizeSubjectModule,
    CIVIL_SERVICE_STANDARD_TAG_GROUPS,
    normalizeKnowledgeTagSubject,
} from '@/lib/civil-service';
import {
    REVIEW_STAGES,
    buildInitialReviewSchedules,
    resolveReviewCompletionState,
} from '@/lib/review-scheduler';

describe('civil service constants', () => {
    it('应该导出考公/考编枚举', () => {
        expect(CIVIL_SERVICE_EXAM_TYPES).toEqual(['国考', '省考', '事业编']);
        expect(CIVIL_SERVICE_SUBJECT_MODULES).toContain('言语理解');
        expect(CIVIL_SERVICE_SUBJECT_MODULES).toContain('职业能力倾向测验');
        expect(CIVIL_SERVICE_MISTAKE_REASONS).toContain('审题错误');
        expect(CIVIL_SERVICE_MASTERY_STATUS).toContain('长期易错');
    });

    it('应该将非法枚举值归一到默认值', () => {
        expect(normalizeExamType('国考')).toBe('国考');
        expect(normalizeExamType('未知')).toBe('省考');
        expect(normalizeSubjectModule('资料分析')).toBe('资料分析');
        expect(normalizeSubjectModule('未知')).toBe('其他');
        expect(normalizeMistakeReason('计算错误')).toBe('计算错误');
        expect(normalizeMistakeReason('未知')).toBe('其他');
        expect(normalizeMasteryStatus('二刷正确')).toBe('二刷正确');
        expect(normalizeMasteryStatus('未知')).toBe('未复盘');
    });

    it('应该提供考公/考编标准标签库并覆盖全部科目模块', () => {
        expect(Object.keys(CIVIL_SERVICE_STANDARD_TAG_GROUPS)).toEqual([...CIVIL_SERVICE_SUBJECT_MODULES]);
        expect(CIVIL_SERVICE_STANDARD_TAG_GROUPS['言语理解'][0]).toMatchObject({
            name: '片段阅读',
        });
        expect(CIVIL_SERVICE_STANDARD_TAG_GROUPS['资料分析'].flatMap(group => group.tags)).toContain('增长率');
        expect(CIVIL_SERVICE_STANDARD_TAG_GROUPS['公共基础知识'].flatMap(group => group.tags)).toContain('行政法');
    });

    it('应该将旧 K12 学科标识迁移到考公/考编模块', () => {
        expect(normalizeKnowledgeTagSubject('math')).toBe('数量关系');
        expect(normalizeKnowledgeTagSubject('chinese')).toBe('言语理解');
        expect(normalizeKnowledgeTagSubject('politics')).toBe('常识判断');
        expect(normalizeKnowledgeTagSubject('physics')).toBe('常识判断');
        expect(normalizeKnowledgeTagSubject('资料分析')).toBe('资料分析');
        expect(normalizeKnowledgeTagSubject('unknown-subject')).toBe('其他');
    });
});

describe('civil service review scheduler', () => {
    it('应该按 2/7/14/30 天生成初始二刷计划', () => {
        const baseDate = new Date('2026-06-26T00:00:00.000Z');
        const schedules = buildInitialReviewSchedules(baseDate);

        expect(REVIEW_STAGES.map(stage => stage.daysAfterCreate)).toEqual([2, 7, 14, 30]);
        expect(schedules.map(schedule => schedule.reviewStage)).toEqual([1, 2, 3, 4]);
        expect(schedules.map(schedule => schedule.scheduledFor.toISOString().slice(0, 10))).toEqual([
            '2026-06-28',
            '2026-07-03',
            '2026-07-10',
            '2026-07-26',
        ]);
    });

    it('连续两次正确应标记已掌握', () => {
        expect(resolveReviewCompletionState({
            reviewStage: 2,
            isCorrect: true,
            previousConsecutiveCorrectCount: 1,
            previousWrongReviewCount: 0,
        })).toMatchObject({
            masteryStatus: '已掌握',
            masteryLevel: 2,
            consecutiveCorrectCount: 2,
        });
    });

    it('重复错误应标记长期易错', () => {
        expect(resolveReviewCompletionState({
            reviewStage: 2,
            isCorrect: false,
            previousConsecutiveCorrectCount: 0,
            previousWrongReviewCount: 1,
        })).toMatchObject({
            masteryStatus: '长期易错',
            masteryLevel: 0,
            wrongReviewCount: 2,
        });
    });
});
