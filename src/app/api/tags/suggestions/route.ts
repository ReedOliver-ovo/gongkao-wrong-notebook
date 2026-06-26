import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { createLogger } from "@/lib/logger";
import { normalizeKnowledgeTagSubject } from "@/lib/civil-service";

const logger = createLogger('api:tags:suggestions');

/**
 * GET /api/tags/suggestions
 * 获取标签建议（支持搜索）
 * Query params: 
 *   - q: 搜索词
 *   - subject: 科目模块 (可选；兼容旧学科 key)
 * 
 * 现在从数据库 KnowledgeTag 表查询，包含系统标签和用户的自定义标签
 */
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q")?.toLowerCase() || "";
        const subjectParam = searchParams.get("subject") || undefined;
        const subject = subjectParam ? normalizeKnowledgeTagSubject(subjectParam) : undefined;

        let user;
        if (session?.user?.email) {
            user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true }
            });
        }

        // 如果没有 session, 尝试默认用户? 还是只返回系统标签? 
        // 按照现有逻辑，很多地方都有 fallback 到默认用户的逻辑，这里也保持一致比较好，
        // 或者只返回系统标签。稳妥起见，如果已登录则返回用户标签。

        const whereCondition: any = {
            ...(subject ? { subject } : {}),
            OR: [
                { isSystem: true },
                ...(user ? [{ userId: user.id }] : [])
            ]
        };

        // Fetch all system tags AND user tags for the subject
        const allTags = await prisma.knowledgeTag.findMany({
            where: whereCondition,
            select: {
                id: true,
                name: true,
                parentId: true,
                userId: true,
                isSystem: true,
                children: { select: { id: true } }, // Check if leaf
            },
        });

        // Identify leaf nodes (suggestions candidates)
        // A node is a leaf if it has no children in the fetched set
        // Actually, we can check children array length from the query
        // But the query for 'children' relies on the relation.
        // Let's filter in memory.

        let suggestions = allTags.filter(t => t.children.length === 0);

        // Filter by query
        if (query) {
            suggestions = suggestions.filter((tag) =>
                tag.name.toLowerCase().includes(query)
            );
        }

        // Secondary sorting by name match position (optional) or just name
        const finalSuggestions = suggestions
            .slice(0, 30)
            .map(s => s.name);

        return NextResponse.json({
            suggestions: finalSuggestions,
            total: suggestions.length,
        });
    } catch (error) {
        logger.error({ error }, 'Error getting tag suggestions');
        return NextResponse.json(
            { message: "Failed to get tag suggestions" },
            { status: 500 }
        );
    }
}

