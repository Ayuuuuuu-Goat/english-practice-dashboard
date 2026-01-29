"use client"

import { Button } from "@/components/ui/button"
import { Calendar, LogOut } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface TopBarProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
}

export function TopBar({ dateRange, onDateRangeChange }: TopBarProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      toast.success("已登出")
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("登出失败")
    }
  }
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between bg-white/80 px-8 backdrop-blur-xl border-b border-gray-100">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          英语从入门到成神
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">持续追踪你的英语学习进度</p>
      </div>
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 bg-white rounded-2xl border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
              <Calendar className="h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "MMM d, yyyy")
                )
              ) : (
                "Select Date Range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2 rounded-2xl hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4" />
          登出
        </Button>
      </div>
    </header>
  )
}
