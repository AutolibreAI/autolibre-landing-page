"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import ProviderForm from "@/components/landing/provider-form";

/**
 * Drawer version of the provider registration, rendered by the intercepting
 * route (app/@modal/(.)proveedores). It closes by navigating back, which pops
 * the intercepted URL and returns to wherever the user came from.
 */
export default function ProviderModal() {
  const router = useRouter();

  // Close on Escape + lock body scroll while mounted
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") router.back();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [router]);

  const close = () => router.back();

  return (
    <div
      className="al-provider-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="provider-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="al-provider-panel">
        {/* Close */}
        <button className="al-provider-close" onClick={close} aria-label="Cerrar">
          <X size={18} aria-hidden />
        </button>

        <ProviderForm onSuccessClose={close} autoFocus />
      </div>
    </div>
  );
}
