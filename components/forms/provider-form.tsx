"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { ServiceFamilyPicker } from "@/components/forms/service-family-picker";
import { Input, Select, Textarea } from "@/components/ui/form-controls";
import { FormError } from "@/components/ui/form-feedback";
import { WhatsappInput } from "@/components/ui/whatsapp-input";
import {
  AltaChip,
  AltaField,
  altaGroupLabel,
  altaInput,
  altaSectionHint,
  altaSectionTitle,
  altaSelect,
  altaTextarea,
} from "@/components/proveedores/registro/alta-controls";
import { RegistrationStatus } from "@/components/proveedores/registro/registration-status";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { whatsappErrorMessage } from "@/lib/content/presupuesto";
import { parseArWhatsapp } from "@/lib/phone";
import { cn } from "@/lib/utils";
import type { ServiceFamilyOption } from "@/lib/autolibre-api";
import {
  submitWithOwnerToken,
  type OwnerGetToken,
} from "@/lib/proveedores/application-auth";
import {
  PROVIDER_LOGO_TYPES,
  PROVIDER_DESCRIPTION_MAX_LENGTH,
  PROVIDER_EMAIL_MAX_LENGTH,
  PROVIDER_SOCIAL_KEYS,
  PROVIDER_TEXT_MAX_LENGTH,
  findTooLongProviderText,
  isValidProviderEmail,
  normalizeProviderSocialLink,
  parseProviderProfileFields,
  type ProviderSocialKey,
  appendProviderBrand,
  PROVIDER_BRAND_MAX_LENGTH,
  PROVIDER_BRAND_MAX_COUNT,
  validBrandSelection,
  validProviderLogoSource,
} from "@/lib/proveedores/registration";
import { compressProviderLogo } from "@/lib/proveedores/logo-compression";
import {
  EMPTY_GEO,
  findAddressComponent,
  GOOGLE_MAPS_API_KEY,
  hidePlacesDropdownFromReplay,
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

/** Pasos del formulario: negocio (0), atención (1), contacto (2). */
export const PROVIDER_FORM_STEPS = 3;
const STEP = { business: 0, attention: 1, contact: 2 } as const;

const { form: copy, flow } = providersContent;

/**
 * Píldora con prefijo (el +54 del WhatsApp, el nombre de cada red): 48px,
 * borde en `action` al enfocar. El anillo de foco va en el contenedor
 * (`has-[:focus-visible]`) porque el `overflow-clip` recorta el del input.
 */
const socialPill =
  "flex h-12 overflow-clip rounded-full border bg-card transition-colors focus-within:border-action motion-reduce:transition-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand";

/** El `<input>` adentro de `socialPill` (sin borde ni fondo propios). */
const pillInnerInput =
  "h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 py-0 text-base text-fg placeholder:text-fg-subtle";

/** Botón "×" de una marca elegida (44px de área táctil). */
function RemoveBrandButton({ brand, onClick }: { readonly brand: string; readonly onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={copy.brands.remove(brand)}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-alert-bg hover:text-status-alert motion-reduce:transition-none"
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
        <line x1="2" y1="2" x2="10" y2="10" />
        <line x1="10" y1="2" x2="2" y2="10" />
      </svg>
    </button>
  );
}

/** Marca elegida, en píldora, con su botón para quitarla. */
function BrandTag({ brand, onRemove }: { readonly brand: string; readonly onRemove: () => void }) {
  return (
    <li className="inline-flex items-center gap-0.5 rounded-full border border-action bg-brand-50 py-0 pr-0 pl-4 text-control font-medium text-fg">
      {brand}
      <RemoveBrandButton brand={brand} onClick={onRemove} />
    </li>
  );
}

/**
 * Alta de proveedores, en TRES pasos (rediseño 2026-11, lienzo `Alta`):
 * datos del negocio (nombre, descripción, servicios, marcas, vehículos) →
 * atención (modalidad, dirección, horarios) → contacto (WhatsApp, email,
 * logo, redes, cómo se enteraron). Un solo `<form>`: los pasos que no se ven
 * quedan montados con `hidden`, así lo escrito no se pierde al ir y volver, y
 * el envío lee todos los campos igual que antes. "Continuar" valida SOLO el
 * paso a la vista; el envío final vuelve a validar todo y, si algo de un paso
 * anterior falla, vuelve a ese paso.
 *
 * Contrato con la API (no cambiar sin migrar `/api/provider`): POST { taller,
 * whatsapp, email, direccion, works_all_brands, brands[], specialized_brands[],
 * logo_data_url (opcional), services[],
 * service_other, vehicle_types[], fuel_types[], how_found, how_found_other }.
 *
 * El destino de esos datos ya NO es la Google Sheet: `/api/provider` los manda
 * al backend, que los guarda en `partner_applications`.
 *
 * ── `services[]` son slugs de RUBRO del catálogo, no labels ─────────────────
 *
 * Las opciones vienen del backend (`serviceFamilies`, resueltas en el
 * servidor por la página) y lo que viaja es el `slug` del rubro. La familia
 * agrupa en pantalla (`ServiceFamilyPicker`, acordeón) y no viaja. El único
 * texto libre es `service_other`, lo que el catálogo todavía no cubre.
 *
 * ── El WhatsApp se arregla acá, no se rebota ────────────────────────────────
 *
 * Es el mismo `WhatsappInput` de `/pedido`: saca el +54, el 0 y el 15
 * mientras se escribe, valida con `parseArWhatsapp` al salir del campo y al
 * enviar, y si algo falta lo dice en el campo. `/api/provider` vuelve a
 * validar y manda la forma canónica (`549…`) al backend.
 *
 * ── Alta con dueño (spec 212, US3) ──────────────────────────────────────────
 *
 * Cada envío lleva `Authorization: Bearer <token de Clerk>`
 * (`submitWithOwnerToken`): el backend deja esa cuenta como dueña del taller
 * cuando aprueba la solicitud. Ante un 401 se renueva el token y se reintenta
 * UNA vez; si igual falla, se pide volver a entrar SIN borrar lo escrito.
 */
export function ProviderForm({
  serviceFamilies,
  getToken,
  reauthHref,
  checkout = null,
  step,
  onStepChange,
  onDone,
}: {
  readonly serviceFamilies: readonly ServiceFamilyOption[];
  /** `getToken` de `useAuth()` de Clerk. */
  readonly getToken: OwnerGetToken;
  /** Adónde se vuelve a entrar si la sesión venció (se abre en otra pestaña). */
  readonly reauthHref: string;
  /**
   * La contratación de la que vino la persona (`?next` validado) y su plan:
   * la pantalla de estado se lo recuerda y ofrece volver.
   */
  readonly checkout?: { readonly href: string; readonly planName: string } | null;
  /** Paso a la vista (0 a 2). Lo tiene el padre: pinta la barra y la columna de pasos. */
  readonly step: number;
  readonly onStepChange: (step: number) => void;
  /** La solicitud salió (o ya existía): el padre pasa a "Revisión". */
  readonly onDone?: () => void;
}) {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState(GENERIC_ERROR);
  /** El último envío falló por sesión: se muestra el link para volver a entrar. */
  const [sessionExpired, setSessionExpired] = useState(false);
  /**
   * "Ya te teniamos anotado" es un exito, no un error: la solicitud existe y
   * alguien la va a mirar. Mostrarlo en rojo haria que la persona reintente o
   * piense que el sitio no anda.
   */
  const [alreadyRegistered, setAlreadyRegistered] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [worksAllBrands, setWorksAllBrands] = useState(true);
  const [brands, setBrands] = useState<string[]>([]);
  const [specializedBrands, setSpecializedBrands] = useState<string[]>([]);
  const [otherSpecialty, setOtherSpecialty] = useState("");
  /**
   * El logo YA comprimido (ver lib/proveedores/logo-compression.ts), no el
   * archivo que eligio la persona: se achica al elegirlo, asi el error aparece
   * en el momento y el envio no espera.
   */
  const [logo, setLogo] = useState<Blob | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoProcessing, setLogoProcessing] = useState(false);
  /** Nombre del archivo elegido, para la píldora: el `Blob` comprimido no tiene `name`. */
  const [logoName, setLogoName] = useState<string | null>(null);
  /**
   * Cada eleccion de archivo suma uno. Si la persona elige otro logo (o lo
   * quita) mientras el anterior se comprime, el resultado viejo llega con un
   * numero que ya no es el actual y se descarta.
   */
  const logoPickRef = useRef(0);
  const [description, setDescription] = useState("");
  /**
   * Redes con un link que el backend rechazaria. Se marca al salir del campo
   * (no mientras se tipea) y, una vez marcado, se re-chequea en vivo para que
   * el error se vaya apenas el link sirve.
   */
  const [invalidSocial, setInvalidSocial] = useState<ReadonlySet<ProviderSocialKey>>(new Set());

  function checkSocialLink(key: ProviderSocialKey, value: string): boolean {
    const invalid = value.trim() !== "" && normalizeProviderSocialLink(key, value) === null;
    setInvalidSocial((current) => {
      if (current.has(key) === invalid) return current;
      const next = new Set(current);
      if (invalid) next.add(key);
      else next.delete(key);
      return next;
    });
    return invalid;
  }
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const brandsRef = useRef<HTMLFieldSetElement>(null);
  /** Slugs de RUBRO del catalogo. Nunca labels, nunca familias, nunca el "Otro". */
  const [services, setServices] = useState<string[]>([]);
  /** "Otro" va aparte: el texto libre viaja en su propio campo (`service_other`). */
  const [wantsOtherService, setWantsOtherService] = useState(false);
  const [otherService, setOtherService] = useState("");
  /**
   * Pasos que la persona ya intentó pasar. Antes de eso el formulario no reta
   * a nadie: marcar en rojo un campo que todavía no llegó a completar es
   * hostil y no informa nada.
   */
  const [attempted, setAttempted] = useState<ReadonlySet<number>>(new Set());
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [howFound, setHowFound] = useState("");
  const [otherHowFound, setOtherHowFound] = useState("");
  /**
   * Geocode de la dirección, capturado al elegir una sugerencia de Google
   * Places. Se resetea a `EMPTY_GEO` si la persona edita el texto después de
   * elegir una sugerencia: nunca viaja un geocode que no corresponde a lo que
   * se ve en el campo.
   */
  const [geo, setGeo] = useState<PlaceGeo>(EMPTY_GEO);
  const [mapsReady, setMapsReady] = useState(false);
  const [modality, setModality] = useState<PartnerModality | "">("");
  /** Solo se llena al intentar pasar el paso y se borra apenas se vuelve a escribir. */
  const [addressError, setAddressError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  /** Lo que se ve en el campo, ya formateado (`381 456-7890`). */
  const [whatsapp, setWhatsapp] = useState("");
  /** El error aparece recién al salir del campo (o al intentar enviar). */
  const [whatsappTouched, setWhatsappTouched] = useState(false);

  const servicesErrorRef = useRef<HTMLParagraphElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const whatsappInputRef = useRef<HTMLInputElement>(null);
  /**
   * `autocompleteRef` distingue "Places anda" de "no hay key o el script no
   * cargó": solo en el primer caso se puede exigir que la dirección salga de
   * la lista. `pickedImpreciseRef` separa "no eligió nada" de "eligió algo que
   * no alcanza", que piden mensajes distintos.
   */
  const autocompleteRef = useRef<unknown>(null);
  const pickedImpreciseRef = useRef(false);
  /** Campo a enfocar después de cambiar de paso (el `hidden` se va en ese render). */
  const pendingFocusRef = useRef<HTMLElement | null>(null);

  const whatsappResult = parseArWhatsapp(whatsapp);
  const whatsappError =
    !whatsappResult.ok && (whatsappTouched || attempted.has(STEP.contact))
      ? whatsappErrorMessage(whatsappResult.error, whatsappResult.diff)
      : null;
  const nameError = attempted.has(STEP.business) && name.trim() === "" ? flow.nameRequired : null;

  // El Autocomplete pide direcciones puntuales ("address"), no zonas: importa
  // la puerta del local, porque de eso depende el orden por cercanía en los
  // pedidos (ver AUT-81).
  useEffect(() => {
    if (!mapsReady) return;
    const input = addressInputRef.current;
    if (!input || !window.google?.maps?.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: "ar" },
      types: ["address"],
      fields: ["formatted_address", "name", "geometry", "address_components"],
    });
    autocompleteRef.current = autocomplete;
    hidePlacesDropdownFromReplay();

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const latitude = place.geometry?.location?.lat() ?? null;
      const longitude = place.geometry?.location?.lng() ?? null;
      const locality =
        findAddressComponent(place.address_components, "locality") ??
        findAddressComponent(place.address_components, "sublocality");
      const province = findAddressComponent(place.address_components, "administrative_area_level_1");

      // Todo o nada: sin localidad o provincia no guardamos coordenadas
      // sueltas (ver specs/004-partner-approval-data/contracts).
      if (latitude === null || longitude === null || !locality || !province) {
        setGeo(EMPTY_GEO);
        // Sin `geometry` no hubo sugerencia (Enter sobre texto libre).
        pickedImpreciseRef.current = place.geometry !== undefined;
        if (pickedImpreciseRef.current) {
          setAddressError((current) => (current === null ? null : copy.addressImpreciseError));
        }
        return;
      }
      pickedImpreciseRef.current = false;
      setGeo({ latitude, longitude, locality, province });
      setAddressError(null);
    });

    return () => {
      autocompleteRef.current = null;
      listener.remove();
      document.querySelectorAll(".pac-container").forEach((el) => el.remove());
    };
  }, [mapsReady]);

  /**
   * Un taller sin nada declarado no se puede publicar ni recomendar. "Otro"
   * con texto cuenta como declarar: si el taller hace algo que el catálogo no
   * cubre, la respuesta correcta es dejarlo pasar, no trabarlo.
   */
  const hasDeclaredServices = services.length > 0 || otherService.trim() !== "";
  const missingServices = attempted.has(STEP.business) && !hasDeclaredServices;

  // Campo a enfocar después de cambiar de paso: ya sin `hidden`.
  useEffect(() => {
    if (!pendingFocusRef.current) return;
    pendingFocusRef.current.focus();
    pendingFocusRef.current = null;
  }, [step]);

  function toggle(list: string[], setList: (value: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function addSpecialty(value: string) {
    if (specializedBrands.length >= PROVIDER_BRAND_MAX_COUNT) return;
    const trimmed = value.trim().replace(/\s+/g, " ");
    const brand =
      PROVIDER_BRANDS.find((item) => item.toLocaleLowerCase("es-AR") === trimmed.toLocaleLowerCase("es-AR")) ?? trimmed;
    setSpecializedBrands((current) => appendProviderBrand(current, brand));
    if (!worksAllBrands) setBrands((current) => appendProviderBrand(current, brand, Infinity));
    setOtherSpecialty("");
  }

  /** Marcas que se mandarían ahora (incluye la especialidad escrita y no agregada). */
  function brandSelection() {
    const pendingText = otherSpecialty.trim().replace(/\s+/g, " ");
    const pendingSpecialty =
      PROVIDER_BRANDS.find((item) => item.toLocaleLowerCase("es-AR") === pendingText.toLocaleLowerCase("es-AR")) ??
      pendingText;
    const submittedSpecialties = appendProviderBrand(specializedBrands, pendingSpecialty);
    const submittedBrands = worksAllBrands ? brands : appendProviderBrand(brands, pendingSpecialty, Infinity);
    return {
      submittedSpecialties,
      submittedBrands,
      valid: validBrandSelection(worksAllBrands, submittedBrands, submittedSpecialties),
    };
  }

  /**
   * Valida UN paso, muestra sus errores y devuelve el primer campo con
   * problema (para el foco), `"block"` si falla algo que no es un campo
   * (servicios), o `null` si el paso está bien.
   */
  function validateStep(target: number, form: HTMLFormElement): HTMLElement | "block" | null {
    setAttempted((current) => (current.has(target) ? current : new Set([...current, target])));

    if (target === STEP.business) {
      if (name.trim() === "") return nameInputRef.current;
      if (!hasDeclaredServices) return servicesErrorRef.current ?? "block";
      if (!brandSelection().valid) return brandsRef.current;
      return null;
    }

    if (target === STEP.attention) {
      // Con Places andando, la dirección tiene que salir de la lista: de ese
      // geocode depende el orden por cercanía (AUT-81). Sin key o si el script
      // no cargó no hay lista: ahí sigue el texto libre.
      const hasGeo = geo.latitude !== null && geo.longitude !== null;
      const direccion = (form.elements.namedItem("direccion") as HTMLInputElement).value.trim();
      if (autocompleteRef.current !== null && !hasGeo) {
        setAddressError(pickedImpreciseRef.current ? copy.addressImpreciseError : copy.addressNotPickedError);
        return addressInputRef.current;
      }
      if (direccion === "") {
        setAddressError(copy.addressNotPickedError);
        return addressInputRef.current;
      }
      return null;
    }

    // Contacto: las redes se chequean todas (se marcan todas las que fallan).
    const socialInputs = PROVIDER_SOCIAL_KEYS.map(
      (key) => [key, form.elements.namedItem(`social_${key}`) as HTMLInputElement] as const,
    );
    const firstInvalidSocial = socialInputs.filter(([key, input]) => checkSocialLink(key, input.value)).at(0)?.[1];
    const emailInvalid = !isValidProviderEmail((form.elements.namedItem("email") as HTMLInputElement).value);
    if (emailInvalid) setEmailError(copy.email.invalid);
    if (!whatsappResult.ok) return whatsappInputRef.current;
    if (emailInvalid) return emailInputRef.current;
    if (logoError) return logoInputRef.current;
    if (firstInvalidSocial) return firstInvalidSocial;
    return null;
  }

  /** Lleva a la persona a `target` y enfoca `focus` (o el título del paso, que enfoca el padre). */
  function goTo(target: number, focus: HTMLElement | null = null) {
    pendingFocusRef.current = focus;
    onStepChange(target);
  }

  function handleContinue() {
    const form = formRef.current;
    if (!form) return;
    const invalid = validateStep(step, form);
    if (invalid === "block") return;
    if (invalid) {
      if (invalid === servicesErrorRef.current) {
        invalid.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        invalid.focus();
      }
      return;
    }
    track(ANALYTICS_EVENTS.partnerRegisterStepCompleted, { step: step + 1 });
    goTo(step + 1);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Enter en un campo de un paso intermedio es "Continuar", no "enviar".
    if (step < STEP.contact) {
      handleContinue();
      return;
    }
    const form = event.currentTarget;

    // Se revalida TODO: si algo de un paso anterior falla, se vuelve ahí.
    for (const target of [STEP.business, STEP.attention, STEP.contact]) {
      const invalid = validateStep(target, form);
      if (invalid === null) continue;
      if (target !== step) goTo(target, invalid === "block" ? null : invalid);
      else if (invalid !== "block") invalid.focus();
      return;
    }

    const { submittedBrands, submittedSpecialties } = brandSelection();
    const hasGeo = geo.latitude !== null && geo.longitude !== null;
    const socialInputs = PROVIDER_SOCIAL_KEYS.map(
      (key) => [key, form.elements.namedItem(`social_${key}`) as HTMLInputElement] as const,
    );

    // Se arma con la misma función que usa `/api/provider`, que es la que
    // normaliza los links de las redes.
    const profile = parseProviderProfileFields(
      description,
      Object.fromEntries(socialInputs.map(([key, input]) => [key, input.value])),
    );
    if (!profile.ok) {
      setSubmitState("error");
      setErrorMessage(profile.kind === "description" ? copy.description.invalid : copy.social.invalid);
      return;
    }

    const taller = name;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const direccion = (form.elements.namedItem("direccion") as HTMLInputElement).value;
    const hours = (form.elements.namedItem("hours") as HTMLInputElement).value.trim();

    // Los inputs ya traen `maxLength`: esto queda por si un autocompletado o
    // una extensión mete más texto del que se puede tipear.
    const tooLong = findTooLongProviderText({
      taller,
      direccion,
      hours,
      service_other: otherService,
      how_found: howFound,
      how_found_other: otherHowFound,
    });
    if (tooLong) {
      setErrorMessage(copy.textTooLong[tooLong]);
      setSubmitState("error");
      return;
    }

    setSubmitState("loading");
    setErrorMessage(GENERIC_ERROR);
    setAlreadyRegistered(null);
    setSessionExpired(false);

    try {
      let logoDataUrl: string | undefined;
      if (logo) {
        try {
          logoDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject());
            reader.onerror = () => reject();
            reader.onabort = () => reject();
            reader.readAsDataURL(logo);
          });
        } catch {
          setErrorMessage(copy.logo.readError);
          setSubmitState("error");
          return;
        }
      }
      const outcome = await submitWithOwnerToken(
        JSON.stringify({
          taller,
          whatsapp,
          email,
          direccion,
          ...(profile.description ? { description: profile.description } : {}),
          ...(profile.socialLinks ? { social_links: profile.socialLinks } : {}),
          works_all_brands: worksAllBrands,
          brands: worksAllBrands ? [] : submittedBrands,
          specialized_brands: submittedSpecialties,
          ...(logoDataUrl ? { logo_data_url: logoDataUrl } : {}),
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
        getToken,
      );

      // Nada se resetea: el formulario sigue montado con todo lo escrito.
      if (outcome.kind === "unauthenticated") {
        setErrorMessage(copy.session.expired);
        setSessionExpired(true);
        setSubmitState("error");
        return;
      }

      const { response } = outcome;
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        alreadyRegistered?: boolean;
      };

      if (!response.ok) {
        // El mensaje lo arma la ruta, que conoce los códigos del backend.
        setErrorMessage(payload.error ?? GENERIC_ERROR);
        setSubmitState("error");
        return;
      }

      const already = Boolean(payload.alreadyRegistered && payload.message);
      if (already && payload.message) setAlreadyRegistered(payload.message);
      // Fin del registro. Nunca datos del negocio: solo si ya existía y si vino de contratar.
      track(ANALYTICS_EVENTS.partnerRegisterSubmitted, {
        ...(already ? { already_registered: true } : {}),
        ...(checkout ? { from_checkout: true } : {}),
      });
      setSubmitState("success");
      onDone?.();
    } catch {
      setErrorMessage(GENERIC_ERROR);
      setSubmitState("error");
    }
  }

  if (submitState === "success") {
    return <RegistrationStatus alreadyRegisteredMessage={alreadyRegistered} checkout={checkout} />;
  }

  const loading = submitState === "loading";
  const brandsMissing = attempted.has(STEP.business) && !worksAllBrands && brands.length === 0;

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

      {/* Ritmo (densidad 2026-11): 32px entre bloques, 12-16px entre el
          título de un bloque y sus campos, 8px entre rótulo y campo. */}
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
        {/* ── Paso 1: datos del negocio ─────────────────────────────── */}
        <div hidden={step !== STEP.business} className="flex flex-col gap-8">
          <section aria-labelledby="alta-nombre" className="flex flex-col gap-4">
            <h2 id="alta-nombre" className={altaSectionTitle}>
              {flow.sections.name}
            </h2>
            <AltaField
              label={flow.nameLabel}
              htmlFor="prov-name"
              error={nameError}
              errorId="prov-name-error"
            >
              <Input
                ref={nameInputRef}
                id="prov-name"
                name="taller"
                type="text"
                placeholder={flow.namePlaceholder}
                autoComplete="organization"
                maxLength={PROVIDER_TEXT_MAX_LENGTH.taller}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? "prov-name-error" : undefined}
                className={altaInput}
              />
            </AltaField>
            <AltaField label={flow.descriptionLabel} optional={flow.optional} htmlFor="prov-description">
              <Textarea
                id="prov-description"
                name="description"
                rows={2}
                maxLength={PROVIDER_DESCRIPTION_MAX_LENGTH}
                placeholder={copy.description.placeholder}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                aria-describedby="prov-description-hint prov-description-count"
                className={altaTextarea}
              />
              {/* Ayuda y contador en la misma línea: dos renglones menos. */}
              <div className="-mt-0.5 flex items-start justify-between gap-4 text-label text-fg-muted">
                <p id="prov-description-hint">{copy.description.hint}</p>
                <p id="prov-description-count" className="shrink-0 tabular-nums">
                  {copy.description.count(description.length)}
                </p>
              </div>
            </AltaField>
          </section>

          <section aria-labelledby="alta-servicios" className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 id="alta-servicios" className={altaSectionTitle}>
                {flow.sections.services}
              </h2>
              {serviceFamilies.length > 0 ? <p className={altaSectionHint}>{flow.sections.servicesHint}</p> : null}
            </div>
            {serviceFamilies.length > 0 ? (
              <>
                <ServiceFamilyPicker families={serviceFamilies} selected={services} onChange={setServices} />
                {/* "Otro" va DEBAJO del acordeón y suelto: es el único valor de
                    esta sección que no sale del catálogo (`service_other`). */}
                <AltaChip
                  type="checkbox"
                  label={`${OTHER_OPTION}: hacemos algo que no está en la lista`}
                  checked={wantsOtherService}
                  onChange={() => {
                    const next = !wantsOtherService;
                    setWantsOtherService(next);
                    if (!next) setOtherService("");
                  }}
                  className="self-start"
                />
              </>
            ) : (
              /* El catálogo no cargó: no se inventa una lista de rubros (los
                 slugs los define el backend). Se avisa y se abre el texto libre. */
              <div role="alert" className="rounded-2xl bg-canvas p-4">
                <p className="text-base font-semibold text-fg">No pudimos cargar el listado de servicios.</p>
                <p className="mt-1 text-sm text-fg-muted">
                  Es un problema nuestro, no tuyo, y no te frena: escribinos acá abajo qué servicios ofrecés y los
                  cargamos nosotros al activarte el perfil.
                </p>
              </div>
            )}

            {missingServices ? (
              <p ref={servicesErrorRef} tabIndex={-1} role="alert" className="text-sm font-medium text-status-alert">
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
                  type="text"
                  placeholder="Contanos qué otro servicio ofrecés"
                  value={otherService}
                  maxLength={PROVIDER_TEXT_MAX_LENGTH.service_other}
                  onChange={(event) => setOtherService(event.target.value)}
                  required
                  className={altaInput}
                />
              </>
            ) : null}
          </section>

          <fieldset ref={brandsRef} tabIndex={-1} className="flex flex-col gap-3">
            <legend className={cn(altaSectionTitle, "mb-3")}>{copy.brands.title}</legend>
            {/* Opciones cortas: chips de radio, uno al lado del otro también en celular. */}
            <div className="flex flex-wrap gap-2">
              <AltaChip
                type="radio"
                name="works_all_brands"
                label={copy.brands.all}
                checked={worksAllBrands}
                onChange={() => setWorksAllBrands(true)}
              />
              <AltaChip
                type="radio"
                name="works_all_brands"
                label={copy.brands.specific}
                checked={!worksAllBrands}
                onChange={() => {
                  setWorksAllBrands(false);
                  setBrands((current) =>
                    specializedBrands.reduce((all, brand) => appendProviderBrand(all, brand, Infinity), current),
                  );
                }}
              />
            </div>

            {!worksAllBrands ? (
              <div className="flex flex-col gap-3">
                <label htmlFor="prov-brand-picker" className="sr-only">
                  {copy.brands.picker}
                </label>
                <Select
                  id="prov-brand-picker"
                  className={altaSelect}
                  aria-invalid={brandsMissing}
                  aria-describedby={brandsMissing ? "prov-brands-error" : undefined}
                  value=""
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value && !brands.includes(value)) setBrands([...brands, value]);
                  }}
                >
                  <option value="" disabled>
                    {copy.brands.placeholder}
                  </option>
                  {PROVIDER_BRANDS.filter((brand) => !brands.includes(brand)).map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </Select>
                {brands.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {brands.map((brand) => (
                      <BrandTag
                        key={brand}
                        brand={brand}
                        onRemove={() => {
                          setBrands(brands.filter((item) => item !== brand));
                          setSpecializedBrands(specializedBrands.filter((item) => item !== brand));
                        }}
                      />
                    ))}
                  </ul>
                ) : (
                  <p
                    id="prov-brands-error"
                    role={brandsMissing ? "alert" : undefined}
                    className={brandsMissing ? "text-sm font-medium text-status-alert" : "text-sm text-fg-muted"}
                  >
                    {copy.brands.missing}
                  </p>
                )}
              </div>
            ) : null}
          </fieldset>

          {/* Sub-pregunta opcional de las marcas: rótulo de grupo y 24px arriba
              (el `gap-8` del paso menos 8), para que se lea pegada a "¿Qué marcas…?". */}
          <fieldset className="-mt-2 flex flex-col gap-3" aria-describedby="prov-specialties-hint">
            <legend className={cn(altaGroupLabel, "mb-1")}>{copy.brands.specialtiesTitle}</legend>
            <p id="prov-specialties-hint" className={altaSectionHint}>
              {worksAllBrands ? copy.brands.specialtiesHint : copy.brands.specialtiesSpecificHint}
            </p>
            <label htmlFor="prov-specialty-picker" className="sr-only">
              {copy.brands.specialtiesPicker}
            </label>
            <Select
              id="prov-specialty-picker"
              className={altaSelect}
              value=""
              disabled={loading || specializedBrands.length >= PROVIDER_BRAND_MAX_COUNT}
              onChange={(event) => addSpecialty(event.target.value)}
            >
              <option value="" disabled>
                {copy.brands.placeholder}
              </option>
              {PROVIDER_BRANDS.filter((brand) => !specializedBrands.includes(brand)).map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </Select>
            {specializedBrands.length ? (
              <ul className="flex flex-wrap gap-2">
                {specializedBrands.map((brand) => (
                  <BrandTag
                    key={brand}
                    brand={brand}
                    onRemove={() => setSpecializedBrands((current) => current.filter((item) => item !== brand))}
                  />
                ))}
              </ul>
            ) : null}
            <AltaField label={copy.brands.otherLabel} htmlFor="prov-specialty-other">
              {/* Campo y "Agregar" en la misma fila en todos los anchos. */}
              <div className="flex gap-2">
                <Input
                  id="prov-specialty-other"
                  className={altaInput}
                  value={otherSpecialty}
                  maxLength={PROVIDER_BRAND_MAX_LENGTH}
                  placeholder={copy.brands.otherPlaceholder}
                  disabled={loading || specializedBrands.length >= PROVIDER_BRAND_MAX_COUNT}
                  onChange={(event) => setOtherSpecialty(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addSpecialty(otherSpecialty);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="48"
                  className="shrink-0"
                  disabled={loading || !otherSpecialty.trim() || specializedBrands.length >= PROVIDER_BRAND_MAX_COUNT}
                  onClick={() => addSpecialty(otherSpecialty)}
                >
                  {copy.brands.add}
                </Button>
              </div>
            </AltaField>
            {specializedBrands.length >= PROVIDER_BRAND_MAX_COUNT ? (
              <p className="text-sm text-fg-muted">{copy.brands.maximum}</p>
            ) : null}
          </fieldset>

          <section aria-labelledby="alta-vehiculos" className="flex flex-col gap-4">
            <h2 id="alta-vehiculos" className={altaSectionTitle}>
              {flow.sections.vehicles}
            </h2>
            <fieldset>
              <legend className={cn(altaGroupLabel, "mb-2")}>Tipos de vehículo que atienden</legend>
              <div className="flex flex-wrap gap-2">
                {PROVIDER_VEHICLE_TYPES.map((type) => (
                  <AltaChip
                    key={type}
                    type="checkbox"
                    label={type}
                    checked={vehicleTypes.includes(type)}
                    onChange={() => toggle(vehicleTypes, setVehicleTypes, type)}
                  />
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className={cn(altaGroupLabel, "mb-2")}>Motorizaciones que atienden</legend>
              <div className="flex flex-wrap gap-2">
                {PROVIDER_FUEL_TYPES.map((fuel) => (
                  <AltaChip
                    key={fuel}
                    type="checkbox"
                    label={fuel}
                    checked={fuelTypes.includes(fuel)}
                    onChange={() => toggle(fuelTypes, setFuelTypes, fuel)}
                  />
                ))}
              </div>
            </fieldset>
          </section>
        </div>

        {/* ── Paso 2: atención ──────────────────────────────────────── */}
        <div hidden={step !== STEP.attention} className="flex flex-col gap-8">
          <fieldset>
            <legend className={cn(altaSectionTitle, "mb-3")}>{flow.sections.modality}</legend>
            <div className="flex flex-wrap gap-2">
              {PROVIDER_MODALITY_OPTIONS.map((option) => (
                <AltaChip
                  key={option.value}
                  type="radio"
                  name="modality"
                  label={option.label}
                  checked={modality === option.value}
                  onChange={() => setModality(option.value)}
                />
              ))}
            </div>
          </fieldset>

          <section aria-labelledby="alta-direccion" className="flex flex-col gap-4">
            <h2 id="alta-direccion" className={altaSectionTitle}>
              {flow.sections.address}
            </h2>
            <AltaField
              label="Dirección"
              htmlFor="prov-address"
              hint={copy.addressHelper}
              hintId="prov-address-hint"
              error={addressError}
              errorId="prov-address-error"
            >
              <Input
                id="prov-address"
                name="direccion"
                type="text"
                placeholder="Calle y número"
                autoComplete="street-address"
                maxLength={PROVIDER_TEXT_MAX_LENGTH.direccion}
                ref={addressInputRef}
                onChange={() => {
                  setGeo(EMPTY_GEO);
                  pickedImpreciseRef.current = false;
                  setAddressError(null);
                }}
                aria-invalid={addressError !== null}
                aria-describedby={addressError !== null ? "prov-address-hint prov-address-error" : "prov-address-hint"}
                required
                className={altaInput}
              />
            </AltaField>
          </section>

          <section aria-labelledby="alta-horarios" className="flex flex-col gap-4">
            <h2 id="alta-horarios" className={altaSectionTitle}>
              {flow.sections.hours}
            </h2>
            <AltaField label={copy.hoursLabel} htmlFor="prov-hours">
              <Input
                id="prov-hours"
                name="hours"
                type="text"
                placeholder={copy.hoursPlaceholder}
                maxLength={PROVIDER_TEXT_MAX_LENGTH.hours}
                className={altaInput}
              />
            </AltaField>
          </section>
        </div>

        {/* ── Paso 3: contacto ──────────────────────────────────────── */}
        <div hidden={step !== STEP.contact} className="flex flex-col gap-8">
          <section aria-labelledby="alta-contacto" className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="alta-contacto" className={altaSectionTitle}>
                {flow.sections.contact}
              </h2>
              <p className={altaSectionHint}>{flow.sections.contactHint}</p>
            </div>
            {/* WhatsApp y email lado a lado desde `sm`: son cortos y van juntos. */}
            <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
            <AltaField
              label={copy.whatsapp.label}
              htmlFor="prov-phone"
              hint={copy.whatsapp.hint}
              hintId="prov-phone-hint"
              error={whatsappError}
              errorId="prov-phone-error"
            >
              {/* Mismo control que /pedido: el `+54` es parte del campo. */}
              <div
                className={cn(
                  socialPill,
                  whatsappError ? "border-status-alert" : "border-control-line-strong hover:border-fg-muted",
                )}
              >
                <span
                  id="prov-phone-prefix"
                  className="flex shrink-0 items-center border-r border-card-line pr-3 pl-5 text-base text-fg-muted"
                >
                  <span aria-hidden="true">{copy.whatsapp.prefix}</span>
                  <span className="sr-only">{copy.whatsapp.prefixLabel}</span>
                </span>
                <WhatsappInput
                  id="prov-phone"
                  name="whatsapp"
                  ref={whatsappInputRef}
                  autoComplete="tel-national"
                  required
                  value={whatsapp}
                  onValueChange={setWhatsapp}
                  onBlur={() => setWhatsappTouched(true)}
                  placeholder={copy.whatsapp.placeholder}
                  disabled={loading}
                  aria-invalid={whatsappError ? true : undefined}
                  aria-describedby={
                    whatsappError
                      ? "prov-phone-prefix prov-phone-hint prov-phone-error"
                      : "prov-phone-prefix prov-phone-hint"
                  }
                  className={pillInnerInput}
                />
              </div>
            </AltaField>
            <AltaField label={flow.emailLabel} htmlFor="prov-email" error={emailError} errorId="prov-email-error">
              <Input
                id="prov-email"
                name="email"
                type="email"
                ref={emailInputRef}
                placeholder="tuemail@negocio.com"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={PROVIDER_EMAIL_MAX_LENGTH}
                onChange={() => setEmailError(null)}
                aria-invalid={emailError !== null}
                aria-describedby={emailError !== null ? "prov-email-error" : undefined}
                required
                className={altaInput}
              />
            </AltaField>
            </div>
          </section>

          <section aria-labelledby="alta-extras" className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="alta-extras" className={altaSectionTitle}>
                {flow.sections.extras}
              </h2>
              <p className={altaSectionHint}>{flow.sections.extrasHint}</p>
            </div>
            <AltaField
              label={copy.logo.label}
              htmlFor="prov-logo"
              hint={copy.logo.hint}
              hintId="prov-logo-hint"
              error={logoError}
              errorId="prov-logo-error"
            >
              {/* El texto del control nativo ("Choose File / No file chosen") sale en el
                  idioma del navegador: se dibuja una píldora propia en español y el
                  input real queda encima, transparente, para conservar el foco, el
                  teclado y el nombre accesible del `<label>`. */}
              <div
                className={cn(
                  "relative flex h-12 items-center gap-4 rounded-full border bg-card pr-5 pl-1.5 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand",
                  logoError ? "border-status-alert" : "border-control-line-strong hover:border-fg-muted",
                )}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-9 shrink-0 items-center rounded-full border border-action px-4 font-display text-control font-semibold text-fg"
                >
                  {copy.logo.choose}
                </span>
                <span aria-hidden="true" className="min-w-0 truncate text-base text-fg-muted">
                  {logoName ?? copy.logo.empty}
                </span>
                <input
                  id="prov-logo"
                  name="logo"
                  type="file"
                  ref={logoInputRef}
                  accept={PROVIDER_LOGO_TYPES.join(",")}
                  disabled={loading}
                  className="absolute inset-0 size-full cursor-pointer rounded-full opacity-0 disabled:cursor-not-allowed"
                  aria-invalid={logoError !== null}
                  aria-describedby={logoError ? "prov-logo-hint prov-logo-error" : "prov-logo-hint"}
                  onChange={async (event) => {
                    const file = event.target.files?.[0] ?? null;
                    const pick = ++logoPickRef.current;
                    setLogo(null);
                    setLogoProcessing(false);
                    setLogoName(file?.name ?? null);
                    if (!file) {
                      setLogoError(null);
                      return;
                    }
                    if (!validProviderLogoSource(file)) {
                      setLogoError(copy.logo.invalid);
                      return;
                    }
                    setLogoError(null);
                    setLogoProcessing(true);
                    const compressed = await compressProviderLogo(file);
                    if (pick !== logoPickRef.current) return;
                    setLogoProcessing(false);
                    setLogo(compressed);
                    setLogoError(compressed ? null : copy.logo.processError);
                  }}
                />
              </div>
              {logoProcessing ? (
                <p role="status" className="text-sm text-fg-muted">
                  {copy.logo.processing}
                </p>
              ) : null}
              {logo || logoError || logoProcessing ? (
                <button
                  type="button"
                  className="min-h-11 self-start text-sm font-semibold text-fg underline underline-offset-4"
                  disabled={loading}
                  onClick={() => {
                    logoPickRef.current += 1;
                    setLogoProcessing(false);
                    setLogoName(null);
                    setLogo(null);
                    setLogoError(null);
                    if (logoInputRef.current) logoInputRef.current.value = "";
                  }}
                >
                  {copy.logo.remove}
                </button>
              ) : null}
            </AltaField>

            <fieldset className="flex flex-col gap-3" aria-describedby="prov-social-hint">
              <legend className={cn(altaGroupLabel, "mb-1")}>{copy.social.title}</legend>
              <p id="prov-social-hint" className={altaSectionHint}>
                {copy.social.hint}
              </p>
              {/* El nombre de la red va DENTRO de la píldora, como el +54 del
                  WhatsApp, y es el `<label>` del campo: una fila por red en
                  lugar de dos (rótulo + campo). */}
              <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
                {copy.social.networks.map(({ key, label, placeholder, invalid }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <div
                      className={cn(
                        socialPill,
                        invalidSocial.has(key) ? "border-status-alert" : "border-control-line-strong hover:border-fg-muted",
                      )}
                    >
                      <label
                        htmlFor={`prov-social-${key}`}
                        className="flex w-28 shrink-0 items-center border-r border-card-line pr-3 pl-5 text-control font-semibold text-fg"
                      >
                        {label}
                      </label>
                    {/* `text` y no `url`: se puede escribir el usuario (`@tutaller`),
                        y el teclado de `url` en iOS esconde la arroba. */}
                    <Input
                      id={`prov-social-${key}`}
                      name={`social_${key}`}
                      type="text"
                      className={pillInnerInput}
                      maxLength={2048}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder={placeholder}
                      aria-invalid={invalidSocial.has(key)}
                      aria-describedby={
                        invalidSocial.has(key) ? `prov-social-hint prov-social-${key}-error` : "prov-social-hint"
                      }
                      onBlur={(event) => {
                        // Si se pudo armar el link, se muestra en el campo: la
                        // persona ve lo que vamos a guardar.
                        const link = normalizeProviderSocialLink(key, event.target.value);
                        if (link) event.target.value = link;
                        checkSocialLink(key, event.target.value);
                      }}
                      onChange={(event) => {
                        if (invalidSocial.has(key)) checkSocialLink(key, event.target.value);
                      }}
                    />
                    </div>
                    {invalidSocial.has(key) ? (
                      <p id={`prov-social-${key}-error`} className="text-label font-medium text-status-alert">
                        {invalid}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </fieldset>
          </section>

          <section aria-labelledby="alta-como" className="flex flex-col gap-4">
            <h2 id="alta-como" className={altaSectionTitle}>
              {flow.sections.howFound}
            </h2>
            {/* El `<h2>` ya hace la pregunta: el rótulo queda para lectores de pantalla. */}
            <AltaField label={flow.howFoundLabel} htmlFor="prov-how" hideLabel>
              <Select
                id="prov-how"
                name="how_found"
                value={howFound}
                onChange={(event) => {
                  setHowFound(event.target.value);
                  if (event.target.value !== OTHER_OPTION) setOtherHowFound("");
                }}
                className={altaSelect}
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
            </AltaField>
            {howFound === OTHER_OPTION ? (
              <>
                <label htmlFor="prov-how-other" className="sr-only">
                  Contanos cómo te enteraste
                </label>
                <Input
                  id="prov-how-other"
                  type="text"
                  placeholder="Contanos cómo te enteraste..."
                  value={otherHowFound}
                  maxLength={PROVIDER_TEXT_MAX_LENGTH.how_found_other}
                  onChange={(event) => setOtherHowFound(event.target.value)}
                  className={altaInput}
                />
              </>
            ) : null}
          </section>

          {submitState === "error" ? (
            <div className="flex flex-col items-start gap-2">
              <FormError message={errorMessage} />
              {sessionExpired ? (
                <a
                  href={reauthHref}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex min-h-11 items-center font-semibold text-fg underline underline-offset-4"
                >
                  {copy.session.reauthLink}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Acciones del paso: barra fija abajo en celular (siempre a mano y,
            sin el WhatsApp flotante en el flujo, nunca tapada), con el área
            segura del iPhone; desde `md`, a continuación del último campo,
            con la acción principal a la derecha. El `calc` con `env()` no
            tiene utility canónica (mismo patrón que las barras fijas al pie). */}
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t border-card-line bg-card pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:static md:border-t-0 md:py-0">
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            className={cn(
              "inline-flex min-h-11 items-center px-2 font-display text-control font-semibold text-fg underline underline-offset-4",
              step === STEP.business && "invisible",
            )}
            aria-hidden={step === STEP.business ? true : undefined}
            tabIndex={step === STEP.business ? -1 : undefined}
          >
            {flow.back}
          </button>
          {/* `key` distinto: si React reusara el mismo `<button>` y le cambiara
              el `type` a `submit` durante el click de "Continuar", el browser
              enviaría el formulario al terminar ese mismo click. */}
          <div className="flex items-center gap-4">
            {/* Desde `md`, la nota va al lado del envío; en celular, debajo de la barra. */}
            <p hidden={step !== STEP.contact} className="text-label text-fg-muted max-md:hidden">
              {copy.note}
            </p>
            {step < STEP.contact ? (
              <Button key="continuar" type="button" variant="primary" size="48" onClick={handleContinue}>
                {flow.next}
              </Button>
            ) : (
              <Button key="enviar" type="submit" variant="primary" size="48" disabled={loading || logoProcessing}>
                {loading ? copy.submitLoadingLabel : copy.submitLabel}
              </Button>
            )}
          </div>
        </div>
        <p hidden={step !== STEP.contact} className="-mt-6 text-center text-label text-fg-muted md:hidden">
          {copy.note}
        </p>
      </form>
    </>
  );
}
