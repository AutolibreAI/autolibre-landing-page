/**
 * Dos iniciales del nombre de un negocio, para cuando no hay logo: de las dos
 * primeras palabras, o las dos primeras letras si es una sola. La usan la
 * tarjeta del directorio y la cabecera del perfil.
 */
export function partnerMonogram(name: string): string {
  const words = name
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);
  const letters =
    words.length >= 2 ? `${words[0][0]}${words[1][0]}` : (words[0] ?? name).slice(0, 2);
  return letters.toLocaleUpperCase("es-AR");
}

/** Solo URLs http(s): un valor raro cargado en el admin no llega a un `href`/`src`. */
export function safeHttpUrl(url: string | null): string | null {
  return url && /^https?:\/\//i.test(url.trim()) ? url.trim() : null;
}
