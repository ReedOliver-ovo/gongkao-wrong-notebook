export const CIVIL_SERVICE_EXAM_TYPES = ['国考', '省考', '事业编'] as const;

export const CIVIL_SERVICE_SUBJECT_MODULES = [
    '言语理解',
    '判断推理',
    '数量关系',
    '资料分析',
    '常识判断',
    '申论',
    '公共基础知识',
    '职业能力倾向测验',
    '时政',
    '其他',
] as const;

export const CIVIL_SERVICE_MISTAKE_REASONS = [
    '知识点不会',
    '方法不熟',
    '审题错误',
    '计算错误',
    '时间不够',
    '选项干扰',
    '记忆不牢',
    '粗心',
    '其他',
] as const;

export const CIVIL_SERVICE_MASTERY_STATUS = [
    '未复盘',
    '已复盘待二刷',
    '一刷正确',
    '一刷错误',
    '二刷正确',
    '二刷错误',
    '已掌握',
    '长期易错',
] as const;

export type CivilServiceTagGroup = {
    name: string;
    tags: string[];
};

export const CIVIL_SERVICE_STANDARD_TAG_GROUPS: Record<CivilServiceSubjectModule, CivilServiceTagGroup[]> = {
    '言语理解': [
        { name: '片段阅读', tags: ['主旨概括', '意图判断', '细节理解', '标题填入', '态度观点'] },
        { name: '语句表达', tags: ['语句排序', '语句衔接', '下文推断', '病句辨析'] },
        { name: '逻辑填空', tags: ['实词辨析', '成语辨析', '关联词', '语境分析'] },
    ],
    '判断推理': [
        { name: '图形推理', tags: ['位置规律', '样式规律', '数量规律', '空间重构'] },
        { name: '定义判断', tags: ['核心要件', '主体客体', '限定条件', '排除法'] },
        { name: '类比推理', tags: ['逻辑关系', '语义关系', '语法关系', '常识关系'] },
        { name: '逻辑判断', tags: ['加强削弱', '前提假设', '结论推出', '真假推理', '分析推理'] },
    ],
    '数量关系': [
        { name: '基础计算', tags: ['方程思想', '整除特性', '比例倍数', '代入排除'] },
        { name: '应用题', tags: ['工程问题', '行程问题', '利润问题', '浓度问题', '年龄问题'] },
        { name: '排列组合与概率', tags: ['排列组合', '概率计算', '容斥原理', '抽屉原理'] },
        { name: '几何与数列', tags: ['几何面积', '几何体积', '等差数列', '等比数列'] },
    ],
    '资料分析': [
        { name: '增长相关', tags: ['增长量', '增长率', '基期量', '现期量', '年均增长'] },
        { name: '比重倍数平均数', tags: ['比重', '比重变化', '倍数', '平均数', '平均数变化'] },
        { name: '综合技巧', tags: ['速算估算', '截位直除', '差分比较', '材料定位'] },
    ],
    '常识判断': [
        { name: '法律常识', tags: ['宪法', '民法', '刑法', '行政法', '诉讼法'] },
        { name: '政治经济', tags: ['马克思主义', '中国特色社会主义', '宏观经济', '微观经济'] },
        { name: '历史人文', tags: ['中国古代史', '中国近现代史', '文学文化', '科技地理'] },
    ],
    '申论': [
        { name: '概括归纳', tags: ['问题概括', '原因概括', '影响概括', '经验概括'] },
        { name: '综合分析', tags: ['词句理解', '观点分析', '启示分析', '评价分析'] },
        { name: '提出对策与写作', tags: ['对策题', '贯彻执行', '文章立意', '论证结构'] },
    ],
    '公共基础知识': [
        { name: '法律', tags: ['宪法', '民法', '刑法', '行政法', '劳动法'] },
        { name: '政治', tags: ['哲学', '毛中特', '党史党建', '时政理论'] },
        { name: '经济管理公文', tags: ['市场经济', '宏观调控', '行政管理', '公文格式'] },
        { name: '科技人文', tags: ['科技常识', '历史文化', '地理国情', '事业单位常识'] },
    ],
    '职业能力倾向测验': [
        { name: '常识与言语', tags: ['常识应用', '言语理解', '语句表达', '材料理解'] },
        { name: '判断与数量', tags: ['判断推理', '数量分析', '策略选择', '综合应用'] },
    ],
    '时政': [
        { name: '国内时政', tags: ['重要会议', '政策文件', '领导讲话', '重大工程'] },
        { name: '国际时政', tags: ['国际组织', '外交事件', '全球治理', '地区热点'] },
    ],
    '其他': [
        { name: '通用复盘', tags: ['审题习惯', '时间分配', '方法迁移', '错题复盘'] },
    ],
};

