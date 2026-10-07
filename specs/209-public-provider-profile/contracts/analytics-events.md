# Contrato: eventos de analítica del perfil

**Requisito que cubre**: SC-008 — *cada acción de contacto queda medida por proveedor*.
**Dónde se implementa**: `lib/analytics/events.ts` (el catálogo **único** del sitio: "cualquier evento nuevo se agrega acá primero"), `components/analytics/analytics-events.tsx` (listener delegado) y, para la app, el módulo equivalente (`captureEvent`).

Regla del catálogo que se respeta: **nunca datos personales en los props**. El `slug` de un proveedor es un identificador de **negocio público** (está en una URL abierta), no un dato de la persona que visita.

---

## 1. Acciones medidas

| Acción del perfil | Evento | Props | Meta |
|---|---|---|---|
| **WhatsApp** | `whatsapp_clicked` *(ya existe)* | `placement`, `provider` | `Contact` (ver §4) |
| **Llamar** | `provider_action_clicked` | `action: "call"`, `provider`, `placement` | no |
| **Cómo llegar** | `provider_action_clicked` | `action: "directions"`, `provider`, `placement` | no |
| **Pedir propuesta** | `provider_action_clicked` | `action: "proposal"`, `provider`, `placement` | no |
| **Compartir** | `provider_action_clicked` | `action: "share"`, `provider`, `placement` | no |

`placement` (valores cerrados): `provider_header` · `provider_aside` (la tarjeta "Pedir propuesta" de la columna derecha) · `provider_contact` (el bloque "Contacto y redes").

## 2. Cambios al catálogo

```ts
// lib/analytics/events.ts
export const ANALYTICS_EVENTS = {
  /* …existentes… */
  /** Click en una acción del perfil de un proveedor (llamar, cómo llegar, propuesta, compartir). Sólo PostHog. */
  providerActionClicked: "provider_action_clicked",
} as const;

/** Acciones medibles del perfil. Cerrado a propósito: el listener descarta cualquier otro valor. */
export const PROVIDER_ACTIONS = {
  call: "call",
  directions: "directions",
  proposal: "proposal",
  share: "share",
} as const;
export type ProviderAction = (typeof PROVIDER_ACTIONS)[keyof typeof PROVIDER_ACTIONS];

export type AnalyticsEventProps = {
  whatsapp_clicked: {
    placement?: string; lead_source?: LeadSource; pedido?: true;
    /** Slug del proveedor cuando el click es de un perfil. */
    provider?: string;                                   // ← NUEVO, opcional
  };
  provider_action_clicked: {                             // ← NUEVO
    action: ProviderAction;
    provider: string;
    placement?: string;
  };
  /* …existentes… */
};

export const ANALYTICS_CATALOG = {
  /* …existentes… */
  provider_action_clicked: {
    posthog: "client",
    meta: () => null,      // no se manda a Meta: son clicks de contacto con terceros, no conversiones de la campaña
    clickable: true,       // call / directions / proposal salen de links en Server Components
  },
};
```

`share` es una isla cliente (usa `navigator.share`), así que dispara `track()` directo en vez de usar un atributo.

## 3. Cambios al listener delegado

`AnalyticsEvents` ya traduce atributos `data-analytics-*` en props con **listas cerradas**. Se suman dos, con la misma filosofía ("lo que no está en la lista se descarta para que un typo no abra una fuente nueva"):

| Atributo | Prop | Validación |
|---|---|---|
| `data-analytics-provider` | `provider` | `^[a-z0-9]+(?:-[a-z0-9]+)*$`, máx. 120; si no cumple, **se omite el prop** (el evento sale igual) |
| `data-analytics-action` | `action` | debe estar en `PROVIDER_ACTIONS`; si no, se omite |

### Uso en un Server Component

```tsx
<a
  href={`tel:${profile.contact.phoneE164}`}
  data-analytics-event="provider_action_clicked"
  data-analytics-action="call"
  data-analytics-provider={profile.slug}
  data-analytics-placement="provider_header"
>
  Llamar
</a>
```

El WhatsApp usa `data-analytics-event="whatsapp_clicked"` + `data-analytics-provider` + `data-analytics-placement`, como los CTA de `/pedido`.

## 4. Punto a confirmar con marketing

Hoy `whatsapp_clicked` **sin** `lead_source` se mapea al evento estándar **`Contact`** de Meta (`META_EVENTS.contact`, params `placement` y `pedido`). Un click de WhatsApp en el perfil de un taller mandaría ese `Contact` al Pixel.
Es coherente semánticamente, pero **no lo decidimos nosotros**: la campaña optimiza sobre `Lead`, y más `Contact` podría diluir audiencias. Opciones: (a) dejarlo así; (b) para el perfil, mapear a `null` para que solo viaje a PostHog. Recomendación: **(b)** hasta que marketing diga lo contrario, porque es reversible y evita contaminar la campaña. Se implementa en una línea: la función `meta` de `whatsapp_clicked` devuelve `null` cuando el evento trae `provider`. *(Research D12 lo lista como decisión pendiente.)*

## 5. En la app móvil

El módulo de analítica de la app (`modules/shared/infrastructure/analytics/analyticsEvents`, `captureEvent`) debe mandar **los mismos nombres de evento y props** (`provider_action_clicked`, `action`, `provider`, `placement`), de modo que un mismo insight de PostHog pueda desglosar por `app` (`landing` / app) y por proveedor. El `placement` en la app usa el mismo vocabulario cerrado.

## 6. Verificación

- Prueba unitaria del **parseo de atributos**: `provider` inválido se omite; `action` fuera de la lista se omite; el evento sale igual en ambos casos.
- Prueba manual (en el quickstart): con `NEXT_PUBLIC_POSTHOG_*` apuntando a un proyecto de prueba, cada uno de los 5 botones genera exactamente **un** evento con `provider` y `placement` correctos, y **ninguno** genera un evento de Meta salvo, eventualmente, el WhatsApp (§4).
