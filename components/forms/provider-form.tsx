"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChoicePill, ChoiceRow } from "@/components/ui/choice";
import {
  Field,
  FieldGroup,
  Input,
  Select,
} from "@/components/ui/form-controls";
import { FormError, FormSuccess } from "@/components/ui/form-feedback";
import { ButtonLink } from "@/components/ui/button";
import {
  OTHER_OPTION,
  PROVIDER_BRANDS,
  PROVIDER_FUEL_TYPES,
  PROVIDER_HOW_FOUND,
  PROVIDER_SERVICES,
  PROVIDER_VEHICLE_TYPES,
  providersContent,
} from "@/lib/content/providers";

type SubmitState = "idle" | "loading" | "success" | "error";

const GENERIC_ERROR = "Algo salió mal. Por favor intentá de nuevo.";

/**
 * Alta de proveedores.
 *
 * Contrato con la API (no cambiar sin migrar `/api/provider` y la Google
 * Sheet): POST { taller, whatsapp, email, direccion, brand_specialized,
 * brands[], services[], service_other, vehicle_types[], fuel_types[],
 * how_found, how_found_other }.
 */
export function ProviderForm() {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [brandSpecialized, setBrandSpecialized] = useState<"yes" | "no" | null>(
    null,
  );
  const [brands, setBrands] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [otherService, setOtherService] = useState("");
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [howFound, setHowFound] = useState("");
  const [otherHowFound, setOtherHowFound] = useState("");

  function toggle(
    list: string[],
    setList: (value: string[]) => void,
    value: string,
  ) {
    setList(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("loading");

    const form = event.currentTarget;
    const taller = (form.elements.namedItem("taller") as HTMLInputElement).value;
    const whatsapp = (form.elements.namedItem("whatsapp") as HTMLInputElement)
      .value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const direccion = (form.elements.namedItem("direccion") as HTMLInputElement)
      .value;

    try {
      const response = await fetch("/api/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taller,
          whatsapp,
          email,
          direccion,
          brand_specialized: brandSpecialized,
          brands,
          services,
          service_other: otherService || null,
          vehicle_types: vehicleTypes,
          fuel_types: fuelTypes,
          how_found: howFound,
          how_found_other: otherHowFound || null,
        }),
      });

      if (!response.ok) throw new Error();
      setSubmitState("success");
    } catch {
      setSubmitState("error");
    }
  }

  if (submitState === "success") {
    return (
      <Card variant="solid" className="p-8">
        <FormSuccess
          title="¡Registro recibido!"
          description="Te contactaremos pronto para activar el perfil de tu taller en AutoLibre."
        >
          <ButtonLink href="/" variant="outline" size="sm" className="mt-2">
            Volver al inicio
          </ButtonLink>
        </FormSuccess>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card variant="solid" className="p-6 md:p-8">
        <div className="flex flex-col gap-6">
          <Field label="Nombre del taller" htmlFor="prov-name" required>
            <Input
              id="prov-name"
              name="taller"
              type="text"
              placeholder="Ej: Taller Belgrano"
              autoComplete="organization"
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp de contacto" htmlFor="prov-phone" required>
              <Input
                id="prov-phone"
                name="whatsapp"
                type="tel"
                placeholder="11 2345 6789"
                autoComplete="tel"
                required
              />
            </Field>
            <Field label="Email" htmlFor="prov-email" required>
              <Input
                id="prov-email"
                name="email"
                type="email"
                placeholder="tuemail@negocio.com"
                autoComplete="email"
                required
              />
            </Field>
          </div>

          <Field label="Dirección" htmlFor="prov-address" required>
            <Input
              id="prov-address"
              name="direccion"
              type="text"
              placeholder="Calle y número"
              autoComplete="street-address"
              required
            />
          </Field>

          <FieldGroup title="Trabajan con marcas específicas?">
            <div className="flex flex-col gap-2">
              <ChoiceRow
                type="radio"
                name="brand_specialized"
                label="No, trabajamos todas las marcas"
                checked={brandSpecialized === "no"}
                onChange={() => {
                  setBrandSpecialized("no");
                  setBrands([]);
                }}
              />
              <ChoiceRow
                type="radio"
                name="brand_specialized"
                label="Sí, me especializo en marcas específicas"
                checked={brandSpecialized === "yes"}
                onChange={() => setBrandSpecialized("yes")}
              />
            </div>

            {brandSpecialized === "yes" ? (
              <div className="mt-3 flex flex-col gap-2">
                <label htmlFor="prov-brand-picker" className="sr-only">
                  Agregar una marca
                </label>
                <Select
                  id="prov-brand-picker"
                  value=""
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value && !brands.includes(value)) {
                      setBrands([...brands, value]);
                    }
                  }}
                >
                  <option value="" disabled>
                    Seleccioná una marca para agregar
                  </option>
                  {PROVIDER_BRANDS.filter(
                    (brand) => !brands.includes(brand),
                  ).map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </Select>

                {brands.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {brands.map((brand) => (
                      <li
                        key={brand}
                        className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/8 py-1 pr-1.5 pl-3 text-sm font-semibold text-ink"
                      >
                        {brand}
                        <button
                          type="button"
                          aria-label={`Quitar ${brand}`}
                          onClick={() =>
                            setBrands(brands.filter((item) => item !== brand))
                          }
                          className="flex size-4 items-center justify-center rounded-full bg-ink/10 text-ink/60 transition-colors hover:bg-alert-bg hover:text-alert-fg"
                        >
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            aria-hidden="true"
                          >
                            <line x1="2" y1="2" x2="10" y2="10" />
                            <line x1="10" y1="2" x2="2" y2="10" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-ink/55 italic">
                    Agregá al menos una marca para continuar.
                  </p>
                )}
              </div>
            ) : null}

            {brandSpecialized === "no" ? (
              <p className="mt-2 text-[0.8125rem] font-semibold text-brand">
                Se registrará que el taller trabaja con todas las marcas.
              </p>
            ) : null}
          </FieldGroup>

          <FieldGroup title="Servicios que ofrecen">
            <div className="flex flex-wrap gap-2">
              {PROVIDER_SERVICES.map((service) => (
                <ChoicePill
                  key={service}
                  type="checkbox"
                  label={service}
                  checked={services.includes(service)}
                  onChange={() => toggle(services, setServices, service)}
                />
              ))}
            </div>
            {services.includes(OTHER_OPTION) ? (
              <>
                <label htmlFor="prov-service-other" className="sr-only">
                  Contanos qué otro servicio ofrecés
                </label>
                <Input
                  id="prov-service-other"
                  className="mt-2.5"
                  type="text"
                  placeholder="Contanos qué otro servicio ofrecés"
                  value={otherService}
                  onChange={(event) => setOtherService(event.target.value)}
                  required
                />
              </>
            ) : null}
          </FieldGroup>

          <FieldGroup title="Tipos de vehículo que atienden">
            <div className="flex flex-wrap gap-2">
              {PROVIDER_VEHICLE_TYPES.map((type) => (
                <ChoicePill
                  key={type}
                  type="checkbox"
                  label={type}
                  checked={vehicleTypes.includes(type)}
                  onChange={() => toggle(vehicleTypes, setVehicleTypes, type)}
                />
              ))}
            </div>
          </FieldGroup>

          <FieldGroup title="Motorizaciones que atienden">
            <div className="flex flex-wrap gap-2">
              {PROVIDER_FUEL_TYPES.map((fuel) => (
                <ChoicePill
                  key={fuel}
                  type="checkbox"
                  label={fuel}
                  checked={fuelTypes.includes(fuel)}
                  onChange={() => toggle(fuelTypes, setFuelTypes, fuel)}
                />
              ))}
            </div>
          </FieldGroup>

          <div className="border-t border-line pt-5">
            <Field
              label="¿Cómo se enteraron de AutoLibre?"
              htmlFor="prov-how"
              required
            >
              <Select
                id="prov-how"
                name="how_found"
                value={howFound}
                onChange={(event) => {
                  setHowFound(event.target.value);
                  if (event.target.value !== OTHER_OPTION) setOtherHowFound("");
                }}
                required
              >
                <option value="" disabled>
                  Elegí una opción
                </option>
                {PROVIDER_HOW_FOUND.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
            {howFound === OTHER_OPTION ? (
              <>
                <label htmlFor="prov-how-other" className="sr-only">
                  Contanos cómo te enteraste
                </label>
                <Input
                  id="prov-how-other"
                  className="mt-2.5"
                  type="text"
                  placeholder="Contanos cómo te enteraste..."
                  value={otherHowFound}
                  onChange={(event) => setOtherHowFound(event.target.value)}
                  required
                />
              </>
            ) : null}
          </div>

          {submitState === "error" ? <FormError message={GENERIC_ERROR} /> : null}
        </div>
      </Card>

      <Button
        type="submit"
        size="lg"
        block
        className="mt-7"
        disabled={submitState === "loading"}
      >
        {submitState === "loading"
          ? providersContent.form.submitLoadingLabel
          : providersContent.form.submitLabel}
      </Button>

      <p className="mt-3.5 text-center text-[0.8125rem] text-ink/55">
        {providersContent.form.note}
      </p>
    </form>
  );
}
