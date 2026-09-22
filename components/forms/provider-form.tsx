"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ServiceFamilyPicker } from "@/components/forms/service-family-picker";
import { ChoicePill, ChoiceRow } from "@/components/ui/choice";
import {
  Field,
  FieldGroup,
  Input,
  Select,
} from "@/components/ui/form-controls";
import { FormError, FormSuccess } from "@/components/ui/form-feedback";
import { ButtonLink } from "@/components/ui/button";
import type { ServiceFamilyOption } from "@/lib/autolibre-api";
import {
  EMPTY_GEO,
  findAddressComponent,
  GOOGLE_MAPS_API_KEY,
  type PlaceGeo,
} from "@/lib/google-places";
import {
  OTHER_OPTION,
  PROVIDER_BRANDS,
  PROVIDER_FUEL_TYPES,
  PROVIDER_HOW_FOUND,
  PROVIDER_MODALITY_OPTIONS,
  PROVIDER_VEHICLE_TYPES,
  providersContent,
} from "@/lib/content/providers";
// Estilos del dropdown de Google Places. Compartido con components/quote-flow
// (ver lib/google-places.ts) — es CSS global porque Google cuelga el listbox
// de <body>, fuera del árbol de React, así que importarlo dos veces no
// duplica nada, solo asegura que esté cargado en esta página también.
import "@/components/quote-flow/places-autocomplete.css";

type PartnerModality = (typeof PROVIDER_MODALITY_OPTIONS)[number]["value"];

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
 * Las opciones ahora vienen del backend (`serviceFamilies`, resueltas en el
 * servidor por la pagina) y lo que viaja es el `slug`. El `name` se muestra y
 * nada mas. El unico texto libre que queda es `service_other`, que es
 * justamente lo que el catalogo todavia no cubre.
 *
 * ── Se marcan RUBROS, agrupados por familia ─────────────────────────────────
 *
 * El endpoint devuelve las 16 familias con sus 79 rubros adentro, y este
 * formulario usa los DOS niveles: la familia agrupa en pantalla, el rubro es
 * lo que se marca y lo que viaja en `services[]`.
 *
 * Durante un tiempo se mandaron familias, con el argumento de que 79 casillas
 * son fricción que se paga en abandonos. El diagnostico era correcto; la
 * conclusion no. Lo que asusta no son los 79 rubros, es tenerlos los 79
 * DESPLEGADOS — y eso lo arregla la pantalla, no el recorte del dato. Con el
 * acordeon (`ServiceFamilyPicker`) el taller sigue viendo 16 filas, igual que
 * antes, y abre las dos o tres que le tocan.
 *
 * Ademas la taxonomia del equipo siempre dijo esto: en la planilla del
 * catalogo, la leyenda del rubro es literalmente "Formulario de pagina web".
 * Mandar familias era la excepcion, no la regla.
 *
 * Lo que se gana es que el taller queda clasificado FINO desde el alta, sin
 * depender de que alguien traduzca a mano al aprobar — que es exactamente el
 * paso que en el legacy nunca se ejecutaba y dejaba talleres aprobados pero
 * invisibles en la app. Y `partner_services` ya apuntaba a rubros, asi que el
 * dato declarado ahora habla el mismo idioma que el dato publicado.
 *
 * Lo que tambien cambio en su momento: ahora hay errores que la persona puede
 * corregir, y por eso el cartel dejo de ser uno solo y generico — el backend
 * valida el WhatsApp de verdad (un numero con el 15 adelante se rechaza en vez
 * de guardarse roto) y avisa cuando ese email ya tiene una solicitud abierta.
 */
