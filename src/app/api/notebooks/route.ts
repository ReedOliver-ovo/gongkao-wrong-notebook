import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { unauthorized, badRequest, conflict, internalError } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";

const logger = createLogger('api:notebooks');

const DEFAULT_NOTEBOOK_NAMES = ["资料分析", "逻辑推理"] as const;
const LEGACY_DEFAULT_NOTEBOOK_NAME_MAP = new Map<string, string>([
    ["数学", "资料分析"],
    ["英语", "逻辑推理"],
]);

type NotebookRecord = {
    id: string;
    name: string;
    userId: string;
    _count?: {
        errorItems: number;
    };
};

async function migrateLegacyDefaultNotebooks(userId: string, notebooks: NotebookRecord[]) {
    let migrated = false;

    for (const [legacyName, targetName] of LEGACY_DEFAULT_NOTEBOOK_NAME_MAP) {
        const legacyNotebook = notebooks.find((notebook) => notebook.name === legacyName);
        if (!legacyNotebook) continue;

        const targetNotebook = notebooks.find(
            (notebook) => notebook.name === targetName && notebook.id !== legacyNotebook.id
        );

        if (targetNotebook) {
            await prisma.errorItem.updateMany({
                where: {
                    subjectId: legacyNotebook.id,
                    userId,
                },
                data: {
                    subjectId: targetNotebook.id,
                },
            });
            await prisma.subject.delete({
                where: { id: legacyNotebook.id },
            });
        } else {
            await prisma.subject.update({
                where: { id: legacyNotebook.id },
                data: { name: targetName },
            });
        }

        migrated = true;
    }

    return migrated;
}

/**
 * GET /api/notebooks
 * 获取用户所有错题本（Subjects）
 */
export async function GET() {
    const session = await getServerSession(authOptions);

    try {
        let user;
        if (session?.user?.email) {
            user = await prisma.user.findUnique({
                where: { email: session.user.email },
            });
        }

        if (!user) {
            return unauthorized("Authentication required");
        }

        let notebooks = await prisma.subject.findMany({
            where: {
                userId: user.id,
            },
            include: {
                _count: {
                    select: {
                        errorItems: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // If no notebooks exist, create default ones
        if (notebooks.length === 0) {
            await Promise.all(DEFAULT_NOTEBOOK_NAMES.map(name =>
                prisma.subject.create({
                    data: {
                        name,
                        userId: user!.id,
                    }
                })
            ));

            // Fetch again
            notebooks = await prisma.subject.findMany({
                where: {
                    userId: user.id,
                },
                include: {
                    _count: {
                        select: {
                            errorItems: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        } else {
            const migrated = await migrateLegacyDefaultNotebooks(user.id, notebooks);
            if (migrated) {
                notebooks = await prisma.subject.findMany({
                    where: {
                        userId: user.id,
                    },
                    include: {
                        _count: {
                            select: {
                                errorItems: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                });
            }
        }

        return NextResponse.json(notebooks);
    } catch (error) {
        logger.error({ error }, 'Error fetching notebooks');
        return internalError("Failed to fetch notebooks");
    }
}

/**
 * POST /api/notebooks
 * 创建新错题本
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    try {
        let user;
        if (session?.user?.email) {
            user = await prisma.user.findUnique({
                where: { email: session.user.email },
            });
        }

        if (!user) {
            return unauthorized("Authentication required");
        }

        const body = await req.json();
        const { name } = body;

        if (!name || !name.trim()) {
            return badRequest("Notebook name is required");
        }

        // 检查是否已存在同名错题本
        const existing = await prisma.subject.findUnique({
            where: {
                name_userId: {
                    name: name.trim(),
                    userId: user.id,
                },
            },
        });

        if (existing) {
            return conflict("Notebook with this name already exists");
        }

        const notebook = await prisma.subject.create({
            data: {
                name: name.trim(),
                userId: user.id,
            },
            include: {
                _count: {
                    select: {
                        errorItems: true,
                    },
                },
            },
        });

        return NextResponse.json(notebook, { status: 201 });
    } catch (error) {
        logger.error({ error }, 'Error creating notebook');
        return internalError("Failed to create notebook");
    }
}
