import { TemplateThumb } from "@/components/invoice-paper"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TEMPLATES, type TemplateId } from "@/lib/invoice"

export function TemplatePicker({ value, onChange }: { value: TemplateId; onChange: (id: TemplateId) => void }) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      aria-label="Invoice design"
      value={value}
      onValueChange={(v) => v && onChange(v as TemplateId)}
      className="grid w-full grid-cols-4 gap-2 shadow-none"
      spacing={2}
    >
      {TEMPLATES.map((t) => (
        <ToggleGroupItem
          key={t.id}
          value={t.id}
          aria-label={`${t.name}: ${t.blurb}`}
          title={t.blurb}
          className="h-auto min-w-0 flex-col items-stretch gap-1.5 rounded-lg! border! p-1.5 data-[state=on]:border-primary! data-[state=on]:ring-1 data-[state=on]:ring-primary"
        >
          <TemplateThumb id={t.id} />
          <span className="text-xs">{t.name}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
