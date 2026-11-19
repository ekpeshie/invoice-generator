import { useMemo, useState } from "react"
import { Copy, FileText, Pencil, Search, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  STATUSES, TEMPLATES, calculate, clientName, formatDate, makeMoney,
  type Invoice, type Status,
} from "@/lib/invoice"
import { cn } from "@/lib/utils"

const STATUS_TONE: Record<Status, string> = {
  draft: "text-muted-foreground",
  sent: "text-sky-700 dark:text-sky-400",
  paid: "text-emerald-700 dark:text-emerald-400",
}

type Props = {
  invoices: Invoice[]
  currentId: string
  onOpen: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (inv: Invoice) => void
  onStatus: (id: string, s: Status) => void
}

export function InvoiceHistory({ invoices, currentId, onOpen, onDuplicate, onDelete, onStatus }: Props) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Status | "all">("all")

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices
      .filter((i) => filter === "all" || i.status === filter)
      .filter((i) => !q || [i.number, i.toName, i.toCompany, ...i.items.map((it) => it.desc)].join(" ").toLowerCase().includes(q))
  }, [invoices, query, filter])

  // Outstanding = sent but not paid, summed per currency
  const outstanding = useMemo(() => {
    const byCur = new Map<string, number>()
    for (const i of invoices) if (i.status === "sent") byCur.set(i.currency, (byCur.get(i.currency) ?? 0) + calculate(i).total)
    return [...byCur].map(([c, n]) => makeMoney(c)(n)).join(" + ")
  }, [invoices])

  return (
    <Card id="history" className="min-w-0 scroll-mt-4 print:hidden">
      <CardHeader>
        <CardTitle>Invoice history</CardTitle>
        <CardDescription>
          {invoices.length === 0
            ? "Invoices you start are saved here automatically."
            : `${invoices.length} saved in this browser${outstanding ? ` · ${outstanding} outstanding` : ""}`}
        </CardDescription>
        {invoices.length > 0 && (
          <CardAction className="col-span-2 col-start-1 row-start-3 flex w-full flex-wrap gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="history-search" aria-label="Search invoices" placeholder="Search client or number" className="h-8 pl-8"
                value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <NativeSelect id="history-filter" size="sm" aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value as Status | "all")}>
              <NativeSelectOption value="all">All statuses</NativeSelectOption>
              {STATUSES.map((s) => <NativeSelectOption key={s.value} value={s.value}>{s.label}</NativeSelectOption>)}
            </NativeSelect>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            <FileText className="size-6" />
            Fill in a client or a line of work and the invoice appears here.
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No invoices match that search.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Design</TableHead>
                <TableHead className="hidden sm:table-cell">Issued</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((inv) => {
                const editing = inv.id === currentId
                return (
                  <TableRow key={inv.id} data-state={editing ? "selected" : undefined}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {inv.number || "—"}
                        {editing && <Badge variant="secondary">Editing</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">{clientName(inv) || <span className="text-muted-foreground">No client yet</span>}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{TEMPLATES.find((t) => t.id === inv.template)?.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">{formatDate(inv.date)}</TableCell>
                    <TableCell className="text-right tabular-nums">{makeMoney(inv.currency)(calculate(inv).total)}</TableCell>
                    <TableCell>
                      <NativeSelect size="sm" aria-label={`Status of ${inv.number}`} value={inv.status}
                        className={cn("h-7 font-medium", STATUS_TONE[inv.status])}
                        onChange={(e) => onStatus(inv.id, e.target.value as Status)}>
                        {STATUSES.map((s) => <NativeSelectOption key={s.value} value={s.value}>{s.label}</NativeSelectOption>)}
                      </NativeSelect>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label={`Open ${inv.number}`} title="Open" disabled={editing} onClick={() => onOpen(inv.id)}>
                          <Pencil />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label={`Duplicate ${inv.number}`} title="Duplicate" onClick={() => onDuplicate(inv.id)}>
                          <Copy />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${inv.number}`} title="Delete"
                          className="text-muted-foreground hover:text-destructive" onClick={() => onDelete(inv)}>
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
