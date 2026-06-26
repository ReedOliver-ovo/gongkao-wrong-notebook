"use client";

import { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { CIVIL_SERVICE_SUBJECT_MODULES } from "@/lib/civil-service";

interface KnowledgeFilterProps {
    tag?: string | null;
    subjectModule?: string;
    onFilterChange: (filters: { tag?: string | null }) => void;
    className?: string;
}

export function KnowledgeFilter({
    tag: initialTag,
    subjectModule,
    onFilterChange,
    className,
}: KnowledgeFilterProps) {
    const [tag, setTag] = useState<string>(initialTag || "");
    const [tags, setTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (initialTag !== undefined) setTag(initialTag || "");
    }, [initialTag]);

    useEffect(() => {
        const fetchTags = async () => {
            setLoading(true);
            try {
                const modules = subjectModule && subjectModule !== "all"
                    ? [subjectModule]
                    : [...CIVIL_SERVICE_SUBJECT_MODULES];
                const results = await Promise.all(modules.map(module => {
                    const params = new URLSearchParams({ subject: module, flat: "true" });
                    return apiClient.get<{ tags: Array<{ name: string; isSystem: boolean }> }>(`/api/tags?${params.toString()}`);
                }));
                setTags([...new Set(results.flatMap(data => data.tags.map(item => item.name)))]);
            } catch (error) {
                console.error("Failed to load knowledge tags:", error);
                setTags([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTags();
    }, [subjectModule]);

    const handleTagChange = (val: string) => {
        setTag(val);
        onFilterChange({ tag: val === "all" ? null : val });
    };

    return (
        <div className={`flex gap-2 ${className || ""}`}>
            <Select value={tag || "all"} onValueChange={handleTagChange} disabled={loading}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="知识点标签" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">全部知识点</SelectItem>
                    {tags.map(item => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
