import * as React from "react"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { cn } from "@/lib/utils"

/** A shadcn Input that sits inside a sentence and grows with its content. */
export function Blank({
  className, value, placeholder, minCh = 8, style, ...props
}: Omit<React.ComponentProps<typeof Input>, "value"> & { value: string; minCh?: number }) {
  const auto = props.type === undefined || props.type === "text" || props.type === "email"
  const width = auto
    ? { width: `calc(${Math.max(minCh, (value || String(placeholder ?? "")).length + 1)}ch + 1.5rem)` }
    : undefined
  return (
    <Input
      value={value}
      placeholder={placeholder}
      style={{ ...width, ...style }}
      className={cn("mx-0.5 inline-block h-8 w-auto max-w-full align-middle text-sm md:text-sm", className)}
      {...props}
    />
  )
}

export function BlankSelect({
  className, options, ...props
}: Omit<React.ComponentProps<"select">, "size"> & { options: { value: string; label: string }[] }) {
  return (
    <span className="mx-0.5 inline-block align-middle">
      <NativeSelect size="sm" className={className} {...props}>
        {options.map((o) => (
          <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>
        ))}
      </NativeSelect>
    </span>
  )
}
