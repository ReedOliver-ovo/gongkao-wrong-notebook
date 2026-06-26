import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { internalError, unauthorized, forbidden } from "@/lib/api-errors";
import {
    CIVIL_SERVICE_STANDARD_TAG_GROUPS,
    normalizeKnowledgeTagSubject,
    type CivilServiceSubjectModule,
} from "@/lib/civil-service";
import { createLogger } from "@/lib/logger";

const logger = createLogger('api:admin:migrate-tags');

interface TagAssociation {
    errorItemId: string;
    userId: string;
    tagName: string;
    subject: string;
}

export async function POST() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return unauthorized();
    }

    if ((session.user as any).role !== 'admin') {
        return forbidden("Admin access required for tag migration");
    }

    try {
        logger.info({ email: session.user.email }, 'Civil-service tag migration initiated');
        let totalCreated = 0;
        let associationsRestored = 0;
        let customTagsCreated = 0;
        let customTagsMigrated = 0;

        await prisma.$transaction(async (tx) => {
            const associations: TagAssociation[] = [];
            const errorItemsWithSystemTags = await tx.errorItem.findMany({
                select: {
                    id: true,
                    userId: true,
                    tags: {
                        where: { isSystem: true },
                        select: { name: true, subject: true },
                    },
                },
            });

            for (const item of errorItemsWithSystemTags) {
                for (const tag of item.tags) {
                    associations.push({
                        errorItemId: item.id,
                        userId: item.userId,
                        tagName: tag.name,
                        subject: tag.subject,
                    });
                }
            }

            const systemTagIds = await tx.knowledgeTag.findMany({
                where: { isSystem: true },
                select: { id: true },
            });
            if (systemTagIds.length > 0) {
                await tx.knowledgeTag.deleteMany({
                    where: { id: { in: systemTagIds.map(tag => tag.id) } },
                });
            }

            for (const module of Object.keys(CIVIL_SERVICE_STANDARD_TAG_GROUPS) as CivilServiceSubjectModule[]) {
                totalCreated += await seedCivilServiceModule(tx, module);
            }

            const customTags = await tx.knowledgeTag.findMany({
                where: { isSystem: false },
                select: {
                    id: true,
                    name: true,
                    subject: true,
                    userId: true,
                    errorItems: { select: { id: true } },
                },
            });
            for (const tag of customTags) {
                const normalizedSubject = normalizeKnowledgeTagSubject(tag.subject);
                if (normalizedSubject !== tag.subject) {
                    const existing = await tx.knowledgeTag.findFirst({
                        where: {
                            name: tag.name,
                            subject: normalizedSubject,
                            userId: tag.userId,
                            parentId: null,
                            NOT: { id: tag.id },
                        },
                        select: { id: true },
                    });
                    if (existing) {
                        for (const item of tag.errorItems) {
                            await tx.errorItem.update({
                                where: { id: item.id },
                                data: { tags: { connect: { id: existing.id } } },
                            });
                        }
                        await tx.knowledgeTag.delete({ where: { id: tag.id } });
                        customTagsMigrated++;
                    } else {
                        await tx.knowledgeTag.update({
                            where: { id: tag.id },
                            data: { subject: normalizedSubject, parentId: null },
                        });
                        customTagsMigrated++;
                    }
                }
            }

            for (const assoc of associations) {
                const module = normalizeKnowledgeTagSubject(assoc.subject);
                let tag = await tx.knowledgeTag.findFirst({
                    where: {
                        name: assoc.tagName,
                        subject: module,
                        OR: [
                            { isSystem: true },
                            { userId: assoc.userId },
                        ],
                    },
                    select: { id: true },
                });

                if (!tag) {
                    tag = await tx.knowledgeTag.create({
                        data: {
                            name: assoc.tagName,
                            subject: module,
                            isSystem: false,
                            userId: assoc.userId,
                            parentId: null,
                        },
                        select: { id: true },
                    });
                    customTagsCreated++;
                }

                await tx.errorItem.update({
                    where: { id: assoc.errorItemId },
                    data: {
                        tags: {
                            connect: { id: tag.id },
                        },
                    },
                });
                associationsRestored++;
            }
        }, {
            timeout: 120000,
        });

        logger.info({ totalCreated, associationsRestored, customTagsCreated, customTagsMigrated }, 'Civil-service tag migration completed');
        return NextResponse.json({
            success: true,
            count: totalCreated,
            associationsRestored,
            customTagsCreated,
            customTagsMigrated,
            message: "Civil-service tag migration complete with associations preserved",
        });
    } catch (error) {
        logger.error({ error }, 'Civil-service tag migration error');
        return internalError("Failed to migrate civil-service tags");
    }
}

async function seedCivilServiceModule(tx: any, module: CivilServiceSubjectModule) {
    let count = 0;
    const groups = CIVIL_SERVICE_STANDARD_TAG_GROUPS[module];
    for (let groupIdx = 0; groupIdx < groups.length; groupIdx++) {
        const group = groups[groupIdx];
        const groupNode = await tx.knowledgeTag.create({
            data: {
                name: group.name,
                subject: module,
                parentId: null,
                isSystem: true,
                order: groupIdx + 1,
            },
        });
        count++;

        for (let tagIdx = 0; tagIdx < group.tags.length; tagIdx++) {
            await tx.knowledgeTag.create({
                data: {
                    name: group.tags[tagIdx],
                    subject: module,
                    parentId: groupNode.id,
                    isSystem: true,
                    order: tagIdx + 1,
                },
            });
            count++;
        }
    }
    return count;
}
