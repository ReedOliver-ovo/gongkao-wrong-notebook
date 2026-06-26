import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { badRequest, forbidden, internalError, notFound, unauthorized } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";
import { resolveReviewCompletionState } from "@/lib/review-scheduler";

const logger = createLogger('api:reviews:complete');

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return unauthorized("Authentication required");
    }

    try {
        const body = await req.json();
        if (typeof body.isCorrect !== "boolean") {
            return badRequest("isCorrect is required");
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return unauthorized("User not found");
        }

        const schedule = await prisma.reviewSchedule.findUnique({
            where: { id },
            include: { errorItem: true },
        });

        if (!schedule) {
            return notFound("Review schedule not found");
        }

        if (schedule.errorItem.userId !== user.id) {
            return forbidden("Not authorized to update this review");
        }

        const completion = resolveReviewCompletionState({
            reviewStage: schedule.reviewStage,
            isCorrect: body.isCorrect,
            previousConsecutiveCorrectCount: schedule.errorItem.consecutiveCorrectCount || 0,
            previousWrongReviewCount: schedule.errorItem.wrongReviewCount || 0,
        });

        const nextSchedule = await prisma.reviewSchedule.findFirst({
            where: {
                errorItemId: schedule.errorItemId,
                completedAt: null,
                id: { not: id },
                scheduledFor: { gt: schedule.scheduledFor },
            },
            orderBy: { scheduledFor: "asc" },
        });

        const completedAt = new Date();
        const updatedSchedule = await prisma.reviewSchedule.update({
            where: { id },
            data: {
                completedAt,
                isCorrect: body.isCorrect,
            },
        });

        const updatedErrorItem = await prisma.errorItem.update({
            where: { id: schedule.errorItemId },
            data: {
                masteryStatus: completion.masteryStatus,
                masteryLevel: completion.masteryLevel,
                consecutiveCorrectCount: completion.consecutiveCorrectCount,
                wrongReviewCount: completion.wrongReviewCount,
                lastReviewedAt: completedAt,
                nextReviewAt: completion.masteryStatus === '已掌握' ? null : nextSchedule?.scheduledFor ?? null,
            },
        });

        return NextResponse.json({
            schedule: updatedSchedule,
            errorItem: updatedErrorItem,
        });
    } catch (error) {
        logger.error({ error }, 'Error completing review');
        return internalError("Failed to complete review");
    }
}
