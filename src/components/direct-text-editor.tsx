"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Eye, Edit3, PenLine, RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { TagInput } from "@/components/tag-input";
import { NotebookSelector } from "@/components/notebook-selector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MistakeStatus } from "@/lib/mistake-status";
import {
    CIVIL_SERVICE_EXAM_TYPES,
    CIVIL_SERVICE_MISTAKE_REASONS,
    CIVIL_SERVICE_SUBJECT_MODULES,
    type CivilServiceExamType,
    type CivilServiceMistakeReason,
    type CivilServiceSubjectModule,
} from "@/lib/civil-service";

interface DirectTextEditorProps {
    onSubmit: (data: {
        questionText: string;
        answerText: string;
        analysis: string;
        wrongAnswerText: string;
        mistakeAnalysis: string;
        mistakeStatus: string;
        knowledgePoints: string[];
        subjectId: string;
        paperLevel?: string;
        examType?: string;
        subjectModule?: string;
        questionType?: string;
        mistakeReason?: string;
    }) => Promise<void>;
    defaultNotebookId?: string;
    defaultNotebookName?: string;
    isSaving: boolean;
}

export function DirectTextEditor({ onSubmit, defaultNotebookId, isSaving }: DirectTextEditorProps) {
    const { t } = useLanguage();
    const [previewField, setPreviewField] = useState<string | null>(null);

    const [questionText, setQuestionText] = useState("");
    const [answerText, setAnswerText] = useState("");
    const [analysis, setAnalysis] = useState("");
    const [wrongAnswerText, setWrongAnswerText] = useState("");
    const [mistakeAnalysis, setMistakeAnalysis] = useState("");
    const [mistakeStatus, setMistakeStatus] = useState<MistakeStatus>("unknown");
    const [knowledgePoints, setKnowledgePoints] = useState<string[]>([]);
    const [subjectId, setSubjectId] = useState(defaultNotebookId || "");
    const [paperLevel, setPaperLevel] = useState("a");
    const [examType, setExamType] = useState<CivilServiceExamType>("省考");
    const [subjectModule, setSubjectModule] = useState<CivilServiceSubjectModule>("其他");
    const [questionType, setQuestionType] = useState("");
    const [mistakeReason, setMistakeReason] = useState<CivilServiceMistakeReason>("其他");

    const handleSubmit = async () => {
        if (!questionText.trim()) return;
        if (!subjectId) {
            alert(t.editor.messages?.selectNotebook || "请选择错题本");
            return;
        }

        await onSubmit({
            questionText: questionText.trim(),
            answerText: answerText.trim(),
            analysis: analysis.trim(),
            wrongAnswerText: wrongAnswerText.trim(),
            mistakeAnalysis: mistakeAnalysis.trim(),
            mistakeStatus,
            knowledgePoints,
            subjectId,
            paperLevel,
            examType,
            subjectModule,
            questionType: questionType.trim(),
            mistakeReason,
        });
    };

    const handleReset = () => {
        setQuestionText("");
        setAnswerText("");
        setAnalysis("");
        setWrongAnswerText("");
        setMistakeAnalysis("");
        setMistakeStatus("unknown");
        setKnowledgePoints([]);
        setPaperLevel("a");
        setExamType("省考");
        setSubjectModule("其他");
        setQuestionType("");
        setMistakeReason("其他");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            if (questionText.trim() && subjectId && !isSaving) {
                handleSubmit();
            }
        }
    };

    const fields = [
        {
            key: "question",
            label: t.editor?.question || "题目内容",
            value: questionText,
            setter: setQuestionText,
            placeholder: "输入题目内容...\n支持 Markdown 和 LaTeX 公式\n\n示例：\n# 资料分析\n\n2025 年某市一般公共预算收入为 960 亿元，同比增长 12.5%。问 2024 年该市一般公共预算收入约为多少亿元？\n\nA. 820\nB. 853\nC. 875\nD. 900",
            minHeight: "min-h-[180px]",
            required: true,
        },
        {
            key: "answer",
            label: t.editor?.answer || "参考答案",
            value: answerText,
            setter: setAnswerText,
            placeholder: "输入参考答案...\n\n示例：\nB。基期量 = 现期量 / (1 + 增长率) = 960 / 1.125 ≈ 853 亿元。",
            minHeight: "min-h-[120px]",
        },
        {
            key: "analysis",
            label: t.editor?.analysis || "解题分析",
            value: analysis,
            setter: setAnalysis,
            placeholder: "输入解题分析...\n\n示例：\n这是资料分析中的基期量问题。看到“现期量 + 同比增长率”，优先使用公式：基期量 = 现期量 / (1 + 增长率)。本题可用估算：960 ÷ 1.125 接近 853。",
            minHeight: "min-h-[150px]",
        },
        {
            key: "wrongAnswer",
            label: t.editor?.wrongAnswerText || "错误解答原文",
            value: wrongAnswerText,
            setter: setWrongAnswerText,
            placeholder: "如果有错误解答可以粘贴在这里，没有可留空",
            minHeight: "min-h-[100px]",
        },
        {
            key: "mistakeAnalysis",
            label: t.editor?.mistakeAnalysis || "错因分析",
            value: mistakeAnalysis,
            setter: setMistakeAnalysis,
            placeholder: "分析错误可能发生在哪一步、为什么错...",
            minHeight: "min-h-[100px]",
        },
    ];

    return (
        <Card className="border-dashed border-2 hover:border-primary/30 transition-colors">
            <CardContent className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <PenLine className="h-5 w-5" />
                        <span className="text-sm font-medium">
                            直接录入错题内容（支持 Markdown + LaTeX）
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        disabled={isSaving}
                        className="text-muted-foreground hover:text-destructive"
                    >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        重置
                    </Button>
                </div>

                {/* Notebook & Paper Level Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>{t.editor?.selectNotebook || "选择错题本"} *</Label>
                        <NotebookSelector
                            value={subjectId}
                            onChange={setSubjectId}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t.editor?.paperLevel || "试卷难度"}</Label>
                        <Select
                            value={paperLevel}
                            onValueChange={setPaperLevel}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">{t.editor?.paperLevels?.a || "A卷/基础"}</SelectItem>
                                <SelectItem value="b">{t.editor?.paperLevels?.b || "B卷/提高"}</SelectItem>
                                <SelectItem value="other">{t.editor?.paperLevels?.other || "其他"}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Civil Service Review Fields */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>考试类型</Label>
                        <Select value={examType} onValueChange={(val) => setExamType(val as CivilServiceExamType)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CIVIL_SERVICE_EXAM_TYPES.map(value => (
                                    <SelectItem key={value} value={value}>{value}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>科目模块</Label>
                        <Select value={subjectModule} onValueChange={(val) => setSubjectModule(val as CivilServiceSubjectModule)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CIVIL_SERVICE_SUBJECT_MODULES.map(value => (
                                    <SelectItem key={value} value={value}>{value}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>错因分类</Label>
                        <Select value={mistakeReason} onValueChange={(val) => setMistakeReason(val as CivilServiceMistakeReason)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CIVIL_SERVICE_MISTAKE_REASONS.map(value => (
                                    <SelectItem key={value} value={value}>{value}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>题型</Label>
                        <input
                            type="text"
                            value={questionType}
                            onChange={(e) => setQuestionType(e.target.value)}
                            placeholder="如：削弱加强"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>
                </div>

                {/* Fields with edit/preview toggle */}
                {fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className={field.required ? "text-primary font-semibold" : ""}>
                                {field.label} {field.required && "*"}
                            </Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => setPreviewField(previewField === field.key ? null : field.key)}
                                disabled={!field.value}
                            >
                                {previewField === field.key ? (
                                    <>
                                        <Edit3 className="h-3 w-3 mr-1" />
                                        编辑
                                    </>
                                ) : (
                                    <>
                                        <Eye className="h-3 w-3 mr-1" />
                                        预览
                                    </>
                                )}
                            </Button>
                        </div>
                        {previewField === field.key ? (
                            <div
                                className={`rounded-md border bg-muted/30 p-4 ${field.minHeight} overflow-auto cursor-pointer`}
                                onClick={() => setPreviewField(null)}
                            >
                                <MarkdownRenderer content={field.value} />
                            </div>
                        ) : (
                            <Textarea
                                value={field.value}
                                onChange={(e) => field.setter(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={field.placeholder}
                                className={`${field.minHeight} font-mono text-sm resize-y`}
                                disabled={isSaving}
                            />
                        )}
                    </div>
                ))}

                {/* Mistake Status */}
                <div className="space-y-2">
                    <Label>{t.editor?.mistakeStatus || "作答状态"}</Label>
                    <Select
                        value={mistakeStatus}
                        onValueChange={(val) => setMistakeStatus(val as MistakeStatus)}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="not_attempted">{t.editor?.mistakeStatuses?.notAttempted || "不会做"}</SelectItem>
                            <SelectItem value="wrong_attempt">{t.editor?.mistakeStatuses?.wrongAttempt || "做错了"}</SelectItem>
                            <SelectItem value="unknown">{t.editor?.mistakeStatuses?.unknown || "未判断"}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Knowledge Tags */}
                <div className="space-y-2">
                    <Label>{t.editor?.tags || "知识点标签"}</Label>
                        <TagInput
                            value={knowledgePoints}
                            onChange={setKnowledgePoints}
                            placeholder={t.editor?.tagsPlaceholder || "输入知识点标签..."}
                            enterHint={t.editor?.createTagHint}
                            subject={subjectModule}
                        />
                    <p className="text-xs text-muted-foreground">
                        {t.editor?.tagsHint || "💡 输入时会自动匹配已有标签"}
                    </p>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col items-center gap-2 pt-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={!questionText.trim() || !subjectId || isSaving}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium"
                        size="lg"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                保存中...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                直接保存
                            </>
                        )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                        填写题目和答案后直接保存，无需 AI 分析 · Ctrl+Enter 快捷保存
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
