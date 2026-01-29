"use client"

import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, TrendingUp, Calendar, Mic, BarChart3, Youtube, Newspaper, MessageSquare, LogOut, User, FileText, Headphones } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useEffect, useState } from "react"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  dateRange?: DateRange | undefined
  onDateRangeChange?: (range: DateRange | undefined) => void
}

const navItems = [
  { id: "pronunciation", label: "发音训练", icon: Mic },
  { id: "video-learning", label: "每日视频", icon: Youtube },
  { id: "hn-reading", label: "HN AI 资讯", icon: Newspaper },
  { id: "ai-conversation", label: "AI 场景对话", icon: MessageSquare },
  { id: "industry-reports", label: "行业报告阅读", icon: FileText },
  { id: "tech-podcasts", label: "技术播客精选", icon: Headphones },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = () => {
      const selectedRole = localStorage.getItem('selectedRole')
      if (selectedRole) {
        try {
          const role = JSON.parse(selectedRole)
          setUser(role)
        } catch (error) {
          console.error('Error parsing role data:', error)
        }
      }
    }
    getUser()
  }, [])

  const isViewer = (name: string) => {
    return name.toLowerCase() === 'viewer'
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem('selectedRole')
      toast.success('已登出')
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('登出失败')
    }
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-100 flex flex-col">
      <div className="flex h-20 items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 soft-shadow-sm">
            <span className="text-sm font-bold text-white">成神</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-gray-900 leading-tight">
              英语从入门到成神
            </span>
            <span className="text-xs text-gray-500">English Mastery</span>
          </div>
        </div>
      </div>
      <nav className="space-y-2 p-6 flex-1">
        {/* Viewer 只显示数据仪表盘 */}
        {user && isViewer(user.name) ? (
          <button
            onClick={() => router.push('/admin')}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="tracking-wide">数据仪表盘</span>
          </button>
        ) : (
          /* 其他角色显示训练功能 */
          navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300",
                  activeTab === item.id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="tracking-wide">{item.label}</span>
              </button>
            )
          })
        )}
      </nav>

      {/* 用户信息和登出 */}
      <div className="border-t border-gray-100 p-6 space-y-3">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-lg">
              {user.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              {isViewer(user.name) && (
                <p className="text-xs text-orange-600">数据查看者</p>
              )}
            </div>
          </div>
        )}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full rounded-xl border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
        >
          <LogOut className="h-4 w-4 mr-2" />
          登出
        </Button>
      </div>
    </aside>
  )
}
