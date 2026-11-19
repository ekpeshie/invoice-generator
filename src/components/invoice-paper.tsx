import type { ReactNode } from "react"
import {
  calculate, formatDate, makeMoney, unitLabel,
  type Invoice, type TemplateId, type Totals,
} from "@/lib/invoice"
import { cn } from "@/lib/utils"

/*
 * Invoice documents. Every design uses fixed light colours so the paper reads
 * and prints the same in either app theme.
 */

type Props = { inv: Invoice; t: Totals; money: (n: number) => string }

const Empty = ({ children }: { children: string }) => <span className="opacity-40">{children}</span>

const fromLines = (inv: Invoice) => ({
  title: inv.fromBusiness || inv.fromName || <Empty>Your name</Empty>,
  sub: [inv.fromBusiness && inv.fromName ? inv.fromName : "", inv.fromAddress, inv.fromEmail].filter(Boolean),
})
const toLines = (inv: Invoice) => ({
  title: inv.toCompany || inv.toName || <Empty>Client</Empty>,
  sub: [inv.toCompany && inv.toName ? inv.toName : "", inv.toAddress].filter(Boolean),
})

function Party({ label, lines, labelClass, className }: {
  label: string; lines: ReturnType<typeof fromLines>; labelClass?: string; className?: string
}) {
  return (
    <div className={cn("min-w-0 wrap-anywhere", className)}>
      <div className={cn("mb-1 text-[11px] font-medium tracking-wider uppercase opacity-60", labelClass)}>{label}</div>
      <div className="font-semibold">{lines.title}</div>
      {lines.sub.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  )
}

function Items({ t, money, headClass, rowClass }: Omit<Props, "inv"> & { headClass?: string; rowClass?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse tabular-nums">
        <thead>
          <tr className={cn("border-b border-zinc-200 text-xs", headClass)}>
            <th className="px-2 py-2 text-left font-medium">Description</th>
            <th className="px-2 py-2 text-right font-medium">Qty</th>
            <th className="px-2 py-2 text-right font-medium">Rate</th>
            <th className="px-2 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r) => (
            <tr key={r.id} className={cn("border-b border-zinc-200 align-top", rowClass)}>
              <td className="px-2 py-2.5 wrap-anywhere">{r.desc || <Empty>Describe the work</Empty>}</td>
              <td className="px-2 py-2.5 text-right whitespace-nowrap">{r.qty} {unitLabel(r.unit, r.qty)}</td>
              <td className="px-2 py-2.5 text-right whitespace-nowrap">{money(r.rate)}</td>
              <td className="px-2 py-2.5 text-right whitespace-nowrap">{money(r.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TotalsBlock({ t, money, grandClass, className }: Omit<Props, "inv"> & { grandClass?: string; className?: string }) {
  return (
    <div className={cn("ml-auto w-full max-w-[260px] tabular-nums [&>div]:flex [&>div]:justify-between [&>div]:py-0.5", className)}>
      <div><span className="opacity-70">Subtotal</span><span>{money(t.subtotal)}</span></div>
      {t.discount > 0 && <div><span className="opacity-70">Discount</span><span>−{money(t.discount)}</span></div>}
      {t.taxRate > 0 && <div><span className="opacity-70">Tax ({t.taxRate}%)</span><span>{money(t.tax)}</span></div>}
      <div className={cn("mt-1.5 border-t border-current pt-2.5 text-base font-bold", grandClass)}>
        <span>Total due</span><span>{money(t.total)}</span>
      </div>
    </div>
  )
}

function Footer({ inv, className }: { inv: Invoice; className?: string }) {
  if (!inv.payMethod && !inv.payDetails && !inv.notes) return null
  return (
    <div className={cn("space-y-2 wrap-anywhere", className)}>
      {(inv.payMethod || inv.payDetails) && (
        <div>
          <span className="font-semibold">Payment: </span>
          {inv.payMethod}{inv.payMethod && inv.payDetails ? " — " : ""}{inv.payDetails}
        </div>
      )}
      {inv.notes && <div className="opacity-70">{inv.notes}</div>}
    </div>
  )
}

const PaidStamp = ({ inv, className }: { inv: Invoice; className?: string }) =>
  inv.status === "paid" ? (
    <span className={cn("inline-block rounded border-2 border-emerald-600 px-2 py-0.5 text-xs font-bold tracking-widest text-emerald-700 uppercase", className)}>
      Paid
    </span>
  ) : null

/* ---------- Classic: neutral, the original design ---------- */
function Classic({ inv, t, money }: Props) {
  return (
    <div className="p-6 text-zinc-950 sm:p-10">
      <div className="mb-8 flex flex-wrap justify-between gap-5">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl leading-none font-bold tracking-tight">Invoice</h2>
          <PaidStamp inv={inv} />
        </div>
        <div className="text-right text-zinc-500 tabular-nums">
          <div className="font-semibold text-zinc-950">{inv.number || <Empty>No. ?</Empty>}</div>
          <div>Issued {formatDate(inv.date) || "—"}</div>
          <div>Due {formatDate(inv.due) || "—"}</div>
        </div>
      </div>
      <div className="mb-7 grid grid-cols-2 gap-6">
        <Party label="From" lines={fromLines(inv)} />
        <Party label="Bill to" lines={toLines(inv)} />
      </div>
      <Items t={t} money={money} headClass="text-zinc-500" />
      <TotalsBlock t={t} money={money} className="mt-4" />
      <Footer inv={inv} className="mt-8 border-t border-zinc-200 pt-4 text-zinc-600" />
    </div>
  )
}

/* ---------- Modern: indigo band, amount-due callout ---------- */
function Modern({ inv, t, money }: Props) {
  return (
    <div className="text-zinc-900">
      <div className="flex flex-wrap items-end justify-between gap-4 bg-indigo-600 px-6 py-8 text-white sm:px-10">
        <div>
          <div className="text-xs font-medium tracking-[0.2em] text-indigo-200 uppercase">Invoice</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{inv.number || "No. ?"}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-indigo-200">Amount due</div>
          <div className="text-3xl font-bold tracking-tight tabular-nums">{money(t.total)}</div>
        </div>
      </div>
      <div className="p-6 sm:p-10">
        <div className="mb-8 grid grid-cols-2 gap-6 sm:grid-cols-[1fr_1fr_auto]">
          <Party label="From" lines={fromLines(inv)} labelClass="text-indigo-600 opacity-100" />
          <Party label="Bill to" lines={toLines(inv)} labelClass="text-indigo-600 opacity-100" />
          <div className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-1 text-zinc-600 tabular-nums sm:col-span-1 sm:grid-cols-1 sm:text-right">
            <div><div className="text-[11px] font-medium tracking-wider text-indigo-600 uppercase">Issued</div>{formatDate(inv.date) || "—"}</div>
            <div><div className="text-[11px] font-medium tracking-wider text-indigo-600 uppercase">Due</div>{formatDate(inv.due) || "—"}</div>
          </div>
        </div>
        <Items t={t} money={money}
          headClass="border-0 bg-indigo-50 text-indigo-900 [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md"
          rowClass="border-zinc-100" />
        <TotalsBlock t={t} money={money} className="mt-4" grandClass="border-indigo-600 text-indigo-700" />
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4 rounded-lg bg-zinc-50 p-4 text-zinc-600">
          <Footer inv={inv} className="min-w-0 flex-1" />
          <PaidStamp inv={inv} className="ml-auto" />
        </div>
      </div>
    </div>
  )
}

/* ---------- Minimal: serif, generous whitespace, hairlines ---------- */
function Minimal({ inv, t, money }: Props) {
  return (
    <div className="px-6 py-10 font-serif text-[15px] text-stone-800 sm:px-12 sm:py-14">
      <div className="mb-12 flex flex-wrap items-baseline justify-between gap-4">
        <div className="text-2xl">{inv.fromBusiness || inv.fromName || <Empty>Your name</Empty>}</div>
        <div className="flex items-center gap-3 text-sm tracking-[0.25em] text-stone-500 uppercase">
          <PaidStamp inv={inv} className="font-sans" />Invoice {inv.number}
        </div>
      </div>
      <div className="mb-12 grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
        <Party label="Billed to" lines={toLines(inv)} labelClass="font-sans text-stone-500 opacity-100" />
        <Party label="From" lines={{ ...fromLines(inv), title: inv.fromName || <Empty>Your name</Empty>, sub: [inv.fromAddress, inv.fromEmail].filter(Boolean) }}
          labelClass="font-sans text-stone-500 opacity-100" />
        <div className="col-span-2 tabular-nums sm:col-span-1 sm:text-right">
          <div className="mb-1 font-sans text-[11px] font-medium tracking-wider text-stone-500 uppercase">Dates</div>
          <div>Issued {formatDate(inv.date) || "—"}</div>
          <div>Due {formatDate(inv.due) || "—"}</div>
        </div>
      </div>
      <Items t={t} money={money} headClass="border-stone-800 font-sans text-stone-500" rowClass="border-stone-200" />
      <TotalsBlock t={t} money={money} className="mt-6" grandClass="border-stone-800 text-lg font-semibold" />
      <Footer inv={inv} className="mt-14 text-sm text-stone-600" />
    </div>
  )
}

/* ---------- Bold: dark sidebar with the summary ---------- */
function Bold({ inv, t, money }: Props) {
  return (
    <div className="grid text-zinc-900 @2xl:grid-cols-[210px_1fr]">
      <div className="grid grid-cols-2 gap-6 bg-zinc-900 p-6 text-zinc-100 @2xl:flex @2xl:flex-col @2xl:p-8">
        <div>
          <div className="text-4xl leading-none font-black tracking-tighter text-amber-400">INVOICE</div>
          <div className="mt-2 text-sm text-zinc-400">{inv.number}</div>
        </div>
        <Party label="From" lines={fromLines(inv)} labelClass="text-amber-400 opacity-100" className="text-sm text-zinc-300 [&>div:nth-child(2)]:text-white" />
        <Party label="Bill to" lines={toLines(inv)} labelClass="text-amber-400 opacity-100" className="text-sm text-zinc-300 [&>div:nth-child(2)]:text-white" />
        <div className="text-sm text-zinc-300 tabular-nums">
          <div>Issued {formatDate(inv.date) || "—"}</div>
          <div>Due {formatDate(inv.due) || "—"}</div>
        </div>
        <div className="col-span-2 rounded-lg bg-amber-400 p-4 text-zinc-900 @2xl:mt-auto">
          <div className="text-xs font-semibold tracking-wider uppercase">Total due</div>
          <div className="text-2xl font-black tracking-tight tabular-nums">{money(t.total)}</div>
        </div>
      </div>
      <div className="min-w-0 p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Services</h2>
          <PaidStamp inv={inv} />
        </div>
        <Items t={t} money={money} headClass="border-zinc-900 text-zinc-500 uppercase tracking-wider text-[11px]" />
        <TotalsBlock t={t} money={money} className="mt-4" grandClass="border-zinc-900" />
        <Footer inv={inv} className="mt-8 border-l-4 border-amber-400 pl-4 text-zinc-600" />
      </div>
    </div>
  )
}

const DESIGNS: Record<TemplateId, (p: Props) => ReactNode> = {
  classic: Classic, modern: Modern, minimal: Minimal, bold: Bold,
}

export function InvoicePaper({ invoice }: { invoice: Invoice }) {
  const Design = DESIGNS[invoice.template] ?? Classic
  return (
    <div
      id="invoice-paper"
      aria-live="polite"
      className="@container grid min-h-[520px] overflow-hidden rounded-xl border bg-white text-[13px] leading-normal shadow-sm print:min-h-0 print:rounded-none print:border-0 print:shadow-none"
    >
      <Design inv={invoice} t={calculate(invoice)} money={makeMoney(invoice.currency)} />
    </div>
  )
}

/** Tiny schematic of each design, used in the picker. */
export function TemplateThumb({ id }: { id: TemplateId }) {
  const line = "h-1 rounded-full bg-zinc-300"
  return (
    <div className="h-14 w-full overflow-hidden rounded-sm border border-zinc-200 bg-white" aria-hidden>
      {id === "classic" && (
        <div className="grid gap-1 p-1.5">
          <div className="h-1.5 w-6 rounded-full bg-zinc-900" />
          <div className={cn(line, "w-10")} /><div className={line} /><div className={line} />
        </div>
      )}
      {id === "modern" && (
        <>
          <div className="h-4 bg-indigo-600" />
          <div className="grid gap-1 p-1.5"><div className="h-1 rounded-full bg-indigo-100" /><div className={line} /><div className={line} /></div>
        </>
      )}
      {id === "minimal" && (
        <div className="grid gap-1.5 p-2">
          <div className="h-1 w-8 rounded-full bg-stone-500" />
          <div className="h-px bg-stone-400" /><div className="h-px bg-stone-200" /><div className="h-px bg-stone-200" />
        </div>
      )}
      {id === "bold" && (
        <div className="grid h-full grid-cols-[38%_1fr]">
          <div className="flex flex-col justify-between bg-zinc-900 p-1">
            <div className="h-1.5 w-full rounded-full bg-amber-400" /><div className="h-2.5 rounded-sm bg-amber-400" />
          </div>
          <div className="grid content-start gap-1 p-1.5"><div className={line} /><div className={line} /></div>
        </div>
      )}
    </div>
  )
}
