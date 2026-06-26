/**
 * 从数据库获取 AI 分析所需的标签
 * 替代原有的 getMathTagsByGrade 函数
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';
import {
    CIVIL_SERVICE_STANDARD_TAG_GROUPS,
    CIVIL_SERVICE_SUBJECT_MODULES,
    normalizeKnowledgeTagSubject,
    type CivilServiceSubjectModule,
} from '@/lib/civil-service';

const logger = createLogger('ai:tag-service');

export interface CivilServiceTagList {
    subject: CivilServiceSubjectModule;
    tags: string[];
}

/**
 * 从数据库获取考公/考编标签；数据库未初始化时回退到代码内置标准库。
 */
export async function getCivilServiceTagsFromDB(subject?: string | null): Promise<CivilServiceTagList[]> {
    const modules = subject
        ? [normalizeKnowledgeTagSubject(subject)]
        : [...CIVIL_SERVICE_SUBJECT_MODULES];

    const results: CivilServiceTagList[] = [];
    for (const module of modules) {
        const dbTags = await getTagsFromDB(module);
        results.push({
            subject: module,
            tags: dbTags.length > 0
                ? dbTags
                : CIVIL_SERVICE_STANDARD_TAG_GROUPS[module].flatMap(group => group.tags),
        });
    }
    return results;
}

/**
 * 旧接口兼容：数学标签在考公/考编语境下对应数量关系。
 */
export async function getMathTagsFromDB(grade: 7 | 8 | 9 | 10 | 11 | 12 | null): Promise<string[]> {
    void grade;
    const result = await getCivilServiceTagsFromDB('数量关系');
    return result[0]?.tags || [];
}

/**
 * 从数据库获取指定科目模块的标签，兼容旧学科 key。
 * @param subject - 科目模块或旧学科 key
 * @returns 标签名称数组
 */
export async function getTagsFromDB(subject: string): Promise<string[]> {
    try {
        const normalizedSubject = normalizeKnowledgeTagSubject(subject);
        const tags = await prisma.knowledgeTag.findMany({
            where: {
                subject: normalizedSubject,
                isSystem: true,
                // 只获取叶子节点
                children: { none: {} },
            },
            select: { name: true },
            orderBy: { order: 'asc' },
        });

        return tags.map(t => t.name);
    } catch (error) {
        logger.error({ error }, 'getTagsFromDB error');
        return [];
    }
}
