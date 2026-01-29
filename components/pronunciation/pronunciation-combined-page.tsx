"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PronunciationPracticePage } from './pronunciation-practice-page'
import { PronunciationStatsPage } from './pronunciation-stats'
import { Mic, BarChart3 } from 'lucide-react'

export function PronunciationCombinedPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            发音训练
          </h2>
          <p className="text-gray-600 mt-2 text-base">
            练习发音并追踪你的进步
          </p>
        </div>
      </div>

      <Tabs defaultValue="practice" className="w-full">
        <TabsList className="inline-grid grid-cols-2 bg-gray-100 p-1.5 rounded-2xl">
          <TabsTrigger
            value="practice"
            className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-3 px-6"
          >
            <Mic className="h-4 w-4" />
            <span className="font-medium">发音练习</span>
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-3 px-6"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="font-medium">统计数据</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="practice" className="mt-8">
          <PronunciationPracticePage />
        </TabsContent>

        <TabsContent value="stats" className="mt-8">
          <PronunciationStatsPage />
        </TabsContent>
      </Tabs>
    </div>
  )
}
