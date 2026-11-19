import { calculate, formatDate, makeMoney, unitLabel, type Invoice } from "@/lib/invoice"

const Empty = ({ children }: { children: string }) => <span className="text-zinc-400">{children}</span>

/** The invoice document. Always light so it reads and prints like paper, in either app theme. */
export function InvoicePaper({ invoice: inv }: { invoice: Invoice }) {
  const money = makeMoney(inv.currency)
  const { rows, subtotal, discount, taxRate, tax, total } = calculate(inv)

  return (
    <div
      id="invoice-paper"
      aria-live="polite"
      className="min-h-[520px] rounded-xl border bg-white p-6 text-[13px] leading-normal text-zinc-950 shadow-sm sm:p-10 print:min-h-0 print:rounded-none print:border-0 print:p-0 print:shadow-none"
    >
      <div className="mb-8 flex flex-wrap justify-between gap-5">
        <h2 className="text-3xl leading-none font-bold tracking-tight">Invoice</h2>
        <div className="text-right text-zinc-500 tabular-nums">
          <div className="font-semibold text-zinc-950">{inv.number || <Empty>No. ?</Empty>}</div>
          <div>Issued {formatDate(inv.date) || "—"}</div>
          <div>Due {formatDate(inv.due) || "—"}</div>
        </div>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-6 [&>div]:wrap-anywhere">
        <div>
          <div className="mb-1 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">From</div>
          <div className="font-semibold">{inv.fromBusiness || inv.fromName || <Empty>Your name</Empty>}</div>
          {inv.fromBusiness && inv.fromName && <div>{inv.fromName}</div>}
          <div>{inv.fromAddress}</div>
          <div>{inv.fromEmail}</div>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">Bill to</div>
          <div className="font-semibold">{inv.toCompany || inv.toName || <Empty>Client</Empty>}</div>
          {inv.toCompany && inv.toName && <div>{inv.toName}</div>}
          <div>{inv.toAddress}</div>
        </div>
      </div>

      <div className="mb-4 overflow-x-auto">
        <table className="w-full border-collapse tabular-nums">
          <thead>
            <tr className="border-b border-zinc-200 text-xs font-medium text-zinc-500">
              <th className="px-1.5 py-2 text-left font-medium">Description</th>
              <th className="px-1.5 py-2 text-right font-medium">Qty</th>
              <th className="px-1.5 py-2 text-right font-medium">Rate</th>
              <th className="px-1.5 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-200 align-top">
                <td className="px-1.5 py-2.5 wrap-anywhere">{r.desc || <Empty>Describe the work</Empty>}</td>
                <td className="px-1.5 py-2.5 text-right whitespace-nowrap">{r.qty} {unitLabel(r.unit, r.qty)}</td>
                <td className="px-1.5 py-2.5 text-right whitespace-nowrap">{money(parseFloat(r.rate) || 0)}</td>
                <td className="px-1.5 py-2.5 text-right whitespace-nowrap">{money(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ml-auto w-full max-w-[260px] text-zinc-500 tabular-nums [&>div]:flex [&>div]:justify-between [&>div]:py-0.5">
        <div><span>Subtotal</span><span>{money(subtotal)}</span></div>
        {discount > 0 && <div><span>Discount</span><span>−{money(discount)}</span></div>}
        {taxRate > 0 && <div><span>Tax ({taxRate}%)</span><span>{money(tax)}</span></div>}
        <div className="mt-1.5 border-t border-zinc-950 pt-2.5 text-base font-bold text-zinc-950">
          <span>Total due</span><span>{money(total)}</span>
        </div>
      </div>

      {(inv.payMethod || inv.payDetails || inv.notes) && (
        <div className="mt-8 space-y-2 border-t border-zinc-200 pt-4 text-zinc-500 wrap-anywhere">
          {(inv.payMethod || inv.payDetails) && (
            <div>
              <b className="font-semibold text-zinc-950">Payment:</b> {inv.payMethod}
              {inv.payMethod && inv.payDetails ? " — " : ""}{inv.payDetails}
            </div>
          )}
          {inv.notes && <div>{inv.notes}</div>}
        </div>
      )}
    </div>
  )
}