const LEGACY_SUBJECT_TO_MODULE: Record<string, CivilServiceSubjectModule> = {
    math: '数量关系',
    mathematics: '数量关系',
    '数学': '数量关系',
    chinese: '言语理解',
    '语文': '言语理解',
    english: '言语理解',
    '英语': '言语理解',
    politics: '常识判断',
    history: '常识判断',
    geography: '常识判断',
    physics: '常识判断',
    chemistry: '常识判断',
    biology: '常识判断',
    '政治': '常识判断',
    '历史': '常识判断',
    '地理': '常识判断',
    '物理': '常识判断',
    '化学': '常识判断',
    '生物': '常识判断',
    other: '其他',
};

export type CivilServiceExamType = typeof CIVIL_SERVICE_EXAM_TYPES[number];
export type CivilServiceSubjectModule = typeof CIVIL_SERVICE_SUBJECT_MODULES[number];
export type CivilServiceMistakeReason = typeof CIVIL_SERVICE_MISTAKE_REASONS[number];
export type CivilServiceMasteryStatus = typeof CIVIL_SERVICE_MASTERY_STATUS[number];

function normalizeEnumValue<T extends readonly string[]>(
    value: unknown,
    allowedValues: T,
    fallback: T[number]
): T[number] {
    return typeof value === 'string' && (allowedValues as readonly string[]).includes(value)
        ? value as T[number]
        : fallback;
}

export function normalizeExamType(value: unknown): CivilServiceExamType {
    return normalizeEnumValue(value, CIVIL_SERVICE_EXAM_TYPES, '省考');
}

export function normalizeSubjectModule(value: unknown): CivilServiceSubjectModule {
    return normalizeEnumValue(value, CIVIL_SERVICE_SUBJECT_MODULES, '其他');
}

export function normalizeKnowledgeTagSubject(value: unknown): CivilServiceSubjectModule {
    if (typeof value !== 'string') return '其他';
    const trimmed = value.trim();
    if ((CIVIL_SERVICE_SUBJECT_MODULES as readonly string[]).includes(trimmed)) {
        return trimmed as CivilServiceSubjectModule;
    }
    return LEGACY_SUBJECT_TO_MODULE[trimmed.toLowerCase()] || LEGACY_SUBJECT_TO_MODULE[trimmed] || '其他';
}

export function normalizeMistakeReason(value: unknown): CivilServiceMistakeReason {
    return normalizeEnumValue(value, CIVIL_SERVICE_MISTAKE_REASONS, '其他');
}

export function normalizeMasteryStatus(value: unknown): CivilServiceMasteryStatus {
    return normalizeEnumValue(value, CIVIL_SERVICE_MASTERY_STATUS, '未复盘');
}

export function masteryStatusToLevel(status: unknown): 0 | 1 | 2 {
    const normalized = normalizeMasteryStatus(status);
    if (normalized === '已掌握') return 2;
    if (normalized === '已复盘待二刷' || normalized === '一刷正确' || normalized === '二刷正确') return 1;
    return 0;
}

export function parseOptionsText(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map(item => String(item).trim()).filter(Boolean);
    }
    if (typeof value !== 'string') return [];
    return value
        .split(/\n|(?=[A-D][.．、])/)
        .map(item => item.trim())
        .filter(Boolean);
}
