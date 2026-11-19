import { useCallback, useEffect, useState } from "react"
import { defaultInvoice, newItem, type Invoice, type LineItem } from "@/lib/invoice"

const KEY = "fill-blank-invoice-v2"

function load(): Invoice {
  const base = defaultInvoice()
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}")
    const merged = { ...base, ...saved }
    if (!Array.isArray(merged.items) || !merged.items.length) merged.items = base.items
    merged.items = merged.items.map((it: LineItem) => ({ ...it, id: it.id ?? crypto.randomUUID() }))
    return merged
  } catch {
    return base
  }
}

export function useInvoice() {
  const [invoice, setInvoice] = useState<Invoice>(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(invoice)) } catch { /* storage unavailable */ }
  }, [invoice])

  const set = useCallback(<K extends keyof Invoice>(key: K, value: Invoice[K]) =>
    setInvoice((p) => ({ ...p, [key]: value })), [])

  const setItem = useCallback((id: string, patch: Partial<LineItem>) =>
    setInvoice((p) => ({ ...p, items: p.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })), [])

  const addItem = useCallback(() => {
    const item = newItem()
    setInvoice((p) => ({ ...p, items: [...p.items, item] }))
    return item.id
  }, [])

  const removeItem = useCallback((id: string) =>
    setInvoice((p) => ({ ...p, items: p.items.length > 1 ? p.items.filter((it) => it.id !== id) : p.items })), [])

  const reset = useCallback(() => setInvoice(defaultInvoice()), [])

  return { invoice, set, setItem, addItem, removeItem, reset }
}
