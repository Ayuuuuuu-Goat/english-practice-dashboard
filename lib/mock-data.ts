export interface PracticeRecord {
  id: string
  memberName: string
  date: string
  duration: number
  notes?: string
  attachments?: Array<{
    url: string
    filename: string
    size: number
    type: string
  }>
}

export interface Member {
  name: string
  records: {
    date: string
    duration: number
    notes?: string
    attachments?: Array<{ url: string; filename: string; size: number; type: string }>
  }[]
}

export interface Database {
  public: {
    Tables: {
      practice_records: {
        Row: {
          id: string
          member_name: string
          date: string
          duration: number
          notes: string | null
          created_at: string
          updated_at: string
          attachments: Array<{ url: string; filename: string; size: number; type: string }> | null
        }
        Insert: {
          id?: string
          member_name: string
          date: string
          duration: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          attachments?: Array<{ url: string; filename: string; size: number; type: string }>
        }
        Update: {
          id?: string
          member_name?: string
          date?: string
          duration?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          attachments?: Array<{ url: string; filename: string; size: number; type: string }>
        }
      }
    }
  }
}

export function calculateKPIData(records: PracticeRecord[]) {
  const totalMinutes = records.reduce((sum, r) => sum + r.duration, 0)
  const uniqueMembers = new Set(records.map((r) => r.memberName)).size
  const avgPerMember = uniqueMembers > 0 ? Math.round(totalMinutes / uniqueMembers) : 0
  const longestSession = records.length > 0 ? Math.max(...records.map((r) => r.duration)) : 0

  return {
    totalMinutes,
    participatingMembers: uniqueMembers,
    avgPerMember,
    longestSession,
  }
}

export function calculateWeeklyData(records: PracticeRecord[]) {
  const weekMap = new Map<string, number>()

  records.forEach((record) => {
    const date = new Date(record.date)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = weekStart.toISOString().split("T")[0]
    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + record.duration)
  })

  const sortedWeeks = Array.from(weekMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-4)

  return sortedWeeks.map(([_, minutes], index) => ({
    week: `第 ${index + 1} 周`,
    minutes,
  }))
}

export function calculateMonthlyData(records: PracticeRecord[]) {
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
  const monthMap = new Map<number, number>()

  records.forEach((record) => {
    const month = new Date(record.date).getMonth()
    monthMap.set(month, (monthMap.get(month) || 0) + record.duration)
  })

  return monthNames.map((month, index) => ({
    month,
    minutes: monthMap.get(index) || 0,
  }))
}
