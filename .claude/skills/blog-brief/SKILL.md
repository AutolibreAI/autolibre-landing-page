---
name: blog-brief
description: >
  Arma el brief YAML de un post del blog de AutoLibre (content-pipeline/briefs/<slug>.yaml)
  a partir de plan.yaml y la fuente de verdad, y frena en el GATE 1.
  Trigger: paso 1 de /blog-post, o cuando se pide "brief" / "outline" de un post del plan.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Entradas

- `content-pipeline/plan.yaml` → el post por `slug` (title, category, tags, sourceIds, status, blockedBy).
- Fuente de verdad: `$BLOG_SOURCE_OF_TRUTH` o `../autolibre-fuente-verdad-documental-amba.md`.
  Leé SOLO las entradas `### <ID> · …` del post (Estado, Respuesta corta, Detalle, Fuentes, Verificado).
- `PRODUCT.md` → qué puede prometer la CTA.

## Reglas duras

- `blockedBy` con texto → STOP, mostrá el motivo. No se escribe nada.
- Nunca leas ni uses la sección "Notas internas" de la fuente ni los bloques `<!-- rag:skip -->`.
- Cada punto del outline, pregunta FAQ y tabla lleva los `sourceIds` que lo respaldan.
  Solo IDs ✅ se citan. Si una entrada es ⚠️/🔍 o ✅ mixto ("salvo …: 🔍"), anotalo en `caveats`:
  el draft NO lo afirma como hecho, explica la contradicción y recomienda la opción más segura.
- `cta`: solo capacidades listadas en `PRODUCT.md` → "Capabilities" (documentación, vencimientos de
  VTV/seguro/patente/service, historial, diagnóstico OBD2, talleres, varios autos, gratis).
  NUNCA alertas de licencia ni nada que no esté ahí.
- `internalLinks`: solo posts con `status: published` en plan.yaml (validate rechaza el resto).
- No inventes queries con volumen: `primaryQuery` sale de las "Preguntas típicas" de las entradas.

## Formato (`content-pipeline/briefs/<slug>.yaml`)

```yaml
slug: papeles-para-circular-amba
primaryQuery: "qué papeles tengo que llevar en el auto"
secondaryQueries: ["qué me pueden pedir en un control", "cédula azul sigue vigente"]
intent: informacional            # informacional | transaccional | navegacional
audience: "dueño de auto en AMBA que va a manejar o prestar el auto"
jurisdiction: [nacional, caba, pba]
angle: "Checklist corto + qué vale en el celular"
outline:
  - h2: "Qué documentos te pueden pedir"
    points: ["licencia vigente", "cédula verde/azul", "seguro", "DNI"]
    sourceIds: [DOC-01]
faq:
  - q: "¿Puedo llevar la cédula en el celular?"
    sourceIds: [DOC-02]
tables:
  - purpose: "Qué documento vale en papel y cuál en el celular"
    sourceIds: [DOC-02]
caveats:                          # ⚠️/🔍/mixtos: cómo se tratan en el texto
  - id: DOC-01
    issue: "matafuego/balizas en CABA 🔍"
    handling: "decir que falta confirmación oficial y recomendar llevarlos"
internalLinks: []                 # [{slug, anchor}] solo published
cta: "Guardá cédula, póliza y licencia en AutoLibre y recibí el aviso de vencimiento del seguro"
cover:
  concept: "A generic car glovebox open with blank document cards and a phone"  # inglés, 1 oración, sin texto/marcas
```

Cierre obligatorio del outline (lo exige blog-draft): H2 `Preguntas frecuentes` (≥2 preguntas, terminan en `?`)
y H2 final `Fuentes oficiales`.

## Flujo

1. Preflight: post existe en plan, sin `blockedBy`, status `planned` o `briefed`; la fuente existe.
2. Leé las entradas de `sourceIds` y escribí el YAML.
3. **🛑 GATE 1**: mostrale al humano ángulo, outline, FAQ, tablas, caveats y CTA. STOP. Esperá aprobación
   explícita; si pide cambios, editá el brief y volvé a preguntar. Nunca sigas al draft sin un "sí".
4. Con el "sí": `status: briefed` en plan.yaml (tocá solo ese campo de ese post).
