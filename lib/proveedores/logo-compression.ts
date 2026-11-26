import {
  fitProviderLogo,
  validProviderLogo,
} from "@/lib/proveedores/registration";

/**
 * Intentos en orden. WebP primero porque conserva la transparencia y es el que
 * menos pesa. Si el navegador no sabe codificar WebP, `toBlob` devuelve un PNG
 * en su lugar: por eso se valida el `type` del blob que vuelve, no el pedido.
 * JPEG queda ultimo porque pierde la transparencia (se pinta sobre blanco).
 */
const ENCODE_ATTEMPTS: ReadonlyArray<{ type: string; quality?: number }> = [
  { type: "image/webp", quality: 0.9 },
  { type: "image/webp", quality: 0.75 },
  { type: "image/png" },
  { type: "image/jpeg", quality: 0.85 },
];

/**
 * Devuelve un logo que pasa `validProviderLogo`, o `null` si el navegador no
 * pudo decodificarlo o achicarlo. Si el original ya pasa y no excede los
 * 512 px, vuelve tal cual: re-codificar un logo que ya esta bien solo le suma
 * perdida.
 *
 * Solo corre en el navegador (`createImageBitmap`, `<canvas>`).
 */
export async function compressProviderLogo(file: File): Promise<Blob | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  try {
    const { width, height } = fitProviderLogo(bitmap.width, bitmap.height);
    if (
      validProviderLogo(file) &&
      width === bitmap.width &&
      height === bitmap.height
    ) {
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.imageSmoothingQuality = "high";
    for (const attempt of ENCODE_ATTEMPTS) {
      context.clearRect(0, 0, width, height);
      if (attempt.type === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
      }
      context.drawImage(bitmap, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, attempt.type, attempt.quality),
      );
      if (blob && validProviderLogo(blob)) return blob;
    }
    return null;
  } finally {
    bitmap.close();
  }
}
