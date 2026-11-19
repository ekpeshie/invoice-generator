# Fill-in-the-Blanks Invoice

Complete the sentences and the invoice builds itself. React + Vite + Tailwind v4, using the
[shadcn/ui](https://ui.shadcn.com) components (`button`, `input`, `card`, `badge`, `separator`,
`label`, `native-select`, `toggle-group`, `table`, `alert-dialog`) and its zinc theme tokens. Light and dark follow the system theme
(press `d` to toggle).

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build to dist/
```

Deploy: import the repo on Vercel (Vite is detected automatically) or run `npx vercel --prod`.
## Features

- **Fill-in-the-blanks editor**: the invoice is written as sentences with inline inputs.
- **Four designs**: Classic, Modern, Minimal and Bold, picked per invoice.
- **Invoice history**: every invoice saves automatically. Search, filter by status
  (draft / sent / paid), open, duplicate or delete. New invoices take the next number and
  keep your sender details.
- **Download PDF** via the browser's print dialog (prints only the invoice).

Everything is stored in the browser's localStorage; nothing leaves the device.
