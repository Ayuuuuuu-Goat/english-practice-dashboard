"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, Plus, Eye, Download, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Attachment {
  name: string
  url: string
  size: number
}

interface AttachmentsCellProps {
  attachments?: Attachment[]
  onAddAttachment: () => void
  onDeleteAttachment: (url: string) => void
}

export function AttachmentsCell({ attachments = [], onAddAttachment, onDeleteAttachment }: AttachmentsCellProps) {
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null)

  console.log("[v0] AttachmentsCell - attachments:", attachments)

  const hasAttachments = attachments.length > 0

  const handlePreview = (attachment: Attachment) => {
    console.log("[v0] Preview attachment:", attachment)
    setPreviewFile(attachment)
  }

  const handleDownload = (attachment: Attachment) => {
    window.open(attachment.url, "_blank")
  }

  const isImageFile = (filename: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename)
  }

  const isPdfFile = (filename: string) => {
    return /\.pdf$/i.test(filename)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  if (!hasAttachments) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 bg-transparent"
        onClick={(e) => {
          e.stopPropagation()
          onAddAttachment()
        }}
      >
        <Plus className="h-3.5 w-3.5" />
        添加
      </Button>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 bg-transparent">
              <Paperclip className="h-3.5 w-3.5" />
              {attachments.length} 个附件
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="max-h-96 overflow-y-auto">
              {attachments.map((attachment, index) => (
                <div key={index} className="px-3 py-2 border-b last:border-b-0 hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" title={attachment.name}>
                        {attachment.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(isImageFile(attachment.name) || isPdfFile(attachment.name)) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs flex-1"
                        onClick={() => handlePreview(attachment)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        预览
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs flex-1"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      下载
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDeleteAttachment(attachment.url)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-2">
              <Button variant="ghost" size="sm" className="w-full h-8 justify-start text-xs" onClick={onAddAttachment}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                添加更多附件
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="truncate">{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center overflow-auto bg-muted/30 rounded-lg p-4">
            {previewFile && isImageFile(previewFile.name) && (
              <img
                src={previewFile.url || "/placeholder.svg"}
                alt={previewFile.name}
                className="max-w-full h-auto rounded shadow-lg"
              />
            )}
            {previewFile && isPdfFile(previewFile.name) && (
              <iframe src={previewFile.url} className="w-full h-[70vh] rounded" title={previewFile.name} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
