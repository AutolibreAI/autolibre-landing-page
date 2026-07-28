import { NextRequest, NextResponse } from "next/server";
import { sendSupportEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, subject, message } = body;

  if (!name || !subject || !message || (!email && !phone)) {
    return NextResponse.json({ error: "Campos requeridos faltantes." }, { status: 400 });
  }

  try {
    await sendSupportEmail({ name, email: email || undefined, phone: phone || undefined, subject, message });
    return NextResponse.json({ success: true });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Error al enviar el mensaje.";
    return NextResponse.json({ error: messageText }, { status: 500 });
  }
}
