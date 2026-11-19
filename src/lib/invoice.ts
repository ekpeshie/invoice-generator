export type LineItem = { id: string; desc: string; qty: string; unit: string; rate: string }

export type TemplateId = "classic" | "modern" | "minimal" | "bold"
export type Status = "draft" | "sent" | "paid"

export type Invoice = {
  id: string
  template: TemplateId
  status: Status
  createdAt: number
  updatedAt: number
  number: string; date: string; due: string; currency: string
  fromName: string; fromBusiness: string; fromEmail: string; fromAddress: string
  toName: string; toCompany: string; toAddress: string
  tax: string; discount: string
  payMethod: string; payDetails: string; notes: string
  items: LineItem[]
}

export const TEMPLATES: { id: TemplateId; name: string; blurb: string }[] = [
  { id: "classic", name: "Classic", blurb: "Clean and neutral" },
  { id: "modern", name: "Modern", blurb: "Indigo header band" },
  { id: "minimal", name: "Minimal", blurb: "Serif, lots of air" },
  { id: "bold", name: "Bold", blurb: "Dark sidebar summary" },
]

export const STATUSES: { value: Status; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
]

export const CURRENCIES = [
  { code: "USD", label: "US dollars ($)" },
  { code: "EUR", label: "euros (€)" },
  { code: "GBP", label: "pounds (£)" },
  { code: "NGN", label: "naira (₦)" },
  { code: "CAD", label: "Canadian dollars (CA$)" },
  { code: "AUD", label: "Australian dollars (A$)" },
  { code: "INR", label: "rupees (₹)" },
  { code: "JPY", label: "yen (¥)" },
]

export const UNITS: Record<string, string> = {
  hours: "hour", days: "day", items: "item", pieces: "piece", words: "word", pages: "page", units: "unit",
}

const isoDate = (offsetDays = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

export const uid = () => crypto.randomUUID()

export const newItem = (): LineItem => ({ id: uid(), desc: "", qty: "1", unit: "hours", rate: "" })

export const blankInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: uid(), template: "classic", status: "draft", createdAt: Date.now(), updatedAt: Date.now(),
  number: "INV-001", date: isoDate(), due: isoDate(14), currency: "USD",
  fromName: "", fromBusiness: "", fromEmail: "", fromAddress: "",
  toName: "", toCompany: "", toAddress: "",
  tax: "", discount: "", payMethod: "", payDetails: "", notes: "",
  items: [newItem()],
  ...overrides,
})

/** INV-009 -> INV-010, keeping the prefix and zero padding. */
export function nextNumber(numbers: string[]): string {
  let best: { prefix: string; n: number; width: number } | null = null
  for (const s of numbers) {
    const m = s.match(/^(.*?)(\d+)$/)
    if (!m) continue
    const n = parseInt(m[2], 10)
    if (!best || n > best.n) best = { prefix: m[1], n, width: m[2].length }
  }
  if (!best) return "INV-001"
  return best.prefix + String(best.n + 1).padStart(best.width, "0")
}

/** True once someone has typed anything that identifies the invoice. */
export const hasContent = (inv: Invoice) =>
  Boolean(inv.toName || inv.toCompany || inv.fromName || inv.fromBusiness || inv.items.some((i) => i.desc || i.rate))

const num = (v: string) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

export function calculate(inv: Invoice) {
  const rows = inv.items.map((it) => ({ ...it, rate: num(it.rate), amount: num(it.qty) * num(it.rate) }))
  const subtotal = rows.reduce((s, r) => s + r.amount, 0)
  const discount = Math.min(num(inv.discount), subtotal)
  const taxRate = num(inv.tax)
  const tax = ((subtotal - discount) * taxRate) / 100
  return { rows, subtotal, discount, taxRate, tax, total: subtotal - discount + tax }
}
export type Totals = ReturnType<typeof calculate>

export function makeMoney(currency: string) {
  let f: Intl.NumberFormat
  try { f = new Intl.NumberFormat(undefined, { style: "currency", currency }) }
  catch { f = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2 }) }
  return (n: number) => f.format(n)
}

export const unitLabel = (unit: string, qty: string) =>
  num(qty) === 1 ? (UNITS[unit] ?? unit) : unit

export const formatDate = (d: string) =>
  d ? new Date(d + "T00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : ""

export const clientName = (inv: Invoice) => inv.toCompany || inv.toName
