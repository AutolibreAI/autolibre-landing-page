"use client";

import { useState, useEffect, useRef } from "react";
import { X, Users, Star, CheckCircle2 } from "lucide-react";
import BrandButton from "@/components/landing/brand-button";

type SubmitState = "idle" | "loading" | "success" | "error";

const BRANDS = [
  "VW",
  "Ford",
  "Peugeot",
  "Toyota",
  "Chevrolet",
  "Renault",
  "Honda",
  "Todas las marcas",
];

const SERVICES = [
  "Service y mantenimiento",
  "Frenos",
  "Suspensión",
  "Electricidad",
  "Chapa y pintura",
  "Diagnóstico OBD",
  "Neumáticos",
  "Inspecciones pre-compra",
  "Lavadero",
  "Detailing",
  "Baterías",
  "Tren delantero",
  "Otro",
];

const VEHICLE_TYPES = ["Autos", "SUVs", "Pickups", "Motos"];

const FUEL_TYPES = ["Nafta", "Diesel", "Híbridos", "Eléctricos"];

const HOW_FOUND = [
  "Google",
  "WhatsApp",
  "Un cliente nos contactó",
  "Redes sociales",
  "Amigo / conocido",
  "Otro",
];

type ProviderModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ProviderModal({ open, onClose }: ProviderModalProps) {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [brands, setBrands] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [otherService, setOtherService] = useState("");
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLInputElement>(null);

  // Focus trap & close on Escape
  useEffect(() => {
    if (!open) return;
    firstFocusRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitState("loading");
    // Simulate async submit
    await new Promise((r) => setTimeout(r, 900));
    setSubmitState("success");
  }

  if (!open) return null;

  return (
    <div
      className="al-provider-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="provider-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="al-provider-panel" ref={panelRef}>
        {/* Close */}
        <button className="al-provider-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} aria-hidden />
        </button>

        {submitState === "success" ? (
          <div className="al-provider-success">
            <div className="al-form-success-icon">
              <CheckCircle2 size={40} aria-hidden />
            </div>
            <h3>¡Registro recibido!</h3>
            <p>Te contactaremos pronto para activar el perfil de tu taller en Auto Libre.</p>
            <button className="al-provider-done-btn" onClick={onClose}>
              Cerrar
            </button>
          </div>
        ) : (
          <div className="al-provider-inner">
            {/* ── Section 1: Pitch ── */}
            <div className="al-provider-pitch">
              <h2 id="provider-modal-title" className="al-provider-heading">
                Sumá tu taller a Auto Libre
              </h2>
              <p className="al-provider-desc">
                Miles de usuarios usan Auto Libre para gestionar sus vehículos y pedir presupuestos.
                Registrá tu taller y empezá a recibir solicitudes de clientes cerca tuyo.
              </p>
              <ul className="al-provider-benefits">
                <li>
                  <span className="al-provider-benefit-icon">
                    <Users size={14} aria-hidden />
                  </span>
                  Clientes verificados
                </li>
                <li>
                  <span className="al-provider-benefit-icon">
                    <Star size={14} aria-hidden />
                  </span>
                  Perfil personalizado
                </li>
              </ul>
            </div>

            {/* ── Section 2: Form ── */}
            <form className="al-signup-form al-provider-form" onSubmit={handleSubmit} noValidate>
              {/* Row: taller + whatsapp */}
              <div className="al-form-row">
                <div className="al-form-field">
                  <label htmlFor="prov-name">
                    Nombre del taller <span className="al-required">*</span>
                  </label>
                  <input
                    id="prov-name"
                    name="taller"
                    type="text"
                    placeholder="Ej: Taller García"
                    required
                    ref={firstFocusRef}
                  />
                </div>
                <div className="al-form-field">
                  <label htmlFor="prov-phone">
                    WhatsApp de contacto <span className="al-required">*</span>
                  </label>
                  <input
                    id="prov-phone"
                    name="whatsapp"
                    type="tel"
                    placeholder="+54 9 11 1234-5678"
                    required
                  />
                </div>
              </div>

              {/* Row: email + direccion */}
              <div className="al-form-row">
                <div className="al-form-field">
                  <label htmlFor="prov-email">
                    Email <span className="al-required">*</span>
                  </label>
                  <input
                    id="prov-email"
                    name="email"
                    type="email"
                    placeholder="taller@ejemplo.com"
                    required
                  />
                </div>
                <div className="al-form-field">
                  <label htmlFor="prov-address">
                    Dirección <span className="al-required">*</span>
                  </label>
                  <input
                    id="prov-address"
                    name="direccion"
                    type="text"
                    placeholder="Calle, número, ciudad"
                    required
                  />
                </div>
              </div>

              {/* Brands */}
              <div className="al-form-field">
                <label>
                  Marcas en las que se especializan <span className="al-required">*</span>
                </label>
                <div className="al-reason-group al-reason-group--cols">
                  {BRANDS.map((b) => (
                    <label key={b} className="al-reason-option">
                      <input
                        type="checkbox"
                        className="al-checkbox-input reasonOption"
                        checked={brands.includes(b)}
                        onChange={() => toggle(brands, setBrands, b)}
                      />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div className="al-form-field">
                <label>
                  Servicios que ofrecen <span className="al-required">*</span>
                </label>
                <div className="al-reason-group al-reason-group--cols">
                  {SERVICES.map((s) => (
                    <label key={s} className="al-reason-option">
                      <input
                        type="checkbox"
                        className="al-checkbox-input reasonOption"
                        checked={services.includes(s)}
                        onChange={() => toggle(services, setServices, s)}
                      />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
                {services.includes("Otro") && (
                  <input
                    type="text"
                    className="al-form-field-nested"
                    placeholder="Describí el servicio..."
                    value={otherService}
                    onChange={(e) => setOtherService(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* Vehicle types */}
              <div className="al-form-field">
                <label>
                  Tipos de vehículo que atienden <span className="al-required">*</span>
                </label>
                <div className="al-reason-group">
                  {VEHICLE_TYPES.map((v) => (
                    <label key={v} className="al-reason-option">
                      <input
                        type="checkbox"
                        className="al-checkbox-input reasonOption"
                        checked={vehicleTypes.includes(v)}
                        onChange={() => toggle(vehicleTypes, setVehicleTypes, v)}
                      />
                      <span>{v}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fuel / motorization types */}
              <div className="al-form-field">
                <label>
                  Motorizaciones que atienden <span className="al-required">*</span>
                </label>
                <div className="al-reason-group al-reason-group--cols">
                  {FUEL_TYPES.map((f) => (
                    <label key={f} className="al-reason-option">
                      <input
                        type="checkbox"
                        className="al-checkbox-input reasonOption"
                        checked={fuelTypes.includes(f)}
                        onChange={() => toggle(fuelTypes, setFuelTypes, f)}
                      />
                      <span>{f}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* How found */}
              <div className="al-form-field">
                <label htmlFor="prov-how">
                  ¿Cómo se enteraron de Auto Libre? <span className="al-required">*</span>
                </label>
                <select id="prov-how" name="how_found" defaultValue="" required>
                  <option value="" disabled>Seleccioná una opción</option>
                  {HOW_FOUND.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {submitState === "error" && (
                <p role="alert" className="al-form-error-text">
                  Algo salió mal. Por favor intentá de nuevo.
                </p>
              )}

              <BrandButton
                type="submit"
                showArrow={false}
                disabled={submitState === "loading"}
                className="w-full justify-center"
              >
                {submitState === "loading" ? "Enviando..." : "Quiero registrar mi taller"}
              </BrandButton>

              <p className="al-form-microcopy">
                Te contactaremos para activar tu perfil.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
