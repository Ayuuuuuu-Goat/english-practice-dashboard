"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import type { PracticeRecord } from "@/lib/mock-data"
import { format } from "date-fns"
import { RecordDetailModal } from "./record-detail-modal"
import { AttachmentsCell } from "./attachments-cell"

interface RecordsTableProps {
  records: PracticeRecord[]
  onAddRecord: () => void
  onEditRecord: (record: PracticeRecord) => void
  onDeleteRecord: (id: string) => void
  onAddAttachment: (recordId: string) => void
  onDeleteAttachment: (recordId: string, fileUrl: string) => void
}

export function RecordsTable({
  records,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  onAddAttachment,
  onDeleteAttachment,
}: RecordsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [detailRecord, setDetailRecord] = useState<PracticeRecord | null>(null)

  const filteredRecords =
    searchQuery.trim() === ""
      ? records
      : records.filter((r) =>
          r.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()))
        )

  return (
    <>
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-semibold text-card-foreground">我的练习记录</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索日期或备注..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[180px] pl-9"
              />
            </div>
            <Button onClick={onAddRecord} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              新增记录
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-card-foreground">成员姓名</TableHead>
                  <TableHead className="font-semibold text-card-foreground">日期</TableHead>
                  <TableHead className="font-semibold text-card-foreground">时长 (分钟)</TableHead>
                  <TableHead className="font-semibold text-card-foreground">备注</TableHead>
                  <TableHead className="font-semibold text-card-foreground">附件</TableHead>
                  <TableHead className="text-center font-semibold text-card-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {searchQuery.trim() ? `未找到 "${searchQuery}" 的记录` : "暂无记录，点击新增记录开始"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => {
                    // 判断是否为自动记录（发音训练或视频学习）
                    const isAutoRecord = record.id.startsWith('pronunciation-') || record.id.startsWith('video-')

                    return (
                      <TableRow
                        key={record.id}
                        className="hover:bg-muted/30 cursor-pointer"
                        onClick={() => setDetailRecord(record)}
                      >
                        <TableCell className="font-medium text-card-foreground">{record.memberName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(record.date), "yyyy-MM-dd")}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
                            {record.duration}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px]">
                          <div className="line-clamp-2">{record.notes || "-"}</div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {isAutoRecord ? (
                            <span className="text-xs text-muted-foreground">自动记录</span>
                          ) : (
                            <AttachmentsCell
                              attachments={record.attachments}
                              onAddAttachment={() => onAddAttachment(record.id)}
                              onDeleteAttachment={(fileUrl) => onDeleteAttachment(record.id, fileUrl)}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {isAutoRecord ? (
                              <span className="text-xs text-muted-foreground px-2">-</span>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-card-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEditRecord(record)
                                  }}
                                  title="编辑"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteRecord(record.id)
                                  }}
                                  title="删除"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <RecordDetailModal record={detailRecord} open={!!detailRecord} onOpenChange={() => setDetailRecord(null)} />
    </>
  )
}
