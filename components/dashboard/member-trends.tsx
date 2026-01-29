"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Search, User, Users, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PracticeRecord } from "@/lib/mock-data"
import { RecordDetailModal } from "./record-detail-modal"

interface MemberTrendsProps {
  records: PracticeRecord[]
}

function formatDuration(minutes: number): string {
  if (minutes === 0) return "0 分钟"
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} 分钟`
  if (mins === 0) return `${hours} 小时`
  return `${hours} 小时 ${mins} 分钟`
}

export function MemberTrends({ records }: MemberTrendsProps) {
  const [searchName, setSearchName] = useState("")
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<PracticeRecord | null>(null)

  const membersSummary = useMemo(() => {
    const memberMap = new Map<string, { weekMinutes: number; monthMinutes: number; totalMinutes: number }>()

    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(now.getDate() - 7)
    const monthAgo = new Date(now)
    monthAgo.setMonth(now.getMonth() - 1)

    records.forEach((record) => {
      const recordDate = new Date(record.date)
      const existing = memberMap.get(record.memberName) || { weekMinutes: 0, monthMinutes: 0, totalMinutes: 0 }

      existing.totalMinutes += record.duration

      if (recordDate >= weekAgo) {
        existing.weekMinutes += record.duration
      }

      if (recordDate >= monthAgo) {
        existing.monthMinutes += record.duration
      }

      memberMap.set(record.memberName, existing)
    })

    return Array.from(memberMap.entries()).map(([name, data]) => ({
      name,
      ...data,
    }))
  }, [records])

  const filteredMembers = useMemo(() => {
    if (!searchName.trim()) return membersSummary
    return membersSummary.filter((m) => m.name.toLowerCase().includes(searchName.toLowerCase()))
  }, [membersSummary, searchName])

  // Calculate weekly data for a specific member
  const calculateMemberWeeklyData = (memberName: string) => {
    const memberRecords = records.filter((r) => r.memberName === memberName)
    const weekMap = new Map<string, number>()

    memberRecords.forEach((record) => {
      const date = new Date(record.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split("T")[0]
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + record.duration)
    })

    const sortedWeeks = Array.from(weekMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)

    return sortedWeeks.map(([date, minutes], index) => ({
      week: `第 ${index + 1} 周`,
      minutes,
      date,
    }))
  }

  // Calculate monthly data for a specific member
  const calculateMemberMonthlyData = (memberName: string) => {
    const memberRecords = records.filter((r) => r.memberName === memberName)
    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
    const monthMap = new Map<number, number>()

    memberRecords.forEach((record) => {
      const month = new Date(record.date).getMonth()
      monthMap.set(month, (monthMap.get(month) || 0) + record.duration)
    })

    return monthNames.map((month, index) => ({
      month,
      minutes: monthMap.get(index) || 0,
    }))
  }

  // Calculate member stats
  const calculateMemberStats = (memberName: string) => {
    const memberRecords = records.filter((r) => r.memberName === memberName)
    const totalMinutes = memberRecords.reduce((sum, r) => sum + r.duration, 0)
    const totalSessions = memberRecords.length
    const avgPerSession = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0
    return { totalMinutes, totalSessions, avgPerSession, memberRecords }
  }

  if (selectedMember) {
    const weeklyData = calculateMemberWeeklyData(selectedMember)
    const monthlyData = calculateMemberMonthlyData(selectedMember)
    const stats = calculateMemberStats(selectedMember)

    return (
      <div className="space-y-6">
        {/* Back button and header */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSelectedMember(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-card-foreground">{selectedMember}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    共 {stats.totalSessions} 次练习 · 累计 {formatDuration(stats.totalMinutes)} · 平均每次{" "}
                    {stats.avgPerSession} 分钟
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Learning Records Table */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-card-foreground">学习记录</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.memberRecords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[33.33%] font-medium">日期</TableHead>
                    <TableHead className="w-[33.33%] font-medium">时长</TableHead>
                    <TableHead className="w-[33.33%] font-medium">备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.memberRecords.map((record) => (
                    <TableRow
                      key={record.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <TableCell className="text-foreground">
                        {new Date(record.date).toLocaleDateString("zh-CN")}
                      </TableCell>
                      <TableCell className="text-foreground">{formatDuration(record.duration)}</TableCell>
                      <TableCell className="text-foreground">
                        <div className="truncate">{record.notes || "-"}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">暂无学习记录</div>
            )}
          </CardContent>
        </Card>

        {/* Charts side by side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly trend - changed to LineChart */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-card-foreground">周度趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value} 分钟`, "练习时长"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="minutes"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    暂无周度数据
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monthly trend */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-card-foreground">月度趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value} 分钟`, "练习时长"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="minutes"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detail Modal */}
        <RecordDetailModal
          record={selectedRecord}
          open={!!selectedRecord}
          onOpenChange={(open) => !open && setSelectedRecord(null)}
        />
      </div>
    )
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-card-foreground">成员数据看板</CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索成员姓名..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredMembers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">姓名</TableHead>
                <TableHead className="font-semibold text-right">周学习时长</TableHead>
                <TableHead className="font-semibold text-right">月学习时长</TableHead>
                <TableHead className="font-semibold text-right">总学习时长</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow
                  key={member.name}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => setSelectedMember(member.name)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatDuration(member.weekMinutes)}</TableCell>
                  <TableCell className="text-right">{formatDuration(member.monthMinutes)}</TableCell>
                  <TableCell className="text-right">{formatDuration(member.totalMinutes)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-card-foreground">
              {searchName ? "未找到匹配的成员" : "暂无成员数据"}
            </h3>
            <p className="text-center text-sm text-muted-foreground">
              {searchName ? "请尝试其他搜索关键词" : "添加练习记录后，成员数据将在这里显示"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
