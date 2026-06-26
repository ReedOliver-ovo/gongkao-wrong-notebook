import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { endOfWeek, startOfWeek } from "date-fns";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { internalError, unauthorized } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";

const logger = createLogger('api:weekly-report');

function topNames(items: string[], limit = 3) {
    const map = new Map<string, number>();
    items.forEach(item => map.set(item, (map.get(item) || 0) + 1));
    return Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name]) => name);
}
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return unauthorized("Authentication required");
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return unauthorized("User not found");
        }

        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

        const existing = await prisma.weeklyReport.findUnique({
            where: {
                userId_weekStart: {
                    userId: user.id,
                    weekStart,
                },
            },
        });

        if (existing) {
            return NextResponse.json({
                ...existing,
                content: JSON.parse(existing.contentJson),
            });
        }

        const [weeklyItems, completedReviews] = await Promise.all([
            prisma.errorItem.findMany({
                where: {
                    userId: user.id,
                    createdAt: { gte: weekStart, lte: weekEnd },
                },
                orderBy: { createdAt: "desc" },
                take: 50,
            }),
            prisma.reviewSchedule.count({
                where: {
                    completedAt: { gte: weekStart, lte: weekEnd },
                    errorItem: { userId: user.id },
                },
            }),
        ]);

        const weakModules = topNames(weeklyItems.map(item => item.subjectModule || '其他'));
        const mainMistakeReasons = topNames(weeklyItems.map(item => item.mistakeReason || '其他'));
        const typicalErrorItems = weeklyItems.slice(0, 5).map(item => ({
            id: item.id,
            questionText: item.questionText || '',
            reason: item.mistakeReason || '其他',
        }));

        const content = {
            weeklyPerformance: `本周新增错题 ${weeklyItems.length} 道，完成复盘 ${completedReviews} 次。`,
            weakModules,
            mainMistakeReasons,
            typicalErrorItems,
            nextWeekPlan: [
                weakModules[0] ? `优先复盘 ${weakModules[0]} 模块错题。` : '保持每日错题复盘。',
                mainMistakeReasons[0] ? `针对「${mainMistakeReasons[0]}」错因做专项整理。` : '补充错因分类，提升复盘质量。',
                '按 2/7/14/30 天节奏完成到期二刷。',
            ],
        };

        const report = await prisma.weeklyReport.create({
            data: {
                userId: user.id,
                weekStart,
                weekEnd,
                contentJson: JSON.stringify(content),
            },
        });

        return NextResponse.json({
            ...report,
            content,
        });
    } catch (error) {
        logger.error({ error }, 'Error generating weekly report');
        return internalError("Failed to generate weekly report");
    }
}
