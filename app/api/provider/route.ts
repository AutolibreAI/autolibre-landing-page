import { NextRequest, NextResponse } from 'next/server';
import { appendProviderToSheet } from '@/lib/google-sheet';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    taller,
    whatsapp,
    email,
    direccion,
    brand_specialized,
    brands,
    services,
    service_other,
    vehicle_types,
    fuel_types,
    how_found,
    how_found_other,
  } = body;

  if (!taller || !whatsapp || !email || !direccion) {
    return NextResponse.json({ error: 'Campos requeridos faltantes.' }, { status: 400 });
  }

  try {
    // vehicle_types / how_found no tienen columna propia: van a "Notas".
    await appendProviderToSheet({
      taller,
      whatsapp,
      email,
      direccion,
      services: Array.isArray(services) ? services : [],
      serviceOther: service_other || undefined,
      brandSpecialized: brand_specialized ?? null,
      brands: Array.isArray(brands) ? brands : [],
      vehicleTypes: Array.isArray(vehicle_types) ? vehicle_types : [],
      fuelTypes: Array.isArray(fuel_types) ? fuel_types : [],
      howFound: how_found || undefined,
      howFoundOther: how_found_other || undefined,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al guardar el proveedor.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
