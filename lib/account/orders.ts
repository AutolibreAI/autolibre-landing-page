/**
 * Pedidos recibidos por un negocio, como los dibuja "Mi negocio". HOY NO HAY
 * ENDPOINT del lado del negocio (`quote_request_proposals`,
 * `partner_outreach` y `quote_requests.selected_proposal_id` solo se leen
 * desde admin): la pestaña está apagada (`ACCOUNT_FEATURES.orders`). Este es
 * el modelo que la pantalla espera, para conectar el endpoint cuando exista.
 *
 * Módulo puro: lo prueban los tests de `scripts/partner-billing/`.
 */

/**
 * Estado del pedido para el negocio:
 * - `responder`: le llegó por WhatsApp y todavía no dijo si le interesa.
 * - `detalle`: dijo que le interesa; falta mandar la propuesta.
 * - `propuesta`: mandó la propuesta; el cliente todavía no eligió.
 * - `elegido`: el cliente eligió su propuesta.
 * - `cerrado`: venció, lo rechazó o el cliente eligió a otro.
 */
export const ORDER_STATUSES = ["responder", "detalle", "propuesta", "elegido", "cerrado"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type PartnerOrder = {
  readonly id: string;
  readonly number: number;
  readonly status: OrderStatus;
  /** Cuándo llegó, ya en texto ("Hace 40 min", "19 nov"). */
  readonly when: string;
  readonly service: string;
  readonly vehicle: string;
  readonly zone: string;
  /** Línea de contexto: el plazo, la propuesta, cómo terminó. */
  readonly note: string;
  /** Adónde lleva la acción (el WhatsApp del pedido o su detalle). */
  readonly actionHref: string;
};

export const ORDER_FILTERS = ["todos", "responder", "propuesta", "elegido", "cerrado"] as const;
export type OrderFilter = (typeof ORDER_FILTERS)[number];

/** "Por responder" junta los dos estados en los que el negocio tiene que hacer algo. */
export function matchesOrderFilter(order: Pick<PartnerOrder, "status">, filter: OrderFilter): boolean {
  if (filter === "todos") return true;
  if (filter === "responder") return order.status === "responder" || order.status === "detalle";
  return order.status === filter;
}

export function countOrdersByFilter(orders: readonly Pick<PartnerOrder, "status">[]): Record<OrderFilter, number> {
  const counts = { todos: 0, responder: 0, propuesta: 0, elegido: 0, cerrado: 0 } satisfies Record<OrderFilter, number>;
  for (const filter of ORDER_FILTERS) {
    counts[filter] = orders.filter((order) => matchesOrderFilter(order, filter)).length;
  }
  return counts;
}

/** Estados con acción principal (botón oscuro); el resto va en contorno. */
export function isActionableOrder(status: OrderStatus): boolean {
  return status === "responder" || status === "detalle" || status === "elegido";
}

/** Resumen de la franja de cuatro números. */
export type OrdersOverview = {
  readonly toAnswer: number;
  readonly dueToday: number;
  readonly proposals: number;
  readonly chosenLast30Days: number;
  readonly planOrdersUsed: number;
};
