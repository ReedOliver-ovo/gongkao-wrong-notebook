import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { format, startOfWeek, subDays } from "date-fns";
import { unauthorized, internalError } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";

const logger = createLogger('api:analytics');

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return unauthorized();
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
        return unauthorized();
    }

    try {
        // 1. Total Errors
        const totalErrors = await prisma.errorItem.count({
            where: { userId }
        });

        // 2. Mastered Count
        const masteredCount = await prisma.errorItem.count({
            where: {
                userId,
                masteryLevel: { gt: 0 }
            }
        });

        // 3. Mastery Rate
        const masteryRate = totalErrors > 0 ? ((masteredCount / totalErrors) * 100).toFixed(1) : 0;

        // 4. Subject Distribution - Get error items grouped by subject
        const errorItemsWithSubject = await prisma.errorItem.findMany({
            where: { userId },
            include: {
                subject: true
            }
        });

        const subjectMap = new Map<string, number>();
        errorItemsWithSubject.forEach(item => {
            const subjectName = item.subject?.name || 'Unknown';
            subjectMap.set(subjectName, (subjectMap.get(subjectName) || 0) + 1);
        });

        const subjectStats = Array.from(subjectMap.entries()).map(([name, value]) => ({
            name,
            value
        }));

        const moduleMap = new Map<string, number>();
        const mistakeReasonMap = new Map<string, number>();
        errorItemsWithSubject.forEach(item => {
            const moduleName = item.subjectModule || '其他';
            const reasonName = item.mistakeReason || '其他';
            moduleMap.set(moduleName, (moduleMap.get(moduleName) || 0) + 1);
            mistakeReasonMap.set(reasonName, (mistakeReasonMap.get(reasonName) || 0) + 1);
        });

        const toTop5 = (map: Map<string, number>) => Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const longTermDifficultItems = errorItemsWithSubject
            .filter(item => item.masteryStatus === '长期易错')
            .slice(0, 20);

        // 5. Activity Data (Last 7 days) - Track ErrorItem creation (not practice)
        const activityData = [];
        for (let i = 6; i >= 0; i--) {
            const targetDate = subDays(new Date(), i);
            const dateStr = format(targetDate, 'MM-dd');

            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            // Count error items created on this day
            const count = await prisma.errorItem.count({
                where: {
                    userId,
                    createdAt: {
                        gte: startOfDay,
                        lt: endOfDay
                    }
                }
            });

            activityData.push({
                date: dateStr,
                count
            });
        }

        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weeklyNewCount = activityData.reduce((sum, day) => sum + day.count, 0);
        const weeklyReviewCompletedCount = await prisma.reviewSchedule.count({
            where: {
                completedAt: { gte: weekStart },
                errorItem: { userId },
            },
        });
        const secondReviewTotal = await prisma.reviewSchedule.count({
            where: {
                reviewStage: 2,
                completedAt: { not: null },
                errorItem: { userId },
            },
        });
        const secondReviewCorrect = await prisma.reviewSchedule.count({
            where: {
                reviewStage: 2,
                completedAt: { not: null },
                isCorrect: true,
                errorItem: { userId },
            },
        });
        const secondReviewCorrectRate = secondReviewTotal > 0
            ? ((secondReviewCorrect / secondReviewTotal) * 100).toFixed(1)
            : '0.0';

        return NextResponse.json({
            totalErrors,
            masteredCount,
            masteryRate,
            subjectStats,
            activityData,
            weeklyNewCount,
            weeklyReviewCompletedCount,
            secondReviewCorrectRate,
            moduleTop5: toTop5(moduleMap),
            mistakeReasonTop5: toTop5(mistakeReasonMap),
            longTermDifficultItems,
        });

    } catch (error) {
        logger.error({ error }, 'Error fetching analytics');
        return internalError("Failed to fetch analytics");
    }
}
