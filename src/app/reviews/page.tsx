"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, CalendarCheck, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { ReviewScheduleItem } from "@/types/api";

type ReviewsResponse = {
    items: ReviewScheduleItem[];
};

const stageLabel: Record<number, string> = {
    1: "第 2 天一刷",
    2: "第 7 天二刷",
    3: "第 14 天三刷",
    4: "第 30 天确认",
};

export default function ReviewsPage() {
    const [items, setItems] = useState<ReviewScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get<ReviewsResponse>("/api/reviews/due");
            setItems(data.items || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const completeReview = async (id: string, isCorrect: boolean) => {
        setSavingId(id);
        try {
            await apiClient.patch(`/api/reviews/${id}/complete`, { isCorrect });
            await fetchItems();
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="container mx-auto max-w-5xl px-4 py-8">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/stats">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-bold">
                        <CalendarCheck className="h-8 w-8" />
                        待复盘
                    </h1>
                    <p className="mt-1 text-muted-foreground">按第 2/7/14/30 天节奏完成到期错题二刷。</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : items.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        当前没有到期复盘任务。
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {items.map(item => (
                        <Card key={item.id}>
                            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-2">
                                    <CardTitle className="text-lg">
                                        {stageLabel[item.reviewStage] || `第 ${item.reviewStage} 次复盘`}
                                    </CardTitle>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary">
                                            到期 {format(new Date(item.scheduledFor), "yyyy-MM-dd")}
                                        </Badge>
                                        <Badge variant="outline">
                                            {item.errorItem?.subjectModule || "其他"}
                                        </Badge>
                                        <Badge variant="outline">
                                            {item.errorItem?.mistakeReason || "其他"}
                                        </Badge>
                                    </div>
                                </div>
                                <Link href={`/error-items/${item.errorItemId}`}>
                                    <Button variant="outline" size="sm">查看错题</Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="line-clamp-3 text-sm">
                                    {item.errorItem?.questionText || "未命名错题"}
                                </p>
                                {item.errorItem?.nextReviewTip && (
                                    <div className="rounded-md bg-muted p-3 text-sm">
                                        <span className="font-medium">下次提醒：</span>
                                        {item.errorItem.nextReviewTip}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        onClick={() => completeReview(item.id, true)}
                                        disabled={savingId === item.id}
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        本次正确
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => completeReview(item.id, false)}
                                        disabled={savingId === item.id}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        本次错误
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
