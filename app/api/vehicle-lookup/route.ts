import { NextRequest, NextResponse } from "next/server";
import { canonicalPlate } from "@/lib/plate";
import { lookupVehicle } from "@/lib/vehicle-lookup-server";

/**
 * Lookup de patente: el botón "Buscar mi auto" del modal y la validación de
 * la patente del form de `/pedido` (los dos vía
 * `lib/vehicle-lookup-client.ts`). La consulta a clasific.ar (cache,
 * placeholders, snapshot) vive en `lib/vehicle-lookup-server.ts`.
 *
 * Con `onMiss=search`: si la patente no está en la base histórica, responde
 * `{ found: false, searching: true }` y el browser vuelve a preguntar.
 */
export async function GET(req: NextRequest) {
  const plate = canonicalPlate(req.nextUrl.searchParams.get("plate") ?? "");

  if (!plate) {
    return NextResponse.json({ found: false, error: "invalid_plate" }, { status: 400 });
  }

  return NextResponse.json(await lookupVehicle(plate, { searchOnMiss: true }));
}
