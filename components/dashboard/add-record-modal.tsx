"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Upload, X, FileIcon } from "lucide-react"
import { format } from "date-fns"
import type { PracticeRecord } from "@/lib/mock-data"

interface AddRecordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRecord?: PracticeRecord | null
  onSubmit: (data: {
    date: string
    duration: number
    notes?: string
    attachments?: Array<{
      url: string
      filename: string
      size: number
      type: string
    }>
  }) => void
  userEmail: string
}

export function AddRecordModal({ open, onOpenChange, editingRecord, onSubmit, userEmail }: AddRecordModalProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [duration, setDuration] = useState("")
  const [notes, setNotes] = useState("")
  const [attachments, setAttachments] = useState<Array<{ url: string; filename: string; size: number; type: string }>>(
    [],
  )
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (editingRecord) {
      setDate(new Date(editingRecord.date))
      setDuration(editingRecord.duration.toString())
      setNotes(editingRecord.notes || "")
      setAttachments(editingRecord.attachments || [])
    } else {
      setDate(new Date())
      setDuration("")
      setNotes("")
      setAttachments([])
    }
  }, [editingRecord, open])

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        return await response.json()
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      setAttachments([...attachments, ...uploadedFiles])
    } catch (error) {
      console.error("File upload error:", error)
      alert("文件上传失败，请重试")
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const handleSubmit = () => {
    if (!date || !duration) return
    onSubmit({
      date: format(date, "yyyy-MM-dd"),
      duration: Number.parseInt(duration),
      notes: notes || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">{editingRecord ? "编辑记录" : "新增练习记录"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">当前用户</p>
            <p className="text-sm font-medium">{userEmail}</p>
          </div>

          <div className="grid gap-2">
            <Label className="text-card-foreground">日期选择</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "yyyy-MM-dd") : "选择日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="duration" className="text-card-foreground">
              时长 (分钟)
            </Label>
            <Input
              id="duration"
              type="number"
              placeholder="输入练习时长"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes" className="text-card-foreground">
              备注 (可选)
            </Label>
            <Textarea
              id="notes"
              placeholder="输入会议备注..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-card-foreground">附件 (可选)</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">拖拽文件到这里，或点击上传</p>
              <Input
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={uploading}
              >
                {uploading ? "上传中..." : "选择文件"}
              </Button>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2 mt-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.filename}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(index)}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!date || !duration || uploading}>
            {editingRecord ? "保存修改" : "提交"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