export function ProviderForm({
  serviceFamilies,
}: {
  readonly serviceFamilies: readonly ServiceFamilyOption[];
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
  /**
   * Slugs de RUBRO del catalogo (`frenos`, `gomeria`, `patentamiento`).
   * Nunca labels, nunca familias, nunca el "Otro" — ese ultimo va aparte.
   *
   * La familia no se guarda: se deriva de los rubros marcados. Ver
   * `ServiceFamilyPicker`.
   */
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
  /**
   * Se prende en el primer intento de envio. Antes de eso el formulario no
   * reta a nadie: marcar en rojo un campo que la persona todavia no llego a
   * completar es hostil y no informa nada.
   */
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [howFound, setHowFound] = useState("");
  const [otherHowFound, setOtherHowFound] = useState("");
  /**
   * Geocode de la dirección, capturado al elegir una sugerencia de Google
   * Places. Se resetea a `EMPTY_GEO` si la persona edita el texto después de
   * elegir una sugerencia (ver el `onChange` del input de dirección) — nunca
   * viaja un geocode que ya no corresponde a lo que se ve en el campo.
   */
  const [geo, setGeo] = useState<PlaceGeo>(EMPTY_GEO);
  const [mapsReady, setMapsReady] = useState(false);
  const [modality, setModality] = useState<PartnerModality | "">("");

  const servicesErrorRef = useRef<HTMLParagraphElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // El Autocomplete pide direcciones puntuales ("address"), no zonas: acá
  // importa la puerta del local, porque de eso depende que el orden por
  // cercanía en los pedidos de presupuesto sirva (ver AUT-81). Compárese con
  // components/quote-flow/use-quote-flow.ts, que usa "(regions)" a propósito.
  useEffect(() => {
    if (!mapsReady) return;
    const input = addressInputRef.current;
    if (!input || !window.google?.maps?.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: "ar" },
      types: ["address"],
      fields: ["formatted_address", "name", "geometry", "address_components"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const latitude = place.geometry?.location?.lat() ?? null;
      const longitude = place.geometry?.location?.lng() ?? null;
      const locality =
        findAddressComponent(place.address_components, "locality") ??
        findAddressComponent(place.address_components, "sublocality");
      const province = findAddressComponent(
        place.address_components,
        "administrative_area_level_1",
      );

      // Todo o nada: sin localidad o provincia no guardamos coordenadas
      // sueltas (ver specs/004-partner-approval-data/contracts).
      if (latitude === null || longitude === null || !locality || !province) {
        setGeo(EMPTY_GEO);
        return;
      }
      setGeo({ latitude, longitude, locality, province });
    });

    return () => {
      listener.remove();
      document.querySelectorAll(".pac-container").forEach((el) => el.remove());
    };
  }, [mapsReady]);

  /**
   * Un taller sin nada declarado no se puede publicar ni recomendar: no entra
   * en ninguna busqueda y no le sirve a nadie, ni a el. El backend igual lo
   * acepta —y hace bien, porque el equipo puede completarlo despues por
   * WhatsApp—, asi que la exigencia vive acá, que es donde sale barata:
   * preguntarlo ahora, con la persona mirando el formulario, cuesta un tilde;
   * perseguirlo despues cuesta una conversacion.
   *
   * "Otro" con texto cuenta como declarar: si el taller hace algo que el
   * catalogo no cubre, la respuesta correcta es dejarlo pasar, no trabarlo.
   */
  const hasDeclaredServices =
    services.length > 0 || otherService.trim() !== "";
  /**
   * Derivado, no un `useState` que haya que limpiar a mano en cada uno de los
   * tres lugares donde se puede declarar un servicio. Apenas la persona marca
   * algo, el error desaparece solo.
   */
  const missingServices = submitAttempted && !hasDeclaredServices;

  /**
   * El bloque de servicios queda arriba del boton, asi que sin esto el submit
   * no hace nada visible: la persona aprieta, no pasa nada y concluye que el
   * formulario esta roto.
   */
  useEffect(() => {
    if (missingServices) {
      servicesErrorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [missingServices]);

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
    setSubmitAttempted(true);

    // Ojo: el <form> va con `noValidate`, asi que los `required` de los inputs
    // son semantica para lectores de pantalla y no cortan nada. Lo unico que
    // frena el envio es este return.
    if (!hasDeclaredServices) return;

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
    const hours = (
      form.elements.namedItem("hours") as HTMLInputElement
    ).value.trim();

    // Los cuatro campos de geocode viajan juntos o ninguno — `geo` ya
    // garantiza eso (ver el efecto de arriba), así que alcanza con chequear
    // uno para decidir si se manda el bloque completo.
    const hasGeo = geo.latitude !== null && geo.longitude !== null;

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
          ...(hasGeo
            ? {
                latitude: geo.latitude,
                longitude: geo.longitude,
                locality: geo.locality,
                province: geo.province,
              }
            : {}),
          hours: hours || null,
          modality: modality || null,
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
    <>
      {GOOGLE_MAPS_API_KEY ? (
        <Script
          id="google-maps-places"
          src={`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places&language=es&region=AR`}
          strategy="afterInteractive"
          onReady={() => setMapsReady(true)}
        />
      ) : null}

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

          <Field
            label="Dirección"
            htmlFor="prov-address"
            required
            hint={providersContent.form.addressHelper}
          >
            <Input
              id="prov-address"
              name="direccion"
              type="text"
              placeholder="Calle y número"
              autoComplete="street-address"
              ref={addressInputRef}
              onChange={() => setGeo(EMPTY_GEO)}
              required
            />
          </Field>

          <Field label={providersContent.form.hoursLabel} htmlFor="prov-hours">
            <Input
              id="prov-hours"
              name="hours"
              type="text"
              placeholder={providersContent.form.hoursPlaceholder}
            />
          </Field>

          <FieldGroup title={providersContent.form.modalityTitle}>
            <div className="flex flex-col gap-2">
              {PROVIDER_MODALITY_OPTIONS.map((option) => (
                <ChoiceRow
                  key={option.value}
                  type="radio"
                  name="modality"
                  label={option.label}
                  checked={modality === option.value}
                  onChange={() => setModality(option.value)}
                />
              ))}
            </div>
          </FieldGroup>

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
                  <p className="text-xs text-ink/65 italic">
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
            {serviceFamilies.length > 0 ? (
              <>
                <p className="mb-3 text-xs text-ink/65">
                  Abrí las categorías que te tocan y marcá los rubros que
                  hacés. Si hacés todo lo de una, tildá la categoría entera.
                </p>

                <ServiceFamilyPicker
                  families={serviceFamilies}
                  selected={services}
                  onChange={setServices}
                />

                {/* "Otro" va DEBAJO del acordeon y suelto, no como una fila
                    mas de la lista: puesto adentro se lee como una categoria
                    del catalogo, y es justamente lo contrario — es el unico
                    valor de esta seccion que no sale del catalogo, y el unico
                    que viaja como texto libre (`service_other`). */}
                <div className="mt-2.5">
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

            {missingServices ? (
              <p
                ref={servicesErrorRef}
                role="alert"
                className="mt-2.5 text-sm font-medium text-danger"
              >
                {serviceFamilies.length > 0
                  ? 'Abrí una categoría y marcá al menos un rubro, o tildá "Otro" y contanos qué hacés.'
                  : "Contanos qué servicios ofrecés para que podamos activarte el perfil."}
              </p>
            ) : null}

            {wantsOtherService || serviceFamilies.length === 0 ? (
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

      <p className="mt-3.5 text-center text-[0.8125rem] text-ink/65">
        {providersContent.form.note}
      </p>
      </form>
    </>
  );
}
