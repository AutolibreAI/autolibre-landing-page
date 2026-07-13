import ProviderModal from "@/components/landing/provider-modal";

// Intercepts /proveedores on client-side navigation from within the app and
// shows it as a drawer over the current page. A hard load / refresh of
// /proveedores skips this and renders the full page instead.
export default function ProveedoresModalPage() {
  return <ProviderModal />;
}
