import { useCallback, useEffect, useMemo, useState } from "react"
import {
  blankInvoice, hasContent, newItem, nextNumber, uid,
  type Invoice, type LineItem, type Status,
} from "@/lib/invoice"

const KEY = "fill-blank-invoices-v3"
const LEGACY_KEY = "fill-blank-invoice-v2"

type Store = { invoices: Invoice[]; currentId: string }

function read(key: string) {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") } catch { return null }
}

/** Fill in any fields an older saved invoice might be missing. */
function normalize(raw: Partial<Invoice>): Invoice {
  const inv = blankInvoice(raw)
  if (!Array.isArray(inv.items) || !inv.items.length) inv.items = [newItem()]
  inv.items = inv.items.map((it) => ({ ...it, id: it.id ?? uid() }))
  return inv
}

function load(): Store {
  const saved = read(KEY)
  if (saved?.invoices?.length) {
    const invoices = (saved.invoices as Partial<Invoice>[]).map(normalize)
    const currentId = invoices.some((i) => i.id === saved.currentId) ? saved.currentId : invoices[0].id
    return { invoices, currentId }
  }
  // One-time move of the single invoice the previous version stored
  const legacy = read(LEGACY_KEY)
  const first = legacy ? normalize({ ...legacy, id: uid() }) : blankInvoice()
  return { invoices: [first], currentId: first.id }
}

export function useInvoices() {
  const [store, setStore] = useState<Store>(load)

  useEffect(() => {
    // Keep invoices that have something in them, plus the one being edited
    const invoices = store.invoices.filter((i) => i.id === store.currentId || hasContent(i))
    try { localStorage.setItem(KEY, JSON.stringify({ ...store, invoices })) } catch { /* storage unavailable */ }
  }, [store])

  const current = store.invoices.find((i) => i.id === store.currentId) ?? store.invoices[0]

  const patchCurrent = useCallback((fn: (inv: Invoice) => Invoice) =>
    setStore((s) => ({
      ...s,
      invoices: s.invoices.map((i) => (i.id === s.currentId ? { ...fn(i), updatedAt: Date.now() } : i)),
    })), [])

  const set = useCallback(<K extends keyof Invoice>(key: K, value: Invoice[K]) =>
    patchCurrent((inv) => ({ ...inv, [key]: value })), [patchCurrent])

  const setItem = useCallback((id: string, patch: Partial<LineItem>) =>
    patchCurrent((inv) => ({ ...inv, items: inv.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })), [patchCurrent])

  const addItem = useCallback(() => {
    const item = newItem()
    patchCurrent((inv) => ({ ...inv, items: [...inv.items, item] }))
    return item.id
  }, [patchCurrent])

  const removeItem = useCallback((id: string) =>
    patchCurrent((inv) => ({ ...inv, items: inv.items.length > 1 ? inv.items.filter((it) => it.id !== id) : inv.items })), [patchCurrent])

  /** Start a fresh invoice, carrying over the sender's details and preferences. */
  const createInvoice = useCallback(() =>
    setStore((s) => {
      const cur = s.invoices.find((i) => i.id === s.currentId)
      if (cur && !hasContent(cur)) return s
      const inv = blankInvoice({
        number: nextNumber(s.invoices.map((i) => i.number)),
        ...(cur && {
          template: cur.template, currency: cur.currency, tax: cur.tax,
          fromName: cur.fromName, fromBusiness: cur.fromBusiness, fromEmail: cur.fromEmail, fromAddress: cur.fromAddress,
          payMethod: cur.payMethod, payDetails: cur.payDetails, notes: cur.notes,
        }),
      })
      return { invoices: [inv, ...s.invoices.filter((i) => hasContent(i))], currentId: inv.id }
    }), [])

  const open = useCallback((id: string) =>
    setStore((s) => ({ invoices: s.invoices.filter((i) => i.id === id || hasContent(i)), currentId: id })), [])

  const duplicate = useCallback((id: string) =>
    setStore((s) => {
      const src = s.invoices.find((i) => i.id === id)
      if (!src) return s
      const fresh = blankInvoice()
      const copy: Invoice = {
        ...src, id: fresh.id, status: "draft", createdAt: fresh.createdAt, updatedAt: fresh.updatedAt,
        number: nextNumber(s.invoices.map((i) => i.number)), date: fresh.date, due: fresh.due,
        items: src.items.map((it) => ({ ...it, id: uid() })),
      }
      return { invoices: [copy, ...s.invoices.filter((i) => hasContent(i))], currentId: copy.id }
    }), [])

  const remove = useCallback((id: string) =>
    setStore((s) => {
      if (s.currentId !== id) return { ...s, invoices: s.invoices.filter((i) => i.id !== id) }
      const rest = s.invoices.filter((i) => i.id !== id && hasContent(i))
      if (rest.length) {
        const latest = [...rest].sort((a, b) => b.updatedAt - a.updatedAt)[0]
        return { invoices: rest, currentId: latest.id }
      }
      const inv = blankInvoice()
      return { invoices: [inv], currentId: inv.id }
    }), [])

  const setStatus = useCallback((id: string, status: Status) =>
    setStore((s) => ({ ...s, invoices: s.invoices.map((i) => (i.id === id ? { ...i, status, updatedAt: Date.now() } : i)) })), [])

  /** Clear the blanks of the open invoice but keep its number and place in history. */
  const clearCurrent = useCallback(() =>
    patchCurrent((inv) => blankInvoice({ id: inv.id, number: inv.number, template: inv.template, createdAt: inv.createdAt })), [patchCurrent])

  const history = useMemo(
    () => store.invoices.filter((i) => hasContent(i)).sort((a, b) => b.updatedAt - a.updatedAt),
    [store.invoices],
  )

  return { current, history, set, setItem, addItem, removeItem, createInvoice, open, duplicate, remove, setStatus, clearCurrent }
}
