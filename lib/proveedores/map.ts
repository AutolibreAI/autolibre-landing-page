/**
 * Mapa estático de los negocios (directorio y perfil). Módulo PURO: sin
 * imports, así lo corre `node --test`.
 *
 * En lugar de cargar la librería de Google Maps (cientos de KB de JS), se
 * pide UNA imagen de Static Maps sin marcadores, con centro y zoom calculados
 * acá, y los marcadores se dibujan en HTML encima, en la posición que les toca
 * en esa imagen (proyección Web Mercator, la misma que usa Google). Así los
 * marcadores son botones accesibles y el mapa no suma JS de terceros.
 */

export type GeoPoint = { readonly latitude: number; readonly longitude: number };

/** Posición de un punto dentro de la imagen, en % del ancho y del alto. */
export type MapPosition = { readonly x: number; readonly y: number };

export type MapView = {
  readonly center: GeoPoint;
  readonly zoom: number;
  /** Una posición por punto, en el mismo orden. */
  readonly positions: readonly MapPosition[];
};

const TILE_SIZE = 256;
/** Latitud máxima de Web Mercator: más allá la proyección se va a infinito. */
const MAX_LATITUDE = 85.05112878;

function clampLatitude(latitude: number): number {
  return Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude));
}

/** Coordenadas del "mundo" de Google (0–256) para un punto. */
function project({ latitude, longitude }: GeoPoint): { x: number; y: number } {
  const sin = Math.sin((clampLatitude(latitude) * Math.PI) / 180);
  return {
    x: TILE_SIZE * (0.5 + longitude / 360),
    y: TILE_SIZE * (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)),
  };
}

function unproject({ x, y }: { x: number; y: number }): GeoPoint {
  const n = Math.PI - (2 * Math.PI * y) / TILE_SIZE;
  return {
    latitude: (180 / Math.PI) * Math.atan(Math.sinh(n)),
    longitude: (x / TILE_SIZE - 0.5) * 360,
  };
}

/** Punto válido para el mapa: números finitos dentro del rango geográfico. */
export function isGeoPoint(value: GeoPoint | null | undefined): value is GeoPoint {
  return (
    !!value &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.latitude) <= 90 &&
    Math.abs(value.longitude) <= 180 &&
    // (0, 0) es el "sin cargar" típico de un geocoder: está en el océano.
    !(value.latitude === 0 && value.longitude === 0)
  );
}

/**
 * Centro, zoom y posiciones para que TODOS los puntos entren en una imagen de
 * `width` × `height` px (en px CSS, antes del `scale` de Static Maps), con un
 * margen `padding` (fracción de cada lado, 0–0.45) para que los marcadores no
 * queden cortados contra el borde. El zoom es el más alto que entra, con tope
 * `maxZoom` (un solo punto, o puntos muy juntos, no tienen que quedar a nivel
 * de calle). `null` sin puntos.
 */
export function fitMapView(
  points: readonly GeoPoint[],
  {
    width,
    height,
    padding = 0.12,
    insetBottom = 0,
    maxZoom = 15,
    minZoom = 3,
  }: {
    readonly width: number;
    readonly height: number;
    readonly padding?: number;
    /**
     * Fracción del alto que tapa algo dibujado encima, abajo (la tarjeta del
     * negocio elegido): los puntos se acomodan en el resto.
     */
    readonly insetBottom?: number;
    readonly maxZoom?: number;
    readonly minZoom?: number;
  },
): MapView | null {
  if (points.length === 0) return null;

  const world = points.map(project);
  const xs = world.map((point) => point.x);
  const ys = world.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const centerWorld = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };

  const usableWidth = width * (1 - 2 * padding);
  const usableHeight = height * (1 - 2 * padding - insetBottom);
  let zoom = maxZoom;
  while (zoom > minZoom) {
    const scale = 2 ** zoom;
    if ((maxX - minX) * scale <= usableWidth && (maxY - minY) * scale <= usableHeight) break;
    zoom -= 1;
  }

  const scale = 2 ** zoom;
  // Centro (en px de la imagen) de la zona libre: corrido hacia arriba si
  // hay algo tapando abajo. El centro de la IMAGEN se corre lo mismo.
  const freeCenterY = height * (padding + (1 - 2 * padding - insetBottom) / 2);
  const imageCenterWorld = {
    x: centerWorld.x,
    y: centerWorld.y + (height / 2 - freeCenterY) / scale,
  };
  const positions = world.map((point) => ({
    x: round(50 + (((point.x - imageCenterWorld.x) * scale) / width) * 100),
    y: round(50 + (((point.y - imageCenterWorld.y) * scale) / height) * 100),
  }));

  return { center: unproject(imageCenterWorld), zoom, positions };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * URL de Static Maps para una vista. Sin marcadores (van en HTML encima) y
 * sin puntos de interés ni transporte: el mapa es de referencia y los
 * marcadores de Google competirían con los nuestros. `scale=2` para pantallas
 * densas (la imagen sale al doble de `width` × `height`).
 */
export function staticMapUrl({
  center,
  zoom,
  width,
  height,
  apiKey,
}: {
  readonly center: GeoPoint;
  readonly zoom: number;
  readonly width: number;
  readonly height: number;
  readonly apiKey: string;
}): string {
  const params = [
    `center=${center.latitude.toFixed(6)},${center.longitude.toFixed(6)}`,
    `zoom=${zoom}`,
    `size=${Math.round(width)}x${Math.round(height)}`,
    "scale=2",
    "maptype=roadmap",
    "style=feature:poi%7Cvisibility:off",
    "style=feature:transit%7Cvisibility:off",
    `key=${encodeURIComponent(apiKey)}`,
  ];
  return `https://maps.googleapis.com/maps/api/staticmap?${params.join("&")}`;
}
