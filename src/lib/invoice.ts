export type LineItem = { id: string; desc: string; qty: string; unit: string; rate: string }

export type Invoice = {
  number: string; date: string; due: string; currency: string
  fromName: string; fromBusiness: string; fromEmail: string; fromAddress: string
  toName: string; toCompany: string; toAddress: string
  tax: string; discount: string
  payMethod: string; payDetails: string; notes: string
  items: LineItem[]
}

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

export const newItem = (): LineItem => ({
  id: crypto.randomUUID(), desc: "", qty: "1", unit: "hours", rate: "",
})

export const defaultInvoice = (): Invoice => ({
  number: "INV-001", date: isoDate(), due: isoDate(14), currency: "USD",
  fromName: "", fromBusiness: "", fromEmail: "", fromAddress: "",
  toName: "", toCompany: "", toAddress: "",
  tax: "", discount: "", payMethod: "", payDetails: "", notes: "",
  items: [newItem()],
})

const num = (v: string) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

export function calculate(inv: Invoice) {
  const rows = inv.items.map((it) => ({ ...it, amount: num(it.qty) * num(it.rate) }))
  const subtotal = rows.reduce((s, r) => s + r.amount, 0)
  const discount = Math.min(num(inv.discount), subtotal)
  const taxRate = num(inv.tax)
  const tax = ((subtotal - discount) * taxRate) / 100
  return { rows, subtotal, discount, taxRate, tax, total: subtotal - discount + tax }
}

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
