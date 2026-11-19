import { useState, type ReactNode } from "react"
import { Plus, Printer, RotateCcw, X } from "lucide-react"

import { Blank, BlankSelect } from "@/components/blank"
import { InvoicePaper } from "@/components/invoice-paper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useInvoice } from "@/hooks/use-invoice"
import { CURRENCIES, UNITS, calculate, makeMoney, type Invoice } from "@/lib/invoice"

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

export default function App() {
  const { invoice: inv, set, setItem, addItem, removeItem, reset } = useInvoice()
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const [invalid, setInvalid] = useState<Set<keyof Invoice>>(new Set())

  const money = makeMoney(inv.currency)
  const { total } = calculate(inv)

  // Bind a text blank to a top-level invoice field
  const field = <K extends keyof Invoice>(key: K, extra: { minCh?: number; placeholder: string; type?: string }) => ({
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
    if (missing.length && !window.confirm("Some key blanks are still empty. Print anyway?")) {
      document.getElementById(`f-${missing[0]}`)?.focus()
      return
    }
    window.print()
  }

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 print:max-w-none print:p-0">
      <header className="mb-6 print:hidden">
        <h1 className="text-2xl font-semibold tracking-tight">Invoice generator</h1>
        <p className="text-sm text-muted-foreground">Complete the sentences. Your invoice builds itself.</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr] print:block">
        <Card className="min-w-0 print:hidden">
          <CardHeader>
            <CardTitle>Fill in the blanks</CardTitle>
            <CardDescription>Every blank updates the invoice next to it.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Section step={1} title="The invoice">
              <Sentence>
                This is invoice <Blank {...field("number", { placeholder: "INV-001", minCh: 7 })} />, issued on{" "}
                <Blank type="date" id="f-date" aria-label="Issue date" className="w-[9.5rem]" value={inv.date} onChange={(e) => set("date", e.target.value)} />{" "}
                and due on{" "}
                <Blank type="date" id="f-due" aria-label="Due date" className="w-[9.5rem]" value={inv.due} onChange={(e) => set("due", e.target.value)} />.
                All amounts are in{" "}
                <BlankSelect aria-label="Currency" value={inv.currency} onChange={(e) => set("currency", e.target.value)}
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

            <div>
              <Button variant="ghost" className="text-muted-foreground" onClick={() => { if (window.confirm("Clear everything and start a new invoice?")) { reset(); setInvalid(new Set()) } }}>
                <RotateCcw /> Start over
              </Button>
            </div>
          </CardContent>
        </Card>

        <aside className="grid min-w-0 gap-3 lg:sticky lg:top-4 print:block">
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
    </div>
  )
}
