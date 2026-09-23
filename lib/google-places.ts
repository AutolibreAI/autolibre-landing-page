export type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type GooglePlaceResult = {
  formatted_address?: string;
  name?: string;
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
  address_components?: GoogleAddressComponent[];
};

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: Record<string, unknown>,
          ) => {
            addListener: (
              eventName: string,
              callback: () => void,
            ) => { remove: () => void };
            getPlace: () => GooglePlaceResult;
          };
        };
      };
    };
  }
}

/**
 * Sin key no hay Autocomplete: los campos de direccion siguen funcionando
 * como texto libre, solo que sin el picker de Google Places.
 */
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Lo que sale de elegir una sugerencia del Autocomplete: un geocode real, con
 * la misma confiabilidad que el GPS del telefono. Si el usuario escribe a
 * mano sin elegir ninguna, esto queda vacio.
 */
export type PlaceGeo = {
  latitude: number | null;
  longitude: number | null;
  locality: string | null;
  province: string | null;
};

export const EMPTY_GEO: PlaceGeo = {
  latitude: null,
  longitude: null,
  locality: null,
  province: null,
};

/** `long_name` del primer address_component cuyo `types` incluya `type`. */
export function findAddressComponent(
  components: GoogleAddressComponent[] | undefined,
  type: string,
): string | null {
  return (
    components?.find((component) => component.types.includes(type))
      ?.long_name ?? null
  );
}

/**
 * Opciones del Autocomplete de los pedidos de presupuesto (modal y `/pedido`).
 * Pedimos zona/localidad, no la calle y altura: "(regions)" agrupa barrio,
 * localidad, partido y provincia, y saca las sugerencias de direcciones
 * puntuales que el widget mostraría por default.
 */
export const QUOTE_AUTOCOMPLETE_OPTIONS = {
  componentRestrictions: { country: "ar" },
  types: ["(regions)"],
  fields: ["formatted_address", "name", "geometry", "address_components"],
} as const;

/**
 * Lo que se guarda de una sugerencia elegida: el texto que queda en el input
 * y su geocode. `null` si la sugerencia no trae ni dirección ni nombre.
 */
export function placeSelection(
  place: GooglePlaceResult,
): { value: string; geo: PlaceGeo } | null {
  const value = place.formatted_address ?? place.name;
  if (!value) return null;
  return {
    value,
    geo: {
      latitude: place.geometry?.location?.lat() ?? null,
      longitude: place.geometry?.location?.lng() ?? null,
      locality:
        findAddressComponent(place.address_components, "locality") ??
        findAddressComponent(place.address_components, "sublocality"),
      province: findAddressComponent(
        place.address_components,
        "administrative_area_level_1",
      ),
    },
  };
}

/** Mismo script que carga `QuoteFlow` con `next/script`. */
export const GOOGLE_MAPS_SCRIPT_SRC = GOOGLE_MAPS_API_KEY
  ? `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places&language=es&region=AR`
  : null;

let placesLoad: Promise<boolean> | null = null;

/**
 * Carga Google Maps (Places) bajo demanda y resuelve `true` cuando
 * `google.maps.places` ya existe. Pensado para dispararse al primer foco del
 * campo de zona, no al cargar la página: son ~200KB de JS que la mayoría de
 * las visitas (las que van directo a WhatsApp) nunca usan.
 *
 * Nunca rechaza: sin key, sin red o con el script bloqueado resuelve `false`
 * y el campo sigue funcionando como texto libre. Un fallo no queda cacheado,
 * así que el próximo foco lo reintenta.
 */
export function loadGooglePlaces(): Promise<boolean> {
  if (typeof window === "undefined" || !GOOGLE_MAPS_SCRIPT_SRC) {
    return Promise.resolve(false);
  }
  if (window.google?.maps?.places) return Promise.resolve(true);
  if (placesLoad) return placesLoad;

  const src = GOOGLE_MAPS_SCRIPT_SRC;
  placesLoad = new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener(
      "load",
      () => resolve(Boolean(window.google?.maps?.places)),
      { once: true },
    );
    script.addEventListener(
      "error",
      () => {
        placesLoad = null;
        script.remove();
        resolve(false);
      },
      { once: true },
    );
    document.head.appendChild(script);
  });
  return placesLoad;
}
