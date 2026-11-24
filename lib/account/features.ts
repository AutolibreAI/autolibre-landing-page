/**
 * Partes de "Mi negocio" (`/cuenta`) que están diseñadas pero NO tienen
 * endpoint en el backend todavía (inventario del 2026-11-24, ver
 * `docs/rediseno-2026-11/informe-fase-6.md`). Van apagadas: la UI no
 * muestra nada simulado. Cuando el backend sume el endpoint, se conecta el
 * dato y se prende la bandera.
 *
 * Módulo puro: lo leen la isla de `/cuenta` y sus tests.
 */
export type AccountFeatures = {
  /**
   * Pedidos recibidos (`quote_request_proposals` + `partner_outreach` del
   * lado del negocio): pestaña Pedidos con su contador, la franja de cuatro
   * números, "Últimos pedidos" y el estado "sin pedidos" del Resumen.
   */
  readonly orders: boolean;
  /** Uso del mes (envíos por WhatsApp contra el tope del plan). */
  readonly usage: boolean;
  /** "Tu código para clientes" (`partner_referral_codes`) y cuántos te guardaron (`preferred_partners`). */
  readonly referralCode: boolean;
  /** Edición del perfil desde la web (no hay PATCH del dueño: los cambios se piden por WhatsApp). */
  readonly profileEditing: boolean;
  /** Estado "En revisión" de un alta todavía no aprobada (no hay lectura de la solicitud para el dueño). */
  readonly reviewStatus: boolean;
  /** "Ver mi página web": hace falta el `slug` del negocio en las membresías o en `GET /partners/{id}`. */
  readonly publicPageLink: boolean;
};

export const ACCOUNT_FEATURES: AccountFeatures = {
  orders: false,
  usage: false,
  referralCode: false,
  profileEditing: false,
  reviewStatus: false,
  publicPageLink: false,
};
