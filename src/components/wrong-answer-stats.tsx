"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";

import { Loader2, TrendingUp, CheckCircle, BookOpen, CalendarCheck, RotateCcw, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient } from "@/lib/api-client";
import { AnalyticsData } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

type TooltipPayload = {
    value: number;
};

type ChartTooltipProps = {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
};

export function WrongAnswerStats() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                    <p className="font-medium mb-1">{label}</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                        <span className="text-muted-foreground">{t.wrongAnswerStats.activity}:</span>
                        <span className="font-bold">{payload[0].value}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const data = await apiClient.get<AnalyticsData>("/api/analytics");
            setData(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-2xl font-bold tracking-tight">
                {t.wrongAnswerStats.title}
            </h2>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t.wrongAnswerStats.totalErrors}</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalErrors}</div>
                        <p className="text-xs text-muted-foreground">
                            {t.wrongAnswerStats.totalErrorsDesc}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t.wrongAnswerStats.mastered}</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.masteredCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {t.wrongAnswerStats.masteredDesc}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t.wrongAnswerStats.masteryRate}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.masteryRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            {t.wrongAnswerStats.masteryRateDesc}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">本周新增</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.weeklyNewCount ?? 0}</div>
                        <p className="text-xs text-muted-foreground">本周录入错题数</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">本周复盘</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.weeklyReviewCompletedCount ?? 0}</div>
                        <p className="text-xs text-muted-foreground">已完成二刷/复盘</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">二刷正确率</CardTitle>
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.secondReviewCorrectRate ?? "0.0"}%</div>
                        <p className="text-xs text-muted-foreground">第 7 天复盘正确率</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-wrap gap-3">
                <Link href="/reviews">
                    <Button variant="outline">
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        待复盘
                    </Button>
                </Link>
                <Link href="/weekly-report">
                    <Button variant="outline">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        周报复盘
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Subject Distribution */}
                <Card className="col-span-2 md:col-span-1">
                    <CardHeader>
                        <CardTitle>{t.wrongAnswerStats.SubjectDistribution}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.subjectStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {data.subjectStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Monthly Trend */}
                <Card className="col-span-2 md:col-span-1">
                    <CardHeader>
                        <CardTitle>{t.wrongAnswerStats.MonthlyTrend}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar
                                    dataKey="count"
                                    fill="url(#colorCount)"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>错题最多模块 TOP 5</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {(data.moduleTop5 || []).map(item => (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                                <span>{item.name}</span>
                                <Badge variant="secondary">{item.value}</Badge>
                            </div>
                        ))}
                        {(!data.moduleTop5 || data.moduleTop5.length === 0) && (
                            <p className="text-sm text-muted-foreground">暂无模块数据</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>错因最多 TOP 5</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {(data.mistakeReasonTop5 || []).map(item => (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                                <span>{item.name}</span>
                                <Badge variant="secondary">{item.value}</Badge>
                            </div>
                        ))}
                        {(!data.mistakeReasonTop5 || data.mistakeReasonTop5.length === 0) && (
                            <p className="text-sm text-muted-foreground">暂无错因数据</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            长期易错题
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {(data.longTermDifficultItems || []).slice(0, 5).map(item => (
                            <Link key={item.id} href={`/error-items/${item.id}`} className="block rounded-md border p-3 hover:bg-muted">
                                <div className="line-clamp-2 text-sm">{item.questionText || "未命名错题"}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <Badge variant="outline">{item.subjectModule || "其他"}</Badge>
                                    <Badge variant="destructive">{item.mistakeReason || "其他"}</Badge>
                                </div>
                            </Link>
                        ))}
                        {(!data.longTermDifficultItems || data.longTermDifficultItems.length === 0) && (
                            <p className="text-sm text-muted-foreground">暂无长期易错题</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
