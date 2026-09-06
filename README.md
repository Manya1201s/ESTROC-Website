# ESTROC

Portfolio site for ESTROC. React 19 + Vite + Tailwind v4, single page.

```bash
npm install
npm run dev        # http://localhost:3001
npm run build      # tsc -b && vite build
```

## Things to fill in

Each of these is a single constant — no other file needs touching.

| What | Where |
| --- | --- |
| Where the project form sends leads | `VITE_ENQUIRY_ENDPOINT` in `.env` (see `.env.example`) |
| Social handles | `socialLinks` in `src/pages/Home.tsx` |
| Client testimonials | `testimonials` in `src/components/estroc/Testimonials.tsx` |
| TRUESIGN MEDIA project URL | `projects` in `src/components/estroc/WorkSection.tsx` |

**The enquiry form.** With `VITE_ENQUIRY_ENDPOINT` set, the brief is POSTed there as
JSON. With it unset, the form falls back to opening the visitor's mail client with
the brief pre-filled, addressed to `hello@estroc.com` — so leads land somewhere
either way. Any service taking a JSON POST works (Formspree, Web3Forms, an Apps
Script, your own API).

**Testimonials and socials** render only when their arrays hold real entries.
Leave them empty and the section and the link column disappear cleanly, rather
than shipping placeholders to visitors.

## Motion

Reveals, the magnetic cursor and Lenis smooth scrolling all check
`prefers-reduced-motion` and step aside when it is set. Adding a new animation
means honouring that too — `useReducedMotion()` in components, a
`@media (prefers-reduced-motion: reduce)` block for CSS transitions.

## Light theme

`src/index.css` maps the dark palette to light through `html.light [class~="…"]`
overrides. Any *new* hard-coded colour utility (`bg-[#111113]`, `text-zinc-400`)
needs its counterpart added there, or it will stay dark when the theme flips.
