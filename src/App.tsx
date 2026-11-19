import { useState, type ReactNode } from "react"
import { History, Plus, Printer, RotateCcw, X } from "lucide-react"

import { Blank, BlankSelect } from "@/components/blank"
import { ConfirmDialog, type ConfirmRequest } from "@/components/confirm-dialog"
import { InvoiceHistory } from "@/components/invoice-history"
import { InvoicePaper } from "@/components/invoice-paper"
import { TemplatePicker } from "@/components/template-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useInvoices } from "@/hooks/use-invoices"
import { CURRENCIES, UNITS, calculate, clientName, makeMoney, type Invoice } from "@/lib/invoice"

function Section({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <Label asChild>
        <h3>
          <span className="grid size-5 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
            {step}
          </span>
          {title}
        </h3>
      </Label>
      {children}
    </section>
  )
}

const Sentence = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`text-base leading-[2.75rem] ${className}`}>{children}</div>
)

const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

export default function App() {
  const {
    current: inv, history, set, setItem, addItem, removeItem,
    createInvoice, open, duplicate, remove, setStatus, clearCurrent,
  } = useInvoices()
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const [invalid, setInvalid] = useState<Set<keyof Invoice>>(new Set())
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)

  const money = makeMoney(inv.currency)
  const { total } = calculate(inv)

  // Bind a text blank to a top-level invoice field
  const field = <K extends keyof Invoice>(key: K, extra: { minCh?: number; placeholder: string }) => ({
    id: `f-${key}`,
    value: inv[key] as string,
    "aria-invalid": invalid.has(key) || undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      set(key, e.target.value as Invoice[K])
      if (invalid.has(key)) setInvalid((s) => { const n = new Set(s); n.delete(key); return n })
    },
    ...extra,
  })

  const download = () => {
    const missing = (["fromName", "toName"] as const).filter((k) => !inv[k].trim())
    setInvalid(new Set(missing))
    if (!missing.length) return window.print()
    setConfirm({
      title: "Some key blanks are empty",
      description: `Your invoice has no ${missing.map((k) => (k === "fromName" ? "sender name" : "client name")).join(" or ")} yet. Download it anyway?`,
      action: "Download anyway",
      onConfirm: () => setTimeout(() => window.print(), 150),
    })
  }

  const switchTo = (fn: () => void) => { fn(); setInvalid(new Set()); setJustAdded(null); toTop() }

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 print:max-w-none print:p-0">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoice generator</h1>
          <p className="text-sm text-muted-foreground">Complete the sentences. Your invoice builds itself.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <a href="#history"><History /> History{history.length > 0 && <Badge variant="secondary" className="tabular-nums">{history.length}</Badge>}</a>
          </Button>
          <Button variant="outline" onClick={() => switchTo(createInvoice)}><Plus /> New invoice</Button>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr] print:block">
        <Card className="min-w-0 print:hidden">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Fill in the blanks
              <Badge variant="outline" className="font-normal text-muted-foreground">
                {inv.number || "Untitled"}{clientName(inv) ? ` · ${clientName(inv)}` : ""}
              </Badge>
            </CardTitle>
            <CardDescription>Every blank updates the invoice next to it. Changes save automatically.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setConfirm({
                title: "Clear this invoice?",
                description: "Every blank on this invoice will be emptied. Your other invoices in history stay as they are.",
                action: "Clear blanks",
                destructive: true,
                onConfirm: () => { clearCurrent(); setInvalid(new Set()) },
              })}>
                <RotateCcw /> Clear
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Section step={1} title="The invoice">
              <Sentence>
                This is invoice <Blank {...field("number", { placeholder: "INV-001", minCh: 7 })} />, issued on{" "}
                <Blank type="date" id="f-date" aria-label="Issue date" className="w-[9.5rem]" value={inv.date} onChange={(e) => set("date", e.target.value)} />{" "}
                and due on{" "}
                <Blank type="date" id="f-due" aria-label="Due date" className="w-[9.5rem]" value={inv.due} onChange={(e) => set("due", e.target.value)} />.
                All amounts are in{" "}
                <BlankSelect id="f-currency" aria-label="Currency" value={inv.currency} onChange={(e) => set("currency", e.target.value)}
                  options={CURRENCIES.map((c) => ({ value: c.code, label: c.label }))} />.
              </Sentence>
            </Section>
            <Separator />

            <Section step={2} title="Who is billing">
              <Sentence>
                I am <Blank {...field("fromName", { placeholder: "your name" })} /> from{" "}
                <Blank {...field("fromBusiness", { placeholder: "business name" })} />. You can reach me at{" "}
                <Blank type="email" {...field("fromEmail", { placeholder: "email address", minCh: 14 })} />, and I'm based at{" "}
                <Blank {...field("fromAddress", { placeholder: "your address", minCh: 18 })} />.
              </Sentence>
            </Section>
            <Separator />

            <Section step={3} title="Who is paying">
              <Sentence>
                I'm billing <Blank {...field("toName", { placeholder: "client name" })} /> at{" "}
                <Blank {...field("toCompany", { placeholder: "company" })} />, located at{" "}
                <Blank {...field("toAddress", { placeholder: "client address", minCh: 18 })} />.
              </Sentence>
            </Section>
            <Separator />

            <Section step={4} title="The work">
              <div className="grid gap-2">
                {inv.items.map((it) => (
                  <div key={it.id} className="flex items-start gap-2 rounded-lg border bg-muted/50 px-3 py-1.5">
                    <Sentence className="min-w-0 flex-1">
                      I did{" "}
                      <Blank aria-label="Work description" placeholder="describe the work" minCh={16} autoFocus={it.id === justAdded}
                        value={it.desc} onChange={(e) => setItem(it.id, { desc: e.target.value })} />, covering{" "}
                      <Blank type="number" min="0" step="any" aria-label="Quantity" className="w-20"
                        value={it.qty} onChange={(e) => setItem(it.id, { qty: e.target.value })} />{" "}
                      <BlankSelect aria-label="Unit" value={it.unit} onChange={(e) => setItem(it.id, { unit: e.target.value })}
                        options={Object.keys(UNITS).map((u) => ({ value: u, label: u }))} /> at{" "}
                      <Blank type="number" min="0" step="any" aria-label="Rate" placeholder="0.00" className="w-24"
                        value={it.rate} onChange={(e) => setItem(it.id, { rate: e.target.value })} /> each.
                    </Sentence>
                    {inv.items.length > 1 && (
                      <Button variant="ghost" size="icon-sm" className="mt-1.5 text-muted-foreground" aria-label="Remove line" onClick={() => removeItem(it.id)}>
                        <X />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <Button variant="outline" onClick={() => setJustAdded(addItem())}><Plus /> Add another line</Button>
              </div>
            </Section>
            <Separator />

            <Section step={5} title="Tax and discount">
              <Sentence>
                Please add tax of{" "}
                <Blank type="number" min="0" step="0.01" id="f-tax" aria-label="Tax percent" placeholder="0" className="w-20"
                  value={inv.tax} onChange={(e) => set("tax", e.target.value)} />% and take off a discount of{" "}
                <Blank type="number" min="0" step="0.01" id="f-discount" aria-label="Discount" placeholder="0" className="w-24"
                  value={inv.discount} onChange={(e) => set("discount", e.target.value)} /> (a flat amount).
              </Sentence>
            </Section>
            <Separator />

            <Section step={6} title="Getting paid">
              <Sentence>
                Please pay by <Blank {...field("payMethod", { placeholder: "bank transfer, PayPal…", minCh: 18 })} /> using these details:{" "}
                <Blank {...field("payDetails", { placeholder: "account number, link…", minCh: 18 })} />. One last thing:{" "}
                <Blank {...field("notes", { placeholder: "Thank you for your business!", minCh: 24 })} />
              </Sentence>
            </Section>
          </CardContent>
        </Card>

        <aside className="grid min-w-0 gap-4 lg:sticky lg:top-4 print:block">
          <div className="grid gap-2 print:hidden">
            <span className="text-sm font-medium">Design</span>
            <TemplatePicker value={inv.template} onChange={(id) => set("template", id)} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Live preview</span>
              <Badge variant="outline" className="tabular-nums">{money(total)}</Badge>
            </div>
            <Button onClick={download}><Printer /> Download PDF</Button>
          </div>
          <InvoicePaper invoice={inv} />
        </aside>
      </div>

      <div className="mt-6">
        <InvoiceHistory
          invoices={history}
          currentId={inv.id}
          onOpen={(id) => switchTo(() => open(id))}
          onDuplicate={(id) => switchTo(() => duplicate(id))}
          onStatus={setStatus}
          onDelete={(target) => setConfirm({
            title: `Delete ${target.number || "this invoice"}?`,
            description: `${clientName(target) ? `The invoice for ${clientName(target)}` : "This invoice"} will be removed from this browser. This can't be undone.`,
            action: "Delete",
            destructive: true,
            onConfirm: () => remove(target.id),
          })}
        />
      </div>

      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </div>
  )
}
