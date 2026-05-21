import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    taller, whatsapp, email, direccion,
    brand_specialized, brands,
    services, service_other,
    vehicle_types, fuel_types,
    how_found, how_found_other,
  } = body;

  if (!taller || !whatsapp || !email || !direccion) {
    return NextResponse.json({ error: 'Campos requeridos faltantes.' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from('providers').insert({
    taller,
    whatsapp,
    email,
    direccion,
    brand_specialized: brand_specialized ?? 'no',
    brands: brands ?? [],
    services: services ?? [],
    service_other: service_other || null,
    vehicle_types: vehicle_types ?? [],
    fuel_types: fuel_types ?? [],
    how_found: how_found || null,
    how_found_other: how_found_other || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
