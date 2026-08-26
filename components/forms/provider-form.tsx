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
import type { ServiceCatalogCategory } from "@/lib/autolibre-api";
import {
  OTHER_OPTION,
  PROVIDER_BRANDS,
  PROVIDER_FUEL_TYPES,
  PROVIDER_HOW_FOUND,
  PROVIDER_VEHICLE_TYPES,
  providersContent,
} from "@/lib/content/providers";

type SubmitState = "idle" | "loading" | "success" | "error";

const GENERIC_ERROR = "Algo salió mal. Por favor intentá de nuevo.";

/**
 * Alta de proveedores.
 *
 * Contrato con la API (no cambiar sin migrar `/api/provider`): POST { taller,
 * whatsapp, email, direccion, brand_specialized, brands[], services[],
 * service_other, vehicle_types[], fuel_types[], how_found, how_found_other }.
 *
 * El destino de esos datos ya NO es la Google Sheet: `/api/provider` los manda
 * al backend, que los guarda en `partner_applications`.
 *
 * ── `services[]` ahora son slugs del catalogo, no labels ────────────────────
 *
 * Antes este formulario tenia sus propios 17 nombres de servicio hardcodeados,
 * que no coincidian con las 16 familias y 79 rubros del catalogo del backend.
 * O sea: un tercer vocabulario, que obligaba a traducir a mano en SQL cada vez
 * que se aprobaba un taller — y cuando la traduccion no se hacia, el taller
 * quedaba aprobado pero sin categorias, invisible en la app.
 *
 * Las opciones ahora vienen del backend (`serviceCategories`, resueltas en el
 * servidor por la pagina) y lo que viaja es el `slug`. El `name` se muestra y
 * nada mas. El unico texto libre que queda es `service_other`, que es
 * justamente lo que el catalogo todavia no cubre.
 *
 * Lo que tambien cambio en su momento: ahora hay errores que la persona puede
 * corregir, y por eso el cartel dejo de ser uno solo y generico — el backend
 * valida el WhatsApp de verdad (un numero con el 15 adelante se rechaza en vez
 * de guardarse roto) y avisa cuando ese email ya tiene una solicitud abierta.
 */
