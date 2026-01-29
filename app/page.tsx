"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { PronunciationCombinedPage } from "@/components/pronunciation/pronunciation-combined-page"
import { DailyVideoPage } from "@/components/video-learning/daily-video-page"
import { DailyHNPage } from "@/components/hackernews/daily-hn-page"
import { AIPoweredConversationPage } from "@/components/ai-conversation/ai-powered-conversation-page"
import { BusinessPhrasesPage } from "@/components/business-phrases/business-phrases-page"
import { IndustryReportsPage } from "@/components/industry-reports/industry-reports-page"
import { TechPodcastsPage } from "@/components/tech-podcasts/tech-podcasts-page"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("pronunciation")
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    try {
      const selectedRole = localStorage.getItem('selectedRole')

      if (!selectedRole) {
        router.push('/login')
        return
      }

      const role = JSON.parse(selectedRole)

      // Viewer角色直接跳转到数据仪表盘
      if (role.name.toLowerCase() === 'viewer') {
        router.push('/admin')
        return
      }

      setUser(role)
      setIsLoading(false)
    } catch (error) {
      console.error('Error parsing role data:', error)
      router.push('/login')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case "pronunciation":
        return <PronunciationCombinedPage />
      case "video-learning":
        return <DailyVideoPage />
      case "hn-reading":
        return <DailyHNPage />
      case "ai-conversation":
        return <AIPoweredConversationPage />
      case "business-phrases":
        return <BusinessPhrasesPage />
      case "industry-reports":
        return <IndustryReportsPage />
      case "tech-podcasts":
        return <TechPodcastsPage />
      default:
        return <PronunciationCombinedPage />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="pl-64">
        <main className="p-8">{renderContent()}</main>
      </div>
    </div>
  )
}
