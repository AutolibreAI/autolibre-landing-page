import { PEDIDO_IDS } from "./shared";

type OpenFormButtonProps = {
  readonly children: React.ReactNode;
  readonly className?: string;
};

/**
 * "Quiero que me contacten" / "o dejanos tus datos". Server component: el
 * click lo atiende `PedidoForm` con un listener delegado sobre
 * `data-pedido-open-form` (en mobile abre la vista del form; en desktop lleva
 * a la tarjeta). Es un `<button>` porque es una acción, no una navegación.
 */
export function OpenFormButton({ children, className }: OpenFormButtonProps) {
  return (
    <button
      type="button"
      data-pedido-open-form=""
      aria-controls={PEDIDO_IDS.form}
      className={className}
    >
      {children}
    </button>
  );
}
