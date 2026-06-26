"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import type { WeeklyReportData } from "@/types/api";
import { CalendarDays, House, Loader2 } from "lucide-react";

export default function WeeklyReportPage() {
    const [report, setReport] = useState<WeeklyReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get<WeeklyReportData>("/api/weekly-report")
            .then(setReport)
            .catch(error => {
                console.error(error);
                alert("周报生成失败");
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </main>
        );
    }

    if (!report) return null;

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto p-4 md:p-8 max-w-5xl flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <BackButton fallbackUrl="/stats" />
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                            <CalendarDays className="h-7 w-7" />
                            周报复盘
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {new Date(report.weekStart).toLocaleDateString()} - {new Date(report.weekEnd).toLocaleDateString()}
                        </p>
                    </div>
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <House className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>本周表现</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{report.content.weeklyPerformance}</p>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>主要薄弱模块</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {report.content.weakModules.map(module => (
                                <Badge key={module} variant="secondary">{module}</Badge>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>主要错因</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {report.content.mainMistakeReasons.map(reason => (
                                <Badge key={reason} variant="secondary">{reason}</Badge>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>典型错题</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        {report.content.typicalErrorItems.map(item => (
                            <Link key={item.id} href={`/error-items/${item.id}`} className="rounded-md border p-3 hover:bg-accent">
                                <p className="text-sm line-clamp-2">{item.questionText || "未识别题干"}</p>
                                <Badge className="mt-2" variant="outline">{item.reason}</Badge>
                            </Link>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>下周复习计划</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 flex flex-col gap-2">
                            {report.content.nextWeekPlan.map(item => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
