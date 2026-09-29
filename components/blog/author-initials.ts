/**
 * "Equipo AutoLibre" → "EA". Una sola palabra en CamelCase toma sus
 * mayúsculas ("AutoLibre" → "AL", el autor por defecto); si no, su inicial.
 * Sin nombre, "AL" (las siglas del sitio).
 */
export function authorInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "AL";

  if (words.length === 1) {
    const capitals = words[0]!.replace(/[^A-ZÁÉÍÓÚÑ]/g, "");
    return (capitals.length >= 2 ? capitals.slice(0, 2) : words[0]![0]!).toUpperCase();
  }

  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}
