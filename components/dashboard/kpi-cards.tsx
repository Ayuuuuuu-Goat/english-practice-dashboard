"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock, Users, TrendingUp, Award } from "lucide-react"

interface KPIData {
  totalMinutes: number
  participatingMembers: number
  avgPerMember: number
  longestSession: number
}

interface KPICardsProps {
  data: KPIData
}

export function KPICards({ data }: KPICardsProps) {
  const cards = [
    {
      title: "本周练习总时长",
      value: `${data.totalMinutes}`,
      unit: "分钟",
      icon: Clock,
      color: "text-indigo-600",
      bgColor: "bg-gradient-to-br from-indigo-50 to-indigo-100/50",
      iconBg: "bg-indigo-500",
    },
    {
      title: "参与成员数",
      value: `${data.participatingMembers}`,
      unit: "人",
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100/50",
      iconBg: "bg-emerald-500",
    },
    {
      title: "人均练习时长",
      value: `${data.avgPerMember}`,
      unit: "分钟",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100/50",
      iconBg: "bg-purple-500",
    },
    {
      title: "最长单次会议",
      value: `${data.longestSession}`,
      unit: "分钟",
      icon: Award,
      color: "text-amber-600",
      bgColor: "bg-gradient-to-br from-amber-50 to-amber-100/50",
      iconBg: "bg-amber-500",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className={`rounded-3xl ${card.bgColor} p-6 soft-shadow hover-scale cursor-default`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-3">{card.title}</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${card.color}`}>{card.value}</span>
                  <span className="text-lg text-gray-500 font-medium">{card.unit}</span>
                </div>
              </div>
              <div className={`rounded-2xl p-3.5 ${card.iconBg} shadow-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
