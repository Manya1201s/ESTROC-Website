# ESTROC

Portfolio site for ESTROC. React 19 + Vite + Tailwind v4, single page.

```
frontend/   React app (Vite)
backend/    FastAPI API — chatbot + enquiry emails
```

```bash
cd frontend
npm install
npm run dev        # http://localhost:3001
npm run build      # tsc -b && vite build
```

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload   # http://localhost:8000
```

Each side has its own `.env`: `frontend/.env` holds only `VITE_*` vars,
`backend/.env` holds the secrets (OpenAI key, SMTP).

## Things to fill in

Each of these is a single constant — no other file needs touching.

| What | Where |
| --- | --- |
| Where the project form sends leads | `VITE_ENQUIRY_ENDPOINT` in `frontend/.env` |
| Social handles | `socialLinks` in `frontend/src/pages/Home.tsx` |
| Client testimonials | `testimonials` in `frontend/src/components/estroc/Testimonials.tsx` |
| Projects in the work section and hero console | `projects` in `frontend/src/lib/projects.ts` (each needs a 1.15:1 screenshot in `frontend/public/work/`) |

**The enquiry form.** With `VITE_ENQUIRY_ENDPOINT` set, the brief is POSTed there as
JSON. With it unset, the form falls back to opening the visitor's mail client with
the brief pre-filled, addressed to `hello@estroc.co.in` — so leads land somewhere
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

`frontend/src/index.css` maps the dark palette to light through `html.light [class~="…"]`
overrides. Any *new* hard-coded colour utility (`bg-[#111113]`, `text-zinc-400`)
needs its counterpart added there, or it will stay dark when the theme flips.
