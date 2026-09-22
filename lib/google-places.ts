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
