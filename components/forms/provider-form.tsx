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
  Textarea,
} from "@/components/ui/form-controls";
import { FormError, FormSuccess } from "@/components/ui/form-feedback";
import { WhatsappInput } from "@/components/ui/whatsapp-input";
import { ButtonLink } from "@/components/ui/button";
import { whatsappErrorMessage } from "@/lib/content/presupuesto";
import { parseArWhatsapp } from "@/lib/phone";
import { cn } from "@/lib/utils";
import type { ServiceFamilyOption } from "@/lib/autolibre-api";
import {
  PROVIDER_LOGO_TYPES,
  PROVIDER_DESCRIPTION_MAX_LENGTH,
  PROVIDER_EMAIL_MAX_LENGTH,
  PROVIDER_SOCIAL_KEYS,
  PROVIDER_TEXT_MAX_LENGTH,
  findTooLongProviderText,
  isValidProviderEmail,
  parseProviderProfileFields,
  type ProviderSocialKey,
  appendProviderBrand,
  PROVIDER_BRAND_MAX_LENGTH,
  PROVIDER_BRAND_MAX_COUNT,
  validBrandSelection,
  validProviderLogo,
} from "@/lib/proveedores/registration";
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

/**
 * Alta de proveedores.
 *
 * Contrato con la API (no cambiar sin migrar `/api/provider`): POST { taller,
 * whatsapp, email, direccion, works_all_brands, brands[], specialized_brands[],
 * logo_data_url (opcional), services[],
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
 * valida el WhatsApp de verdad y avisa cuando ese email ya tiene una solicitud
 * abierta.
 *
 * ── El WhatsApp se arregla acá, no se rebota ────────────────────────────────
 *
 * El backend (`WhatsappNumber`) rechaza con razon un numero con el 15 local,
 * pero este campo era un input pelado que mandaba lo que se tipeaba: un taller
 * de Tucuman que escribio `0381 15 456-7890` —un numero perfectamente bueno—
 * se comio el cartel generico de "formato que no podemos aceptar", sin saber
 * que campo era. Ahora es el mismo `WhatsappInput` de `/pedido`: saca el +54,
 * el 0 y el 15 mientras se escribe, valida con `parseArWhatsapp` al salir del
 * campo y al enviar, y si algo falta lo dice en el campo. `/api/provider`
 * vuelve a validar y manda la forma canonica (`549…`) al backend.
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
  const [worksAllBrands, setWorksAllBrands] = useState(true);
  const [brands, setBrands] = useState<string[]>([]);
  const [specializedBrands, setSpecializedBrands] = useState<string[]>([]);
  const [otherSpecialty, setOtherSpecialty] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [invalidSocial, setInvalidSocial] = useState<ProviderSocialKey | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const brandsRef = useRef<HTMLFieldSetElement>(null);
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
  /**
   * Solo se llena al enviar y se borra apenas la persona vuelve a escribir: no
   * se reta mientras tipea, se reta cuando intenta mandar.
   */
  const [addressError, setAddressError] = useState<string | null>(null);
  /**
   * Mismo criterio que `addressError`. Hace falta porque el `<form>` va con
   * `noValidate`: el `type="email"` del input no frena nada, y antes un email
   * sin `.com` llegaba al backend y volvia como el cartel generico.
   */
  const [emailError, setEmailError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  /**
   * Lo que se ve en el campo, ya formateado (`381 456-7890`). Controlado porque
   * `WhatsappInput` reescribe el valor mientras se tipea.
   */
  const [whatsapp, setWhatsapp] = useState("");
  /**
   * Mismo criterio que `/pedido`: el error aparece recien al salir del campo
   * (o al intentar enviar) y desde ahi se corrige en vivo. Retar a mitad del
   * numero, cuando todavia faltan digitos porque la persona no termino, no
   * informa nada.
   */
  const [whatsappTouched, setWhatsappTouched] = useState(false);

  const servicesErrorRef = useRef<HTMLParagraphElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const whatsappInputRef = useRef<HTMLInputElement>(null);
  /**
   * Refs y no state porque solo se leen en el submit y en el listener de
   * Google — no cambian nada de lo que se pinta.
   *
   * `autocompleteRef` distingue "Places anda" de "no hay key o el script no
   * cargó": solo en el primer caso se puede exigir que la dirección salga de
   * la lista. `pickedImpreciseRef` separa "no eligió nada" de "eligió algo que
   * no alcanza", que piden mensajes distintos.
   */
  const autocompleteRef = useRef<unknown>(null);
  const pickedImpreciseRef = useRef(false);
  /**
   * Si el submit ya mandó el foco a un campo (WhatsApp o dirección), el scroll
   * al error de servicios (más abajo) no tiene que llevarse la pantalla a otro
   * lado.
   */
  const fieldFocusedOnSubmitRef = useRef(false);

  const whatsappResult = parseArWhatsapp(whatsapp);
  /** Derivado, como `missingServices`: se borra solo apenas el número sirve. */
  const whatsappError =
    !whatsappResult.ok && (whatsappTouched || submitAttempted)
      ? whatsappErrorMessage(whatsappResult.error, whatsappResult.diff)
      : null;

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
    autocompleteRef.current = autocomplete;
    hidePlacesDropdownFromReplay();

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
        // Sin `geometry` no hubo sugerencia: Google también dispara este
        // evento cuando se aprieta Enter sobre texto libre. Eso es "no eligió
        // nada", no "eligió algo impreciso".
        pickedImpreciseRef.current = place.geometry !== undefined;
        // Si ya había un error a la vista, que diga el motivo correcto.
        if (pickedImpreciseRef.current) {
          setAddressError((current) =>
            current === null
              ? null
              : providersContent.form.addressImpreciseError,
          );
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
  const hasDeclaredServices = services.length > 0 || otherService.trim() !== "";
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
    if (missingServices && !fieldFocusedOnSubmitRef.current) {
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

  function addSpecialty(value: string) {
    if (specializedBrands.length >= PROVIDER_BRAND_MAX_COUNT) return;
    const trimmed = value.trim().replace(/\s+/g, " ");
    const brand = PROVIDER_BRANDS.find((item) => item.toLocaleLowerCase("es-AR") === trimmed.toLocaleLowerCase("es-AR")) ?? trimmed;
    setSpecializedBrands((current) => appendProviderBrand(current, brand));
    if (!worksAllBrands) setBrands((current) => appendProviderBrand(current, brand, Infinity));
    setOtherSpecialty("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    const form = event.currentTarget;

    // Los cuatro campos de geocode viajan juntos o ninguno — `geo` ya
    // garantiza eso (ver el efecto de arriba), así que alcanza con chequear
    // uno para decidir si se manda el bloque completo.
    const hasGeo = geo.latitude !== null && geo.longitude !== null;

    // Con Places andando, la dirección tiene que salir de la lista: de ese
    // geocode depende el orden por cercanía (AUT-81). Sin key o si el script
    // no cargó no hay lista de donde elegir, y trabar el alta por eso seria
    // perder al taller por un problema nuestro — ahí sigue el texto libre.
    const addressInvalid = autocompleteRef.current !== null && !hasGeo;
    // WhatsApp, email y dirección: si fallan varios, el foco va al primero que
    // se ve. El error de cada uno se muestra igual.
    const whatsappInvalid = !whatsappResult.ok;
    const emailInvalid = !isValidProviderEmail(
      (form.elements.namedItem("email") as HTMLInputElement).value,
    );
    fieldFocusedOnSubmitRef.current =
      whatsappInvalid || emailInvalid || addressInvalid;
    if (whatsappInvalid) whatsappInputRef.current?.focus();
    if (emailInvalid) {
      setEmailError(providersContent.form.email.invalid);
      if (!whatsappInvalid) emailInputRef.current?.focus();
    }
    if (addressInvalid) {
      setAddressError(
        pickedImpreciseRef.current
          ? providersContent.form.addressImpreciseError
          : providersContent.form.addressNotPickedError,
      );
      if (!whatsappInvalid && !emailInvalid) addressInputRef.current?.focus();
    }

    // Ojo: el <form> va con `noValidate`, asi que los `required` de los inputs
    // son semantica para lectores de pantalla y no cortan nada. Lo unico que
    // frena el envio es este return.
    const pendingText = otherSpecialty.trim().replace(/\s+/g, " ");
    const pendingSpecialty = PROVIDER_BRANDS.find((item) => item.toLocaleLowerCase("es-AR") === pendingText.toLocaleLowerCase("es-AR")) ?? pendingText;
    const submittedSpecialties = appendProviderBrand(specializedBrands, pendingSpecialty);
    const submittedBrands = worksAllBrands ? brands : appendProviderBrand(brands, pendingSpecialty, Infinity);
    const brandsInvalid = !validBrandSelection(
      worksAllBrands,
      submittedBrands,
      submittedSpecialties,
    );
    if (
      whatsappInvalid ||
      emailInvalid ||
      addressInvalid ||
      !hasDeclaredServices ||
      brandsInvalid ||
      logoError
    ) {
      if (
        !whatsappInvalid &&
        !emailInvalid &&
        !addressInvalid &&
        hasDeclaredServices
      ) {
        if (logoError) logoInputRef.current?.focus();
        else if (brandsInvalid) brandsRef.current?.focus();
      }
      return;
    }

    const profile = parseProviderProfileFields(description, Object.fromEntries(
      PROVIDER_SOCIAL_KEYS.map((key) => [key, (form.elements.namedItem(`social_${key}`) as HTMLInputElement).value]),
    ));
    setInvalidSocial(null);
    if (!profile.ok) {
      setSubmitState("error");
      setErrorMessage(profile.kind === "description" ? providersContent.form.description.invalid : providersContent.form.social.invalid);
      if (profile.network) {
        setInvalidSocial(profile.network);
        (form.elements.namedItem(`social_${profile.network}`) as HTMLInputElement).focus();
      }
      return;
    }

    const taller = (form.elements.namedItem("taller") as HTMLInputElement)
      .value;
    const email = (
      form.elements.namedItem("email") as HTMLInputElement
    ).value.trim();
    const direccion = (form.elements.namedItem("direccion") as HTMLInputElement)
      .value;
    const hours = (
      form.elements.namedItem("hours") as HTMLInputElement
    ).value.trim();

    // Los inputs ya traen `maxLength`, asi que esto casi nunca salta. Queda
    // por si un autocompletado o una extension mete mas texto que el que se
    // puede tipear: mejor decirlo acá que comerse el 400 del backend.
    const tooLong = findTooLongProviderText({
      taller,
      direccion,
      hours,
      service_other: otherService,
      how_found: howFound,
      how_found_other: otherHowFound,
    });
    if (tooLong) {
      setErrorMessage(providersContent.form.textTooLong[tooLong]);
      setSubmitState("error");
      return;
    }

    setSubmitState("loading");
    setErrorMessage(GENERIC_ERROR);
    setAlreadyRegistered(null);

    try {
      let logoDataUrl: string | undefined;
      if (logo) {
        try {
          logoDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              typeof reader.result === "string"
                ? resolve(reader.result)
                : reject();
            reader.onerror = () => reject();
            reader.onabort = () => reject();
            reader.readAsDataURL(logo);
          });
        } catch {
          setErrorMessage(providersContent.form.logo.readError);
          setSubmitState("error");
          return;
        }
      }
      const response = await fetch("/api/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
              maxLength={PROVIDER_TEXT_MAX_LENGTH.taller}
              required
            />
          </Field>

          <Field
            label={providersContent.form.logo.label}
            htmlFor="prov-logo"
            hint={providersContent.form.logo.hint}
            hintId="prov-logo-hint"
            error={logoError}
            errorId="prov-logo-error"
          >
            <Input
              id="prov-logo"
              name="logo"
              type="file"
              ref={logoInputRef}
              accept={PROVIDER_LOGO_TYPES.join(",")}
              disabled={submitState === "loading"}
              className="min-h-11 text-base"
              aria-invalid={logoError !== null}
              aria-describedby={
                logoError
                  ? "prov-logo-hint prov-logo-error"
                  : "prov-logo-hint"
              }
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setLogo(file && validProviderLogo(file) ? file : null);
                setLogoError(
                  file && !validProviderLogo(file)
                    ? providersContent.form.logo.invalid
                    : null,
                );
              }}
            />
            {logo || logoError ? (
              <button
                type="button"
                className="min-h-11 self-start text-sm font-semibold text-brand underline underline-offset-4"
                disabled={submitState === "loading"}
                onClick={() => {
                  setLogo(null);
                  setLogoError(null);
                  if (logoInputRef.current) logoInputRef.current.value = "";
                }}
              >
                {providersContent.form.logo.remove}
              </button>
            ) : null}
          </Field>

          <Field label={providersContent.form.description.label} htmlFor="prov-description"
            hint={providersContent.form.description.hint} hintId="prov-description-hint">
            <Textarea id="prov-description" name="description" rows={3}
              className="text-base" maxLength={PROVIDER_DESCRIPTION_MAX_LENGTH}
              placeholder={providersContent.form.description.placeholder}
              value={description} onChange={(event) => setDescription(event.target.value)}
              aria-describedby="prov-description-hint prov-description-count" />
            <p id="prov-description-count" className="text-right text-xs text-ink/70">
              {providersContent.form.description.count(description.length)}
            </p>
          </Field>

          <fieldset className="border-t border-line pt-5" aria-describedby="prov-social-hint">
            <legend className="font-display text-base font-bold text-ink">{providersContent.form.social.title}</legend>
            <p id="prov-social-hint" className="mb-4 text-sm text-ink/70">{providersContent.form.social.hint}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {providersContent.form.social.networks.map(({ key, label }) => (
                <Field key={key} label={label} htmlFor={`prov-social-${key}`}
                  error={invalidSocial === key ? providersContent.form.social.invalid : undefined}
                  errorId={`prov-social-${key}-error`}>
                  <Input id={`prov-social-${key}`} name={`social_${key}`} type="url"
                    className="min-h-11 text-base" maxLength={2048} autoCapitalize="none" autoCorrect="off" spellCheck={false}
                    placeholder={providersContent.form.social.placeholder}
                    aria-invalid={invalidSocial === key}
                    aria-describedby={invalidSocial === key ? `prov-social-hint prov-social-${key}-error` : "prov-social-hint"}
                    onChange={() => { if (invalidSocial === key) setInvalidSocial(null); }} />
                </Field>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
            <Field
              label={providersContent.form.whatsapp.label}
              htmlFor="prov-phone"
              required
              hint={providersContent.form.whatsapp.hint}
              hintId="prov-phone-hint"
              error={whatsappError}
              errorId="prov-phone-error"
            >
              {/* Mismo control que /pedido: el `+54` es parte del campo, así
                  que se escribe el número nacional y nada más. Borde, fondo,
                  radio y foco son los de `Input` (form-controls). */}
              <div
                className={cn(
                  "flex overflow-clip rounded-field border bg-surface-subtle transition-colors focus-within:border-brand",
                  whatsappError ? "border-danger" : "border-line",
                )}
              >
                <span
                  id="prov-phone-prefix"
                  className="flex shrink-0 items-center border-r border-line bg-surface-muted px-3.5 text-base text-ink/70"
                >
                  <span aria-hidden="true">
                    {providersContent.form.whatsapp.prefix}
                  </span>
                  <span className="sr-only">
                    {providersContent.form.whatsapp.prefixLabel}
                  </span>
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
                  placeholder={providersContent.form.whatsapp.placeholder}
                  disabled={submitState === "loading"}
                  aria-invalid={whatsappError ? true : undefined}
                  aria-describedby={
                    whatsappError
                      ? "prov-phone-prefix prov-phone-hint prov-phone-error"
                      : "prov-phone-prefix prov-phone-hint"
                  }
                  // `text-base` (16px) y no los 15px de `Input`: con menos,
                  // iOS hace zoom al enfocar.
                  className="min-h-11 min-w-0 flex-1 rounded-none border-0 text-base placeholder:text-ink/65"
                />
              </div>
            </Field>
            <Field
              label="Email"
              htmlFor="prov-email"
              required
              error={emailError}
              errorId="prov-email-error"
            >
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
                aria-describedby={
                  emailError !== null ? "prov-email-error" : undefined
                }
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
              maxLength={PROVIDER_TEXT_MAX_LENGTH.direccion}
              ref={addressInputRef}
              onChange={() => {
                setGeo(EMPTY_GEO);
                pickedImpreciseRef.current = false;
                setAddressError(null);
              }}
              aria-invalid={addressError !== null}
              aria-describedby={
                addressError !== null ? "prov-address-error" : undefined
              }
              required
            />
            {addressError !== null ? (
              <p
                id="prov-address-error"
                role="alert"
                className="text-sm font-medium text-danger"
              >
                {addressError}
              </p>
            ) : null}
          </Field>

          <Field
            label={providersContent.form.hoursLabel}
            htmlFor="prov-hours"
          >
            <Input
              id="prov-hours"
              name="hours"
              type="text"
              placeholder={providersContent.form.hoursPlaceholder}
              maxLength={PROVIDER_TEXT_MAX_LENGTH.hours}
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

          <fieldset
            ref={brandsRef}
            tabIndex={-1}
            className="border-t border-line pt-5"
          >
            <legend className="font-display text-base font-bold text-ink">
              {providersContent.form.brands.title}
            </legend>
            <div className="flex flex-col gap-2">
              <ChoiceRow
                type="radio"
                name="works_all_brands"
                label={providersContent.form.brands.all}
                checked={worksAllBrands}
                onChange={() => setWorksAllBrands(true)}
              />
              <ChoiceRow
                type="radio"
                name="works_all_brands"
                label={providersContent.form.brands.specific}
                checked={!worksAllBrands}
                onChange={() => {
                  setWorksAllBrands(false);
                  setBrands((current) => specializedBrands.reduce((all, brand) => appendProviderBrand(all, brand, Infinity), current));
                }}
              />
            </div>

            {!worksAllBrands ? (
              <div className="mt-3 flex flex-col gap-2">
                <label htmlFor="prov-brand-picker" className="sr-only">
                  {providersContent.form.brands.picker}
                </label>
                <Select
                  id="prov-brand-picker"
                  className="min-h-11 text-base"
                  aria-invalid={submitAttempted && brands.length === 0}
                  aria-describedby={
                    submitAttempted && brands.length === 0
                      ? "prov-brands-error"
                      : undefined
                  }
                  value=""
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value && !brands.includes(value)) {
                      setBrands([...brands, value]);
                    }
                  }}
                >
                  <option value="" disabled>
                    {providersContent.form.brands.placeholder}
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
                          aria-label={providersContent.form.brands.remove(
                            brand,
                          )}
                          onClick={() => {
                            setBrands(
                              brands.filter((item) => item !== brand),
                            );
                            setSpecializedBrands(
                              specializedBrands.filter(
                                (item) => item !== brand,
                              ),
                            );
                          }}
                          className="flex size-11 items-center justify-center rounded-full bg-ink/10 text-ink/60 transition-colors hover:bg-alert-bg hover:text-alert-fg"
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
                  <p
                    id="prov-brands-error"
                    role={submitAttempted ? "alert" : undefined}
                    className={
                      submitAttempted
                        ? "text-sm text-danger"
                        : "text-sm text-ink/65"
                    }
                  >
                    {providersContent.form.brands.missing}
                  </p>
                )}
              </div>
            ) : null}
          </fieldset>

          <fieldset
            className="border-t border-line pt-5"
            aria-describedby="prov-specialties-hint"
          >
            <legend className="font-display text-base font-bold text-ink">
              {providersContent.form.brands.specialtiesTitle}
            </legend>
            <p
              id="prov-specialties-hint"
              className="mb-3 text-sm text-ink/70"
            >
              {worksAllBrands
                ? providersContent.form.brands.specialtiesHint
                : providersContent.form.brands.specialtiesSpecificHint}
            </p>
            <div className="flex flex-col gap-3">
              <label htmlFor="prov-specialty-picker" className="sr-only">{providersContent.form.brands.specialtiesPicker}</label>
              <Select id="prov-specialty-picker" className="min-h-11 text-base" value=""
                disabled={submitState === "loading" || specializedBrands.length >= PROVIDER_BRAND_MAX_COUNT}
                onChange={(event) => addSpecialty(event.target.value)}>
                <option value="" disabled>{providersContent.form.brands.placeholder}</option>
                {PROVIDER_BRANDS.filter((brand) => !specializedBrands.includes(brand)).map((brand) => <option key={brand} value={brand}>{brand}</option>)}
              </Select>
              {specializedBrands.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {specializedBrands.map((brand) => <li key={brand} className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/8 py-1 pr-1.5 pl-3 text-sm font-semibold text-ink">
                    {brand}
                    <button type="button" aria-label={providersContent.form.brands.remove(brand)}
                      className="flex size-11 items-center justify-center rounded-full bg-ink/10 text-ink/60 transition-colors hover:bg-alert-bg hover:text-alert-fg"
                      onClick={() => setSpecializedBrands((current) => current.filter((item) => item !== brand))}>
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><line x1="2" y1="2" x2="10" y2="10" /><line x1="10" y1="2" x2="2" y2="10" /></svg>
                    </button>
                  </li>)}
                </ul>
              ) : null}
              <Field label={providersContent.form.brands.otherLabel} htmlFor="prov-specialty-other">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input id="prov-specialty-other" className="min-h-11 text-base placeholder:text-ink/70" value={otherSpecialty}
                    maxLength={PROVIDER_BRAND_MAX_LENGTH} placeholder={providersContent.form.brands.otherPlaceholder}
                    disabled={submitState === "loading" || specializedBrands.length >= PROVIDER_BRAND_MAX_COUNT}
                    onChange={(event) => setOtherSpecialty(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSpecialty(otherSpecialty); } }} />
                  <Button type="button" variant="outline" className="min-h-11 shrink-0"
                    disabled={submitState === "loading" || !otherSpecialty.trim() || specializedBrands.length >= PROVIDER_BRAND_MAX_COUNT}
                    onClick={() => addSpecialty(otherSpecialty)}>{providersContent.form.brands.add}</Button>
                </div>
              </Field>
              {specializedBrands.length >= PROVIDER_BRAND_MAX_COUNT ? <p className="text-sm text-ink/70">{providersContent.form.brands.maximum}</p> : null}
            </div>
          </fieldset>

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
                  Es un problema nuestro, no tuyo, y no te frena: escribinos
                  acá abajo qué servicios ofrecés y los cargamos nosotros al
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
                  maxLength={PROVIDER_TEXT_MAX_LENGTH.service_other}
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
                  if (event.target.value !== OTHER_OPTION)
                    setOtherHowFound("");
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
                  maxLength={PROVIDER_TEXT_MAX_LENGTH.how_found_other}
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
