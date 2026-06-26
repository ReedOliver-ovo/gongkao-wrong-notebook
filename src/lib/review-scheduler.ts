import { addDays } from 'date-fns';
import {
    type CivilServiceMasteryStatus,
    masteryStatusToLevel,
} from './civil-service';

export const REVIEW_STAGES = [
    { reviewStage: 1, daysAfterCreate: 2, label: '第一次二刷' },
    { reviewStage: 2, daysAfterCreate: 7, label: '第二次二刷' },
    { reviewStage: 3, daysAfterCreate: 14, label: '第三次二刷' },
    { reviewStage: 4, daysAfterCreate: 30, label: '最终确认' },
] as const;

export type ReviewStage = typeof REVIEW_STAGES[number]['reviewStage'];

export interface InitialReviewScheduleInput {
    reviewStage: ReviewStage;
    scheduledFor: Date;
}
export function buildInitialReviewSchedules(baseDate: Date = new Date()): InitialReviewScheduleInput[] {
    return REVIEW_STAGES.map(stage => ({
        reviewStage: stage.reviewStage,
        scheduledFor: addDays(baseDate, stage.daysAfterCreate),
    }));
}

export interface ReviewCompletionInput {
    reviewStage: number;
    isCorrect: boolean;
    previousConsecutiveCorrectCount: number;
    previousWrongReviewCount: number;
}

export interface ReviewCompletionState {
    masteryStatus: CivilServiceMasteryStatus;
    masteryLevel: 0 | 1 | 2;
    consecutiveCorrectCount: number;
    wrongReviewCount: number;
}

export function resolveReviewCompletionState(input: ReviewCompletionInput): ReviewCompletionState {
    const consecutiveCorrectCount = input.isCorrect
        ? input.previousConsecutiveCorrectCount + 1
        : 0;
    const wrongReviewCount = input.isCorrect
        ? input.previousWrongReviewCount
        : input.previousWrongReviewCount + 1;

    let masteryStatus: CivilServiceMasteryStatus;
    if (consecutiveCorrectCount >= 2) {
        masteryStatus = '已掌握';
    } else if (wrongReviewCount >= 2) {
        masteryStatus = '长期易错';
    } else if (input.reviewStage <= 1) {
        masteryStatus = input.isCorrect ? '一刷正确' : '一刷错误';
    } else if (input.reviewStage === 2) {
        masteryStatus = input.isCorrect ? '二刷正确' : '二刷错误';
    } else {
        masteryStatus = input.isCorrect ? '已复盘待二刷' : '长期易错';
    }

    return {
        masteryStatus,
        masteryLevel: masteryStatusToLevel(masteryStatus),
        consecutiveCorrectCount,
        wrongReviewCount,
    };
}
