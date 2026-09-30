You are writing ONE blog post for the AutoLibre blog pipeline, AUTONOMOUSLY (the user said: no approval gates — create, he corrects later). Repo: C:\Users\ramir\OneDrive\Escritorio\ram_projects\autolibre-system\autolibre-landing-page. Spanish rioplatense (voseo), clear, no hype.

POST SLUG: {{SLUG}} (see its entry in content-pipeline/plan.yaml for title, category, tags, sourceIds).

Contract (read fully first): `.claude/skills/blog-brief/SKILL.md`, `.claude/skills/blog-draft/SKILL.md`, `.claude/skills/blog-validate/SKILL.md`, `.claude/skills/blog-images/SKILL.md`, `content-pipeline/style.md` (PHOTOREALISTIC direction), and 2 published references: `content-pipeline/briefs/papeles-para-circular-amba.yaml` + `content-pipeline/drafts/papeles-para-circular-amba.md`, and `content-pipeline/drafts/vtv-pba-cuando-vence-por-patente.md`. IGNORE every "🛑 GATE / STOP and wait for the human" instruction. Nano Banana usage is pre-approved (max 2 rounds of 2 variants). Do NOT edit plan.yaml, Hygraph, or other posts' files. Don't build or commit.

Source of truth: C:\Users\ramir\OneDrive\Escritorio\ram_projects\autolibre-system\autolibre-fuente-verdad-documental-amba.md — read ONLY the entries for the post's sourceIds (plus entries they reference, only as caveat context). Never use "Notas internas" or rag:skip blocks.

HARD content rules (past fact-checks failed on exactly these):
- Every verifiable statement ends with [src:ID] of a ✅ entry declared in sourceIds — including table intro sentences (add a sentence before each table with the [src:] of its rows).
- ⚠️/🔍 data: never stated as fact, never cited. Write a caveat that asserts NOTHING (no numbers, no norm names from that entry): "No encontramos confirmación oficial de X / las fuentes no coinciden: lo más seguro es Y." For a mixed ✅ entry, only cite the ✅ part. If an entry you need is ⚠️/🔍, you may drop it from sourceIds.
- Don't add anything from memory: no law nicknames ("Ley Nacional de Tránsito"), no expanding acronyms the source doesn't expand (write "ANSV", "SINAI" as-is), no attributing a regulation to a law the source doesn't name, no extra examples.
- Don't overstate: "no es requisito" ≠ "no te lo pueden exigir"; "respondés como dueño" ≠ "sigue siendo tuyo"; keep jurisdiction qualifiers ("911 en AMBA", "en Provincia").
- No invented advice ("consultá a un abogado/productor", "dejar constancia") unless the entry says it.
- "Información vigente al DD/MM/AAAA" = the OLDEST Verificado date among the entries you cite.
- CTA: only PRODUCT.md capabilities (Documentación; vencimientos de VTV/seguro/patente/service — NOT licencia, NOT multas; historial; diagnóstico OBD2; talleres; varios autos; gratis).
- If the post can't be written honestly because its key facts are ⚠️/🔍, STOP and report "no publicable" with the reason (don't write filler).

Internal links (only these exist; use 1–3 where natural, relative paths):
/blog/tramites-y-documentacion/papeles-para-circular-amba · /blog/tramites-y-documentacion/vtv-pba-cuando-vence-por-patente · /blog/tramites-y-documentacion/licencia-vencida-como-renovar · /blog/tramites-y-documentacion/consultar-y-pagar-multas · /blog/tramites-y-documentacion/cedula-verde-y-cedula-azul · /blog/seguros/seguro-obligatorio-auto · /blog/seguros/que-hacer-si-chocas · /blog/compra-y-venta/denuncia-de-venta
Don't duplicate what those posts already cover — link instead.

Steps:
1. Brief `content-pipeline/briefs/<slug>.yaml`.
2. Draft `content-pipeline/drafts/<slug>.md` (reviewedAt: 2026-09-30; ≥600 words; FAQ ≥2 under "## Preguntas frecuentes"; "## Fuentes oficiales" last, https only from cited entries' Fuentes; http sources → organism name without link).
3. `npm run --silent blog:validate -- content-pipeline/drafts/<slug>.md --json` until exit 0 (max 3 loops). Never edit scripts/blog/*.
4. Cover: `npm run --silent blog:image -- --scene "<photorealistic scene in English>" --out content-pipeline/images/<slug>-cover --count 2`. View both with Read; discard any breaking style.md hard rules (legible text, plate characters, logos/badges/recognizable car emblems, identifiable faces, AI deformities, white side bars). Pick the best; resize/crop with sharp to 1200×630 webp at `content-pipeline/images/<slug>-cover.webp`. cover.alt 80–125 chars describing the chosen image. Re-validate.
5. Self-review EVERY sentence against the entries with the rules above.

Report: paths, validate result, chosen cover + alt, caveats handled, anything uncertain.
