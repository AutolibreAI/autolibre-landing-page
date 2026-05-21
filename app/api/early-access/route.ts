import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, reasons, reason_other, patente, wants_scanner } = body;

  if (!name || !email || !patente) {
    return NextResponse.json({ error: 'Campos requeridos faltantes.' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: existing } = await supabase
    .from('early_access')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'duplicate' }, { status: 409 });
  }

  const { error } = await supabase.from('early_access').insert({
    name,
    email,
    reasons: reasons ?? [],
    reason_other: reason_other || null,
    patente,
    wants_scanner: wants_scanner ?? false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
