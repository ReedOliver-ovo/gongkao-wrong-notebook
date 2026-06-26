import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { internalError, unauthorized } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";

const logger = createLogger('api:reviews:due');

export async function GET(req: Request) {
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

        const { searchParams } = new URL(req.url);
        const includeFuture = searchParams.get("future") === "true";
        const where = {
            completedAt: null,
            errorItem: { userId: user.id },
            ...(includeFuture ? {} : { scheduledFor: { lte: new Date() } }),
        };

        const schedules = await prisma.reviewSchedule.findMany({
            where,
            include: {
                errorItem: {
                    include: {
                        subject: true,
                        tags: true,
                    },
                },
            },
            orderBy: { scheduledFor: "asc" },
        });

        return NextResponse.json({ items: schedules });
    } catch (error) {
        logger.error({ error }, 'Error fetching due reviews');
        return internalError("Failed to fetch due reviews");
    }
}