export function ProviderForm({
  serviceCategories,
}: {
  readonly serviceCategories: readonly ServiceCatalogCategory[];
}) {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState(GENERIC_ERROR);
  /**
   * "Ya te teniamos anotado" es un exito, no un error: la solicitud existe y
   * alguien la va a mirar. Mostrarlo en rojo haria que la persona reintente o
   * piense que el sitio no anda.
   */
  const [alreadyRegistered, setAlreadyRegistered] = useState<string | null>(
    null,
  );
  const [brandSpecialized, setBrandSpecialized] = useState<"yes" | "no" | null>(
    null,
  );
  const [brands, setBrands] = useState<string[]>([]);
  /** Slugs del catalogo. Nunca labels, nunca el "Otro" — ese va aparte. */
  const [services, setServices] = useState<string[]>([]);
  /**
   * "Otro" salio del array de servicios a proposito. Cuando estaba adentro, el
   * literal "Otro" viajaba mezclado con los servicios reales y no habia forma
   * de distinguir un rubro de un placeholder sin comparar strings del otro
   * lado. Ahora `services` solo tiene slugs validos y el texto libre viaja en
   * su propio campo (`service_other`).
   */
  const [wantsOtherService, setWantsOtherService] = useState(false);
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
    setErrorMessage(GENERIC_ERROR);
    setAlreadyRegistered(null);

    const form = event.currentTarget;
    const taller = (form.elements.namedItem("taller") as HTMLInputElement)
      .value;
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

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        alreadyRegistered?: boolean;
      };

      if (!response.ok) {
        // El mensaje lo arma la ruta, que es la que conoce los codigos del
        // backend. Acá solo se muestra — si algun dia falta, queda el generico.
        setErrorMessage(payload.error ?? GENERIC_ERROR);
        setSubmitState("error");
        return;
      }

      if (payload.alreadyRegistered && payload.message) {
        setAlreadyRegistered(payload.message);
      }
      setSubmitState("success");
    } catch {
      setErrorMessage(GENERIC_ERROR);
      setSubmitState("error");
    }
  }

  if (submitState === "success") {
    return (
      <Card variant="solid" className="p-8">
        <FormSuccess
          title={
            alreadyRegistered ? "Ya te teniamos anotado" : "¡Registro recibido!"
          }
          description={
            alreadyRegistered ??
            "Te contactaremos pronto para activar el perfil de tu taller en AutoLibre."
          }
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
            {serviceCategories.length > 0 ? (
              <>
                <p className="mb-3 text-xs text-ink/55">
                  Marcá todos los rubros que trabajás. Están agrupados por
                  familia — tocá una para abrirla.
                </p>

                <div className="overflow-hidden rounded-field border border-line">
                  {serviceCategories.map((category, index) => (
                    <ServiceCategoryAccordion
                      key={category.slug}
                      category={category}
                      selected={services}
                      // La primera abierta: si estuvieran todas cerradas, el
                      // bloque se ve como una lista de titulos y no queda claro
                      // que adentro hay algo para marcar.
                      defaultOpen={index === 0}
                      onToggleService={(slug) =>
                        toggle(services, setServices, slug)
                      }
                    />
                  ))}
                </div>

                <p
                  className="mt-2 text-xs text-ink/55"
                  aria-live="polite"
                  role="status"
                >
                  {services.length === 0
                    ? "Todavía no marcaste ningún rubro."
                    : `${services.length} ${
                        services.length === 1
                          ? "rubro seleccionado"
                          : "rubros seleccionados"
                      }.`}
                </p>

                <div className="mt-3">
                  <ChoicePill
                    type="checkbox"
                    label={`${OTHER_OPTION}: hacemos algo que no está en la lista`}
                    checked={wantsOtherService}
                    onChange={() => {
                      const next = !wantsOtherService;
                      setWantsOtherService(next);
                      if (!next) setOtherService("");
                    }}
                  />
                </div>
              </>
            ) : (
              /**
               * El catalogo no cargo. No se puede inventar una lista de rubros
               * —los slugs los define el backend y mandar labels sueltos es
               * exactamente el problema que este cambio vino a matar—, asi que
               * el formulario avisa y abre el texto libre.
               *
               * Por que degradar y no bloquear el envio: del otro lado hay un
               * taller que se estaba anotando. Perderlo porque un endpoint
               * secundario no contesto es peor que recibirlo con los rubros sin
               * normalizar, que es un trabajo de un minuto en la aprobacion.
               * Lo que no se hace es callarse: sin este cartel, la persona ve
               * un formulario al que le falta una seccion entera y no tiene
               * forma de saber que eso no es lo normal.
               */
              <div
                role="alert"
                className="rounded-field border border-line bg-surface-subtle p-3.5"
              >
                <p className="text-sm font-semibold text-ink">
                  No pudimos cargar el listado de servicios.
                </p>
                <p className="mt-1 text-[0.8125rem] text-ink/65">
                  Es un problema nuestro, no tuyo, y no te frena: escribinos acá
                  abajo qué servicios ofrecés y los cargamos nosotros al
                  activarte el perfil.
                </p>
              </div>
            )}

            {wantsOtherService || serviceCategories.length === 0 ? (
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

          {submitState === "error" ? (
            <FormError message={errorMessage} />
          ) : null}
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

/**
 * Una familia del catalogo, plegable.
 *
 * Son 79 rubros: puestos como una lista plana de pildoras, la seccion de
 * servicios sola mide mas que el resto del formulario junto y nadie la lee
 * entera. Agrupados por familia (ninguna pasa de 10) el bloque cerrado ocupa
 * 16 renglones y quien busca "Frenos" sabe donde mirar.
 *
 * Va con `<details>` nativo y no con estado propio: el plegado es del navegador
 * —incluido el teclado, el foco y el Ctrl+F que expande la seccion al buscar
 * dentro— y este componente no tiene que mantener nada de eso a mano.
 */
function ServiceCategoryAccordion({
  category,
  selected,
  defaultOpen,
  onToggleService,
}: {
  readonly category: ServiceCatalogCategory;
  readonly selected: readonly string[];
  readonly defaultOpen: boolean;
  readonly onToggleService: (slug: string) => void;
}) {
  const selectedCount = category.services.filter((service) =>
    selected.includes(service.slug),
  ).length;

  return (
    <details className="group border-b border-line last:border-b-0" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-surface-subtle px-3.5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-brand/5 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
        <span>{category.name}</span>
        <span className="flex shrink-0 items-center gap-2">
          {/* El contador es lo que hace que el plegado no esconda informacion:
              sin el, una familia cerrada con tres rubros marcados se ve igual
              que una vacia. */}
          {selectedCount > 0 ? (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
              {selectedCount}
            </span>
          ) : null}
          <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="text-ink/40 transition-transform group-open:rotate-180"
          >
            <path d="M1 1l4 4 4-4" />
          </svg>
        </span>
      </summary>

      <div className="flex flex-wrap gap-2 border-t border-line px-3.5 py-3">
        {category.services.map((service) => (
          <ChoicePill
            key={service.slug}
            type="checkbox"
            // Se muestra el nombre, se manda el slug.
            label={service.name}
            checked={selected.includes(service.slug)}
            onChange={() => onToggleService(service.slug)}
          />
        ))}
      </div>
    </details>
  );
}
