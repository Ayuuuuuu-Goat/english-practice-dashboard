"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface TrendChartsProps {
  weeklyData: { week: string; minutes: number }[]
  monthlyData: { month: string; minutes: number }[]
}

export function TrendCharts({ weeklyData, monthlyData }: TrendChartsProps) {
  const showWeekly = weeklyData.length > 0
  const showMonthly = monthlyData.length > 0
  const showBoth = showWeekly && showMonthly

  return (
    <div className={showBoth ? "grid gap-8 lg:grid-cols-2" : "grid gap-8"}>
      {showWeekly && (
        <div className="rounded-3xl bg-white p-8 soft-shadow hover-scale">
          <h3 className="text-lg font-bold text-gray-900 mb-6">每周趋势</h3>
          <div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 13, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tick={{ fontSize: 13, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "16px",
                      boxShadow: "0 10px 40px 0 rgba(0, 0, 0, 0.1)",
                      padding: "12px 16px",
                    }}
                    formatter={(value: number) => [`${value} 分钟`, "练习时长"]}
                  />
                  <Bar dataKey="minutes" fill="url(#colorGradient)" radius={[12, 12, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {showMonthly && (
        <div className="rounded-3xl bg-white p-8 soft-shadow hover-scale">
          <h3 className="text-lg font-bold text-gray-900 mb-6">每月趋势</h3>
          <div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 13, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tick={{ fontSize: 13, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "16px",
                      boxShadow: "0 10px 40px 0 rgba(0, 0, 0, 0.1)",
                      padding: "12px 16px",
                    }}
                    formatter={(value: number) => [`${value} 分钟`, "练习时长"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="minutes"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: "#6366f1", strokeWidth: 0, r: 5 }}
                    activeDot={{ r: 7, fill: "#a855f7" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {!showWeekly && !showMonthly && (
        <div className="rounded-3xl bg-white p-16 soft-shadow text-center">
          <p className="text-sm text-gray-500">暂无趋势数据，请先添加练习记录</p>
        </div>
      )}
    </div>
  )
}
