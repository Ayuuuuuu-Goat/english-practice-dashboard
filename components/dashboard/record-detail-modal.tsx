"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { User, Calendar, Clock, FileText, Paperclip, Download } from "lucide-react"
import type { PracticeRecord } from "@/lib/mock-data"

interface RecordDetailModalProps {
  record: PracticeRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDuration(minutes: number): string {
  if (minutes === 0) return "0 分钟"
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} 分钟`
  if (mins === 0) return `${hours} 小时`
  return `${hours} 小时 ${mins} 分钟`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

export function RecordDetailModal({ record, open, onOpenChange }: RecordDetailModalProps) {
  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>练习记录详情</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member info */}
          <div className="flex items-start gap-4 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-card-foreground">{record.memberName}</h3>
              <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(record.date), "yyyy年MM月dd日")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(record.duration)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {record.notes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                <FileText className="h-4 w-4" />
                <span>备注</span>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground whitespace-pre-wrap">
                {record.notes}
              </div>
            </div>
          )}

          {/* Attachments */}
          {record.attachments && record.attachments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                <Paperclip className="h-4 w-4" />
                <span>附件 ({record.attachments.length})</span>
              </div>
              <div className="space-y-2">
                {record.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-primary/10">
                        <Paperclip className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-card-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0"
                      onClick={() => window.open(file.url, "_blank")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
